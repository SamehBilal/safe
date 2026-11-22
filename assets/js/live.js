/* The part of the site you both write from your phones: the journal, the songs, the draw lists, trips, films, wishes and sketches.

   No accounts and no tokens:
   - What everyone sees comes from plain JSON files on Sameh's PC (private/live/<kind>.json, sketches in private/live/s/),
     which tools/build.mjs encrypts into content/live/<kind>.bin and content/live/s/<id>.bin, like the rest of the story.
   - What you add on a phone stays on that phone (only the changes, merged over the published copy by id: assets/js/merge.js),
     so it shows straight away and works offline.
   - Settings → "Send what's new" puts this phone's changes and sketches in one encrypted .json file. Open it on the other
     phone (Settings → "Add a file") to see each other's, or on the PC run `node tools/import.mjs <file>` and publish.
     Once the published site has a change, the phone drops its own copy of it by itself. */
import { seal, open, toB64, fromB64 } from './core.js';
import { App, getKey, store, Y } from './shell.js';
import { diff, apply, combine } from './merge.js';
import { initOf } from './defaults.js';

export const KINDS = ['journal', 'music', 'draw', 'trips', 'movies', 'wishes', 'goals', 'where', 'spots', 'books', 'posts', 'tree', 'food', 'famdays', 'yearly', 'ramadan', 'firsts', 'gifts', 'capsule', 'games', 'chores', 'questions', 'secret', 'ourfirsts', 'beforeus', 'soundtrack', 'chats', 'growth', 'sayings', 'health', 'recipes', 'bucket', 'adventures', 'offline', 'giftideas', 'anniversaries', 'hosting', 'favorites', 'drawings', 'tickets', 'remember', 'nokta', 'shopping', 'routine', 'fixes'];
const ME = 'us.me';
store.del('us.gh'); // the GitHub token phones used to keep is no longer needed
const enc = new TextEncoder();
const dec = new TextDecoder();

export const me = () => (store.get(ME) === 'her' ? 'her' : store.get(ME) === 'him' ? 'him' : '');
export const setMe = (v) => store.set(ME, v);
/** A phone can add things once it knows whose phone it is. */
export const canWrite = () => !!me();

export class SyncError extends Error {
	constructor(code, msg) { super(msg); this.code = code; }
}

/* ---- encoding: bytes <-> encrypted base64 text ---- */
const lock = async (bytes) => toB64(await seal(getKey(), bytes));
const unlock = async (text) => open(getKey(), fromB64(text.trim()));
const toJSON = async (text) => JSON.parse(dec.decode(await unlock(text)));

/* ---- this phone's own changes, per list ---- */
const patchKey = (k) => 'us.local.' + k;
const cacheKey = (k) => 'us.live.' + k;
function getPatch(kind) { try { return JSON.parse(store.get(patchKey(kind)) || 'null') || undefined; } catch { return undefined; } }
function setPatch(kind, p) {
	if (p === undefined) store.del(patchKey(kind));
	else {
		store.set(patchKey(kind), JSON.stringify(p));
		if (store.get(patchKey(kind)) === null) throw new SyncError('full', 'storage full');
	}
}

/* ---- the published copy ---- */
const base = new Map();
const mem = new Map();
async function published(kind) {
	let text = null;
	try {
		// always checked, but an unchanged list comes back as a short «not modified» instead of the whole file
		const r = await fetch(`content/live/${kind}.bin`, { cache: 'no-cache' });
		text = r.ok ? await r.text() : r.status === 404 ? '' : null;
	} catch { text = null; }
	if (text === null) text = store.get(cacheKey(kind)); // offline: the last copy we saw
	else store.set(cacheKey(kind), text);
	try { return text ? await toJSON(text) : initOf(kind); } catch { return initOf(kind); }
}

/** The list as this phone sees it: the published copy with this phone's changes on top. */
export async function load(kind) {
	const b = await published(kind);
	base.set(kind, b);
	// changes the published copy already has are dropped
	const p = diff(b, apply(b, getPatch(kind)));
	setPatch(kind, p);
	const data = apply(b, p);
	mem.set(kind, data);
	return data;
}

export const peek = (kind) => mem.get(kind);

/** Change a list: `mutate(data)` is applied to what this phone sees, and kept on this phone. */
export async function save(kind, mutate) {
	if (!canWrite()) throw new SyncError('setup', 'not set up');
	if (!base.has(kind)) await load(kind);
	const b = base.get(kind);
	const data = apply(b, getPatch(kind));
	mutate(data);
	setPatch(kind, diff(b, data));
	mem.set(kind, data);
	return data;
}

/* ---- sketches and photos: kept on the phone in IndexedDB until they're published ---- */
function idb(mode, fn) {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('us-sketches', 1);
		req.onupgradeneeded = () => req.result.createObjectStore('s');
		req.onerror = () => reject(req.error);
		req.onsuccess = () => {
			const tx = req.result.transaction('s', mode);
			const out = fn(tx.objectStore('s'));
			tx.oncomplete = () => resolve(out.result);
			tx.onerror = () => reject(tx.error);
		};
	});
}
const localSketch = (id) => idb('readonly', (s) => s.get(id)).catch(() => undefined);
const localSketchIds = () => idb('readonly', (s) => s.getAllKeys()).catch(() => []);
const keepSketch = (id, blob) => idb('readwrite', (s) => s.put(blob, id));
const dropSketch = (id) => idb('readwrite', (s) => s.delete(id)).catch(() => {});

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function putSketch(blob) {
	if (!canWrite()) throw new SyncError('setup', 'not set up');
	const id = newId() + Math.random().toString(36).slice(2, 4);
	try { await keepSketch(id, blob); } catch { throw new SyncError('full', 'storage full'); }
	urls.set(id, Promise.resolve(URL.createObjectURL(blob)));
	return id;
}

