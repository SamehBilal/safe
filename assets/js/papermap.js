/* A map drawn with a pen on paper, not a road map: Egypt's governorates (egypt.js) and the lands around it — the
   rest of Africa, Arabia down to Oman, Iran across the Gulf — as plain shapes in ink over a light wash, seas left as
   paper with a few wave strokes, and names written by hand. One projection for all of it: egypt.js's drawing (viewBox
   0 0 1000 880) is close to a plain longitude/latitude grid, so the other lands are put in the same space with
   x = 82.52·lng − 2069.86 and y = −89.92·lat + 2852.4 (fitted to Egypt's governorate capitals; its edges land within
   a third of a degree of the real borders). The shapes beyond Egypt are traced roughly by hand — a sketch, on purpose. */
import { GOVERNORATES } from './egypt.js';

export const P = (lat, lng) => ({ x: 82.52 * lng - 2069.86, y: -89.92 * lat + 2852.4 });
const path = (pts) => 'M' + pts.map(([lng, lat]) => { const p = P(lat, lng); return `${p.x.toFixed(0)} ${p.y.toFixed(0)}`; }).join('L') + 'Z';

/* [lng, lat] outlines, coarse on purpose */
const LANDS = {
	// Libya, Sudan and the Horn: everything in Africa that isn't Egypt
	africa: [[22, 33.5], [23.2, 32.6], [25.1, 31.65], [25.09, 22], [36.9, 22], [37.3, 21], [37.2, 19.6], [37.5, 18.7], [38.5, 18], [39, 16.5], [39.7, 15.1], [41.2, 13.9], [43, 12.7], [43.4, 11.6], [44, 9], [22, 9]],
	// Palestine, Jordan, Iraq, Arabia down to Yemen and Oman
	arabia: [[34.22, 31.32], [34.5, 31.6], [34.8, 32.5], [35.1, 33.1], [35.5, 34.2], [47.4, 34.2], [48, 30.5], [48.4, 29.95], [48, 29.4], [48.4, 28.4], [49.6, 27], [50.2, 26.2], [50.6, 25.4], [50.8, 24.8], [51.2, 26.1], [51.6, 25.8], [51.6, 24.6], [52.6, 24.2], [54.1, 24.2], [54.6, 24.6], [55.3, 25.2], [56, 26], [56.4, 26.4], [56.3, 25.6], [56.35, 24.9], [56.9, 24.4], [57.7, 23.8], [58.6, 23.6], [59.4, 22.6], [59.8, 22.5], [59, 21.2], [58.5, 20.5], [57.8, 19.8], [57.7, 19], [56.8, 18.6], [56, 18], [55.2, 17.6], [54.2, 17], [53.3, 16.7], [52.2, 15.9], [51.3, 15.2], [49.6, 14.6], [48.7, 14], [47.5, 13.6], [45, 12.8], [43.5, 12.7], [43.2, 13.3], [42.7, 15.5], [42.5, 16.5], [41.6, 18], [40.6, 19.6], [39.6, 21], [39.1, 21.8], [38.9, 22.7], [38.1, 24], [37.2, 25.1], [36.5, 26], [35.7, 27.3], [35.2, 28], [35, 29.5], [34.9, 29.49]],
	// Iran, across the Gulf
	iran: [[47.4, 34.2], [62, 34.2], [62, 25.2], [59.5, 25.4], [57.8, 25.7], [57.3, 26.6], [56.4, 27.2], [55.5, 26.6], [54.5, 26.6], [53.6, 26.8], [52.5, 27.4], [51.4, 27.9], [50.6, 28.8], [50.1, 30.1], [49, 30.4], [48.4, 29.95], [48, 30.5]]
};
/* names written on the map: [lat, lng, ar, en, kind] */
const NAMES = [
	[26.6, 29.4, 'مصر', 'Egypt', 'land'], [24, 45, 'السعودية', 'Saudi Arabia', 'land'], [21.2, 56.6, 'عُمان', 'Oman', 'land'], [31.2, 55, 'إيران', 'Iran', 'land'],
	[18.5, 31, 'السودان', 'Sudan', 'land'], [29, 23.6, 'ليبيا', 'Libya', 'land'], [31.6, 40, 'الأردن والعراق', 'Jordan & Iraq', 'land'],
	[22.6, 37.4, 'البحر الأحمر', 'Red Sea', 'sea'], [27.2, 51.6, 'الخليج', 'The Gulf', 'sea'], [32.6, 29.5, 'البحر المتوسط', 'Mediterranean', 'sea'], [18.2, 60, 'بحر العرب', 'Arabian Sea', 'sea']
];

