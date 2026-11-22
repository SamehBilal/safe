/* More party on «أعياد الميلاد»: the birthdays we've already had (from «حكايتنا»), the age counting up live in sticky
   notes, and a sky of balloons to pop — each one lets a photo from a past birthday fly out. */
import { L, T, esc, img, num, App, $, $$, REDUCE, hydrate, parseDate } from './shell.js';
import { doodle } from './doodles.js';

const KEY = /birthday|ميلاد|cake|تورت/i;
const md = (iso) => +iso.slice(5, 7) * 100 + +iso.slice(8, 10);
const shotsOf = (m) => [...new Set([m.photo, ...(m.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo))].filter(Boolean))];

/** The birthdays a member has had, from «حكايتنا»: moments near the date that talk about a birthday or a cake. */
export function pastBirthdays(s, member) {
	if (!member?.born) return [];
	const name = String(member.name?.en || '').toLowerCase();
	const others = (s.family?.members || []).filter((x) => x !== member).map((x) => String(x.name?.en || '').toLowerCase()).filter(Boolean);
	const out = [];
	for (const m of s.timeline || []) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '')) continue;
		const words = `${m.title?.en || ''} ${m.title?.ar || ''} ${m.text?.en || ''}`;
		if (!KEY.test(words)) continue;
		const title = String(m.title?.en || '').toLowerCase();
		const turned = +m.date.slice(0, 4) - +member.born.slice(0, 4);
		if (turned < 1) continue;
		const named = name && title.includes(name);
		if (!named && others.some((o) => title.includes(o))) continue;           // somebody else's
		if (!named && /\bher\b/.test(title) && !member.female) continue;
		if (!named && /\b(his|my)\b|made me/.test(title) && member.female) continue;
		const gap = md(m.date) - md(member.born);
		if (!named && (gap < -8 || gap > 3)) continue;                           // the cake can come a few days early
		if (named && !/birthday|ميلاد/i.test(words)) continue;
		out.push({ m, turned, shots: shotsOf(m) });
	}
	return out.sort((a, b) => a.m.date.localeCompare(b.m.date));
}

/* ---------- the birthdays we've had: polaroids pegged on a string under bunting ---------- */
export function wallHTML(member, past) {
	if (!past.length) return '';
	const nm = App.t(member.name);
	const ord = (t) => t + (t % 100 >= 11 && t % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[t % 10] || 'th');
	const tag = (t) => L(`عيد ميلاد${member.female ? 'ها' : 'ه'} الـ${num(t)}`, `${member.female ? 'Her' : 'His'} ${ord(t)}`);
	const flags = Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
	return `<section class="sec bdw"><div class="wrap">
		<h2 class="sec__title reveal">${L(`أعياد ميلاد ${esc(nm)} اللي عدّت`, `${esc(nm)}’s birthdays so far`)}</h2>
		<p class="sec__sub reveal">${L('من حكايتنا — دوس على أي صورة تفتح اليوم بتاعها', 'From our story — tap a photo to open its day')}</p>
		<div class="bdw__bunting" aria-hidden="true">${flags}</div>
		<ol class="bdw__line">${past.map(({ m, turned, shots }, i) => `<li style="--i:${i}">
			<a class="bdw__snap" href="moment.html?id=${encodeURIComponent(m.id)}">
				<span class="bdw__peg" aria-hidden="true"></span>
				<span class="bdw__pic">${shots[0] ? img(shots[0], T(m.title)) : `<span class="bdw__ic" aria-hidden="true">${doodle('cake', 36)}</span>`}${shots.length > 1 ? `<em>+${num(shots.length - 1)}</em>` : ''}</span>
				<b dir="auto">${esc(T(m.title))}</b>
				<small>${esc(tag(turned))} · ${num(+m.date.slice(0, 4)).replace(/[٬,]/g, '')}</small>
			</a></li>`).join('')}</ol>
		${past.some((p) => p.shots.length > 1) ? `<div class="bdw__film">
			<button type="button" class="bdw__arr bdw__arr--prev" data-go="-1" aria-label="${L('الصور اللي قبل', 'Previous photos')}"><span aria-hidden="true">${App.lang === 'ar' ? '→' : '←'}</span></button>
			<div class="bdw__strip" aria-label="${L('صور من أعياد الميلاد', 'Photos from the birthdays')}">${past.flatMap((p) => p.shots.slice(1, 9).map((ph) => `<a href="moment.html?id=${encodeURIComponent(p.m.id)}">${img(ph, T(p.m.title))}</a>`)).slice(0, 24).join('')}</div>
			<button type="button" class="bdw__arr bdw__arr--next" data-go="1" aria-label="${L('الصور اللي بعد', 'Next photos')}"><span aria-hidden="true">${App.lang === 'ar' ? '←' : '→'}</span></button>
		</div>` : ''}
	</div></section>`;
}

