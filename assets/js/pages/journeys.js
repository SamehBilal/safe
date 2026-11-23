import { L, T, esc, img, num, pageHead, related, App, longDate, yearsAgo } from '../shell.js';
import { doodle } from '../doodles.js';

/* «رحلاتنا»: every trip we've taken, each with a page of its own (journey.html?id=…) that tells it stop by stop on a map.
   The top: the trips as postage stamps stuck on the page, beside how many trips, how many stops and the years. Below,
   a card for each trip: its photos as a strip, its stamp, its name and date, the line about it, and its stops. */
const year = (d) => (App.lang === 'ar' ? num(+String(d).slice(0, 4)).replace(/[٬,]/g, '') : String(d).slice(0, 4));

export default {
	title: { ar: 'رحلاتنا', en: 'Our trips' },
	render(s) {
		const js = (s.journeys || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
		const place = (st) => (st.place ? (s.places || []).find((p) => p.id === st.place) : null);
		const name = (st) => { const p = place(st); return st.title ? T(st.title) : p ? T(p.title) : T(st.head); };
		const stopsN = js.reduce((a, j) => a + j.stops.filter((st) => st.place !== 'our-home').length, 0);
		const years = js.map((j) => String(j.date).slice(0, 4)).sort();
		const stamp = (j, i, cls = '') => `<a class="jr-stamp${cls}" href="journey.html?id=${esc(j.id)}" style="--jc:${esc(j.color || '#c2185b')};--r:${[-6, 4, -3, 5, -4][i % 5]}deg">
			<span class="jr-stamp__in"><span class="jr-stamp__ic">${doodle(j.icon || 'heart', 34)}</span><b>${esc(T(j.title))}</b><small>${year(j.date)}</small></span>
			<i class="jr-stamp__post" aria-hidden="true">${L('بريد مصر', 'EGYPT POST')}</i></a>`;
		return `<section class="sec sec--top"><div class="wrap"><div class="ji">
			<div class="ji__stamps">${js.map((j, i) => stamp(j, i)).join('') || `<p class="empty">${L('لسه مفيش رحلات', 'No trips yet')}</p>`}</div>
			<div class="gh-body">
				<p class="gh-k">${doodle('suitcase', 16)} ${L('رحلاتنا', 'Our trips')}${years.length ? ` · ${year(years[0])}–${year(years.at(-1))}` : ''}</p>
				<p class="gh-count"><b>${num(js.length)}</b> <span>${L(js.length === 1 ? 'رحلة سوا' : 'رحلات سوا', js.length === 1 ? 'trip together' : 'trips together')}</span></p>
				<p class="gh-sub">${L(`${num(stopsN)} محطة على الطريق، كل رحلة على خريطتها`, `${stopsN} stops on the road, each trip on its own map`)}</p>
				${js[0] ? `<div class="gh-btns"><a class="btn btn--sm" href="journey.html?id=${esc(js[0].id)}">${doodle('pin', 18)} ${L('آخر رحلة', 'The latest trip')}</a></div>` : ''}
			</div>
		</div></div></section>
		${pageHead(L('رحلاتنا', 'Our trips'), L('كل رحلة طريق على الخريطة: محطة ورا محطة، بالصور', 'Every trip a road on the map: stop after stop, with the photos'), [{ href: 'journeys.html', ar: 'رحلاتنا', en: 'Our trips' }], { band: '' })}
		<section class="sec"><div class="wrap"><div class="ji-grid">${js.map((j, i) => {
			const photos = [...new Set(j.stops.flatMap((st) => st.photos || []))];
			const strip = photos.length <= 3 ? photos : [photos[0], photos[Math.floor(photos.length / 2)], photos.at(-1)];
			return `<a class="ji-card reveal" href="journey.html?id=${esc(j.id)}" style="--jc:${esc(j.color || '#c2185b')};--delay:${(i % 2) * 0.08}s">
				<span class="ji-card__strip">${strip.length ? strip.map((p) => `<span data-media-box>${img(p, '')}</span>`).join('') : `<span class="ji-card__none">${doodle(j.icon || 'heart', 50)}</span>`}</span>
				<span class="ji-card__body">
					<span class="ji-card__ic">${doodle(j.icon || 'heart', 26)}</span>
					<time>${esc(longDate(j.date))} · ${yearsAgo(j.date)}</time>
					<b>${esc(T(j.title))}</b>
					${j.sub ? `<span class="ji-card__sub">${esc(T(j.sub))}</span>` : ''}
					<span class="ji-card__stops">${j.stops.filter((st) => st.place !== 'our-home').map((st) => `<i dir="auto">${esc(name(st))}</i>`).join('')}</span>
					<span class="ji-card__go">${L(`${num(j.stops.length)} محطة على الخريطة`, `${j.stops.length} stops on the map`)} ${App.arrow}</span>
				</span>
			</a>`;
		}).join('')}</div></div></section>
		${related(['places', 'cities', 'anniversaries'])}`;
	},
	// an old link to a trip on this page (journeys.html#j-…) opens the trip's own page
	after() {
		const m = /^#j-([w-]+)$/.exec(location.hash);
		if (m) location.replace(`journey.html?id=${encodeURIComponent(m[1])}`);
	}
};
