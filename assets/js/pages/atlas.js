import { L, Y, T, esc, img, fmtDate, pageHead, related, App, $, $$, num, REDUCE, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { GOV, govName, loadTrips, mapSVG } from './trips.js';
import { fit, where, here, nearestGov, CAPITALS, km } from '../tilemap.js';
import { setupNote } from './journal.js';
import { placesSection, placesPins, placeAreas } from './places.js';

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
export function citiesOf(s, trips, spots) {
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
		get(own ? `${gov}~${App.t(m.area)}` : gov, gov, own ? m.area : null).places.push({ id: m.id, title: App.t(m.title), at, date: m.date, where: App.t(m.where), text: App.t(m.text) || App.t(m.place), photos: photosOf(m) });
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

/* the big map with the list of its places beside it: under «المدن» the city as a poster with a light for every place,
   under «الأماكن» the real map with a pin for every place */

const mapBlock = (id, real) => `<div class="at-city" id="${id}">
	<div class="at-map${real ? ' at-map--real' : ' at-map--frame'}" style="direction:ltr">
		<div class="at-map__tiles" aria-hidden="true"></div>
		<div class="at-map__photo" aria-hidden="true"></div>
		<div class="at-map__pins"></div>
		<div class="at-map__name"><b class="at-en"></b><i class="at-ar" dir="rtl"></i><small class="at-sub"></small></div>
		<div class="at-map__open" hidden></div>
		<p class="at-map__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a></p>
	</div>
	<ol class="at-list"></ol>
</div>`;
const PIN = '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 43C13 34 2 27 2 16a14 14 0 0 1 28 0c0 11-11 18-14 27Z"/><circle cx="16" cy="16" r="5.5"/></svg>';
const count = (n) => L(`${num(n)} ${n === 1 ? 'مكان' : n <= 10 ? 'أماكن' : 'مكان'}`, `${n} place${n === 1 ? '' : 's'}`);

/** one big map: show(city) draws it, open(i) pops a place open on it */
function bigMap(box, real) {
	const mapEl = $('.at-map', box), tiles = $('.at-map__tiles', mapEl), pinsEl = $('.at-map__pins', mapEl), photo = $('.at-map__photo', mapEl), openEl = $('.at-map__open', mapEl), lst = $('.at-list', box);
	const m = { cur: null, mapEl };
	const peek = (i) => {
		const p = m.cur?.places[i];
		$$('[data-i]', pinsEl).forEach((x) => x.classList.toggle('is-on', +x.dataset.i === i));
		$$('[data-i]', lst).forEach((x) => x.classList.toggle('is-on', +x.dataset.i === i));
		if (!p || !p.photos.length) { photo.classList.remove('is-on'); return; }
		photo.innerHTML = img(p.photos[0], '');
		hydrate(photo);
		photo.classList.add('is-on');
	};
	m.open = (i) => {
		const p = m.cur?.places[i];
		if (!p) return;
		peek(i);
		openEl.innerHTML = `<button class="at-open__x" type="button" aria-label="${L('اقفل', 'Close')}">✕</button>
			${p.photos.length ? `<div class="at-open__ph" data-media-box>${img(p.photos[0], esc(p.title), 'zoom')}</div>` : ''}
			<div class="at-open__tx"><b dir="auto">${esc(p.title)}</b>${p.date || p.where ? `<small dir="auto">${esc([p.date ? fmtDate(p.date) : '', p.where].filter(Boolean).join(' · '))}</small>` : ''}${p.text ? `<p dir="auto">${esc(p.text)}</p>` : ''}${p.photos.length > 1 ? `<span class="at-open__n">${doodle('camera', 14)} ${L(`${num(p.photos.length)} صورة`, `${p.photos.length} photos`)}</span>` : ''}</div>`;
		hydrate(openEl);
		openEl.hidden = false;
		$('.at-open__x', openEl).focus({ preventScroll: true });
	};
	m.show = (c) => {
		if (!c) return;
		m.cur = c;
		openEl.hidden = true;
		photo.classList.remove('is-on');
		const narrow = mapEl.clientWidth < 600;
		const view = fit(tiles, [...c.places.map((p) => p.at), centreOf(c)], { pad: narrow ? 60 : 90, padTop: 40, zoom: 15, maxZ: 16, minZ: 7, center: centreOf(c), poster: !real });
		pinsEl.innerHTML = c.places.map((p, i) => {
			const xy = view.at(p.at), at = `left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px;--d:${(i % 9) * 60}ms`;
			return real
				? `<button class="at-pin${p.photos.length ? ' has-ph' : ''}" type="button" data-i="${i}" style="${at}" aria-label="${esc(p.title)}">${PIN}</button>`
				: `<button class="cm__pin at-light" type="button" data-i="${i}" style="${at}" aria-label="${esc(p.title)}"></button>`;
		}).join('');
		$('.at-en', box).textContent = c.en;
		$('.at-ar', box).textContent = c.ar;
		$('.at-sub', box).textContent = [[GOV[c.gov]?.en, 'Egypt'].filter(Boolean).join(', '), coords(centreOf(c)), c.trips.length ? L(`رحلة ${c.trips.map((y) => num(y).replace(/[٬,]/g, '')).join(' و')}`, `trip ${c.trips.join(' & ')}`) : ''].filter(Boolean).join(' · ');
		lst.innerHTML = c.places.map((p, i) => `<li><button type="button" data-i="${i}">
			<span class="at-list__ph">${doodle('pin', 18)}${p.photos.length ? `<span data-media-box>${img(p.photos[0], '')}</span>` : ''}</span>
			<span class="at-list__tx"><b dir="auto">${esc(p.title)}</b>${p.date || p.where ? `<small dir="auto">${esc([p.date ? fmtDate(p.date) : '', p.where].filter(Boolean).join(' · '))}</small>` : ''}</span>
		</button></li>`).join('');
		hydrate(lst);
	};
	openEl.addEventListener('click', (e) => { if (e.target.closest('.at-open__x')) openEl.hidden = true; });
	mapEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') openEl.hidden = true; });
	pinsEl.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-i]'); if (b && e.pointerType === 'mouse') peek(+b.dataset.i); });
	pinsEl.addEventListener('pointerleave', () => peek(-1));
	pinsEl.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) m.open(+b.dataset.i); });
	lst.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-i]'); if (b) peek(+b.dataset.i); });
	lst.addEventListener('pointerleave', () => peek(-1));
	lst.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { m.open(+b.dataset.i); mapEl.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest' }); } });
	// redraw on a real change of width, and only while it can be seen (a hidden tab has no size)
	let w = mapEl.clientWidth;
	new ResizeObserver(() => { const nw = mapEl.clientWidth; if (nw && m.cur && Math.abs(nw - w) > 30) { w = nw; m.show(m.cur); } }).observe(mapEl);
	return m;
}

