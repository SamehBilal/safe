import { L, T, esc, img, fmtDate, longDate, yearsAgo, pageHead, related, qs, App, linksOut } from '../shell.js';
import { doodle } from '../doodles.js';
import { farthestMap, drawFarthest } from './distances.js';

/* a moment named in story.json "farthest.moments" shows the farthest-we've-been map under its photos */
const isFar = (s, x) => (s.farthest?.moments || []).includes(x?.id);

const photosOf = (x) => [...new Map([x.photo, ...(x.photos || [])].filter(Boolean).map((p) => (typeof p === 'string' ? { photo: p } : p)).map((p) => [p.photo, p])).values()];

export default {
	title: { ar: 'ذكرى', en: 'A moment' },
	render(s) {
		const tl = s.timeline || [];
		const k = Math.max(0, tl.findIndex((x) => x.id === qs('id')));
		const x = tl[k];
		if (!x) return pageHead(L('مش لاقي الذكرى دي', 'Moment not found'), '');
		this.title = x.title;
		const prev = tl[k - 1];
		const next = tl[k + 1];
		const chapter = x.chapter && (s.chapters || []).find((c) => c.id === x.chapter);
		const photos = photosOf(x);
		const story = App.t(x.story || '');
		return `
		${pageHead(App.t(x.title), [longDate(x.date), yearsAgo(x.date)].filter(Boolean).join(" · "), [{ href: 'story.html', ar: 'حكايتنا', en: 'Our story' }, { href: '#', label: x.title }], { photos: (x.photos || []).map((p) => (typeof p === 'string' ? p : p.photo)).concat(x.photo || []) })}
		<article class="sec sec--top"><div class="wrap narrow">
			<div class="moment-hero reveal"><span class="moment-hero__ic">${doodle(x.icon, 56)}</span><time datetime="${esc(x.date)}">${fmtDate(x.date)}</time></div>
			${x.text ? `<p class="lede reveal">${T(x.text)}</p>` : ''}
			${linksOut(x)}
			${story ? story.split(/\n{2,}/).map((p) => `<p class="prose reveal">${esc(p)}</p>`).join('') : ''}
			${photos.length ? `<div class="frames ${photos.length === 1 ? 'frames--single' : ''}">${photos.map((p, n) => `<figure class="frame reveal" data-media-box style="--tilt:${n % 2 ? 2 : -2}deg">${img(p.photo, App.t(p.caption), 'zoom')}${p.caption ? `<figcaption>${T(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}
			${isFar(s, x) ? `<div class="moment-far">${farthestMap(s)}</div>` : ''}
			${chapter ? `<a class="otd reveal" href="chapter.html?id=${esc(chapter.id)}"><span class="otd__ic">${doodle(chapter.icon, 28)}</span><span><small>${L('الحكاية كاملة', 'The full chapter')}</small><b>${T(chapter.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>` : ''}
			<nav class="pager" aria-label="${L('ذكريات تانية', 'Other moments')}">
				${prev ? `<a class="pager__prev" href="moment.html?id=${esc(prev.id)}"><small>${L('اللي قبلها', 'Before')}</small><b>${doodle(prev.icon, 18)} ${T(prev.title)}</b></a>` : '<span></span>'}
				${next ? `<a class="pager__next" href="moment.html?id=${esc(next.id)}"><small>${L('اللي بعدها', 'After')}</small><b>${T(next.title)} ${doodle(next.icon, 18)}</b></a>` : '<span></span>'}
			</nav>
		</div></article>
		${related(['story', 'chapters', 'gallery'])}`;
	},
	after(main, s) {
		const x = (s.timeline || []).find((m) => m.id === qs('id'));
		if (isFar(s, x)) drawFarthest(main, s);
	}
};
