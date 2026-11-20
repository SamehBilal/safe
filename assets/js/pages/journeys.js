import { L, Y, T, esc, img, num, pageHead, related, App, $, $$, REDUCE, hydrate, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import { fit, where } from '../tilemap.js';

/* «رحلاتنا»: each of our trips as a path on the map, after Codrops' «Storytelling Map» (tympanus.net/codrops, Lucas
   Bebber): the trip's stops are told one after another down the page, and beside them the map stays put while the road
   draws itself from stop to stop as you read — a little car at its tip, the map leaning in on where it is, and each
   stop's photos popping up on its pin as the road reaches it. Above the title, the trips are postage stamps on the page.
   The trips and their stops live in story.json «journeys»: each stop a place on the map (or a point of its own) with a
   few words and its photos. */

const year = (d) => (App.lang === 'ar' ? num(+String(d).slice(0, 4)).replace(/[٬,]/g, '') : String(d).slice(0, 4));
const CAR = `<svg viewBox="0 0 40 24" width="34" height="20" aria-hidden="true"><path d="M5 15c0-3 1-4 4-5l5-5c1-1 2-1 4-1h7c2 0 3 0 4 2l3 4c3 0 5 1 5 4v3c0 1-1 2-2 2H7c-1 0-2-1-2-2Z" fill="var(--jc)" stroke="#37353f" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 6h5v4h-8Zm8 0h4l3 4h-7Z" fill="#cfe9f7" stroke="#37353f" stroke-width="1.2"/><circle cx="12" cy="19" r="3.4" fill="#37353f"/><circle cx="31" cy="19" r="3.4" fill="#37353f"/><circle cx="12" cy="19" r="1.3" fill="#fff"/><circle cx="31" cy="19" r="1.3" fill="#fff"/></svg>`;

export default {
	title: { ar: 'رحلاتنا', en: 'Our trips' },
	render(s) {
		const js = (s.journeys || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
		this.js = js;
		const place = (st) => (st.place ? (s.places || []).find((p) => p.id === st.place) : null);
		const stamps = js.map((j, i) => `<a class="jr-stamp" href="#j-${esc(j.id)}" style="--jc:${esc(j.color || '#c2185b')};--r:${[-6, 4, -3, 5, -4][i % 5]}deg">
			<span class="jr-stamp__in"><span class="jr-stamp__ic">${doodle(j.icon || 'heart', 34)}</span><b>${esc(T(j.title))}</b><small>${year(j.date)}</small></span>
			<i class="jr-stamp__post" aria-hidden="true">${L('بريد مصر', 'EGYPT POST')}</i></a>`).join('');
		const stop = (j, st, i) => {
			const p = place(st);
			const name = st.title ? T(st.title) : p ? T(p.title) : '';
			const ph = st.photos || [];
			return `<li class="jr-stop" data-i="${i}">
				<span class="jr-stop__n" aria-hidden="true">${st.place === 'our-home' ? '⌂' : num(i)}</span>
				<h3><span class="jr-stop__up">${esc(name)}</span><span class="jr-stop__down">${esc(T(st.head))}</span></h3>
				${st.text ? `<p dir="auto">${esc(T(st.text))}</p>` : ''}
				${ph.length ? `<div class="jr-stop__pics">${ph.slice(0, 6).map((x, k) => `<span class="jr-pol" style="--r:${[-4, 3, -2, 5, -3, 2][k]}deg">${img(x, name)}</span>`).join('')}
					${ph.length > 6 && j.moment ? `<a class="jr-more" href="moment.html?id=${encodeURIComponent(j.moment)}">+${num(ph.length - 6)} ${L('صورة', 'photos')}</a>` : ''}</div>` : ''}
			</li>`;
		};
		return `
		${pageHead(L('رحلاتنا', 'Our trips'), L('كل رحلة طريق على الخريطة: محطة ورا محطة، بالصور', 'Every trip a road on the map: stop after stop, with the photos'), [{ href: 'journeys.html', ar: 'رحلاتنا', en: 'Our trips' }], {
			band: `<div class="jr-band">${stamps || `<p class="empty">${L('لسه مفيش رحلات', 'No trips yet')}</p>`}</div>`
		})}
		${js.map((j) => `<section class="sec jr" id="j-${esc(j.id)}" style="--jc:${esc(j.color || '#c2185b')}"><div class="wrap">
			<header class="jr__head reveal">
				<p class="jr__kick">${doodle(j.icon || 'heart', 22)} ${esc(longDate(j.date))}</p>
				<h2 class="sec__title">${esc(T(j.title))}</h2>
				${j.sub ? `<p class="sec__sub">${esc(T(j.sub))}</p>` : ''}
				${j.moment ? `<a class="jr__open" href="moment.html?id=${encodeURIComponent(j.moment)}">${Y('افتح الحكاية كلها', 'افتحي الحكاية كلها', 'Open the whole story')} ${App.arrow}</a>` : ''}
			</header>
			<div class="jr__story">
				<div class="jr__mapcol"><div class="jr__frame" style="direction:ltr">
					<span class="jr__tape" aria-hidden="true"></span>
					<div class="jr__world"><div class="jr__tiles" aria-hidden="true"></div><svg class="jr__svg" aria-hidden="true"><path class="jr__road-bg"/><path class="jr__road"/></svg><div class="jr__pins"></div><span class="jr__car">${CAR}</span></div>
				</div></div>
				<ol class="jr__stops">${j.stops.map((st, i) => stop(j, st, i)).join('')}</ol>
			</div>
		</div></section>`).join('')}
		${related(['places', 'cities', 'trips'])}`;
	},

	after(main, s) {
		const js = this.js || [];
		const place = (st) => (st.place ? (s.places || []).find((p) => p.id === st.place) : null);
		const runs = [];

		for (const j of js) {
			const sec = $(`#j-${CSS.escape(j.id)}`, main);
			if (!sec) continue;
			const frame = $('.jr__frame', sec), world = $('.jr__world', sec), tiles = $('.jr__tiles', sec), svg = $('.jr__svg', sec);
			const road = $('.jr__road', sec), bg = $('.jr__road-bg', sec), car = $('.jr__car', sec), pins = $('.jr__pins', sec);
			const stops = $$('.jr-stop', sec);
			const spots = j.stops.map((st) => where(place(st) || st));
			const run = { sec, frame, world, road, car, stops, cum: [0], total: 0, pts: [], pinEls: [], scale: 1, tx: 0, ty: 0, W: 0, H: 0 };

			/* lay the map and draw the road through every stop: each leg bends a little, alternately, like a real road */
			run.layout = () => {
				const f = fit(tiles, spots.filter(Boolean), { pad: 70, maxZ: 15 });
				run.W = f.W; run.H = f.H;
				svg.setAttribute('viewBox', `0 0 ${f.W} ${f.H}`);
				run.pts = spots.map((p) => (p ? f.at(p) : null));
				let d = '', prev = null;
				const legs = [];
				run.pts.forEach((p, i) => {
					if (!p) return;
					if (!prev) { d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`; prev = p; legs.push(''); return; }
					const dx = p.x - prev.x, dy = p.y - prev.y, len = Math.hypot(dx, dy);
					const leg = len < 1 ? `L${p.x.toFixed(1)} ${p.y.toFixed(1)}` : (() => { const b = (i % 2 ? 1 : -1) * Math.min(0.22 * len, 90); const cx = (prev.x + p.x) / 2 - (dy / len) * b, cy = (prev.y + p.y) / 2 + (dx / len) * b; return `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; })();
					legs.push(`M${prev.x.toFixed(1)} ${prev.y.toFixed(1)}${leg}`);
					d += leg;
					prev = p;
				});
				road.setAttribute('d', d);
				bg.setAttribute('d', d);
				// how far along the road each stop is
				const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				svg.append(probe);
				run.cum = [0];
				for (let i = 1; i < legs.length; i++) { probe.setAttribute('d', legs[i]); run.cum.push(run.cum[i - 1] + (probe.getTotalLength() || 0)); }
				probe.remove();
				run.total = road.getTotalLength() || 1;
				road.style.strokeDasharray = `${run.total} ${run.total}`;
				// a pin for each stop: its first photo in a little round frame, or its number
				const seen = new Map();
				pins.innerHTML = j.stops.map((st, i) => {
					const p = run.pts[i];
					if (!p) return '';
					// a stop on the same spot as an earlier one (home at the end, the lake the next morning) shares its pin
					const key = `${Math.round(p.x)},${Math.round(p.y)}`;
					if (seen.has(key)) return '';
					seen.set(key, i);
					const ph = (st.photos || [])[0];
					return `<span class="jr-pin${ph ? ' has-pic' : ''}${st.place === 'our-home' ? ' is-home' : ''}" data-i="${i}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px">${ph ? img(ph, '') : `<b>${st.place === 'our-home' ? '⌂' : num(i)}</b>`}</span>`;
				}).join('');
				run.pinEls = $$('.jr-pin', pins);
				hydrate(pins);
				run.update();
			};

			/* as the page is read: how far the road has come, where the car is, which pins are lit, where the map leans */
			run.update = () => {
				if (!run.total) return;
				const vh = innerHeight, line = vh * 0.55;
				const tops = stops.map((el) => el.getBoundingClientRect().top);
				let i = -1;
				tops.forEach((t, k) => { if (t <= line) i = k; });
				let len = 0, t = 0;
				if (i >= 0) {
					const a = run.cum[i] ?? run.total, b = run.cum[i + 1] ?? a;
					const next = tops[i + 1] ?? (stops[i].getBoundingClientRect().bottom);
					t = Math.max(0, Math.min(1, (line - tops[i]) / Math.max(next - tops[i], 1)));
					len = a + (b - a) * t;
				}
				road.style.strokeDashoffset = String(run.total - len);
				const p = road.getPointAtLength(Math.max(0.01, len)), q = road.getPointAtLength(Math.min(run.total, len + 2));
				const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
				const flip = Math.abs(ang) > 90;
				run.car.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -115%) rotate(${flip ? ang + 180 : ang}deg)${flip ? ' scaleX(-1)' : ''}`;
				run.car.classList.toggle('is-on', i >= 0);
				for (const el of run.pinEls) el.classList.toggle('is-on', +el.dataset.i <= i);
				stops.forEach((el, k) => el.classList.toggle('is-on', k === i));
				// lean in on the car while on the road, the whole trip in view before it starts and once it's done
				const doneAll = i === stops.length - 1 && t > 0.6;
				const s2 = i < 0 || doneAll ? 1 : 1.55;
				let tx = run.W / 2 - p.x * s2, ty = run.H / 2 - p.y * s2;
				tx = Math.min(0, Math.max(run.W - run.W * s2, tx)); ty = Math.min(0, Math.max(run.H - run.H * s2, ty));
				if (s2 === 1) { tx = 0; ty = 0; }
				run.world.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s2})`;
			};
			runs.push(run);
		}

		let raf = 0;
		const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; for (const r of runs) { const b = r.sec.getBoundingClientRect(); if (b.bottom > -200 && b.top < innerHeight + 200) r.update(); } }); };
		let rt = 0;
		const onResize = () => { clearTimeout(rt); rt = setTimeout(() => runs.forEach((r) => r.layout()), 200); };
		addEventListener('scroll', onScroll, { passive: true });
		addEventListener('resize', onResize);
		// the frames take their size from the page: lay the maps once they have it
		setTimeout(() => runs.forEach((r) => r.layout()), 0);
		this.leave = () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); cancelAnimationFrame(raf); clearTimeout(rt); };
	}
};
