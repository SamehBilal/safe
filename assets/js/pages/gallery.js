import { L, Y, T, esc, img, pageHead, related, App, $, $$, REDUCE, hydrate, icon } from '../shell.js';
import { fold } from './search.js';

/* Our photos in piles, after Codrops' «Adaptive Thumbnail Pile Effect» (Stapel, demo 3: a wide gutter, a little delay
   between photos and a random tilt). Every album, and every place on the map, is a pile of its photos with the top
   one wearing its name and how many there are; tap a pile and its photos fly out into a grid one after another,
   the other piles fade away, and ← gathers them back. In a spread pile, tap a photo to see it big. */

const firstOf = (o) => [...new Set([...(o.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo)), o.photo].filter(Boolean))];

function piles(s) {
	const out = new Map();
	const add = (name, photo, caption) => {
		if (!photo) return;
		if (!out.has(name)) out.set(name, []);
		out.get(name).push({ photo, caption });
	};
	for (const g of s.gallery || []) add(T(g.album) || L('صور', 'Photos'), g.photo, T(g.caption));
	// a place can join an album's pile ("album" in its info.json), so the same day isn't two piles
	for (const p of s.places || []) if (p.at) for (const ph of firstOf(p)) add(T(p.album || p.title), ph, T(p.where));
	// the gifts we gave each other (private/media/gifts/…): one pile each
	for (const g of s.gifts || []) for (const ph of g.photos || []) add(`🎁 ${T(g.title)}`, ph, [L('من', 'From'), T(g.from === 'her' ? s.her : s.him), g.note ? '— ' + T(g.note) : ''].join(' ').trim());
	return [...out.entries()].map(([name, items]) => ({ name, items }));
}

