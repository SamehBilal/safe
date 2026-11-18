import { L, esc, fmtDate } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* «تذاكر وفواتير» — the scrapbook: cinema tickets, train tickets, café receipts, entry tickets, kept with where and
   when they were. Top: a scrapbook spread on kraft paper, the newest stubs taped on at angles with a paper clip and
   a stamp. Each card is a ticket itself — torn notches, a perforated stub with the date. */

const KINDS = [
	['cinema', '🎬', 'سينما', 'Cinema'], ['train', '🚆', 'قطر', 'Train'], ['bus', '🚌', 'أتوبيس', 'Bus'], ['cafe', '☕', 'كافيه', 'Café'],
	['food', '🍽️', 'أكل', 'Food'], ['entry', '🎟️', 'تذكرة دخول', 'Entry ticket'], ['event', '🎤', 'حفلة أو إيفنت', 'Concert or event'],
	['gift', '🎁', 'هدية', 'Gift'], ['other', '🧾', 'غير كده', 'Other']
];
const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS.at(-1);
// a ticket number for the stub, the same every time for the same ticket
const serial = (id) => String([...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)).padStart(4, '0');
const TINT = { cinema: '#d9534f', train: '#0e6990', bus: '#e39b2d', cafe: '#8a5a2b', food: '#5a9e6f', entry: '#8e5bd1', event: '#f06292', gift: '#c2185b', other: '#37353f' };

export default listPage({
	id: 'tickets', kind: 'tickets', icon: 'scroll',
	title: ['تذاكر وفواتير', 'Tickets & receipts'], sub: ['كشكول ذكرياتنا: كل تذكرة وفاتورة احتفظنا بيها، وكانت فين وإمتى', 'Our scrapbook: every ticket and receipt we kept, and where and when'],
	add: ['لزّقوا تذكرة', 'Stick in a ticket'],
	fields: [
		{ n: 'type', t: 'sel', l: ['نوعها', 'Kind'], opts: KINDS.map(([v, e, ar, en]) => [v, `${e} ${ar}`, `${e} ${en}`]) },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'what', t: 'text', l: ['إيه هي؟', 'What was it?'], req: 1, ph: ['Fantastic Beasts', 'Fantastic Beasts'] },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'], ph: ['سيتي ستارز', 'City Stars'] },
		{ n: 'price', t: 'text', l: ['بكام؟', 'How much?'], ph: ['٦٠ جنيه', '60 EGP'] },
		{ n: 'photo', t: 'photo', l: ['صورة التذكرة', 'Photo of it'] },
		{ n: 'note', t: 'area', l: ['الحكاية', 'The story'], rows: 2 }
	],
	chips: { n: 'type', opts: KINDS.map(([v, e, ar, en]) => [v, `${e} ${ar}`, `${e} ${en}`]) },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items) => {
		const shown = items.slice(0, 4);
		const stubs = (shown.length ? shown : [{ type: 'cinema', what: L('أول سينما', 'First cinema'), date: '' }, { type: 'train', what: L('قطر طنطا', 'Tanta train'), date: '' }, { type: 'cafe', what: L('أول قهوة', 'First coffee'), date: '' }])
			.map((x, i) => { const [, e, ar, en] = kindOf(x.type); return `<span class="tk-stub" style="--i:${i};--t:${TINT[x.type] || TINT.other}">
				<span class="tk-stub-k">${e} ${esc(L(ar, en))}</span>
				<b dir="auto">${esc(shorten(x.what, 20))}</b>
				<small>${x.date ? esc(fmtDate(x.date)) : '··.··.····'}</small>
				<span class="tk-tape" aria-hidden="true"></span>
			</span>`; }).join('');
		return `<div class="tk-book">
			<span class="tk-clip" aria-hidden="true"></span>
			<p class="tk-title">${L('كشكول ذكرياتنا', 'Our scrapbook')}</p>
			<div class="tk-stubs">${stubs}</div>
			<span class="tk-stamp" aria-hidden="true">${L('محفوظة ♥', 'Kept ♥')}</span>
		</div>`;
	},
	card: (x, c) => { const [, e, ar, en] = kindOf(x.type); return `<article class="lp-card tk-card" style="--t:${TINT[x.type] || TINT.other}">
		<div class="tk-main">
			<p class="tk-k">${e} ${esc(L(ar, en))}</p>
			<h3 dir="auto">${esc(x.what)}</h3>
			${x.where ? `<p class="tk-where" dir="auto">📍 ${esc(x.where)}</p>` : ''}
			${c.photo(x)}
			${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
			${c.del(x)}
		</div>
		<div class="tk-side">
			<small>${L('التاريخ', 'Date')}</small><b>${x.date ? esc(fmtDate(x.date)) : '—'}</b>
			${x.price ? `<small>${L('السعر', 'Price')}</small><b dir="auto">${esc(x.price)}</b>` : ''}
			<span class="tk-no">№ ${serial(x.id)}</span>
		</div>
	</article>`; },
	empty: ['أول تذكرة تتلزّق هنا ♥', 'The first ticket goes here ♥'],
	related: ['gallery', 'onthisday', 'story']
});
