import { L, T, esc, img, num, longDate, rand, related, App } from '../shell.js';

/* «دفتر المعازيم» — what our loved ones wrote for us on our wedding website (wedding.oncreation.net), September 2020.
   Kept in story.json "guestbook": { site, photo, entries: [{ name, text }] }, exactly as each guest typed it.
   The top is the wedding itself: a gold palace arch holding our photo, candlelight drifting, our names and the date.
   Below, every wish on its own cream card with a gold edge and a wax seal of the guest's first letter. */

const HEARTS = /[❤♥♡💚💖💝💞🖤🩶🤍💕💗💓💘💜💙🧡💛]/gu;
const ARABIC = /[؀-ۿ]/;

/* a gold flourish between the parts of the page */
const flourish = `<svg class="gb-flourish" viewBox="0 0 240 24" aria-hidden="true"><path d="M4 12h86M150 12h86" /><path d="M96 12c6-9 18-9 24 0 6 9 18 9 24 0-6-9-18-9-24 0-6 9-18 9-24 0Z" /><circle cx="120" cy="12" r="3" /><circle cx="4" cy="12" r="2" /><circle cx="236" cy="12" r="2" /></svg>`;

export default {
	title: { ar: 'دفتر المعازيم', en: 'Our wedding guestbook' },
	render(s) {
		const g = s.guestbook || { entries: [] };
		const list = g.entries || [];
		const wedding = (s.chapters || []).find((c) => c.id === 'wedding');
		const date = wedding?.date || s.married || '2020-09-10';
		const guests = new Set(list.map((e) => e.name.trim().toLowerCase())).size;
		const hearts = list.reduce((n, e) => n + (e.text.match(HEARTS) || []).length, 0);
		const seal = (name) => esc([...name.replace(/[^\p{L}]/gu, '')][0] || '♥');
		const tilt = (n) => `${((n * 37) % 5) - 2}deg`;
		return `
		<header class="gb-hero">
			<div class="fairy" aria-hidden="true">${Array.from({ length: 44 }, () => `<i style="--x:${rand(0, 100)}%;--y:${rand(0, 100)}%;--d:${rand(2.5, 6)}s;--delay:-${rand(0, 6)}s"></i>`).join('')}</div>
			<div class="gb-hero__in wrap">
				<figure class="gb-arch" data-media-box>
					<span class="gb-arch__frame" aria-hidden="true"></span>
					${img(g.photo || wedding?.photo || 'images/wedding/DSC_1036.jpg', L('سامح وإسراء يوم الفرح', 'Sameh and Esraa on our wedding day'), 'zoom')}
				</figure>
				<div class="gb-hero__text">
					<nav class="crumbs" aria-label="${L('أنت هنا', 'You are here')}"><a href="index.html">${L('الرئيسية', 'Home')}</a><span aria-hidden="true">/</span><a href="chapter.html?id=wedding">${L('فرحنا', 'Our wedding')}</a><span aria-hidden="true">/</span><a href="#">${L('دفتر المعازيم', 'Guestbook')}</a></nav>
					<p class="gb-eyebrow">${L('دفتر المعازيم', 'Our wedding guestbook')}</p>
					<h1 class="gb-names"><span>${T(s.him || { ar: 'سامح', en: 'Sameh' })}</span><i aria-hidden="true">♥</i><span>${T(s.her || { ar: 'إسراء', en: 'Esraa' })}</span></h1>
					${flourish}
					<p class="gb-date">${esc(longDate(date))} · ${L('رويال بلازا، كورنيش المعادي', 'Royal Plaza, Maadi Corniche')}</p>
					<p class="gb-lede">${L('الكلام اللي كتبه حبايبنا لينا على موقع فرحنا، قبل الفرح وليلته — زي ما كتبوه بالظبط، بقلوبه وضحكه.', 'What our loved ones wrote to us on our wedding website, before the big day and on the night — just as they typed it, hearts and laughs and all.')}</p>
					<ul class="gb-stats">
						<li><b>${num(list.length)}</b><span>${L('تهنئة', 'wishes')}</span></li>
						<li><b>${num(guests)}</b><span>${L('حبيب', 'loved ones')}</span></li>
						<li><b>${num(hearts)}</b><span>${L('قلب', 'hearts')}</span></li>
					</ul>
				</div>
			</div>
		</header>
		<section class="sec gb-wall-sec"><div class="wrap">
			${list.length ? `<div class="gb-wall">${list.map((e, k) => `
				<article class="gb-card reveal" style="--tilt:${tilt(k + 1)};--delay:${(k % 3) * 0.08}s">
					<span class="gb-seal" aria-hidden="true">${seal(e.name)}</span>
					<h2 class="gb-card__name" dir="auto">${esc(e.name)}</h2>
					<p class="gb-card__text${ARABIC.test(e.text) ? ' is-ar' : ''}" dir="auto">${esc(e.text)}</p>
				</article>`).join('')}
			</div>` : `<p class="empty">${L('لسه مفيش تهاني هنا', 'No wishes here yet')}</p>`}
			<div class="gb-end reveal">${flourish}<p>${L(`من موقع فرحنا${g.site ? ` · ${esc(g.site)}` : ''} · سبتمبر ٢٠٢٠`, `From our wedding website${g.site ? ` · ${esc(g.site)}` : ''} · September 2020`)}</p></div>
		</div></section>
		${related(['chapters', 'notes', 'letters'])}`;
	}
};
