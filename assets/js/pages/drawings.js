import { L, esc, App } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* «رسومات الولاد» — the fridge door: every drawing the boys make, dated with how old they were, held up by magnets.
   The cards are pages on the fridge door, each under its own magnet. */

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
	/* above the title: the boys' art corner — an easel with a sheet of paper where a crayon drawing draws itself, stroke by
	   stroke (a sun, our house, the four of us holding hands, a heart), the boys' names written across the top in crayon,
	   a box of crayons at its foot; and beside it a string with the three newest drawings hung on clothes pegs, swaying */
	band: (items, c) => {
		const kids = c.kids.filter((k) => !k.born || new Date(k.born) <= new Date());
		const names = kids.map((k, i) => `<span style="--c:${MAGNETS[(i * 3) % MAGNETS.length]}">${esc(App.t(k.name))}</span>`).join(`<i>${L('و', '&')}</i>`);
		const latest = items.filter((x) => x.photo).slice(0, 3);
		const hung = [0, 1, 2].map((i) => {
			const x = latest[i];
			const inner = x ? `<img data-sketch="${esc(x.photo)}" alt="${esc(x.title || '')}"><small dir="auto">${esc(shorten(x.title || c.kidName(x.kid), 16))}</small>`
				: `<svg viewBox="0 0 100 90" aria-hidden="true">${DOODLES[i]}</svg>`;
			return `<figure class="dwb-hung" style="--i:${i}"><span class="dwb-peg" aria-hidden="true"></span>${inner}</figure>`;
		}).join('');
		// the crayon drawing on the easel: each stroke drawn in turn
		const st = (d, col, i, w = 4) => `<path class="dwb-st" pathLength="1" d="${d}" stroke="${col}" stroke-width="${w}" style="--i:${i}"/>`;
		const fig = (x, y, h, col, i) => st(`M${x} ${y}m-${h * 0.16} 0a${h * 0.16} ${h * 0.16} 0 1 0 ${h * 0.32} 0a${h * 0.16} ${h * 0.16} 0 1 0 -${h * 0.32} 0M${x} ${y + h * 0.16}v${h * 0.45}M${x - h * 0.28} ${y + h * 0.35}h${h * 0.56}M${x} ${y + h * 0.61}l-${h * 0.2} ${h * 0.32}M${x} ${y + h * 0.61}l${h * 0.2} ${h * 0.32}`, col, i, 3.5);
		const drawing = [
			st('M8 128q24-9 48 0t48 0 48 0 48 0', '#5a9e6f', 0, 6),
			st('M168 34m-13 0a13 13 0 1 0 26 0a13 13 0 1 0-26 0M168 12v-7M168 56v7M146 34h-7M190 34h7M152 18l-5-5M184 50l5 5M152 50l-5 5M184 18l5-5', '#fdc830', 1),
			st('M30 122V80l34-28 34 28v42Z', '#d9534f', 2, 5),
			st('M56 122v-24h16v24M38 92h12v10H38Z', '#0e6990', 3),
			fig(122, 82, 40, '#37353f', 4), fig(144, 80, 42, '#c2185b', 5), fig(163, 96, 26, '#e39b2d', 6), fig(178, 102, 20, '#5a9e6f', 7),
			st('M110 52c-6-8-18-2-10 8l10 9 10-9c8-10-4-16-10-8Z', '#f06292', 9, 3.5)
		].join('');
		return `<div class="dwb" aria-hidden="true">
			<div class="dwb-easel">
				<svg class="dwb-legs" viewBox="0 0 240 260"><path d="M70 40 30 255M170 40l40 215M120 30v228M40 206h160" /></svg>
				<div class="dwb-paper">
					<b class="dwb-names">${names}</b>
					<svg class="dwb-drawing" viewBox="0 0 200 140">${drawing}</svg>
				</div>
				<span class="dwb-tray"></span>
				<span class="dwb-crayons">${MAGNETS.slice(0, 5).map((m, i) => `<i style="--c:${m};--i:${i}"></i>`).join('')}</span>
			</div>
			<div class="dwb-line">
				<svg class="dwb-string" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 8Q200 58 400 8"/></svg>
				<div class="dwb-hangs">${hung}</div>
			</div>
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
