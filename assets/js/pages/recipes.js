import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* Our recipes: what we cook together — ingredients, steps, a photo, and who makes it best.
   Band: a pot on the stove with steam curling up, the latest dishes' names drifting off in the steam. */
export default listPage({
	id: 'recipes', kind: 'recipes', icon: 'dinner',
	title: ['نطبخ إيه', 'Our recipes'], sub: ['الأكلات اللي بنعملها سوا، ومين بيعملها أحسن', 'What we cook together, and who makes it best'],
	add: ['ضيفوا أكلة', 'Add a recipe'],
	fields: [
		{ n: 'name', t: 'text', l: ['اسم الأكلة', 'Dish'], req: 1, grow: 1 },
		{ n: 'best', t: 'sel', l: ['مين بيعملها أحسن؟', 'Who makes it best?'], opts: 'whoBoth' },
		{ n: 'time', t: 'text', l: ['بتاخد قد إيه؟', 'How long?'], ph: ['ساعة', 'An hour'] },
		{ n: 'ingredients', t: 'area', l: ['المكونات (كل حاجة في سطر)', 'Ingredients (one per line)'], rows: 4 },
		{ n: 'steps', t: 'area', l: ['الطريقة (كل خطوة في سطر)', 'Method (one step per line)'], rows: 5 },
		{ n: 'photo', t: 'photo', l: ['صورة الأكلة', 'A photo of it'], full: 1 }
	],
	chips: { n: 'best', opts: 'whoBoth' },
	sort: (a, b) => String(a.name).localeCompare(String(b.name), 'ar'),
	band: (items) => {
		const names = (items.length ? items.slice(-3).map((x) => x.name) : [L('محشي', 'Mahshi'), L('مكرونة بشاميل', 'Béchamel'), L('ملوخية', 'Molokhia')]);
		return `<div class="rc-band"><div class="rc-steam">${names.map((n, i) => `<span style="--i:${i}" dir="auto">${esc(shorten(n, 16))}</span>`).join('')}</div>
			<svg class="rc-pot" viewBox="0 0 220 150"><path class="rc-steamline" d="M80 40c-10-14 10-22 0-36M110 40c-10-14 10-22 0-36M140 40c-10-14 10-22 0-36"/><rect x="40" y="52" width="140" height="70" rx="14"/><rect x="28" y="46" width="164" height="12" rx="6"/><rect x="96" y="34" width="28" height="12" rx="6"/><path class="rc-handle" d="M40 70H18M180 70h22"/><path class="rc-fire" d="M70 140c-6-10 8-14 0-26 14 8 12 18 6 26ZM110 142c-8-12 10-18 0-32 18 10 14 22 8 32ZM150 140c-6-10 8-14 0-26 14 8 12 18 6 26Z"/></svg></div>`;
	},
	card: (x, c) => {
		const lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean);
		return `<article class="lp-card rc-card">
		${c.photo(x)}
		<p class="lp-k">${x.best ? `${L('أحسن واحد بيعملها:', 'Best made by:')} ${esc(c.whoName(x.best))}` : ''}${x.time ? ` · ⏱ ${esc(x.time)}` : ''}</p>
		<h3 dir="auto">${esc(x.name)}</h3>
		${x.ingredients || x.steps ? `<details><summary>${L('المكونات والطريقة', 'Ingredients & method')}</summary>
			${lines(x.ingredients).length ? `<ul dir="auto">${lines(x.ingredients).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
			${lines(x.steps).length ? `<ol dir="auto">${lines(x.steps).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : ''}
		</details>` : ''}
		${c.del(x)}
	</article>`;
	},
	empty: ['أول أكلة تتكتب هنا ♥', 'The first recipe goes here ♥'],
	related: ['food', 'draw', 'hosting']
});
