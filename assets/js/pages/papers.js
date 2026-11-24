import { L, esc, num, t } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «ورقنا المهم»: the papers that run out — passports, IDs, the driving and car licences, insurance, subscriptions —
   whose, when it expires, where it's kept. Never the numbers on them: only the dates. Above the title a folder with
   the papers sticking out and three stamps counting what's valid, ending soon and expired; each card a file tab with
   the days left in big, red once it's late. Shared: content/live/papers.bin. */

const KINDS = [['passport', 'plane', 'باسبور', 'Passport'], ['id', 'scroll', 'بطاقة', 'ID card'], ['driving', 'bus', 'رخصة سواقة', 'Driving licence'], ['car', 'bus', 'رخصة العربية', 'Car licence'], ['insurance', 'handshake', 'تأمين', 'Insurance'], ['sub', 'calendar', 'اشتراك', 'Subscription'], ['other', 'letter', 'ورقة تانية', 'Another paper']];
const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS.at(-1);
const left = (x) => (x.expires ? Math.round((new Date(x.expires + 'T00:00') - new Date(live.today() + 'T00:00')) / 864e5) : null);
const state = (x) => { const d = left(x); return d === null ? 'none' : d < 0 ? 'late' : d <= 60 ? 'near' : 'ok'; };

export default listPage({
	id: 'papers', kind: 'papers', icon: 'scroll',
	title: ['ورقنا المهم', 'Our papers'], sub: ['الباسبور والبطاقة والرخص — بتخلص إمتى ونجددها قبلها ♥', 'Passports, IDs, licences — when they run out, renewed in time ♥'],
	add: ['ضيفوا ورقة', 'Add a paper'],
	fields: [
		{ n: 'pkind', t: 'sel', l: ['إيه هي؟', 'What is it?'], opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'title', t: 'text', l: ['اسمها (اختياري)', 'Name (optional)'], ph: ['تأمين العربية، نتفليكس…', 'Car insurance, Netflix…'], grow: 1 },
		{ n: 'whose', t: 'sel', l: ['بتاعة مين؟', 'Whose?'], opts: (s) => [['both', L('إحنا الاتنين', 'Both of us')], ['him', t(s.him)], ['her', t(s.her)], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, t(k.name)])] },
		{ n: 'expires', t: 'date', l: ['بتخلص إمتى؟', 'Expires on'], req: 1 },
		{ n: 'kept', t: 'text', l: ['محطوطة فين؟', 'Kept where?'], ph: ['الدرج الأحمر، الشنطة الزرقا…', 'The red drawer…'] },
		{ n: 'note', t: 'area', l: ['ملاحظات (تتجدد فين، محتاجة إيه)', 'Notes (where to renew, what it needs)'], rows: 2 }
	],
	note: ['متكتبش أرقام الورق نفسه هنا — بس المواعيد ومكانه ♥', 'Don’t write the papers’ numbers here — only the dates and where they are ♥'],
	prepare: (x) => { x.pkind = x.pkind || 'other'; },
	chips: { n: 'pkind', opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
	sort: (a, b) => String(a.expires || '9999').localeCompare(String(b.expires || '9999')),
	band: (items) => {
		const n = (st) => items.filter((x) => state(x) === st).length;
		const next = items.filter((x) => left(x) !== null && left(x) >= 0).sort((a, b) => a.expires.localeCompare(b.expires))[0];
		return `<div class="pa-b">
			<div class="pa-folder">
				<span class="pa-folder__back" aria-hidden="true"></span>
				${items.slice(0, 4).map((x, i) => `<span class="pa-sheet pa-sheet--${state(x)}" style="--i:${i}"><small>${left(x) === null ? '' : left(x) < 0 ? L('خلصت', 'Expired') : L(`باقي ${num(left(x))} يوم`, `${left(x)} days left`)}</small><b dir="auto">${esc(shorten(x.title || L(kindOf(x.pkind)[2], kindOf(x.pkind)[3]), 14))}</b></span>`).join('') || `<span class="pa-sheet" style="--i:0"><b>${L('لسه فاضي', 'Still empty')}</b></span>`}
				<span class="pa-folder__front"><b>${L('ورقنا المهم', 'Our papers')}</b>${next ? `<small>${L('أقرب تجديد:', 'Next renewal:')} ${esc(L(kindOf(next.pkind)[2], kindOf(next.pkind)[3]))} — ${L(`بعد ${num(left(next))} يوم`, `in ${left(next)} days`)}</small>` : ''}</span>
			</div>
			<div class="pa-stamps">
				<span class="pa-stamp is-ok"><b>${num(n('ok'))}</b>${L('ساري', 'Valid')}</span>
				<span class="pa-stamp is-near"><b>${num(n('near'))}</b>${L('قرب يخلص', 'Ending soon')}</span>
				<span class="pa-stamp is-late"><b>${num(n('late'))}</b>${L('خلص', 'Expired')}</span>
			</div>
		</div>`;
	},
	card: (x, c) => {
		const [, ic, ar, en] = kindOf(x.pkind), d = left(x), st = state(x);
		return `<article class="lp-card pa-card is-${st}" id="pa-${esc(x.id)}">
			<span class="pa-card__tab">${doodle(ic, 15)} ${esc(L(ar, en))}</span>
			<div class="pa-card__main">
				<div class="pa-card__days"><b>${d === null ? '—' : num(Math.abs(d))}</b><small>${d === null ? '' : d < 0 ? L('يوم فات', 'days late') : L('يوم باقي', 'days left')}</small></div>
				<div>
					<h3 dir="auto">${esc(x.title || L(ar, en))}</h3>
					<p class="pa-card__who">${x.whose ? esc(c.whoName(x.whose)) : ''}</p>
				</div>
			</div>
			<p class="pa-card__meta">
				${x.expires ? `<span>${doodle('calendar', 14)} ${L('بتخلص', 'Expires')} ${c.date(x.expires)}</span>` : ''}
				${x.kept ? `<span>${doodle('pin', 14)} <span dir="auto">${esc(x.kept)}</span></span>` : ''}
			</p>
			${st === 'late' ? `<p class="pa-card__warn">${L('محتاجة تتجدد ♥', 'Needs renewing ♥')}</p>` : st === 'near' ? `<p class="pa-card__warn is-near">${L('جددوها قريب', 'Renew it soon')}</p>` : ''}
			${x.note ? `<p class="pa-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			${c.del(x) ? `<div class="pa-card__act">${c.del(x)}</div>` : ''}
		</article>`;
	},
	empty: ['لسه مفيش ورق — ضيفوا الباسبورات والبطايق ♥', 'No papers yet — add the passports and IDs ♥'],
	related: ['warranty', 'calendar', 'debts']
});
