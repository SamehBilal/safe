/* The PIN-locked page (secret.html): private/secret → content/secret.bin + content/secret/s/<id>.bin.

   private/secret/secret.json   what the page shows (the positions, the outfits and games that used to be on the draw)
   private/secret/s/*           the photos it names by id
   private/.secret-pin          the PIN (digits); change it with:  node tools/secret.mjs 1234   then build
   private/.secret-key          a random key, made on the first build; keep it

   Two locks: the photos and the list are sealed with the secret key, the secret key is wrapped with the PIN, and all of
   that is sealed again with the site's master key — so it needs her answers first, then the PIN. */

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveKek, importMaster, seal, open, randomBytes, toB64, fromB64 } from '../assets/js/core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'private');
const SRC = path.join(PRIV, 'secret');
const OUT = path.join(ROOT, 'content');
export const PIN_ITERATIONS = 300000;

async function pin() {
	const file = path.join(PRIV, '.secret-pin');
	if (!existsSync(file)) {
		await writeFile(file, '1407\n');
		console.log('• Created private/.secret-pin (1407) — change it with: node tools/secret.mjs <new pin>');
	}
	return (await readFile(file, 'utf8')).trim();
}

async function secretKey() {
	const file = path.join(PRIV, '.secret-key');
	if (existsSync(file)) return fromB64((await readFile(file, 'utf8')).trim());
	const raw = randomBytes(32);
	await writeFile(file, toB64(raw) + '\n');
	return raw;
}

/** Seal private/secret with the PIN, inside the master key. Returns how many photos, or 0 when there's nothing to seal. */
export async function sealSecret(masterKey) {
	if (!existsSync(path.join(SRC, 'secret.json'))) return 0;
	const json = Buffer.from(JSON.stringify(JSON.parse(await readFile(path.join(SRC, 'secret.json'), 'utf8'))));
	const code = await pin();
	const raw = await secretKey();
	const key = await importMaster(raw);
	const envFile = path.join(OUT, 'secret.bin');

	// unchanged list and PIN → leave the file alone (git only sees real changes)
	let same = false;
	if (existsSync(envFile)) {
		try {
			const env = JSON.parse(Buffer.from(await open(masterKey, fromB64((await readFile(envFile, 'utf8')).trim()))).toString('utf8'));
			const kek = await deriveKek([code], fromB64(env.salt), env.iter);
			const inner = Buffer.from(await open(kek, fromB64(env.wrapped)));
			same = inner.equals(Buffer.from(raw)) && Buffer.from(await open(key, fromB64(env.data))).equals(json);
		} catch { /* PIN or list changed */ }
	}
	if (!same) {
		const salt = randomBytes(16);
		const kek = await deriveKek([code], salt, PIN_ITERATIONS);
		const env = { v: 1, iter: PIN_ITERATIONS, salt: toB64(salt), wrapped: toB64(await seal(kek, raw)), data: toB64(await seal(key, json)) };
		await writeFile(envFile, toB64(await seal(masterKey, Buffer.from(JSON.stringify(env)))));
	}

	// the photos, sealed with the secret key only (no PIN, no secret key → unreadable)
	const sOut = path.join(OUT, 'secret', 's');
	await mkdir(sOut, { recursive: true });
	const src = existsSync(path.join(SRC, 's')) ? await readdir(path.join(SRC, 's')) : [];
	const keep = new Set();
	for (const f of src) {
		const id = f.replace(/\.[^.]+$/, '');
		const out = path.join(sOut, id + '.bin');
		keep.add(id + '.bin');
		const bytes = await readFile(path.join(SRC, 's', f));
		if (existsSync(out)) { try { if (Buffer.from(await open(key, fromB64((await readFile(out, 'utf8')).trim()))).equals(bytes)) continue; } catch { /* rewrite */ } }
		await writeFile(out, toB64(await seal(key, bytes)));
	}
	for (const f of await readdir(sOut)) if (!keep.has(f)) await rm(path.join(sOut, f));
	return src.length;
}

// node tools/secret.mjs <new pin>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const next = (process.argv[2] || '').trim();
	if (!/^\d{4,8}$/.test(next)) { console.error('Usage: node tools/secret.mjs <4–8 digit PIN>'); process.exit(1); }
	await writeFile(path.join(PRIV, '.secret-pin'), next + '\n');
	console.log('✓ PIN changed — run node tools/build.mjs and push');
}
