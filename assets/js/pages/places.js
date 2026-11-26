import { L, T, esc, img, fmtDate, pageHead, related, App, $, $$, REDUCE, hydrate, num } from '../shell.js';
import { doodle } from '../doodles.js';

/* Our places, everything shaped like the pin on a map. The top: every area we have places in as a big map pin dropped
   on a dotted route — a place's photo in its head, the area's name and how many places under it; tap one and the map
   below opens on that area. The map keeps its hover (the nearer the mouse to a pin, the more of that place's photo
   shows through) and its click (the photo fills the map with the place's story); its area buttons are little pins.
   Then the places themselves, area by area under a pin heading, each photo in a pin-shaped frame with «على الخريطة»
   to jump to it on the map. Cairo and Giza are two areas: a place is in Giza when its address says so. */
const yr = (y) => num(+y).replace(/[٬,]/g, '');
const GIZA = { ar: 'الجيزة', en: 'Giza' }, CAIRO = { ar: 'القاهرة', en: 'Cairo' };
/** the area a place sits in on the map — «Cairo & Giza» split by its address */
/** a place on the border of two towns (the Zifta–Mit Ghamr bridge) names the other in "alsoIn": it is in both */
const areasOf = (m) => [areaOf(m), ...[].concat(m.alsoIn || [])].filter(Boolean);
const areaOf = (m) => (m.area && /Cairo/i.test(m.area.en || '') ? (/الجيزة|Giza/i.test(`${m.where?.ar || ''} ${m.where?.en || ''}`) ? GIZA : CAIRO) : m.area);

/* Our places on a map, after Codrops' «Interactive Points»: a faded street map with a pin for every place we've been.
   Bring the mouse near a pin and that place's photo shows through the map; click it and the photo fills the map with
   its story. A place goes on the map when it has `"at": "lat, lng"` in story.json (right-click the spot in Google Maps
   and the first line is exactly that). Places without it are still in the cards below. */

const TILE = 256;
const TILES = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
const MAX_Z = 16, MIN_Z = 3;

/** "30.0731, 31.3456" (or [lat, lng], or { lat, lng }) → { lat, lng }, or null. */
function where(m) {
	let v = m.at ?? (m.lat != null ? [m.lat, m.lng] : null);
	if (typeof v === 'string') v = v.split(/[,\s،]+/).filter(Boolean).map(Number);
	if (v && !Array.isArray(v)) v = [v.lat, v.lng];
	if (!v || v.length < 2 || !isFinite(v[0]) || !isFinite(v[1]) || Math.abs(v[0]) > 85 || Math.abs(v[1]) > 180) return null;
	return { lat: +v[0], lng: +v[1] };
}

/** Web Mercator, in pixels at zoom 0. */
const world = ({ lat, lng }) => {
	const s = Math.sin((lat * Math.PI) / 180);
	return { x: ((lng + 180) / 360) * TILE, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE };
};

/** A place's photos: "photos": ["a.jpg", …] (or [{ photo }]), else its one "photo". */
const photosOf = (m) => [...new Set([...(m.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo)), m.photo].filter(Boolean))];

const subtitle = (m) => [T(m.where), m.date ? fmtDate(m.date) : ''].filter(Boolean).map(esc).join(' · ');

