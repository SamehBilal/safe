import { L, T, esc, img, longDate, yearsAgo, pageHead, related, qs, App, linksOut, num } from '../shell.js';
import { doodle } from '../doodles.js';
import { dayRow } from './chapters.js';

/* One big day. The top: its photos stacked as polaroids, beside its date on a tab, its drawing in a medallion, its
   name big, the line about it, how long ago, which of the big days it is, and the days before and after it. Then its
   story and its photos, and the other big days as rows. */

export default {
	title: { ar: 'يوم فارق', en: 'A big day' },
	render(s) {
		const list = [...(s.chapters || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
		const k = Math.max(0, list.findIndex((c) => c.id === qs('id')));
		const c = list[k];
		if (!c) return pageHead(L('مش لاقي اليوم ده', 'Not found'), '');
		this.title = c.title;
		const photos = (c.photos || []).map((p) => (typeof p === 'string' ? { photo: p } : p));
		const other = list.filter((x) => x !== c);
		return `
		<section class="sec sec--top"><div class="wrap"><div class="bd-one">
			<div class="bd-one__stack" aria-hidden="true">${(() => {
				const ph = [...new Set([...(c.photos || []).map((p) => (typeof p === 'string' ? p : p.photo)), c.photo].filter(Boolean))].slice(0, 3);
				return ph.length ? ph.map((p, n) => `<figure class="bd-one__pol" data-media-box style="--n:${n}">${img(p, '')}</figure>`).join('') : `<span class="bd-one__none">${doodle(c.icon, 90)}</span>`;
			})()}</div>
			<div class="bd-one__body">
				<p class="gh-k">${doodle('star', 16)} ${L(`اليوم ${num(k + 1)} من ${num(list.length)}`, `Big day ${k + 1} of ${list.length}`)}</p>
				<span class="bd-one__ic" aria-hidden="true">${doodle(c.icon, 34)}</span>
				<time class="bd-row__date">${longDate(c.date)}</time>
				<h2 class="bd-one__t">${T(c.title)}</h2>
				${c.sub ? `<p class="bd-one__sub">${T(c.sub)}</p>` : ''}
				<p class="bd-one__ago">${yearsAgo(c.date)}</p>
				<div class="gh-btns">
					${list[k - 1] ? `<a class="btn btn--sm btn--ghost" href="chapter.html?id=${esc(list[k - 1].id)}">${App.arrow === '←' ? '→' : '←'} ${T(list[k - 1].title)}</a>` : ''}
					${list[k + 1] ? `<a class="btn btn--sm" href="chapter.html?id=${esc(list[k + 1].id)}">${T(list[k + 1].title)} ${App.arrow}</a>` : ''}
				</div>
			</div>
		</div></div></section>
		${pageHead(App.t(c.title), [longDate(c.date), yearsAgo(c.date)].filter(Boolean).join(' · '), [{ href: 'chapters.html', ar: 'أيام فارقة', en: 'Big days' }, { href: '#', label: c.title }], { band: '' })}
		<article class="sec sec--top"><div class="wrap narrow">
			${App.t(c.text).split(/\n{2,}/).filter(Boolean).map((p, n) => `<p class="${n ? 'prose' : 'lede'} reveal">${esc(p)}</p>`).join('')}
			${linksOut(c)}
			${(c.links || []).filter((l) => /^[a-z]+\.html/.test(String(l.href || ''))).map((l) => `<a class="btn reveal" href="${esc(l.href)}" style="margin:8px 0 18px">💌 ${esc(L(l.ar, l.en))}</a>`).join(' ')}
		</div>
		${photos.length ? `<div class="wrap"><div class="frames ${photos.length === 1 ? 'frames--single' : ''}">${photos.map((p, n) => `<figure class="frame reveal" data-media-box style="--tilt:${[-2, 1.5, -1, 2][n % 4]}deg;--delay:${(n % 3) * 0.1}s">${img(p.photo, App.t(p.caption), 'zoom')}${p.caption ? `<figcaption>${T(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div>`
			: `<div class="wrap narrow"><p class="empty reveal">${L('الصور جاية قريب ♥', 'Photos coming soon ♥')}</p></div>`}
		</article>
		${other.length ? `<section class="sec"><div class="wrap"><h2 class="sec__title reveal">${L('أيام تانية', 'More big days')}</h2>
			<div class="bd-rows bd-rows--more">${other.map((x) => dayRow(x, list.indexOf(x), list.length)).join('')}</div></div></section>` : ''}
		${related(['story', 'gallery', 'letters'])}`;
	}
};
