import { L, Y, T, esc, img, num, longDate, pageHead, related, $, $$, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';

/* «دفتر المعازيم» — what our loved ones wrote for us on our wedding website (wedding.oncreation.net), September 2020.
   Kept in story.json "guestbook": { site, photo, entries: [{ name, text }] }, exactly as each guest typed it.
   The top is the guestbook itself, open on the table: on one page our wedding photo taped in with the day and the
   place, on the other a few of the guests' names signed in different inks, and stamps that count the wishes, the
   loved ones and the hearts. Below, every wish is a card in the journal's ink — washi tape on top, the guest's
   initial in a coloured circle — with chips for the Arabic and the English ones and «فاجئني» to land on one at random. */

const HEARTS = /[❤♥♡💚💖💝💞🖤🩶🤍💕💗💓💘💜💙🧡💛]/gu;
const ARABIC = /[؀-ۿ]/;
const INK = ['#d9534f', '#0e6990', '#5a9e6f', '#8e5bd1', '#e39b2d', '#c2185b'];
const TAPE = ['#fdc830', '#f6a6b2', '#9fd3e6', '#b9e0a5', '#d7c2f0'];

export default {
	title: { ar: 'دفتر المعازيم', en: 'Our wedding guestbook' },
	render(s) {
		const g = s.guestbook || { entries: [] };
		const list = g.entries || [];
		const wedding = (s.chapters || []).find((c) => c.id === 'wedding');
		const date = wedding?.date || s.married || '2020-09-10';
		const guests = new Set(list.map((e) => e.name.trim().toLowerCase())).size;
		const hearts = list.reduce((n, e) => n + (e.text.match(HEARTS) || []).length, 0);
		const ar = list.filter((e) => ARABIC.test(e.text)).length;
		const initial = (name) => esc([...name.replace(/[^\p{L}]/gu, '')][0] || '♥');
		const signed = list.filter((e, k, a) => a.findIndex((x) => x.name === e.name) === k).slice(0, 7);
		const book = `<div class="gb-band" aria-hidden="true"><div class="gb-book">
			<div class="gb-page gb-page--photo">
				<figure class="gb-pol">
					<span class="gb-tape"></span>
					${img(g.photo || wedding?.photo || 'images/wedding/DSC_1036.jpg', '', '')}
					<figcaption><b>${T(s.him || { ar: 'سامح', en: 'Sameh' })} <i>♥</i> ${T(s.her || { ar: 'إسراء', en: 'Esraa' })}</b><small>${esc(longDate(date))}</small></figcaption>
				</figure>
				<p class="gb-place">${doodle('pin', 16)} ${L('رويال بلازا، كورنيش المعادي', 'Royal Plaza, Maadi Corniche')}</p>
			</div>
			<span class="gb-spine"><i></i><i></i><i></i><i></i><i></i><i></i></span>
			<div class="gb-page gb-page--names">
				<p class="gb-page__h">${L('وقّعوا هنا', 'Signed here')}</p>
				<ul class="gb-sigs">${signed.map((e, k) => `<li style="--ink:${INK[k % INK.length]};--r:${[-4, 3, -2, 5, -3, 2, -5][k % 7]}deg" dir="auto">${esc(e.name)}</li>`).join('')}</ul>
				<ul class="gb-stamps">
					<li style="--c:${INK[0]}"><b>${num(list.length)}</b><small>${L('تهنئة', 'wishes')}</small></li>
					<li style="--c:${INK[1]}"><b>${num(guests)}</b><small>${L('حبيب', 'loved ones')}</small></li>
					<li style="--c:${INK[5]}"><b>${num(hearts)}</b><small>${L('قلب', 'hearts')}</small></li>
				</ul>
				<span class="gb-pen">${doodle('pen', 44)}</span>
			</div>
		</div></div>`;
		return `
		${pageHead(L('دفتر المعازيم', 'Our wedding guestbook'), L('الكلام اللي كتبه حبايبنا لينا على موقع فرحنا — زي ما كتبوه بالظبط، بقلوبه وضحكه', 'What our loved ones wrote to us on our wedding website — just as they typed it, hearts and laughs and all'), [{ href: 'chapter.html?id=wedding', ar: 'فرحنا', en: 'Our wedding' }, { href: 'guestbook.html', ar: 'دفتر المعازيم', en: 'Guestbook' }], { band: book })}
		<section class="sec sec--top gb-sec"><div class="wrap">
			${list.length ? `<div class="gb-tools">
				<div class="gb-chips" role="group" aria-label="${L('اللغة', 'Language')}">
					<button class="chip is-on" type="button" data-lang="">${L('الكل', 'All')} <small>${num(list.length)}</small></button>
					${ar ? `<button class="chip" type="button" data-lang="ar">${L('بالعربي', 'In Arabic')} <small>${num(ar)}</small></button>` : ''}
					${list.length - ar ? `<button class="chip" type="button" data-lang="en">${L('بالإنجليزي', 'In English')} <small>${num(list.length - ar)}</small></button>` : ''}
				</div>
				<button class="btn btn--ghost gb-luck" type="button">${doodle('dice', 20)} ${Y('فاجئني', 'فاجئيني', 'Surprise me')}</button>
			</div>
			<div class="gb-wall">${list.map((e, k) => `
				<article class="gb-card reveal" data-lang="${ARABIC.test(e.text) ? 'ar' : 'en'}" style="--c:${INK[k % INK.length]};--tape:${TAPE[k % TAPE.length]};--tilt:${((k * 37) % 5) - 2}deg;--delay:${(k % 3) * 0.08}s">
					<span class="gb-card__tape" aria-hidden="true"></span>
					<header><span class="gb-card__in" aria-hidden="true">${initial(e.name)}</span><h2 class="gb-card__name" dir="auto">${esc(e.name)}</h2></header>
					<p class="gb-card__text" dir="auto">${esc(e.text)}</p>
				</article>`).join('')}
			</div>` : `<p class="empty">${L('لسه مفيش تهاني هنا', 'No wishes here yet')}</p>`}
			<p class="gb-end">${doodle('heart', 18)} ${L(`من موقع فرحنا${g.site ? ` · ${esc(g.site)}` : ''} · سبتمبر ٢٠٢٠`, `From our wedding website${g.site ? ` · ${esc(g.site)}` : ''} · September 2020`)}</p>
		</div></section>
		${related(['chapters', 'notes', 'letters'])}`;
	},
	after(main) {
		const cards = $$('.gb-card', main);
		$('.gb-chips', main)?.addEventListener('click', (e) => {
			const c = e.target.closest('[data-lang]');
			if (!c) return;
			$$('.gb-chips .chip', main).forEach((x) => x.classList.toggle('is-on', x === c));
			for (const card of cards) { card.hidden = !!c.dataset.lang && card.dataset.lang !== c.dataset.lang; card.classList.add('is-in'); }
		});
		$('.gb-luck', main)?.addEventListener('click', () => {
			const open = cards.filter((c) => !c.hidden);
			const pick = open[Math.floor(Math.random() * open.length)];
			if (!pick) return;
			cards.forEach((c) => c.classList.remove('is-lucky'));
			pick.classList.add('is-in', 'is-lucky');
			pick.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
		});
	}
};
