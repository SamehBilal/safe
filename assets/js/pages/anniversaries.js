import { L, Y, esc, num, img } from '../shell.js';
import { listPage } from '../listpage.js';

/* Our anniversaries: every wedding anniversary on one page — what we did, a photo, the gift — one card per year since
   the wedding, waiting to be filled in. Band: two rings rolling together, and the count of years spinning up. */
const wedding = (s) => (s.timeline || []).find((x) => x.id === 'wedding')?.date || '2020-09-10';
const years = (s) => { const w = new Date(wedding(s)), now = new Date(); let n = now.getFullYear() - w.getFullYear(); if (now < new Date(now.getFullYear(), w.getMonth(), w.getDate())) n--; return Math.max(0, n); };

export default listPage({
	id: 'anniversaries', kind: 'anniversaries', icon: 'ring',
	title: ['عيد جوازنا', 'Our anniversaries'], sub: ['كل سنة من جوازنا، وعملنا فيها إيه', 'Every year of our marriage, and how we celebrated it'],
	add: ['ضيفوا سنة', 'Add a year'],
	fields: [
		{ n: 'n', t: 'num', l: ['السنة رقم كام؟', 'Which anniversary?'], req: 1, min: 1, step: 1 },
		{ n: 'did', t: 'text', l: ['عملنا إيه؟', 'What did we do?'], grow: 1 },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'] },
		{ n: 'gifts', t: 'text', l: ['الهدايا', 'The gifts'], full: 1 },
		{ n: 'note', t: 'area', l: ['أحلى حاجة في اليوم ده', 'The best part of the day'], rows: 2 },
		{ n: 'photo', t: 'photo', l: ['صورة', 'A photo'], full: 1 }
	],
	prepare: (x) => { x.n = Math.round(x.n); },
	sort: (a, b) => b.n - a.n,
	band: (items, ctx) => `<div class="an-band"><span class="an-ring an-ring--1"></span><span class="an-ring an-ring--2"></span>
		<p class="an-n"><b>${num(years(ctx.s))}</b><small>${L('سنين جواز', 'years married')}</small></p></div>`,
	top: (items, ctx) => {
		const n = years(ctx.s), w = wedding(ctx.s);
		const missing = Array.from({ length: n }, (_, i) => i + 1).filter((k) => !items.some((x) => x.n === k));
		return `${missing.length ? `<p class="lp-note an-miss">${L('سنين لسه مستنية تتكتب:', 'Years still waiting to be written:')} ${missing.map((k) => `<b>${num(k)}</b>`).join(' ')}</p>` : ''}
			<p class="lp-note an-next">${L('عيد الجواز الجاي:', 'Next anniversary:')} ${num(n + 1)} — ${esc(new Date(new Date(w).setFullYear(new Date(w).getFullYear() + n + 1)).toLocaleDateString(L('ar-EG', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }))}</p>`;
	},
	card: (x, c) => `<article class="lp-card an-card">
		<span class="an-badge">${num(x.n)}</span>
		${c.photo(x)}
		<p class="lp-k">${num(new Date(wedding(c.s)).getFullYear() + x.n)}${x.where ? ` · ${esc(x.where)}` : ''}</p>
		${x.did ? `<h3 dir="auto">${esc(x.did)}</h3>` : ''}
		${x.gifts ? `<p dir="auto">🎁 ${esc(x.gifts)}</p>` : ''}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['اكتبوا أول سنة جواز ♥', 'Write our first year ♥'],
	related: ['trips', 'gifts', 'calendar']
});
