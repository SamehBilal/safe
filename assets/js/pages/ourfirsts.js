import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* Our firsts as a couple: first meeting, first «I love you», first gift, first trip, first fight…
   Band: a string of fairy lights, one bulb lighting up for each first we've written down. */
const IDEAS = [['أول مقابلة', 'First meeting'], ['أول «بحبك»', 'First “I love you”'], ['أول هدية', 'First gift'], ['أول خروجة لوحدنا', 'First date alone'], ['أول رحلة', 'First trip'], ['أول خناقة', 'First fight'], ['أول صلح', 'First making up'], ['أول صورة سوا', 'First photo together'], ['أول أكلة طبختهالك', 'First meal I cooked for you'], ['أول ليلة في بيتنا', 'First night in our home']];

export default listPage({
	id: 'ourfirsts', kind: 'ourfirsts', icon: 'heart',
	title: ['أول مرة لينا', 'Our firsts'], sub: ['كل أول مرة عشناها إحنا الاتنين', 'Every first the two of us lived'],
	add: ['ضيفوا أول مرة', 'Add a first'],
	fields: [
		{ n: 'what', t: 'text', l: ['أول مرة إيه؟', 'First what?'], req: 1, ideas: IDEAS, grow: 1 },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'] },
		{ n: 'note', t: 'area', l: ['حصل إزاي؟', 'How did it happen?'] },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'], full: 1 }
	],
	sort: (a, b) => String(a.date || '9').localeCompare(String(b.date || '9')),
	band: (items) => {
		const names = items.map((x) => x.what);
		const n = Math.max(12, names.length + 3);
		return `<svg class="of-svg" viewBox="0 0 1000 200"><path class="of-wire" d="M0 40 Q 250 130 500 60 T 1000 50"/>
			${Array.from({ length: n }, (_, i) => { const t = (i + 0.5) / n, x = t * 1000, y = 40 + Math.sin(t * Math.PI * 2) * 36 + 30 * t; const on = i < names.length; return `<g class="of-bulb${on ? ' is-on' : ''}" style="--i:${i}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><rect x="-4" y="-2" width="8" height="8" rx="2"/><path d="M0 6c-9 0-12 10-12 16a12 12 0 0 0 24 0c0-6-3-16-12-16Z"/>${on ? `<text y="52" text-anchor="middle">${esc(shorten(names[i], 14))}</text>` : ''}</g>`; }).join('')}</svg>`;
	},
	card: (x, c) => `<article class="lp-card">
		${c.photo(x)}
		<p class="lp-k">${c.date(x.date)}${x.where ? ` · ${esc(x.where)}` : ''}</p>
		<h3 dir="auto">${esc(x.what)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول «أول مرة» لينا هتتكتب هنا ♥', 'Our first “first” goes here ♥'],
	related: ['story', 'chapters', 'journal']
});
