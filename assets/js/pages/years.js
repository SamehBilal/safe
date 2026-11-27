import { L, T, esc, img, num, fmtDate, pageHead, related, App, $, $$, hydrate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { loadTrips } from './trips.js';
import { citiesOf } from './atlas.js';

/* Year by year: our story one year at a time, like a year in review — how many moments, places, firsts, trips and
   photos, the city we went to most, the photo of the year and a strip of the rest, and the year's moments in order.
   Everything comes from what's already in the story and the shared lists, so a new moment or place shows up here too. */

const yearOf = (d) => { const m = /^(\d{4})/.exec(String(d ?? '')); return m ? +m[1] : null; };
const plural = (n, one, few, many) => (n === 1 ? one : n <= 10 ? few : many);

export default {
	title: { ar: 'سنة بسنة', en: 'Year by year' },
	render() {
		return `${pageHead(L('سنة بسنة', 'Year by year'), L('حكايتنا سنة ورا سنة: أرقامها وأماكنها وصورها', 'Our story one year at a time: its numbers, places and photos'), [{ href: 'years.html', ar: 'سنة بسنة', en: 'Year by year' }])}
		<section class="sec"><div class="wrap">
			<div class="yr-rail" id="yr-rail" role="tablist" aria-label="${L('السنين', 'The years')}"></div>
			<div class="yr" id="yr"><p class="empty">${L('بنجمّع السنين…', 'Gathering the years…')}</p></div>
		</div></section>
		${related(['story', 'atlas', 'chapters'])}`;
	},

	async after(main, s) {
		const [trips, spots, ourfirsts, firsts] = await Promise.all([
			loadTrips(s).catch(() => []), live.load('spots').catch(() => ({ items: [] })),
			live.load('ourfirsts').catch(() => ({ items: [] })), live.load('firsts').catch(() => ({ items: [] }))
		]);
		const cities = citiesOf(s, trips, spots.items || []);
		const metYear = yearOf(s.met);

		// everything with a date, by year
		const by = new Map();
		const at = (y) => { if (!by.has(y)) by.set(y, { moments: [], places: [], firsts: [], trips: [], journeys: [], photos: [] }); return by.get(y); };
		for (const m of s.timeline || []) { const y = yearOf(m.date); if (y) at(y).moments.push(m); }
		for (const c of cities) for (const p of c.places) { const y = yearOf(p.date); if (y) { at(y).places.push({ ...p, city: c }); at(y).photos.push(...p.photos); } }
		for (const t of s.trips || []) { const y = t.year || yearOf(t.date); if (y) { at(y).trips.push(t); at(y).photos.unshift(...(t.photos || []).map((x) => (typeof x === 'string' ? x : x.photo)).filter(Boolean)); } }
		for (const j of s.journeys || []) { const y = yearOf(j.date); if (y) at(y).journeys.push(j); }
		for (const f of [...(ourfirsts.items || []), ...(firsts.items || [])]) { const y = yearOf(f.date); if (y) at(y).firsts.push(f); }
		const years = [...by.keys()].filter((y) => !metYear || y >= metYear).sort((a, b) => a - b);
		if (!years.length) { $('#yr', main).innerHTML = `<p class="empty">${L('لسه مفيش سنين', 'No years yet')}</p>`; return; }

		const rail = $('#yr-rail', main);
		rail.innerHTML = years.map((y) => `<button class="yr-chip" type="button" role="tab" data-y="${y}">${num(y).replace(/[٬,]/g, '')}</button>`).join('');

		const show = (y) => {
			const d = by.get(y);
			const k = years.indexOf(y);
			// the city we went to most that year
			const count = new Map();
			for (const p of d.places) count.set(p.city, (count.get(p.city) || 0) + 1);
			const top = [...count].sort((a, b) => b[1] - a[1])[0];
			const photos = [...new Set(d.photos)];
			const tiles = [
				[d.moments.length, L(plural(d.moments.length, 'لحظة', 'لحظات', 'لحظة'), 'moments'), 'star'],
				[d.places.length, L(plural(d.places.length, 'مكان', 'أماكن', 'مكان'), 'places'), 'pin'],
				[d.firsts.length, L('أول مرة', 'firsts'), 'heart'],
				[d.trips.length + d.journeys.length, L(plural(d.trips.length + d.journeys.length, 'رحلة', 'رحلات', 'رحلة'), 'trips'), 'suitcase'],
				[photos.length, L('صورة', 'photos'), 'camera']
			];
			$('#yr', main).innerHTML = `<article class="yr-card" style="--k:${k % 5}">
				<header class="yr-head">
					<button class="yr-arrow" type="button" data-go="${years[k - 1] ?? ''}" ${k ? '' : 'disabled'} aria-label="${L('السنة اللي قبلها', 'Previous year')}">${L('→', '←')}</button>
					<div class="yr-title"><b>${num(y).replace(/[٬,]/g, '')}</b>${metYear ? `<small>${L(`سنتنا رقم ${num(y - metYear + 1)}`, `Our year no. ${y - metYear + 1}`)}</small>` : ''}</div>
					<button class="yr-arrow" type="button" data-go="${years[k + 1] ?? ''}" ${k < years.length - 1 ? '' : 'disabled'} aria-label="${L('السنة اللي بعدها', 'Next year')}">${L('←', '→')}</button>
				</header>
				<ul class="yr-tiles">${tiles.map(([n, t, ic], i) => `<li style="--i:${i}" class="${n ? '' : 'is-zero'}">${doodle(ic, 22)}<b>${num(n)}</b><span>${t}</span></li>`).join('')}</ul>
				<div class="yr-body">
					${photos.length ? `<figure class="yr-hero"><span data-media-box>${img(photos[0], '', 'zoom')}</span><figcaption>${L('صورة السنة', 'Photo of the year')}</figcaption></figure>` : `<div class="yr-hero yr-hero--none">${doodle('camera', 40)}<span>${L('مفيش صور السنة دي لسه', 'No photos this year yet')}</span></div>`}
					<div class="yr-side">
						${top ? `<p class="yr-top">${doodle('pin', 18)} ${L('أكتر مدينة رحناها', 'The city we went to most')}: <b>${esc(L(top[0].ar, top[0].en))}</b> <small>(${num(top[1])})</small></p>` : ''}
						${d.firsts.length ? `<p class="yr-k">${L('أول مرة', 'Firsts')}</p><ul class="yr-firsts">${d.firsts.slice(0, 8).map((f) => `<li dir="auto">${esc(App.t(f.what) || '')}</li>`).join('')}</ul>` : ''}
						${d.moments.length ? `<p class="yr-k">${L('لحظات السنة', 'The year’s moments')}</p><ol class="yr-moments">${d.moments.sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 10).map((m) => `<li><a href="moment.html?id=${encodeURIComponent(m.id)}"><small>${esc(fmtDate(m.date))}</small><b dir="auto">${esc(T(m.title))}</b></a></li>`).join('')}</ol>` : ''}
					</div>
				</div>
				${photos.length > 1 ? `<div class="yr-strip">${photos.slice(1, 9).map((p, i) => `<span style="--i:${i}" data-media-box>${img(p, '', 'zoom')}</span>`).join('')}</div>` : ''}
			</article>`;
			hydrate($('#yr', main));
			$$('.yr-chip', rail).forEach((b) => { const on = +b.dataset.y === y; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); if (on) b.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }); });
			history.replaceState(history.state, '', `#${y}`);
		};
		rail.addEventListener('click', (e) => { const b = e.target.closest('[data-y]'); if (b) show(+b.dataset.y); });
		$('#yr', main).addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b && b.dataset.go) show(+b.dataset.go); });
		const want = +location.hash.slice(1);
		const thisYear = new Date().getFullYear();
		// opens on the latest year that has photos (a year just begun is often still empty)
		const full = [...years].reverse().find((y) => y <= thisYear && by.get(y).photos.length);
		show(years.includes(want) ? want : full || [...years].reverse().find((y) => y <= thisYear) || years.at(-1));
	}
};
