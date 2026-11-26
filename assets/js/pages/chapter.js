import { L, T, esc, img, longDate, yearsAgo, pageHead, related, qs, App, linksOut, num, $, hydrate, parseDate, daysBetween } from '../shell.js';
import { doodle } from '../doodles.js';
import { dayRow } from './chapters.js';

/* One big day, as a keepsake. The top: its cover photo in a deckled frame beside a card — which of the big days it is,
   its drawing, its date in a postmark, its name big, the line about it, and how long ago in years and days. Under it
   the road of all our big days, this one lit, each a stop you can go to. Then its story as a letter, its photos as a
   scrapbook (the first twelve, and the rest on «more»), and the other big days as rows. */
const PAGE = 12;

export default {
	title: { ar: 'يوم فارق', en: 'A big day' },
	render(s) {
		const list = [...(s.chapters || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
		const k = Math.max(0, list.findIndex((c) => c.id === qs('id')));
		const c = list[k];
		if (!c) return pageHead(L('مش لاقي اليوم ده', 'Not found'), '');
		this.title = c.title;
		this.c = c;
		const photos = (c.photos || []).map((p) => (typeof p === 'string' ? { photo: p } : p));
		const cover = c.photo || photos[0]?.photo;
		const other = list.filter((x) => x !== c);
		const days = c.date ? daysBetween(parseDate(c.date)) : 0;
		const yr = (d) => num(+String(d).slice(0, 4)).replace(/[٬,]/g, '');
		const d = c.date ? parseDate(c.date) : null;
		const mon = d ? d.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short' }) : '';
		return `
		<section class="sec sec--top cx-top"><div class="wrap">
			<div class="cx">
				<figure class="cx-cover">
					<span class="cx-cover__none">${doodle(c.icon, 110)}</span>${cover ? `<span class="cx-cover__ph" data-media-box>${img(cover, App.t(c.title))}</span>` : ''}
					<span class="cx-cover__tape" aria-hidden="true"></span>
				</figure>
				<div class="cx-card">
					<p class="cx-card__k">${doodle('star', 15)} ${L(`اليوم ${num(k + 1)} من ${num(list.length)}`, `Big day ${k + 1} of ${list.length}`)}</p>
					${d ? `<span class="cx-post" aria-label="${esc(longDate(c.date))}"><small>${esc(mon)}</small><b>${num(d.getDate())}</b><small>${yr(c.date)}</small></span>` : ''}
					<span class="cx-card__ic" aria-hidden="true">${doodle(c.icon, 30)}</span>
					<h2 class="cx-card__t">${T(c.title)}</h2>
					${c.sub ? `<p class="cx-card__sub">${T(c.sub)}</p>` : ''}
					<svg class="cx-card__line" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 9 C 60 2, 110 14, 160 7 S 250 3, 296 8"/></svg>
					${days > 0 ? `<p class="cx-card__ago"><b>${num(days)}</b> ${L('يوم من ساعتها', days === 1 ? 'day since' : 'days since')} · ${yearsAgo(c.date)}</p>` : `<p class="cx-card__ago">${yearsAgo(c.date)}</p>`}
				</div>
			</div>
			<nav class="cx-road" aria-label="${L('أيامنا الفارقة', 'Our big days')}">
				${list[k - 1] ? `<a class="cx-road__arrow" href="chapter.html?id=${esc(list[k - 1].id)}" aria-label="${esc(App.t(list[k - 1].title))}">${doodle(L('forward', 'back'), 18)}</a>` : '<span class="cx-road__arrow is-off"></span>'}
				<ol class="cx-road__list">${list.map((x, i) => `<li class="${i === k ? 'is-on' : i < k ? 'is-past' : ''}" style="--i:${i}"><a href="chapter.html?id=${esc(x.id)}"${i === k ? ' aria-current="page"' : ''}><span class="cx-road__dot">${doodle(x.icon, 18)}</span><b>${T(x.title)}</b><small>${yr(x.date)}</small></a></li>`).join('')}</ol>
				${list[k + 1] ? `<a class="cx-road__arrow" href="chapter.html?id=${esc(list[k + 1].id)}" aria-label="${esc(App.t(list[k + 1].title))}">${doodle(L('back', 'forward'), 18)}</a>` : '<span class="cx-road__arrow is-off"></span>'}
			</nav>
		</div></section>
		${pageHead(App.t(c.title), [longDate(c.date), yearsAgo(c.date)].filter(Boolean).join(' · '), [{ href: 'chapters.html', ar: 'أيام فارقة', en: 'Big days' }, { href: '#', label: c.title }], { band: '' })}
		<article class="sec sec--top"><div class="wrap">
			${App.t(c.text) ? `<div class="cx-letter reveal">
				<span class="cx-letter__pin" aria-hidden="true"></span>
				${App.t(c.text).split(/\n{2,}/).filter(Boolean).map((p, n) => `<p class="${n ? '' : 'cx-letter__lede'}" dir="auto">${esc(p)}</p>`).join('')}
				<p class="cx-letter__sign">— ${esc(longDate(c.date))} ♥</p>
				${linksOut(c)}
				${(c.links || []).filter((l) => /^[a-z]+\.html/.test(String(l.href || ''))).map((l) => `<a class="btn btn--sm" href="${esc(l.href)}">${doodle('letter', 16)} ${esc(L(l.ar, l.en))}</a>`).join(' ')}
			</div>` : ''}
			${photos.length ? `<div class="cx-album">
				<p class="cx-album__h">${doodle('camera', 18)} ${L(`${num(photos.length)} صورة من اليوم ده`, `${photos.length} photo${photos.length === 1 ? '' : 's'} from that day`)}</p>
				<div class="cx-album__grid" id="cx-grid"></div>
				${photos.length > PAGE ? `<p class="center"><button class="btn btn--sm btn--ghost" type="button" id="cx-more">${doodle('camera', 16)} ${L('صور تانية', 'More photos')} <small id="cx-left"></small></button></p>` : ''}
			</div>` : `<p class="empty reveal">${L('الصور جاية قريب ♥', 'Photos coming soon ♥')}</p>`}
		</div></article>
		${other.length ? `<section class="sec"><div class="wrap"><h2 class="sec__title reveal">${L('أيام تانية', 'More big days')}</h2>
			<div class="bd-rows bd-rows--more">${other.map((x) => dayRow(x, list.indexOf(x), list.length)).join('')}</div></div></section>` : ''}
		${related(['story', 'gallery', 'letters'])}`;
	},
	after(main) {
		const c = this.c;
		const grid = $('#cx-grid', main);
		if (!c || !grid) return;
		const photos = (c.photos || []).map((p) => (typeof p === 'string' ? { photo: p } : p));
		let shown = 0;
		const more = () => {
			const next = photos.slice(shown, shown + PAGE);
			grid.insertAdjacentHTML('beforeend', next.map((p, n) => `<figure class="cx-ph" data-media-box style="--r:${[-2.5, 1.5, -1, 2, -1.8, 1][(shown + n) % 6]}deg;--k:${n}">${img(p.photo, App.t(p.caption) || '', 'zoom')}${p.caption ? `<figcaption>${T(p.caption)}</figcaption>` : ''}</figure>`).join(''));
			shown += next.length;
			hydrate(grid);
			const btn = $('#cx-more', main);
			if (btn) { btn.hidden = shown >= photos.length; const left = $('#cx-left', main); if (left) left.textContent = `(${num(photos.length - shown)})`; }
		};
		more();
		$('#cx-more', main)?.addEventListener('click', more);
	}
};
