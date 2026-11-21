import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';

/* What the boys said: the funny words, the made-up ones and the things they get wrong, with their age when they said it.
   Band: a comic page — each of the boys with a big speech bubble of the last thing he said, confetti falling, «هههه»
   scribbled around, and how many sayings we've kept. Each saying is a speech bubble in his colour, a little tilted,
   with his sticker on the corner and «يقصد…» on a yellow sticky note. */
const COLORS = ['#e39b2d', '#5a9e6f', '#8e5bd1', '#0e6990'];
const colorOf = (c, id) => c.kidOf(id)?.color || COLORS[Math.max(0, c.kids.findIndex((k) => k.id === id)) % COLORS.length];
const CONFETTI = Array.from({ length: 18 }, (_, i) => `<i style="--x:${(i * 41) % 100}%;--d:${2.6 + (i % 5) * 0.5}s;--delay:-${(i * 0.37) % 3}s;--c:${['#fdc830', '#f2726f', '#5a9e6f', '#8e5bd1', '#13789f'][i % 5]};--r:${(i * 67) % 360}deg"></i>`).join('');

export default listPage({
	id: 'sayings', kind: 'sayings', icon: 'laugh',
	title: ['كلام الولاد', 'What the boys said'], sub: ['كل كلمة حلوة قالوها، قبل ما يكبروا وننساها', 'Every funny thing they said, before they grow up and we forget'],
	add: ['ضيفوا كلمة', 'Add a saying'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'said', t: 'text', l: ['قال إيه؟', 'What did he say?'], req: 1, grow: 1, full: 1 },
		{ n: 'means', t: 'text', l: ['يقصد إيه؟', 'What did he mean?'], full: 1 },
		{ n: 'note', t: 'area', l: ['الحكاية', 'The story'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items, c) => {
		const kids = c.kids.length ? c.kids : [{ id: '', name: { ar: 'الولاد', en: 'The boys' }, emoji: 'laugh' }];
		return `<div class="sy-comic">
			<span class="sy-confetti" aria-hidden="true">${CONFETTI}</span>
			<span class="sy-ha sy-ha--1" aria-hidden="true">${L('هههه', 'haha')}</span><span class="sy-ha sy-ha--2" aria-hidden="true">${L('ههههههه', 'hahaha')}</span><span class="sy-ha sy-ha--3" aria-hidden="true">!!</span>
			${kids.map((k, i) => {
				const last = items.find((x) => x.kid === k.id) || (i === 0 ? items[0] : null);
				return `<figure class="sy-kid" style="--c:${esc(colorOf(c, k.id))};--i:${i}">
					<blockquote class="sy-speech" dir="auto">${last ? `«${esc(shorten(last.said, 46))}»` : L('مستنيين أول كلمة…', 'Waiting for the first word…')}</blockquote>
					<span class="sy-face">${doodle(k.emoji || 'laugh', 44)}</span>
					<figcaption>${esc(c.kidName(k.id) || L('الولاد', 'The boys'))}</figcaption>
				</figure>`;
			}).join('')}
			<p class="sy-count"><b>${num(items.length)}</b> ${L('كلمة حلوة لحد دلوقتي', items.length === 1 ? 'funny saying so far' : 'funny sayings so far')}</p>
		</div>`;
	},
	card: (x, c) => `<article class="lp-card sy-card" style="--c:${esc(colorOf(c, x.kid))}">
		<span class="sy-card__face" aria-hidden="true">${doodle(c.kidOf(x.kid)?.emoji || 'laugh', 30)}</span>
		<blockquote class="sy-card__said" dir="auto">«${esc(x.said)}»</blockquote>
		<p class="sy-card__who"><b>${esc(c.kidName(x.kid))}</b>${x.date && c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}${x.date ? ` · ${c.date(x.date)}` : ''}</p>
		${x.means ? `<p class="sy-card__means" dir="auto"><b>${L('يقصد:', 'Meaning:')}</b> ${esc(x.means)}</p>` : ''}
		${x.note ? `<p class="sy-card__note" dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول كلمة حلوة تتكتب هنا ♥', 'The first funny saying goes here ♥'],
	related: ['family', 'firsts', 'capsule']
});
