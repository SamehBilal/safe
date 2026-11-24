import { L, Y, esc, num, $ } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «ناسنا»: the relatives, friends, neighbours — everyone who's ours — and every day one of them to call or message.
   The pick is drawn from the ones we haven't reached in the longest time (against how often we'd like to: every week,
   every month…), the same on both phones for the day; or a new one each time the page opens, if we'd rather. «اختار حد
   تاني» draws again; «اتواصلنا» writes today down, so they go to the back of the jar. Above the title a jar of folded
   slips, one rising out of it with today's name. Shared: content/live/people.bin. */

export const RELS = [['family', 'قرايب', 'Relatives', '#d9534f'], ['friend', 'صحاب', 'Friends', '#0e6990'], ['neighbor', 'جيران', 'Neighbours', '#5a9e6f'], ['work', 'شغل ودراسة', 'Work & school', '#e39b2d'], ['other', 'حبايبنا', 'Our dear ones', '#8e5bd1']];
const EVERY = [['week', 'كل أسبوع', 'Every week', 7], ['month', 'كل شهر', 'Every month', 30], ['quarter', 'كل كام شهر', 'Every few months', 90], ['', 'على راحتنا', 'Whenever', 60]];
const relOf = (r) => RELS.find((x) => x[0] === r) || RELS.at(-1);
const everyOf = (e) => EVERY.find((x) => x[0] === (e || '')) || EVERY.at(-1);
const MODE_KEY = 'us.people.mode';
const getMode = () => { try { return localStorage.getItem(MODE_KEY) === 'run' ? 'run' : 'day'; } catch { return 'day'; } };
const setMode = (m) => { try { localStorage.setItem(MODE_KEY, m); } catch { /* private window: it stays for now */ } };

const dayN = (iso) => Math.round(new Date(iso + 'T00:00') / 864e5);
const lastOf = (x, before) => (x.reached || []).filter((d) => !before || d < before).sort().at(-1) || '';
const sinceOf = (x, before) => { const l = lastOf(x, before); return l ? dayN(live.today()) - dayN(l) : null; };
/* how overdue someone is: days since we last reached them over how often we'd like to (never reached: first in line) */
const dueOf = (x, before) => { const s = sinceOf(x, before); return s === null ? 99 : s / everyOf(x.every)[3]; };
const reachedToday = (x) => (x.reached || []).includes(live.today());
const hash = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const first = (name) => String(name || '').trim().split(/\s+/)[0] || '?';

/* the jar: whoever's waited longest — a third of everyone, at least three — ordered by how long, today's reaches not counted */
function jar(items) {
	const t = live.today();
	const list = items.filter((x) => !x.paused).sort((a, b) => dueOf(b, t) - dueOf(a, t) || String(a.id).localeCompare(String(b.id)));
	return list.slice(0, Math.max(3, Math.ceil(list.length / 3)));
}
/* today's one: the same on both phones (the date and the list decide it) — unless we drew again, or each visit draws */
let drawn = null, runPick = null;
function pickOf(items) {
	const j = jar(items);
	if (!j.length) return null;
	const by = (id) => items.find((x) => x.id === id);
	if (drawn && by(drawn)) return by(drawn);
	if (getMode() === 'run') {
		if (!runPick || !by(runPick)) runPick = j[Math.floor(Math.random() * j.length)].id;
		return by(runPick);
	}
	return j[hash(live.today() + '♥ناسنا') % j.length];
}
const telOf = (p) => String(p || '').replace(/[^\d+]/g, '');
function waOf(p) {
	let d = String(p || '').replace(/\D/g, '');
	if (d.startsWith('00')) d = d.slice(2);
	else if (/^01\d{9}$/.test(d)) d = '2' + d; // an Egyptian mobile, 01xxxxxxxxx → 201xxxxxxxxx
	return d.length >= 8 ? `https://wa.me/${d}` : '';
}
function ago(x) {
	const s = sinceOf(x);
	if (s === null) return L('لسه ما اتواصلناش', 'Not reached yet');
	if (s === 0) return L('اتواصلنا النهارده ♥', 'Reached today ♥');
	if (s === 1) return L('آخر مرة امبارح', 'Last time yesterday');
	return L(`آخر مرة من ${num(s)} يوم`, `Last time ${s} days ago`);
}
const face = (x, size = 'md') => `<span class="pp-face pp-face--${size}" style="--c:${relOf(x.rel)[3]}">${x.photo ? `<img data-sketch="${esc(x.photo)}" alt="" loading="lazy">` : `<b>${esc([...first(x.name)][0])}</b>`}</span>`;
const reachBtns = (x, big) => `
	${x.phone ? `<a class="btn btn--sm${big ? ' btn--light' : ' btn--ghost'}" href="tel:${esc(telOf(x.phone))}">${doodle('phone', 16)} ${L('مكالمة', 'Call')}</a>` : ''}
	${waOf(x.phone) ? `<a class="btn btn--sm btn--ghost" href="${esc(waOf(x.phone))}" target="_blank" rel="noopener noreferrer">${doodle('chat', 16)} ${L('واتساب', 'WhatsApp')}</a>` : ''}`;

