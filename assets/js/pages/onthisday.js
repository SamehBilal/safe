import { L, Y, esc, pageHead, related, App, $, $$, t, img, hydrate, num, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «سنة من الذكريات» — the home page already shows what happened on today's date, so this page shows the whole year
   at once: a map of every date, January to December, each square as dark as the memories that fell on it in all our
   years — moments on «حكايتنا», journal pages, our firsts and the boys', tickets, posts, letters, notes, places and
   album photos. Tap a square to read that day, year by year. Above it the numbers: how many dates of the year hold a
   memory, the fullest date, the fullest year, and the next date still empty (a day to make one). The tear-off desk
   calendar on top shows the day being read, its pages flipping back through the years it has. Opens on today, or
   on #MM-DD. */
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = { ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const md = (x) => String(x || '').slice(5, 10);
const ok = (x) => /^\d{4}-\d{2}-\d{2}/.test(String(x || ''));
const cut = (x, n = 150) => { const a = [...String(x || '')]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };
const tx = (x) => (x && typeof x === 'object' ? t(x) : String(x || ''));

/* every dated memory we keep, as { date, src, icon, title, text, photo, sketch, href } */
async function gather(s) {
	const get = (k) => live.load(k).catch(() => ({ items: [] })).then((d) => d.items || []);
	const [journal, ourfirsts, firsts, tickets, posts] = await Promise.all(['journal', 'ourfirsts', 'firsts', 'tickets', 'posts'].map(get));
	const kid = (id) => (s.family?.members || []).find((m) => m.id === id);
	const out = [];
	const add = (date, src, icon, title, text, extra = {}) => { if (ok(date)) out.push({ date, src, icon, title: tx(title), text: tx(text), ...extra }); };
	const inStory = new Set();
	for (const x of s.timeline || []) if (!x.when) { inStory.add(x.id); add(x.date, ['حكايتنا', 'Our story'], x.icon || 'heart', x.title, x.text, { photo: x.photo, href: `moment.html?id=${encodeURIComponent(x.id)}` }); }
	for (const x of journal) add(x.date, ['دفترنا', 'Our journal'], 'pen', x.title || L('صفحة من الدفتر', 'A journal page'), x.text, { href: 'journal.html' });
	for (const x of ourfirsts) add(x.date, ['أول مرة لينا', 'Our firsts'], 'star', x.what, x.note || x.where, { sketch: x.photo, href: 'ourfirsts.html' });
	for (const x of firsts) add(x.date, ['أول مرة للولاد', 'The boys’ firsts'], 'baby', `${kid(x.kid) ? tx(kid(x.kid).name) + ': ' : ''}${tx(x.what)}`, x.note, { sketch: x.photo, href: 'firsts.html' });
	for (const x of tickets) add(x.date, ['تذاكر وفواتير', 'Tickets'], 'ticket', x.what, x.note || x.where, { sketch: x.photo, href: `tickets.html#tk-${encodeURIComponent(x.id)}` });
	for (const x of posts) add(x.date, ['بوستاتنا', 'Our posts'], 'phone', cut(x.text, 70) || L('بوست', 'A post'), '', { sketch: x.img, href: `posts.html#${encodeURIComponent(x.id)}` });
	for (const x of s.letters || []) add(x.date, ['جواباتنا', 'Letters'], 'letter', x.title, '', { href: `letters.html#${encodeURIComponent(x.id)}` });
	for (const x of s.notes || []) add(x.date, ['رسايل حب', 'Love notes'], 'heart', cut(tx(x.orig && x.text?.[x.orig] ? x.text[x.orig] : x.text), 70), '', { href: 'notes.html' });
	for (const x of s.places || []) if (!inStory.has(x.id)) add(x.date, ['أماكننا', 'Our places'], 'pin', x.title, x.place || x.where, { photo: x.photo, href: 'places.html' });
	for (const x of s.gallery || []) add(x.date, ['ألبوم الصور', 'Photo album'], 'camera', x.caption || x.album, '', { photo: x.photo, href: 'gallery.html' });
	return out;
}

export default {
	title: { ar: 'سنة من الذكريات', en: 'A year of memories' },
	render() {
		return `${pageHead(L('سنة من الذكريات', 'A year of memories'), L('كل يوم في السنة، وإيه اللي حصل فيه في كل سنينّا', 'Every date of the year, and what it has held in all our years'), [{ href: 'onthisday.html', ar: 'سنة من الذكريات', en: 'A year of memories' }], { band: '' })}
		<section class="sec sec--top"><div class="wrap">
			<div class="od-hero">
				<div class="od-hero__cal" id="od-band" aria-hidden="true"></div>
				<div class="od-hero__body">
					<small class="od-hero__k" id="od-when"></small>
					<div class="od-hero__day">
						<button class="od-arrow" type="button" id="od-prev" aria-label="${L('اليوم اللي قبله', 'Previous day')}">‹</button>
						<h2 id="od-day" aria-live="polite"></h2>
						<button class="od-arrow" type="button" id="od-next" aria-label="${L('اليوم اللي بعده', 'Next day')}">›</button>
					</div>
					<p class="od-hero__sum" id="od-sum"></p>
					<div class="od-hero__years" id="od-years"></div>
					<div class="od-hero__btns">
						<button class="btn btn--sm" type="button" id="od-today">${doodle('calendar', 18)} ${L('النهارده', 'Today')}</button>
						<button class="btn btn--sm btn--ghost" type="button" id="od-luck">${doodle('dice', 18)} ${L('يوم عشوائي', 'A random day')}</button>
					</div>
				</div>
			</div>
			<ul class="od-stats" id="od-stats"></ul>
			<div class="od-map-wrap">
				<div class="od-map" id="od-map" role="grid" aria-label="${L('خريطة السنة', 'The year’s map')}"></div>
				<p class="od-legend" aria-hidden="true"><span>${L('فاضي', 'Empty')}</span><i style="--n:0"></i><i style="--n:1"></i><i style="--n:2"></i><i style="--n:3"></i><i style="--n:4"></i><span>${L('مليان', 'Full')}</span></p>
			</div>
			<h2 class="od-list-h" id="od-list-h"></h2>
			<div class="od-list" id="od-list"></div>
		</div></section>
		${related(['calendar', 'story', 'journal'])}`;
	},
	async after(main, s) {
		const lang = () => (App.lang === 'ar' ? 'ar' : 'en');
		const all = await gather(s);
		const byDay = new Map();
		for (const x of all) { const k = md(x.date); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(x); }
		const now = new Date();
		const todayKey = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
		const fromHash = /^#(\d{2})-(\d{2})$/.exec(location.hash);
		let key = fromHash && +fromHash[1] >= 1 && +fromHash[1] <= 12 && +fromHash[2] >= 1 && +fromHash[2] <= DAYS_IN[+fromHash[1] - 1] ? `${fromHash[1]}-${fromHash[2]}` : todayKey;
		const dayLabel = (k) => `${num(+k.slice(3))} ${MONTHS[lang()][+k.slice(0, 2) - 1]}`;
		const level = (n) => (!n ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);

		/* the map: a row for each month, a square for each date */
		$('#od-map', main).innerHTML = MONTHS[lang()].map((m, i) => `<div class="od-row" role="row"><span class="od-m" role="rowheader">${esc(m.slice(0, lang() === 'ar' ? 10 : 3))}</span>${Array.from({ length: 31 }, (_, d) => {
			if (d >= DAYS_IN[i]) return '<span class="od-cell is-none"></span>';
			const k = `${pad(i + 1)}-${pad(d + 1)}`, n = (byDay.get(k) || []).length;
			return `<button class="od-cell${k === todayKey ? ' is-today' : ''}" type="button" role="gridcell" data-k="${k}" style="--n:${level(n)}" aria-label="${esc(`${dayLabel(k)} — ${n ? L(`${num(n)} ذكرى`, `${n} memor${n === 1 ? 'y' : 'ies'}`) : L('فاضي', 'empty')}`)}"></button>`;
		}).join('')}</div>`).join('');

		/* the numbers */
		const filled = [...byDay.keys()].filter((k) => k !== '02-29' || byDay.get(k).length);
		const fullest = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0];
		const perYear = {};
		for (const x of all) perYear[x.date.slice(0, 4)] = (perYear[x.date.slice(0, 4)] || 0) + 1;
		const topYear = Object.entries(perYear).sort((a, b) => b[1] - a[1])[0];
		let nextEmpty = null;
		for (let i = 1; i <= 366 && !nextEmpty; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); const k = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; if (!byDay.has(k)) nextEmpty = k; }
		const stat = (ic, b, small, k) => `<li>${k ? `<button type="button" data-k="${k}">` : '<span>'}<span class="od-stats__ic">${doodle(ic, 22)}</span><b>${b}</b><small>${small}</small>${k ? '</button>' : '</span>'}</li>`;
		$('#od-stats', main).innerHTML = [
			stat('calendar', `${num(filled.length)} <i>/ ${num(366)}</i>`, L('يوم في السنة فيه ذكرى', 'dates of the year hold a memory')),
			fullest ? stat('star', esc(dayLabel(fullest[0])), L(`أكتر يوم مليان · ${num(fullest[1].length)} ذكريات`, `the fullest date · ${fullest[1].length} memories`), fullest[0]) : '',
			topYear ? stat('heart', num(+topYear[0]).replace(/[٬,]/g, ''), L(`أكتر سنة · ${num(topYear[1])} ذكرى`, `the fullest year · ${topYear[1]} memories`)) : '',
			nextEmpty ? stat('pen', esc(dayLabel(nextEmpty)), Y('أقرب يوم لسه فاضي — اعمل فيه ذكرى', 'أقرب يوم لسه فاضي — اعملي فيه ذكرى', 'the next empty date — make a memory on it'), nextEmpty) : ''
		].join('');

		const paint = (scroll) => {
			const items = (byDay.get(key) || []).slice().sort((a, b) => b.date.localeCompare(a.date));
			const years = [...new Set(items.map((x) => +x.date.slice(0, 4)))];
			const y0 = now.getFullYear();
			const mo = +key.slice(0, 2) - 1, dd = +key.slice(3);
			const loc = lang() === 'ar' ? 'ar-EG' : 'en-GB';
			const wd = (y) => new Date(y, mo, dd).toLocaleDateString(loc, { weekday: 'long' });
			const yr = (y) => num(y).replace(/[٬,]/g, '');
			// this date this year, against today
			const t0 = new Date(y0, now.getMonth(), now.getDate()), d0 = new Date(y0, mo, dd);
			const gap = Math.round((d0 - t0) / 864e5);
			$('#od-when', main).innerHTML = `${doodle(gap === 0 ? 'sun' : 'calendar', 16)} ${esc(gap === 0 ? L('النهارده', 'Today') : gap === 1 ? L('بكرة', 'Tomorrow') : gap === -1 ? L('امبارح', 'Yesterday') : gap > 0 ? L(`فاضل عليه ${num(gap)} يوم`, `in ${gap} days`) : L(`عدّى من ${num(-gap)} يوم`, `${-gap} days ago`))} · ${esc(wd(y0))}`;
			$('#od-day', main).textContent = dayLabel(key);
			$('#od-sum', main).innerHTML = items.length
				? L(`<b>${num(items.length)}</b> ${items.length === 1 ? 'ذكرى' : items.length <= 10 ? 'ذكريات' : 'ذكرى'} في <b>${num(years.length)}</b> ${years.length === 1 ? 'سنة' : years.length <= 10 ? 'سنين' : 'سنة'} — أولها من ${yr(years[years.length - 1])}`, `<b>${items.length}</b> memor${items.length === 1 ? 'y' : 'ies'} in <b>${years.length}</b> year${years.length === 1 ? '' : 's'} — the first in ${years[years.length - 1]}`)
				: Y('لسه فاضي — اعمل فيه أول ذكرى ♥', 'لسه فاضي — اعملي فيه أول ذكرى ♥', 'Still empty — make it the first ♥');
			$('#od-years', main).innerHTML = years.map((y) => `<a class="chip" href="#od-y-${y}" data-y="${y}">${yr(y)} <small>${esc(wd(y))}</small></a>`).join('');
			$('#od-list-h', main).innerHTML = `${doodle('book', 22)} ${esc(L(`اللي حصل في ${dayLabel(key)}`, `What ${dayLabel(key)} has held`))}`;
			$$('.od-cell.is-on', main).forEach((c) => c.classList.remove('is-on'));
			$(`.od-cell[data-k="${key}"]`, main)?.classList.add('is-on');
			$('#od-list', main).innerHTML = years.map((y) => `<section class="od-year" id="od-y-${y}"><h2>${num(y).replace(/[٬,]/g, '')} <small>${y0 - y > 0 ? L(`من ${num(y0 - y)} سنة`, `${y0 - y} year${y0 - y === 1 ? '' : 's'} ago`) : L('السنة دي', 'this year')}</small></h2>${items.filter((x) => +x.date.slice(0, 4) === y).map((x) => `<a class="od-item" href="${esc(x.href)}">${x.photo ? img(x.photo, '', 'od-img') : x.sketch ? `<img class="od-img" data-sketch="${esc(x.sketch)}" alt="">` : `<span class="od-ic">${doodle(x.icon, 36)}</span>`}<span><small>${doodle(x.icon, 14)} ${esc(L(...x.src))}</small><b dir="auto">${esc(x.title)}</b>${x.text ? `<em dir="auto">${esc(cut(x.text))}</em>` : ''}</span></a>`).join('')}</section>`).join('')
				|| `<p class="empty">${Y('مفيش حاجة متسجلة في اليوم ده لسه — اعمل فيه أول ذكرى ♥', 'مفيش حاجة متسجلة في اليوم ده لسه — اعملي فيه أول ذكرى ♥', 'Nothing on this date yet — make it the first ♥')}</p>`;
			hydrate($('#od-list', main));
			live.hydrateSketches($('#od-list', main));
			// the desk calendar: this year's page on the bottom, the years it holds flipping away on top of it
			$('#od-band', main).innerHTML = `<div class="od-cal"><span class="od-rings"><i></i><i></i></span>${[...years.slice(0, 4).reverse(), null].map((y, i, a) => `<div class="od-page${y ? ' is-flip' : ''}" style="--i:${a.length - 1 - i}"><small>${esc(MONTHS[lang()][mo])}</small><b>${num(dd)}</b><span>${esc(wd(y || y0))}</span><em>${yr(y || y0)}</em></div>`).join('')}</div>`;
			history.replaceState(null, '', key === todayKey ? location.pathname : `#${key}`);
			if (scroll) $('#od-list-h', main).scrollIntoView({ behavior: 'smooth', block: 'start' });
		};
		const go = (k, scroll) => { key = k; paint(scroll); };
		const shift = (n) => { const d = new Date(2024, +key.slice(0, 2) - 1, +key.slice(3) + n); go(`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); };
		main.addEventListener('click', (e) => {
			const c = e.target.closest('#od-map [data-k], #od-stats [data-k]');
			if (c) return go(c.dataset.k, true);
			const y = e.target.closest('#od-years [data-y]');
			if (y) { e.preventDefault(); $(`#od-y-${y.dataset.y}`, main)?.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); }
		});
		$('#od-prev', main).onclick = () => shift(-1);
		$('#od-next', main).onclick = () => shift(1);
		$('#od-today', main).onclick = () => go(todayKey);
		$('#od-luck', main).onclick = () => { const ks = [...byDay.keys()].filter((k) => k !== key); if (ks.length) go(ks[Math.floor(Math.random() * ks.length)]); };
		paint(false);
	}
};
