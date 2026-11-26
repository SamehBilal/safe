import { L, esc, App, $, $$, num, parseDate, img } from '../shell.js';
import * as live from '../live.js';
import { GOVERNORATES, VIEWBOX, DOTS } from '../egypt.js';

/* The anniversary trips: every wedding anniversary we travel to a governorate. Trips you add from your phones live in
   content/live/trips.bin; trips written in story.json (with photos from private/media) are merged in. The page itself is
   «عيد جوازنا» (anniversaries.js); this file keeps what it and trip.html share: the map, the trips, the covers. */

export const GOV = Object.fromEntries(GOVERNORATES.map((g) => [g.id, g]));
export const govName = (id) => (GOV[id] ? L(GOV[id].ar, GOV[id].en) : '');

const ORD_AR = ['', 'الأول', 'التاني', 'التالت', 'الرابع', 'الخامس', 'السادس', 'السابع', 'التامن', 'التاسع', 'العاشر'];
const ORD_EN = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
export const marriedYear = (s) => parseDate(s.married || '2020-09-10').getFullYear();
export function anniversary(s, year) {
	const n = year - marriedYear(s);
	return n < 1 ? '' : App.lang === 'ar' ? `عيد جوازنا ${ORD_AR[n] || 'الـ' + num(n)}` : `Our ${ORD_EN(n)} anniversary`;
}

/** Trips from story.json and from the phones, merged by id, oldest first. */
export async function loadTrips(s) {
	const data = await live.load('trips');
	const byId = new Map();
	for (const x of s.trips || []) byId.set(x.id, { ...x, fixed: true, memories: [...(x.memories || [])] });
	for (const x of data.items || []) {
		const old = byId.get(x.id);
		byId.set(x.id, old ? { ...old, ...x, fixed: old.fixed, memories: [...old.memories, ...(x.memories || [])] } : { ...x, memories: x.memories || [] });
	}
	return [...byId.values()].sort((a, b) => a.year - b.year || (a.date || '').localeCompare(b.date || ''));
}

/** First photo of a trip: a photo from story.json (media:…) or one added from a phone (sketch store id). */
export function coverOf(x) {
	const p = (x.photos || [])[0];
	if (p) return { media: typeof p === 'string' ? p : p.photo };
	const m = (x.memories || []).find((y) => y.img);
	return m ? { live: m.img } : null;
}
export const coverHTML = (c, alt = '') => (!c ? '' : c.media ? img(c.media, alt) : `<img data-sketch="${esc(c.live)}" alt="${esc(alt)}">`);

/** The map. `paint` colours each governorate; returns markup. */
export function mapSVG(cls = '') {
	return `<svg class="eg ${cls}" viewBox="${VIEWBOX}" role="group" aria-label="${L('خريطة محافظات مصر', 'Map of Egypt’s governorates')}" style="direction:ltr">
		<defs><filter id="egShadow" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#133447" flood-opacity=".25"/></filter></defs>
		<g filter="url(#egShadow)">${GOVERNORATES.map((g) => `<path class="eg__gov" id="g-${g.id.replace('.', '_')}" data-gov="${g.id}" d="${g.d}" tabindex="0" role="button" aria-label="${esc(L(g.ar, g.en))}"><title>${esc(L(g.ar, g.en))}</title></path>`).join('')}</g>
		${Object.entries(DOTS).map(([id, [x, y]]) => `<circle class="eg__dot" data-gov="${id}" cx="${x}" cy="${y}" r="9" tabindex="0" role="button" aria-label="${esc(govName(id))}"><title>${esc(govName(id))}</title></circle>`).join('')}
		<g class="eg__pins"></g>
	</svg>`;
}

