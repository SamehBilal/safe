import { L, Y, T, esc, img, fmtDate, yearsAgo, isToday, pageHead, related, App } from '../shell.js';
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
		${pageHead(L('حكايتنا', 'Our story'), L('كل تاريخ عملنا إحنا', 'Every date that made us, us'), [{ href: 'story.html', ar: 'حكايتنا', en: 'Our story' }])}
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
								${x.photo ? `<figure data-media-box>${img(x.photo, App.t(x.title))}</figure>` : ''}
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
