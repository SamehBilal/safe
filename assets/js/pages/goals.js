import { L, Y, T, esc, pageHead, related, App, $, $$, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';

/* Our goals: the things we want to get to one day (a car, a flat, a trip, a course). Both phones add them, break them
   into steps and tick the steps off; a goal with a price keeps count of what we've put aside for it. A goal we reach
   moves down to «we did it», stamped with the day. Kept in the shared list content/live/goals.bin, like the wishes. */

const LINE = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const CATS = [
	{ id: 'car', ar: 'عربية', en: 'A car', c: '#0e6990', ic: LINE('<path d="M3 16v-3.5l2-5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5l2 5V16"/><path d="M3 12.5h18"/><rect x="2.5" y="12.5" width="19" height="4.5" rx="1.5"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>') },
	{ id: 'home', ar: 'بيت', en: 'A home', c: '#d9534f', ic: LINE('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>') },
	{ id: 'travel', ar: 'سفر', en: 'Travel', c: '#26706b', ic: doodle('plane', 26) },
	{ id: 'money', ar: 'فلوس', en: 'Money', c: '#5a9e6f', ic: LINE('<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/><path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>') },
	{ id: 'learn', ar: 'نتعلم', en: 'Learning', c: '#6d4bb3', ic: doodle('book', 26) },
	{ id: 'family', ar: 'العيلة', en: 'Family', c: '#c2185b', ic: doodle('family', 26) },
	{ id: 'health', ar: 'صحتنا', en: 'Health', c: '#e39b2d', ic: doodle('heart', 26) },
	{ id: 'other', ar: 'حاجة تانية', en: 'Something else', c: '#8a5a2b', ic: doodle('star', 26) }
];
const cat = (id) => CATS.find((c) => c.id === id) || CATS[CATS.length - 1];
const money = (n) => num(Math.round(+n || 0));
const thisYear = new Date().getFullYear();

/** How far along a goal is, 0…1: by what's saved when it has a price, else by its steps. */
export function progress(g) {
	if (g.done) return 1;
	if (+g.cost > 0) return Math.min(1, (+g.saved || 0) / +g.cost);
	const st = g.steps || [];
	return st.length ? st.filter((s) => s.done).length / st.length : 0;
}

/* "by 2027" / "by March 2027", and how long is left */
function when(g) {
	if (!g.when) return '';
	const [y, m] = String(g.when).split('-').map(Number);
	const label = m ? new Intl.DateTimeFormat(App.lang === 'ar' ? 'ar-EG' : 'en', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1)) : num(y).replace(/[٬,]/g, '');
	const left = y - thisYear;
	const tail = g.done ? '' : left > 1 ? L(` · فاضل ${num(left)} سنين`, ` · ${left} years to go`) : left === 1 ? L(' · السنة الجاية', ' · next year') : left === 0 ? L(' · السنة دي!', ' · this year!') : L(' · عدّى ميعادها، لسه بنحاول', ' · past its date, still trying');
	return `${L('قبل', 'By')} ${label}${tail}`;
}

function card(g, k) {
	const c = cat(g.cat);
	const p = progress(g);
	const ok = live.canWrite();
	const mine = ok && g.by === live.me();
	const who = App.t(g.by === 'him' ? App.story.him : App.story.her);
	const steps = g.steps || [];
	return `<article class="goal reveal${g.done ? ' is-done' : ''}" id="${esc(g.id)}" style="--c:${c.c};--p:${p.toFixed(3)};--delay:${(k % 3) * 0.06}s">
		<header class="goal__top">
			<span class="goal__ic" aria-hidden="true">${c.ic}</span>
			<span class="goal__cat">${esc(L(c.ar, c.en))}</span>
			${g.done ? `<span class="goal__stamp">${L('حققناها ♥', 'We did it ♥')}<small>${esc(longDate(g.done))}</small></span>` : ''}
		</header>
		<h3 class="goal__t" dir="auto">${esc(g.title)}</h3>
		${g.when ? `<p class="goal__when">${doodle('calendar', 16)} ${esc(when(g))}</p>` : ''}
		${g.note ? `<p class="goal__note" dir="auto">${esc(g.note)}</p>` : ''}
		<div class="goal__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}" aria-label="${L('وصلنا لفين', 'How far along')}"><i></i><b>${num(Math.round(p * 100))}${L('٪', '%')}</b></div>
		${+g.cost > 0 ? `<p class="goal__money"><b>${money(g.saved)}</b> ${L('من', 'of')} ${money(g.cost)} ${L('جنيه', 'EGP')}</p>
			${ok && !g.done ? `<form class="goal__save" data-save="${esc(g.id)}"><label class="sr-only" for="sv-${esc(g.id)}">${L('حوشنا كام؟', 'How much did we put aside?')}</label><input id="sv-${esc(g.id)}" name="amt" type="number" inputmode="numeric" min="1" step="1" placeholder="${L('حوشنا كام النهارده؟', 'Put aside today…')}"><button class="btn btn--sm" type="submit">+ ${L('حوشنا', 'Add')}</button></form>` : ''}` : ''}
		${steps.length ? `<ul class="goal__steps">${steps.map((s) => `<li><label class="check${s.done ? ' is-on' : ''}"><input type="checkbox" data-step="${esc(g.id)}" data-s="${esc(s.id)}"${s.done ? ' checked' : ''}${ok && !g.done ? '' : ' disabled'}> <span dir="auto">${esc(s.text)}</span></label></li>`).join('')}</ul>` : ''}
		${ok && !g.done ? `<form class="goal__add" data-addstep="${esc(g.id)}"><label class="sr-only" for="st-${esc(g.id)}">${L('خطوة جديدة', 'A new step')}</label><input id="st-${esc(g.id)}" name="step" dir="auto" maxlength="100" placeholder="${L('+ خطوة كمان', '+ another step')}"></form>` : ''}
		<footer class="goal__foot">
			<small>${L('حلم', 'A dream of')} ${esc(who)}</small>
			<span class="goal__acts">
				${ok ? (g.done ? `<button class="link" type="button" data-undo="${esc(g.id)}">${L('لسه مخلصناش', 'Not yet after all')}</button>` : `<button class="btn btn--sm btn--coral" type="button" data-done="${esc(g.id)}">${L('حققناها!', 'We did it!')}</button>`) : ''}
				${mine ? `<button class="link link--danger" type="button" data-del="${esc(g.id)}">${L('مسح', 'Delete')}</button>` : ''}
			</span>
		</footer>
	</article>`;
}