/** Colour the governorates we've been to, and pin the year on each. */
export function paintMap(svg, trips, { focus } = {}) {
	const byGov = new Map();
	for (const x of trips) (byGov.get(x.gov) || byGov.set(x.gov, []).get(x.gov)).push(x);
	for (const el of $$('[data-gov]', svg)) {
		const n = byGov.get(el.dataset.gov)?.length || 0;
		el.classList.toggle('is-been', n > 0);
		el.classList.toggle('is-twice', n > 1);
		el.classList.toggle('is-focus', el.dataset.gov === focus);
	}
	/* a pin on each governorate we've been to, and a label with its year(s). Neighbours (Cairo and Qalyubia, say) sit close,
	   so each label takes the first spot around its pin that covers no pin and no other label, with a line back to its pin
	   when it had to move; all labels are drawn above all pins. */
	const spots = [...byGov.entries()].map(([id, list]) => {
		const el = $(`[data-gov="${id}"]`, svg);
		if (!el) return null;
		let x, y;
		if (DOTS[id]) [x, y] = DOTS[id];
		else { const b = el.getBBox(); x = b.x + b.width / 2; y = b.y + b.height / 2; }
		const label = list.map((v) => v.year).join(' · ');
		return { x, y, label, w: 22 + label.length * 13 };
	}).filter(Boolean).sort((a, b) => a.y - b.y || a.x - b.x);
	const H = 30, GAP = 4;
	const hit = (r, q) => r.x < q.x + q.w + GAP && q.x < r.x + r.w + GAP && r.y < q.y + q.h + GAP && q.y < r.y + r.h + GAP;
	const heads = spots.map((p) => ({ x: p.x - 17, y: p.y - 44, w: 34, h: 44 }));
	const taken = [];
	for (const p of spots) {
		const side = p.w / 2 + 22;
		// label centre, as an offset from the pin's tip
		const tries = [[0, -61], [side, -27], [-side, -27], [0, 22], [0, -97], [side, -63], [-side, -63], [side, 9], [-side, 9]];
		let best = tries[0], bestN = Infinity;
		for (const [dx, dy] of tries) {
			const r = { x: p.x + dx - p.w / 2, y: p.y + dy - H / 2, w: p.w, h: H };
			const n = heads.filter((h) => hit(r, h)).length + taken.filter((t) => hit(r, t)).length * 2;
			if (n < bestN) { best = [dx, dy]; bestN = n; }
			if (!n) break;
		}
		p.dx = best[0]; p.dy = best[1];
		taken.push({ x: p.x + p.dx - p.w / 2, y: p.y + p.dy - H / 2, w: p.w, h: H });
	}
	const pins = $('.eg__pins', svg);
	// the pins and their year tags are drawn again only when the trips change — a draw or a tap on a governorate only
	// moves the highlight, so they don't drop in again and jump about with every step
	const key = spots.map((p) => `${p.x},${p.y},${p.label}`).join('|');
	if (pins.dataset.key === key) return;
	pins.dataset.key = key;
	pins.innerHTML = spots.map((p) => `<g class="eg__pin" transform="translate(${p.x.toFixed(0)} ${p.y.toFixed(0)})"><path d="M0 0c-6-10-16-14-16-26a16 16 0 0 1 32 0c0 12-10 16-16 26Z" fill="#f2726f" stroke="#fff" stroke-width="3"/><circle cy="-26" r="6" fill="#fff"/></g>`).join('')
		+ spots.map((p) => `<g class="eg__pin" transform="translate(${p.x.toFixed(0)} ${p.y.toFixed(0)})">${p.dx || p.dy !== -61 ? `<path d="M0 -26L${p.dx} ${p.dy}" stroke="#133447" stroke-width="2.5" stroke-linecap="round"/>` : ''}
			<g transform="translate(${p.dx} ${p.dy})"><rect x="${-p.w / 2}" y="-15" width="${p.w}" height="${H}" rx="15" fill="#133447"/><text text-anchor="middle" dy="7" fill="#fff" font-size="20" font-weight="800">${esc(p.label)}</text></g></g>`).join('');
}

/** Phone photos → 1600px webp, so every saved photo is light and the same kind. */
export async function shrinkPhoto(file, max = 1600) {
	const bmp = await createImageBitmap(file);
	const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
	const c = document.createElement('canvas');
	c.width = Math.round(bmp.width * k);
	c.height = Math.round(bmp.height * k);
	c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
	return new Promise((r) => c.toBlob(r, 'image/webp', 0.82));
}

export function nextAnniversary(s) {
	const m = parseDate(s.married || '2020-09-10');
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	let d = new Date(today.getFullYear(), m.getMonth(), m.getDate());
	if (d < today) d = new Date(today.getFullYear() + 1, m.getMonth(), m.getDate());
	return { days: Math.round((d - today) / 864e5), year: d.getFullYear() };
}
