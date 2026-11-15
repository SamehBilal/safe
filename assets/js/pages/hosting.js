import { L, esc, num } from '../shell.js';
import { listPage } from '../listpage.js';

/* Hosting: who came over and who we visited, what was cooked, and who's due a visit back.
   Band: a front door that swings open and shut, a welcome mat, and the names of the last guests on little tags. */
export default listPage({
	id: 'hosting', kind: 'hosting', icon: 'family',
	title: ['عزايمنا', 'Hosting & visits'], sub: ['مين جالنا، رحنا لمين، وطبخنا إيه', 'Who came over, who we visited, and what we cooked'],
	add: ['سجّلوا عزومة', 'Log a visit'],
	fields: [
		{ n: 'dir', t: 'sel', l: ['جولنا ولا رحنالهم؟', 'Came to us, or we went?'], opts: [['in', 'جولنا', 'They came to us'], ['out', 'رحنالهم', 'We went to them']] },
		{ n: 'who', t: 'text', l: ['مين؟', 'Who?'], req: 1, grow: 1 },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'menu', t: 'text', l: ['المنيو', 'The menu'], full: 1 },
		{ n: 'note', t: 'area', l: ['حاجة نفتكرها', 'Something to remember'], rows: 2 },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'], full: 1 }
	],
	chips: { n: 'dir', opts: [['in', 'جولنا', 'They came'], ['out', 'رحنالهم', 'We went']] },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items) => {
		const names = [...new Set(items.map((x) => x.who))].slice(0, 4);
		return `<div class="hs-band"><div class="hs-frame"><span class="hs-door"><i></i></span></div><span class="hs-mat">${L('أهلًا', 'Welcome')}</span>
			<div class="hs-tags">${(names.length ? names : [L('العيلة', 'Family'), L('الصحاب', 'Friends')]).map((n, i) => `<span style="--i:${i}" dir="auto">${esc(n)}</span>`).join('')}</div>
			<p class="hs-n"><b>${num(items.filter((x) => x.dir !== 'out').length)}</b>${L('جولنا', 'came over')} · <b>${num(items.filter((x) => x.dir === 'out').length)}</b>${L('رحنالهم', 'we visited')}</p></div>`;
	},
	top: (items) => {
		// people who came to us more times than we went to them: we owe them a visit
		const by = new Map();
		for (const x of items) { const k = x.who.trim(); const v = by.get(k) || { in: 0, out: 0 }; v[x.dir === 'out' ? 'out' : 'in']++; by.set(k, v); }
		const owe = [...by].filter(([, v]) => v.in > v.out).map(([k]) => k);
		return owe.length ? `<p class="hs-owe">${L('عليهم زيارة ردّ:', 'We owe a visit to:')} ${owe.map((k) => `<b dir="auto">${esc(k)}</b>`).join('، ')}</p>` : '';
	},
	card: (x, c) => `<article class="lp-card">
		${c.photo(x)}
		<p class="lp-k">${x.dir === 'out' ? L('رحنالهم', 'We went') : L('جولنا', 'They came')} · ${c.date(x.date)}</p>
		<h3 dir="auto">${esc(x.who)}</h3>
		${x.menu ? `<p dir="auto">🍽 ${esc(x.menu)}</p>` : ''}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول عزومة تتسجل هنا ♥', 'The first visit goes here ♥'],
	related: ['recipes', 'famdays', 'family']
});
