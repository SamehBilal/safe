/* Reads the folders in private/media/ and turns what's in them into site content, so adding a photo, a video, a song
   or a gift is just dropping a file in the right folder and running the build. See private/media/README.md.

     images/<album>[/<sub-album>]/*        photos → a pile in the photo album (nested folders: "Album · Sub-album")
     images/places/<city>/<place-id>/*     photos → that place on the places map (and its pile in the album);
                                           a new folder with an info.json that has "at" becomes a new place
     videos/<album>/*                      videos → the same album piles as the photos
     songs/<song>/                         the song file, cover.jpg, info.json → a record on «أغانينا»
     gifts/from-sameh/<gift>/, gifts/from-esraa/<gift>/
                                           photos (+ info.json) → a gift pile in the photo album

   Any folder can hold an info.json to name it or add details:
     { "title": { "ar": "…", "en": "…" }, "date": "2022-07-13", "note": { "ar": "…", "en": "…" },
       "captions": { "1.jpg": { "ar": "…", "en": "…" } } }
   Files are taken in natural order (1, 2, 10), and a folder's own photos come before its sub-folders'. */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i, VID = /\.(mp4|webm|mov)$/i, AUD = /\.(mp3|m4a|ogg)$/i;
const SKIP = /^(info\.json|readme\.md|desktop\.ini|thumbs\.db|\.gitkeep|\.ds_store)$/i;

/* Folder names we know, in both languages; anything else is shown as it's written (dashes become spaces). */
const NAMES = {
	engagement: ['الخطوبة', 'Engagement'], 'katb-ketab': ['كتب الكتاب', 'Katb el-ketab'], wedding: ['الفرح', 'Wedding'], honeymoon: ['شهر العسل', 'Honeymoon'],
	us: ['إحنا الاتنين', 'The two of us'], everyday: ['يومياتنا', 'Our days'], family: ['عيلتنا', 'Family'], home: ['بيتنا', 'Our home'],
	'all-of-us': ['إحنا الأربعة', 'All four of us'], fahd: ['فهد', 'Fahd'], abdulrahman: ['عبد الرحمن', 'Abdulrahman'], sameh: ['سامح', 'Sameh'], esraa: ['إسراء', 'Esraa'],
	birthdays: ['أعياد الميلاد', 'Birthdays'], 'anniversary-trips': ['رحلات عيد الجواز', 'Anniversary trips'], trips: ['رحلات', 'Trips'],
	ramadan: ['رمضان', 'Ramadan'], eid: ['العيد', 'Eid'], 'before-us': ['قبل ما نتقابل', 'Before us'], letters: ['جوابات', 'Letters'],
	'from-sameh': ['من سامح', 'From Sameh'], 'from-esraa': ['من إسراء', 'From Esraa'], places: ['أماكننا', 'Our places'],
	cairo: ['القاهرة', 'Cairo'], giza: ['الجيزة', 'Giza'], tanta: ['طنطا', 'Tanta'], zagazig: ['الزقازيق', 'Zagazig'], alexandria: ['إسكندرية', 'Alexandria'], dahab: ['دهب', 'Dahab'], sahel: ['الساحل', 'Sahel'], zifta: ['زفتى', 'Zifta'], 'mit-ghamr': ['ميت غمر', 'Mit Ghamr']
};
/* the area on the places map each city folder belongs to */
const AREA = { cairo: ['القاهرة والجيزة', 'Cairo & Giza'], giza: ['القاهرة والجيزة', 'Cairo & Giza'], tanta: ['طنطا', 'Tanta'], zagazig: ['الزقازيق', 'Zagazig'], alexandria: ['إسكندرية', 'Alexandria'], dahab: ['دهب', 'Dahab'], sahel: ['الساحل', 'Sahel'], zifta: ['زفتى', 'Zifta'], 'mit-ghamr': ['ميت غمر', 'Mit Ghamr'] };

const nice = (s) => s.replace(/[-_]+/g, ' ').trim();
const name = (seg) => {
	if (/^\d{4}$/.test(seg)) return { ar: seg.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]), en: seg };
	const n = NAMES[seg.toLowerCase()];
	return n ? { ar: n[0], en: n[1] } : { ar: nice(seg), en: nice(seg) };
};
const join = (parts) => ({ ar: parts.map((p) => p.ar).join(' · '), en: parts.map((p) => p.en).join(' · ') });
const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
const rel = (p) => p.split(path.sep).join('/');

async function info(dir) {
	const f = path.join(dir, 'info.json');
	if (!existsSync(f)) return {};
	try { return JSON.parse(await readFile(f, 'utf8')); } catch (e) { console.warn(`  ! ${rel(path.relative(path.dirname(path.dirname(dir)), f))} isn't valid JSON (${e.message}) — skipped`); return {}; }
}

/* one folder: its files (sorted) and its sub-folders */
async function list(dir) {
	if (!existsSync(dir)) return { files: [], dirs: [] };
	const all = await readdir(dir, { withFileTypes: true });
	return {
		files: all.filter((e) => e.isFile() && !SKIP.test(e.name)).map((e) => e.name).sort(natural),
		dirs: all.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name).sort(natural)
	};
}

