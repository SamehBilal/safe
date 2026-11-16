/* Photos go up as AVIF: at most 1600px on the long side, AV1 at CRF 30 — about a fifth of the JPEG's size and,
   side by side at full size, no difference you can see. Every iPhone on iOS 16+ and any recent Android shows them.
   The copies live in private/.cache/avif/ (named by the original's hash, so each photo is converted once); the
   originals in private/media are never touched. JPEGs only: PNG and WebP keep their transparency as they are, and a
   song's cover stays JPEG because the phone's lock screen shows it too. Needs ffmpeg with libaom-av1 — on PATH, in
   FFMPEG, or the copy PixiEditor brings; without it the photos go up as before. */

import { execFile } from 'node:child_process';
import { readFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);
const SIDE = 1600, CRF = 30;
const WANT = (f) => /\.jpe?g$/i.test(f) && !/(^|\/)[^/]*-cover\.jpe?g$/i.test(f);
const CANDIDATES = [process.env.FFMPEG, 'ffmpeg', 'C:/Program Files/PixiEditor/ThirdParty/Windows/ffmpeg/ffmpeg.exe', 'C:/ffmpeg/bin/ffmpeg.exe'].filter(Boolean);

async function findFfmpeg() {
	for (const exe of CANDIDATES) {
		try {
			const { stdout } = await run(exe, ['-hide_banner', '-encoders'], { maxBuffer: 4 << 20 });
			if (/libaom-av1/.test(stdout)) return exe;
		} catch { /* not this one */ }
	}
	return null;
}

/** files: paths relative to mediaDir. Returns Map(relative path → path of its AVIF copy). */
export async function toAvif(mediaDir, files, cacheDir) {
	const out = new Map();
	const want = files.filter(WANT);
	if (!want.length) return out;
	await mkdir(cacheDir, { recursive: true });
	const todo = [];
	for (const f of want) {
		const hash = createHash('sha256').update(await readFile(path.join(mediaDir, f))).digest('hex').slice(0, 24);
		const copy = path.join(cacheDir, `${hash}-${SIDE}-q${CRF}.avif`);
		if (existsSync(copy) && (await stat(copy)).size > 0) out.set(f, copy);
		else todo.push({ f, copy });
	}
	if (!todo.length) return out;

	const exe = await findFfmpeg();
	if (!exe) { console.warn(`! ${todo.length} photo(s) go up as JPEG: no ffmpeg with libaom-av1 found (set FFMPEG to one)`); return out; }
	console.log(`• Converting ${todo.length} photo(s) to AVIF — the first time takes a while, then it's cached`);
	const scale = `scale='if(gt(iw,ih),min(${SIDE},iw),-2)':'if(gt(iw,ih),-2,min(${SIDE},ih))':flags=lanczos,format=yuv420p`;
	let done = 0, failed = 0, saved = 0;
	const t0 = Date.now();
	const one = async ({ f, copy }) => {
		const tmp = copy + '.part';
		try {
			await run(exe, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(mediaDir, f), '-vf', scale, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(CRF), '-cpu-used', '6', '-threads', '2', '-f', 'avif', tmp], { maxBuffer: 4 << 20 });
			const [a, b] = await Promise.all([stat(path.join(mediaDir, f)), stat(tmp)]);
			if (!b.size) throw new Error('empty output');
			await rename(tmp, copy);
			out.set(f, copy);
			saved += a.size - b.size;
		} catch (e) {
			failed++;
			await rm(tmp, { force: true });
			console.warn(`! Kept ${f} as JPEG (${String(e.message).split('\n')[0]})`);
		}
		if (++done % 100 === 0 || done === todo.length) console.log(`  ${done}/${todo.length} · ${Math.round((Date.now() - t0) / 1000)}s · ${(saved / 1048576).toFixed(0)} MB smaller so far`);
	};
	let i = 0;
	const lanes = Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2)));
	await Promise.all(Array.from({ length: lanes }, async () => { while (i < todo.length) await one(todo[i++]); }));
	if (failed) console.warn(`! ${failed} photo(s) stayed JPEG`);
	return out;
}
