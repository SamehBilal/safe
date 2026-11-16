/* Our songs live in their own small site, github.com/SamehBilal/safe-songs, served at
   https://samehbilal.github.io/safe-songs/ — the same address as ours, so phones fetch them like any photo, and the
   service worker keeps them for offline. That keeps this site well under GitHub Pages' 1 GB, whatever we add.

   Every recording goes up as AAC at 128 kb/s (sounds like a 192k mp3, about half the size), sealed with the same key as
   everything else, so the songs repo can be public and still hold nothing anyone else can play. The AAC copies are
   cached in private/.cache/aac/ by the original's hash; the originals in private/media are never touched.

   The repo is checked out next to this one (../safe-songs, or SONGS_DIR). Without it, songs go into content/m as before.
   After a build: commit and push there too (tools/build.mjs prints the two commands). */

import { execFile } from 'node:child_process';
import { readFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { findFfmpeg } from './avif.mjs';

const run = promisify(execFile);
export const SONGS_URL = 'https://samehbilal.github.io/safe-songs/';
export const AUDIO = /\.(mp3|m4a|ogg)$/i;
const RATE = '128k';

/** Where sealed songs go (…/safe-songs/m), or null when the songs repo isn't checked out. */
export function songsOut(root) {
	const dir = process.env.SONGS_DIR || path.resolve(root, '..', 'safe-songs');
	return existsSync(path.join(dir, '.git')) ? path.join(dir, 'm') : null;
}

let ffmpeg;
/** The bytes to publish for a recording: its AAC copy (made once, then cached), or the file as it is. */
export async function songBytes(file, cacheDir) {
	const src = await readFile(file);
	const hash = createHash('sha256').update(src).digest('hex').slice(0, 24);
	const copy = path.join(cacheDir, `${hash}-${RATE}.m4a`);
	// a recording that was small already (a 64 or 128k mp3) stays as it is: AAC wouldn't make it smaller
	const pick = (aac) => (aac.length < src.length * 0.9 ? { bytes: aac, ext: '.m4a' } : { bytes: src, ext: path.extname(file).toLowerCase() });
	if (existsSync(copy) && (await stat(copy)).size > 0) return pick(await readFile(copy));
	if (ffmpeg === undefined) ffmpeg = await findFfmpeg();
	if (!ffmpeg) return { bytes: src, ext: path.extname(file).toLowerCase() };
	await mkdir(cacheDir, { recursive: true });
	const tmp = copy + '.part';
	try {
		await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-map', '0:a:0', '-vn', '-c:a', 'aac', '-b:a', RATE, '-movflags', '+faststart', '-f', 'mp4', tmp], { maxBuffer: 4 << 20 });
		if (!(await stat(tmp)).size) throw new Error('empty output');
		await rename(tmp, copy);
		const out = await readFile(copy);
		console.log(`• ${path.basename(file)}: ${(src.length / 1048576).toFixed(1)} MB → ${(out.length / 1048576).toFixed(1)} MB (AAC ${RATE})`);
		return pick(out);
	} catch (e) {
		await rm(tmp, { force: true });
		console.warn(`! Kept ${path.basename(file)} as it is (${String(e.message).split('\n')[0]})`);
		return { bytes: src, ext: path.extname(file).toLowerCase() };
	}
}
