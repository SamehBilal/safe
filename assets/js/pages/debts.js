import { L, Y, esc, num, $$ } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import { mark, markSVG } from '../checkfx.js';
import * as live from '../live.js';

/* «ديوننا»: what we owe and what's owed to us — the bank loan, the car's installments, the «جمعية», what a friend
   borrowed. Each one has whom, how much, the monthly installment and when it's due; every payment is written down
   («دفعنا قسط») and the bar fills until it's paid off (a pen checkmark). Above the title a balance: what's on us in
   one pan, what's ours in the other, the beam leaning to the heavier side. Shared: content/live/debts.bin; the
   monthly installments also count in «مصاريف الشهر», the due dates show in the calendar. */

export const DIRS = [['out', 'علينا', 'We owe'], ['in', 'لينا', 'Owed to us']];
export const DKINDS = [
	['bank', 'house', 'قرض بنك', 'Bank loan'], ['install', 'calendar', 'تقسيط', 'Installments'], ['card', 'coins', 'بطاقة ائتمان', 'Credit card'],
	['gamaya', 'heart', 'جمعية', 'A «gamaya»'], ['person', 'handshake', 'سلف من حد', 'Borrowed from someone'], ['lent', 'handshake', 'سلفناه لحد', 'We lent it'], ['other', 'star', 'حاجة تانية', 'Something else']
];
const kindOf = (k) => DKINDS.find((x) => x[0] === k) || DKINDS.at(-1);
export const paidOf = (x) => (x.paid || []).reduce((a, p) => a + (+p.a || 0), 0);
export const leftOf = (x) => Math.max(0, (+x.amount || 0) - paidOf(x));
export const isOver = (x) => (+x.amount || 0) > 0 && leftOf(x) <= 0;
export const money = (n) => `${num(Math.round(+n || 0))} ${L('ج', 'EGP')}`;
const daysTo = (iso) => Math.round((new Date(iso + 'T00:00') - new Date(live.today() + 'T00:00')) / 864e5);

