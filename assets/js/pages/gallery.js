import { L, Y, T, esc, img, num, pageHead, related, App, $, $$, REDUCE, hydrate, icon } from '../shell.js';
import { doodle } from '../doodles.js';
import { fold } from './search.js';

/* Our photos in piles, after Codrops' «Adaptive Thumbnail Pile Effect» (Stapel, demo 3: a wide gutter, a little delay
   between photos and a random tilt). Every album, and every place on the map, is a pile of its photos with the top
   one wearing its name and how many there are; tap a pile and its photos fly out into a grid one after another,
   the other piles fade away, and ← gathers them back. In a spread pile, tap a photo to see it big.
   The top is a wall of our photos in the same polaroid frames as every page's top — the top photo of a few piles at
   random, each with its name in handwriting (tap one to open its pile), beside how many photos and piles there are and
   the years they cover. Then one row: the title, the filters (what kind of pile, which year, which city, the order) and
   the search.
   To stay quick with ~3,000 photos (and quicker still on a phone): only the top three photos of each pile are on the
   page (two on a phone) — the rest of a pile is made when it is spread and taken away when it is gathered — and
   photos are fetched only as they come near the screen. */

const firstOf = (o) => [...new Set([...(o.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo)), o.photo].filter(Boolean))];
const phone = () => matchMedia('(max-width: 640px)').matches;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const yr = (y) => num(+y).replace(/[٬,]/g, '');

function piles(s) {
	const out = new Map();
	const add = (name, photo, caption, kind, date, area) => {
		if (!photo) return;
		if (!out.has(name)) out.set(name, { items: [], kind, dates: [], area: '' });
		const p = out.get(name);
		p.items.push({ photo, caption });
		if (date) p.dates.push(String(date));
		if (area && !p.area) p.area = area;
	};
	for (const g of s.gallery || []) add(T(g.album) || L('صور', 'Photos'), g.photo, T(g.caption), 'album', g.date);
	// a place can join an album's pile ("album" in its info.json), so the same day isn't two piles
	for (const p of s.places || []) if (p.at) for (const ph of firstOf(p)) add(T(p.album || p.title), ph, T(p.where), p.album ? 'album' : 'place', p.date, T(p.area));
	// the gifts we gave each other (private/media/gifts/…): one pile each
	for (const g of s.gifts || []) for (const ph of g.photos || []) add(T(g.title), ph, [L('من', 'From'), T(g.from === 'her' ? s.her : s.him), g.note ? '— ' + T(g.note) : ''].join(' ').trim(), 'gift', g.date);
	return [...out.entries()].map(([name, p]) => ({ name, items: p.items, kind: p.kind, date: p.dates.sort()[0] || '', years: [...new Set(p.dates.map((d) => d.slice(0, 4)))], area: p.area }));
}