export default {
	title: { ar: 'أطلسنا', en: 'Our atlas' },
	render(s) {
		return `<section class="sec sec--top at-top"><div class="wrap"><div class="at-hero">
			<div class="at-egypt">${mapSVG('eg--atlas')}<div class="at-egypt__tip" id="at-tip" hidden></div></div>
			<div class="at-hero__body">
				<p class="gh-k">${doodle('pin', 16)} ${L('المدن والأماكن في صفحة واحدة', 'Our cities and places on one page')}</p>
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
			<div class="at-tabs" role="tablist" aria-label="${L('أطلسنا', 'Our atlas')}">
				<button class="at-tab is-on" type="button" role="tab" aria-selected="true" aria-controls="at-pane-cities" data-tab="cities">${doodle('house', 18)} ${L('المدن', 'Cities')}</button>
				<button class="at-tab" type="button" role="tab" aria-selected="false" aria-controls="at-pane-places" data-tab="places">${doodle('pin', 18)} ${L('الأماكن', 'Places')}</button>
			</div>
			<div class="at-pane" id="at-pane-cities" role="tabpanel">
			<div class="at-strip" id="at-row" role="tablist" aria-label="${L('مدننا', 'Our cities')}"></div>
			${mapBlock('at-city', false)}
			${live.canWrite() ? '' : `<div class="narrow" style="margin:28px auto 0">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:28px auto 0"${live.canWrite() ? '' : ' hidden'}>
				<summary><span>${doodle('pin', 22)}</span> ${Y('نوّر مكان', 'نوّري مكان', 'Light up a spot')}</summary>
				<form id="cm-form" autocomplete="off">
					<label class="f"><span>${L('اسم المكان', 'The spot')}</span><input name="title" dir="auto" maxlength="80" required placeholder="${L('قلعة قايتباي', 'Qaitbay Citadel')}"></label>
					<div class="f-row">
						<label class="f"><span>${L('المحافظة', 'Governorate')}</span><select name="gov">${Object.keys(CAPITALS).sort((a, b) => govName(a).localeCompare(govName(b))).map((g) => `<option value="${g}">${esc(govName(g))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('رحناه إمتى؟', 'When?')}</span><input name="date" type="date"></label>
					</div>
					<label class="f"><span>${L('المكان على الخريطة', 'Where on the map')}</span><input name="at" dir="ltr" required placeholder="31.2140, 29.8856" inputmode="decimal"></label>
					<p class="cm-howto">${Y('من جوجل ماب: دوسة طويلة (أو كليك يمين) على المكان، وانسخ أول سطر. أو:', 'من جوجل ماب: دوسة طويلة (أو كليك يمين) على المكان، وانسخي أول سطر. أو:', 'From Google Maps: long-press (or right-click) the spot and copy the first line. Or:')} <button class="link" type="button" id="cm-here">${doodle('pin', 16)} ${L('أنا هناك دلوقتي', 'I’m there now')}</button></p>
					<label class="f"><span>${L('كلمة عنه (اختياري)', 'A word about it (optional)')}</span><input name="note" dir="auto" maxlength="140"></label>
					<p class="form-msg" id="cm-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('نوّره ✦', 'نوّريه ✦', 'Light it up ✦')}</button></div>
				</form>
			</details>
			</div>
			<div class="at-pane" id="at-pane-places" role="tabpanel" hidden>
				<div class="at-areas" id="at-chips">${placesPins(s)}</div>
				${mapBlock('at-pcity', true)}
				${placesSection(s)}
			</div>
		</div></section>
		${related(['journeys', 'anniversaries', 'distances'])}`;
	},

	async after(main, s) {
		const [trips, spots] = await Promise.all([loadTrips(s).catch(() => []), live.load('spots').catch(() => ({ items: [] }))]);
		const list = citiesOf(s, trips, spots.items || []);
		const svg = $('.eg--atlas', main), tip = $('#at-tip', main);
		const cities = bigMap($('#at-city', main), false), places = bigMap($('#at-pcity', main), true);

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
		const row = $('#at-row', main);
		row.innerHTML = list.map((c, k) => `<button class="cm-card cm-card--noir cmh-frame at-poster" type="button" role="tab" data-c="${esc(c.id)}" style="--k:${k};--r:${k % 2 ? 1.6 : -1.4}deg;--dy:${k % 2 ? 14 : 0}px" aria-label="${esc(L(c.ar, c.en))}">
			<span class="cmh-wire" aria-hidden="true"></span>
			<span class="cm-poster" aria-hidden="true">
				<span class="cm-card__map" style="direction:ltr"><span class="at-card__tiles cm-card__tiles"></span><span class="at-card__dots cm-card__dots"></span></span>
				<span class="cm-poster__en">${esc(c.en)}</span>
				<span class="cm-poster__ar" dir="rtl">${esc(c.ar)}</span>
				<span class="cm-poster__sub">${esc([GOV[c.gov]?.en, 'Egypt'].filter(Boolean).join(' · '))}</span>
			</span>
			<small>${count(c.places.length)}</small>
		</button>`).join('');
		row.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) show(b.dataset.c); });
		for (const card of [...$$('[data-c]', strip), ...$$('[data-c]', row)]) {
			const c = list.find((x) => x.id === card.dataset.c), t = $('.at-card__tiles', card);
			const v = fit(t, [...c.places.map((p) => p.at), centreOf(c)], { pad: 18, zoom: 12, maxZ: 13, minZ: 7, center: centreOf(c), poster: true, detail: 2 });
			$('.at-card__dots', card).innerHTML = c.places.map((p) => { const xy = v.at(p.at); return `<i style="left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px"></i>`; }).join('');
		}
		strip.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; show(b.dataset.c); $('#at-city', main).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); });

		/* «المدن»: the open city with a light for every place; the Egypt map, the hanging pins and the row follow it */
		function show(id) {
			const c = list.find((x) => x.id === id) || list[0];
			if (!c) return;
			cities.show(c);
			[...$$('.at-card', strip), ...$$('[data-c]', row)].forEach((b) => { const on = b.dataset.c === c.id; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
			$$('[data-gov]', svg).forEach((el) => el.classList.toggle('is-focus', el.dataset.gov === c.gov));
			history.replaceState(history.state, '', `#${encodeURIComponent(c.id)}`);
		}
		/* «الأماكن»: the same, on the real map with pins; its own row of cities */
		const chips = $('#at-chips', main);
		// every area of «أماكننا» as its own map: its places from the cities above, by id
		const byId = new Map(list.flatMap((c) => c.places.filter((x) => x.id).map((x) => [x.id, { p: x, gov: c.gov }])));
		const areas = placeAreas(s).map((r) => { const got = r.ids.map((id) => byId.get(id)).filter(Boolean); return { id: `area-${r.k}`, k: r.k, ar: r.ar, en: r.en, gov: got[0]?.gov, trips: [], places: got.map((g) => g.p) }; }).filter((r) => r.places.length);
		function showPlaces(k) {
			const c = areas.find((x) => x.k === +k) || areas[0];
			if (!c) return;
			places.show(c);
			$$('[data-go-area]', chips).forEach((b) => b.classList.toggle('is-on', +b.dataset.goArea === c.k));
		}
		chips.addEventListener('click', (e) => { const b = e.target.closest('[data-go-area]'); if (!b) return; e.preventDefault(); showPlaces(b.dataset.goArea); places.mapEl.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }); });

		const tab = (name) => {
			$$('.at-tab', main).forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
			$('#at-pane-cities', main).hidden = name !== 'cities';
			$('#at-pane-places', main).hidden = name !== 'places';
			if (name === 'places') {
				for (const el of $$('#at-pane-places .reveal', main)) el.classList.add('is-in');
				if (!places.cur) showPlaces(areas[0]?.k);
			}
		};
		$('.at-tabs', main).addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });
		hydrate($('#at-pane-places', main));
		$('#at-pane-places', main).addEventListener('click', (e) => {
			const go = e.target.closest('[data-go-pin]');
			if (!go) return;
			e.preventDefault();
			const inCard = go.closest('[data-area]')?.dataset.area;
			const c = areas.find((x) => String(x.k) === inCard && x.places.some((p) => p.id === go.dataset.pid)) || areas.find((x) => x.places.some((p) => p.id === go.dataset.pid));
			if (!c) return;
			showPlaces(c.k);
			places.mapEl.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
			setTimeout(() => places.open(c.places.findIndex((p) => p.id === go.dataset.pid)), REDUCE ? 0 : 500);
		});
		const form = $('#cm-form', main);
		if (form) {
			const msg = $('#cm-msg', main);
			$('#cm-here', main).onclick = async () => {
				msg.textContent = Y('بندور عليك…', 'بندور عليكي…', 'Finding you…');
				try { const p = await here(); form.at.value = `${p.lat}, ${p.lng}`; form.gov.value = govOf(p); msg.textContent = ''; }
				catch (err) { msg.textContent = err.message === 'denied' ? Y('اسمح للموقع بالـ Location من إعدادات المتصفح', 'اسمحي للموقع بالـ Location من إعدادات المتصفح', 'Allow Location for this site in the browser settings') : L('معرفناش نلاقي المكان', 'Couldn’t find the spot'); }
			};
			form.onsubmit = async (e) => {
				e.preventDefault();
				const at = where(form.at.value);
				if (!at) { msg.textContent = L('المكان لازم يبقى رقمين زي 31.2140, 29.8856', 'The spot should be two numbers like 31.2140, 29.8856'); return; }
				const x = { id: live.newId(), title: form.title.value.trim(), gov: form.gov.value, at: `${at.lat}, ${at.lng}`, date: form.date.value || undefined, note: form.note.value.trim() || undefined, by: live.me() };
				if (!x.title) return;
				try {
					await live.save('spots', (d) => { (d.items = d.items || []).push(x); });
					form.reset();
					msg.textContent = L('اتنوّر ✦', 'Lit up ✦');
					// the atlas draws its cities once, so it opens again on the new spot's city
					location.hash = x.gov;
					location.reload();
				} catch (err) { msg.textContent = live.why(err); }
			};
		}

		const fromHash = decodeURIComponent(location.hash.slice(1));
		show(list.some((c) => c.id === fromHash) ? fromHash : list.find((c) => c.gov === fromHash)?.id || list[0]?.id);
		if (fromHash === 'places') tab('places');
	}
};
