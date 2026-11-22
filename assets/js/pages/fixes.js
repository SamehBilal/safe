import { L, Y, esc, num, App, $$ } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import { mark, markSVG } from '../checkfx.js';
import * as live from '../live.js';

/* «تصليحات البيت»: what needs fixing or doing in the house — the dripping tap, the bulb in the hall, the shelf for the
   boys' room — with the room, how soon, who's on it (one of us, or which kind of «صنايعي» and his number), what it
   costs, a photo. Each job moves on: waiting → we've started → done (a pen checkmark drawn in its box). Above the
   title a pegboard of tools beside a clipboard listing the most urgent jobs; under the form the counts. Shared:
   content/live/fixes.bin. */

const ROOMS = [
	['kitchen', 'dinner', 'المطبخ', 'Kitchen'], ['bath', 'drop', 'الحمام', 'Bathroom'], ['bed', 'moon', 'أوضة النوم', 'Bedroom'],
	['kids', 'teddy', 'أوضة الولاد', 'The boys’ room'], ['living', 'tv', 'الصالة', 'Living room'], ['balcony', 'sun', 'البلكونة', 'Balcony'],
	['door', 'house', 'المدخل والباب', 'Hall & door'], ['all', 'house', 'البيت كله', 'The whole house'], ['other', 'star', 'حتة تانية', 'Somewhere else']
];
const URGENT = [['now', 'عاجل', 'Urgent', '#d9534f'], ['soon', 'قريب', 'Soon', '#e39b2d'], ['later', 'لما نفضى', 'When we can', '#5a9e6f']];
const WHO = [['him', '', ''], ['her', '', ''], ['both', 'إحنا الاتنين', 'Both of us'], ['plumber', 'سباك', 'Plumber'], ['electric', 'كهربائي', 'Electrician'], ['carpenter', 'نجار', 'Carpenter'], ['painter', 'نقاش', 'Painter'], ['ac', 'فني تكييف', 'AC technician'], ['appliance', 'فني أجهزة', 'Appliance repair'], ['pro', 'صنايعي تاني', 'Another tradesman']];
const STEPS = [['todo', 'مستنية', 'Waiting'], ['doing', 'بدأنا فيها', 'Started'], ['done', 'خلصت', 'Done']];
const roomOf = (k) => ROOMS.find((r) => r[0] === k) || ROOMS.at(-1);
const urgOf = (k) => URGENT.find((u) => u[0] === k) || URGENT[1];
const stOf = (x) => x.status || 'todo';
const tel = (p) => String(p || '').replace(/[^\d+]/g, '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

export default listPage({
	id: 'fixes', kind: 'fixes', icon: 'wrench',
	title: ['تصليحات البيت', 'House fixes'], sub: ['اللي محتاج يتصلح أو يتعمل في البيت — ومين هيعمله وإمتى', 'What needs fixing or doing in the house — who’s on it, and how soon'],
	add: ['ضيفوا حاجة', 'Add a job'],
	fields: [
		{ n: 'what', t: 'text', l: ['إيه اللي محتاج يتعمل؟', 'What needs doing?'], req: 1, ph: ['الحنفية بتنقط، لمبة الطرقة…', 'The dripping tap, the hall bulb…'], grow: 1 },
		{ n: 'room', t: 'sel', l: ['فين؟', 'Where?'], opts: ROOMS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'urgent', t: 'sel', l: ['قد إيه مستعجلة؟', 'How soon?'], opts: URGENT.map(([v, ar, en]) => [v, ar, en]) },
		{ n: 'who', t: 'sel', l: ['مين هيعملها؟', 'Who’s on it?'], opts: (s) => WHO.map(([v, ar, en]) => (v === 'him' ? [v, App.t(s.him)] : v === 'her' ? [v, App.t(s.her)] : [v, ar, en])) },
		{ n: 'name', t: 'text', l: ['اسم الصنايعي (اختياري)', 'The tradesman’s name (optional)'], ph: ['عم محمد', 'Mr Mohamed'] },
		{ n: 'phone', t: 'tel', l: ['رقمه (اختياري)', 'His number (optional)'], ph: ['01xxxxxxxxx', '01xxxxxxxxx'] },
		{ n: 'cost', t: 'text', l: ['هتتكلف كام؟ (اختياري)', 'What will it cost? (optional)'], ph: ['٣٠٠ جنيه', '300 EGP'] },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'] },
		{ n: 'note', t: 'area', l: ['تفاصيل', 'Details'], rows: 2 }
	],
	prepare: (x) => { x.status = 'todo'; x.urgent = x.urgent || 'soon'; },
	chips: { n: 'room', opts: ROOMS.map(([v, , ar, en]) => [v, ar, en]) },
	sort: (a, b) => (stOf(a) === 'done') - (stOf(b) === 'done') || URGENT.findIndex((u) => u[0] === (a.urgent || 'soon')) - URGENT.findIndex((u) => u[0] === (b.urgent || 'soon')) || (stOf(b) === 'doing') - (stOf(a) === 'doing') || (b.at || 0) - (a.at || 0),
	band: (items) => {
		const open = items.filter((x) => stOf(x) !== 'done');
		const top = open.slice(0, 4), done = items.filter((x) => stOf(x) === 'done').length;
		return `<div class="fx-b">
			<div class="fx-peg">
				<svg class="fx-tool fx-tool--hammer" viewBox="0 0 60 120"><rect x="26" y="34" width="8" height="80" rx="4" class="fx-wood"/><path d="M8 18h40a6 6 0 0 1 6 6v6a4 4 0 0 1-4 4H14l-8-8z" class="fx-steel"/></svg>
				<svg class="fx-tool fx-tool--wrench" viewBox="0 0 60 130"><path d="M22 8a18 18 0 0 0 0 30v80a8 8 0 0 0 16 0V38a18 18 0 0 0 0-30v14l-8 6-8-6Z" class="fx-steel"/></svg>
				<svg class="fx-tool fx-tool--driver" viewBox="0 0 40 130"><rect x="10" y="8" width="20" height="48" rx="8" class="fx-grip"/><path d="M17 56h6v52l-3 8-3-8Z" class="fx-steel"/></svg>
				<svg class="fx-tool fx-tool--tape" viewBox="0 0 80 80"><rect x="8" y="10" width="60" height="60" rx="14" class="fx-tapebox"/><circle cx="38" cy="40" r="12" class="fx-steel"/><path d="M68 56h10v8H64" class="fx-steel"/></svg>
			</div>
			<div class="fx-clip">
				<span class="fx-clip__top"></span>
				<p class="fx-clip__h">${L('لسه محتاجين نعمل', 'Still to do')} <b>${num(open.length)}</b></p>
				<ul>${top.length ? top.map((x) => { const [, ar, en, c] = urgOf(x.urgent); return `<li style="--u:${c}"><span class="fx-clip__dot"></span><span dir="auto">${esc(shorten(x.what, 30))}</span><small>${esc(L(ar, en))}</small></li>`; }).join('') : `<li class="is-calm"><span dir="auto">${L('البيت تمام كده ♥', 'The house is all good ♥')}</span></li>`}</ul>
				${done ? `<p class="fx-clip__done">${doodle('heart', 14)} ${L(`خلّصنا ${num(done)}`, `${done} done`)}</p>` : ''}
			</div>
		</div>`;
	},
	top: (items) => {
		const c = (k) => items.filter((x) => stOf(x) === k).length;
		const now = items.filter((x) => stOf(x) !== 'done' && x.urgent === 'now').length;
		return items.length ? `<ul class="fx-counts">
			<li style="--c:#d9534f"><b>${num(now)}</b><small>${L('عاجلة', 'urgent')}</small></li>
			<li style="--c:#e39b2d"><b>${num(c('todo'))}</b><small>${L('مستنية', 'waiting')}</small></li>
			<li style="--c:#0e6990"><b>${num(c('doing'))}</b><small>${L('بدأنا فيها', 'started')}</small></li>
			<li style="--c:#5a9e6f"><b>${num(c('done'))}</b><small>${L('خلصت', 'done')}</small></li>
		</ul>` : '';
	},
	card: (x, c) => {
		const [, ric, rar, ren] = roomOf(x.room), [, uar, uen, uc] = urgOf(x.urgent), st = stOf(x);
		const w = WHO.find((y) => y[0] === x.who);
		const whoName = x.who === 'him' || x.who === 'her' || x.who === 'both' ? c.whoName(x.who) : w ? L(w[1], w[2]) : '';
		const step = STEPS.findIndex((y) => y[0] === st);
		return `<article class="lp-card fx-card is-${st}" id="fx-${esc(x.id)}" style="--u:${uc}">
			<header class="fx-card__hd">
				<span class="fx-card__room">${doodle(ric, 18)} ${esc(L(rar, ren))}</span>
				<span class="fx-card__urg">${esc(L(uar, uen))}</span>
			</header>
			<div class="fx-card__main">
				<span class="fx-card__box">${markSVG('checkmark')}</span>
				<h3 dir="auto">${esc(x.what)}${markSVG('list', 'fx-card__strike')}</h3>
			</div>
			${whoName || x.cost ? `<p class="fx-card__meta">${whoName ? `<span>${doodle('wrench', 15)} ${esc(whoName)}${x.name ? ` — ${esc(x.name)}` : ''}</span>` : ''}${x.cost ? `<span>${doodle('coins', 15)} <span dir="auto">${esc(x.cost)}</span></span>` : ''}</p>` : ''}
			${x.phone ? `<a class="fx-card__tel" href="tel:${esc(tel(x.phone))}" dir="ltr">${doodle('phone', 15)} ${esc(x.phone)}</a>` : ''}
			${c.photo(x)}
			${x.note ? `<p class="fx-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			<ol class="fx-steps" aria-label="${L('وصلت لفين', 'How far along')}">${STEPS.map(([k, ar, en], i) => `<li class="${i <= step ? 'is-on' : ''}"><span>${esc(L(ar, en))}</span></li>`).join('')}</ol>
			${live.canWrite() ? `<div class="fx-card__act">
				${st === 'todo' ? `<button class="btn btn--sm btn--ghost" type="button" data-step="${esc(x.id)}" data-to="doing">${doodle('wrench', 16)} ${L('بدأنا فيها', 'We’ve started')}</button>` : ''}
				${st !== 'done' ? `<button class="btn btn--sm btn--coral" type="button" data-step="${esc(x.id)}" data-to="done">${doodle('heart', 16)} ${L('خلصت', 'Done')}</button>` : `<button class="btn btn--sm btn--ghost" type="button" data-step="${esc(x.id)}" data-to="todo">${L('رجّعها', 'Undo')}</button>`}
				${c.del(x)}
			</div>` : ''}
			${st === 'done' && x.doneOn ? `<small class="fx-card__when">${L('خلصت', 'Done')} ${c.date(x.doneOn)}</small>` : ''}
		</article>`;
	},
	painted: (root) => {
		for (const svg of $$('.fx-card.is-done .fx-card__box svg, .fx-card.is-done .fx-card__strike', root)) if (!svg.childNodes.length) mark(svg, svg.classList.contains('fx-card__strike') ? 'list' : 'checkmark', false);
	},
	click: async (e, ctx) => {
		const b = e.target.closest('[data-step]');
		if (!b) return;
		const to = b.dataset.to;
		if (to === 'done') { const card = b.closest('.fx-card'); mark(card.querySelector('.fx-card__box svg'), 'checkmark'); mark(card.querySelector('.fx-card__strike'), 'list'); await new Promise((r) => setTimeout(r, 700)); }
		try { await ctx.save((d) => { const x = (d.items || []).find((y) => y.id === b.dataset.step); if (x) { x.status = to; x.doneOn = to === 'done' ? live.today() : undefined; } }); } catch (err) { alert(live.why(err)); }
	},
	empty: ['البيت تمام — مفيش حاجة محتاجة تتصلح ♥', 'All good — nothing needs fixing ♥'],
	related: ['shopping', 'chores', 'routine']
});
