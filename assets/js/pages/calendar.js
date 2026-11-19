import { L, Y, T, esc, pageHead, related, App, $, $$, num, occasions } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { today, daysTo, iso, parse, nextMD, inDays, holyDays, egyptDays, ics } from '../occ.js';
import { tooltips, TYPE } from '../caltip.js';

/* Our calendar: every occasion of ours in the year ahead on one page. Above the title a tear-off desk calendar flips
   to each coming occasion by itself; then what's next, a page for each of the next twelve months with the days
   marked, and a button that puts them all in the phone's own calendar. It gathers: our birthdays, anniversary and
   first hello (the story), the big days (chapters), every day of our story coming round again (the timeline), the wider family (famdays), the boys' capsule letters opening,
   the Islamic days and Egypt's days of the year. */

const KIND = {
	us: { ar: 'إحنا', en: 'Us', c: 'var(--coral)' },
	days: { ar: 'أيامنا', en: 'Our days', c: '#c2185b' },
	family: { ar: 'العيلة', en: 'Family', c: '#5a9e6f' },
	holy: { ar: 'رمضان والأعياد', en: 'Ramadan & Eid', c: '#6d4bb3' },
	egypt: { ar: 'مواسم السنة', en: 'Days of the year', c: '#e39b2d' },
	capsule: { ar: 'الكبسولة', en: 'Capsule', c: '#0e6990' }
};
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const monthName = (m) => (App.lang === 'ar' ? MONTHS_AR[m] : new Date(2000, m, 1).toLocaleDateString('en-GB', { month: 'long' }));
const dayName = (d) => d.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long' });

/* everything in the coming year, soonest first */
function gather(s, fam, caps) {
	const from = today(), out = [];
	for (const o of occasions(s)) out.push({ date: nextMD(o.date, from), title: o.title, sub: o.sub, icon: o.emoji, kind: 'us', href: o.kind === 'birthday' ? `birthday.html?id=${encodeURIComponent(o.id)}` : 'story.html', yearly: true });
	for (const c of s.chapters || []) if (c.date) out.push({ date: nextMD(c.date, from), title: T(c.title), sub: L('ذكرى يوم فارق', 'A big day’s anniversary'), icon: c.icon || 'ring', kind: 'us', href: `chapter.html?id=${encodeURIComponent(c.id)}`, yearly: true });
	// every day of our story, the year it comes round again: «من ٧ سنين…»
	const seen = new Set(out.map((e) => `${iso(e.date)}|${e.title}`));
	for (const m of s.timeline || []) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '')) continue;
		const date = nextMD(m.date, from), title = T(m.title), n = date.getFullYear() - +m.date.slice(0, 4);
		if (n < 1 || seen.has(`${iso(date)}|${title}`)) continue;
		seen.add(`${iso(date)}|${title}`);
		out.push({ date, title, sub: n === 1 ? L('من سنة', 'A year ago') : n === 2 ? L('من سنتين', 'Two years ago') : L(`من ${num(n)} ${n <= 10 ? 'سنين' : 'سنة'}`, `${n} years ago`), icon: m.icon || 'heart', kind: 'days', href: `moment.html?id=${encodeURIComponent(m.id)}`, yearly: true });
	}
	for (const f of fam) if (f.date) out.push({ date: nextMD(f.date, from), title: f.type === 'wedding' ? L(`عيد جواز ${f.name}`, `${f.name}’s anniversary`) : f.type === 'birthday' ? L(`عيد ميلاد ${f.name}`, `${f.name}’s birthday`) : f.name, sub: f.rel || '', icon: f.type === 'wedding' ? 'ring' : f.type === 'birthday' ? 'cake' : 'star', kind: 'family', href: 'famdays.html', yearly: true });
	for (const h of holyDays(from)) out.push({ date: h.date, title: L(h.ar, h.en), sub: L('بالتقويم الهجري، ممكن يفرق يوم', 'By the Hijri calendar, may differ by a day'), icon: h.icon, kind: 'holy', href: 'ramadan.html' });
	for (const e of egyptDays(from)) out.push({ date: e.date, title: L(e.ar, e.en), sub: '', icon: e.icon, kind: 'egypt', yearly: e.id !== 'nessim' });
	for (const c of caps) if (c.openOn && parse(c.openOn) >= from && daysTo(parse(c.openOn)) <= 366) out.push({ date: parse(c.openOn), title: L(`جواب الكبسولة لـ${c.kidName || ''} يتفتح`, `A capsule letter opens for ${c.kidName || ''}`), sub: c.title || '', icon: 'letter', kind: 'capsule', href: 'capsule.html' });
	return out.filter((e) => daysTo(e.date) <= 366).sort((a, b) => a.date - b.date);
}