/** The filmstrip's scrollbar shows only while it's moving; a mouse wheel turns it sideways, so no bar is needed to scroll. */
export function filmstrip(root) {
	const strip = $('.bdw__strip', root);
	if (!strip) return;
	let t = 0;
	strip.addEventListener('scroll', () => { strip.classList.add('is-scrolling'); clearTimeout(t); t = setTimeout(() => strip.classList.remove('is-scrolling'), 900); }, { passive: true });
	strip.addEventListener('wheel', (e) => {
		if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		const max = strip.scrollWidth - strip.clientWidth, at = Math.abs(strip.scrollLeft);
		// at either end the page scrolls on as usual
		if (max <= 0 || (e.deltaY > 0 && at >= max - 1) || (e.deltaY < 0 && at <= 0)) return;
		e.preventDefault();
		strip.scrollBy({ left: (document.documentElement.dir === 'rtl' ? -1 : 1) * e.deltaY });
	}, { passive: false });
	// the arrows move a screenful at a time, in the reading direction; each one fades out at its end of the strip
	const film = strip.closest('.bdw__film'), rtl = () => document.documentElement.dir === 'rtl';
	const ends = () => {
		const max = strip.scrollWidth - strip.clientWidth, at = Math.abs(strip.scrollLeft);
		film?.classList.toggle('is-start', at <= 2);
		film?.classList.toggle('is-end', at >= max - 2);
	};
	film?.addEventListener('click', (e) => {
		const b = e.target.closest('[data-go]');
		if (!b) return;
		strip.scrollBy({ left: +b.dataset.go * (rtl() ? -1 : 1) * strip.clientWidth * 0.8, behavior: REDUCE ? 'auto' : 'smooth' });
	});
	strip.addEventListener('scroll', ends, { passive: true });
	new ResizeObserver(ends).observe(strip);
	ends();
}

/* ---------- the age, counting up live ---------- */
/* In the theme: one big counter of the seconds lived on a ruled strip, the next birthday counted down in four boxes
   beside a drawn cake, and six cards (ink border, a coloured shadow, a drawn icon in a round badge) for the days, hours,
   heartbeats, sunrises, full moons and the birthdays since we met. */