export default listPage({
	id: 'people', kind: 'people', icon: 'family',
	title: ['ناسنا', 'Our people'], sub: ['القرايب والصحاب والجيران — وكل يوم واحد منهم نسأل عليه ♥', 'Relatives, friends, neighbours — and every day one of them to ask after ♥'],
	add: ['ضيفوا حد من ناسنا', 'Add one of our people'],
	fields: [
		{ n: 'name', t: 'text', l: ['اسمه / اسمها', 'Name'], req: 1, ph: ['طنط سعاد، أحمد صاحبي…', 'Aunt Souad, my friend Ahmed…'], grow: 1 },
		{ n: 'rel', t: 'sel', l: ['من مين؟', 'Who are they to us?'], opts: RELS.map(([v, ar, en]) => [v, ar, en]) },
		{ n: 'phone', t: 'tel', l: ['رقم التليفون (اختياري)', 'Phone number (optional)'], ph: ['01xxxxxxxxx', '01xxxxxxxxx'] },
		{ n: 'every', t: 'sel', l: ['نسأل عليه قد إيه؟', 'How often to reach out?'], opts: EVERY.map(([v, ar, en]) => [v, ar, en]) },
		{ n: 'who', t: 'sel', l: ['من ناس مين؟', 'Whose people?'], opts: 'whoBoth' },
		{ n: 'photo', t: 'photo', l: ['صورته أو رسمته (اختياري)', 'A photo or a drawing (optional)'], sketch: true, sketchTitle: ['ارسمه', 'Draw them'] },
		{ n: 'note', t: 'area', l: ['نسأله عن إيه؟ (شغله، ولاده، عيد ميلاده…)', 'What to ask about (work, kids, birthday…)'], rows: 2 }
	],
	prepare: (x) => { x.rel = x.rel || 'other'; x.reached = []; },
	chips: { n: 'rel', opts: RELS.map(([v, ar, en]) => [v, ar, en]) },
	sort: (a, b) => reachedToday(a) - reachedToday(b) || dueOf(b) - dueOf(a) || String(a.name).localeCompare(String(b.name), 'ar'),
	band: (items) => {
		const p = pickOf(items);
		const slips = items.slice(0, 16);
		const fill = Math.max(10, slips.length);
		return `<div class="pp-b">
			<div class="pp-jar">
				${p ? `<span class="pp-slip pp-slip--out" style="--c:${relOf(p.rel)[3]}"><small>${L('النهارده', 'Today')}</small><b dir="auto">${esc(p.name)}</b></span>` : ''}
				<span class="pp-jar__lid"></span>
				<span class="pp-jar__glass">
					${Array.from({ length: fill }, (_, i) => { const x = slips[i]; const c = x ? relOf(x.rel)[3] : '#c9c2b4'; return `<i class="pp-slip" style="--c:${c};--x:${(i * 37) % 78 + 6}%;--y:${Math.floor(i / 4) * 17}px;--r:${((i * 53) % 50) - 25}deg"></i>`; }).join('')}
					<span class="pp-jar__label">${L('ناسنا ♥', 'our people ♥')}</span>
				</span>
			</div>
			<ul class="pp-b__rels">${RELS.map(([v, ar, en, c]) => { const n = items.filter((x) => x.rel === v).length; return n ? `<li style="--c:${c}"><b>${num(n)}</b> ${esc(L(ar, en))}</li>` : ''; }).join('')}</ul>
		</div>`;
	},
	top: (items) => {
		if (!items.length) return '';
		const p = pickOf(items), mode = getMode(), month = live.today().slice(0, 7);
		const reachedMonth = items.filter((x) => (x.reached || []).some((d) => d.startsWith(month))).length;
		const waiting = items.filter((x) => !x.paused && dueOf(x) >= 1).length;
		const ok = live.canWrite();
		return `<div class="pp-pick">
			<div class="pp-mode chips" role="toolbar">
				<button class="chip${mode === 'day' ? ' is-on' : ''}" type="button" data-pp-mode="day">${doodle('sun', 15)} ${L('واحد كل يوم', 'One a day')}</button>
				<button class="chip${mode === 'run' ? ' is-on' : ''}" type="button" data-pp-mode="run">${doodle('dice', 15)} ${L('كل مرة نفتح', 'Each time we open')}</button>
			</div>
			${p ? `<article class="pp-today${reachedToday(p) ? ' is-done' : ''}" style="--c:${relOf(p.rel)[3]}">
				<span class="pp-today__tape" aria-hidden="true"></span>
				${face(p, 'lg')}
				<div class="pp-today__body">
					<p class="pp-today__k">${mode === 'run' ? L('المرة دي هنسأل على', 'This time, let’s ask after') : L('النهارده هنسأل على', 'Today, let’s ask after')}</p>
					<h2 class="pp-today__name" dir="auto">${esc(p.name)}</h2>
					<p class="pp-today__meta"><span class="pp-rel">${esc(L(relOf(p.rel)[1], relOf(p.rel)[2]))}</span> <span>${ago(p)}</span></p>
					${p.note ? `<p class="pp-today__note" dir="auto">${doodle('pen', 15)} ${esc(p.note)}</p>` : ''}
					<div class="pp-today__act">
						${reachBtns(p, true)}
						${ok ? (reachedToday(p) ? `<span class="pp-done">${doodle('heart', 16)} ${L('اتواصلنا ♥', 'Reached ♥')}</span>` : `<button class="btn btn--sm btn--coral" type="button" data-reach="${esc(p.id)}">${doodle('heart', 16)} ${L('اتواصلنا', 'We reached out')}</button>`) : ''}
						${items.filter((x) => !x.paused).length > 1 ? `<button class="btn btn--sm btn--ghost" type="button" data-redraw>${doodle('dice', 16)} ${Y('اختار حد تاني', 'اختاري حد تاني', 'Pick someone else')}</button>` : ''}
					</div>
				</div>
			</article>` : `<p class="empty">${L('كل ناسنا واخدين أجازة دلوقتي ♥', 'Everyone’s on a break for now ♥')}</p>`}
			<ul class="pp-sum">
				<li style="--c:#0e6990"><b>${num(items.length)}</b><small>${L('من ناسنا', 'of our people')}</small></li>
				<li style="--c:#5a9e6f"><b>${num(reachedMonth)}</b><small>${L('سألنا عليهم الشهر ده', 'reached this month')}</small></li>
				<li style="--c:#d9534f"><b>${num(waiting)}</b><small>${L('مستنيين نسأل عليهم', 'waiting to hear from us')}</small></li>
			</ul>
		</div>`;
	},
	card: (x, c) => {
		const [, rar, ren, col] = relOf(x.rel), late = !x.paused && dueOf(x) >= 1, today = reachedToday(x);
		return `<article class="lp-card pp-card${late ? ' is-late' : ''}${today ? ' is-done' : ''}${x.paused ? ' is-paused' : ''}" id="pp-${esc(x.id)}" style="--c:${col}">
			<span class="pp-card__tab">${esc(L(rar, ren))}</span>
			<div class="pp-card__main">
				${face(x)}
				<div>
					<h3 dir="auto">${esc(x.name)}</h3>
					<p class="pp-card__ago">${ago(x)}${late ? ` · <em>${L('وحشناه', 'overdue')}</em>` : ''}</p>
				</div>
			</div>
			<p class="pp-card__meta">
				<span>${doodle('clock', 15)} ${esc(L(everyOf(x.every)[1], everyOf(x.every)[2]))}</span>
				${x.who ? `<span>${doodle('handshake', 15)} ${esc(c.whoName(x.who))}</span>` : ''}
				${x.phone ? `<span dir="ltr">${doodle('phone', 15)} ${esc(x.phone)}</span>` : ''}
			</p>
			${x.note ? `<p class="pp-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			<div class="pp-card__act">
				${reachBtns(x)}
				${live.canWrite() ? `${today ? '' : `<button class="btn btn--sm btn--coral" type="button" data-reach="${esc(x.id)}">${doodle('heart', 15)} ${L('اتواصلنا', 'Reached')}</button>`}
				${(x.reached || []).length ? `<button class="link" type="button" data-unreach="${esc(x.id)}">${L('شيل آخر مرة', 'Undo the last time')}</button>` : ''}
				<button class="link" type="button" data-pause="${esc(x.id)}">${x.paused ? L('رجّعه للبرطمان', 'Back in the jar') : L('أجازة من البرطمان', 'Out of the jar for now')}</button>
				${c.del(x)}` : ''}
			</div>
		</article>`;
	},
	ready: (root, ctx) => { const had = drawn || runPick; drawn = null; runPick = null; if (had) ctx.repaint(); },
	click: async (e, ctx) => {
		const m = e.target.closest('[data-pp-mode]');
		if (m) { setMode(m.dataset.ppMode); drawn = null; runPick = null; ctx.repaint(); return; }
		if (e.target.closest('[data-redraw]')) {
			const items = ctx.data().items || [];
			const cur = pickOf(items);
			let j = jar(items).filter((x) => x.id !== cur?.id && !reachedToday(x));
			if (!j.length) j = items.filter((x) => !x.paused && x.id !== cur?.id);
			if (!j.length) return;
			const next = j[Math.floor(Math.random() * j.length)];
			/* the slips shuffle in the name's place a moment, then the new one */
			const nameEl = $('.pp-today__name'), names = items.map((x) => x.name);
			if (nameEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
				nameEl.classList.add('is-rolling');
				for (let i = 0; i < 10; i++) { nameEl.textContent = names[Math.floor(Math.random() * names.length)]; await new Promise((r) => setTimeout(r, 60 + i * 8)); }
			}
			drawn = next.id;
			ctx.repaint();
			return;
		}
		const r = e.target.closest('[data-reach],[data-unreach],[data-pause]');
		if (!r) return;
		const id = r.dataset.reach || r.dataset.unreach || r.dataset.pause;
		try {
			await ctx.save((d) => {
				const x = (d.items || []).find((y) => y.id === id);
				if (!x) return;
				if (r.dataset.reach) x.reached = [...new Set([...(x.reached || []), live.today()])].sort().slice(-20);
				else if (r.dataset.unreach) x.reached = [...(x.reached || [])].sort().slice(0, -1);
				else x.paused = x.paused ? undefined : true;
			});
		} catch (err) { alert(live.why(err)); }
	},
	empty: ['لسه ما ضفناش حد — ضيفوا قرايبنا وصحابنا وجيراننا ♥', 'No one yet — add our relatives, friends and neighbours ♥'],
	related: ['family', 'famdays', 'calendar']
});
