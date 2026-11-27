import { L, esc, num } from '../shell.js';
import { listPage } from '../listpage.js';

/* Our homes: every home in our story — the family homes we grew up in, the first flat, the one we're in now — with a
   photo, the years we lived there, where it is and something we remember about it.
   Band: a little street of houses, one for every home in the order we lived in them, its years on its door. */

const KINDS = [['ours', 'بيتنا', 'Our home'], ['family', 'بيت العيلة', 'Family home'], ['before', 'قبل الجواز', 'Before we married'], ['stay', 'قعدنا فيه فترة', 'We stayed a while']];
const kindName = (k) => { const x = KINDS.find((y) => y[0] === k); return x ? L(x[1], x[2]) : ''; };
const years = (x) => `${num(x.from || '').replace(/[٬,]/g, '')}${x.to ? ` – ${num(x.to).replace(/[٬,]/g, '')}` : ` – ${L('لحد دلوقتي', 'now')}`}`;
const TONES = ['#f6c9b6', '#cfe3d4', '#f3e1a6', '#c9d8f0', '#e7cfe8'];

export default listPage({
	id: 'homes', kind: 'homes', icon: 'house',
	title: ['بيوتنا', 'Our homes'], sub: ['كل بيت عشنا فيه حتة من حكايتنا', 'Every home we lived in, a piece of our story'],
	add: ['ضيفوا بيت', 'Add a home'],
	fields: [
		{ n: 'name', t: 'text', l: ['البيت', 'The home'], req: 1, grow: 1, ph: L('أول شقة لينا', 'Our first flat') },
		{ n: 'kind', t: 'sel', l: ['البيت ده كان…', 'This home was…'], opts: KINDS },
		{ n: 'from', t: 'num', l: ['من سنة', 'From (year)'], req: 1, min: 1950, step: 1 },
		{ n: 'to', t: 'num', l: ['لحد سنة (فاضي لو لسه فيه)', 'Until (empty if still there)'], min: 1950, step: 1 },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'], full: 1 },
		{ n: 'note', t: 'area', l: ['حاجة نفتكرها عنه', 'Something we remember about it'], rows: 3 },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'], full: 1 }
	],
	chips: { n: 'kind', opts: KINDS },
	sort: (a, b) => (+a.from || 0) - (+b.from || 0),
	band: (items) => {
		const list = items.length ? [...items].sort((a, b) => (+a.from || 0) - (+b.from || 0)).slice(-6) : [{ name: L('بيتنا', 'Our home'), from: '' }, { name: L('بيت العيلة', 'Family home'), from: '' }, { name: L('البيت الجاي', 'The next one'), from: '' }];
		return `<div class="hm-band"><div class="hm-street">${list.map((x, i) => `<div class="hm-house" style="--i:${i};--tone:${TONES[i % TONES.length]};--h:${70 + ((i * 23) % 40)}px">
			<span class="hm-roof" aria-hidden="true"></span><span class="hm-body"><i class="hm-win"></i><i class="hm-win"></i><span class="hm-door">${x.from ? num(x.from).replace(/[٬,]/g, '') : ''}</span></span>
			<b dir="auto">${esc(x.name || '')}</b></div>`).join('')}</div><span class="hm-road" aria-hidden="true"></span></div>`;
	},
	card: (x, c) => `<article class="lp-card hm-card">
		${c.photo(x)}
		<p class="lp-k">${kindName(x.kind)}${x.kind ? ' · ' : ''}${years(x)}</p>
		<h3 dir="auto">${esc(x.name)}</h3>
		${x.where ? `<p class="hm-where" dir="auto">${esc(x.where)}</p>` : ''}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول بيت يتسجل هنا ♥', 'The first home goes here ♥'],
	related: ['family', 'atlas', 'years']
});