export function tickerHTML(member, s) {
	if (!member?.born) return '';
	const nm = App.t(member.name);
	const together = s.met && member.born < s.met;
	const she = !!member.female;
	const card = (k, ic, c, label) => `<li class="bdt__card" data-k="${k}" style="--c:${c}"><span class="bdt__badge">${doodle(ic, 26)}</span><b data-v>—</b><small>${label}</small></li>`;
	const box = (k, label) => `<span class="bdt__cd" data-cd="${k}"><b>—</b><i>${label}</i></span>`;
	return `<section class="sec bdt"><div class="wrap">
		<h2 class="sec__title reveal">${L(`${esc(nm)} بالأرقام`, `${esc(nm)} in numbers`)}</h2>
		<p class="sec__sub reveal">${L('بتعد دلوقتي، ثانية بثانية', 'Counting right now, second by second')}</p>
		<div class="bdt__top">
			<div class="bdt__big" data-k="secs" style="--c:#f2726f">
				<span class="bdt__badge">${doodle('clock', 30)}</span>
				<small>${L(`ثانية ${she ? 'عاشتها' : 'عاشها'} لحد دلوقتي`, 'seconds lived so far')}</small>
				<b data-v>—</b>
				<span class="bdt__tick">${L('وبتزيد…', 'and counting…')}</span>
			</div>
			<div class="bdt__next" style="--c:#0e6990">
				<span class="bdt__badge">${doodle('cake', 30)}</span>
				<small>${L('لعيد الميلاد الجاي', 'to the next birthday')}</small>
				<div class="bdt__cds">${box('d', L('يوم', 'days'))}${box('h', L('ساعة', 'hours'))}${box('m', L('دقيقة', 'min'))}${box('s', L('ثانية', 'sec'))}</div>
			</div>
		</div>
		<ul class="bdt__cards">
			${card('days', 'calendar', '#0e6990', L(`يوم ${she ? 'عاشته' : 'عاشه'}`, 'days lived'))}
			${card('hours', 'clock', '#6d4bb3', L('ساعة', 'hours'))}
			${card('beats', 'heart', '#f2726f', L('دقة قلب (تقريباً)', 'heartbeats (about)'))}
			${card('suns', 'sun', '#e39b2d', L('شروق شمس', 'sunrises'))}
			${card('moons', 'moon', '#26706b', L('قمر كامل', 'full moons'))}
			${together ? card('together', 'couple', '#c2185b', L('عيد ميلاد عدّى وإحنا سوا', 'birthdays since we met')) : card('cakes', 'cake', '#c2185b', L('تورتة عيد ميلاد', 'birthday cakes'))}
		</ul>
	</div></section>`;
}
export function startTicker(root, member, s) {
	const sec = $('.bdt', root);
	if (!sec || !member?.born) return () => {};
	const born = parseDate(member.born), met = s.met ? parseDate(s.met) : null;
	const fmt = (n) => num(Math.floor(n));
	const two = (n) => num(Math.floor(n)).padStart(2, App.lang === 'ar' ? '٠' : '0');
	const tick = () => {
		const now = new Date(), ms = now - born, days = ms / 864e5;
		const next = new Date(now.getFullYear(), born.getMonth(), born.getDate());
		if (next < now) next.setFullYear(now.getFullYear() + 1);
		const had = now.getFullYear() - born.getFullYear() - (now < new Date(now.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
		let since = 0;
		if (met) for (let y = met.getFullYear(); y <= now.getFullYear(); y++) { const d = new Date(y, born.getMonth(), born.getDate()); if (d >= met && d <= now) since++; }
		const v = { days, hours: ms / 36e5, secs: ms / 1e3, beats: (ms / 6e4) * 80, suns: days, moons: days / 29.53, together: since, cakes: had };
		for (const el of $$('[data-k]', sec)) { const b = $('[data-v]', el); const t = fmt(v[el.dataset.k]); if (b && b.textContent !== t) b.textContent = t; }
		const left = (next - now) / 1e3;
		const cd = { d: fmt(left / 86400), h: two((left % 86400) / 3600), m: two((left % 3600) / 60), s: two(left % 60) };
		for (const el of $$('[data-cd]', sec)) { const b = $('b', el); if (b.textContent !== cd[el.dataset.cd]) b.textContent = cd[el.dataset.cd]; }
	};
	tick();
	const t = setInterval(tick, 1000);
	return () => clearInterval(t);
}

/* ---------- pop the balloons ---------- */
export function gameHTML() {
	return `<section class="sec bdg-sec"><div class="wrap">
		<h2 class="sec__title reveal">${L('فرقع البلالين', 'Pop the balloons')}</h2>
		<p class="sec__sub reveal">${L('كل بلونة جواها صورة من عيد ميلاد فات', 'Every balloon has a photo from a birthday gone by')}</p>
		<div class="bdg" id="bdg" role="application" aria-label="${L('لعبة البلالين', 'The balloon game')}">
			<p class="bdg__score" aria-live="polite"><span>${doodle('party', 20)}</span> <b id="bdg-n">${num(0)}</b></p>
		</div>
	</div></section>`;
}
const COLORS = ['#f2726f', '#0e6990', '#ffc94a', '#5a9e6f', '#c2185b', '#6d4bb3', '#e39b2d'];
export function balloonGame(root, photos) {
	const box = $('#bdg', root);
	if (!box) return () => {};
	let n = 0, k = 0, timer = 0, live = false;
	const pool = [...photos].sort(() => Math.random() - 0.5);
	const spawn = () => {
		if (!live || document.hidden || $$('.bdg__b', box).length > 9) return;
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'bdg__b';
		b.setAttribute('aria-label', L('فرقع البلونة', 'Pop the balloon'));
		const c = COLORS[Math.floor(Math.random() * COLORS.length)];
		b.style.cssText = `--x:${4 + Math.random() * 88}%;--dur:${7 + Math.random() * 5}s;--sway:${(Math.random() * 30 + 10) * (Math.random() < 0.5 ? -1 : 1)}px;--c:${c};--s:${0.8 + Math.random() * 0.45}`;
		b.innerHTML = '<svg viewBox="-24 -64 48 110" aria-hidden="true"><path d="M0 0C-15-4-21-22-21-35-21-51-11-60 0-60 11-60 21-51 21-35 21-22 15-4 0 0Z" fill="var(--c)" stroke="#37353f" stroke-width="1.6"/><path d="M10-44c3 3 5 7 4 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/><path d="M-4 5 0 0 4 5Z" fill="var(--c)" stroke="#37353f" stroke-width="1.2"/><path d="M0 5c-5 8 5 14 0 22s5 12 0 18" fill="none" stroke="#37353f" stroke-width="1.2"/></svg>';
		b.addEventListener('animationend', (e) => { if (e.animationName === 'bdg-rise') b.remove(); });
		box.append(b);
	};
	const pop = (b) => {
		if (b.classList.contains('is-pop')) return;
		const r = b.getBoundingClientRect(), br = box.getBoundingClientRect();
		const x = r.left - br.left + r.width / 2, y = r.top - br.top + r.height * 0.3;
		b.classList.add('is-pop');
		setTimeout(() => b.remove(), 260);
		navigator.vibrate?.(20);
		$('#bdg-n', box).textContent = num(++n);
		// a burst of confetti where it was
		const burst = document.createElement('span');
		burst.className = 'bdg__burst';
		burst.style.cssText = `left:${x}px;top:${y}px`;
		burst.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${30 + (i % 3) * 14}px;background:${COLORS[(i + 2) % COLORS.length]}"></i>`).join('');
		box.append(burst);
		setTimeout(() => burst.remove(), 900);
		// and a photo from a past birthday flies out
		const ph = pool.length ? pool[k++ % pool.length] : '';
		const snap = document.createElement('span');
		snap.className = 'bdg__snap';
		snap.style.cssText = `left:${Math.min(br.width - 70, Math.max(70, x))}px;top:${Math.min(br.height - 90, Math.max(80, y))}px;--r:${(Math.random() * 16 - 8).toFixed(1)}deg`;
		snap.innerHTML = ph ? img(ph, '') : `<b>${doodle(['cake', 'gift', 'party', 'heart', 'sparkle'][n % 5], 44)}</b>`;
		if (ph) $('img', snap)?.setAttribute('data-eager', '');
		box.append(snap);
		hydrate(snap);
		setTimeout(() => snap.remove(), REDUCE ? 1800 : 2600);
	};
	box.addEventListener('pointerdown', (e) => { const b = e.target.closest('.bdg__b'); if (b) pop(b); });
	box.addEventListener('keydown', (e) => { const b = e.target.closest('.bdg__b'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pop(b); } });
	const io = new IntersectionObserver(([en]) => {
		live = en.isIntersecting;
		clearInterval(timer);
		if (live) { spawn(); timer = setInterval(spawn, REDUCE ? 2400 : 850); }
	}, { threshold: 0.2 });
	io.observe(box);
	return () => { clearInterval(timer); io.disconnect(); };
}
