import { L, T, esc, img, fmtDate, pageHead, related, App, $, $$, num, REDUCE, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { GOV, govName, loadTrips, mapSVG } from './trips.js';
import { fit, where, nearestGov, CAPITALS, km } from '../tilemap.js';

/* «أطلسنا» — an example of «أماكننا» and «خرايط مدننا» on one page (both pages stay as they are).
   The top: Egypt with every governorate we've been to coloured in — point at one for its name and how many places,
   tap it to open its city — beside the totals. Then our cities as a row of street-map posters. Then the open city:
   its poster (the streets in the dark, every place a gold pin) beside the list of its places; point at a pin or a name
   and that place's photo comes up through the streets, tap it and the photo opens on the map with its story. The places
   are our places with "at" (story.json and the photo folders) and the spots added from the phones; a place goes on the
   map of the governorate it's in — Cairo and Giza apart — or on a city of its own when it's far from the capital. */

const FAR = 80;
const photosOf = (m) => [...new Set([...(m.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo)), m.photo].filter(Boolean))];
const dm = (v) => { const a = Math.abs(v), d = Math.floor(a), m = Math.round((a - d) * 60); return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`; };
const coords = ({ lat, lng }) => `${dm(lat)}${lat >= 0 ? 'N' : 'S'} ${dm(lng)}${lng >= 0 ? 'E' : 'W'}`;
/* around Cairo and Giza the Nile decides which one a spot is in */
function govOf(at) {
	const g = nearestGov(at);
	if ((g === 'EG.QH' || g === 'EG.JZ') && at.lat > 29.75 && at.lat < 30.2) return at.lng < 31.213 ? 'EG.JZ' : 'EG.QH';
	return g;
}

/** every city with its places: { id, gov, ar, en, places: [{ title, at, date, where, text, photos }], trips: [years] } */
function citiesOf(s, trips, spots) {
	const map = new Map();
	const get = (id, gov, name) => {
		if (!map.has(id)) map.set(id, { id, gov, ar: name?.ar || GOV[gov]?.ar || '', en: name?.en || GOV[gov]?.en || gov, places: [], trips: [] });
		return map.get(id);
	};
	for (const m of s.places || []) {
		const at = where(m);
		if (!at) continue;
		const gov = govOf(at), cap = CAPITALS[gov];
		const own = m.area && cap && km(at, { lat: cap[0], lng: cap[1] }) > FAR;
		get(own ? `${gov}~${App.t(m.area)}` : gov, gov, own ? m.area : null).places.push({ title: App.t(m.title), at, date: m.date, where: App.t(m.where), text: App.t(m.text) || App.t(m.place), photos: photosOf(m) });
	}
	for (const x of spots) {
		const at = where(x);
		if (!at) continue;
		const gov = x.gov && GOV[x.gov] ? x.gov : govOf(at);
		get(gov, gov).places.push({ title: x.title, at, date: x.date, where: '', text: x.note || '', photos: [], live: true });
	}
	for (const t of trips) if (t.gov && GOV[t.gov]) get(t.gov, t.gov).trips.push(t.year);
	return [...map.values()].filter((c) => c.places.length).sort((a, b) => b.places.length - a.places.length);
}
const centreOf = (c) => (CAPITALS[c.id] ? { lat: CAPITALS[c.id][0], lng: CAPITALS[c.id][1] } : { lat: c.places.reduce((a, p) => a + p.at.lat, 0) / c.places.length, lng: c.places.reduce((a, p) => a + p.at.lng, 0) / c.places.length });

export default {
	title: { ar: 'أطلسنا', en: 'Our atlas' },
	render() {
		return `<section class="sec sec--top at-top"><div class="wrap"><div class="at-hero">
			<div class="at-egypt">${mapSVG('eg--atlas')}<div class="at-egypt__tip" id="at-tip" hidden></div></div>
			<div class="at-hero__body">
				<p class="gh-k">${doodle('pin', 16)} ${L('تجربة: المدن والأماكن في صفحة واحدة', 'A try-out: our cities and places on one page')}</p>
				<h1 class="at-t">${L('أطلسنا', 'Our atlas')}</h1>
				<ul class="at-facts" id="at-facts"><li><b>…</b></li></ul>
				<p class="at-hint">${doodle('pin', 14)} ${L('دوس على أي محافظة ملونة تفتح مدينتها', 'Tap a coloured governorate to open its city')}</p>
			</div>
		</div>
		<!-- the top of «أماكننا» and the top of «خرايط مدننا» in one: every city a map pin (a place's photo in its head, how many
		     places on it) hanging its street poster on a string, the way the cities hang on their wall — tap one to open it -->
		<ol class="at-hang" id="at-strip" role="tablist" aria-label="${L('مدننا', 'Our cities')}"></ol>
		</div></section>
		${pageHead(L('أطلسنا', 'Our atlas'), L('كل مدينة رحناها، وكل مكان فيها بصوره', 'Every city we’ve been to, and every place in it with its photos'), [{ href: 'atlas.html', ar: 'أطلسنا', en: 'Our atlas' }], { band: '' })}
		<section class="sec"><div class="wrap">
			<div class="at-city" id="at-city">
				<div class="at-map" id="at-map" style="direction:ltr">
					<div class="at-map__tiles" aria-hidden="true"></div>
					<div class="at-map__photo" aria-hidden="true"></div>
					<div class="at-map__pins"></div>
					<div class="at-map__name"><b id="at-en"></b><i id="at-ar" dir="rtl"></i><small id="at-sub"></small></div>
					<div class="at-map__open" id="at-open" hidden></div>
					<p class="at-map__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a></p>
				</div>
				<ol class="at-list" id="at-list"></ol>
			</div>
			<p class="center at-links"><a class="btn btn--sm btn--ghost" href="places.html">${doodle('pin', 16)} ${L('أماكننا', 'Our places')}</a> <a class="btn btn--sm btn--ghost" href="cities.html">${doodle('house', 16)} ${L('خرايط مدننا', 'Our city maps')}</a></p>
		</div></section>
		${related(['places', 'cities', 'journeys'])}`;
	},

	async after(main, s) {
		const [trips, spots] = await Promise.all([loadTrips(s).catch(() => []), live.load('spots').catch(() => ({ items: [] }))]);
		const list = citiesOf(s, trips, spots.items || []);
		const svg = $('.eg--atlas', main), tip = $('#at-tip', main);
		const mapEl = $('#at-map', main), tiles = $('.at-map__tiles', mapEl), pinsEl = $('.at-map__pins', mapEl), photo = $('.at-map__photo', mapEl), openEl = $('#at-open', main);
		let cur = null, view = null;

		/* the numbers beside Egypt */
		const placesN = list.reduce((a, c) => a + c.places.length, 0);
		const photosN = list.reduce((a, c) => a + c.places.reduce((b, p) => b + p.photos.length, 0), 0);
		const govs = new Set(list.map((c) => c.gov));
		$('#at-facts', main).innerHTML = [
			[num(list.length), L(list.length <= 10 ? 'مدن' : 'مدينة', 'cities')], [num(placesN), L('مكان', 'places')],
			[num(govs.size), L('محافظة من ٢٧', 'of 27 governorates')], [num(photosN), L('صورة', 'photos')]
		].map(([b, t], i) => `<li style="--i:${i}"><b>${b}</b><span>${t}</span></li>`).join('');

		/* Egypt: our governorates coloured, how many places on hover, a tap opens the city */
		for (const el of $$('[data-gov]', svg)) {
			const n = list.filter((c) => c.gov === el.dataset.gov).reduce((a, c) => a + c.places.length, 0);
			el.classList.toggle('is-been', n > 0);
			el.dataset.n = n;
		}
		svg.addEventListener('pointerover', (e) => {
			const el = e.target.closest('[data-gov]');
			if (!el) { tip.hidden = true; return; }
			const n = +el.dataset.n;
			const r = el.getBoundingClientRect(), b = svg.parentElement.getBoundingClientRect();
			tip.innerHTML = `<b>${esc(govName(el.dataset.gov))}</b><small>${n ? L(`${num(n)} ${n === 1 ? 'مكان' : n <= 10 ? 'أماكن' : 'مكان'}`, `${n} place${n === 1 ? '' : 's'}`) : L('لسه مرحناهاش', 'Not yet')}</small>`;
			tip.style.left = `${r.left - b.left + r.width / 2}px`; tip.style.top = `${r.top - b.top}px`;
			tip.hidden = false;
		});
		svg.addEventListener('pointerleave', () => { tip.hidden = true; });
		svg.addEventListener('click', (e) => {
			const el = e.target.closest('[data-gov]');
			const c = el && list.find((x) => x.gov === el.dataset.gov);
			if (!c) return;
			show(c.id);
			$('#at-city', main).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
		});

		/* the cities as a row of posters */
		const strip = $('#at-strip', main);
		strip.innerHTML = list.map((c, k) => { const ph = c.places.find((p) => p.photos.length)?.photos[0]; return `<li style="--k:${k}"><button class="at-card" type="button" role="tab" data-c="${esc(c.id)}">
			<span class="at-card__pin pz-pin__head">${doodle('pin', 26)}${ph ? `<span class="pz-pin__ph" data-media-box>${img(ph, '')}</span>` : ''}<i class="pz-pin__n">${num(c.places.length)}</i></span>
			<span class="at-card__string" aria-hidden="true"></span>
			<span class="at-card__map" style="direction:ltr"><span class="at-card__tiles"></span><span class="at-card__dots"></span></span>
			<b>${esc(L(c.ar, c.en))}</b><small>${L(`${num(c.places.length)} ${c.places.length === 1 ? 'مكان' : c.places.length <= 10 ? 'أماكن' : 'مكان'}`, `${c.places.length} place${c.places.length === 1 ? '' : 's'}`)}</small>
		</button></li>`; }).join('');
		for (const card of $$('[data-c]', strip)) {
			const c = list.find((x) => x.id === card.dataset.c), t = $('.at-card__tiles', card);
			const v = fit(t, [...c.places.map((p) => p.at), centreOf(c)], { pad: 18, zoom: 12, maxZ: 13, minZ: 7, center: centreOf(c), poster: true, detail: 2 });
			$('.at-card__dots', card).innerHTML = c.places.map((p) => { const xy = v.at(p.at); return `<i style="left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px"></i>`; }).join('');
		}
		strip.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; show(b.dataset.c); $('#at-city', main).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); });

		/* the open city: its poster with a gold pin for every place, and the list of its places */
		const peek = (i) => {
			const p = cur?.places[i];
			$$('.at-pin', pinsEl).forEach((x) => x.classList.toggle('is-on', +x.dataset.i === i));
			$$('#at-list [data-i]', main).forEach((x) => x.classList.toggle('is-on', +x.dataset.i === i));
			if (!p || !p.photos.length) { photo.classList.remove('is-on'); return; }
			photo.innerHTML = img(p.photos[0], '');
			hydrate(photo);
			photo.classList.add('is-on');
		};
		const openPlace = (i) => {
			const p = cur?.places[i];
			if (!p) return;
			openEl.innerHTML = `<button class="at-open__x" type="button" aria-label="${L('اقفل', 'Close')}">✕</button>
				${p.photos.length ? `<div class="at-open__ph" data-media-box>${img(p.photos[0], esc(p.title), 'zoom')}</div>` : ''}
				<div class="at-open__tx"><b dir="auto">${esc(p.title)}</b>${p.date || p.where ? `<small dir="auto">${esc([p.date ? fmtDate(p.date) : '', p.where].filter(Boolean).join(' · '))}</small>` : ''}${p.text ? `<p dir="auto">${esc(p.text)}</p>` : ''}${p.photos.length > 1 ? `<span class="at-open__n">${doodle('camera', 14)} ${L(`${num(p.photos.length)} صورة`, `${p.photos.length} photos`)}</span>` : ''}</div>`;
			hydrate(openEl);
			openEl.hidden = false;
			$('.at-open__x', openEl).focus({ preventScroll: true });
		};
		openEl.addEventListener('click', (e) => { if (e.target.closest('.at-open__x')) openEl.hidden = true; });
		mapEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') openEl.hidden = true; });

		function show(id) {
			const c = list.find((x) => x.id === id) || list[0];
			if (!c) return;
			cur = c;
			openEl.hidden = true;
			photo.classList.remove('is-on');
			const narrow = mapEl.clientWidth < 600;
			view = fit(tiles, [...c.places.map((p) => p.at), centreOf(c)], { pad: narrow ? 60 : 90, padTop: 40, zoom: 15, maxZ: 16, minZ: 7, center: centreOf(c), poster: true });
			pinsEl.innerHTML = c.places.map((p, i) => { const xy = view.at(p.at); return `<button class="at-pin${p.photos.length ? ' has-ph' : ''}" type="button" data-i="${i}" style="left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px;--d:${(i % 9) * 60}ms" aria-label="${esc(p.title)}"><svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 43C13 34 2 27 2 16a14 14 0 0 1 28 0c0 11-11 18-14 27Z"/><circle cx="16" cy="16" r="5.5"/></svg></button>`; }).join('');
			$('#at-en', main).textContent = c.en;
			$('#at-ar', main).textContent = c.ar;
			$('#at-sub', main).textContent = [[GOV[c.gov]?.en, 'Egypt'].filter(Boolean).join(', '), coords(centreOf(c)), c.trips.length ? L(`رحلة ${c.trips.map((y) => num(y).replace(/[٬,]/g, '')).join(' و')}`, `trip ${c.trips.join(' & ')}`) : ''].filter(Boolean).join(' · ');
			$('#at-list', main).innerHTML = c.places.map((p, i) => `<li><button type="button" data-i="${i}">
				<span class="at-list__ph">${doodle('pin', 18)}${p.photos.length ? `<span data-media-box>${img(p.photos[0], '')}</span>` : ''}</span>
				<span class="at-list__tx"><b dir="auto">${esc(p.title)}</b>${p.date || p.where ? `<small dir="auto">${esc([p.date ? fmtDate(p.date) : '', p.where].filter(Boolean).join(' · '))}</small>` : ''}</span>
			</button></li>`).join('');
			hydrate($('#at-list', main));
			$$('.at-card', strip).forEach((b) => { const on = b.dataset.c === c.id; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
			$$('[data-gov]', svg).forEach((el) => el.classList.toggle('is-focus', el.dataset.gov === c.gov));
			history.replaceState(history.state, '', `#${encodeURIComponent(c.id)}`);
		}
		pinsEl.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-i]'); if (b && e.pointerType === 'mouse') peek(+b.dataset.i); });
		pinsEl.addEventListener('pointerleave', () => peek(-1));
		pinsEl.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) openPlace(+b.dataset.i); });
		const lst = $('#at-list', main);
		lst.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-i]'); if (b) peek(+b.dataset.i); });
		lst.addEventListener('pointerleave', () => peek(-1));
		lst.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { openPlace(+b.dataset.i); mapEl.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest' }); } });

		const fromHash = decodeURIComponent(location.hash.slice(1));
		show(list.some((c) => c.id === fromHash) ? fromHash : list[0]?.id);
		let w = mapEl.clientWidth;
		new ResizeObserver(() => { if (mapEl.isConnected && Math.abs(mapEl.clientWidth - w) > 30) { w = mapEl.clientWidth; show(cur?.id); } }).observe(mapEl);
	}
};