export default {
	title: { ar: 'أهدافنا', en: 'Our goals' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('أهدافنا', 'Our goals'), L('الحاجات اللي ناويين نوصلها سوا — خطوة خطوة', 'What we mean to get to together — one step at a time'), [{ href: 'goals.html', ar: 'أهدافنا', en: 'Our goals' }], [['star', 'نفسنا', 'We wish'], ['calendar', 'قريب', 'Soon'], ['heart', 'سوا', 'Together'], ['sparkle', 'هنوصل', 'We’ll get there']])}
		<section class="sec sec--top"><div class="wrap">
			<div class="goal-stats" id="gl-stats"></div>
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:0 auto 28px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('star', 22)}</span> ${Y('ضيف هدف', 'ضيفي هدف', 'Add a goal')}</summary>
				<form id="gl-form" autocomplete="off">
					<label class="f"><span>${L('عايزين نوصل لإيه؟', 'What do we want to get to?')}</span><input name="title" dir="auto" maxlength="90" required placeholder="${L('نشتري عربية', 'Buy a car')}"></label>
					<div class="f-row">
						<label class="f"><span>${L('نوعه', 'Kind')}</span><select name="cat">${CATS.map((c) => `<option value="${c.id}">${esc(L(c.ar, c.en))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('قبل إمتى؟ (اختياري)', 'By when? (optional)')}</span><input name="when" type="month" min="${thisYear}-01"></label>
					</div>
					<div class="f-row">
						<label class="f"><span>${L('هيتكلف كام؟ (اختياري)', 'What will it cost? (optional)')}</span><input name="cost" type="number" inputmode="numeric" min="0" step="1" placeholder="${L('بالجنيه', 'in EGP')}"></label>
						<label class="f"><span>${L('حوشنا كام لحد دلوقتي؟', 'Put aside so far?')}</span><input name="saved" type="number" inputmode="numeric" min="0" step="1"></label>
					</div>
					<label class="f"><span>${L('الخطوات (كل خطوة في سطر)', 'Steps (one per line)')}</span><textarea name="steps" dir="auto" rows="3" maxlength="800" placeholder="${L('نطلع رخصة\nنختار الموديل\nنحوش المقدم', 'Get a licence\nPick the model\nSave the deposit')}"></textarea></label>
					<label class="f"><span>${L('ليه عايزينه؟', 'Why do we want it?')}</span><textarea name="note" dir="auto" rows="2" maxlength="300"></textarea></label>
					<p class="form-msg" id="gl-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('حطه على اللوحة ♥', 'حطيه على اللوحة ♥', 'Pin it on the board ♥')}</button></div>
				</form>
			</details>
			<div class="chips" role="toolbar" aria-label="${L('النوع', 'Kind')}" id="gl-chips"></div>
			<div class="goals" id="gl-list"><p class="empty">${L('بنجيب أهدافنا…', 'Fetching our goals…')}</p></div>
			<h2 class="sec__title goals-done-h" id="gl-done-h" hidden>${L('حققناها ♥', 'We did it ♥')}</h2>
			<div class="goals goals--done" id="gl-done"></div>
		</div></section>
		${related(['wishes', 'family', 'anniversaries'])}`;
	},

	async after(main) {
		const list = $('#gl-list', main), done = $('#gl-done', main), chips = $('#gl-chips', main);
		let data = { items: [] };
		let only = '';

		const all = () => (data.items || []).slice();
		const paint = () => {
			const open = all().filter((g) => !g.done && (!only || g.cat === only))
				.sort((a, b) => (a.when || '9999').localeCompare(b.when || '9999') || (b.at || 0) - (a.at || 0));
			const fin = all().filter((g) => g.done).sort((a, b) => String(b.done).localeCompare(String(a.done)));
			list.innerHTML = open.length ? open.map(card).join('')
				: `<p class="empty">${all().some((g) => !g.done) ? L('مفيش أهداف من النوع ده', 'No goals of this kind') : Y('اللوحة فاضية… ضيف أول حاجة نفسنا نوصلها ♥', 'اللوحة فاضية… ضيفي أول حاجة نفسنا نوصلها ♥', 'The board is empty… add the first thing we want to get to ♥')}</p>`;
			done.innerHTML = fin.map(card).join('');
			$('#gl-done-h', main).hidden = !fin.length;
			for (const el of $$('.reveal', main)) el.classList.add('is-in');
			const used = CATS.filter((c) => all().some((g) => !g.done && g.cat === c.id));
			chips.hidden = used.length < 2;
			chips.innerHTML = `<button class="chip${only ? '' : ' is-on'}" type="button" data-cat="">${L('الكل', 'All')}</button>${used.map((c) => `<button class="chip${only === c.id ? ' is-on' : ''}" type="button" data-cat="${c.id}">${esc(L(c.ar, c.en))}</button>`).join('')}`;
			const going = all().filter((g) => !g.done);
			const avg = going.length ? going.reduce((a, g) => a + progress(g), 0) / going.length : 0;
			const next = going.filter((g) => g.when).sort((a, b) => a.when.localeCompare(b.when))[0];
			$('#gl-stats', main).innerHTML = [
				[num(going.length), L('هدف بنشتغل عليه', going.length === 1 ? 'goal we’re working on' : 'goals we’re working on')],
				[num(fin.length), L('حققناهم', 'reached')],
				[`${num(Math.round(avg * 100))}${L('٪', '%')}`, L('وصلنا في المتوسط', 'of the way, on average')],
				[next ? esc(next.title) : '–', L('اللي عليه الدور', 'next up')]
			].map(([b, s]) => `<div class="goal-stat"><b dir="auto">${b}</b><small>${s}</small></div>`).join('');
		};

		const save = async (fn) => {
			try { data = await live.save('goals', fn); paint(); }
			catch (err) { alert(live.why(err)); }
		};
		const find = (d, id) => (d.items || []).find((g) => g.id === id);

		chips.onclick = (e) => { const c = e.target.closest('[data-cat]'); if (c) { only = c.dataset.cat; paint(); } };
		main.querySelector('.sec').addEventListener('change', (e) => {
			const box = e.target.closest('[data-step]');
			if (!box) return;
			save((d) => { const s = (find(d, box.dataset.step)?.steps || []).find((x) => x.id === box.dataset.s); if (s) s.done = box.checked; });
		});
		main.querySelector('.sec').addEventListener('submit', (e) => {
			const f = e.target;
			if (f.dataset.save) {
				e.preventDefault();
				const amt = Math.round(+f.amt.value);
				if (amt > 0) save((d) => { const g = find(d, f.dataset.save); if (g) g.saved = (+g.saved || 0) + amt; });
			} else if (f.dataset.addstep) {
				e.preventDefault();
				const text = f.step.value.trim();
				if (text) save((d) => { const g = find(d, f.dataset.addstep); if (g) (g.steps = g.steps || []).push({ id: live.newId(), text, done: false }); });
			}
		});
		main.querySelector('.sec').addEventListener('click', (e) => {
			const b = e.target.closest('[data-done], [data-undo], [data-del]');
			if (!b) return;
			if (b.dataset.done) save((d) => { const g = find(d, b.dataset.done); if (g) g.done = live.today(); });
			if (b.dataset.undo) save((d) => { const g = find(d, b.dataset.undo); if (g) delete g.done; });
			if (b.dataset.del && confirm(Y('تمسح الهدف ده؟', 'تمسحي الهدف ده؟', 'Delete this goal?'))) save((d) => { d.items = (d.items || []).filter((g) => g.id !== b.dataset.del); });
		});

		const form = $('#gl-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gl-msg', main);
			const n = (v) => (v === '' ? undefined : Math.max(0, Math.round(+v)) || undefined);
			const g = {
				id: live.newId(), title: form.title.value.trim(), cat: form.cat.value, when: form.when.value || undefined,
				cost: n(form.cost.value), saved: n(form.saved.value), note: form.note.value.trim() || undefined,
				steps: form.steps.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 20).map((text) => ({ id: live.newId() + Math.random().toString(36).slice(2, 4), text, done: false })),
				by: live.me(), at: Date.now()
			};
			if (!g.title) return;
			try {
				data = await live.save('goals', (d) => { (d.items = d.items || []).push(g); });
				form.reset();
				msg.textContent = L('اتحط على اللوحة ♥', 'On the board ♥');
				only = '';
				paint();
				$('#' + CSS.escape(g.id), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} catch (err) { msg.textContent = live.why(err); }
		};

		data = await live.load('goals');
		paint();
	}
};
