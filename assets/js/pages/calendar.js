import { L, Y, T, esc, pageHead, related, App, $, $$, num, occasions, img, hydrate, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { today, daysTo, iso, parse, nextMD, inDays, holyDays, egyptDays, ics } from '../occ.js';
import { tooltips, TYPE } from '../caltip.js';

/* Our calendar: every occasion of ours and the wider family's in the year ahead on one page. Above the title the
   family's bunting is strung with a flag for each name, and from the middle of its string a tear-off desk calendar
   flips to each coming occasion by itself; then what's next, a page for each of the next twelve months with the days
   marked, a button that puts them all in the phone's own calendar, and the family's occasions to add to (what was
   its own page, «مناسبات العيلة», lives here now). It gathers: our birthdays, anniversary and
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
	for (const f of fam) if (f.date) out.push({ date: nextMD(f.date, from), title: f.type === 'wedding' ? L(`عيد جواز ${f.name}`, `${f.name}’s anniversary`) : f.type === 'birthday' ? L(`عيد ميلاد ${f.name}`, `${f.name}’s birthday`) : f.name, sub: f.rel || '', icon: f.type === 'wedding' ? 'ring' : f.type === 'birthday' ? 'cake' : 'star', kind: 'family', href: '#cal-fam', yearly: true });
	for (const h of holyDays(from)) out.push({ date: h.date, title: L(h.ar, h.en), sub: L('بالتقويم الهجري، ممكن يفرق يوم', 'By the Hijri calendar, may differ by a day'), icon: h.icon, kind: 'holy', href: 'ramadan.html' });
	for (const e of egyptDays(from)) out.push({ date: e.date, title: L(e.ar, e.en), sub: '', icon: e.icon, kind: 'egypt', yearly: e.id !== 'nessim' });
	for (const c of caps) if (c.openOn && parse(c.openOn) >= from && daysTo(parse(c.openOn)) <= 366) out.push({ date: parse(c.openOn), title: L(`جواب الكبسولة لـ${c.kidName || ''} يتفتح`, `A capsule letter opens for ${c.kidName || ''}`), sub: c.title || '', icon: 'letter', kind: 'capsule', href: 'capsule.html' });
	return out.filter((e) => daysTo(e.date) <= 366).sort((a, b) => a.date - b.date);
}

/* the wider family's days (the list kept in content/live/famdays.bin): their kinds, and how each one reads */
const FTYPES = [
	{ id: 'birthday', icon: 'cake', ar: 'عيد ميلاد', en: 'Birthday' },
	{ id: 'wedding', icon: 'ring', ar: 'عيد جواز', en: 'Wedding anniversary' },
	{ id: 'other', icon: 'star', ar: 'يوم تاني نفتكره', en: 'Another day to remember' }
];
const FLAGS = ['#f2726f', '#ffc94a', '#8fd1ef', '#b9e08a', '#c779d0', '#feac5e'];
const ftype = (id) => FTYPES.find((t) => t.id === id) || FTYPES[2];
const ftitle = (f) => (f.type === 'birthday' ? L(`عيد ميلاد ${f.name}`, `${f.name}’s birthday`) : f.type === 'wedding' ? L(`عيد جواز ${f.name}`, `${f.name}’s anniversary`) : f.name);

export default {
	title: { ar: 'تقويمنا', en: 'Our calendar' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('تقويمنا', 'Our calendar'), L('كل مناسبة لينا وللعيلة كلها في السنة الجاية، في مكان واحد', 'Every occasion of ours and the whole family’s in the year ahead, in one place'), [{ href: 'calendar.html', ar: 'تقويمنا', en: 'Our calendar' }], {
			band: `<div class="calb" id="cal-band" aria-live="polite"></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			<h2 class="sec__title reveal">${L('جاي قريب', 'Coming up')}</h2>
			<div class="cal-up" id="cal-next"></div>
			<div class="chips cal-keys" id="cal-keys">${Object.entries(KIND).map(([k, v]) => `<span class="cal-key" style="--k:${v.c}"><i></i>${esc(L(v.ar, v.en))}</span>`).join('')}</div>
			<h2 class="sec__title reveal">${L('السنة كلها', 'The whole year')}</h2>
			<div class="cal-months" id="cal-months"></div>
			<p class="center cal-ics"><button class="btn btn--coral" type="button" id="cal-ics">${doodle('calendar', 18)} ${Y('ضيفهم لتقويم الموبايل', 'ضيفيهم لتقويم الموبايل', 'Add them to my phone’s calendar')}</button></p>
		</div></section>
		<section class="sec" id="cal-fam"><div class="wrap">
			<h2 class="sec__title reveal">${L('مناسبات العيلة', 'Family occasions')}</h2>
			<p class="sec__sub reveal">${L('أعياد ميلاد وأعياد جواز العيلة كلها، عشان محدش يتنسي', 'The whole family’s birthdays and anniversaries, so nobody is forgotten')}</p>
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:0 auto 30px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('family', 22)}</span> ${Y('ضيف مناسبة', 'ضيفي مناسبة', 'Add an occasion')}</summary>
				<form id="fd-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('مين؟', 'Who?')}</span><input name="name" dir="auto" maxlength="60" required list="fd-names" placeholder="${L('ماما، خالي أحمد…', 'Mum, uncle Ahmed…')}"></label>
						<label class="f f--grow"><span>${L('قرايبنا إزاي؟ (اختياري)', 'How are they family? (optional)')}</span><input name="rel" dir="auto" maxlength="40" placeholder="${L('أم سامح، أخت إسراء…', 'Sameh’s mother, Esraa’s sister…')}"></label>
					</div>
					<datalist id="fd-names"></datalist>
					<div class="f-row">
						<label class="f"><span>${L('المناسبة', 'Occasion')}</span><select name="type">${FTYPES.map((t) => `<option value="${t.id}">${esc(L(t.ar, t.en))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('اليوم', 'Date')}</span><input name="date" type="date" required></label>
					</div>
					<label class="check"><input type="checkbox" name="noYear"> ${L('مش عارفين السنة (المهم اليوم والشهر)', 'We don’t know the year (just the day and month)')}</label>
					<label class="f"><span>${L('ملاحظة (اختياري)', 'A note (optional)')}</span><input name="note" dir="auto" maxlength="120" placeholder="${L('بيحب الشوكولاتة…', 'Loves chocolate…')}"></label>
					<p class="form-msg" id="fd-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('افتكرها ♥', 'افتكريها ♥', 'Remember it ♥')}</button></div>
				</form>
			</details>
			<div class="fd-list" id="fd-list"></div>
		</div></section>
		${related(['birthday', 'family', 'ramadan'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const [famData, caps, tree] = await Promise.all([live.load('famdays').catch(() => ({})), live.load('capsule').catch(() => ({})), live.load('tree').catch(() => ({ items: [] }))]);
		let fam = famData;
		const capsules = (caps.items || []).map((c) => ({ ...c, kidName: App.t(kids.find((k) => k.id === c.kid)?.name || '') }));
		$('#fd-names', main).innerHTML = [...new Set((tree.items || []).map((p) => p.name).filter(Boolean))].map((n) => `<option value="${esc(n)}">`).join('');
		let events = [], coming = [], byDay = new Map();

		const tag = (e) => `<span class="cal-tag" style="--k:${KIND[e.kind].c}">${esc(L(KIND[e.kind].ar, KIND[e.kind].en))}</span>`;
		const snap = (e, size) => (e.photo ? img(e.photo, e.title) : `<span class="cal-snap__ic" aria-hidden="true">${doodle(e.icon, size)}</span>`);
		const left = (e) => { const n = daysTo(e.date); return n === 0 ? `<b>♥</b><small>${L('النهارده', 'today')}</small>` : n === 1 ? `<b>${num(1)}</b><small>${L('بكرة', 'tomorrow')}</small>` : `<b>${num(n)}</b><small>${L(n <= 10 ? 'أيام' : 'يوم', 'days')}</small>`; };
		const tagOpen = (e, cls) => (e.href ? `<a href="${e.href}" class="${cls}"` : `<div class="${cls}"`);
		const tagClose = (e) => (e.href ? '</a>' : '</div>');
		const page = (e) => `<div class="cal-pg" style="--k:${KIND[e.kind].c}">
			<span class="cal-pg__m">${esc(monthName(e.date.getMonth()))}</span>
			<b class="cal-pg__d">${num(e.date.getDate())}</b>
			<span class="cal-pg__w">${esc(dayName(e.date))}</span>
			<span class="cal-pg__t"><i aria-hidden="true">${doodle(e.icon, 20)}</i> ${esc(e.title)}</span>
			<em class="cal-pg__in">${esc(inDays(daysTo(e.date)))}</em>
		</div>`;

		/* the band: the family's bunting strung across the top — a flag with each name, the next one's lifted — and
		   from the middle of its string hangs the tear-off calendar, flipping through everything that's coming */
		const band = $('#cal-band', main);
		const drawBand = () => {
			const items = (fam.items || []).map((f) => ({ ...f, next: nextMD(f.date) })).sort((a, b) => a.next - b.next);
			const names = [...new Set([...items.map((f) => f.name), ...(tree.items || []).map((p) => p.name)].filter(Boolean))].slice(0, 12);
			const named = names.length ? names : [L('ماما', 'Mum'), L('بابا', 'Dad'), L('أخويا', 'Brother'), L('أختي', 'Sister'), L('خالتو', 'Auntie'), L('عمو', 'Uncle')];
			// the flags fill the two ends of the string; the middle is where the calendar hangs
			const per = Math.max(6, Math.ceil(named.length / 2));
			const slots = [...Array.from({ length: per }, (_, i) => 0.02 + (i + 0.5) * (0.3 / per)), ...Array.from({ length: per }, (_, i) => 0.68 + (i + 0.5) * (0.3 / per))];
			const flags = Array(slots.length).fill('');
			named.forEach((name, j) => { flags[Math.min(slots.length - 1, Math.floor(((j + 0.5) * slots.length) / named.length))] = name; });
			const nextOne = items[0];
			const W = 1000, sag = (x) => { const t = x / W; return (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 150 + t * t * 20; };
			const w = 58, h = w * 1.25;
			band.innerHTML = `
				<svg class="fd-svg" viewBox="0 0 ${W} 230" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
					<path class="fd-string" d="M0 20Q${W / 2} 150 ${W} 20"/>
					${slots.map((p, i) => {
						const x = p * W, y = sag(x) - 1, name = flags[i], on = nextOne && name === nextOne.name;
						return `<g class="fd-flag${on ? ' is-next' : ''}" style="--d:${(i % 5) * -0.4}s;--c:${FLAGS[i % FLAGS.length]}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
							<g class="fd-flag__sw"><path d="M${-w / 2} 0H${w / 2}L0 ${h}Z"/>${name ? `<text y="${h * 0.36}" font-size="${Math.min(14, (w / Math.max(name.length, 3)) * 1.7).toFixed(1)}">${esc(name)}</text>` : `<circle cy="${h * 0.34}" r="${w * 0.09}" class="fd-dot"/>`}</g></g>`;
					}).join('')}
				</svg>
				<div class="calb__pad cal-pad"><span class="cal-rings" aria-hidden="true">${'<i></i>'.repeat(7)}</span><div class="cal-stack" id="cal-stack">${coming.length ? page(coming[0]) : `<div class="cal-pg"><b class="cal-pg__d">${num(today().getDate())}</b><span class="cal-pg__t">${L('مفيش مناسبات قريبة', 'Nothing coming up')}</span></div>`}</div></div>
				${nextOne ? `<p class="fd-next">${doodle(ftype(nextOne.type).icon, 20)} ${L('اللي جاي في العيلة:', 'Next in the family:')} <b>${esc(ftitle(nextOne))}</b> <em>${esc(inDays(daysTo(nextOne.next)))}</em></p>` : ''}`;
		};
		let k = 0;
		const flip = () => {
			if (coming.length < 2 || document.hidden) return;
			const stack = $('#cal-stack', main);
			if (!stack) return;
			const old = stack.firstElementChild;
			k = (k + 1) % coming.length;
			stack.insertAdjacentHTML('beforeend', page(coming[k]));
			old.classList.add('is-torn');
			setTimeout(() => old.remove(), 900);
		};
		const timer = setInterval(flip, 3600);

		/* coming up: the very next day pinned up big as a polaroid with its countdown stamped beside it, and the ones
		   after it as ticket stubs — a torn-off calendar page, the words, a little photo, the days stamped on the end */
		const drawComing = () => {
			const [first, ...rest] = events.slice(0, 9);
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
		};

		/* the next twelve months, a page each */
		const drawMonths = () => {
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
		};

		/* the family's occasions, a card each, soonest first */
		const drawFam = () => {
			const items = (fam.items || []).map((f) => ({ ...f, next: nextMD(f.date) })).sort((a, b) => a.next - b.next);
			$('#fd-list', main).innerHTML = items.length ? items.map((f, i) => {
				const t = ftype(f.type), dd = daysTo(f.next);
				const yrs = f.noYear ? 0 : f.next.getFullYear() - +String(f.date).slice(0, 4);
				return `<article class="fd-card reveal is-in${dd === 0 ? ' is-today' : ''}" style="--c:${FLAGS[i % FLAGS.length]}">
					<span class="fd-card__ic" aria-hidden="true">${doodle(t.icon, 30)}</span>
					<div class="fd-card__tx">
						<h3 dir="auto">${esc(ftitle(f))}</h3>
						<p>${[f.rel, longDate(f.date).replace(f.noYear ? /\s*\S+$/ : /$^/, '')].filter(Boolean).map(esc).join(' · ')}</p>
						${yrs > 0 ? `<p class="fd-card__yrs">${f.type === 'wedding' ? L(`${num(yrs)} سنة جواز`, `${yrs} years married`) : f.type === 'birthday' ? (f.late ? (f.female ? L(`كانت هتكمّل ${num(yrs)}`, `would have turned ${yrs}`) : L(`كان هيكمّل ${num(yrs)}`, `would have turned ${yrs}`)) : L(`هيكمّل ${num(yrs)}`, `turning ${yrs}`)) : L(`${num(yrs)} سنة`, `${yrs} years`)}</p>` : ''}
						${f.note ? `<p class="fd-card__note" dir="auto">${esc(f.note)}</p>` : ''}
					</div>
					<em class="fd-card__in">${esc(inDays(dd))}</em>
					${f.by === live.me() && live.canWrite() ? `<button class="link link--danger fd-card__del" type="button" data-del="${esc(f.id)}">${L('مسح', 'Delete')}</button>` : ''}
				</article>`;
			}).join('') : `<p class="empty">${L('لسه مفيش مناسبات — ابدأوا بعيد ميلاد ماما ♥', 'No occasions yet — start with Mum’s birthday ♥')}</p>`;
		};

		/* everything again, from the lists as they are now */
		const paint = () => {
			events = gather(s, fam.items || [], capsules);
			coming = events.slice(0, 8);
			k = 0;
			byDay = new Map();
			for (const e of events) { const key = iso(e.date); (byDay.get(key) || byDay.set(key, []).get(key)).push(e); }
			drawBand();
			drawComing();
			drawMonths();
			drawFam();
		};
		paint();

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
		this.leave = () => { clearInterval(timer); untip(); };

		/* a tap on a marked day opens it in a window, like a page torn off the calendar: each thing that day with its
		   photo and a way into its own page */
		const pop = document.createElement('dialog');
		pop.className = 'cmodal cal-pop';
		main.append(pop);
		pop.addEventListener('click', (e) => {
			if (e.target === pop || e.target.closest('.cmodal__x')) pop.close();
			// a family day leads down to the family's list on this same page
			else if (e.target.closest('a[href="#cal-fam"]')) pop.close();
		});
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

		/* the family's list: delete one, or add one — and the whole calendar redraws with it */
		$('#fd-list', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]');
			if (!del || !confirm(Y('تمسح المناسبة دي؟', 'تمسحي المناسبة دي؟', 'Delete this occasion?'))) return;
			try { fam = await live.save('famdays', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); paint(); } catch (err) { alert(live.why(err)); }
		});
		const form = $('#fd-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#fd-msg', main);
			const f = { id: live.newId(), name: form.name.value.trim(), rel: form.rel.value.trim() || undefined, type: form.type.value, date: form.date.value, noYear: form.noYear.checked || undefined, note: form.note.value.trim() || undefined, by: live.me(), at: Date.now() };
			if (!f.name || !f.date) return;
			try { fam = await live.save('famdays', (d) => { (d.items = d.items || []).push(f); }); form.reset(); msg.textContent = L('اتحفظت ♥', 'Saved ♥'); paint(); } catch (err) { msg.textContent = live.why(err); }
		};

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
