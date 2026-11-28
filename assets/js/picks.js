import { L, Y, App } from './shell.js';
import * as live from './live.js';
import { openSorter, shuffled } from './sorter.js';
import { doodle } from './doodles.js';

/* «نقّي صورنا»: going through a day's photos (or a pile of the album) with the photo sorter, the two of us, and putting
   each one in a box — المفضلة (our favourites: marked with a heart wherever the photo shows, and first on the album's
   «اللي نقّيناه»), نطبعها (the ones to print for a real album or a frame), نحكيها (the ones that tell the day best) or
   تعدّي (seen, nothing special). Kept in the shared list «picks» (private/live/picks.json): one entry per photo, its id
   the photo itself, so a photo picked on the album is picked on its day's page too, and on the other phone. */

export const BOXES = [
	{ id: 'fav', ic: 'heart', c: '#e0565b', ar: 'المفضلة', en: 'Favourites' },
	{ id: 'print', ic: 'scroll', c: '#0e6990', ar: 'نطبعها', en: 'To print' },
	{ id: 'skip', ic: 'forward', c: '#8a96a3', ar: 'تعدّي', en: 'Pass' },
	{ id: 'tell', ic: 'chat', c: '#5a9e6f', ar: 'نحكيها', en: 'Tells the day' }
];
const boxes = () => BOXES.map((b) => ({ ...b, label: L(b.ar, b.en) }));

/** photo → its box id, from the shared list */
export async function loadPicks() {
	const d = await live.load('picks').catch(() => ({ items: [] }));
	return new Map((d.items || []).map((x) => [x.id, x.box]));
}

/** Sort these photos ([{ photo, caption }]): the ones not picked yet first. `done(map)` when the sorter closes. */
export async function pickPhotos(title, photos, done) {
	const picks = await loadPicks();
	const seen = new Set();
	const list = photos.filter((p) => p?.photo && !seen.has(p.photo) && seen.add(p.photo));
	const fresh = list.filter((p) => !picks.has(p.photo)), old = list.filter((p) => picks.has(p.photo));
	const before = new Map();
	const write = (photo, box) => live.save('picks', (d) => {
		d.items ||= [];
		const i = d.items.findIndex((x) => x.id === photo);
		if (!box) { if (i >= 0) d.items.splice(i, 1); return; }
		const x = { id: photo, box, by: live.me(), at: Date.now() };
		if (i >= 0) d.items[i] = x; else d.items.push(x);
	}).catch(() => {});
	const counts = (c) => BOXES.map((b, k) => [b, c[k]]).filter(([, n]) => n);
	openSorter({
		mode: 'free',
		title,
		sub: fresh.length ? Y('اسحب كل صورة لصندوقها', 'اسحبي كل صورة لصندوقها', 'Drag each photo to its box') : L('كلها متنقّية — دي عشان تغيّر رأيك', 'All picked already — this is to change your mind'),
		items: [...fresh, ...old],
		boxes: boxes(),
		onPut: (it, k) => { if (!before.has(it.photo)) before.set(it.photo, picks.get(it.photo) || ''); picks.set(it.photo, BOXES[k].id); write(it.photo, BOXES[k].id); },
		onUndo: (it) => { const was = before.get(it.photo) || ''; if (was) picks.set(it.photo, was); else picks.delete(it.photo); write(it.photo, was); },
		end: ({ counts: c }) => `<p class="srt-end__big">${L('نقّينا!', 'All picked!')}</p>
			<ul>${counts(c).map(([b, n]) => `<li><span style="color:${b.c}">${doodle(b.ic, 18)}</span> ${L(b.ar, b.en)}: ${App.lang === 'ar' ? n.toLocaleString('ar-EG') : n}</li>`).join('')}</ul>`,
		onClose: () => done?.(picks)
	});
}

/** a heart on every favourite photo in `root` (the photos are <img data-m="…">, the mark goes on `boxSel` around it) */
export function markFavs(root, picks, boxSel) {
	for (const im of root.querySelectorAll('[data-m]')) {
		const box = im.closest(boxSel);
		if (!box) continue;
		const fav = picks.get(im.dataset.m) === 'fav';
		const mark = box.querySelector(':scope > .pk-mark');
		if (fav && !mark) box.insertAdjacentHTML('beforeend', `<span class="pk-mark" title="${L('من المفضلة', 'A favourite')}">${doodle('heart', 16)}</span>`);
		else if (!fav && mark) mark.remove();
	}
}

export { shuffled };
