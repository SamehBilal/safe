import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* What the boys said: the funny words, the made-up ones and the things they get wrong, with their age when they said it.
   Band: alphabet blocks tumbling into place, then speech bubbles with their latest sayings. */
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
	band: (items) => {
		const said = items.slice(0, 3).map((x) => x.said);
		return `<div class="sy-band"><div class="sy-blocks">${['أ', 'ب', 'ت', 'A', 'B', 'C'].map((ch, i) => `<span class="sy-block" style="--i:${i}">${ch}</span>`).join('')}</div>
			<div class="sy-bubbles">${(said.length ? said : [L('ماما أنا جعان أوي خالص', 'Mama I’m sooo hungry')]).map((x, i) => `<p class="sy-bubble" style="--i:${i}" dir="auto">«${esc(shorten(x, 34))}»</p>`).join('')}</div></div>`;
	},
	card: (x, c) => `<article class="lp-card sy-card">
		<p class="lp-k">${esc(c.kidName(x.kid))}${x.date ? ` · ${c.date(x.date)}` : ''}${x.date && c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}</p>
		<blockquote dir="auto">«${esc(x.said)}»</blockquote>
		${x.means ? `<p class="sy-means" dir="auto">${L('يقصد:', 'Meaning:')} ${esc(x.means)}</p>` : ''}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول كلمة حلوة تتكتب هنا ♥', 'The first funny saying goes here ♥'],
	related: ['family', 'firsts', 'capsule']
});
