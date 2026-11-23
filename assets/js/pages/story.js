import { L, Y, T, esc, img, fmtDate, yearsAgo, isToday, pageHead, related, App, firstPhoto, num, daysBetween, parseDate } from '../shell.js';

/* The top: a wall of our moments in the same polaroid frames as the album and every page's top — the first one, the
   latest, and others spread over the years between, each with its year and title in handwriting (tap one to open it)
   — beside how many moments, the years they cover, the days since we met, and buttons to the first, the latest and a
   moment at random. */
const SPOTS = [[20, 25], [50, 19], [80, 27], [25, 63], [55, 60], [83, 66]];
const PHONE = [[28, 27], [72, 25], [29, 72], [72, 74]];
const yr = (y) => num(+y).replace(/[٬,]/g, '');
function wall(list) {
	const withPh = list.filter((x) => firstPhoto(x));
	if (!withPh.length) return '';
	const n = Math.min(SPOTS.length, withPh.length);
	// the first, the latest, and the rest spread evenly between them
	const pick = Array.from({ length: n }, (_, k) => withPh[Math.round((k * (withPh.length - 1)) / Math.max(1, n - 1))]);
	return pick.map((x, i) => {
		const [sx, sy] = SPOTS[i], [px, py] = PHONE[i] || SPOTS[i];
		const r = (Math.random() * 16 - 8).toFixed(1);
		return `<a class="pol gh-pol${i >= 4 ? ' pol--wide' : ''}" href="moment.html?id=${esc(x.id)}" data-media-box style="--w:30cqw;--x:${sx};--y:${sy};--px:${px};--py:${py};--r:${r}deg;--s:${(0.3 + Math.random() * 0.5).toFixed(2)};--i:${i}" aria-label="${esc(App.t(x.title))}">
			<div class="pol__ph">${img(firstPhoto(x), '', 'pol__img')}</div><figcaption>${yr(x.date.slice(0, 4))} · ${esc(App.t(x.title))}</figcaption></a>`;
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
		<section class="sec sec--top"><div class="wrap"><div class="gh sh">
			<div class="gh-wall">${wall(tl)}</div>
			<div class="gh-body">
				<p class="gh-k">${doodle('book', 16)} ${L('حكايتنا', 'Our story')}${years.length ? ` · ${yr(years[0])}–${yr(years.at(-1))}` : ''}</p>
				<p class="gh-count"><b>${num(tl.length)}</b> <span>${L('تاريخ عملنا إحنا', tl.length === 1 ? 'date that made us' : 'dates that made us')}</span></p>
				${s.met ? `<p class="gh-sub">${L(`${num(daysBetween(parseDate(s.met)))} يوم من أول ما عرفنا بعض`, `${daysBetween(parseDate(s.met)).toLocaleString('en')} days since we met`)}</p>` : ''}
				<div class="gh-btns">
					${tl.length ? `<a class="btn btn--sm" href="#y-${years[0]}">${doodle('heart', 18)} ${L('من الأول', 'From the start')}</a>` : ''}
					${tl.length ? `<a class="btn btn--sm btn--ghost" href="#t-${esc(tl.at(-1).id)}">${doodle('calendar', 18)} ${L('آخر حاجة', 'The latest')}</a>` : ''}
					${tl.length ? `<a class="btn btn--sm btn--ghost" href="moment.html?id=${esc((tl.filter((x) => !x.journal)[Math.floor(Math.random() * tl.filter((x) => !x.journal).length)] || tl[0]).id)}">${doodle('dice', 18)} ${L('ذكرى عشوائية', 'A random moment')}</a>` : ''}
				</div>
			</div>
		</div></div></section>
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
	}
};
