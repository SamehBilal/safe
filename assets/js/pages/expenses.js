import { L, esc, num, App, $$ } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import { mark, markSVG } from '../checkfx.js';
import * as live from '../live.js';
import { money, leftOf, isOver } from './debts.js';

/* «مصاريف الشهر»: what goes out every month — the fixed (rent, the nursery, internet, the club) and the variable
   (electricity, food, the car) — each with its day of the month, and some only every three months, six, or once a
   year. Month by month (‹ ›): tick what's paid and how much it really was; what's left, what's late, the total by
   kind. The debts' monthly installments («ديوننا») count in the month too. Above the title the month's receipt
   beside a jar of coins filling with what's paid. Shared: content/live/expenses.bin. */

const CATS = [
	['home', 'house', 'البيت والإيجار', 'Home & rent', '#c0504d'], ['bills', 'drop', 'كهربا ومية وغاز', 'Utilities', '#0e6990'],
	['net', 'phone', 'نت وموبايلات', 'Internet & phones', '#6d4bb3'], ['food', 'dinner', 'أكل وبقالة', 'Food & groceries', '#e39b2d'],
	['kids', 'bottle', 'حاجات الولاد', 'The boys’ things', '#d9739b'], ['school', 'grad', 'حضانة ومدارس', 'Nursery & school', '#3f8f8a'],
	['car', 'bus', 'عربية ومواصلات', 'Car & transport', '#5c6b7a'], ['health', 'pill', 'دكاترة وعلاج', 'Health', '#5a9e6f'],
	['help', 'handshake', 'مساعدة في البيت', 'Help at home', '#9a6b3f'], ['sub', 'tv', 'اشتراكات', 'Subscriptions', '#7a5cc0'],
	['sport', 'trophy', 'نادي ورياضة', 'Club & sport', '#2f7d4f'], ['save', 'coins', 'ادخار وجمعية', 'Saving', '#b38a1f'],
	['fun', 'popcorn', 'خروجات', 'Going out', '#e0684b'], ['family', 'gift', 'العيلة والهدايا', 'Family & gifts', '#c25b8c'], ['other', 'star', 'حاجات تانية', 'Other', '#8a8a8a']
];
const TYPES = [['fixed', 'ثابت', 'Fixed'], ['var', 'متغير', 'Varies']];
const EVERY = [['1', 'كل شهر', 'Every month'], ['2', 'كل شهرين', 'Every two months'], ['3', 'كل ٣ شهور', 'Every 3 months'], ['6', 'كل ٦ شهور', 'Every 6 months'], ['12', 'مرة في السنة', 'Once a year']];
const catOf = (k) => CATS.find((c) => c[0] === k) || CATS.at(-1);

/* months as 'YYYY-MM' */
const ymOf = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const idx = (ym) => { const [y, m] = ym.split('-').map(Number); return y * 12 + m - 1; };
const ymAt = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
const NOW = () => ymOf();
const monthLabel = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5) - 1, 1).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });
let ym = NOW();
let debts = [];

const every = (x) => Math.max(1, +x.every || 1);
const inMonth = (x, m) => { const f = x.from || m; if (idx(m) < idx(f)) return false; if (x.until && idx(m) > idx(x.until)) return false; return (idx(m) - idx(f)) % every(x) === 0; };
const paidIn = (x, m = ym) => x.paid?.[m];
const expect = (x) => {
	if (x.type !== 'var') return +x.amount || 0;
	const past = Object.entries(x.paid || {}).filter(([k]) => k < ym).sort().slice(-3).map(([, p]) => +p.a || 0);
	return past.length ? past.reduce((a, b) => a + b, 0) / past.length : +x.amount || 0;
};
const cost = (x) => (paidIn(x) ? +paidIn(x).a || 0 : expect(x));
const late = (x) => !paidIn(x) && (idx(ym) < idx(NOW()) || (ym === NOW() && x.day && +x.day < new Date().getDate()));
const installs = () => debts.filter((d) => d.dir !== 'in' && +d.monthly > 0 && (!isOver(d) || (d.paid || []).some((p) => String(p.d).startsWith(ym))));
const instPaid = (d) => (d.paid || []).filter((p) => String(p.d).startsWith(ym)).reduce((a, p) => a + (+p.a || 0), 0);

function totals(items) {
	const t = { fixed: 0, var: 0, paid: 0, inst: 0, instPaid: 0, byCat: new Map() };
	for (const x of items) {
		const c = cost(x);
		t[x.type === 'var' ? 'var' : 'fixed'] += c;
		if (paidIn(x)) t.paid += c;
		t.byCat.set(x.cat || 'other', (t.byCat.get(x.cat || 'other') || 0) + c);
	}
	for (const d of installs()) { t.inst += +d.monthly; t.instPaid += Math.min(+d.monthly, instPaid(d)); }
	t.all = t.fixed + t.var + t.inst;
	t.done = t.paid + t.instPaid;
	return t;
}

