#!/usr/bin/env node
/* Adds what the phones sent (Settings → "Send what's new": a us-<who>-<date>.json file) to our shared lists in private/live/.
   Usage: node tools/import.mjs <file.json> [more files…]   then   node tools/build.mjs   and push.
   The same file twice changes nothing the second time, and files can come in any order. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importMaster, open, fromB64 } from '../assets/js/core.js';
import { apply } from '../assets/js/merge.js';
import { initOf } from '../assets/js/defaults.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = path.join(ROOT, 'private/live');
// every list the phones keep (assets/js/live.js KINDS) — a list missing here would be skipped on import
const KINDS = ['journal', 'music', 'draw', 'trips', 'movies', 'wishes', 'goals', 'where', 'spots', 'books', 'posts', 'tree', 'food', 'famdays', 'yearly', 'ramadan', 'firsts', 'gifts', 'capsule', 'games', 'chores', 'questions', 'secret', 'ourfirsts', 'beforeus', 'soundtrack', 'chats', 'growth', 'sayings', 'health', 'recipes', 'bucket', 'adventures', 'offline', 'giftideas', 'anniversaries', 'hosting', 'favorites', 'drawings', 'tickets'];
const files = process.argv.slice(2);
if (!files.length) { console.error('Give the file(s) the phones sent: node tools/import.mjs us-esraa-….json'); process.exit(1); }

const key = await importMaster(fromB64((await readFile(path.join(ROOT, 'private/.master-key'), 'utf8')).trim()));
await mkdir(path.join(LIVE, 's'), { recursive: true });

for (const file of files) {
	let body;
	try {
		const outer = JSON.parse(await readFile(file, 'utf8'));
		if (outer.app !== 'us') throw new Error('not a file from our site');
		body = JSON.parse(new TextDecoder().decode(await open(key, fromB64(outer.data))));
	} catch (e) { console.error(`✗ ${file}: ${e.message}`); process.exitCode = 1; continue; }
	const done = [];
	for (const [kind, patch] of Object.entries(body.changes || {})) {
		if (!KINDS.includes(kind)) continue;
		const f = path.join(LIVE, kind + '.json');
		const before = existsSync(f) ? JSON.parse(await readFile(f, 'utf8')) : initOf(kind);
		const after = apply(before, patch);
		if (JSON.stringify(after) !== JSON.stringify(before)) { await writeFile(f, JSON.stringify(after, null, '\t') + '\n'); done.push(kind); }
	}
	let sketches = 0;
	for (const [id, s] of Object.entries(body.sketches || {})) {
		if (!/^[\w-]+$/.test(id)) continue;
		const out = path.join(LIVE, 's', id + '.webp');
		if (!existsSync(out)) { await writeFile(out, Buffer.from(fromB64(s.b64))); sketches++; }
	}
	console.log(`✓ ${path.basename(file)} (${body.by === 'her' ? 'Esraa' : body.by === 'him' ? 'Sameh' : '?'}, ${body.at}): ${done.length ? 'updated ' + done.join(', ') : 'nothing new in the lists'}${sketches ? `, ${sketches} new sketch(es)` : ''}`);
}
console.log('Now run: node tools/build.mjs   and push.');