export default {
	title: { ar: 'تقويمنا', en: 'Our calendar' },
	render() {
		return `
		${pageHead(L('تقويمنا', 'Our calendar'), L('كل مناسبة لينا في السنة الجاية، في مكان واحد', 'Every occasion of ours in the year ahead, in one place'), [{ href: 'calendar.html', ar: 'تقويمنا', en: 'Our calendar' }], {
			band: `<div class="cal-band" id="cal-band" aria-live="polite"></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			<h2 class="sec__title reveal">${L('جاي قريب', 'Coming up')}</h2>
			<div class="cal-next" id="cal-next"></div>
			<div class="chips cal-keys" id="cal-keys">${Object.entries(KIND).map(([k, v]) => `<span class="cal-key" style="--k:${v.c}"><i></i>${esc(L(v.ar, v.en))}</span>`).join('')}</div>
			<h2 class="sec__title reveal">${L('السنة كلها', 'The whole year')}</h2>
			<div class="cal-months" id="cal-months"></div>
			<div class="cal-day" id="cal-day" hidden></div>
			<p class="center cal-ics"><button class="btn btn--coral" type="button" id="cal-ics">${doodle('calendar', 18)} ${Y('ضيفهم لتقويم الموبايل', 'ضيفيهم لتقويم الموبايل', 'Add them to my phone’s calendar')}</button></p>
		</div></section>
		${related(['birthday', 'famdays', 'ramadan'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const [fam, caps] = await Promise.all([live.load('famdays').catch(() => ({})), live.load('capsule').catch(() => ({}))]);
		const capsules = (caps.items || []).map((c) => ({ ...c, kidName: App.t(kids.find((k) => k.id === c.kid)?.name || '') }));
		const events = gather(s, fam.items || [], capsules);

		/* the band: a tear-off calendar flipping through what's coming */
		const band = $('#cal-band', main);
		const page = (e) => `<div class="cal-pg" style="--k:${KIND[e.kind].c}">
			<span class="cal-pg__m">${esc(monthName(e.date.getMonth()))}</span>
			<b class="cal-pg__d">${num(e.date.getDate())}</b>
			<span class="cal-pg__w">${esc(dayName(e.date))}</span>
			<span class="cal-pg__t"><i aria-hidden="true">${doodle(e.icon, 20)}</i> ${esc(e.title)}</span>
			<em class="cal-pg__in">${esc(inDays(daysTo(e.date)))}</em>
		</div>`;
		const coming = events.slice(0, 8);
		band.innerHTML = `<div class="cal-pad"><span class="cal-rings" aria-hidden="true">${'<i></i>'.repeat(7)}</span><div class="cal-stack" id="cal-stack">${coming.length ? page(coming[0]) : `<div class="cal-pg"><b class="cal-pg__d">${num(today().getDate())}</b><span class="cal-pg__t">${L('مفيش مناسبات قريبة', 'Nothing coming up')}</span></div>`}</div></div>`;
		let k = 0, timer = 0;
		const flip = () => {
			if (coming.length < 2 || document.hidden) return;
			const stack = $('#cal-stack', main);
			const old = stack.firstElementChild;
			k = (k + 1) % coming.length;
			stack.insertAdjacentHTML('beforeend', page(coming[k]));
			old.classList.add('is-torn');
			setTimeout(() => old.remove(), 900);
		};
		timer = setInterval(flip, 3600);
		this.leave = () => clearInterval(timer);

		/* coming up */
		$('#cal-next', main).innerHTML = events.slice(0, 8).map((e) => `
			<a class="cal-item reveal is-in" ${e.href ? `href="${e.href}"` : ''} style="--k:${KIND[e.kind].c}">
				<span class="cal-item__date"><b>${num(e.date.getDate())}</b><small>${esc(monthName(e.date.getMonth()))}</small></span>
				<span class="cal-item__tx"><b dir="auto">${esc(e.title)}</b>${e.sub ? `<small dir="auto">${esc(e.sub)}</small>` : ''}</span>
				<em>${esc(inDays(daysTo(e.date)))}</em>
			</a>`).join('') || `<p class="empty">${L('مفيش مناسبات لسه', 'No occasions yet')}</p>`;

		/* the next twelve months, a page each */
		const byDay = new Map();
		for (const e of events) { const key = iso(e.date); (byDay.get(key) || byDay.set(key, []).get(key)).push(e); }
		const start = today(); start.setDate(1);
		const weekStart = App.lang === 'ar' ? 6 : 1; // Saturday in Egypt, Monday in English
		const heads = Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 7 + ((weekStart + i) % 7)).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'narrow' }));
		let html = '';
		for (let mi = 0; mi < 12; mi++) {
			const m = new Date(start.getFullYear(), start.getMonth() + mi, 1);
			const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
			const lead = (m.getDay() - weekStart + 7) % 7;
			let cells = '<i></i>'.repeat(lead);
			for (let d = 1; d <= days; d++) {
				const date = new Date(m.getFullYear(), m.getMonth(), d), key = iso(date), evs = byDay.get(key) || [];
				const isToday = key === iso(today());
				cells += evs.length
					? `<button type="button" class="cal-d has-ev${isToday ? ' is-today' : ''}" data-day="${key}" data-tip="${TYPE[evs[0].kind] || 'cora'}" style="--k:${KIND[evs[0].kind].c}" aria-label="${esc(`${num(d)} ${monthName(m.getMonth())}: ${evs.map((e) => e.title).join('، ')}`)}">${num(d)}</button>`
					: `<span class="cal-d${isToday ? ' is-today' : ''}">${num(d)}</span>`;
			}
			const count = [...byDay.keys()].filter((key) => key.startsWith(iso(m).slice(0, 7))).length;
			html += `<article class="cal-month reveal is-in"><h3>${esc(monthName(m.getMonth()))} <small>${m.getFullYear() !== today().getFullYear() || mi === 0 ? num(m.getFullYear()).replace(/[٬,]/g, '') : ''}</small>${count ? `<em>${num(count)}</em>` : ''}</h3>
				<div class="cal-grid">${heads.map((h) => `<b>${h}</b>`).join('')}${cells}</div></article>`;
		}
		$('#cal-months', main).innerHTML = html;

		/* hover a marked day: its tooltip pops out, each kind of day in its own shape (caltip.js) */
		const untip = tooltips($('#cal-months', main), '[data-day]', {
			kind: (el) => el.dataset.tip,
			html: (el) => {
				const evs = byDay.get(el.dataset.day) || [], d = parse(el.dataset.day);
				const more = evs.length - 3;
				return `<p class="ctip__when">${esc(dayName(d))} ${num(d.getDate())} ${esc(monthName(d.getMonth()))} · ${esc(inDays(daysTo(d)))}</p>
					${evs.slice(0, 3).map((ev) => `<p class="ctip__ev" style="--k:${KIND[ev.kind].c}"><i aria-hidden="true">${doodle(ev.icon, 16)}</i><span><b dir="auto">${esc(ev.title)}</b>${ev.sub ? `<small dir="auto">${esc(ev.sub)}</small>` : ''}</span></p>`).join('')}
					${more > 0 ? `<p class="ctip__more">${L(`و${num(more)} كمان`, `and ${more} more`)}</p>` : ''}`;
			}
		});
		const stop = this.leave;
		this.leave = () => { stop?.(); untip(); };

		/* a tap on a marked day says what it is */
		const dayBox = $('#cal-day', main);
		$('#cal-months', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-day]');
			if (!b) return;
			const evs = byDay.get(b.dataset.day) || [];
			const d = parse(b.dataset.day);
			$$('.cal-d.is-on', main).forEach((x) => x.classList.remove('is-on'));
			b.classList.add('is-on');
			dayBox.hidden = false;
			dayBox.innerHTML = `<h3>${esc(dayName(d))} ${num(d.getDate())} ${esc(monthName(d.getMonth()))} <em>${esc(inDays(daysTo(d)))}</em></h3>${evs.map((ev) => `<p style="--k:${KIND[ev.kind].c}"><i aria-hidden="true">${doodle(ev.icon, 18)}</i> <b dir="auto">${esc(ev.title)}</b>${ev.sub ? ` — <span dir="auto">${esc(ev.sub)}</span>` : ''}</p>`).join('')}`;
			dayBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});

		/* everything into the phone's calendar */
		$('#cal-ics', main).onclick = () => {
			const blob = new Blob([ics(events.map((e) => ({ date: e.date, title: e.title, yearly: e.yearly })))], { type: 'text/calendar' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = 'our-occasions.ics';
			a.click();
			setTimeout(() => URL.revokeObjectURL(a.href), 4000);
		};
	}
};