export default listPage({
	id: 'debts', kind: 'debts', icon: 'coins',
	title: ['ديوننا', 'Our debts'], sub: ['اللي علينا واللي لينا — كل قسط بنكتبه لحد ما نخلص ♥', 'What we owe and what’s owed to us — every payment written down until it’s paid off ♥'],
	add: ['ضيفوا دين', 'Add a debt'],
	fields: [
		{ n: 'dir', t: 'sel', l: ['علينا ولا لينا؟', 'Do we owe it, or are we owed?'], opts: DIRS },
		{ n: 'whom', t: 'text', l: ['لمين / من مين؟', 'To or from whom?'], req: 1, ph: ['بنك مصر، عمو أحمد…', 'Banque Misr, Uncle Ahmed…'], grow: 1 },
		{ n: 'dkind', t: 'sel', l: ['نوعه', 'What kind'], opts: DKINDS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'amount', t: 'num', l: ['المبلغ كله (جنيه)', 'The whole amount (EGP)'], req: 1, ph: ['٥٠٠٠٠', '50000'] },
		{ n: 'monthly', t: 'num', l: ['القسط الشهري (اختياري)', 'Monthly installment (optional)'], ph: ['٢٠٠٠', '2000'] },
		{ n: 'payday', t: 'num', l: ['بيتدفع يوم كام في الشهر؟', 'Paid on which day of the month?'], min: 1, ph: ['٥', '5'] },
		{ n: 'due', t: 'date', l: ['آخر ميعاد (اختياري)', 'Final due date (optional)'] },
		{ n: 'who', t: 'sel', l: ['مين ماسكه؟', 'Who’s handling it?'], opts: 'whoBoth' },
		{ n: 'paidSoFar', t: 'num', l: ['دفعنا منه كام لحد دلوقتي؟', 'Paid so far (if any)'], ph: ['٠', '0'] },
		{ n: 'note', t: 'area', l: ['تفاصيل', 'Details'], rows: 2 }
	],
	prepare: (x) => {
		x.dir = x.dir || 'out';
		if (x.paidSoFar > 0) x.paid = [{ d: live.today(), a: x.paidSoFar, first: 1 }];
		delete x.paidSoFar;
		if (x.payday) x.payday = Math.min(31, Math.max(1, Math.round(x.payday)));
	},
	chips: { n: 'dir', opts: DIRS },
	sort: (a, b) => isOver(a) - isOver(b) || (a.dir === 'in') - (b.dir === 'in') || String(a.due || '9999').localeCompare(String(b.due || '9999')) || leftOf(b) - leftOf(a),
	band: (items) => {
		const open = items.filter((x) => !isOver(x));
		const out = open.filter((x) => x.dir !== 'in').reduce((a, x) => a + leftOf(x), 0);
		const inn = open.filter((x) => x.dir === 'in').reduce((a, x) => a + leftOf(x), 0);
		const tilt = out === inn ? 0 : Math.max(-12, Math.min(12, ((out - inn) / Math.max(out, inn)) * 12));
		const pan = (cls, label, sum, list) => `<div class="db-pan ${cls}">
			<svg class="db-pan__str" viewBox="0 0 80 60"><path d="M40 3 6 58M40 3l34 55"/><circle cx="40" cy="4" r="3.5"/></svg>
			<div class="db-pan__dish">${list.slice(0, 4).map((x, i) => `<span class="db-coin" style="--i:${i}">${esc([...String(x.whom || '?')][0])}</span>`).join('')}</div>
			<p class="db-pan__lbl">${esc(label)}</p>
			<b class="db-pan__sum">${money(sum)}</b>
		</div>`;
		/* in RTL the first pan sits on the right: «علينا» there, «لينا» on the left; the beam tips toward the heavier one */
		return `<div class="db-b">
			<div class="db-scale" style="--tilt:${tilt}deg">
				<span class="db-post"></span><span class="db-base"></span><span class="db-pivot"></span>
				<div class="db-beam">
					${pan('db-pan--out', L('علينا', 'We owe'), out, open.filter((x) => x.dir !== 'in'))}
					${pan('db-pan--in', L('لينا', 'Owed to us'), inn, open.filter((x) => x.dir === 'in'))}
				</div>
			</div>
			<div class="db-ledger">
				<p class="db-ledger__h">${doodle('pen', 18)} ${L('دفتر الأقساط', 'The installments book')}</p>
				<ul>${open.filter((x) => x.dir !== 'in' && x.monthly).slice(0, 4).map((x) => `<li><span dir="auto">${esc(shorten(x.whom, 20))}</span><i></i><b>${money(x.monthly)}</b></li>`).join('') || `<li class="is-calm">${L('مفيش أقساط شهرية ♥', 'No monthly installments ♥')}</li>`}</ul>
				${items.some(isOver) ? `<p class="db-ledger__done">${doodle('heart', 14)} ${L(`خلّصنا ${num(items.filter(isOver).length)}`, `${items.filter(isOver).length} paid off`)}</p>` : ''}
			</div>
		</div>`;
	},
	top: (items) => {
		if (!items.length) return '';
		const open = items.filter((x) => !isOver(x)), mine = open.filter((x) => x.dir !== 'in');
		const left = mine.reduce((a, x) => a + leftOf(x), 0);
		const paid = items.filter((x) => x.dir !== 'in').reduce((a, x) => a + paidOf(x), 0);
		const monthly = mine.reduce((a, x) => a + (+x.monthly || 0), 0);
		const owed = open.filter((x) => x.dir === 'in').reduce((a, x) => a + leftOf(x), 0);
		return `<ul class="db-sum">
			<li style="--c:#d9534f"><b>${money(left)}</b><small>${L('باقي علينا', 'Still to pay')}</small></li>
			<li style="--c:#5a9e6f"><b>${money(paid)}</b><small>${L('دفعنا لحد دلوقتي', 'Paid so far')}</small></li>
			<li style="--c:#e39b2d"><b>${money(monthly)}</b><small>${L('أقساط كل شهر', 'Installments a month')}</small></li>
			<li style="--c:#0e6990"><b>${money(owed)}</b><small>${L('لينا عند الناس', 'Owed to us')}</small></li>
		</ul>`;
	},
	card: (x, c) => {
		const [, kic, kar, ken] = kindOf(x.dkind), over = isOver(x), paid = paidOf(x), total = +x.amount || 0, inn = x.dir === 'in';
		const pct = total ? Math.min(100, Math.round((paid / total) * 100)) : 0;
		const d = x.due && !over ? daysTo(x.due) : null;
		const pays = [...(x.paid || [])].sort((a, b) => String(b.d).localeCompare(String(a.d))).slice(0, 4);
		const step = Math.min(leftOf(x), +x.monthly || leftOf(x));
		return `<article class="lp-card db-card${over ? ' is-done' : ''}${inn ? ' is-in' : ''}" id="db-${esc(x.id)}" style="--p:${pct}%">
			<header class="db-card__hd">
				<span class="db-card__kind">${doodle(kic, 18)} ${esc(L(kar, ken))}</span>
				<span class="db-card__dir">${inn ? L('لينا', 'Owed to us') : L('علينا', 'We owe')}</span>
			</header>
			<div class="db-card__main">
				<span class="db-card__box">${markSVG('checkmark')}</span>
				<h3 dir="auto">${esc(x.whom)}</h3>
			</div>
			<p class="db-card__nums"><b>${money(leftOf(x))}</b> <small>${over ? L('خلصنا ♥', 'paid off ♥') : L(`باقي من ${money(total)}`, `left of ${money(total)}`)}</small></p>
			<div class="db-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span></span><em>${num(pct)}٪</em></div>
			<p class="db-card__meta">
				${x.monthly ? `<span>${doodle('calendar', 15)} ${L(`قسط ${money(x.monthly)}`, `${money(x.monthly)} a month`)}${x.payday ? L(` يوم ${num(x.payday)}`, ` on the ${x.payday}th`) : ''}</span>` : ''}
				${x.due ? `<span class="${d !== null && d < 0 ? 'is-late' : d !== null && d <= 14 ? 'is-near' : ''}">${doodle('clock', 15)} ${L('آخر ميعاد', 'Due')} ${c.date(x.due)}${d !== null && d < 0 ? ` — ${L('فات', 'overdue')}` : ''}</span>` : ''}
				${x.who ? `<span>${doodle('handshake', 15)} ${esc(c.whoName(x.who))}</span>` : ''}
			</p>
			${x.note ? `<p class="db-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			${pays.length ? `<ol class="db-pays">${pays.map((p) => `<li><span>${c.date(p.d)}</span><i></i><b>${money(p.a)}</b></li>`).join('')}${(x.paid || []).length > 4 ? `<li class="is-more">${L(`و${num(x.paid.length - 4)} قبلهم`, `and ${x.paid.length - 4} before`)}</li>` : ''}</ol>` : ''}
			${live.canWrite() ? `<div class="db-card__act">
				${over ? '' : `<label class="f db-pay"><span>${inn ? L('رجعلنا كام؟', 'How much came back?') : L('دفعنا كام؟', 'How much did we pay?')}</span><input type="number" min="1" step="any" inputmode="decimal" value="${step || ''}" data-pay-amt="${esc(x.id)}"></label>
				<button class="btn btn--sm btn--coral" type="button" data-pay="${esc(x.id)}">${doodle('coins', 16)} ${inn ? L('رجعلنا', 'Got it back') : L('دفعنا', 'Paid')}</button>
				<button class="btn btn--sm btn--ghost" type="button" data-pay="${esc(x.id)}" data-all="1">${L('خلّصناه كله', 'Paid it all')}</button>`}
				${(x.paid || []).length ? `<button class="link" type="button" data-unpay="${esc(x.id)}">${L('شيل آخر دفعة', 'Undo the last payment')}</button>` : ''}
				${c.del(x)}
			</div>` : ''}
		</article>`;
	},
	painted: (root) => {
		for (const svg of $$('.db-card.is-done .db-card__box svg', root)) if (!svg.childNodes.length) mark(svg, 'checkmark', false);
	},
	click: async (e, ctx) => {
		const p = e.target.closest('[data-pay]'), u = e.target.closest('[data-unpay]');
		if (!p && !u) return;
		const id = (p || u).dataset.pay || (p || u).dataset.unpay;
		const x0 = (ctx.data().items || []).find((y) => y.id === id);
		if (!x0) return;
		let a = 0;
		if (p) {
			a = p.dataset.all ? leftOf(x0) : +(p.closest('.db-card').querySelector('[data-pay-amt]')?.value || 0);
			if (!(a > 0)) return;
			if (a >= leftOf(x0)) { a = leftOf(x0); mark(p.closest('.db-card').querySelector('.db-card__box svg'), 'checkmark'); await new Promise((r) => setTimeout(r, 700)); }
		} else if (!confirm(Y('تشيل آخر دفعة؟', 'تشيلي آخر دفعة؟', 'Undo the last payment?'))) return;
		try {
			await ctx.save((d) => {
				const x = (d.items || []).find((y) => y.id === id);
				if (!x) return;
				if (p) (x.paid = x.paid || []).push({ d: live.today(), a, by: live.me() });
				else x.paid = (x.paid || []).slice(0, -1);
			});
		} catch (err) { alert(live.why(err)); }
	},
	empty: ['مفيش ديون — الحمد لله ♥', 'No debts — thank God ♥'],
	related: ['expenses', 'goals', 'shopping']
});
