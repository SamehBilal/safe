import { L, esc, fmtDate } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* «تذاكر وفواتير» — the scrapbook: cinema tickets, train tickets, café receipts, entry tickets, kept with where and
   when they were. Top: a scrapbook spread on kraft paper — the newest ticket stuck in open, the ones before it on a
   thread beside it. Each card is a ticket itself — torn notches, a perforated stub with the date. */

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
		// like the home page's diary: the newest ticket stuck in open — its photo taped on, the date stamped, the story
		// written out — and the ones before it strung on a thread beside it, newest first
		const [top, ...rest] = items, more = rest.slice(0, 4);
		const pic = (x, cls) => `<span class="${cls}">${kindOf(x.type)[1]}${x.photo ? `<img data-sketch="${esc(x.photo)}" alt="">` : ''}</span>`;
		const open = top ? (() => { const [, e, ar, en] = kindOf(top.type); return `<a class="tk-open" href="#tk-${esc(top.id)}" tabindex="-1" style="--t:${TINT[top.type] || TINT.other}">
				<span class="tk-open__tab">${L('آخر تذكرة', 'Newest ticket')}</span>
				${pic(top, 'tk-open__pic')}
				<span class="tk-open__tx">
					<time>${top.date ? esc(fmtDate(top.date)) : '··.··.····'}</time>
					<small class="tk-open__k">${e} ${esc(L(ar, en))}</small>
					<b dir="auto">${esc(top.what)}</b>
					${top.where || top.price ? `<span class="tk-open__meta" dir="auto">${top.where ? `📍 ${esc(top.where)}` : ''}${top.where && top.price ? ' · ' : ''}${top.price ? esc(top.price) : ''}</span>` : ''}
					${top.note ? `<p dir="auto">${esc(top.note)}</p>` : ''}
				</span>
				<span class="tk-open__no">№ ${serial(top.id)}</span>
			</a>`; })() : `<span class="tk-open tk-open--empty" style="--t:${TINT.cinema}">
				<span class="tk-open__tab">${L('آخر تذكرة', 'Newest ticket')}</span>
				<span class="tk-open__pic">🎟️</span>
				<span class="tk-open__tx"><time>··.··.····</time><b>${L('أول تذكرة تتلزّق هنا', 'The first ticket goes here')}</b></span>
			</span>`;
		const thread = more.length ? `<div class="tk-thread">
				<p class="tk-thread__h">${L('واللي قبلها', 'And before that')}</p>
				<ol>${more.map((x) => `<li style="--t:${TINT[x.type] || TINT.other}"><a href="#tk-${esc(x.id)}" tabindex="-1">
					${pic(x, 'tk-thread__pic')}
					<span class="tk-thread__tx"><time>${x.date ? esc(fmtDate(x.date)) : '—'}</time><b dir="auto">${esc(shorten(x.what, 34))}</b></span>
				</a></li>`).join('')}</ol>
			</div>` : '';
		return `<div class="tk-book">
			<span class="tk-clip" aria-hidden="true"></span>
			<p class="tk-title">${L('كشكول ذكرياتنا', 'Our scrapbook')}</p>
			<div class="tk-spread${thread ? '' : ' is-solo'}">${open}${thread}</div>
			<span class="tk-stamp" aria-hidden="true">${L('محفوظة ♥', 'Kept ♥')}</span>
		</div>`;
	},
	card: (x, c) => { const [, e, ar, en] = kindOf(x.type); return `<article class="lp-card tk-card" id="tk-${esc(x.id)}" style="--t:${TINT[x.type] || TINT.other}">
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
