import { L, Y, T, esc, pageHead, related, App, $, $$, num, occasions, img, hydrate } from '../shell.js';
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
const firstPhoto = (x) => x?.photo || x?.cover || (x?.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo)).find(Boolean) || '';
function gather(s, fam, caps) {
	const from = today(), out = [];
	const onDay = new Map();
	for (const m of s.timeline || []) { const p = firstPhoto(m); if (p && m.date && !onDay.has(m.date)) onDay.set(m.date, p); }
	for (const c of s.chapters || []) { const p = firstPhoto(c); if (p && c.date && !onDay.has(c.date)) onDay.set(c.date, p); }
	for (const o of occasions(s)) out.push({ date: nextMD(o.date, from), title: o.title, sub: o.sub, icon: o.emoji, kind: 'us', href: o.kind === 'birthday' ? `birthday.html?id=${encodeURIComponent(o.id)}` : 'story.html', yearly: true, photo: onDay.get(o.date) || '' });
	for (const c of s.chapters || []) if (c.date) out.push({ date: nextMD(c.date, from), title: T(c.title), sub: L('ذكرى يوم فارق', 'A big day’s anniversary'), icon: c.icon || 'ring', kind: 'us', href: `chapter.html?id=${encodeURIComponent(c.id)}`, yearly: true, photo: firstPhoto(c) || onDay.get(c.date) || '' });
	// every day of our story, the year it comes round again: «من ٧ سنين…»
	const seen = new Set(out.map((e) => `${iso(e.date)}|${e.title}`));
	for (const m of s.timeline || []) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '')) continue;
		const date = nextMD(m.date, from), title = T(m.title), n = date.getFullYear() - +m.date.slice(0, 4);
		if (n < 1 || seen.has(`${iso(date)}|${title}`)) continue;
		seen.add(`${iso(date)}|${title}`);
		out.push({ date, title, sub: n === 1 ? L('من سنة', 'A year ago') : n === 2 ? L('من سنتين', 'Two years ago') : L(`من ${num(n)} ${n <= 10 ? 'سنين' : 'سنة'}`, `${n} years ago`), icon: m.icon || 'heart', kind: 'days', href: `moment.html?id=${encodeURIComponent(m.id)}`, yearly: true, photo: firstPhoto(m) || onDay.get(m.date) || '' });
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
			<div class="cal-up" id="cal-next"></div>
			<div class="chips cal-keys" id="cal-keys">${Object.entries(KIND).map(([k, v]) => `<span class="cal-key" style="--k:${v.c}"><i></i>${esc(L(v.ar, v.en))}</span>`).join('')}</div>
			<h2 class="sec__title reveal">${L('السنة كلها', 'The whole year')}</h2>
			<div class="cal-months" id="cal-months"></div>
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
		/* coming up: the very next day pinned up big as a polaroid with its countdown stamped beside it, and the ones
		   after it as ticket stubs — a torn-off calendar page, the words, a little photo, the days stamped on the end */
		const tag = (e) => `<span class="cal-tag" style="--k:${KIND[e.kind].c}">${esc(L(KIND[e.kind].ar, KIND[e.kind].en))}</span>`;
		const snap = (e, size) => (e.photo ? img(e.photo, e.title) : `<span class="cal-snap__ic" aria-hidden="true">${doodle(e.icon, size)}</span>`);
		const [first, ...rest] = events.slice(0, 9);
		const left = (e) => { const n = daysTo(e.date); return n === 0 ? `<b>♥</b><small>${L('النهارده', 'today')}</small>` : n === 1 ? `<b>${num(1)}</b><small>${L('بكرة', 'tomorrow')}</small>` : `<b>${num(n)}</b><small>${L(n <= 10 ? 'أيام' : 'يوم', 'days')}</small>`; };
		const tagOpen = (e, cls) => (e.href ? `<a href="${e.href}" class="${cls}"` : `<div class="${cls}"`);
		const tagClose = (e) => (e.href ? '</a>' : '</div>');
		$('#cal-next', main).innerHTML = first ? `
			${tagOpen(first, 'cal-hero reveal is-in')} style="--k:${KIND[first.kind].c}">
				<span class="cal-snap cal-snap--big${first.photo ? '' : ' is-ic'}"><span class="cal-snap__tape" aria-hidden="true"></span>${snap(first, 64)}</span>
				<span class="cal-hero__tx">
					<span class="cal-hero__kicker">${L('اللي جاي', 'Next up')} ${tag(first)}</span>
					<b class="cal-hero__t" dir="auto">${esc(first.title)}</b>
					${first.sub ? `<small class="cal-hero__s" dir="auto">${esc(first.sub)}</small>` : ''}
					<span class="cal-hero__when">${esc(dayName(first.date))} ${num(first.date.getDate())} ${esc(monthName(first.date.getMonth()))}</span>
				</span>
				<span class="cal-stamp" aria-label="${esc(inDays(daysTo(first.date)))}">${left(first)}</span>
			${tagClose(first)}
			<ol class="cal-stubs">${rest.map((e, i) => `<li class="reveal is-in" style="--k:${KIND[e.kind].c}; --i:${i}">
				${tagOpen(e, 'cal-stub')}>
					<span class="cal-stub__pg"><small>${esc(monthName(e.date.getMonth()))}</small><b>${num(e.date.getDate())}</b></span>
					<span class="cal-stub__tx"><b dir="auto">${esc(e.title)}</b>${e.sub ? `<small dir="auto">${esc(e.sub)}</small>` : ''}</span>
					<span class="cal-snap cal-snap--sm${e.photo ? '' : ' is-ic'}">${snap(e, 22)}</span>
					<em class="cal-stub__in">${esc(inDays(daysTo(e.date)))}</em>
				${tagClose(e)}</li>`).join('')}</ol>` : `<p class="empty">${L('مفيش مناسبات لسه', 'No occasions yet')}</p>`;
		hydrate($('#cal-next', main));

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
		/* a tap on a marked day opens it in a window, like a page torn off the calendar: each thing that day with its
		   photo and a way into its own page */
		const pop = document.createElement('dialog');
		pop.className = 'cmodal cal-pop';
		main.append(pop);
		pop.addEventListener('click', (e) => { if (e.target === pop || e.target.closest('.cmodal__x')) pop.close(); });
		pop.addEventListener('close', () => $$('.cal-d.is-on', main).forEach((x) => x.classList.remove('is-on')));
		const open = (key) => {
			const evs = byDay.get(key) || [], d = parse(key);
			pop.setAttribute('aria-label', `${dayName(d)} ${num(d.getDate())} ${monthName(d.getMonth())}`);
			pop.innerHTML = `<div class="cmodal__in" style="--k:${KIND[evs[0]?.kind || 'us'].c}">
				<header class="cmodal__hd cal-pop__hd">
					<span class="cal-pop__pg" aria-hidden="true"><small>${esc(monthName(d.getMonth()))}</small><b>${num(d.getDate())}</b></span>
					<h2><span class="cal-pop__w">${esc(dayName(d))} ${num(d.getDate())} ${esc(monthName(d.getMonth()))} ${num(d.getFullYear()).replace(/[٬,]/g, '')}</span><em>${esc(inDays(daysTo(d)))}</em></h2>
					<button type="button" class="cmodal__x" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>
				</header>
				<ul class="cal-pop__list">${evs.map((ev, i) => `<li style="--k:${KIND[ev.kind].c}; --i:${i}">
					${tagOpen(ev, 'cal-ev')}>
						<span class="cal-snap cal-snap--md${ev.photo ? '' : ' is-ic'}">${snap(ev, 30)}</span>
						<span class="cal-ev__tx">${tag(ev)}<b dir="auto">${esc(ev.title)}</b>${ev.sub ? `<small dir="auto">${esc(ev.sub)}</small>` : ''}</span>
						${ev.href ? `<span class="cal-ev__go">${Y('افتح', 'افتحي', 'Open')} <i aria-hidden="true">${App.lang === 'ar' ? '←' : '→'}</i></span>` : ''}
					${tagClose(ev)}</li>`).join('')}</ul>
			</div>`;
			hydrate(pop);
			pop.showModal();
			$('.cmodal__x', pop).focus();
		};
		$('#cal-months', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-day]');
			if (!b) return;
			$$('.cal-d.is-on', main).forEach((x) => x.classList.remove('is-on'));
			b.classList.add('is-on');
			open(b.dataset.day);
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
