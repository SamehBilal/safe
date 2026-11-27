import { L, esc, T } from '../shell.js';
import { doodle } from '../doodles.js';
import { listPage } from '../listpage.js';

/* Before us: our two lives side by side until 14 July 2009 — schools, cities, where each of us was.
   Band: two paths, his and hers, winding across the years until they meet in a heart at 2009. */
export default listPage({
	id: 'beforeus', kind: 'beforeus', icon: 'walk',
	title: ['قبل ما نتقابل', 'Before us'], sub: ['حياتنا الاتنين جنب بعض، لحد ما الطريقين اتقابلوا', 'Our two lives side by side, until the two roads met'],
	add: ['ضيفوا محطة', 'Add a stop'],
	fields: [
		{ n: 'who', t: 'sel', l: ['مين؟', 'Who?'], opts: 'who' },
		{ n: 'year', t: 'num', l: ['سنة كام؟', 'Which year?'], req: 1, min: 1975, step: 1 },
		{ n: 'what', t: 'text', l: ['إيه اللي حصل؟', 'What happened?'], req: 1, grow: 1, ideas: [['دخلت المدرسة', 'Started school'], ['نقلنا بيت جديد', 'Moved house'], ['دخلت الجامعة', 'Started university'], ['أول شغل', 'First job']] },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'] },
		{ n: 'photo', t: 'photo', l: ['صورة من زمان (اختياري)', 'An old photo (optional)'], full: 1 }
	],
	sort: (a, b) => (a.year || 0) - (b.year || 0),
	band: (items, c) => `<svg class="bu-svg" viewBox="0 0 1000 220">
		<path class="bu-road bu-road--him" d="M20 40 C 200 20, 300 120, 450 70 S 700 30, 860 110"/>
		<path class="bu-road bu-road--her" d="M20 190 C 220 210, 320 100, 480 160 S 720 200, 860 110"/>
		<text class="bu-name bu-name--him" x="24" y="28">${esc(T(c.s.him))}</text><text class="bu-name bu-name--her" x="24" y="214">${esc(T(c.s.her))}</text>
		<g class="bu-meet" transform="translate(890 110)"><path d="M0 18 -20 -2a12 12 0 0 1 20-14 12 12 0 0 1 20 14Z"/><text y="48" text-anchor="middle">2009</text></g>
		<circle class="bu-dot bu-dot--him" r="7"><animateMotion dur="7s" repeatCount="indefinite" path="M20 40 C 200 20, 300 120, 450 70 S 700 30, 860 110"/></circle>
		<circle class="bu-dot bu-dot--her" r="7"><animateMotion dur="7s" repeatCount="indefinite" path="M20 190 C 220 210, 320 100, 480 160 S 720 200, 860 110"/></circle>
	</svg>`,
	top: (items, c) => {
		const years = [...new Set(items.map((x) => x.year))].sort((a, b) => a - b);
		if (!years.length) return `<p class="empty">${L('ضيفوا أول محطة من حياة كل واحد فينا قبل ٢٠٠٩', 'Add the first stop from each of our lives before 2009')}</p>`;
		// each stop in its person's colour, with their drawing and name (the headings are hidden on a phone), where it was,
		// and its old photo as a polaroid; a short dashed tie runs from the card to the dotted line in the middle
		const cell = (y, w) => items.filter((x) => x.year === y && x.who === w).map((x) => `<article class="bu-stop bu-stop--${w}">
			<p class="bu-stop__who">${doodle(w === 'him' ? 'groom' : 'princess', 18)} ${esc(T(w === 'him' ? c.s.him : c.s.her))}</p>
			<b dir="auto">${esc(x.what)}</b>
			${x.where ? `<p class="bu-stop__where" dir="auto">${doodle('pin', 15)} ${esc(x.where)}</p>` : ''}
			${x.photo ? `<div class="bu-stop__ph">${c.photo(x)}</div>` : ''}
			${c.del(x)}
		</article>`).join('');
		// the year first, then his stops and hers: on a wide screen they go to their own columns, on a phone in this order
		const side = (y, w, r) => { const h = cell(y, w); return h ? `<div class="bu-side bu-side--${w}" style="--r:${r}">${h}</div>` : ''; };
		return `<div class="bu-grid"><div class="bu-h bu-h--him">${esc(T(c.s.him))}</div><div class="bu-h bu-h--her">${esc(T(c.s.her))}</div>
			${years.map((y, k) => `<div class="bu-year" style="--r:${k + 2}">${y}</div>${side(y, 'him', k + 2)}${side(y, 'her', k + 2)}`).join('')}
			<div class="bu-year bu-year--us" style="--r:${years.length + 2}">♥ 2009</div></div>`;
	},
	card: () => '',
	empty: false,
	related: ['story', 'family', 'atlas']
});
