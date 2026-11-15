import { L, Y, T, esc, img, fmtDate, longDate, yearsAgo, related, qs, App, linksOut, $, $$, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import { farthestMap, drawFarthest } from './distances.js';

/* One date on «حكايتنا».
   It opens like Codrops' «Polaroid Stack to Grid» (tympanus.net/codrops/?p=26096): the title on its own screen and the
   day's first six photos fanned out behind the moment's badge at the bottom, as if pulled from a pocket. Scroll, or tap
   the arrow, and the title flies off, the badge drops away and the six photos fall into their places on the wall while
   the rest of the day's photos pop in around them. The wall itself is small polaroids scattered at their own angles
   (after Olivier's «Scattered Polaroids»), 5–6 to a row, all in the journal's hand. */

/* a moment named in story.json "farthest.moments" shows the farthest-we've-been map under its photos */
const isFar = (s, x) => (s.farthest?.moments || []).includes(x?.id);

/* steady pseudo-random numbers, so a moment's photos fall the same way every visit */
const rnd = (i, salt) => { const v = Math.sin((i + 1) * 9301 + salt * 49297) * 233280; return v - Math.floor(v); };
/* a polaroid without its own caption gets the moment's date, like ink on the white strip */
const capOf = (x, n) => (n === 0 ? App.t(x.title) : String(x.date || '').split('-').reverse().join('.'));
/* where the first six sit in the fan: offsets in the photo's width, scale, rotation (the demo's own values) */
const FAN = [{ tx: -0.6, ty: -0.3, s: 1.1, r: -20 }, { tx: 0.2, ty: -0.7, s: 1.4, r: 1 }, { tx: 0.5, ty: -0.5, s: 1.3, r: 15 }, { tx: -0.2, ty: -0.4, s: 1.4, r: -17 }, { tx: -0.15, ty: -0.4, s: 1.2, r: -5 }, { tx: 0.7, ty: -0.2, s: 1.1, r: 15 }];
const EASE_OUT = 'cubic-bezier(0.2, 1, 0.3, 1)';
const EASE_IN = 'cubic-bezier(0.7, 0, 0.3, 1)';

const photosOf = (x) => [...new Map([x.photo, ...(x.photos || [])].filter(Boolean).map((p) => (typeof p === 'string' ? { photo: p } : p)).map((p) => [p.photo, p])).values()];

export default {
	title: { ar: 'ذكرى', en: 'A moment' },
	render(s) {
		const tl = s.timeline || [];
		const k = Math.max(0, tl.findIndex((x) => x.id === qs('id')));
		const x = tl[k];
		if (!x) return `<header class="ph"><div class="ph__in"><h1 class="ph__title">${L('مش لاقي الذكرى دي', 'Moment not found')}</h1></div></header>`;
		this.title = x.title;
		const prev = tl[k - 1];
		const next = tl[k + 1];
		const chapter = x.chapter && (s.chapters || []).find((c) => c.id === x.chapter);
		const photos = photosOf(x);
		const story = App.t(x.story || '');
		const stack = photos.length > 0 && !REDUCE;
		return `
		<header class="mo-intro${stack ? ' is-stack' : ''}" id="mo-intro">
			<div class="mo-intro__titles" id="mo-titles">
				<nav class="crumbs" aria-label="${L('أنت هنا', 'You are here')}"><a href="index.html">${L('الرئيسية', 'Home')}</a><span aria-hidden="true">/</span><a href="story.html">${L('حكايتنا', 'Our story')}</a><span aria-hidden="true">/</span><a href="#">${T(x.title)}</a></nav>
				<p class="ph__eyebrow">${L('حكايتنا', 'Our story')}</p>
				<h1 class="ph__title">${T(x.title)}</h1>
				<p class="mo-intro__date">${esc([longDate(x.date), yearsAgo(x.date)].filter(Boolean).join(' · '))}</p>
				${x.text ? `<p class="mo-intro__lede">${T(x.text)}</p>` : ''}
			</div>
			<div class="mo-badge" id="mo-badge"><span class="moment-hero__ic">${doodle(x.icon, 56)}</span><time datetime="${esc(x.date)}">${fmtDate(x.date)}</time></div>
			${stack ? `<button class="mo-down" type="button" id="mo-down" aria-label="${Y('شوف الصور', 'شوفي الصور', 'See the photos')}"><span>${Y('شوف الصور', 'شوفي الصور', 'See the photos')}</span><i aria-hidden="true">↓</i></button>` : ''}
		</header>
		<article class="sec mo-body">
			${photos.length ? `<section class="scatter-wrap wrap" aria-label="${L('الصور', 'Photos')}">
				<h2 class="sec__title scatter__h" id="mo-wall-h">${L(`${photos.length} صورة من اليوم ده`, `${photos.length} photo${photos.length === 1 ? '' : 's'} from that day`)}</h2>
				<div class="scatter${photos.length < 4 ? ' scatter--few' : ''}" id="mo-wall">${photos.map((p, n) => {
					const r = rnd(n, 1) * 14 - 7, dx = rnd(n, 2) * 14 - 7, dy = rnd(n, 3) * 14 - 7;
					return `<figure class="snap" data-media-box style="--r:${r.toFixed(1)}deg;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;--i:${n % 18}">${img(p.photo, App.t(p.caption), 'zoom')}<figcaption>${p.caption ? T(p.caption) : esc(capOf(x, n))}</figcaption></figure>`;
				}).join('')}</div>
			</section>` : ''}
			<div class="wrap narrow">
				${linksOut(x)}
				${story ? story.split(/\n{2,}/).map((p) => `<p class="prose reveal">${esc(p)}</p>`).join('') : ''}
				${isFar(s, x) ? `<div class="moment-far">${farthestMap(s)}</div>` : ''}
				${chapter ? `<a class="otd reveal" href="chapter.html?id=${esc(chapter.id)}"><span class="otd__ic">${doodle(chapter.icon, 28)}</span><span><small>${L('الحكاية كاملة', 'The full chapter')}</small><b>${T(chapter.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>` : ''}
				<nav class="pager" aria-label="${L('ذكريات تانية', 'Other moments')}">
					${prev ? `<a class="pager__prev" href="moment.html?id=${esc(prev.id)}"><small>${L('اللي قبلها', 'Before')}</small><b>${doodle(prev.icon, 18)} ${T(prev.title)}</b></a>` : '<span></span>'}
					${next ? `<a class="pager__next" href="moment.html?id=${esc(next.id)}"><small>${L('اللي بعدها', 'After')}</small><b>${T(next.title)} ${doodle(next.icon, 18)}</b></a>` : '<span></span>'}
				</nav>
			</div>
		</article>
		${related(['story', 'chapters', 'gallery'])}`;
	},

	after(main, s) {
		const x = (s.timeline || []).find((m) => m.id === qs('id'));
		if (isFar(s, x)) drawFarthest(main, s);
		const intro = $('#mo-intro', main);
		if (!intro?.classList.contains('is-stack')) return;
		stackToGrid(main, intro);
	}
};

/* ---- the stack, then the wall ---- */
function stackToGrid(main, intro) {
	const items = $$('#mo-wall .snap', main);
	const fan = items.slice(0, FAN.length), rest = items.slice(FAN.length);
	const wallH = $('#mo-wall-h', main);
	let state = 'stack';

	// where the fan sits: the middle of the intro's bottom edge, just above the badge
	const place = (animate) => {
		const box = intro.getBoundingClientRect();
		const cx = box.left + box.width / 2, by = box.bottom - Math.min(190, box.height * 0.24);
		fan.forEach((el, n) => {
			el.getAnimations().forEach((a) => a.cancel());
			el.style.transform = '';
			const r = el.getBoundingClientRect(), w = el.offsetWidth, f = FAN[n];
			const tx = cx - (r.left + r.width / 2), ty = by - (r.top + r.height / 2);
			const to = `translate(${tx + f.tx * w}px, ${ty + f.ty * w}px) scale(${f.s}) rotate(${f.r}deg)`;
			el.style.transform = to;
			if (animate) el.animate([{ transform: `translate(${tx}px, ${ty}px) scale(0.5)`, opacity: 0 }, { transform: to, opacity: 1 }], { duration: 1000, delay: n * 80, easing: EASE_OUT, fill: 'backwards' });
		});
	};

	main.classList.add('mo-stacked');
	place(true);
	$('#mo-badge', main).animate([{ transform: 'translateY(25vh)' }, { transform: 'none' }], { duration: 1000, easing: EASE_OUT });

	const toGrid = () => {
		if (state !== 'stack') return;
		state = 'moving';
		removeEventListener('scroll', onScroll);
		removeEventListener('resize', onResize);
		const scrolled = scrollY > 0;
		const fly = { duration: 600, easing: EASE_IN, fill: 'forwards' };
		$('#mo-titles', main).animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-innerHeight / 2}px)`, opacity: 0 }], fly);
		$('#mo-badge', main).animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(300px)', opacity: 0 }], fly);
		$('#mo-down', main)?.remove();
		// each of the six leaves its spot in the fan and settles into its own on the wall
		fan.forEach((el, n) => {
			const from = el.style.transform;
			el.style.transform = '';
			el.animate([{ transform: from }, { transform: 'none' }], { duration: 650, delay: scrolled ? 0 : 100 + n * 30, easing: 'cubic-bezier(0.5, 0, 0.2, 1.25)', fill: 'backwards' });
		});
		// the others pop in around them
		rest.forEach((el) => el.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 100 + Math.random() * 300, easing: EASE_OUT, fill: 'backwards' }));
		wallH?.animate([{ transform: 'translateY(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 400, easing: EASE_OUT, fill: 'backwards' });
		main.classList.remove('mo-stacked');
		main.classList.add('mo-grid');
		setTimeout(() => {
			state = 'grid';
			intro.classList.add('is-done');
			// the intro folds away, keeping the wall where it is on the screen
			const top = $('#mo-wall', main).getBoundingClientRect().top;
			intro.classList.remove('is-stack');
			scrollBy(0, $('#mo-wall', main).getBoundingClientRect().top - top);
			// and the title comes back, small, above the wall (the demo's page title)
			const titles = $('#mo-titles', main);
			titles.getAnimations().forEach((a) => a.cancel());
			titles.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: EASE_OUT });
		}, 900);
	};
	const onScroll = () => { if (scrollY > 8) toGrid(); };
	let t;
	const onResize = () => { clearTimeout(t); t = setTimeout(() => place(false), 60); };
	$('#mo-down', main).onclick = toGrid;
	addEventListener('scroll', onScroll, { passive: true });
	addEventListener('resize', onResize);
	// arriving already scrolled (back button), or leaving for another page while stacked
	if (scrollY > 8) toGrid();
}
