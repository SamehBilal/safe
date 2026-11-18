import { L, Y, T, esc, pageHead, related, App, $, $$, num, fmtDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { GOV, govName, loadTrips } from './trips.js';
import { fit, where, here, nearestGov, CAPITALS, km } from '../tilemap.js';

/* A map for every city we've been to, like a city poster: the streets in the dark and every spot we went to lit up.
   The spots are our places that have "at" in story.json (each on the map of the governorate it's in — Cairo and Giza
   apart), the governorates of our anniversary trips, and spots added from the phones
   (the shared list content/live/spots.bin). */

// degrees and minutes, as on a map poster: 30°03′N 31°14′E
const dm = (v) => { const a = Math.abs(v), d = Math.floor(a), m = Math.round((a - d) * 60); return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`; };
const coords = ({ lat, lng }) => `${dm(lat)}${lat >= 0 ? 'N' : 'S'} ${dm(lng)}${lng >= 0 ? 'E' : 'W'}`;

/* The governorate a spot is in. Cairo's and Giza's centres are a few km apart, so around them the Nile decides
   (Giza is the west bank: Mohandeseen, Dokki, the Pyramids, October; Zamalek and Maadi are Cairo). */
function govOf(at) {
	const g = nearestGov(at);
	if ((g === 'EG.QH' || g === 'EG.JZ') && at.lat > 29.75 && at.lat < 30.2) return at.lng < 31.213 ? 'EG.JZ' : 'EG.QH';
	return g;
}

/* where a city's poster is centred: its capital, or (for a city of its own, like Siwa) the middle of its spots */
const centreOf = (c) => {
	if (CAPITALS[c.id]) return { lat: CAPITALS[c.id][0], lng: CAPITALS[c.id][1] };
	if (!c.spots.length) return null;
	return { lat: c.spots.reduce((a, p) => a + p.at.lat, 0) / c.spots.length, lng: c.spots.reduce((a, p) => a + p.at.lng, 0) / c.spots.length };
};

/* how far (km) from its governorate's capital a place can be and still sit on that city's map */
const FAR = 80;

/** Every city with its spots:[{ id (governorate), name, spots: [{ title, at, date, note, id?, by? }], trips: [years] }] */
function cities(s, trips, extra) {
	const map = new Map();
	const get = (gov) => {
		if (!map.has(gov)) map.set(gov, { id: gov, name: govName(gov) || gov, ar: GOV[gov]?.ar || '', en: GOV[gov]?.en || gov, gov: '', spots: [], trips: [] });
		return map.get(gov);
	};
	const getOwn = (id, area, gov) => {
		if (!map.has(id)) map.set(id, { id, name: App.t(area), ar: area.ar || App.t(area), en: area.en || App.t(area), gov: GOV[gov]?.en || '', spots: [], trips: [] });
		return map.get(id);
	};
	// every place on the map of its own governorate — Cairo and Giza are two cities, not one. A place far from its
	// governorate's capital (Siwa is 300 km from Marsa Matrouh) is a city of its own, named after its area
	for (const m of s.places || []) {
		const at = where(m);
		if (!at) continue;
		const gov = govOf(at), cap = CAPITALS[gov];
		const own = m.area && cap && km(at, { lat: cap[0], lng: cap[1] }) > FAR;
		const c = own ? getOwn(`${gov}~${App.t(m.area)}`, m.area, gov) : get(gov);
		c.spots.push({ title: App.t(m.title), at, date: m.date, note: App.t(m.where) || App.t(m.place) });
	}
	for (const x of extra) {
		const at = where(x);
		if (!at) continue;
		get(x.gov && GOV[x.gov] ? x.gov : govOf(at)).spots.push({ ...x, at, live: true });
	}
	for (const t of trips) if (t.gov && GOV[t.gov]) get(t.gov).trips.push(t.year);
	return [...map.values()].map((c) => ({ ...c, label: c.name }))
		.sort((a, b) => b.spots.length - a.spots.length || a.label.localeCompare(b.label));
}

export default {
	title: { ar: 'خرايط مدننا', en: 'Our city maps' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('خرايط مدننا', 'Our city maps'), L('كل مدينة رحناها، والأماكن اللي مشينا فيها منورة على خريطتها', 'Every city we’ve been to, with the spots we walked lit up on its map'), [{ href: 'places.html', ar: 'أماكننا', en: 'Our places' }, { href: 'cities.html', ar: 'خرايط مدننا', en: 'Our city maps' }], [['pin', 'هنا', 'Here'], ['moon', 'بالليل', 'By night'], ['walk', 'مشينا', 'We walked'], ['star', 'منورة', 'Lit up']])}
		<section class="sec sec--top"><div class="wrap">
			<div class="cm" id="cm" style="direction:ltr">
				<div class="cm__map" aria-hidden="true"></div>
				<div class="cm__pins"></div>
				<div class="cm__title"><b id="cm-name"></b><i id="cm-ar" dir="rtl"></i><small id="cm-sub"></small></div>
				<p class="cm__empty" id="cm-empty" hidden>${Y('لسه مفيش أماكن منورة هنا — ضيف اللي رحناه', 'لسه مفيش أماكن منورة هنا — ضيفي اللي رحناه', 'No spots lit up here yet — add the ones we went to')}</p>
				<div class="cm__tip" id="cm-tip" hidden></div>
				<p class="cm__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a></p>
			</div>
			<ol class="cm-spots" id="cm-spots"></ol>
			<h2 class="sec__title">${L('مدننا', 'Our cities')}</h2>
			<div class="cm-grid" id="cm-grid"><p class="empty">${L('بنجيب الخرايط…', 'Fetching the maps…')}</p></div>

			${ok ? '' : `<div class="narrow" style="margin:28px auto 0">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:28px auto 0"${ok ? '' : ' hidden'}>
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
		</div></section>
		${related(['places', 'trips', 'distances'])}`;
	},

	async after(main, s) {
		const box = $('#cm', main), mapEl = $('.cm__map', box), pinsEl = $('.cm__pins', box), tip = $('#cm-tip', main), grid = $('#cm-grid', main);
		let trips = [], spots = { items: [] }, list = [], cur = '';

		const show = (id) => {
			const c = list.find((x) => x.id === id) || list[0];
			if (!c) return;
			cur = c.id;
			const pts = c.spots.map((p) => p.at);
			const cap = centreOf(c);
			// the poster's name sits at its foot, so the spots are fitted in the space above it
			const narrow = mapEl.clientWidth < 600;
			const view = fit(mapEl, [...pts, cap].filter(Boolean), { pad: narrow ? 70 : 120, padTop: narrow ? 20 : 40, zoom: pts.length ? 15 : 13, maxZ: 16, minZ: 13, center: cap, poster: true });
			pinsEl.innerHTML = c.spots.map((p, i) => { const xy = view.at(p.at); return `<button class="cm__pin" type="button" data-i="${i}" style="left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px;--d:${(i % 7) * 0.4}s" aria-label="${esc(p.title)}"></button>`; }).join('');
			$('#cm-name', main).textContent = c.en;
			$('#cm-ar', main).textContent = c.ar;
			$('#cm-sub', main).textContent = [[c.gov, 'Egypt'].filter(Boolean).join(', '), cap ? coords(cap) : '', c.trips.length ? L(`رحلة ${c.trips.map((y) => num(y).replace(/[٬,]/g, '')).join(' و')}`, `Trip ${c.trips.join(' & ')}`) : ''].filter(Boolean).join(' · ');
			$('#cm-empty', main).hidden = !!c.spots.length;
			tip.hidden = true;
			const mineOk = live.canWrite();
			$('#cm-spots', main).innerHTML = c.spots.map((p, i) => `<li><button type="button" data-i="${i}"><b dir="auto">${esc(p.title)}</b>${p.date || p.note ? `<small dir="auto">${esc([p.date ? fmtDate(p.date) : '', p.note || ''].filter(Boolean).join(' · '))}</small>` : ''}</button>${p.live && mineOk && p.by === live.me() ? `<button class="link link--danger" type="button" data-del="${esc(p.id)}">${L('مسح', 'Delete')}</button>` : ''}</li>`).join('');
			for (const b of $$('.cm-card', grid)) b.classList.toggle('is-on', b.dataset.c === c.id);
			const f = $('#cm-form', main);
			if (f && !f.title.value) f.gov.value = c.id.split('~')[0];
		};

		const tipFor = (i) => {
			const c = list.find((x) => x.id === cur);
			const p = c?.spots[i];
			const pin = $(`.cm__pin[data-i="${i}"]`, pinsEl);
			if (!p || !pin) return;
			for (const x of $$('.cm__pin', pinsEl)) x.classList.toggle('is-on', x === pin);
			tip.innerHTML = `<b dir="auto">${esc(p.title)}</b>${p.date ? `<small>${esc(fmtDate(p.date))}</small>` : ''}${p.note ? `<span dir="auto">${esc(p.note)}</span>` : ''}`;
			tip.style.left = pin.style.left;
			tip.style.top = pin.style.top;
			tip.hidden = false;
		};
		pinsEl.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) tipFor(+b.dataset.i); };
		pinsEl.onpointerover = (e) => { const b = e.target.closest('[data-i]'); if (b && e.pointerType === 'mouse') tipFor(+b.dataset.i); };
		mapEl.parentElement.addEventListener('click', (e) => { if (!e.target.closest('.cm__pin, .cm__tip, a')) { tip.hidden = true; $$('.cm__pin', pinsEl).forEach((x) => x.classList.remove('is-on')); } });

		$('#cm-spots', main).onclick = async (e) => {
			const del = e.target.closest('[data-del]');
			if (del) {
				if (!confirm(Y('تطفي المكان ده؟', 'تطفي المكان ده؟', 'Remove this spot?'))) return;
				try { spots = await live.save('spots', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); build(cur); } catch (err) { alert(live.why(err)); }
				return;
			}
			const b = e.target.closest('[data-i]');
			if (b) { tipFor(+b.dataset.i); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
		};

		grid.onclick = (e) => {
			const b = e.target.closest('[data-c]');
			if (!b) return;
			show(b.dataset.c);
			history.replaceState(history.state, '', `#${b.dataset.c}`);
			box.scrollIntoView({ behavior: 'smooth', block: 'start' });
		};

		function build(want) {
			list = cities(s, trips, spots.items || []);
			// each city a framed street-map poster on the wall, in one of three styles in turn: white streets on black to the
			// edges, the city in a circle on a white poster, or cream streets in a circle on charcoal — the English name big,
			// the Arabic under it, then the governorate, Egypt and where it is
			const STYLES = ['noir', 'circle', 'cream'];
			grid.innerHTML = list.length ? list.map((c, k) => {
				const cap = centreOf(c);
				return `<button class="cm-card cm-card--${STYLES[k % 3]}" type="button" data-c="${esc(c.id)}" style="--k:${k}">
					<span class="cm-poster" aria-hidden="true">
						<span class="cm-card__map" style="direction:ltr"><span class="cm-card__tiles"></span><span class="cm-card__dots"></span></span>
						<span class="cm-poster__en">${esc(c.en)}</span>
						<span class="cm-poster__ar" dir="rtl">${esc(c.ar)}</span>
						<span class="cm-poster__sub">${esc([c.gov, 'Egypt'].filter(Boolean).join(' · '))}</span>
						${cap ? `<span class="cm-poster__xy">${esc(coords(cap))}</span>` : ''}
					</span>
					<b class="sr-only">${esc(c.label)}</b>
					<small>${c.spots.length ? L(`${num(c.spots.length)} ${c.spots.length === 1 ? 'مكان' : c.spots.length <= 10 ? 'أماكن' : 'مكان'} منورة`, `${c.spots.length} spot${c.spots.length === 1 ? '' : 's'} lit up`) : L('مستنية أماكنها', 'waiting for its spots')}${c.trips.length ? ` · ${doodle('suitcase', 14)}` : ''}</small>
				</button>`;
			}).join('') : `<p class="empty">${Y('لسه مفيش مدن… ضيف أول مكان رحناه ♥', 'لسه مفيش مدن… ضيفي أول مكان رحناه ♥', 'No cities yet… add the first spot we went to ♥')}</p>`;
			// each poster gets its city's streets: wide enough to show the town, with our spots in gold
			for (const card of $$('.cm-card', grid)) {
				const c = list.find((x) => x.id === card.dataset.c);
				const tiles = $('.cm-card__tiles', card);
				const mid = centreOf(c);
				const v = fit(tiles, [...c.spots.map((p) => p.at), mid].filter(Boolean), { pad: 30, zoom: 12, maxZ: 13, minZ: 11, center: mid || undefined, poster: true, detail: 2 });
				$('.cm-card__dots', card).innerHTML = c.spots.map((p) => { const xy = v.at(p.at); return `<i style="left:${xy.x.toFixed(1)}px;top:${xy.y.toFixed(1)}px"></i>`; }).join('');
			}
			const fromHash = decodeURIComponent(location.hash.slice(1));
			show(want || (list.some((c) => c.id === fromHash) ? fromHash : list[0]?.id));
		}

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
					spots = await live.save('spots', (d) => { (d.items = d.items || []).push(x); });
					form.reset();
					msg.textContent = L('اتنوّر ✦', 'Lit up ✦');
					build(x.gov);
					box.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} catch (err) { msg.textContent = live.why(err); }
			};
		}

		[trips, spots] = await Promise.all([loadTrips(s).catch(() => []), live.load('spots').catch(() => ({ items: [] }))]);
		build();
		let w = box.clientWidth;
		new ResizeObserver(() => { if (box.isConnected && Math.abs(box.clientWidth - w) > 30) { w = box.clientWidth; show(cur); } }).observe(box);
	}
};