/* a box of coloured pencils for the governorates, so neighbours rarely share one */
const INKS = ['#9fd3c7', '#f7d774', '#f4a6b8', '#a7c7e7', '#c9b6e4', '#b8d98a', '#f6b98a'];

/** The paper: the pen's wobble, the lands and Egypt's governorates, waves on the seas and the names. */
export function paperSVG({ x, y, w, h }, { region = true, names = true, lang = 'ar', id = 'pm' } = {}) {
	const waves = [];
	for (let i = 0; i < 26; i++) {
		const wx = x + ((i * 397) % 1000) / 1000 * w, wy = y + ((i * 613) % 1000) / 1000 * h;
		waves.push(`<path class="pm__wave" d="M${wx.toFixed(0)} ${wy.toFixed(0)}q${(w / 90).toFixed(0)} -${(w / 160).toFixed(0)} ${(w / 45).toFixed(0)} 0t${(w / 45).toFixed(0)} 0"/>`);
	}
	const label = ([lat, lng, ar, en, kind]) => { const p = P(lat, lng); return `<text class="pm__name pm__name--${kind}" x="${p.x.toFixed(0)}" y="${p.y.toFixed(0)}" style="font-size:${(w / (kind === 'sea' ? 52 : 40)).toFixed(0)}px">${lang === 'ar' ? ar : en}</text>`; };
	return `<svg class="pm__svg" viewBox="${x.toFixed(0)} ${y.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
		<defs><filter id="${id}-pen" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${(w / 260).toFixed(1)}"/></filter></defs>
		<g class="pm__sea">${waves.join('')}</g>
		<g filter="url(#${id}-pen)">
			${region ? Object.entries(LANDS).map(([k, pts]) => `<path class="pm__land pm__land--${k}" d="${path(pts)}"/>`).join('') : ''}
			<g class="pm__egypt">${GOVERNORATES.map((g, i) => `<path class="pm__gov" d="${g.d}" style="fill:${INKS[(i * 3) % INKS.length]}"/>`).join('')}</g>
		</g>
		${names ? NAMES.filter((n) => region || n[4] === 'sea' || n[2] === 'مصر').map(label).join('') : ''}
	</svg>`;
}

/** The box around some points, with room around them, kept to a shape between wide and square. */
export function frame(points, { pad = 0.18, minW = 260, ratio = [1.25, 2.4] } = {}) {
	const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
	let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
	let w = Math.max(x1 - x0, minW), h = Math.max(y1 - y0, minW / ratio[1]);
	const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
	w *= 1 + pad * 2; h *= 1 + pad * 2;
	if (w / h > ratio[1]) h = w / ratio[1];
	if (w / h < ratio[0]) w = h * ratio[0];
	return { x: cx - w / 2, y: cy - h / 2, w, h };
}
/** Egypt on its own, the whole of it. */
export const EGYPT = { x: -20, y: -20, w: 1040, h: 920 };
/** Where a point falls in a frame, as percentages (for the pins laid over the drawing). */
export const pct = (f, p) => ({ left: `${(((p.x - f.x) / f.w) * 100).toFixed(2)}%`, top: `${(((p.y - f.y) / f.h) * 100).toFixed(2)}%` });