const urls = new Map();
export function sketchURL(id) {
	if (!urls.has(id)) {
		urls.set(id, (async () => {
			const mine = await localSketch(id);
			if (mine) return URL.createObjectURL(mine);
			const r = await fetch(`content/live/s/${id}.bin`);
			if (!r.ok) throw new Error('missing');
			return URL.createObjectURL(new Blob([await unlock(await r.text())], { type: 'image/webp' }));
		})());
		urls.get(id).catch(() => urls.delete(id)); // not remembered: the next page tries again
	}
	return urls.get(id);
}

/** Fill <img data-sketch="id"> in a block. */
export function hydrateSketches(root) {
	for (const el of root.querySelectorAll('img[data-sketch]:not([src])')) {
		sketchURL(el.dataset.sketch).then((u) => { el.src = u; }).catch(() => el.remove());
	}
}

/* ---- sending and receiving files ---- */

/** What this phone has that the published site doesn't yet: { lists: {kind: count}, sketches: n, total }. */
export async function pending() {
	const lists = {};
	for (const k of KINDS) {
		await load(k).catch(() => {});
		const p = getPatch(k);
		if (p) lists[k] = count(p);
	}
	// sketches that made it into the published site aren't needed on the phone any more
	const ids = await localSketchIds();
	let sketches = 0;
	for (const id of ids) {
		const r = await fetch(`content/live/s/${id}.bin`, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
		if (r?.ok) await dropSketch(id); else sketches++;
	}
	return { lists, sketches, total: Object.values(lists).reduce((a, b) => a + b, 0) + sketches };
}
/* how many entries a patch adds, changes or removes */
function count(p) {
	if (!p || typeof p !== 'object') return 0;
	if ('$v' in p || p.$del) return 1;
	if (p.$arr) return (p.del || []).length + Object.values(p.set || {}).reduce((a, q) => a + Math.max(1, '$v' in q ? 1 : count(q)), 0);
	if (p.$obj) return Object.values(p.k || {}).reduce((a, q) => a + count(q), 0);
	return 0;
}

const b64 = async (blob) => toB64(new Uint8Array(await blob.arrayBuffer()));

/** This phone's changes and sketches, as one encrypted file. */
export async function exportFile() {
	const changes = {};
	for (const k of KINDS) { const p = getPatch(k); if (p) changes[k] = p; }
	const sketches = {};
	for (const id of await localSketchIds()) { const blob = await localSketch(id); if (blob) sketches[id] = { type: blob.type || 'image/webp', b64: await b64(blob) }; }
	const body = { v: 1, by: me(), at: new Date().toISOString(), changes, sketches };
	const text = JSON.stringify({ app: 'us', v: 1, data: await lock(enc.encode(JSON.stringify(body))) });
	const who = me() === 'her' ? 'esraa' : me() === 'him' ? 'sameh' : 'us';
	const d = new Date();
	const name = `us-${who}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
	return new File([text], name, { type: 'application/json' });
}

/** Add a file from the other phone: its changes go on top of this phone's. Returns how many entries it brought. */
export async function importFile(file) {
	let body;
	try {
		const outer = JSON.parse(await file.text());
		if (outer.app !== 'us' || !outer.data) throw new Error('not ours');
		body = JSON.parse(dec.decode(await unlock(outer.data)));
	} catch { throw new SyncError('file', 'not our file'); }
	let n = 0;
	for (const [k, p] of Object.entries(body.changes || {})) {
		if (!KINDS.includes(k)) continue;
		if (!base.has(k)) await load(k);
		const b = base.get(k);
		setPatch(k, combine(b, getPatch(k), p));
		mem.set(k, apply(b, getPatch(k)));
		n += count(p);
	}
	for (const [id, s] of Object.entries(body.sketches || {})) {
		if (!/^[\w-]+$/.test(id) || (await localSketch(id))) continue;
		await keepSketch(id, new Blob([fromB64(s.b64)], { type: s.type || 'image/webp' }));
		urls.delete(id);
	}
	return n;
}

export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** A friendly message for a failed save. */
export function why(err) {
	const L = App.L;
	switch (err?.code) {
		case 'setup': return Y('اختار مين ماسك الموبايل ده من صفحة الإعدادات الأول', 'اختاري مين ماسك الموبايل ده من صفحة الإعدادات الأول', 'Choose whose phone this is on the settings page first');
		case 'full': return Y('مساحة الموبايل للموقع خلصت — ابعت اللي جديد للكمبيوتر وانشره', 'مساحة الموبايل للموقع خلصت — ابعتي اللي جديد للكمبيوتر وانشريه', 'This phone’s space for the site is full — send what’s new to the PC and publish it');
		case 'file': return L('ده مش ملف من موقعنا (أو اتعمل بمفتاح تاني)', 'That isn’t a file from our site (or it was made with another key)');
		default: return L('حصلت مشكلة في الحفظ', 'Something went wrong while saving') + (err?.message ? ` (${err.message})` : '');
	}
}
