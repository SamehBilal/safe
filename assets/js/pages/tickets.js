import { L, esc, fmtDate, num, $$ } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';

/* «تذاكر وفواتير» — the scrapbook: cinema tickets, train tickets, café receipts, entry tickets, kept with where and
   when they were. Top: the box office — a marquee sign with its bulbs «تذكرة لاتنين», and a roll of tickets unwinding
   from its spool, the newest ticket first, each a stub in its kind's colour with its date; under it a punch card that
   counts each kind. Each card below is a ticket itself — torn notches, a perforated stub with the date. */

const KINDS = [
	['cinema', 'clapper', 'سينما', 'Cinema'], ['train', 'train', 'قطر', 'Train'], ['bus', 'bus', 'أتوبيس', 'Bus'], ['cafe', 'coffee', 'كافيه', 'Café'],
	['food', 'dinner', 'أكل', 'Food'], ['entry', 'ticket', 'تذكرة دخول', 'Entry ticket'], ['event', 'music', 'حفلة أو إيفنت', 'Concert or event'],
	['gift', 'gift', 'هدية', 'Gift'], ['other', 'scroll', 'غير كده', 'Other']
];
const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS.at(-1);
// a ticket number for the stub, the same every time for the same ticket
const serial = (id) => String([...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)).padStart(4, '0');
const TINT = { cinema: '#d9534f', train: '#0e6990', bus: '#e39b2d', cafe: '#8a5a2b', food: '#5a9e6f', entry: '#8e5bd1', event: '#f06292', gift: '#c2185b', other: '#37353f' };
const tint = (x) => TINT[x.type] || TINT.other;

export default listPage({
	id: 'tickets', kind: 'tickets', icon: 'scroll',
	title: ['تذاكر وفواتير', 'Tickets & receipts'], sub: ['كشكول ذكرياتنا: كل تذكرة وفاتورة احتفظنا بيها، وكانت فين وإمتى', 'Our scrapbook: every ticket and receipt we kept, and where and when'],
	add: ['لزّقوا تذكرة', 'Stick in a ticket'],
	fields: [
		{ n: 'type', t: 'sel', l: ['نوعها', 'Kind'], opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'what', t: 'text', l: ['إيه هي؟', 'What was it?'], req: 1, ph: ['Fantastic Beasts', 'Fantastic Beasts'] },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'], ph: ['سيتي ستارز', 'City Stars'] },
		{ n: 'price', t: 'text', l: ['بكام؟', 'How much?'], ph: ['٦٠ جنيه', '60 EGP'] },
		{ n: 'photo', t: 'photo', l: ['صورة التذكرة', 'Photo of it'] },
		{ n: 'note', t: 'area', l: ['الحكاية', 'The story'], rows: 2 }
	],
	chips: { n: 'type', opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items) => {
		const roll = items.slice(0, 5);
		const used = KINDS.filter(([k]) => items.some((x) => (x.type || 'other') === k));
		const years = items.map((x) => String(x.date || '').slice(0, 4)).filter(Boolean).sort();
		const bulbs = (n) => Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join('');
		return `<div class="tkb">
			<div class="tkb-sign">
				<span class="tkb-bulbs tkb-bulbs--top">${bulbs(14)}</span>
				<p class="tkb-sign__h">${L('تذكرة لاتنين', 'Admit two')} <span aria-hidden="true">♥</span></p>
				<p class="tkb-sign__sub">${L('شبّاك ذكرياتنا', 'Our box office')}${years.length ? ` · ${num(+years[0]).replace(/[٬,]/g, '')}–${num(+years.at(-1)).replace(/[٬,]/g, '')}` : ''}</p>
				<span class="tkb-bulbs tkb-bulbs--bottom">${bulbs(14)}</span>
			</div>
			<div class="tkb-roll">
				<span class="tkb-spool"><span class="tkb-spool__in">${doodle('ticket', 30)}<b>${num(items.length)}</b><small>${L('تذكرة', items.length === 1 ? 'ticket' : 'tickets')}</small></span></span>
				<ol class="tkb-strip">${roll.length ? roll.map((x, i) => { const [, ic, ar, en] = kindOf(x.type); return `<li style="--t:${tint(x)};--i:${i}"><a href="#tk-${esc(x.id)}" tabindex="-1">
					<span class="tkb-t__k">${doodle(ic, 18)} ${esc(L(ar, en))}</span>
					<b dir="auto">${esc(shorten(x.what, 30))}</b>
					<time>${x.date ? esc(fmtDate(x.date)) : '—'}</time>
					<span class="tkb-t__no">№ ${serial(x.id)}</span>
				</a></li>`; }).join('') : `<li class="is-empty" style="--t:${TINT.cinema};--i:0"><span><span class="tkb-t__k">${doodle('ticket', 18)}</span><b>${L('أول تذكرة تتلزّق هنا', 'The first ticket goes here')}</b><time>··.··.····</time></span></li>`}</ol>
			</div>
			${used.length ? `<ul class="tkb-punch">${used.map(([k, ic, ar, en]) => { const n = items.filter((x) => (x.type || 'other') === k).length; return `<li style="--t:${TINT[k]}"><span class="tkb-punch__hole">${doodle(ic, 20)}</span><b>${num(n)}</b><small>${esc(L(ar, en))}</small></li>`; }).join('')}</ul>` : ''}
		</div>`;
	},
	/* the kind chips get their drawings */
	painted: (root) => {
		for (const c of $$('#lp-chips [data-v]', root)) if (c.dataset.v && !c.querySelector('svg')) c.insertAdjacentHTML('afterbegin', doodle(kindOf(c.dataset.v)[1], 16) + ' ');
	},
	card: (x, c) => { const [, ic, ar, en] = kindOf(x.type); return `<article class="lp-card tk-card" id="tk-${esc(x.id)}" style="--t:${tint(x)}">
		<div class="tk-main">
			<p class="tk-k">${doodle(ic, 18)} ${esc(L(ar, en))}</p>
			<h3 dir="auto">${esc(x.what)}</h3>
			${x.where ? `<p class="tk-where" dir="auto">${doodle('pin', 16)} ${esc(x.where)}</p>` : ''}
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