export default listPage({
	id: 'expenses', kind: 'expenses', icon: 'coins',
	title: ['مصاريف الشهر', 'Monthly expenses'], sub: ['اللي بيطلع كل شهر، الثابت والمتغير — دفعنا إيه، وفاضل إيه', 'What goes out every month, fixed and variable — what’s paid and what’s left'],
	add: ['ضيفوا مصروف', 'Add an expense'],
	fields: [
		{ n: 'what', t: 'text', l: ['المصروف', 'The expense'], req: 1, ph: ['الإيجار، النت، الحضانة…', 'Rent, internet, the nursery…'], grow: 1, ideas: [['الإيجار'], ['الكهربا'], ['المية'], ['الغاز'], ['النت'], ['كروت الموبايل'], ['الحضانة'], ['البامبرز واللبن'], ['البنزين'], ['النادي'], ['السوبر ماركت'], ['الخضار والفاكهة'], ['اللحمة والفراخ'], ['الدادة'], ['نتفليكس'], ['شاهد'], ['الجمعية'], ['مصروف البيت']] },
		{ n: 'cat', t: 'sel', l: ['نوعه', 'Kind'], opts: CATS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'type', t: 'sel', l: ['ثابت ولا بيتغير؟', 'Fixed, or does it vary?'], opts: [['fixed', 'ثابت — نفس المبلغ كل مرة', 'Fixed — the same each time'], ['var', 'متغير — بيزيد ويقل', 'Varies — goes up and down']] },
		{ n: 'amount', t: 'num', l: ['المبلغ (أو حوالي كام)', 'Amount (or about how much)'], req: 1, ph: ['١٥٠٠', '1500'] },
		{ n: 'every', t: 'sel', l: ['كل قد إيه؟', 'How often?'], opts: EVERY },
		{ n: 'day', t: 'num', l: ['بيتدفع يوم كام؟ (اختياري)', 'Paid on which day? (optional)'], min: 1, ph: ['١', '1'] },
		{ n: 'who', t: 'sel', l: ['مين بيدفعه؟', 'Who pays it?'], opts: 'whoBoth' },
		{ n: 'note', t: 'text', l: ['ملاحظة (اختياري)', 'A note (optional)'], ph: ['رقم العداد، رقم الحساب…', 'Meter number, account number…'], grow: 1 }
	],
	note: ['هيبدأ يتحسب من الشهر اللي إنتوا فاتحينه', 'It counts from the month you’re looking at'],
	prepare: (x) => {
		x.from = ym; x.type = x.type || 'fixed'; x.every = +x.every || 1;
		if (x.day) x.day = Math.min(31, Math.max(1, Math.round(x.day)));
	},
	keep: (x) => inMonth(x, ym),
	chips: { n: 'type', opts: TYPES, def: 'fixed' },
	sort: (a, b) => !!paidIn(a) - !!paidIn(b) || (+a.day || 32) - (+b.day || 32) || cost(b) - cost(a),
	band: (items) => {
		const t = totals(items);
		const pct = t.all ? Math.min(100, Math.round((t.done / t.all) * 100)) : 0;
		const lines = [...t.byCat].sort((a, b) => b[1] - a[1]);
		return `<div class="ex-b">
			<div class="ex-receipt">
				<p class="ex-receipt__h">${L('فاتورة', 'The bill for')}<b>${esc(monthLabel(ym))}</b></p>
				<ul>${lines.slice(0, 6).map(([k, v]) => { const [, , ar, en] = catOf(k); return `<li><span>${esc(L(ar, en))}</span><i></i><b>${num(Math.round(v))}</b></li>`; }).join('')}
				${lines.length > 6 ? `<li><span>${L('والباقي', 'The rest')}</span><i></i><b>${num(Math.round(lines.slice(6).reduce((a, [, v]) => a + v, 0)))}</b></li>` : ''}
				${t.inst ? `<li><span>${L('أقساط', 'Installments')}</span><i></i><b>${num(Math.round(t.inst))}</b></li>` : ''}
				${lines.length || t.inst ? '' : `<li class="is-calm"><span>${L('لسه مفيش مصاريف', 'No expenses yet')}</span></li>`}</ul>
				<p class="ex-receipt__tot"><span>${L('الإجمالي', 'Total')}</span><b>${money(t.all)}</b></p>
				<p class="ex-receipt__thx">${L('شكراً يا بيتنا ♥', 'Thank you, home ♥')}</p>
			</div>
			<div class="ex-jar" style="--p:${pct}">
				<svg viewBox="0 0 120 150" class="ex-jar__svg"><rect x="28" y="8" width="64" height="14" rx="4" class="ex-jar__lid"/><path d="M32 22h56v10c10 6 16 14 16 26v74a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V58c0-12 6-20 16-26Z" class="ex-jar__glass"/></svg>
				<div class="ex-jar__fill">${Array.from({ length: 9 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}</div>
				<p class="ex-jar__lbl"><b>${num(pct)}٪</b><small>${L('اتدفع', 'paid')}</small></p>
			</div>
		</div>`;
	},
	top: (items) => {
		const t = totals(items), now = NOW();
		const left = Math.max(0, t.all - t.done), lateN = items.filter(late).length;
		const bar = [...t.byCat].sort((a, b) => b[1] - a[1]).concat(t.inst ? [['__inst', t.inst]] : []);
		return `<div class="ex-month">
				<button class="btn btn--sm btn--ghost" type="button" data-ym="-1" aria-label="${L('الشهر اللي فات', 'Previous month')}">${doodle(App.lang === 'ar' ? 'forward' : 'back', 18)}</button>
				<h2>${esc(monthLabel(ym))}</h2>
				<button class="btn btn--sm btn--ghost" type="button" data-ym="1" aria-label="${L('الشهر الجاي', 'Next month')}">${doodle(App.lang === 'ar' ? 'back' : 'forward', 18)}</button>
				${ym !== now ? `<button class="chip" type="button" data-ym="0">${L('الشهر ده', 'This month')}</button>` : ''}
			</div>
			<ul class="ex-sum">
				<li style="--c:#0e6990"><b>${money(t.all)}</b><small>${L('مصاريف الشهر كله', 'The whole month')}</small></li>
				<li style="--c:#5a9e6f"><b>${money(t.done)}</b><small>${L('دفعنا', 'Paid')}</small></li>
				<li style="--c:#e39b2d"><b>${money(left)}</b><small>${L('فاضل', 'Left')}${lateN ? ` · <em>${L(`${num(lateN)} فات ميعاده`, `${lateN} late`)}</em>` : ''}</small></li>
				<li style="--c:#6d4bb3"><b>${money(t.fixed)} <i>/</i> ${money(t.var)}</b><small>${L('ثابت / متغير', 'fixed / varies')}</small></li>
			</ul>
			${t.all ? `<div class="ex-split" role="img" aria-label="${L('المصاريف حسب النوع', 'By kind')}">${bar.map(([k, v]) => { const [, , ar, en, c] = k === '__inst' ? [0, 0, 'أقساط', 'Installments', '#444'] : catOf(k); return `<span style="--w:${(v / t.all) * 100}%;--c:${c}" title="${esc(L(ar, en))}: ${num(Math.round(v))}"></span>`; }).join('')}</div>
			<ul class="ex-legend">${bar.map(([k, v]) => { const [, , ar, en, c] = k === '__inst' ? [0, 0, 'أقساط', 'Installments', '#444'] : catOf(k); return `<li style="--c:${c}"><i></i>${esc(L(ar, en))} <b>${num(Math.round((v / t.all) * 100))}٪</b></li>`; }).join('')}</ul>` : ''}
			${installs().length ? `<div class="ex-inst">
				<p class="ex-inst__h">${doodle('scale', 18)} ${L('أقساط الديون الشهر ده', 'This month’s debt installments')} <a class="link" href="debts.html">${L('ديوننا', 'Our debts')}</a></p>
				<ul>${installs().map((d) => { const ok = instPaid(d) >= +d.monthly; return `<li class="${ok ? 'is-paid' : ''}"><span dir="auto">${esc(shorten(d.whom, 26))}</span>${d.payday ? `<small>${L(`يوم ${num(d.payday)}`, `on the ${d.payday}th`)}</small>` : ''}<b>${money(d.monthly)}</b><em>${ok ? L('اتدفع ♥', 'paid ♥') : L(`باقي ${money(leftOf(d))}`, `${money(leftOf(d))} left`)}</em></li>`; }).join('')}</ul>
			</div>` : ''}`;
	},
	card: (x, c) => {
		const [, ic, car, cen, col] = catOf(x.cat), p = paidIn(x), isVar = x.type === 'var', ev = EVERY.find((e) => +e[0] === every(x));
		const isLate = late(x), guess = Math.round(expect(x));
		const avg = isVar && Object.keys(x.paid || {}).some((k) => k < ym);
		return `<article class="lp-card ex-card${p ? ' is-paid' : ''}${isLate ? ' is-late' : ''}" id="ex-${esc(x.id)}" style="--c:${col}">
			<header class="ex-card__hd">
				<span class="ex-card__cat">${doodle(ic, 18)} ${esc(L(car, cen))}</span>
				<span class="ex-card__tags"><span class="ex-tag ex-tag--${isVar ? 'var' : 'fixed'}">${isVar ? L('متغير', 'Varies') : L('ثابت', 'Fixed')}</span>${every(x) > 1 && ev ? `<span class="ex-tag">${esc(L(ev[1], ev[2]))}</span>` : ''}</span>
			</header>
			<div class="ex-card__main">
				<span class="ex-card__box">${markSVG('checkmark')}</span>
				<h3 dir="auto">${esc(x.what)}</h3>
				<b class="ex-card__amt">${p ? money(p.a) : `${isVar ? L('حوالي ', 'about ') : ''}${money(guess)}`}</b>
			</div>
			<p class="ex-card__meta">
				${x.day ? `<span class="${isLate ? 'is-late' : ''}">${doodle('calendar', 15)} ${L(`يوم ${num(x.day)} في الشهر`, `On the ${x.day}th`)}${isLate ? ` — ${L('فات ميعاده', 'late')}` : ''}</span>` : isLate ? `<span class="is-late">${doodle('clock', 15)} ${L('لسه متدفعش', 'not paid yet')}</span>` : ''}
				${x.who ? `<span>${doodle('handshake', 15)} ${esc(c.whoName(x.who))}</span>` : ''}
				${avg ? `<span>${doodle('scale', 15)} ${L(`متوسطه ${money(guess)}`, `averages ${money(guess)}`)}</span>` : ''}
				${p ? `<span class="is-paid">${doodle('heart', 15)} ${L('اتدفع', 'Paid')} ${c.date(p.d)}${p.by ? ` — ${esc(c.whoName(p.by))}` : ''}</span>` : ''}
			</p>
			${x.note ? `<p class="ex-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			${live.canWrite() ? `<div class="ex-card__act">
				${p ? `<button class="btn btn--sm btn--ghost" type="button" data-unpaid="${esc(x.id)}">${L('رجّعه', 'Undo')}</button>`
					: `<label class="f ex-pay"><span>${isVar ? L('طلع كام؟', 'How much was it?') : L('المبلغ', 'Amount')}</span><input type="number" min="0" step="any" inputmode="decimal" value="${guess || ''}" data-amt="${esc(x.id)}"></label>
					<button class="btn btn--sm btn--coral" type="button" data-paid="${esc(x.id)}">${doodle('coins', 16)} ${L('دفعناه', 'Paid')}</button>`}
				<button class="link" type="button" data-stop="${esc(x.id)}">${L('مبقاش بيتدفع', 'No longer paid')}</button>
				${c.del(x)}
			</div>` : ''}
		</article>`;
	},
	painted: (root) => {
		for (const svg of $$('.ex-card.is-paid .ex-card__box svg', root)) if (!svg.childNodes.length) mark(svg, 'checkmark', false);
	},
	ready: async () => { debts = (await live.load('debts').catch(() => ({}))).items || []; },
	click: async (e, ctx) => {
		const m = e.target.closest('[data-ym]');
		if (m) { ym = +m.dataset.ym ? ymAt(idx(ym) + +m.dataset.ym) : NOW(); return ctx.repaint(); }
		const b = e.target.closest('[data-paid], [data-unpaid], [data-stop]');
		if (!b) return;
		const id = b.dataset.paid || b.dataset.unpaid || b.dataset.stop;
		let a = 0;
		if (b.dataset.paid) {
			a = +(b.closest('.ex-card').querySelector('[data-amt]')?.value || 0);
			if (!(a >= 0)) return;
			mark(b.closest('.ex-card').querySelector('.ex-card__box svg'), 'checkmark');
			await new Promise((r) => setTimeout(r, 650));
		}
		if (b.dataset.stop && !confirm(L(`يقف من بعد ${monthLabel(ym)}؟`, `Stop it after ${monthLabel(ym)}?`))) return;
		try {
			await ctx.save((d) => {
				const x = (d.items || []).find((y) => y.id === id);
				if (!x) return;
				if (b.dataset.paid) (x.paid = x.paid || {})[ym] = { a, d: live.today(), by: live.me() };
				else if (b.dataset.unpaid) { if (x.paid) delete x.paid[ym]; }
				else x.until = x.paid?.[ym] ? ym : ymAt(idx(ym) - 1);
			});
		} catch (err) { alert(live.why(err)); }
	},
	empty: ['مفيش مصاريف في الشهر ده — ضيفوا الإيجار والنت والحاجات اللي بتتكرر', 'Nothing this month — add the rent, the internet and whatever comes round'],
	related: ['debts', 'shopping', 'goals']
});
