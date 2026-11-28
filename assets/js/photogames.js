import { L, Y, App, esc, store, longDate } from './shell.js';
import { openSorter, shuffled } from './sorter.js';
import { doodle } from './doodles.js';

/* Two games played with our own photos, on the photo sorter (assets/js/sorter.js):
   - «أي سنة؟» (years.html and games.html): a photo from our story drops in the middle, the four boxes are four years —
     flick it into the one you think, and the day it came from is said under the pile. Ten photos a round.
   - «صور مين؟» (Fahd's, on games.html and his own page): the boxes are فهد, ماما, بابا وماما and كلنا, each with a
     face on it; the photo only goes into the right one (the wrong one shakes its head and the photo comes back), and
     a right one gets a burst of stars. Who's in a photo comes from its moment's "who" in the story. */

const n = (x) => (App.lang === 'ar' ? Number(x).toLocaleString('ar-EG').replace(/[٬,]/g, '') : String(x));
const photosOf = (x) => [...new Set([x.photo, ...(x.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo))].filter(Boolean))].filter((p) => !/\.(mp4|mov|webm)$/i.test(p));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------------- «أي سنة؟» ---------------- */
const ago = (d) => (d <= 0 ? L('السنة دي', 'This year') : d === 1 ? L('من سنة', 'A year ago') : d === 2 ? L('من سنتين', '2 years ago') : L(`من ${n(d)} ${d <= 10 ? 'سنين' : 'سنة'}`, `${d} years ago`));
function yearRound(s) {
	const moments = (s.timeline || []).filter((x) => /^\d{4}/.test(String(x.date)) && photosOf(x).length);
	const years = [...new Set(moments.map((x) => +String(x.date).slice(0, 4)))].sort((a, b) => a - b);
	if (years.length < 4) return [];
	// ten moments, not two from the same day, spread over the years
	const byYear = new Map(years.map((y) => [y, shuffled(moments.filter((x) => +String(x.date).slice(0, 4) === y))]));
	const out = [];
	for (const y of shuffled(years).concat(shuffled(years))) {
		const m = byYear.get(y).pop();
		if (m) out.push({ photo: pick(photosOf(m)), y, m });
		if (out.length === 10) break;
	}
	const now = new Date().getFullYear();
	return shuffled(out).map((it) => {
		// the right year and three others, the nearest ones more often (so it isn't too easy), in order around the pile
		const others = shuffled(years.filter((y) => y !== it.y)).sort((a, b) => Math.abs(a - it.y) - Math.abs(b - it.y) + (Math.random() - 0.5) * 6).slice(0, 3);
		const four = [it.y, ...others].sort((a, b) => a - b);
		it.boxes = four.map((y, k) => ({ id: y, big: n(y), label: ago(now - y), ic: 'calendar', c: ['#0e6990', '#e0565b', '#5a9e6f', '#e39b2d'][k] }));
		return it;
	});
}

export function yearGame(s) {
	const items = yearRound(s);
	if (!items.length) return;
	const BEST = 'us.game.year';
	openSorter({
		mode: 'quiz',
		title: L('أي سنة؟', 'Which year?'),
		sub: Y('الصورة دي من أنهي سنة؟ ارميها في صندوقها', 'الصورة دي من أنهي سنة؟ ارميها في صندوقها', 'Which year is this photo from? Throw it in its box'),
		items,
		boxes: (it) => it.boxes,
		judge: (it, k) => it.boxes[k]?.id === it.y,
		reveal: (it) => `<small>${esc(App.t(it.m.title))} · ${esc(longDate(it.m.date))}</small>`,
		end: ({ right, total }) => {
			const best = Math.max(right, +store.get(BEST) || 0);
			const record = right > (+store.get(BEST) || 0) && right > 0;
			store.set(BEST, String(best));
			return `<p class="srt-end__big">${n(right)} / ${n(total)}</p>
				<p>${right === total ? L('ولا غلطة! ذاكرة حديد', 'Not one wrong! What a memory') : right >= total * 0.7 ? L('فاكرين كويس أوي', 'We remember well') : right >= total * 0.4 ? L('مش بطال… السنين بتجري', 'Not bad… the years fly') : L('السنين اتلخبطت علينا', 'The years got mixed up')}</p>
				<p class="srt-end__best">${doodle('trophy', 18)} ${record ? L('رقم جديد!', 'A new best!') : `${L('أحسن نتيجة', 'Best')}: ${n(best)}`}</p>`;
		},
		again: () => yearRound(s)
	});
}

