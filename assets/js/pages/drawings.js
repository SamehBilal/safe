import { L, esc, App } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* «رسومات الولاد» — the fridge door: every drawing the boys make, dated with how old they were, held up by magnets.
   Top: the fridge itself — its door and handle, the boys' names in letter magnets, and the three newest drawings
   pinned on with round magnets (crayon doodles stand in until the first one is added). The cards are pages on the
   same door, each under its own magnet. */

const MAGNETS = ['#d9534f', '#0e6990', '#e39b2d', '#5a9e6f', '#8e5bd1', '#f06292'];
// a child's crayon doodle for an empty spot on the door: a sun, a house, a stick family
const DOODLES = [
	'<circle cx="50" cy="42" r="18" fill="#fdc830" stroke="#e39b2d" stroke-width="3"/><path d="M50 12v10M50 62v10M20 42h10M70 42h10M29 21l7 7M64 56l7 7M29 63l7-7M64 28l7-7" stroke="#e39b2d" stroke-width="3" stroke-linecap="round"/>',
	'<path d="M22 50 50 26l28 24v28H22z" fill="#fdd5d8" stroke="#d9534f" stroke-width="3" stroke-linejoin="round"/><rect x="44" y="58" width="12" height="20" fill="#0e6990"/><path d="M14 80h72" stroke="#5a9e6f" stroke-width="4" stroke-linecap="round"/>',
	'<g fill="none" stroke="#37353f" stroke-width="3" stroke-linecap="round"><circle cx="30" cy="34" r="7"/><path d="M30 41v18M20 48h20M30 59l-7 13M30 59l7 13"/><circle cx="58" cy="30" r="8"/><path d="M58 38v20M47 46h22M58 58l-8 14M58 58l8 14"/><circle cx="78" cy="48" r="5"/><path d="M78 53v12M71 58h14M78 65l-4 8M78 65l4 8"/></g>'
];

export default listPage({
	id: 'drawings', kind: 'drawings', icon: 'pencil',
	title: ['رسومات الولاد', 'The boys’ drawings'], sub: ['باب التلاجة بتاعنا: كل رسمة رسموها، وكانوا قد إيه', 'Our fridge door: every drawing they made, and how old they were'],
	add: ['علّقوا رسمة على التلاجة', 'Stick a drawing on the fridge'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين رسمها؟', 'Who drew it?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'photo', t: 'photo', l: ['صورة الرسمة', 'Photo of the drawing'], req: 1 },
		{ n: 'title', t: 'text', l: ['دي رسمة إيه؟', 'What is it?'], ph: ['بابا وماما والعربية', 'Mum, Dad and the car'], full: 1 },
		{ n: 'note', t: 'area', l: ['قال عليها إيه؟', 'What did he say about it?'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items, c) => {
		const kids = c.kids.filter((k) => !k.born || new Date(k.born) <= new Date());
		// each name in letter magnets (no blank magnet for a space), a heart magnet between the names
		const letters = kids.map((k) => [...App.t(k.name)].filter((ch) => ch.trim())).reduce((all, n, i) => (i ? [...all, '♥', ...n] : n), []).slice(0, 16);
		const latest = items.filter((x) => x.photo).slice(0, 3);
		const spots = [0, 1, 2].map((i) => {
			const x = latest[i];
			const inner = x ? `<img data-sketch="${esc(x.photo)}" alt="${esc(x.title || '')}"><small dir="auto">${esc(shorten(x.title || c.kidName(x.kid), 18))}</small>`
				: `<svg viewBox="0 0 100 90" aria-hidden="true">${DOODLES[i]}</svg>`;
			return `<figure class="fd-pin" style="--i:${i};--m:${MAGNETS[(i * 2 + 1) % MAGNETS.length]}">${inner}</figure>`;
		}).join('');
		return `<div class="fd-fridge">
			<span class="fd-handle" aria-hidden="true"></span>
			<p class="fd-letters" aria-hidden="true">${letters.map((ch, i) => `<span style="--c:${MAGNETS[i % MAGNETS.length]};--r:${(i * 37) % 13 - 6}deg">${esc(ch)}</span>`).join('')}</p>
			<div class="fd-pins">${spots}</div>
			<span class="fd-heart" aria-hidden="true">♥</span>
		</div>`;
	},
	card: (x, c) => `<article class="lp-card fd-card" style="--m:${MAGNETS[(String(x.id).length + (x.date || '').length) % MAGNETS.length]};--r:${((String(x.id).charCodeAt(0) || 0) % 5) - 2}deg">
		<span class="fd-magnet" aria-hidden="true"></span>
		${c.photo(x)}
		<p class="lp-k">${esc(c.kidName(x.kid))}${x.date ? ` · ${c.date(x.date)}` : ''}${x.date && c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}</p>
		${x.title ? `<h3 dir="auto">${esc(x.title)}</h3>` : ''}
		${x.note ? `<p dir="auto">«${esc(x.note)}»</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول رسمة تتعلق هنا ♥', 'The first drawing goes up here ♥'],
	related: ['family', 'favorites', 'sayings']
});