const KIND = { album: ['camera', 'ألبومات', 'Albums'], place: ['pin', 'أماكن', 'Places'], gift: ['gift', 'هدايا', 'Gifts'] };
function filters(ps) {
	const kinds = Object.keys(KIND).filter((k) => ps.some((p) => p.kind === k));
	const years = [...new Set(ps.flatMap((p) => p.years))].sort().reverse();
	const areas = [...new Set(ps.map((p) => p.area).filter(Boolean))].sort((a, b) => a.localeCompare(b));
	const sel = (id, ic, label, opts) => `<label class="tp-sel" title="${esc(label)}">${doodle(ic, 18)}<select id="${id}" aria-label="${esc(label)}">${opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;
	return `<div class="tp-filters">
		${kinds.length > 1 ? `<div class="tp-kinds" role="group" aria-label="${L('نوع الكومة', 'Kind of pile')}"><button class="chip is-on" type="button" data-kind="">${L('الكل', 'All')}</button>${kinds.map((k) => `<button class="chip chip--ic" type="button" data-kind="${k}" title="${L(KIND[k][1], KIND[k][2])}" aria-label="${L(KIND[k][1], KIND[k][2])}">${doodle(KIND[k][0], 18)}</button>`).join('')}</div>` : ''}
		${years.length > 1 ? sel('tp-year', 'calendar', L('السنة', 'Year'), [['', L('السنة', 'Year')], ...years.map((y) => [y, yr(y)])]) : ''}
		${areas.length > 1 ? sel('tp-area', 'house', L('المدينة', 'City'), [['', L('المدينة', 'City')], ...areas.map((a) => [a, a])]) : ''}
		${sel('tp-sort', 'shuffle', L('الترتيب', 'Order'), [['', L('الترتيب', 'Order')], ['new', L('الأحدث', 'Newest')], ['old', L('الأقدم', 'Oldest')], ['big', L('الأكبر', 'Biggest')], ['az', L('بالاسم', 'A–Z')]])}
	</div>`;
}

/* the wall: six polaroids (four on a phone), each the top photo of a pile picked at random */
const SPOTS = [[20, 25], [50, 19], [80, 27], [25, 63], [55, 60], [83, 66]];
const PHONE = [[28, 27], [72, 25], [29, 72], [72, 74]];
function wall(ps) {
	const pick = shuffle(ps.map((p, k) => k).filter((k) => ps[k].items.length)).slice(0, SPOTS.length);
	return pick.map((k, i) => {
		const p = ps[k], [x, y] = SPOTS[i];
		const jx = (Math.random() * 6 - 3).toFixed(1), jy = (Math.random() * 6 - 3).toFixed(1), r = (Math.random() * 18 - 9).toFixed(1);
		const at = `--x:${(x + +jx).toFixed(1)};--y:${(y + +jy).toFixed(1)}`;
		return `<figure class="pol gh-pol${i >= 4 ? ' pol--wide' : ''}" data-media-box data-pile="${k}" role="button" tabindex="0" aria-label="${esc(`${p.name} — ${p.items.length} ${L('صور', 'photos')}`)}" style="--w:30cqw;${at};--px:${((PHONE[i] || SPOTS[i])[0] + +jx / 2).toFixed(1)};--py:${((PHONE[i] || SPOTS[i])[1] + +jy / 2).toFixed(1)};--r:${r}deg;--s:${(0.3 + Math.random() * 0.5).toFixed(2)};--i:${i}">
			<div class="pol__ph">${img(p.items.at(-1).photo, '', 'pol__img')}</div><figcaption>${esc(p.name)}</figcaption></figure>`;
	}).join('');
}

function hero(ps) {
	const photos = ps.reduce((a, p) => a + p.items.length, 0);
	const count = (k) => ps.filter((p) => p.kind === k).length;
	const years = ps.flatMap((p) => p.years).sort();
	const parts = [['album', 'ألبوم', 'albums'], ['place', 'مكان', 'places'], ['gift', 'هدية', 'gifts']].filter(([k]) => count(k)).map(([k, ar, en]) => L(`${num(count(k))} ${ar}`, `${count(k)} ${en}`));
	return `<div class="gh">
		<div class="gh-wall" id="gh-wall">${wall(ps)}</div>
		<div class="gh-body">
			<p class="gh-k">${doodle('camera', 16)} ${L('ألبوم صورنا', 'Our photo album')}${years.length ? ` · ${yr(years[0])}–${yr(years.at(-1))}` : ''}</p>
			<p class="gh-count"><b>${num(photos)}</b> <span>${L('صورة', photos === 1 ? 'photo' : 'photos')}</span></p>
			<p class="gh-sub">${L(`في ${num(ps.length)} كومة`, `in ${ps.length} piles`)}${parts.length ? ` — ${parts.join(L('، ', ', '))}` : ''}</p>
			<div class="gh-btns">
				<button class="btn btn--sm" type="button" id="gh-open">${doodle('dice', 18)} ${L('افتح كومة عشوائية', 'Open a random pile')}</button>
				<button class="btn btn--sm btn--ghost" type="button" id="gh-more">${doodle('shuffle', 18)} ${L('صور تانية', 'Other photos')}</button>
			</div>
		</div>
	</div>`;
}

let bye = null;

export default {
	title: { ar: 'ألبوم الصور', en: 'Photo album' },
	render(s) {
		const ps = piles(s);
		const SHOW = phone() ? 2 : 3;
		let n = 0;
		return `<section class="sec sec--top gh-top"><div class="wrap">${hero(ps)}</div></section>
		${pageHead(L('ألبوم الصور', 'Photo album'), Y('دوس على أي كومة صور عشان تتفرد', 'دوسي على أي كومة صور عشان تتفرد', 'Tap a pile of photos to spread it out'), [{ href: 'gallery.html', ar: 'ألبوم الصور', en: 'Photo album' }], { band: '' })}
		<section class="sec"><div class="wrap">
			<div class="tp-bar">
				<button class="tp-back" type="button" id="tp-back" hidden aria-label="${L('رجوع للكوم', 'Back to the piles')}">${App.arrow === '←' ? '→' : '←'}</button>
				<h2 class="tp-bar__h">${L('صورنا', 'Our photos')}</h2>
				<p class="tp-bar__name" id="tp-name" aria-live="polite"></p>
				<div class="tp-find" id="tp-find" role="search">
					${filters(ps)}
					<label class="tp-find__field">${icon('search', 18)}<input id="tp-q" type="search" autocomplete="off" spellcheck="false" dir="auto" placeholder="${esc(Y('دوّر في الألبومات…', 'دوّري في الألبومات…', 'Search the albums…'))}" aria-label="${esc(L('دوّر في الألبومات', 'Search the albums'))}"><span class="tp-find__n" id="tp-n" aria-live="polite"></span></label>
				</div>
			</div>
			<ul class="tp" id="tp" aria-label="${L('كوم الصور', 'Piles of photos')}" data-show="${SHOW}">${ps.map((p, k) => p.items.slice(-SHOW).map((it, j) => itemHTML(p, k, p.items.length - Math.min(SHOW, p.items.length) + j, n++)).join('')).join('')}</ul>
			${ps.length ? '' : `<p class="empty">${Y('حط صور في private/media وضيفها في gallery', 'حطي صور في private/media وضيفيها في gallery', 'Add photos to private/media and list them under gallery')}</p>`}
		</div></section>
		${related(['notes', 'atlas', 'chapters'])}`;
	},
	leave() { bye?.(); bye = null; },
	after(main, s) {
		bye?.();
		const ac = new AbortController(), on = { signal: ac.signal };
		bye = () => ac.abort();
		const grid = $('#tp', main);
		if (!grid) return;
		const ps = piles(s);
		const SHOW = +grid.dataset.show || 3;
		// each pile's photos on the page, bottom to top (only its top few until it is spread)
		const els = ps.map(() => []);
		for (const el of $$('.tp__item', grid)) els[+el.dataset.pile].push(el);
		const btnOf = (el) => el.firstElementChild;
		const back = $('#tp-back', main), name = $('#tp-name', main);
		const rtl = () => document.documentElement.dir === 'rtl';
		const DELAY = REDUCE ? 0 : phone() ? 30 : 50, SPEED = REDUCE ? 0 : 400, ANGLE = 5;
		let open = -1, size = 0, gutter = 0, spot = [], cols = 1, at = () => ({ x: 0, y: 0 });
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
		const tilt = () => Math.floor(Math.random() * 11) - 5;

		// where each pile sits, and where each photo of the open pile goes
		function measure() {
			const W = grid.clientWidth;
			gutter = W < 560 ? 26 : W < 900 ? 44 : 70;
			size = Math.min(W < 560 ? (W - gutter) / 2 : 200, W);
			cols = Math.max(1, Math.floor((W + gutter) / (size + gutter)));
			const used = cols * size + (cols - 1) * gutter, pad = (W - used) / 2;
			at = (k) => {
				const c = k % cols, r = Math.floor(k / cols);
				const x = pad + c * (size + gutter);
				return { x: rtl() ? W - x - size : x, y: r * (size + gutter) };
			};
			spot = ps.map(() => at(0));
			shown.forEach((k, j) => { spot[k] = at(j); });
		}

		function place(animate = true) {
			measure();
			grid.style.setProperty('--size', `${size}px`);
			ps.forEach((p, k) => {
				const len = p.items.length;
				for (const el of els[k]) {
					const i = +el.dataset.i;
					if (!animate) el.style.transition = 'none';
					if (k === open) {
						const pt = at(len - 1 - i); // the top photo of the pile goes first
						el.style.translate = `${pt.x}px ${pt.y}px`;
						el.style.rotate = el.dataset.tilt || '0deg';
						el.style.transitionDelay = `${Math.min(len - i - 1, 40) * DELAY}ms`;
					} else {
						el.style.translate = `${spot[k].x}px ${spot[k].y}px`;
						el.style.rotate = i === len - 2 ? `${ANGLE}deg` : i === len - 3 ? `-${ANGLE}deg` : '0deg';
						el.style.transitionDelay = '0ms';
					}
				}
			});
			if (!animate) { void grid.offsetWidth; for (const list of els) for (const el of list) el.style.transition = ''; }
			const rows = open >= 0 ? Math.ceil(ps[open].items.length / cols) : Math.max(1, Math.ceil(shown.length / cols));
			grid.style.height = `${rows * (size + gutter) - gutter + 20}px`;
		}

		/* spreading a pile makes the rest of its photos, under its top few, starting where the pile lies */
		function spread(k) {
			open = k;
			const p = ps[k], len = p.items.length, have = els[k].length;
			if (have < len) {
				const first = els[k][0];
				const s0 = spot[k];
				first.insertAdjacentHTML('beforebegin', p.items.slice(0, len - have).map((it, i) => itemHTML(p, k, i, 0, `translate:${s0.x}px ${s0.y}px`)).join(''));
				els[k] = $$(`.tp__item[data-pile="${k}"]`, grid);
				void grid.offsetWidth;
			}
			grid.classList.add('is-open');
			name.textContent = p.name;
			ps.forEach((_, j) => { for (const el of els[j]) el.classList.toggle('is-gone', j !== k); });
			for (const el of els[k]) {
				el.classList.add('is-out');
				el.dataset.tilt = `${tilt()}deg`;
				el.querySelector('img')?.classList.add('zoom');
				btnOf(el).tabIndex = 0;
			}
			hydrate(grid, true);
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
			ps.forEach((p, j) => {
				const on = shown.includes(j), len = p.items.length;
				for (const el of els[j]) {
					el.classList.remove('is-out');
					el.classList.toggle('is-gone', !on);
					el.querySelector('img')?.classList.remove('zoom');
					btnOf(el).tabIndex = +el.dataset.i === len - 1 && on ? 0 : -1;
				}
			});
			place();
			find.hidden = false;
			back.hidden = true;
			const front = els[k].at(-1);
			// once they are back on the pile, the photos under its top few go again
			const spare = els[k].slice(0, -SHOW);
			setTimeout(() => {
				if (open === k) return;
				for (const el of spare) el.remove();
				els[k] = els[k].slice(-SHOW);
			}, SPEED + 60);
			// back where the pile sits on the table
			setTimeout(() => {
				const hd = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hd')) || 70;
				const r = front.getBoundingClientRect();
				if (r.top < hd || r.bottom > innerHeight) scrollTo({ top: r.top + scrollY - hd - 80, behavior: REDUCE ? 'auto' : 'smooth' });
				btnOf(front)?.focus({ preventScroll: true });
			}, SPEED);
		}

		grid.addEventListener('click', (e) => {
			const li = e.target.closest('.tp__item');
			if (!li || open >= 0) return;
			e.preventDefault();
			e.stopPropagation();
			spread(+li.dataset.pile);
		}, { capture: true, signal: ac.signal });
		back.onclick = gather;
		/* the search: every word typed must be in a pile's name or one of its captions (Arabic letter forms and digits
		   don't matter); the piles that don't match fade away and the rest close up */
		let kind = '';
		const year = $('#tp-year', main), area = $('#tp-area', main), sort = $('#tp-sort', main);
		const filter = () => {
			const words = fold(q.value).split(/\s+/).filter(Boolean);
			const y = year?.value || '', a = area?.value || '', o = sort?.value || '';
			shown = ps.map((_, k) => k).filter((k) => words.every((w) => hay[k].includes(w))
				&& (!kind || ps[k].kind === kind) && (!y || ps[k].years.includes(y)) && (!a || ps[k].area === a));
			const by = { new: (i, j) => ps[j].date.localeCompare(ps[i].date), old: (i, j) => (ps[i].date || '9').localeCompare(ps[j].date || '9'), big: (i, j) => ps[j].items.length - ps[i].items.length, az: (i, j) => ps[i].name.localeCompare(ps[j].name, App.lang) }[o];
			if (by) shown.sort(by);
			const narrowed = words.length || kind || y || a;
			const set = new Set(shown);
			ps.forEach((p, k) => {
				const on = set.has(k);
				for (const el of els[k]) {
					el.classList.toggle('is-gone', !on);
					btnOf(el).tabIndex = +el.dataset.i === p.items.length - 1 && on ? 0 : -1;
				}
			});
			count.textContent = !narrowed ? '' : shown.length ? L(`${shown.length.toLocaleString('ar-EG')} ${shown.length === 1 ? 'ألبوم' : 'ألبومات'}`, `${shown.length} album${shown.length === 1 ? '' : 's'}`) : L('ولا ألبوم', 'None');
			place();
		};
		let ft = 0;
		q.addEventListener('input', () => { clearTimeout(ft); ft = setTimeout(filter, 120); }, on);
		for (const el of [year, area, sort]) el?.addEventListener('change', filter, on);
		$('.tp-kinds', main)?.addEventListener('click', (e) => {
			const c = e.target.closest('[data-kind]');
			if (!c) return;
			kind = c.dataset.kind;
			$$('.tp-kinds .chip', main).forEach((x) => x.classList.toggle('is-on', x === c));
			filter();
		}, on);
		q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && shown.length === 1) { e.preventDefault(); spread(shown[0]); } }, on);
		main.onkeydown = ((e) => { if (e.key === 'Escape' && open >= 0 && !document.querySelector('.lightbox')) gather(); });

		/* the wall at the top: tap a polaroid to open its pile; «other photos» deals new ones; «a random pile» opens one */
		const wallEl = $('#gh-wall', main);
		const openFromTop = (k) => { if (open >= 0) gather(); setTimeout(() => spread(k), open >= 0 ? SPEED : 0); };
		wallEl?.addEventListener('click', (e) => { const f = e.target.closest('[data-pile]'); if (f) openFromTop(+f.dataset.pile); }, on);
		wallEl?.addEventListener('keydown', (e) => { const f = e.target.closest('[data-pile]'); if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFromTop(+f.dataset.pile); } }, on);
		$('#gh-more', main)?.addEventListener('click', () => { wallEl.innerHTML = wall(ps); hydrate(wallEl); }, on);
		$('#gh-open', main)?.addEventListener('click', () => { const pool = shown.length ? shown : ps.map((_, k) => k); openFromTop(pool[Math.floor(Math.random() * pool.length)]); }, on);

		let w = grid.clientWidth;
		const ro = new ResizeObserver(() => { if (Math.abs(grid.clientWidth - w) > 2) { w = grid.clientWidth; place(false); } });
		ro.observe(grid);
		ac.signal.addEventListener('abort', () => ro.disconnect());
		place(false);
		requestAnimationFrame(() => grid.classList.add('is-ready'));
	}
};

/* one photo of a pile: its top one carries the pile's name and count */
function itemHTML(p, k, i, n, extra = '') {
	const top = i === p.items.length - 1, it = p.items[i];
	return `<li class="tp__item" data-pile="${k}" data-i="${i}" style="--n:${n}${extra ? ';' + extra : ''}">
		<button class="tp__btn" type="button" tabindex="${top ? 0 : -1}" aria-label="${top ? `${esc(p.name)} — ${p.items.length} ${L('صور', 'photos')}` : esc(it.caption || p.name)}">
			${img(it.photo, it.caption || p.name, 'tp__img')}
			${it.caption ? `<span class="tp__info"><span>${esc(it.caption)}</span></span>` : ''}
			${top ? `<span class="tp__title"><b>${esc(p.name)}</b><i>${p.items.length.toLocaleString(App.lang === 'ar' ? 'ar-EG' : 'en')}</i></span>` : ''}
		</button>
	</li>`;
}