export default {
	title: { ar: 'أماكننا', en: 'Our places' },
	render(s) {
		const list = s.places || [];
		const pinned = list.flatMap((m) => { const at = where(m); return at ? areasOf(m).map((ar) => ({ m, at, ar })) : []; });
		// "area": { ar, en } groups places on one map (Cairo & Giza, Tanta, …); the buttons switch between them
		const names = [...new Set(pinned.map((p) => T(p.ar)))].sort((a, b) => pinned.filter((p) => T(p.ar) === b).length - pinned.filter((p) => T(p.ar) === a).length);
		pinned.forEach((p) => { p.a = names.indexOf(T(p.ar)); });
		return `
		${hero(list, pinned, names)}
		${pageHead(L('أماكننا', 'Our places'), L('أماكن فيها حتة مننا', 'Places that hold a piece of us'), [{ href: 'places.html', ar: 'أماكننا', en: 'Our places' }], { band: '' })}
		${pinned.length ? `<section class="sec sec--top"><div class="wrap">
			<p class="ip-hint" data-touch="${L('دوسي على أي دبوس على الخريطة', 'Tap any pin on the map')}">${L('قرّبي من أي دبوس على الخريطة… واضغطي عليه', 'Bring the mouse near a pin on the map… then click it')}</p>
			<div class="pz-mapwrap">
			${names.length > 1 ? `<div class="chips ip-areas pz-tabs" role="toolbar" aria-label="${L('المنطقة', 'Area')}">${names.map((n, k) => `<button class="chip${k ? '' : ' is-on'}" type="button" data-area="${k}" aria-pressed="${!k}"><i class="pz-tab__pin" aria-hidden="true"></i>${(n || L('أماكن تانية', 'Elsewhere'))} <small>${num(pinned.filter((p) => p.a === k).length)}</small></button>`).join('')}</div>` : ''}
			<div class="ip" id="ip-map" tabindex="-1" aria-label="${L('خريطة أماكننا', 'Map of our places')}">
				<div class="ip__map" aria-hidden="true"></div>
				<div class="ip__bgs" aria-hidden="true">${pinned.map(({ m }) => `<div class="ip__bg">${photosOf(m).map((p, j) => (j ? img(p, '', 'ip__photo').replace('data-m=', 'data-later=') : img(p, '', 'ip__photo is-on'))).join('')}</div>`).join('')}</div>
				<svg class="ip__lines" aria-hidden="true"></svg>
				<div class="ip__pins">${pinned.map(({ m }, k) => `
					<button class="ip__pin" type="button" data-k="${k}" data-area="${pinned[k].a}" aria-label="${esc(T(m.title))}${T(m.where) ? ` — ${esc(T(m.where))}` : ''}">
						<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 43C13 34 2 27 2 16a14 14 0 0 1 28 0c0 11-11 18-14 27Z"/><circle cx="16" cy="16" r="5.5"/></svg>
					</button>`).join('')}
				</div>
				<div class="ip__tips" aria-hidden="true">${pinned.map(({ m }) => `
					<div class="ip__tip"><b>${esc(T(m.title))}</b>${subtitle(m) ? `<span>${subtitle(m)}</span>` : ''}</div>`).join('')}
				</div>
				<div class="ip__content" role="dialog" aria-modal="false" aria-label="${L('المكان', 'The place')}">${pinned.map(({ m }) => `
					<div class="ip__story">
						<h3>${esc(T(m.title))}</h3>
						${subtitle(m) ? `<p class="ip__sub">${subtitle(m)}</p>` : ''}
						${m.place ? `<p class="ip__line">${esc(T(m.place))}</p>` : ''}
						${m.text ? `<p class="ip__text">${esc(T(m.text))}</p>` : ''}
					</div>`).join('')}
					<button class="ip__close" type="button" aria-label="${L('اقفلي', 'Close')}">✕</button>
				</div>
				<p class="ip__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>
			</div>
			</div>
		</div></section>` : ''}
		<section class="sec${pinned.length ? '' : ' sec--top'}"><div class="wrap">
			${groups(list, pinned, names)}
		</div></section>
		${related(['story', 'chapters', 'gallery'])}`;
	},
	after(main, s) {
		const box = $('.ip', main);
		const pinned = (s.places || []).flatMap((m) => (where(m) ? areasOf(m).map((ar) => ({ m, ar })) : []));
		const names = [...new Set(pinned.map((p) => T(p.ar)))].sort((a, b) => pinned.filter((p) => T(p.ar) === b).length - pinned.filter((p) => T(p.ar) === a).length);
		if (box) points(box, pinned.map((p) => where(p.m)), pinned.map((p) => names.indexOf(T(p.ar))));
		const toMap = (area, k) => {
			$('.ip', main)?.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
			setTimeout(() => {
				const chip = area != null ? $(`.ip-areas [data-area="${area}"]`, main) : null;
				if (chip && !chip.classList.contains('is-on')) chip.click();
				if (k != null) setTimeout(() => $(`.ip__pin[data-k="${k}"]`, main)?.click(), 350);
			}, REDUCE ? 0 : 450);
		};
		main.addEventListener('click', (e) => {
			const a = e.target.closest('[data-go-area]');
			if (a) { e.preventDefault(); return toMap(a.dataset.goArea, null); }
			const p = e.target.closest('[data-go-pin]');
			if (p) { e.preventDefault(); const pin = $(`.ip__pin[data-k="${p.dataset.goPin}"]`, main); toMap(pin?.dataset.area, p.dataset.goPin); }
		});
	}
};

