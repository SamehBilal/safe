import { L, Y, T, esc, img, fmtDate, yearsAgo, isToday, pageHead, related, App, firstPhoto, num, daysBetween, parseDate } from '../shell.js';

/* The top: our years hung on a string like the drawings on the fridge — one polaroid for each year we have, its photo,
   the year big under it and how many moments it holds, held by a clothespin; the year we met and the year we married
   carry a heart. Above the string: the title, how many moments and years, the days since we met and since we married,
   and buttons to the first, the latest and a moment at random. The string scrolls sideways when the years don't fit. */
const yr = (y) => num(+y).replace(/[٬,]/g, '');
function line(list, s) {
	const by = new Map();
	for (const x of list) { const y = x.date.slice(0, 4); if (!by.has(y)) by.set(y, []); by.get(y).push(x); }
	const met = String(s.met || '').slice(0, 4), wed = String(s.married || '').slice(0, 4);
	return [...by].map(([y, xs], i) => {
		const ph = xs.find((x) => firstPhoto(x) && !x.journal) || xs.find((x) => firstPhoto(x));
		const big = y === met ? L('عرفنا بعض', 'We met') : y === wed ? L('اتجوزنا', 'We married') : '';
		return `<li class="sy-yr${big ? ' is-big' : ''}" style="--i:${i};--r:${[-4, 3, -2, 4, -3, 2][i % 6]}deg">
			<a href="#y-${y}" aria-label="${y}: ${xs.length}">
				<span class="sy-yr__peg" aria-hidden="true"></span>
				<span class="sy-yr__pol">${ph ? `<span class="sy-yr__ph" data-media-box>${img(firstPhoto(ph), '', 'sy-yr__img')}</span>` : `<span class="sy-yr__none">${doodle(xs[0].icon || 'heart', 34)}</span>`}</span>
				<b class="sy-yr__y">${yr(y)}</b>
				<small>${L(`${num(xs.length)} ${xs.length === 1 ? 'لحظة' : xs.length <= 10 ? 'لحظات' : 'لحظة'}`, `${xs.length} moment${xs.length === 1 ? '' : 's'}`)}</small>
				${big ? `<i class="sy-yr__big">${doodle('heart', 12)} ${big}</i>` : ''}
			</a></li>`;
	}).join('');
}
import { doodle } from '../doodles.js';
import * as live from '../live.js';