export default {
	title: { ar: 'ألبوم الصور', en: 'Photo album' },
	render(s) {
		const ps = piles(s);
		let n = 0;
		return `
		${pageHead(L('ألبوم الصور', 'Photo album'), Y('دوس على أي كومة صور عشان تتفرد', 'دوسي على أي كومة صور عشان تتفرد', 'Tap a pile of photos to spread it out'), [{ href: 'gallery.html', ar: 'ألبوم الصور', en: 'Photo album' }])}
		<section class="sec sec--top"><div class="wrap">
			<div class="tp-bar">
				<button class="tp-back" type="button" id="tp-back" hidden aria-label="${L('رجوع للكوم', 'Back to the piles')}">${App.arrow === '←' ? '→' : '←'}</button>
				<h2 class="tp-bar__h">${L('صورنا', 'Our photos')}</h2>
				<p class="tp-bar__name" id="tp-name" aria-live="polite"></p>
			</div>
			<div class="tp-find" id="tp-find" role="search">
				<label class="tp-find__field">${icon('search', 20)}<input id="tp-q" type="search" autocomplete="off" spellcheck="false" dir="auto" placeholder="${esc(Y('دوّر في الألبومات… «ستاربكس»، «2017»، «فهد»', 'دوّري في الألبومات… «ستاربكس»، «2017»، «فهد»', 'Search the albums… “Starbucks”, “2017”, “Fahd”'))}" aria-label="${esc(L('دوّر في الألبومات', 'Search the albums'))}"></label>
				<p class="tp-find__n" id="tp-n" aria-live="polite"></p>
			</div>
			<ul class="tp" id="tp" aria-label="${L('كوم الصور', 'Piles of photos')}">${ps.map((p, k) => p.items.map((it, i) => {
				const top = i === p.items.length - 1, show = i >= p.items.length - 3;
				const pic = img(it.photo, it.caption || p.name, 'tp__img');
				return `<li class="tp__item" data-pile="${k}" data-i="${i}"${show ? '' : ' data-deep'} style="--n:${n++}">
					<button class="tp__btn" type="button" tabindex="${top ? 0 : -1}" aria-label="${top ? `${esc(p.name)} — ${p.items.length} ${L('صور', 'photos')}` : esc(it.caption || p.name)}">
						${show ? pic : pic.replace('data-m=', 'data-later=')}
						${it.caption ? `<span class="tp__info"><span>${esc(it.caption)}</span></span>` : ''}
						${top ? `<span class="tp__title"><b>${esc(p.name)}</b><i>${p.items.length.toLocaleString(App.lang === 'ar' ? 'ar-EG' : 'en')}</i></span>` : ''}
					</button>
				</li>`;
			}).join('')).join('')}</ul>
			${ps.length ? '' : `<p class="empty">${Y('حط صور في private/media وضيفها في gallery', 'حطي صور في private/media وضيفيها في gallery', 'Add photos to private/media and list them under gallery')}</p>`}
		</div></section>
		${related(['notes', 'places', 'chapters'])}`;
	},
	after(main, s) {
		const grid = $('#tp', main);
		if (!grid) return;
		const ps = piles(s);
		const items = $$('.tp__item', grid);
		const back = $('#tp-back', main), name = $('#tp-name', main);
		const rtl = () => document.documentElement.dir === 'rtl';
		const DELAY = REDUCE ? 0 : 50, SPEED = REDUCE ? 0 : 400, ANGLE = 5;
		let open = -1, size = 0, gutter = 0, spot = [];
		// the piles the search leaves on the table (all of them with nothing typed), in their order
		let shown = ps.map((_, k) => k);
		const hay = ps.map((p) => fold([p.name, ...p.items.map((it) => it.caption || '')].join(' ')));
		const bar = $('.tp-bar', main), find = $('#tp-find', main), q = $('#tp-q', main), count = $('#tp-n', main);
		// up to the album's bar, under the sticky header, so a spread pile starts with its first photo
		const toTop = () => {
			const hd = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hd')) || 70;
			const y = bar.getBoundingClientRect().top + scrollY - hd - 12;
			if (Math.abs(scrollY - y) > 4) scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
		};
		const byPile = (k) => items.filter((el) => +el.dataset.pile === k);
		const tilt = () => Math.floor(Math.random() * 11) - 5;

		// where each pile sits, and where each photo of the open pile goes
		function measure() {
			const W = grid.clientWidth;
			gutter = W < 560 ? 26 : W < 900 ? 44 : 70;
			size = Math.min(W < 560 ? (W - gutter) / 2 : 200, W);
			const cols = Math.max(1, Math.floor((W + gutter) / (size + gutter)));
			const used = cols * size + (cols - 1) * gutter, pad = (W - used) / 2;
			const at = (k) => {
				const c = k % cols, r = Math.floor(k / cols);
				const x = pad + c * (size + gutter);
				return { x: rtl() ? W - x - size : x, y: r * (size + gutter) };
			};
			spot = ps.map(() => at(0));
			shown.forEach((k, j) => { spot[k] = at(j); });
			return { at, cols };
		}

		function place(animate = true) {
			const { at } = measure();
			grid.style.setProperty('--size', `${size}px`);
			for (const el of items) {
				const k = +el.dataset.pile, i = +el.dataset.i, len = ps[k].items.length;
				if (!animate) el.style.transition = 'none';
				if (k === open) {
					const p = at(len - 1 - i); // the top photo of the pile goes first
					el.style.translate = `${p.x}px ${p.y}px`;
					el.style.rotate = el.dataset.tilt || '0deg';
					el.style.transitionDelay = `${(len - i - 1) * DELAY}ms`;
				} else {
					el.style.translate = `${spot[k].x}px ${spot[k].y}px`;
					el.style.rotate = i === len - 2 ? `${ANGLE}deg` : i === len - 3 ? `-${ANGLE}deg` : '0deg';
					el.style.transitionDelay = '0ms';
				}
				if (!animate) { void el.offsetWidth; el.style.transition = ''; }
			}
			const rows = open >= 0 ? Math.ceil(ps[open].items.length / measure().cols) : Math.max(1, Math.ceil(shown.length / measure().cols));
			grid.style.height = `${rows * (size + gutter) - gutter + 20}px`;
		}

		function spread(k) {
			open = k;
			grid.classList.add('is-open');
			name.textContent = ps[k].name;
			for (const el of items) {
				const mine = +el.dataset.pile === k;
				el.classList.toggle('is-gone', !mine);
				el.classList.toggle('is-out', mine);
				if (mine) {
					el.dataset.tilt = `${tilt()}deg`;
					for (const im of $$('[data-later]', el)) { im.dataset.m = im.dataset.later; delete im.dataset.later; }
					$('img', el)?.classList.add('zoom');
					$('.tp__btn', el).tabIndex = 0;
				}
			}
			hydrate(grid);
			place();
			find.hidden = true;
			toTop();
			back.hidden = false;
			setTimeout(() => back.focus({ preventScroll: true }), SPEED);
		}

		function gather() {
			if (open < 0) return;
			const k = open;
			open = -1;
			grid.classList.remove('is-open');
			name.textContent = '';
			for (const el of items) {
				const on = shown.includes(+el.dataset.pile);
				el.classList.remove('is-out');
				el.classList.toggle('is-gone', !on);
				$('img', el)?.classList.remove('zoom');
				const top = +el.dataset.i === ps[+el.dataset.pile].items.length - 1;
				$('.tp__btn', el).tabIndex = top && on ? 0 : -1;
			}
			place();
			find.hidden = false;
			back.hidden = true;
			const front = byPile(k).at(-1);
			// back where the pile sits on the table
			setTimeout(() => {
				const hd = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hd')) || 70;
				const r = front.getBoundingClientRect();
				if (r.top < hd || r.bottom > innerHeight) scrollTo({ top: r.top + scrollY - hd - 80, behavior: REDUCE ? 'auto' : 'smooth' });
				$('.tp__btn', front)?.focus({ preventScroll: true });
			}, SPEED);
		}

		grid.addEventListener('click', (e) => {
			const li = e.target.closest('.tp__item');
			if (!li || open >= 0) return;
			e.preventDefault();
			e.stopPropagation();
			spread(+li.dataset.pile);
		}, true);
		back.onclick = gather;
		/* the search: every word typed must be in a pile's name or one of its captions (Arabic letter forms and digits
		   don't matter); the piles that don't match fade away and the rest close up */
		const filter = () => {
			const words = fold(q.value).split(/\s+/).filter(Boolean);
			shown = ps.map((_, k) => k).filter((k) => words.every((w) => hay[k].includes(w)));
			for (const el of items) {
				const on = shown.includes(+el.dataset.pile);
				el.classList.toggle('is-gone', !on);
				const top = +el.dataset.i === ps[+el.dataset.pile].items.length - 1;
				$('.tp__btn', el).tabIndex = top && on ? 0 : -1;
			}
			count.textContent = !words.length ? '' : shown.length ? L(`${shown.length.toLocaleString('ar-EG')} ${shown.length === 1 ? 'ألبوم' : 'ألبومات'}`, `${shown.length} album${shown.length === 1 ? '' : 's'}`) : L('مفيش ألبوم فيه الكلام ده', 'No album has that');
			place();
		};
		let ft = 0;
		q.addEventListener('input', () => { clearTimeout(ft); ft = setTimeout(filter, 120); });
		q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && shown.length === 1) { e.preventDefault(); spread(shown[0]); } });
		main.onkeydown = ((e) => { if (e.key === 'Escape' && open >= 0 && !document.querySelector('.lightbox')) gather(); });
		let w = grid.clientWidth;
		new ResizeObserver(() => { if (Math.abs(grid.clientWidth - w) > 2) { w = grid.clientWidth; place(false); } }).observe(grid);
		place(false);
		requestAnimationFrame(() => grid.classList.add('is-ready'));
	}
};