function hero(list, pinned, names) {
	if (!list.length) return '';
	const years = list.map((m) => String(m.date || '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)).sort();
	const areas = names.map((n, k) => { const here = pinned.filter((p) => p.a === k); const ph = here.find((p) => p.m.photo); return { n, k, count: here.length, photo: ph?.m.photo }; });
	return `<section class="sec sec--top pz-top"><div class="wrap">
		<div class="pz-head">
			<p class="gh-k">${doodle('pin', 16)} ${L('دفتر أماكننا', 'Our places, pinned')}${years.length ? ` · ${yr(years[0])}–${yr(years.at(-1))}` : ''}</p>
			<h1 class="pz-t">${L('أماكننا', 'Our places')}</h1>
			<p class="pz-sub"><b>${num(list.length)}</b> ${L(`مكان فيه حتة مننا، في ${num(names.length)} ${names.length <= 10 ? 'مناطق' : 'منطقة'}`, `places that hold a piece of us, in ${names.length} areas`)}</p>
		</div>
		<div class="pz-route">
			<svg class="pz-route__line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M10 44 C 120 6, 220 58, 330 30 S 540 4, 660 34 S 880 56, 990 18"/></svg>
			<ol class="pz-pins">${areas.map((a, i) => `<li style="--i:${i}"><a href="#ip-map" class="pz-pin" data-go-area="${a.k}">
				<span class="pz-pin__head">${doodle('pin', 30)}${a.photo ? `<span class="pz-pin__ph" data-media-box>${img(a.photo, '', 'pz-pin__img')}</span>` : ''}<i class="pz-pin__n">${num(a.count)}</i></span>
				<b>${(a.n || L('أماكن تانية', 'Elsewhere'))}</b>
			</a></li>`).join('')}</ol>
		</div>
		${pinned.length ? `<p class="pz-hint">${doodle('pin', 14)} ${L('دوس على أي دبوس عشان تفتح المنطقة على الخريطة', 'Tap a pin to open its area on the map')}</p>` : ''}
	</div></section>`;
}

/* the places, area by area: a pin heading with the area's name and count, then each place with its photo in a pin-shaped
   frame, its date, name, address, what it was, and «على الخريطة» when it has a pin */
/** the places, area by area, for another page (the atlas's «الأماكن» tab): the same cards as here */
export function placesSection(s) {
	const list = s.places || [];
	const pinned = list.flatMap((m) => { const at = where(m); return at ? areasOf(m).map((ar) => ({ m, at, ar })) : []; });
	const names = [...new Set(pinned.map((x) => T(x.ar)))].sort((a, b) => pinned.filter((x) => T(x.ar) === b).length - pinned.filter((x) => T(x.ar) === a).length);
	pinned.forEach((x) => { x.a = names.indexOf(T(x.ar)); });
	return groups(list, pinned, names);
}

function groups(list, pinned, names) {
	const order = [...names, ''];
	const by = new Map(order.map((n) => [n, []]));
	for (const m of list) { const mine = pinned.filter((p) => p.m === m); for (const n of mine.length ? mine.map((p) => T(p.ar)) : ['']) (by.get(n) || by.set(n, []).get(n)).push(m); }
	return [...by.entries()].filter(([, ms]) => ms.length).map(([n, ms]) => `<section class="pz-area">
		<h2 class="pz-area__h"><span class="pz-area__pin" aria-hidden="true">${doodle('pin', 18)}</span>${(n || L('أماكن تانية', 'Elsewhere'))}<small>${L(`${num(ms.length)} ${ms.length === 1 ? 'مكان' : ms.length <= 10 ? 'أماكن' : 'مكان'}`, `${ms.length} place${ms.length === 1 ? '' : 's'}`)}</small></h2>
		<div class="pz-grid">${ms.map((m, i) => { const k = pinned.findIndex((p) => p.m === m && T(p.ar) === n); return `<article class="pz-card reveal" style="--i:${i}">
			<span class="pz-card__pin"><span class="pz-card__ph">${doodle('pin', 40)}${m.photo ? `<span class="pz-card__img" data-media-box>${img(m.photo, App.t(m.title), 'zoom')}</span>` : ''}</span></span>
			<div class="pz-card__body">
				${m.date ? `<p class="pz-card__date">${fmtDate(m.date)}</p>` : ''}
				<h3 dir="auto">${T(m.title)}</h3>
				${T(m.where) ? `<p class="pz-card__where" dir="auto">${doodle('pin', 14)} ${T(m.where)}</p>` : ''}
				${m.place ? `<p class="pz-card__line" dir="auto">${T(m.place)}</p>` : ''}
				${m.text ? `<p class="pz-card__line" dir="auto">${T(m.text)}</p>` : ''}
				${k >= 0 ? `<a class="pz-card__go" href="#ip-map" data-go-pin="${k}" data-pid="${esc(m.id || '')}">${L('على الخريطة', 'On the map')} ${App.arrow}</a>` : ''}
			</div>
		</article>`; }).join('')}</div>
	</section>`).join('');
}

/** The map, the pins, and the hover/click effect. `areas[i]` is the area pin i belongs to; the map shows one area at a time. */
function points(box, spots, areas) {
	const mapEl = $('.ip__map', box), pins = $$('.ip__pin', box), bgs = $$('.ip__bg', box), tips = $$('.ip__tip', box);
	const content = $('.ip__content', box), stories = $$('.ip__story', box), lines = $('.ip__lines', box);
	const chips = $$('.ip-areas .chip', box.parentElement);
	const MAX_OP = 0.55, ACTIVE_ON = 30, GAP = 40;
	let pos = [], dmax = 100, active = -1, open = -1, drawn = '', slides = 0, area = areas[0] ?? 0;
	const here = () => spots.map((_, i) => i).filter((i) => areas[i] === area);

	// Fit the area's pins in the box at the biggest zoom that holds them all, and lay the tiles out under them.
	function layout() {
		const W = box.clientWidth, H = box.clientHeight;
		if (!W || !H) return;
		const ids = here();
		const w0 = spots.map(world);
		const xs = ids.map((i) => w0[i].x), ys = ids.map((i) => w0[i].y);
		const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
		const fit = Math.min((W - 120) / Math.max(maxX - minX, 1e-9), (H - 150) / Math.max(maxY - minY, 1e-9));
		const z = Math.max(MIN_Z, Math.min(MAX_Z, Math.floor(Math.log2(fit))));
		const k = 2 ** z, cx = ((minX + maxX) / 2) * k, cy = ((minY + maxY) / 2) * k + 20; // a little room above for the pins
		const ox = cx - W / 2, oy = cy - H / 2;
		const real = w0.map((p) => ({ x: p.x * k - ox, y: p.y * k - oy }));
		pos = real.map((p) => ({ ...p }));
		// Places a few streets apart would sit on one another: nudge their pins apart, with a line back to the real spot.
		for (let round = 0; round < 60; round++) {
			let moved = false;
			for (const a of ids) for (const b of ids) {
				if (b <= a) continue;
				let dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y, d = Math.hypot(dx, dy);
				if (d >= GAP) continue;
				if (d < 0.01) { dx = Math.cos(a + b); dy = Math.sin(a + b); d = 1; }
				const push = (GAP - d) / 2 + 0.5;
				pos[a].x -= (dx / d) * push; pos[a].y -= (dy / d) * push;
				pos[b].x += (dx / d) * push; pos[b].y += (dy / d) * push;
				moved = true;
			}
			if (!moved) break;
		}
		for (const i of ids) { pos[i].x = Math.min(W - 20, Math.max(20, pos[i].x)); pos[i].y = Math.min(H - 8, Math.max(52, pos[i].y)); }
		pins.forEach((el, i) => {
			const on = areas[i] === area;
			el.classList.toggle('is-out', !on);
			el.tabIndex = on ? 0 : -1;
			if (on) { el.style.left = `${pos[i].x}px`; el.style.top = `${pos[i].y}px`; }
		});
		lines.setAttribute('viewBox', `0 0 ${W} ${H}`);
		lines.innerHTML = ids.filter((i) => Math.hypot(pos[i].x - real[i].x, pos[i].y - real[i].y) > 4)
			.map((i) => `<line x1="${real[i].x.toFixed(1)}" y1="${real[i].y.toFixed(1)}" x2="${pos[i].x.toFixed(1)}" y2="${pos[i].y.toFixed(1)}"/><circle cx="${real[i].x.toFixed(1)}" cy="${real[i].y.toFixed(1)}" r="4"/>`).join('');
		dmax = Math.max(Math.min(W / 7, ids.length > 3 ? 110 : 200), ACTIVE_ON + 40);

		const key = `${z}/${Math.round(ox)}/${Math.round(oy)}/${W}/${H}`;
		if (key === drawn) return;
		drawn = key;
		const n = 2 ** z, x0 = Math.floor(ox / TILE), y0 = Math.floor(oy / TILE), x1 = Math.floor((ox + W) / TILE), y1 = Math.floor((oy + H) / TILE);
		let html = '';
		for (let ty = Math.max(0, y0); ty <= Math.min(n - 1, y1); ty++) {
			for (let tx = x0; tx <= x1; tx++) {
				const wx = ((tx % n) + n) % n;
				html += `<img src="${TILES(z, wx, ty)}" alt="" width="${TILE}" height="${TILE}" draggable="false" referrerpolicy="origin" style="left:${tx * TILE - ox}px;top:${ty * TILE - oy}px" onerror="this.remove()">`;
			}
		}
		mapEl.innerHTML = html;
	}

	const setActive = (i) => {
		if (i === active) return;
		active = i;
		pins.forEach((p, j) => { p.classList.toggle('is-on', j === i); p.classList.toggle('is-hidden', i >= 0 && j !== i); });
		box.classList.toggle('is-near', i >= 0);
		tips.forEach((t, j) => {
			t.classList.toggle('is-on', j === i);
			if (j === i) { t.style.left = `${pos[j].x}px`; t.style.top = `${pos[j].y}px`; }
		});
	};

	// The closer the pointer, the more of the nearest place's photo shows through the map.
	function near(x, y) {
		let best = -1, bestD = Infinity;
		const ds = pos.map((p, i) => (areas[i] === area ? Math.hypot(x - p.x, y - (p.y - 22)) : Infinity));
		ds.forEach((d, i) => { if (d < bestD) { bestD = d; best = i; } });
		bgs.forEach((b, i) => {
			const op = i === best ? Math.min(MAX_OP, Math.max(0, (MAX_OP * (dmax - ds[i])) / (dmax - ACTIVE_ON))) : 0;
			b.style.opacity = op.toFixed(3);
		});
		setActive(bestD <= ACTIVE_ON ? best : -1);
	}

	// A place's other photos are only fetched once it's opened.
	function wake(i) {
		for (const el of $$('[data-later]', bgs[i])) { el.dataset.m = el.dataset.later; delete el.dataset.later; }
		hydrate(bgs[i]);
	}

	function show(i) {
		open = i;
		setActive(-1);
		wake(i);
		pins.forEach((p) => p.classList.add('is-hidden'));
		bgs.forEach((b, j) => { b.style.opacity = j === i ? '1' : '0'; });
		stories.forEach((st, j) => st.classList.toggle('is-on', j === i));
		box.classList.add('is-open');
		$('.ip__close', box).focus({ preventScroll: true });
		// a place with several photos goes through them while it's open
		clearInterval(slides);
		const shots = $$('.ip__photo', bgs[i]);
		if (shots.length > 1 && !REDUCE) {
			let n = 0;
			slides = setInterval(() => {
				const live = shots.filter((s) => s.isConnected && s.src);
				if (live.length < 2) return;
				n = (n + 1) % live.length;
				shots.forEach((s) => s.classList.toggle('is-on', s === live[n]));
			}, 3500);
		}
	}
	function close() {
		if (open < 0) return;
		const was = open;
		open = -1;
		clearInterval(slides);
		box.classList.remove('is-open');
		stories.forEach((st) => st.classList.remove('is-on'));
		bgs.forEach((b) => { b.style.opacity = '0'; });
		pins.forEach((p) => p.classList.remove('is-hidden'));
		pins[was].focus({ preventScroll: true });
	}

	box.addEventListener('pointermove', (e) => {
		if (open >= 0 || e.pointerType !== 'mouse') return;
		const r = box.getBoundingClientRect();
		requestAnimationFrame(() => near(e.clientX - r.left, e.clientY - r.top));
	});
	box.addEventListener('pointerleave', () => {
		if (open >= 0) return;
		bgs.forEach((b) => { b.style.opacity = '0'; });
		setActive(-1);
	});
	pins.forEach((p, i) => {
		p.addEventListener('click', (e) => { e.stopPropagation(); show(i); });
		p.addEventListener('focus', () => { if (open < 0 && !p.matches(':hover')) { bgs.forEach((b, j) => { b.style.opacity = j === i ? String(MAX_OP) : '0'; }); setActive(i); } });
		p.addEventListener('blur', () => { if (open < 0) { bgs[i].style.opacity = '0'; setActive(-1); } });
	});
	content.addEventListener('click', close);
	box.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
	chips.forEach((c) => c.addEventListener('click', () => {
		close();
		area = +c.dataset.area;
		chips.forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
		bgs.forEach((b) => { b.style.opacity = '0'; });
		setActive(-1);
		layout();
	}));

	if (REDUCE) box.classList.add('is-still');
	layout();
	new ResizeObserver(() => { if (open < 0) setActive(-1); layout(); }).observe(box);
	hydrate(box);
}