export default {
	title: { ar: 'حكايتنا', en: 'Our story' },
	// journal pages you marked "add to our story" join the timeline
	async load() {
		const j = await live.load('journal');
		this.extra = (j.items || []).filter((x) => x.timeline).map((x) => ({ id: x.id, date: x.date, icon: x.mood || 'pen', title: x.title || x.text.slice(0, 40), text: x.text.length > 160 ? x.text.slice(0, 160) + '…' : x.text, href: `journal.html#${x.id}`, journal: true }));
	},
	render(s) {
		const tl = [...(s.timeline || []), ...(this.extra || [])].sort((a, b) => a.date.localeCompare(b.date));
		const years = [...new Set(tl.map((x) => x.date.slice(0, 4)))];
		return `
		<section class="sec sec--top sy"><div class="wrap">
			<div class="sy__head">
				<p class="gh-k">${doodle('book', 16)} ${L('دفتر حكايتنا', 'The book of us')}${years.length ? ` · ${yr(years[0])}–${yr(years.at(-1))}` : ''}</p>
				<h1 class="sy__t">${L('حكايتنا', 'Our story')}</h1>
				<svg class="sy__line" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10 C 50 2, 90 15, 140 8 S 240 3, 296 9"/></svg>
				<ul class="sy__facts">
					<li style="--k:0"><b>${num(tl.length)}</b>${L('لحظة', tl.length === 1 ? 'moment' : 'moments')}</li>
					<li style="--k:1"><b>${num(years.length)}</b>${L('سنة فيها حكاية', 'years in it')}</li>
					${s.met ? `<li style="--k:2"><b>${num(daysBetween(parseDate(s.met)))}</b>${L('يوم من أول ما عرفنا بعض', 'days since we met')}</li>` : ''}
					${s.married ? `<li style="--k:3"><b>${num(daysBetween(parseDate(s.married)))}</b>${L('يوم متجوزين', 'days married')}</li>` : ''}
				</ul>
				<div class="gh-btns">
					${tl.length ? `<a class="btn btn--sm" href="#y-${years[0]}">${doodle('heart', 18)} ${L('من الأول', 'From the start')}</a>` : ''}
					${tl.length ? `<a class="btn btn--sm btn--ghost" href="#t-${esc(tl.at(-1).id)}">${doodle('calendar', 18)} ${L('آخر حاجة', 'The latest')}</a>` : ''}
					${tl.length ? `<a class="btn btn--sm btn--ghost" href="moment.html?id=${esc((tl.filter((x) => !x.journal)[Math.floor(Math.random() * tl.filter((x) => !x.journal).length)] || tl[0]).id)}">${doodle('dice', 18)} ${L('ذكرى عشوائية', 'A random moment')}</a>` : ''}
				</div>
			</div>
			${tl.length ? `<div class="sy__string"><ol class="sy__years">${line(tl, s)}</ol></div>` : ''}
		</div></section>
		${pageHead(L('حكايتنا', 'Our story'), L('كل تاريخ عملنا إحنا', 'Every date that made us, us'), [{ href: 'story.html', ar: 'حكايتنا', en: 'Our story' }], { band: '' })}
		<nav class="years wrap" aria-label="${L('السنين', 'Years')}">${years.map((y) => `<a href="#y-${y}">${y}</a>`).join('')}</nav>
		<section class="sec sec--top">
			<div class="wrap">
				<ol class="tl">
					${tl.map((x, k) => {
						const first = tl.findIndex((y) => y.date.slice(0, 4) === x.date.slice(0, 4)) === k;
						const today = !x.when && isToday(x.date);
						return `<li class="tl__item reveal" id="t-${esc(x.id)}"${first ? ` data-year="${x.date.slice(0, 4)}"` : ''}>
							${first ? `<span class="tl__year" id="y-${x.date.slice(0, 4)}">${x.date.slice(0, 4)}</span>` : ''}
							<span class="tl__icon" aria-hidden="true">${doodle(x.icon, 28)}</span>
							<a class="tl__card${x.journal ? ' tl__card--journal' : ''}" href="${x.href ? esc(x.href) : `moment.html?id=${esc(x.id)}`}">
								<div class="tl__date">${x.when ? `<time>${T(x.when)}</time>` : `<time datetime="${esc(x.date)}">${fmtDate(x.date)}</time>`}
									${today ? `<span class="tl__today">${L('النهارده', 'Today')}، ${yearsAgo(x.date)} ♥</span>` : (x.when ? '' : `<span class="tl__ago">${yearsAgo(x.date)}</span>`)}
								</div>
								<h3>${T(x.title)}</h3>
								${x.text ? `<p>${T(x.text)}</p>` : ''}
								${firstPhoto(x) ? `<figure data-media-box>${img(firstPhoto(x), App.t(x.title))}</figure>` : ''}
								<span class="tl__more">${Y('اقرا أكتر', 'اقري أكتر', 'Read more')} ${App.arrow}</span>
							</a>
						</li>`;
					}).join('')}
				</ol>
				<p class="tl__end reveal">${T(s.closing)} ♥</p>
			</div>
		</section>
		${related(['journal', 'chapters', 'gallery'])}`;
	},
	/* the years on their cord drift by on their own, back and forth, resting a moment at each end; pointing at them,
	   touching them or tabbing into them stops it (and a swipe still scrolls them), and it carries on a little after */
	after(main) {
		this.leave?.();
		const el = main.querySelector('.sy__string');
		if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const rtl = getComputedStyle(el).direction === 'rtl';
		let p = Math.abs(el.scrollLeft), dir = 1, held = false, rest = 0, raf = 0, wait = 0, last = 0;
		const tick = (t) => {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(64, t - (last || t)); last = t;
			const max = el.scrollWidth - el.clientWidth;
			if (max <= 2 || held || t < rest) return;
			p += dir * dt * 0.03;
			if (p >= max) { p = max; dir = -1; rest = t + 1800; }
			if (p <= 0) { p = 0; dir = 1; rest = t + 1800; }
			el.scrollLeft = rtl ? -p : p;
		};
		const hold = () => { held = true; clearTimeout(wait); };
		const free = () => { clearTimeout(wait); wait = setTimeout(() => { p = Math.abs(el.scrollLeft); held = false; }, 2500); };
		el.addEventListener('pointerenter', hold); el.addEventListener('pointerleave', free);
		el.addEventListener('touchstart', hold, { passive: true }); el.addEventListener('touchend', free, { passive: true });
		el.addEventListener('focusin', hold); el.addEventListener('focusout', free);
		raf = requestAnimationFrame(tick);
		this.leave = () => { cancelAnimationFrame(raf); clearTimeout(wait); this.leave = null; };
	}
};
