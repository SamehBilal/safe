import { L, T, esc, img, longDate, yearsAgo, pageHead, related, qs, rand, App, linksOut } from '../shell.js';
import { doodle } from '../doodles.js';

export default {
	title: { ar: 'يوم فارق', en: 'A big day' },
	render(s) {
		const list = s.chapters || [];
		const k = Math.max(0, list.findIndex((c) => c.id === qs('id')));
		const c = list[k];
		if (!c) return pageHead(L('مش لاقي اليوم ده', 'Not found'), '');
		this.title = c.title;
		const photos = (c.photos || []).map((p) => (typeof p === 'string' ? { photo: p } : p));
		const other = list.filter((x) => x !== c);
		return `
		<section class="chapter-hero">
			<div class="fairy" aria-hidden="true">${Array.from({ length: 36 }, () => `<i style="--x:${rand(0, 100)}%;--y:${rand(0, 100)}%;--d:${rand(2, 5)}s;--delay:-${rand(0, 5)}s"></i>`).join('')}</div>
			${pageHead(App.t(c.title), [longDate(c.date), yearsAgo(c.date)].filter(Boolean).join(" · "), [{ href: 'chapters.html', ar: 'أيام فارقة', en: 'Big days' }, { href: '#', label: c.title }], { photos: (c.photos || []).map((p) => (typeof p === 'string' ? p : p.photo)).concat(c.photo || []) })}
			${c.sub ? `<p class="chapter-hero__sub">${T(c.sub)}</p>` : ''}
		</section>
		<article class="sec sec--top"><div class="wrap narrow">
			${App.t(c.text).split(/\n{2,}/).filter(Boolean).map((p, n) => `<p class="${n ? 'prose' : 'lede'} reveal">${esc(p)}</p>`).join('')}
			${linksOut(c)}
		</div>
		${photos.length ? `<div class="wrap"><div class="frames ${photos.length === 1 ? 'frames--single' : ''}">${photos.map((p, n) => `<figure class="frame reveal" data-media-box style="--tilt:${[-2, 1.5, -1, 2][n % 4]}deg;--delay:${(n % 3) * 0.1}s">${img(p.photo, App.t(p.caption), 'zoom')}${p.caption ? `<figcaption>${T(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div>`
			: `<div class="wrap narrow"><p class="empty reveal">${L('الصور جاية قريب ♥', 'Photos coming soon ♥')}</p></div>`}
		</article>
		${other.length ? `<section class="sec"><div class="wrap"><h2 class="sec__title reveal">${L('أيام تانية', 'More big days')}</h2>
			<div class="cards3">${other.map((x) => `<a class="mini reveal" href="chapter.html?id=${esc(x.id)}"><span class="mini__ic">${doodle(x.icon, 30)}</span><time>${longDate(x.date)}</time><b>${T(x.title)}</b><p>${T(x.sub)}</p></a>`).join('')}</div></div></section>` : ''}
		${related(['story', 'gallery', 'letters'])}`;
	}
};
