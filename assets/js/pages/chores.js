import { L, Y, esc, pageHead, related, App, $, $$, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { mark, unmark, markSVG } from '../checkfx.js';

/* Who does what: the house jobs, whose turn each one is, and a star for every one that gets done. Above the title a
   wheel with everyone's names spins and lands on whoever's turn it is now, with their job for today (or spin it
   yourself). Below, this week's chart — Saturday to Friday, a job in each row — tap a job and a pen ticks it off (checkfx.js, Codrops'
   animated checkboxes), and it counts as a star for whoever did it. */

const DAYS = [6, 0, 1, 2, 3, 4, 5];                // Saturday first, as the week goes in Egypt
const ICONS = ['dinner', 'trash', 'eraser', 'coffee', 'walk', 'book', 'star', 'gift'];
const WHEEL = ['#f9a3a8', '#ffd66b', '#b9e08a', '#8fd1ef', '#d6b4f0', '#feac5e'];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 1) % 7)); return x; };
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default {
	title: { ar: 'مين بيعمل إيه', en: 'Who does what' },
	render(s) {
		const ok = live.canWrite();
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const people = [['him', App.t(s.him)], ['her', App.t(s.her)], ...kids.map((k) => [k.id, App.t(k.name)])];
		const dayName = (d) => new Date(2024, 0, 6 + ((d + 1) % 7)).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' });
		return `
		${pageHead(L('مين بيعمل إيه', 'Who does what'), L('شغل البيت بالدور… ونجمة لكل حاجة خلصت', 'The house jobs in turns… and a star for every one done'), [{ href: 'chores.html', ar: 'مين بيعمل إيه', en: 'Who does what' }], {
			band: `<div class="ch-band" id="ch-band">
				<div class="ch-wheel-wrap">
					<span class="ch-pointer" aria-hidden="true"></span>
					<svg class="ch-wheel" id="ch-wheel" viewBox="-110 -110 220 220" aria-hidden="true"></svg>
				</div>
				<div class="ch-pick">
					<p class="ch-pick__k">${L('الدور على', 'It’s the turn of')}</p>
					<p class="ch-pick__who" id="ch-who">…</p>
					<p class="ch-pick__job" id="ch-job"></p>
					<button class="btn btn--sm" type="button" id="ch-spin">${doodle('refresh', 16)} ${Y('لف العجلة', 'لفي العجلة', 'Spin the wheel')}</button>
				</div>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('star', 22)}</span> ${Y('ضيف شغلانة', 'ضيفي شغلانة', 'Add a job')}</summary>
				<form id="ch-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('الشغلانة', 'The job')}</span><input name="title" dir="auto" maxlength="50" required placeholder="${L('نغسل المواعين، نرتب الأوضة…', 'Wash up, tidy the room…')}"></label>
						<label class="f"><span>${L('مين؟', 'Who?')}</span><select name="who">${people.map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join('')}<option value="rotate">${L('بالدور', 'In turns')}</option><option value="all">${L('كلنا', 'All of us')}</option></select></label>
					</div>
					<fieldset class="ch-days"><legend>${L('أنهي أيام؟', 'Which days?')}</legend>${DAYS.map((d) => `<label><input type="checkbox" name="d" value="${d}" checked><span>${esc(dayName(d))}</span></label>`).join('')}</fieldset>
					<fieldset class="moods"><legend>${L('أيقونة', 'Icon')}</legend>${ICONS.map((ic, k) => `<label><input type="radio" name="icon" value="${ic}"${k === 0 ? ' checked' : ''}><span>${doodle(ic, 24)}</span></label>`).join('')}</fieldset>
					<p class="form-msg" id="ch-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${L('ضيفها ♥', 'Add it ♥')}</button></div>
				</form>
			</details>
			<div class="counters ch-stars" id="ch-stars"></div>
			<div class="ch-scroll"><table class="ch-chart" id="ch-chart"></table></div>
			<p class="ch-week" id="ch-week"></p>
		</div></section>
		${related(['family', 'goals', 'games'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const people = [['him', App.t(s.him)], ['her', App.t(s.her)], ...kids.map((k) => [k.id, App.t(k.name)])];
		const nameOf = (id) => people.find((p) => p[0] === id)?.[1] || L('كلنا', 'All of us');
		let data = await live.load('chores');
		const start = weekStart();
		const days = DAYS.map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
		const weekNo = Math.floor(start.getTime() / (7 * 864e5));
		/* whose turn a job is on a day: its own person, everyone, or round the family in turns */
		const turn = (c, i) => (c.who === 'rotate' ? people[(weekNo * 7 + i + hash(c.id)) % people.length][0] : c.who);
		const todayIdx = days.findIndex((d) => iso(d) === iso(new Date()));

		/* the wheel: a slice for everyone */
		const wheel = $('#ch-wheel', main);
		const n = people.length, seg = 360 / n;
		const pt = (a, r = 100) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
		wheel.innerHTML = `<circle r="104" class="ch-rim"/>` + people.map(([, name], i) => {
			const [x1, y1] = pt(i * seg), [x2, y2] = pt((i + 1) * seg), [tx, ty] = pt((i + 0.5) * seg, 62);
			return `<path d="M0 0L${x1.toFixed(1)} ${y1.toFixed(1)}A100 100 0 ${seg > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="${WHEEL[i % WHEEL.length]}"/>
				<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${((i + 0.5) * seg).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${esc(name)}</text>`;
		}).join('') + `<circle r="14" class="ch-hub"/>`;
		let angle = 0, spinning = false;
		const spin = (to) => {
			if (spinning) return;
			spinning = true;
			// several turns, then stop with that person's slice under the pointer at the top
			const target = 360 * 5 + (360 - (to + 0.5) * seg) + (Math.random() - 0.5) * seg * 0.6;
			angle = angle - (angle % 360) + target;
			wheel.style.transform = `rotate(${angle}deg)`;
			setTimeout(() => {
				spinning = false;
				const id = people[to][0];
				$('#ch-who', main).textContent = people[to][1];
				const jobs = (data.items || []).filter((c) => c.type !== 'done' && todayIdx >= 0 && (c.days || []).includes(DAYS[todayIdx]) && (turn(c, todayIdx) === id || c.who === 'all'));
				$('#ch-job', main).innerHTML = jobs.length ? jobs.map((c) => `${doodle(c.icon || 'star', 16)} ${esc(c.title)}`).join(' · ') : L('مفيش شغل عليه النهارده — يرتاح ♥', 'Nothing for them today — a day off ♥');
				$('#ch-pick', main)?.classList.add('is-in');
			}, 3200);
		};
		const someone = () => {
			// prefer someone with a job today
			const busy = people.map((p, i) => i).filter((i) => (data.items || []).some((c) => c.type !== 'done' && todayIdx >= 0 && (c.days || []).includes(DAYS[todayIdx]) && turn(c, todayIdx) === people[i][0]));
			const pool = busy.length ? busy : people.map((p, i) => i);
			return pool[Math.floor(Math.random() * pool.length)];
		};
		$('#ch-spin', main).onclick = () => spin(Math.floor(Math.random() * n));
		setTimeout(() => spin(someone()), 400);
		const auto = setInterval(() => { if (!document.hidden) spin(someone()); }, 9000);
		this.leave = () => clearInterval(auto);

		const paint = () => {
			const chores = (data.items || []).filter((c) => c.type !== 'done');
			const done = new Set((data.items || []).filter((c) => c.type === 'done').map((c) => c.id));
			const key = (c, d) => `done-${c.id}-${iso(d)}`;
			/* stars this week */
			const stars = Object.fromEntries(people.map(([id]) => [id, 0]));
			chores.forEach((c) => days.forEach((d, i) => { if ((c.days || []).includes(DAYS[i]) && done.has(key(c, d))) { const w = turn(c, i); if (w === 'all') people.forEach(([id]) => stars[id]++); else if (w in stars) stars[w]++; } }));
			const top = Math.max(0, ...Object.values(stars));
			$('#ch-stars', main).innerHTML = people.map(([id, name]) => `<div class="counter${top && stars[id] === top ? ' is-lead' : ''}">${top && stars[id] === top ? `<i class="gm-crown" aria-hidden="true">${doodle('crown', 22)}</i>` : ''}<b>${num(stars[id])} <span class="ch-star">${doodle('star', 22)}</span></b><span>${esc(name)}</span></div>`).join('');
			/* the chart */
			const head = `<tr><th></th>${days.map((d, i) => `<th class="${i === todayIdx ? 'is-today' : ''}">${esc(d.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' }))}<small>${num(d.getDate())}</small></th>`).join('')}</tr>`;
			const rows = chores.map((c) => `<tr><th scope="row"><div class="ch-job" style="--c:${WHEEL[hash(c.id) % WHEEL.length]}"><span class="ch-job__ic">${doodle(c.icon || 'star', 20)}</span><span class="ch-job__tx"><b dir="auto" title="${esc(c.title)}">${esc(c.title)}</b><small>${esc(c.who === 'rotate' ? L('بالدور', 'In turns') : nameOf(c.who))} · ${(c.days || []).length === 7 ? L('كل يوم', 'every day') : ((n) => L(n === 1 ? 'يوم في الأسبوع' : n === 2 ? 'يومين في الأسبوع' : `${num(n)} أيام في الأسبوع`, `${n} day${n === 1 ? '' : 's'} a week`))((c.days || []).length)}</small></span>${c.by === live.me() && live.canWrite() ? `<button class="ch-job__del" type="button" data-del="${esc(c.id)}" aria-label="${L('مسح', 'Delete')}">${doodle('trash', 15)}</button>` : ''}</div></th>${days.map((d, i) => {
				if (!(c.days || []).includes(DAYS[i])) return `<td class="is-off"></td>`;
				const w = turn(c, i), on = done.has(key(c, d));
				return `<td class="${i === todayIdx ? 'is-today' : ''}"><button type="button" class="ch-cell${on ? ' is-done' : ''}" data-tick="${esc(key(c, d))}" data-chore="${esc(c.id)}"${live.canWrite() ? '' : ' disabled'} aria-pressed="${on}" title="${esc(nameOf(w))}"><span>${esc(w === 'all' ? L('كلنا', 'All') : nameOf(w))}</span>${markSVG('checkmark', 'ch-tick')}</button></td>`;
			}).join('')}</tr>`).join('');
			$('#ch-chart', main).innerHTML = chores.length ? `<thead>${head}</thead><tbody>${rows}</tbody>` : `<tbody><tr><td class="empty">${Y('ضيف أول شغلانة — وهتظهر في الجدول', 'ضيفي أول شغلانة — وهتظهر في الجدول', 'Add the first job and it shows up on the chart')}</td></tr></tbody>`;
			for (const el of $$('.ch-cell.is-done .ch-tick', main)) mark(el, 'checkmark', false);
			$('#ch-week', main).textContent = L(`الأسبوع ده: من ${days[0].toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })} لـ${days[6].toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}`, `This week: ${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} to ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`);
		};

		$('#ch-chart', main).addEventListener('click', async (e) => {
			const t = e.target.closest('[data-tick]'), del = e.target.closest('[data-del]');
			try {
				if (t) {
					const id = t.dataset.tick;
					const on = t.classList.toggle('is-done');  // the pen ticks it straight away
					if (on) mark($('.ch-tick', t), 'checkmark'); else unmark($('.ch-tick', t));
					t.setAttribute('aria-pressed', on);
					await new Promise((r) => setTimeout(r, on ? 350 : 0));
					data = await live.save('chores', (d) => { d.items = d.items || []; if (d.items.some((x) => x.id === id)) d.items = d.items.filter((x) => x.id !== id); else d.items.push({ id, type: 'done', chore: t.dataset.chore, by: live.me(), at: Date.now() }); });
					paint();
				}
				if (del && confirm(Y('تمسح الشغلانة دي؟', 'تمسحي الشغلانة دي؟', 'Delete this job?'))) { data = await live.save('chores', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del && x.chore !== del.dataset.del); }); paint(); }
			} catch (err) { alert(live.why(err)); }
		});
		const f = $('#ch-form', main);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#ch-msg', main);
			const c = { id: live.newId(), title: f.title.value.trim(), who: f.who.value, days: $$('input[name="d"]:checked', f).map((x) => +x.value), icon: f.icon.value, by: live.me(), at: Date.now() };
			if (!c.title || !c.days.length) { msg.textContent = L('اختار يوم واحد على الأقل', 'Pick at least one day'); return; }
			try { data = await live.save('chores', (d) => { (d.items = d.items || []).push(c); }); f.reset(); msg.textContent = L('اتضافت ♥', 'Added ♥'); paint(); } catch (err) { msg.textContent = live.why(err); }
		};
		paint();
	}
};