const GROW = /^(months|years)$/i;
export async function library(mediaDir) {
	const out = { gallery: [], growth: {}, placePhotos: new Map(), newPlaces: [], songs: [], gifts: [], timeline: [], count: 0 };
	if (!existsSync(mediaDir)) return out;

	// images/ and videos/: albums (places/ is handled on its own below)
	async function album(kind, dir, segs, test) {
		const { files, dirs } = await list(dir);
		const meta = await info(dir);
		const label = meta.title || join(segs.map(name));
		const who = segs.map((s) => s.toLowerCase()).filter((s) => ['sameh', 'esraa', 'fahd', 'abdulrahman'].includes(s));
		for (const f of files.filter((f) => test.test(f))) {
			const item = { photo: rel(path.relative(mediaDir, path.join(dir, f))), album: label };
			const cap = meta.captions?.[f];
			if (cap) item.caption = cap;
			if (meta.date) item.date = meta.date;
			if (who.length) item.who = who;
			out.gallery.push(item);
			out.count++;
		}
		for (const d of dirs) if (!(segs[0] === 'family' && GROW.test(d))) await album(kind, path.join(dir, d), [...segs, d], test);
	}
	for (const [kind, test] of [['images', IMG], ['videos', VID]]) {
		const { dirs } = await list(path.join(mediaDir, kind));
		for (const d of dirs) if (d !== 'places' && d !== 'timeline') await album(kind, path.join(mediaDir, kind, d), [d], new RegExp(`${IMG.source}|${VID.source}`, 'i'));
	}

	// images/family/<person>/months/<n>.jpg (and years/<n>.jpg): one photo a month or a year, for the strip on their page
	const fam = path.join(mediaDir, 'images', 'family');
	for (const who of (await list(fam)).dirs) {
		for (const every of (await list(path.join(fam, who))).dirs.filter((d) => GROW.test(d))) {
			const dir = path.join(fam, who, every);
			const photos = {};
			for (const f of (await list(dir)).files.filter((f) => IMG.test(f))) {
				const n = (f.match(/^\d+/) || [])[0];
				if (n !== undefined && !photos[+n]) { photos[+n] = rel(path.relative(mediaDir, path.join(dir, f))); out.count++; }
			}
			if (Object.keys(photos).length) out.growth[who.toLowerCase()] = { every: every.toLowerCase().startsWith('m') ? 'month' : 'year', photos };
		}
	}

	// images/timeline/<YYYY-MM-DD>[-anything]/ → that date on «حكايتنا»
	for (const kind of ['images', 'videos']) {
		const root = path.join(mediaDir, kind, 'timeline');
		for (const d of (await list(root)).dirs) {
			const date = (d.match(/^\d{4}-\d{2}-\d{2}/) || [])[0];
			if (!date) continue;
			const dir = path.join(root, d);
			const meta = await info(dir);
			const files = (await list(dir)).files.filter((f) => IMG.test(f) || VID.test(f));
			if (!files.length) continue;
			out.timeline.push({ date, id: d.slice(11), photos: files.map((f) => ({ photo: rel(path.relative(mediaDir, path.join(dir, f))), ...(meta.captions?.[f] ? { caption: meta.captions[f] } : {}) })) });
			out.count += files.length;
		}
	}

	// images/places/<city>/<place-id>/ (and videos/places/… the same way)
	for (const kind of ['images', 'videos']) {
		const root = path.join(mediaDir, kind, 'places');
		for (const city of (await list(root)).dirs) {
			for (const id of (await list(path.join(root, city))).dirs) {
				const dir = path.join(root, city, id);
				const files = (await list(dir)).files.filter((f) => IMG.test(f) || VID.test(f)).map((f) => rel(path.relative(mediaDir, path.join(dir, f))));
				const meta = await info(dir);
				if (!out.placePhotos.has(id)) out.placePhotos.set(id, []);
				out.placePhotos.get(id).push(...files);
				out.count += files.length;
				if (meta.at && !out.newPlaces.some((p) => p.id === id)) {
					const a = AREA[city.toLowerCase()];
					out.newPlaces.push({ id, title: meta.title || name(id), where: meta.where || name(city), at: meta.at, area: meta.area || (a ? { ar: a[0], en: a[1] } : name(city)), ...(meta.place || meta.note ? { place: meta.place || meta.note } : {}), ...(meta.date ? { date: meta.date } : {}), ...(meta.album ? { album: meta.album } : {}), ...(meta.maps ? { maps: meta.maps } : {}) });
				}
			}
		}
	}

	// songs/<song>/: the recording, its cover and info.json
	const songs = path.join(mediaDir, 'songs');
	for (const d of (await list(songs)).dirs) {
		const dir = path.join(songs, d);
		const { files } = await list(dir);
		const meta = await info(dir);
		const audio = files.find((f) => AUD.test(f));
		const cover = files.find((f) => /^cover\./i.test(f) && IMG.test(f)) || files.find((f) => IMG.test(f));
		if (!audio && !cover && !meta.title) continue;
		out.songs.push({
			slug: d, title: meta.title || nice(d), artist: meta.artist || '', by: meta.by === 'her' ? 'her' : 'him', note: meta.note || '', link: meta.link || '',
			...(meta.date ? { date: meta.date } : {}),
			...(audio ? { audio: rel(path.relative(mediaDir, path.join(dir, audio))) } : {}),
			...(cover ? { cover: rel(path.relative(mediaDir, path.join(dir, cover))) } : {})
		});
		out.count += (audio ? 1 : 0) + (cover ? 1 : 0);
	}

	// gifts/from-sameh/<gift>/ and gifts/from-esraa/<gift>/
	for (const from of ['from-sameh', 'from-esraa']) {
		const root = path.join(mediaDir, 'gifts', from);
		for (const d of (await list(root)).dirs) {
			const dir = path.join(root, d);
			const meta = await info(dir);
			const photos = (await list(dir)).files.filter((f) => IMG.test(f) || VID.test(f)).map((f) => rel(path.relative(mediaDir, path.join(dir, f))));
			if (!photos.length) continue;
			out.gifts.push({ id: d, title: meta.title || name(d), from: from === 'from-sameh' ? 'him' : 'her', ...(meta.date ? { date: meta.date } : {}), ...(meta.note ? { note: meta.note } : {}), photos });
			out.count += photos.length;
		}
	}
	return out;
}

