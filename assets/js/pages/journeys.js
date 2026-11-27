import { L, T, esc, img, num, pageHead, related, App, $, $$, hydrate, longDate, yearsAgo } from '../shell.js';
import { doodle } from '../doodles.js';
import { fit, where } from '../tilemap.js';
import nexttrip from './nexttrip.js';

/* «رحلاتنا»: every trip we've taken, each with a page of its own (journey.html?id=…) that tells it stop by stop on a map.
   The top, in the same hand as a trip's page: one taped map with every trip's road drawn on it in its own colour, one
   after another, beside the count, the years and a key of the trips — point at one and its road lights up on the map.
   Below, each trip as a page of the travel journal: its photos as polaroids under its stamp on one side, and on the
   other its date, its name, the line about it and its stops along a road, sides taking turns down the page. */
const year = (d) => (App.lang === 'ar' ? num(+String(d).slice(0, 4)).replace(/[٬,]/g, '') : String(d).slice(0, 4));
const col = (j) => esc(j.color || '#c2185b');

export default {
	title: { ar: 'رحلاتنا', en: 'Our trips' },
	render(s) {
		const js = (s.journeys || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
		this.js = js;
		const place = (st) => (st.place ? (s.places || []).find((p) => p.id === st.place) : null);
		const name = (st) => { const p = place(st); return st.title ? T(st.title) : p ? T(p.title) : T(st.head); };
		const out = (j) => j.stops.filter((st) => st.place !== 'our-home');
		const stopsN = js.reduce((a, j) => a + out(j).length, 0);
		const photosN = new Set(js.flatMap((j) => j.stops.flatMap((st) => st.photos || []))).size;
		const years = js.map((j) => String(j.date).slice(0, 4)).sort();
		const stamp = (j, cls = '', size = 30) => `<span class="jr-stamp${cls}" style="--jc:${col(j)};--r:-5deg"><span class="jr-stamp__in"><span class="jr-stamp__ic">${doodle(j.icon || 'heart', size)}</span><b>${esc(T(j.title))}</b><small>${year(j.date)}</small></span><i class="jr-stamp__post" aria-hidden="true">${L('بريد مصر', 'EGYPT POST')}</i></span>`;

		return `<section class="sec sec--top"><div class="wrap"><div class="jx">
			<div class="jx__mapcol"><div class="jx__frame" style="direction:ltr">
				<span class="jr__tape" aria-hidden="true"></span>
				<div class="jx__world"><div class="jr__tiles jx__tiles" aria-hidden="true"></div><svg class="jx__svg" aria-hidden="true"></svg><div class="jx__pins"></div></div>
				<span class="jx__compass" aria-hidden="true">${doodle('plane', 30)}</span>
			</div></div>
			<div class="jx__body">
				<p class="gh-k">${doodle('suitcase', 16)} ${L('دفتر رحلاتنا', 'Our travel journal')}${years.length ? ` · ${year(years[0])}–${year(years.at(-1))}` : ''}</p>
				<h1 class="jx__t">${L('رحلاتنا', 'Our trips')}</h1>
				<ul class="jx__facts">
					<li><b>${num(js.length)}</b>${L(js.length === 1 ? 'رحلة' : 'رحلات', js.length === 1 ? 'trip' : 'trips')}</li>
					<li><b>${num(stopsN)}</b>${L('محطة', 'stops')}</li>
					<li><b>${num(photosN)}</b>${L('صورة', 'photos')}</li>
				</ul>
				<ol class="jx__key">${js.map((j, i) => `<li style="--jc:${col(j)};--n:${i}"><a href="journey.html?id=${esc(j.id)}" data-trip="${esc(j.id)}">
					<span class="jx__key-ic">${doodle(j.icon || 'heart', 18)}</span>
					<b>${esc(T(j.title))}</b><small>${year(j.date)} · ${L(`${num(out(j).length)} محطة`, `${out(j).length} stops`)}</small>
					<i class="jx__key-road" aria-hidden="true"></i></a></li>`).join('') || `<li class="empty">${L('لسه مفيش رحلات', 'No trips yet')}</li>`}</ol>
			</div>
		</div></div></section>
		${pageHead(L('رحلاتنا', 'Our trips'), L('كل رحلة طريق على الخريطة: محطة ورا محطة، بالصور', 'Every trip a road on the map: stop after stop, with the photos'), [{ href: 'journeys.html', ar: 'رحلاتنا', en: 'Our trips' }], { band: '' })}
		<div class="wrap"><div class="at-tabs jx-tabs" role="tablist" aria-label="${L('رحلاتنا', 'Our trips')}">
			<button class="at-tab is-on" type="button" role="tab" aria-selected="true" aria-controls="jx-pane-trips" data-tab="trips">${doodle('suitcase', 18)} ${L('رحلاتنا', 'Our trips')}</button>
			<button class="at-tab" type="button" role="tab" aria-selected="false" aria-controls="jx-pane-next" data-tab="next">${doodle('plane', 18)} ${L('رحلتنا الجاية', 'Our next trip')}</button>
		</div></div>
		<div class="jx-pane" id="jx-pane-trips" role="tabpanel">
		<section class="sec"><div class="wrap"><div class="jx-list">${js.map((j, i) => {
			const photos = [...new Set(j.stops.flatMap((st) => st.photos || []))];
			const pick = photos.length <= 3 ? photos : [photos[0], photos[Math.floor(photos.length / 2)], photos.at(-1)];
			return `<article class="jx-trip reveal" id="t-${esc(j.id)}" style="--jc:${col(j)}">
				<a class="jx-trip__media" href="journey.html?id=${esc(j.id)}" tabindex="-1" aria-hidden="true">
					${pick.length ? pick.map((p, n) => `<figure class="jt__pol" data-media-box style="--n:${n}">${img(p, '')}</figure>`).join('') : `<span class="jx-trip__none">${doodle(j.icon || 'heart', 60)}</span>`}
					${stamp(j, ' jt__stamp')}
				</a>
				<div class="jx-trip__body">
					<p class="gh-k">${doodle(j.icon || 'heart', 16)} ${esc(longDate(j.date))} · ${yearsAgo(j.date)}</p>
					<h2 class="jx-trip__t"><a href="journey.html?id=${esc(j.id)}">${esc(T(j.title))}</a></h2>
					${j.sub ? `<p class="jt__sub">${esc(T(j.sub))}</p>` : ''}
					<ol class="jx-route">${j.stops.map((st, k) => `<li style="--k:${k}">${st.place === 'our-home' ? `<span class="jx-route__n is-home">${doodle('house', 13)}</span>` : `<span class="jx-route__n">${num(k)}</span>`}<span class="jx-route__name" dir="auto">${esc(name(st))}</span></li>`).join('')}</ol>
					<div class="gh-btns">
						<a class="btn btn--sm" href="journey.html?id=${esc(j.id)}">${doodle('pin', 16)} ${L('امشي معانا الطريق', 'Take the road with us')}</a>
						<span class="jx-trip__n">${L(`${num(photos.length)} صورة`, `${photos.length} photos`)}</span>
					</div>
				</div>
			</article>`;
		}).join('')}</div></div></section>
		</div>
		<div class="jx-pane" id="jx-pane-next" role="tabpanel" hidden><div class="nt-in" id="nt">${nexttrip.section(s)}</div></div>
		${related(['atlas', 'anniversaries'])}`;
	},

	after(main, s) {
		// our next trip, its own shared list inside its tab
		const next = nexttrip.after(main, s, $('#nt', main));
		const tab = (name) => {
			$$('.jx-tabs .at-tab', main).forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
			$('#jx-pane-trips', main).hidden = name !== 'trips';
			$('#jx-pane-next', main).hidden = name !== 'next';
			if (name === 'next') { for (const el of $$('#jx-pane-next .reveal', main)) el.classList.add('is-in'); next.then((x) => x?.repaint()); }
			history.replaceState(history.state, '', name === 'next' ? '#next' : location.pathname + location.search);
		};
		$('.jx-tabs', main).addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });
		if (location.hash === '#next' || location.hash === '#add') tab('next');
		// an old link to a trip on this page (journeys.html#j-…) opens the trip's own page
		const m = /^#j-([\w-]+)$/.exec(location.hash);
		if (m) { location.replace(`journey.html?id=${encodeURIComponent(m[1])}`); return; }
		const js = this.js || [];
		const frame = $('.jx__frame', main);
		if (!frame || !js.length) return;
		const tiles = $('.jx__tiles', frame), svg = $('.jx__svg', frame), pins = $('.jx__pins', frame);
		const place = (st) => (st.place ? (s.places || []).find((p) => p.id === st.place) : null);
		const spots = js.map((j) => j.stops.map((st) => where(place(st) || st)));

		/* the map around every stop of every trip, and each trip's road drawn on it in turn (oldest first) */
		const layout = () => {
			const f = fit(tiles, spots.flat().filter(Boolean), { pad: 46, maxZ: 9 });
			svg.setAttribute('viewBox', `0 0 ${f.W} ${f.H}`);
			const seen = new Set();
			let pinHTML = '';
			const order = js.map((_, i) => i).reverse();
			svg.innerHTML = js.map((j, i) => {
				let d = '', prev = null;
				spots[i].forEach((sp, k) => {
					if (!sp) return;
					const p = f.at(sp);
					const key = `${Math.round(p.x / 6)},${Math.round(p.y / 6)}`;
					if (!seen.has(key)) {
						seen.add(key);
						const home = j.stops[k].place === 'our-home';
						pinHTML += `<span class="jx-pin${home ? ' is-home' : ''}" data-trip="${esc(j.id)}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px;--jc:${col(j)}">${home ? doodle('house', 14) : ''}</span>`;
					}
					if (!prev) { d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`; prev = p; return; }
					const dx = p.x - prev.x, dy = p.y - prev.y, len = Math.hypot(dx, dy);
					if (len < 1) return;
					const b = (k % 2 ? 1 : -1) * Math.min(0.22 * len, 60);
					d += `Q${((prev.x + p.x) / 2 - (dy / len) * b).toFixed(1)} ${((prev.y + p.y) / 2 + (dx / len) * b).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
					prev = p;
				});
				return d ? `<path class="jx-road" data-trip="${esc(j.id)}" d="${d}" pathLength="1" style="--jc:${col(j)};--n:${order.indexOf(i)}"/>` : '';
			}).join('');
			pins.innerHTML = pinHTML;
		};

		/* point at a trip in the key (or its pin): its road comes forward, the others fade */
		const lit = (id) => {
			frame.classList.toggle('is-picking', !!id);
			$$('[data-trip]', frame).forEach((el) => el.classList.toggle('is-lit', el.dataset.trip === id));
			$$('.jx__key a', main).forEach((a) => a.classList.toggle('is-lit', a.dataset.trip === id));
		};
		const key = $('.jx__key', main);
		key.addEventListener('pointerover', (e) => { const a = e.target.closest('[data-trip]'); if (a) lit(a.dataset.trip); });
		key.addEventListener('pointerleave', () => lit(''));
		key.addEventListener('focusin', (e) => { const a = e.target.closest('[data-trip]'); if (a) lit(a.dataset.trip); });
		key.addEventListener('focusout', () => lit(''));
		pins.addEventListener('pointerover', (e) => { const p = e.target.closest('[data-trip]'); lit(p ? p.dataset.trip : ''); });
		pins.addEventListener('pointerleave', () => lit(''));

		let rt = 0;
		const onResize = () => { clearTimeout(rt); rt = setTimeout(layout, 200); };
		addEventListener('resize', onResize);
		setTimeout(() => { layout(); hydrate(frame); frame.classList.add('is-drawn'); }, 0);
		this.leave = () => { removeEventListener('resize', onResize); clearTimeout(rt); };
	}
};
