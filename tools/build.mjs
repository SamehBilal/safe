#!/usr/bin/env node
/* Encrypts private/ into content/ so the site can be published publicly.

   private/questions.json  the gate questions + every accepted answer   (never committed)
   private/story.json      everything shown on the site                 (never committed)
   private/media/*         photos and videos the story refers to         (never committed)
   private/media/<folders> images/, videos/, songs/, gifts/ — read by tools/library.mjs (see private/media/README.md)
   private/live/*.json     the shared lists (journal, songs, draws, trips, films, wishes); phones' files are merged in by tools/import.mjs
   private/live/s/*        sketches and photos those lists show (a list can also name a file in private/media, like a song's "audio")
   private/.master-key     created on first run; keep it — losing it makes her re-answer

   Output (safe to commit):
   content/gate.json       the questions and hints only
   content/vault.json      the encrypted story + the master key wrapped per answer combo
   content/m/<id>.bin      each photo/video, encrypted
   content/live/*.bin      each shared list, encrypted (content/live/s/<id>.bin each sketch)
   sw.js                   VERSION bumped so phones pick up the new content

   Run:  node tools/build.mjs */

import { readFile, writeFile, mkdir, readdir, stat, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { library, intoStory, intoMusic } from './library.mjs';
import { shrinkBig } from './shrink.mjs';
import { toAvif } from './avif.mjs';
import { SONGS_URL, AUDIO, songsOut, songBytes } from './songs.mjs';
import { sealSecret } from './secret.mjs';
import { ITERATIONS, deriveKek, importMaster, seal, open, randomBytes, toB64, fromB64 } from '../assets/js/core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'private');
const OUT = path.join(ROOT, 'content');
const MEDIA_OUT = path.join(OUT, 'm');
const SONGS_OUT = songsOut(ROOT); // ../safe-songs/m when that repo is checked out (tools/songs.mjs)
const MAX_COMBOS = 512;

const MIME = {
	'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
	'.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm',
	'.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg'
};

const fail = (msg) => { console.error('\n✗ ' + msg + '\n'); process.exit(1); };

async function readJson(file) {
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch (e) {
		fail(`Could not read ${path.relative(ROOT, file)}: ${e.message}`);
	}
}

async function masterKey() {
	const file = path.join(PRIV, '.master-key');
	if (existsSync(file)) return fromB64((await readFile(file, 'utf8')).trim());
	const raw = randomBytes(32);
	await writeFile(file, toB64(raw) + '\n');
	console.log('• Created private/.master-key (back it up with the rest of private/)');
	return raw;
}

function combos(lists) {
	return lists.reduce((acc, list) => acc.flatMap((prefix) => list.map((a) => [...prefix, a])), [[]]);
}

async function main() {
	if (!existsSync(PRIV)) fail('No private/ folder. Copy tools/example/ to private/ and fill it in.');

	const questions = await readJson(path.join(PRIV, 'questions.json'));
	const story = await readJson(path.join(PRIV, 'story.json'));
	const qs = questions.questions || [];
	if (!qs.length) fail('questions.json has no questions.');
	qs.forEach((q, i) => {
		if (!q.q || !Array.isArray(q.answers) || !q.answers.length) fail(`Question ${i + 1} needs "q" and a non-empty "answers" list.`);
	});

	const all = combos(qs.map((q) => q.answers));
	if (all.length > MAX_COMBOS) fail(`${all.length} answer combinations — keep it under ${MAX_COMBOS} (fewer alternatives per question).`);

	const raw = await masterKey();
	const key = await importMaster(raw);
	await mkdir(MEDIA_OUT, { recursive: true });
	if (SONGS_OUT) await mkdir(SONGS_OUT, { recursive: true });

	// 1) Media: every string in story.json that names a file in private/media becomes "media:<id>.<ext>".
	const mediaDir = path.join(PRIV, 'media');
	// every file under private/media, by its path from there ("wedding.jpg", "images/wedding/1.jpg")
	const files = existsSync(mediaDir) ? (await readdir(mediaDir, { recursive: true, withFileTypes: true }))
		.filter((e) => e.isFile()).map((e) => path.relative(mediaDir, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/')) : [];
	const byName = new Map(files.map((f) => [f.toLowerCase(), f]));
	// big camera photos go up as smaller copies (tools/shrink.mjs); the originals stay as they are
	const smaller = await shrinkBig(mediaDir, files, path.join(PRIV, '.cache', 'shrunk'));
	// and photos go up as AVIF, a fifth of the size (tools/avif.mjs); where that can't be done, as above
	const avifs = process.env.NO_AVIF ? new Map() : await toAvif(mediaDir, files, path.join(PRIV, '.cache', 'avif'));
	// what the folders hold goes into the story before it's sealed
	const lib = await library(mediaDir);
	intoStory(story, lib);
	if (lib.count) console.log(`• ${lib.count} file(s) from the media folders`);
	const used = new Map();
	const missing = new Set();

	async function encodeMedia(name) {
		const real = byName.get(name.toLowerCase());
		if (!real) { missing.add(name); return name; }
		if (used.has(real)) return used.get(real);
		// a recording goes to the songs site (tools/songs.mjs), as AAC
		if (SONGS_OUT && AUDIO.test(real)) {
			const { bytes, ext } = await songBytes(path.join(mediaDir, real), path.join(PRIV, '.cache', 'aac'));
			const id = createHmac('sha256', Buffer.from(raw)).update(bytes).digest('hex').slice(0, 20);
			const out = path.join(SONGS_OUT, id + '.bin');
			if (!existsSync(out) || statSync(out).size === 0) await writeFile(out, await seal(key, bytes));
			const ref = `song:${id}${ext}`;
			used.set(real, ref);
			return ref;
		}
		const copy = avifs.get(real) || smaller.get(real);
		const ext = avifs.has(real) ? '.avif' : copy ? '.jpg' : path.extname(real).toLowerCase();
		const bytes = await readFile(copy || path.join(mediaDir, real));
		const id = createHmac('sha256', Buffer.from(raw)).update(bytes).digest('hex').slice(0, 20);
		const out = path.join(MEDIA_OUT, id + '.bin');
		// an empty file is left over from a build that stopped partway (a full disk): write it again
		if (!existsSync(out) || statSync(out).size === 0) await writeFile(out, await seal(key, bytes));
		const ref = `media:${id}${ext}`;
		used.set(real, ref);
		return ref;
	}

	async function walk(node) {
		if (Array.isArray(node)) return Promise.all(node.map(walk));
		if (node && typeof node === 'object') {
			const out = {};
			for (const [k, v] of Object.entries(node)) out[k] = await walk(v);
			return out;
		}
		if (typeof node === 'string' && MIME[path.extname(node).toLowerCase()] && !/^(https?|media|song|data):|^\/|:\/\//.test(node)) return encodeMedia(node);
		return node;
	}

	const sealedStory = await walk(story);
	// The shared lists and their sketches (a list can name a file in private/media too, like a song's own recording).
	const live = await sealLive(key, walk, lib);
	const secretPhotos = await sealSecret(key);
	sealedStory.$media = [...used.values()];

	if (SONGS_OUT) sealedStory.$songs = SONGS_URL;

	// Remove encrypted files no longer referenced (here, and in the songs site).
	const binOf = (r) => r.replace(/^\w+:/, '').replace(/\.[^.]+$/, '') + '.bin';
	const refs = [...used.values()];
	const keep = new Set(refs.filter((r) => r.startsWith('media:')).map(binOf));
	const keepSongs = new Set(refs.filter((r) => r.startsWith('song:')).map(binOf));
	for (const f of await readdir(MEDIA_OUT)) if (!keep.has(f)) await rm(path.join(MEDIA_OUT, f));
	if (SONGS_OUT) for (const f of await readdir(SONGS_OUT)) if (f.endsWith('.bin') && !keepSongs.has(f)) await rm(path.join(SONGS_OUT, f));
	const sizeOf = (dir, set) => Promise.all([...set].map((f) => stat(path.join(dir, f)).then((s) => s.size))).then((a) => a.reduce((x, y) => x + y, 0));
	const size = await sizeOf(MEDIA_OUT, keep);
	const songsSize = SONGS_OUT ? await sizeOf(SONGS_OUT, keepSongs) : 0;
	sealedStory.$mediaMB = Math.max(1, Math.round((size + songsSize) / 1048576)); // for «Save for offline»
	if (SONGS_OUT) console.log(`✓ ${keepSongs.size} song(s) for the songs site (${(songsSize / 1048576).toFixed(1)} MB) — then: cd ${path.dirname(SONGS_OUT)} && git add -A && git commit -m "Songs" && git push`);

	// 2) Story.
	const data = await seal(key, new TextEncoder().encode(JSON.stringify(sealedStory)));

	// 3) Wrap the master key for every accepted combination of answers.
	const salt = randomBytes(16);
	process.stdout.write(`• Wrapping key for ${all.length} answer combination(s)`);
	const keys = [];
	for (const answers of all) {
		const kek = await deriveKek(answers, salt, ITERATIONS);
		keys.push(toB64(await seal(kek, raw)));
		process.stdout.write('.');
	}
	process.stdout.write('\n');
	// Shuffle so order doesn't hint which combo is which.
	keys.sort(() => Math.random() - 0.5);

	const vault = { v: 1, iter: ITERATIONS, salt: toB64(salt), keys, data: toB64(data) };
	const gate = {
		title: questions.title || '',
		intro: questions.intro || '',
		wrong: questions.wrong || '',
		questions: qs.map(({ q, hint, placeholder, type }) => ({ q, hint, placeholder, type }))
	};
	await writeFile(path.join(OUT, 'vault.json'), JSON.stringify(vault));
	await writeFile(path.join(OUT, 'gate.json'), JSON.stringify(gate, null, '\t') + '\n');


	// 5) Service worker: list every page and script to precache, and bump its version.
	const swFile = path.join(ROOT, 'sw.js');
	const sw = await readFile(swFile, 'utf8');
	const pages = (await readdir(ROOT)).filter((f) => f.endsWith('.html')).sort();
	const code = [];
	for (const dir of ['assets/css', 'assets/js', 'assets/js/pages', 'assets/icons', 'assets/audio']) {
		for (const f of (await readdir(path.join(ROOT, dir))).sort()) if (/\.(css|js|svg|png|mp3)$/.test(f)) code.push(`${dir}/${f}`);
	}
	const shell = ['./', ...pages, 'manifest.webmanifest', ...code, 'content/gate.json', 'content/vault.json'];
	const hash = createHash('sha256');
	for (const f of shell.slice(1)) if (existsSync(path.join(ROOT, f))) hash.update(await readFile(path.join(ROOT, f)));
	await writeFile(swFile, sw
		.replace(/var VERSION = '[^']*';/, `var VERSION = 'us-${hash.digest('hex').slice(0, 10)}';`)
		.replace(/var SHELL = \[[\s\S]*?\];/, `var SHELL = [\n${shell.map((f) => `\t'${f}'`).join(',\n')}\n];`));

	console.log(`✓ ${qs.length} question(s), ${used.size} media file(s) (${(size / 1048576).toFixed(1)} MB), vault ${(JSON.stringify(vault).length / 1024).toFixed(0)} KB`);
	console.log(`✓ shared lists: ${live.lists} list(s), ${live.sketches} sketch(es)${live.changed ? `, ${live.changed} updated` : ''}`);
	if (secretPhotos) console.log(`✓ the PIN page: sealed, ${secretPhotos} photo(s)`);
	if (missing.size) console.warn('! Not found in private/media (left as-is): ' + [...missing].join(', '));
	const unused = files.filter((f) => !used.has(f) && !/(^|\/)\./.test(f) && !/(^|\/)(info\.json|readme\.md|desktop\.ini|thumbs\.db)$/i.test(f));
	if (unused.length) console.log('  (not used by story.json: ' + unused.join(', ') + ')');
}

/* private/live → content/live. A file is only rewritten when what's in it changed, so git sees real changes only.
   The first time, lists that were saved in content/live before (by the phones, through GitHub) are copied out to private/live. */
async function sealLive(key, walk, lib) {
	const src = path.join(PRIV, 'live'), out = path.join(OUT, 'live');
	await mkdir(path.join(src, 's'), { recursive: true });
	await mkdir(path.join(out, 's'), { recursive: true });
	const unseal = async (file) => Buffer.from(await open(key, fromB64((await readFile(file, 'utf8')).trim())));
	let changed = 0;
	const put = async (file, bytes) => {
		if (existsSync(file)) { try { if ((await unseal(file)).equals(bytes)) return; } catch { /* rewrite */ } }
		await writeFile(file, toB64(await seal(key, bytes)));
		changed++;
	};
	// copy out what only exists encrypted
	const BIN = /\.bin$/, EXT = /\.[^.]+$/;
	for (const f of (await readdir(out)).filter((f) => BIN.test(f))) {
		const json = path.join(src, f.replace(BIN, '.json'));
		if (!existsSync(json)) {
			await writeFile(json, JSON.stringify(JSON.parse((await unseal(path.join(out, f))).toString('utf8')), null, '\t') + '\n');
			console.log('• Copied content/live/' + f + ' out to private/live/');
		}
	}
	for (const f of await readdir(path.join(out, 's'))) {
		const id = f.replace(BIN, '');
		if (!(await readdir(path.join(src, 's'))).some((x) => x.replace(EXT, '') === id)) await writeFile(path.join(src, 's', id + '.webp'), await unseal(path.join(out, 's', f)));
	}
	const lists = (await readdir(src)).filter((f) => f.endsWith('.json'));
	for (const f of lists) {
		let data;
		try { data = JSON.parse(await readFile(path.join(src, f), 'utf8')); } catch (e) { fail(`private/live/${f} isn't valid JSON: ${e.message}`); }
		if (f === 'music.json' && lib?.songs.length) data = intoMusic(data, lib); // the songs/ folder joins the shelf
		await put(path.join(out, f.replace(/\.json$/, '.bin')), Buffer.from(JSON.stringify(await walk(data))));
	}
	const sketches = await readdir(path.join(src, 's'));
	for (const f of sketches) await put(path.join(out, 's', f.replace(EXT, '') + '.bin'), await readFile(path.join(src, 's', f)));
	return { lists: lists.length, sketches: sketches.length, changed };
}

main().catch((e) => fail(e.stack || e.message));