/* ---------------- «صور مين؟» ---------------- */
const BOX_WHO = [
	{ id: 'all', ic: 'family', c: '#5a9e6f', ar: 'كلنا', en: 'All of us' },
	{ id: 'mama', ic: 'princess', c: '#d9534f', ar: 'ماما', en: 'Mama' },
	{ id: 'kid', ic: 'lion', c: '#e39b2d', ar: 'فهد', en: 'Fahd' },
	{ id: 'both', ic: 'couple', c: '#0e6990', ar: 'بابا وماما', en: 'Mama and Baba' }
];
function whoPools(s) {
	const ms = s.family?.members || [];
	const him = ms.find((m) => !m.kid && !m.female)?.id, her = ms.find((m) => !m.kid && m.female)?.id, kid = ms.find((m) => m.kid)?.id;
	const pools = { all: [], mama: [], kid: [], both: [] };
	for (const x of s.timeline || []) {
		const w = new Set(x.who || []);
		if (!w.size) continue;
		const cat = w.size === 1 && w.has(kid) ? 'kid' : w.size === 1 && w.has(her) ? 'mama' : w.size === 2 && w.has(him) && w.has(her) ? 'both' : w.has(him) && w.has(her) && w.has(kid) ? 'all' : '';
		if (cat) for (const p of photosOf(x)) pools[cat].push({ photo: p, cat, m: x });
	}
	return { pools, kidName: ms.find((m) => m.kid)?.name };
}
function whoRound(s) {
	const { pools } = whoPools(s);
	const cats = Object.keys(pools).filter((c) => pools[c].length > 1);
	if (cats.length < 2) return null;
	// a face on each box (a photo that won't come up this round), then ten photos, every box getting some
	const faces = {}, used = new Set();
	for (const c of cats) { const f = pick(pools[c]); faces[c] = f.photo; used.add(f.photo); }
	const items = [];
	for (let i = 0; items.length < 10 && i < 60; i++) {
		const c = cats[i % cats.length], p = pick(pools[c]);
		if (!used.has(p.photo)) { used.add(p.photo); items.push(p); }
	}
	return { items: shuffled(items), faces, cats };
}

export function whoGame(s) {
	const r = whoRound(s);
	if (!r) return;
	const { kidName } = whoPools(s);
	const kid = kidName ? App.t(kidName) : L('فهد', 'Fahd');
	let faces = r.faces, cats = r.cats, cache = null;
	// the same boxes for the whole round (a new array would make the sorter label them again for every photo)
	const boxes = () => (cache ||= BOX_WHO.map((b) => (cats.includes(b.id) ? { ...b, label: b.id === 'kid' ? kid : L(b.ar, b.en), face: faces[b.id] } : null)));
	openSorter({
		mode: 'toy',
		title: L('صور مين؟', 'Who’s in the photo?'),
		sub: L(`يلا يا ${kid}! الصورة دي مين فيها؟`, `Come on ${kid}! Who's in this one?`),
		items: r.items,
		boxes: () => boxes(),
		judge: (it, k) => BOX_WHO[k].id === it.cat,
		nope: () => L('لأ… مش هنا. فين تاني؟', 'Not there… where else?'),
		yay: (it) => pick([L('برافو!', 'Well done!'), L('شاطر!', 'Clever!'), L('هايل!', 'Brilliant!'), L(`برافو يا ${kid}!`, `Well done ${kid}!`)]),
		end: ({ tries, total }) => `<p class="srt-end__big">${L(`برافو يا ${kid}!`, `Well done ${kid}!`)}</p>
			<p>${doodle('star', 22)}${doodle('star', 28)}${doodle('star', 22)}</p>
			<p>${tries <= total ? L('ولا غلطة!', 'Not one wrong!') : L(`${n(total)} صور في ${n(tries)} محاولة`, `${total} photos in ${tries} tries`)}</p>`,
		again: () => { const x = whoRound(s); if (!x) return []; faces = x.faces; cats = x.cats; cache = null; return x.items; }
	});
}

/** can the games be played with this story? (enough photos with years / with who's in them) */
export const canYear = (s) => yearRound(s).length > 0;
export const canWho = (s) => !!whoRound(s);
