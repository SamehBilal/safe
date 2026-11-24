import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «أجهزة البيت»: the fridge, the washing machine, the AC, the TV — the brand and model, when we bought it and for how
   much, the warranty until when, the service number and a photo of the receipt. Above the title a long receipt with
   everything we bought; each card a tag tied on the appliance with how much of the warranty is left.
   Shared: content/live/warranty.bin. */

const dayN = (iso) => Math.round(new Date(iso + 'T00:00') / 864e5);
const left = (x) => (x.until ? dayN(x.until) - dayN(live.today()) : null);
const money = (n) => `${num(Math.round(+n || 0))} ${L('ج', 'EGP')}`;
const leftWords = (d) => (d === null ? L('من غير ضمان', 'No warranty') : d < 0 ? L('الضمان خلص', 'Warranty over')
	: d < 60 ? L(`باقي ${num(d)} يوم ضمان`, `${d} days of warranty left`) : L(`باقي ${num(Math.round(d / 30))} شهر ضمان`, `${Math.round(d / 30)} months of warranty left`));
const pctOf = (x) => { const d = left(x); if (d === null || !x.bought) return d === null ? 0 : d > 0 ? 100 : 0; const all = dayN(x.until) - dayN(x.bought); return all > 0 ? Math.max(0, Math.min(100, Math.round((d / all) * 100))) : 0; };

export default listPage({
	id: 'warranty', kind: 'warranty', icon: 'house',
	title: ['أجهزة البيت', 'Our appliances'], sub: ['كل جهاز، اشتريناه إمتى وبكام، والضمان لحد إمتى ♥', 'Every appliance — when, how much, and the warranty until when ♥'],
	add: ['ضيفوا جهاز', 'Add an appliance'],
	fields: [
		{ n: 'name', t: 'text', l: ['الجهاز', 'Appliance'], req: 1, grow: 1, ph: ['التلاجة، الغسالة، التكييف…', 'Fridge, washer, AC…'], ideas: [['التلاجة', 'Fridge'], ['الغسالة', 'Washing machine'], ['التكييف', 'AC'], ['التلفزيون', 'TV'], ['البوتاجاز', 'Cooker'], ['الميكروويف', 'Microwave'], ['السخان', 'Water heater'], ['المكنسة', 'Vacuum'], ['اللابتوب', 'Laptop'], ['الموبايل', 'Phone']] },
		{ n: 'brand', t: 'text', l: ['الماركة والموديل', 'Brand and model'], ph: ['شارب ١٨ قدم', 'Sharp 18 ft'] },
		{ n: 'bought', t: 'date', l: ['اشتريناه إمتى؟', 'Bought on'] },
		{ n: 'price', t: 'num', l: ['بكام؟', 'Price (EGP)'], ph: ['٢٥٠٠٠', '25000'] },
		{ n: 'until', t: 'date', l: ['الضمان لحد إمتى؟', 'Warranty until'] },
		{ n: 'shop', t: 'text', l: ['اشتريناه منين؟', 'Bought from'], ph: ['بي تك، كارفور…', 'B.Tech, Carrefour…'] },
		{ n: 'service', t: 'tel', l: ['رقم خدمة العملاء', 'Service number'], ph: ['19xxx', '19xxx'] },
		{ n: 'photo', t: 'photo', l: ['صورة الفاتورة أو الضمان', 'A photo of the receipt or warranty'] },
		{ n: 'note', t: 'area', l: ['ملاحظات (اتصلح إمتى…)', 'Notes (repairs…)'], rows: 2 }
	],
	sort: (a, b) => { const x = left(a), y = left(b); return (x === null || x < 0) - (y === null || y < 0) || (x ?? 1e9) - (y ?? 1e9) || String(a.name).localeCompare(String(b.name), 'ar'); },
	band: (items) => {
		const total = items.reduce((a, x) => a + (+x.price || 0), 0);
		const on = items.filter((x) => left(x) !== null && left(x) >= 0);
		const soon = on.filter((x) => left(x) < 60).sort((a, b) => left(a) - left(b))[0];
		return `<div class="wr-b">
			<div class="wr-receipt">
				<p class="wr-receipt__h">${L('فاتورة بيتنا', 'Our home’s receipt')}</p>
				<p class="wr-receipt__date" dir="ltr">${esc(live.today())}</p>
				<ul>${items.slice(0, 6).map((x) => `<li><span dir="auto">${esc(shorten(x.name, 16))}</span><i></i><b>${x.price ? money(x.price) : '—'}</b></li>`).join('') || `<li><span>${L('لسه فاضية', 'Still empty')}</span><i></i><b>—</b></li>`}${items.length > 6 ? `<li class="is-more"><span>${L(`و${num(items.length - 6)} كمان`, `and ${items.length - 6} more`)}</span></li>` : ''}</ul>
				<p class="wr-receipt__total"><span>${L('الإجمالي', 'Total')}</span><b>${money(total)}</b></p>
				<p class="wr-receipt__foot">${L(`${num(on.length)} جهاز لسه في الضمان`, `${on.length} still under warranty`)}${soon ? ` · ${L('قرب يخلص:', 'ending soon:')} <b dir="auto">${esc(soon.name)}</b>` : ''}</p>
				<span class="wr-receipt__bar" aria-hidden="true"></span>
			</div>
		</div>`;
	},
	card: (x, c) => {
		const d = left(x), p = pctOf(x), cls = d === null ? 'is-none' : d < 0 ? 'is-over' : d < 60 ? 'is-near' : 'is-ok';
		return `<article class="lp-card wr-card ${cls}" id="wr-${esc(x.id)}" style="--p:${p}%">
			<span class="wr-card__hole" aria-hidden="true"></span>
			<div class="wr-card__main">
				${x.photo ? `<span class="wr-card__pic">${c.photo(x)}</span>` : `<span class="wr-card__pic wr-card__pic--none">${doodle('house', 30)}</span>`}
				<div><h3 dir="auto">${esc(x.name)}</h3>${x.brand ? `<p class="wr-card__brand" dir="auto">${esc(x.brand)}</p>` : ''}</div>
			</div>
			<div class="wr-bar"><span></span></div>
			<p class="wr-card__left">${leftWords(d)}${x.until ? ` · ${L('لحد', 'until')} ${c.date(x.until)}` : ''}</p>
			<p class="wr-card__meta">
				${x.bought ? `<span>${doodle('calendar', 14)} ${c.date(x.bought)}</span>` : ''}
				${x.price ? `<span>${doodle('coins', 14)} ${money(x.price)}</span>` : ''}
				${x.shop ? `<span>${doodle('ticket', 14)} <span dir="auto">${esc(x.shop)}</span></span>` : ''}
				${x.service ? `<a href="tel:${esc(String(x.service).replace(/[^\d+]/g, ''))}" dir="ltr">${doodle('phone', 14)} ${esc(x.service)}</a>` : ''}
			</p>
			${x.note ? `<p class="wr-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			${c.del(x) ? `<div class="wr-card__act">${c.del(x)}</div>` : ''}
		</article>`;
	},
	empty: ['لسه ما ضفناش أجهزة — ضيفوا التلاجة والغسالة ♥', 'No appliances yet — add the fridge and the washer ♥'],
	related: ['fixes', 'papers', 'expenses']
});