/* Put what the folders hold into the story (before it's encrypted). */
export function intoStory(story, lib) {
	story.gallery = [...(story.gallery || []), ...lib.gallery];
	story.places = story.places || [];
	for (const p of lib.newPlaces) if (!story.places.some((x) => x.id === p.id)) story.places.push(p);
	for (const [id, photos] of lib.placePhotos) {
		const p = story.places.find((x) => x.id === id);
		if (p) {
			p.photos = [...new Set([...(p.photos || (p.photo ? [p.photo] : [])), ...photos])];
			if (!p.photo) p.photo = p.photos[0];
		} else if (photos.length) {
			story.gallery.push(...photos.map((photo) => ({ photo, album: name(id) })));
		}
	}
	for (const m of story.family?.members || []) {
		const g = lib.growth[m.id];
		if (g) m.growth = { every: g.every, photos: { ...(m.growth?.photos || {}), ...g.photos } };
	}
	if (lib.gifts.length) story.gifts = [...(story.gifts || []), ...lib.gifts];
	// the big days («أيام فارقة») show their album's photos too
	const CHAPTER = { proposal: 'engagement', engagement: 'engagement', wedding: 'wedding', katb: 'katb-ketab', fahd: 'family/fahd', abdulrahman: 'family/abdulrahman', honeymoon: 'honeymoon' };
	for (const c of story.chapters || []) {
		const dir = CHAPTER[c.id];
		if (!dir) continue;
		const mine = lib.gallery.filter((g) => g.photo.startsWith(`images/${dir}/`) || g.photo.startsWith(`videos/${dir}/`));
		const have = (c.photos || []).map((p) => (typeof p === 'string' ? p : p.photo));
		c.photos = [...(c.photos || []), ...mine.filter((g) => !have.includes(g.photo)).map((g) => ({ photo: g.photo, ...(g.caption ? { caption: g.caption } : {}) }))];
	}
	// a date's photos: the moment with that date (and that id, when two share a date) shows them
	for (const t of lib.timeline) {
		const same = (story.timeline || []).filter((x) => x.date === t.date);
		const x = same.find((y) => y.id === t.id) || same[0];
		if (!x) continue;
		const have = (x.photos || []).map((p) => (typeof p === 'string' ? p : p.photo));
		x.photos = [...(x.photos || []), ...t.photos.filter((p) => !have.includes(p.photo))];
		if (!x.photo) x.photo = x.photos.map((p) => (typeof p === 'string' ? p : p.photo))[0];
	}
	return story;
}

/* Put the folder songs into «أغانينا»: a song already on the shelf (same title) gets the recording and cover,
   any other becomes a new record. */
export function intoMusic(data, lib) {
	const key = (t) => String(t || '').replace(/[\sً-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
	const items = (data.items || []).map((x) => ({ ...x }));
	lib.songs.forEach((s, n) => {
		const x = items.find((i) => key(i.title) === key(s.title));
		if (x) {
			if (s.audio) x.audio = s.audio;
			if (s.cover) x.cover = s.cover;
			if (s.artist && !x.artist) x.artist = s.artist;
		} else {
			items.push({ id: 'folder-' + s.slug, title: s.title, artist: s.artist, link: s.link, note: s.note, by: s.by, at: Date.UTC(2020, 0, 1) + n, ...(s.date ? { date: s.date } : {}), ...(s.audio ? { audio: s.audio } : {}), ...(s.cover ? { cover: s.cover } : {}) });
		}
	});
	return { ...data, items };
}
