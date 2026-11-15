import { L, esc, pageHead, related, App, $, $$, t, img, hydrate, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* On this day: everything from today's date in earlier years — moments on «حكايتنا», journal pages, photos.
   Any day can be looked at with the arrows. Band: a tear-off desk calendar showing today, its pages flipping back
   through the years we have something for. */
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = { ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };

export default {
	title: { ar: 'في اليوم ده', en: 'On this day' },
	render() {
		return `${pageHead(L('في اليوم ده', 'On this day'), L('كل اللي حصل في نفس اليوم، في السنين اللي فاتت', 'Everything that happened on this date, in years gone by'), [{ href: 'onthisday.html', ar: 'في اليوم ده', en: 'On this day' }], { band: `<div class="lp-band lp-band--onthisday" id="od-band" aria-hidden="true"></div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="od-nav"><button class="btn btn--sm btn--ghost" type="button" id="od-prev" aria-label="${L('اليوم اللي قبله', 'Previous day')}">‹</button><b id="od-day"></b><button class="btn btn--sm btn--ghost" type="button" id="od-next" aria-label="${L('اليوم اللي بعده', 'Next day')}">›</button><button class="btn btn--sm btn--ghost" type="button" id="od-today">${L('النهارده', 'Today')}</button></div>
			<div class="od-list" id="od-list"></div>
		</div></section>
		${related(['story', 'journal', 'gallery'])}`;
	},
	async after(main, s) {
		const journal = await live.load('journal').catch(() => ({ items: [] }));
		let d = new Date();
		const md = (x) => String(x || '').slice(5, 10);
		const paint = () => {
			const key = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
			const lang = App.lang === 'ar' ? 'ar' : 'en';
			$('#od-day', main).textContent = `${num(d.getDate())} ${MONTHS[lang][d.getMonth()]}`;
			const moments = (s.timeline || []).filter((x) => md(x.date) === key).map((x) => ({ y: +x.date.slice(0, 4), html: `<a class="od-item" href="moment.html?id=${encodeURIComponent(x.id)}">${x.photo ? img(x.photo, '', 'od-img') : `<span class="od-ic">${doodle(x.icon || 'heart', 36)}</span>`}<span><small>${L('حكايتنا', 'Our story')}</small><b dir="auto">${esc(t(x.title))}</b>${x.text ? `<em dir="auto">${esc(t(x.text)).slice(0, 160)}</em>` : ''}</span></a>` }));
			const pages = (journal.items || []).filter((x) => md(x.date) === key).map((x) => ({ y: +x.date.slice(0, 4), html: `<a class="od-item" href="journal.html"><span class="od-ic">${doodle('pen', 36)}</span><span><small>${L('دفترنا', 'Our journal')}</small><b dir="auto">${esc(x.title || L('صفحة من الدفتر', 'A journal page'))}</b>${x.text ? `<em dir="auto">${esc(x.text.slice(0, 160))}</em>` : ''}</span></a>` }));
			const all = [...moments, ...pages].sort((a, b) => b.y - a.y);
			const years = [...new Set(all.map((x) => x.y))];
			const now = new Date().getFullYear();
			$('#od-list', main).innerHTML = years.map((y) => `<section class="od-year"><h2>${num(y)} <small>${now - y > 0 ? L(`من ${num(now - y)} سنة`, `${now - y} year${now - y === 1 ? '' : 's'} ago`) : ''}</small></h2>${all.filter((x) => x.y === y).map((x) => x.html).join('')}</section>`).join('') || `<p class="empty">${L('مفيش حاجة متسجلة في اليوم ده لسه — يمكن السنة دي تبقى أول مرة ♥', 'Nothing on this date yet — maybe this year will be the first ♥')}</p>`;
			hydrate(main);
			$('#od-band', main).innerHTML = `<div class="od-cal"><span class="od-rings"><i></i><i></i></span>${[...years.slice(0, 4).reverse(), null].map((y, i, a) => `<div class="od-page${y ? ' is-flip' : ''}" style="--i:${a.length - 1 - i}"><small>${MONTHS[lang][d.getMonth()]}</small><b>${num(d.getDate())}</b><em>${y ? num(y) : num(now)}</em></div>`).join('')}</div>`;
		};
		$('#od-prev', main).onclick = () => { d.setDate(d.getDate() - 1); paint(); };
		$('#od-next', main).onclick = () => { d.setDate(d.getDate() + 1); paint(); };
		$('#od-today', main).onclick = () => { d = new Date(); paint(); };
		paint();
	}
};
