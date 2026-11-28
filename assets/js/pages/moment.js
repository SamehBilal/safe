import { L, Y, T, esc, img, fmtDate, longDate, yearsAgo, related, qs, App, linksOut, $, $$, REDUCE, parseDate, daysBetween, num, age } from '../shell.js';
import { where, fit } from '../tilemap.js';
import { doodle } from '../doodles.js';
import { farthestMap, drawFarthest } from './distances.js';
import * as live from '../live.js';
import { loadPicks, pickPhotos, markFavs } from '../picks.js';

/* One date on «حكايتنا».
   It opens like Codrops' «Polaroid Stack to Grid» (tympanus.net/codrops/?p=26096): the title on its own screen and the
   day's first six photos fanned out behind the moment's badge at the bottom, as if pulled from a pocket. Scroll, or tap
   the arrow, and the title flies off, the badge drops away and the six photos fall into their places on the wall while
   the rest of the day's photos pop in around them. The wall itself is small polaroids scattered at their own angles
   (after Olivier's «Scattered Polaroids»), 5–6 to a row, all in the journal's hand. */

/* a moment named in story.json "farthest.moments" shows the farthest-we've-been map under its photos */
const isFar = (s, x) => (s.farthest?.moments || []).includes(x?.id);

/* steady pseudo-random numbers, so a moment's photos fall the same way every visit */
const rnd = (i, salt) => { const v = Math.sin((i + 1) * 9301 + salt * 49297) * 233280; return v - Math.floor(v); };
/* a polaroid without its own caption gets the moment's date, like ink on the white strip */
const capOf = (x, n) => (n === 0 ? App.t(x.title) : x.when ? App.t(x.when) : String(x.date || '').split('-').reverse().join('.'));
/* where the first six sit in the fan: offsets in the photo's width, scale, rotation (the demo's own values) */
const FAN = [{ tx: -0.6, ty: -0.3, s: 0.95, r: -20 }, { tx: 0.2, ty: -0.7, s: 1.1, r: 1 }, { tx: 0.5, ty: -0.5, s: 1.05, r: 15 }, { tx: -0.2, ty: -0.4, s: 1.1, r: -17 }, { tx: -0.15, ty: -0.4, s: 1, r: -5 }, { tx: 0.7, ty: -0.2, s: 0.95, r: 15 }];
const EASE_OUT = 'cubic-bezier(0.2, 1, 0.3, 1)';

const photosOf = (x) => [...new Map([x.photo, ...(x.photos || [])].filter(Boolean).map((p) => (typeof p === 'string' ? { photo: p } : p)).map((p) => [p.photo, p])).values()];

/* The band above the moment: the whole story as a strip of film along a ruler — a tick for every moment, the years
   marked under it, this one pinned with a heart and its date — and the moments either side of it to step to. Every
   tick is a link; the strip reads oldest to newest, left to right, in both languages. */
function stripHTML(tl, x, prev, next) {
	const dated = tl.filter((m) => /^\d{4}-\d{2}/.test(String(m.date || '')));
	if (dated.length < 2) return '';
	const ms = (d) => Date.parse(String(d).slice(0, 10).length === 7 ? `${d}-15` : String(d).slice(0, 10));
	const y0 = +dated[0].date.slice(0, 4), y1 = +dated.at(-1).date.slice(0, 4) + 1;
	const a = Date.UTC(y0, 0, 1), b = Date.UTC(y1, 0, 1);
	const at = (d) => (((ms(d) - a) / (b - a)) * 100).toFixed(2);
	const years = Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
	const step = (m, dir) => (m ? `<a class="mo-strip__step mo-strip__step--${dir}" href="moment.html?id=${encodeURIComponent(m.id)}"><small>${dir === 'prev' ? L('اللي قبلها', 'Before') : L('اللي بعدها', 'After')}</small><b dir="auto">${T(m.title)}</b></a>` : '<span></span>');
	return `<nav class="mo-strip" aria-label="${L('مكانها في حكايتنا', 'Where it sits in our story')}">
		<div class="mo-strip__rail" dir="ltr">
			<div class="mo-strip__film" aria-hidden="true"></div>
			${years.map((y, i) => `<span class="mo-strip__y${i % 2 ? ' is-odd' : ''}" style="left:${(((Date.UTC(y, 0, 1) - a) / (b - a)) * 100).toFixed(2)}%">${y}</span>`).join('')}
			${dated.map((m) => `<a class="mo-strip__t${m.id === x.id ? ' is-here' : ''}" style="left:${at(m.date)}%;--k:${at(m.date)}" href="moment.html?id=${encodeURIComponent(m.id)}" title="${esc(`${App.t(m.title)} · ${fmtDate(m.date)}`)}" aria-label="${esc(App.t(m.title))}"></a>`).join('')}
			${/^\d{4}-\d{2}/.test(String(x.date || '')) ? `<span class="mo-strip__pin" style="left:${at(x.date)}%" aria-hidden="true"><i>♥</i><small>${fmtDate(x.date)}</small></span>` : ''}
		</div>
		<div class="mo-strip__steps">${step(prev, 'prev')}${step(next, 'next')}</div>
	</nav>`;
}

/* ---- «يومها»: the top of every moment ----
   A tear-off calendar page for the day (the weekday, the day, the month and year, the Hijri date), beside it what
   that day was for us — how long we'd known each other or been married, how old each of us there was, how long ago
   it is, the season — and the other years' moments on the same day. When the moment happened somewhere on
   «أماكننا» (story.json "place": its id, or a photo it shares with a place) a street map of the spot sits beside
   them with a pin, the place's name, and buttons to open it in Google Maps and on our map. */
const fullDate = (d) => /^\d{4}-\d{2}-\d{2}/.test(String(d || ''));
const SEASON = [['شتا', 'Winter'], ['شتا', 'Winter'], ['ربيع', 'Spring'], ['ربيع', 'Spring'], ['ربيع', 'Spring'], ['صيف', 'Summer'], ['صيف', 'Summer'], ['صيف', 'Summer'], ['خريف', 'Autumn'], ['خريف', 'Autumn'], ['خريف', 'Autumn'], ['شتا', 'Winter']];
const SEASON_IC = ['rain', 'rain', 'sparkle', 'sparkle', 'sparkle', 'sun', 'sun', 'sun', 'wave', 'wave', 'wave', 'rain'];
const photoIds = (o) => [o?.photo, ...(o?.photos || []).map((p) => (typeof p === 'string' ? p : p?.photo))].filter(Boolean);

/** The place on «أماكننا» a moment happened at: its "place" id, else a place sharing one of its photos. */
export function placeOf(s, x) {
	const P = (s.places || []).filter((p) => where(p));
	if (x.place) { const p = P.find((q) => q.id === x.place); if (p) return p; }
	const mine = new Set(photoIds(x));
	return mine.size ? P.find((p) => photoIds(p).some((q) => mine.has(q))) || null : null;
}

/** Every place a moment's day went to, in order: its "places" ids (a day out with several stops), else the one placeOf finds. */
export function placesOf(s, x) {
	if (Array.isArray(x.places) && x.places.length) {
		const P = (s.places || []).filter((p) => where(p));
		const list = x.places.map((id) => P.find((q) => q.id === id)).filter(Boolean);
		if (list.length) return list;
	}
	const p = placeOf(s, x);
	return p ? [p] : [];
}

function dayHTML(s, x) {
	if (!/^\d{4}-\d{2}/.test(String(x.date || ''))) return '';
	const full = fullDate(x.date), d = parseDate(x.date), m = d.getMonth();
	const lang = App.lang === 'ar' ? 'ar-EG' : 'en-GB';
	let hijri = '';
	try { if (full) hijri = new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch { /* no Hijri calendar here */ }
	const cal = `<div class="mo-cal" aria-hidden="true">
			<span class="mo-cal__rings"><i></i><i></i></span>
			<b class="mo-cal__wd">${full ? esc(d.toLocaleDateString(lang, { weekday: 'long' })) : esc(L(...SEASON[m]))}</b>
			<strong class="mo-cal__d">${full ? num(d.getDate()) : doodle(SEASON_IC[m], 54)}</strong>
			<span class="mo-cal__my">${esc(d.toLocaleDateString(lang, { month: 'long', year: 'numeric' }))}</span>
			${hijri ? `<small class="mo-cal__h">${esc(hijri)}</small>` : ''}
		</div>`;

	const facts = [];
	const fact = (ic, small, big) => facts.push(`<li>${doodle(ic, 26)}<span><small>${small}</small><b>${big}</b></span></li>`);
	// us: before we met, how long we'd known each other, how long married
	const met = s.met && parseDate(s.met), wed = s.married && parseDate(s.married);
	const same = (a) => a && a.getTime() === d.getTime();
	if (same(met)) fact('heart', L('يومها', 'That day'), L('أول يوم نعرف فيه بعض', 'The day we met'));
	else if (met && d < met) fact('clock', L('قبل ما نتقابل', 'Before we met'), esc(L(`بـ ${age(x.date, met)}`, `by ${age(x.date, met)}`)));
	else if (same(wed)) fact('ring', L('يومها', 'That day'), L('يوم فرحنا', 'Our wedding day'));
	else if (wed && d > wed) fact('ring', L('كنا متجوزين بقالنا', 'We had been married'), esc(age(s.married, d)));
	else if (met) fact('heart', L('كنا عارفين بعض بقالنا', 'We had known each other'), esc(age(s.met, d)) + (wed ? `<em>${esc(L(`وفاضل على فرحنا ${age(x.date, wed)}`, `and ${age(x.date, wed)} to our wedding`))}</em>` : ''));
	// how old each of us there was
	const people = (s.family?.members || []).filter((p) => p.born && (x.who || []).includes(p.id) && parseDate(p.born) <= d);
	if (people.length) facts.push(`<li class="mo-ages">${doodle('family', 26)}<span><small>${L('كان عندنا', 'How old we were')}</small><span class="mo-ages__row">${people.map((p) => `<a class="mo-age" href="member.html?id=${encodeURIComponent(p.id)}"><b>${T(p.name)}</b> ${same(parseDate(p.born)) ? esc(L('اتولد النهارده', 'born that day')) : esc(age(p.born, d))}</a>`).join('')}</span></span></li>`);
	// how long ago, and the season
	const days = daysBetween(d);
	if (days > 0) fact('calendar', L('من ساعتها', 'Since then'), esc(L(`${num(days)} يوم`, `${num(days)} days`) + (yearsAgo(x.date) ? ` · ${yearsAgo(x.date)}` : '')));
	if (full) fact(SEASON_IC[m], L('الفصل', 'The season'), esc(L(...SEASON[m])));

	// the same day in other years
	const md = String(x.date).slice(5, 10);
	const also = full ? (s.timeline || []).filter((o) => o.id !== x.id && fullDate(o.date) && o.date.slice(5, 10) === md) : [];

	const ps = placesOf(s, x);
	const p = ps.length === 1 ? ps[0] : null;
	const here = p ? (s.timeline || []).filter((o) => o.id !== x.id && placesOf(s, o).some((q) => q.id === p.id)) : [];
	const gmapsOf = (q) => { const w = where(q); return String(q.maps || '').startsWith('https://') ? q.maps : `https://www.google.com/maps/search/?api=1&query=${w.lat},${w.lng}`; };
	const gmaps = p ? gmapsOf(p) : '';
	const pinSvg = '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 43C13 34 2 27 2 16a14 14 0 0 1 28 0c0 11-11 18-14 27Z"/><circle cx="16" cy="16" r="5.5"/></svg>';
	const mapBox = (list, label) => `<div class="mo-place__map" id="mo-place-map" data-at="${list.map((q) => { const w = where(q); return `${w.lat},${w.lng}`; }).join(';')}" role="img" aria-label="${esc(label)}"><div class="mo-place__tiles"></div>${list.map((q, i) => `<span class="mo-place__pin" hidden>${pinSvg}${list.length > 1 ? `<b>${num(i + 1)}</b>` : ''}</span>`).join('')}<small class="mo-place__osm">© OpenStreetMap</small></div>`;
	const routeCard = ps.length > 1 ? `<div class="mo-place mo-place--route">
			${mapBox(ps, L(`أماكن اليوم على الخريطة: ${ps.map((q) => App.t(q.title)).join('، ')}`, `The day's places on the map: ${ps.map((q) => App.t(q.title)).join(', ')}`))}
			<div class="mo-place__txt">
				<small>${L(`رحنا ${num(ps.length)} أماكن يومها`, `${ps.length} places that day`)}</small>
				<ol class="mo-stops">${ps.map((q, i) => `<li><i aria-hidden="true">${num(i + 1)}</i><span><b dir="auto">${T(q.title)}</b>${q.where ? `<span dir="auto">${T(q.where)}</span>` : ''}</span><a class="btn btn--sm btn--ghost" href="${esc(gmapsOf(q))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(L(`افتح ${App.t(q.title)} في خرايط جوجل`, `Open ${App.t(q.title)} in Google Maps`))}">${doodle('pin', 16)} ${L('خرايط جوجل', 'Google Maps')}</a></li>`).join('')}</ol>
				<span class="mo-place__btns"><a class="btn btn--sm" href="atlas.html#places">${L('على أطلسنا', 'In our atlas')}</a></span>
			</div>
		</div>` : '';
	const placeCard = p ? `<div class="mo-place">
			${mapBox([p], L(`${App.t(p.title)} على الخريطة`, `${App.t(p.title)} on the map`))}
			<div class="mo-place__txt">
				<small>${L('المكان', 'The place')}</small>
				<b dir="auto">${T(p.title)}</b>
				${p.where ? `<span dir="auto">${T(p.where)}</span>` : ''}
				${here.length ? `<em>${esc(L(`رحناه ${here.length + 1 === 2 ? 'مرتين' : `${num(here.length + 1)} مرات`}`, `We've been ${here.length + 1} times`))}: ${here.slice(0, 3).map((o) => `<a href="moment.html?id=${encodeURIComponent(o.id)}">${T(o.title)}</a>`).join(L('، ', ', '))}</em>` : ''}
				<span class="mo-place__btns"><a class="btn btn--sm" href="${esc(gmaps)}" target="_blank" rel="noopener noreferrer">${doodle('pin', 18)} ${L('افتحه في خرايط جوجل', 'Open in Google Maps')}</a><a class="btn btn--sm btn--ghost" href="atlas.html#places">${L('على أطلسنا', 'In our atlas')}</a></span>
			</div>
		</div>` : routeCard;

	return `<section class="mo-day wrap" id="mo-day" aria-label="${L('يومها', 'That day')}">
		<h2 class="mo-day__h">${L('يومها', 'That day')}</h2>
		<div class="mo-day__grid${ps.length ? ' has-place' : ''}">
			${cal}
			<ul class="mo-facts">${facts.join('')}</ul>
			${placeCard}
		</div>
		${also.length ? `<p class="mo-also"><small>${L('في نفس اليوم في سنين تانية', 'The same day, other years')}</small>${also.map((o) => `<a class="chip" href="moment.html?id=${encodeURIComponent(o.id)}">${doodle(o.icon, 16)} ${T(o.title)} <small>${num(+o.date.slice(0, 4)).replace(/[٬,]/g, '')}</small></a>`).join('')}</p>` : ''}
	</section>`;
}

/* the street map of the place, fitted around its pin once the box has a size */
function drawPlace(main) {
	const box = $('#mo-place-map', main);
	if (!box) return;
	const spots = box.dataset.at.split(';').map((a) => { const [lat, lng] = a.split(',').map(Number); return { lat, lng }; });
	const pins = $$('.mo-place__pin', box);
	const draw = () => {
		const tiles = $('.mo-place__tiles', box);
		if (!tiles.clientWidth) return;
		const v = fit(tiles, spots, spots.length > 1 ? { pad: 36, padTop: 54, zoom: 15, maxZ: 16, minZ: 9 } : { zoom: 15, maxZ: 16, minZ: 12 });
		spots.forEach((spot, i) => { const pt = v.at(spot), pin = pins[i]; if (!pin) return; pin.style.left = `${pt.x}px`; pin.style.top = `${pt.y}px`; pin.hidden = false; });
	};
	draw();
	let t;
	new ResizeObserver(() => { clearTimeout(t); t = setTimeout(draw, 80); }).observe(box);
}

export default {
	title: { ar: 'ذكرى', en: 'A moment' },
	render(s) {
		const tl = s.timeline || [];
		const k = Math.max(0, tl.findIndex((x) => x.id === qs('id')));
		const x = tl[k];
		if (!x) return `<header class="ph"><div class="ph__in"><h1 class="ph__title">${L('مش لاقي الذكرى دي', 'Moment not found')}</h1></div></header>`;
		this.title = x.title;
		const prev = tl[k - 1];
		const next = tl[k + 1];
		const chapter = x.chapter && (s.chapters || []).find((c) => c.id === x.chapter);
		const photos = photosOf(x);
		const story = App.t(x.story || '');
		const stack = photos.length > 0 && !REDUCE;
		return `
		<header class="mo-intro${stack ? ' is-stack' : ''}" id="mo-intro">
			${stripHTML(tl, x, prev, next)}
			<div class="mo-intro__titles" id="mo-titles">
				<nav class="crumbs" aria-label="${L('أنت هنا', 'You are here')}"><a href="index.html">${L('الرئيسية', 'Home')}</a><span aria-hidden="true">/</span><a href="story.html">${L('حكايتنا', 'Our story')}</a><span aria-hidden="true">/</span><a href="#">${T(x.title)}</a></nav>
				<p class="ph__eyebrow">${L('حكايتنا', 'Our story')}</p>
				<h1 class="ph__title">${T(x.title)}</h1>
				<p class="mo-intro__date">${x.when ? T(x.when) : esc([longDate(x.date), yearsAgo(x.date)].filter(Boolean).join(' · '))}</p>
				${x.text ? `<p class="mo-intro__lede">${T(x.text)}</p>` : ''}
			</div>
			<div class="mo-badge" id="mo-badge"><span class="moment-hero__ic">${doodle(x.icon, 56)}</span>${x.when ? `<time>${T(x.when)}</time>` : `<time datetime="${esc(x.date)}">${fmtDate(x.date)}</time>`}</div>
			${stack ? `<button class="mo-down" type="button" id="mo-down" aria-label="${Y('شوف الصور', 'شوفي الصور', 'See the photos')}"><span>${Y('شوف الصور', 'شوفي الصور', 'See the photos')}</span><i aria-hidden="true">↓</i></button>` : ''}
		</header>
		<article class="sec mo-body">
			${dayHTML(s, x)}
			${photos.length ? `<section class="scatter-wrap wrap" aria-label="${L('الصور', 'Photos')}">
				<h2 class="sec__title scatter__h" id="mo-wall-h">${L(`${photos.length} صورة من اليوم ده`, `${photos.length} photo${photos.length === 1 ? '' : 's'} from that day`)}</h2>
				<div class="scatter${photos.length < 4 ? ' scatter--few' : ''}" id="mo-wall">${photos.map((p, n) => {
					const r = rnd(n, 1) * 14 - 7, dx = rnd(n, 2) * 14 - 7, dy = rnd(n, 3) * 14 - 7;
					return `<figure class="snap" data-media-box style="--r:${r.toFixed(1)}deg;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;--i:${n % 18}">${img(p.photo, App.t(p.caption), 'zoom')}<figcaption>${p.caption ? T(p.caption) : esc(capOf(x, n))}</figcaption></figure>`;
				}).join('')}</div>
				${photos.length > 1 && live.canWrite() ? `<p class="pk-sort"><button class="btn btn--sm btn--ghost" type="button" id="mo-pick">${doodle('heart', 18)} ${Y('نقّي صور اليوم ده', 'نقّي صور اليوم ده', 'Pick this day’s photos')}</button></p>` : ''}
			</section>` : ''}
			<div class="wrap narrow">
				${linksOut(x)}
				${story ? story.split(/\n{2,}/).map((p) => `<p class="prose reveal">${esc(p)}</p>`).join('') : ''}
				${x.code?.text ? `<figure class="mo-code reveal">${x.code.caption ? `<figcaption>${T(x.code.caption)}</figcaption>` : ''}<pre dir="ltr" tabindex="0"><code>${esc(x.code.text)}</code></pre>${x.code.run ? `<button class="btn mo-code__run" type="button" id="mo-run">▶ ${Y('شغّل البرنامج', 'شغّلي البرنامج', 'Run the program')}</button><div id="mo-console"></div>` : ''}</figure>` : ''}
				${isFar(s, x) ? `<div class="moment-far">${farthestMap(s)}</div>` : ''}
				${(() => {
					// a trip on «رحلاتنا» this day is part of: its road on the map
					const j = (s.journeys || []).find((t) => t.moment === x.id || t.stops.some((st) => (st.photos || []).includes(x.photo)));
					return j ? `<a class="otd reveal" href="journey.html?id=${esc(j.id)}"><span class="otd__ic">${doodle('plane', 28)}</span><span><small>${L('الرحلة على الخريطة', 'The trip on the map')}</small><b>${T(j.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>` : '';
				})()}
				${chapter ? `<a class="otd reveal" href="chapter.html?id=${esc(chapter.id)}"><span class="otd__ic">${doodle(chapter.icon, 28)}</span><span><small>${L('الحكاية كاملة', 'The full chapter')}</small><b>${T(chapter.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>` : ''}
				<nav class="pager" aria-label="${L('ذكريات تانية', 'Other moments')}">
					${prev ? `<a class="pager__prev" href="moment.html?id=${esc(prev.id)}"><small>${L('اللي قبلها', 'Before')}</small><b>${doodle(prev.icon, 18)} ${T(prev.title)}</b></a>` : '<span></span>'}
					${next ? `<a class="pager__next" href="moment.html?id=${esc(next.id)}"><small>${L('اللي بعدها', 'After')}</small><b>${T(next.title)} ${doodle(next.icon, 18)}</b></a>` : '<span></span>'}
				</nav>
			</div>
		</article>
		${related(['story', 'chapters', 'gallery'])}`;
	},

	after(main, s) {
		const x = (s.timeline || []).find((m) => m.id === qs('id'));
		if (isFar(s, x)) drawFarthest(main, s);
		drawPlace(main);
		/* our favourites of the day wear a heart; «نقّي صور اليوم ده» opens them in the photo sorter */
		const wall = $('#mo-wall', main);
		if (wall) {
			loadPicks().then((m) => markFavs(wall, m, '.snap'));
			$('#mo-pick', main)?.addEventListener('click', () => pickPhotos(App.t(x.title), photosOf(x).map((p) => ({ photo: p.photo, caption: p.caption ? App.t(p.caption) : '' })), (m) => markFavs(wall, m, '.snap')));
		}
		/* a program that can run: the button opens a console under the code and runs it there */
		$('#mo-run', main)?.addEventListener('click', async (e) => {
			e.currentTarget.hidden = true;
			const { runCpp } = await import('../cppconsole.js');
			runCpp($('#mo-console', main), x.code.text, {
				title: x.code.title || 'C:\\Users\\sameh\\OneDrive\\Documents\\Untitled1.exe',
				hint: Y('اكتب ردّك واضغط Enter — زي ما جاوبت ساعتها', 'اكتبي ردّك واضغطي Enter — زي ما جاوب ساعتها', 'Type your answer and press Enter — as I did that night'),
				again: L('شغّله تاني', 'Run it again'),
			});
		});
		const intro = $('#mo-intro', main);
		if (!intro?.classList.contains('is-stack')) return;
		stackToGrid(main, intro);
	}
};

/* ---- the stack, then the wall ---- */
function stackToGrid(main, intro) {
	const items = $$('#mo-wall .snap', main);
	const fan = items.slice(0, FAN.length), rest = items.slice(FAN.length);
	const wallH = $('#mo-wall-h', main);
	let state = 'stack';

	// where the fan sits: the middle of the intro's bottom edge, just above the badge
	const place = (animate) => {
		const box = intro.getBoundingClientRect();
		const cx = box.left + box.width / 2, by = box.bottom - Math.min(190, box.height * 0.24);
		fan.forEach((el, n) => {
			el.getAnimations().forEach((a) => a.cancel());
			el.style.transform = '';
			const r = el.getBoundingClientRect(), w = el.offsetWidth, f = FAN[n];
			const tx = cx - (r.left + r.width / 2), ty = by - (r.top + r.height / 2);
			const to = `translate(${tx + f.tx * w}px, ${ty + f.ty * w}px) scale(${f.s}) rotate(${f.r}deg)`;
			el.style.transform = to;
			if (animate) el.animate([{ transform: `translate(${tx}px, ${ty}px) scale(0.5)`, opacity: 0 }, { transform: to, opacity: 1 }], { duration: 1000, delay: n * 80, easing: EASE_OUT, fill: 'backwards' });
		});
	};

	main.classList.add('mo-stacked');
	place(true);
	$('#mo-badge', main).animate([{ transform: 'translateY(25vh)' }, { transform: 'none' }], { duration: 1000, easing: EASE_OUT });

	/* One move, once: the opening folds away at once (the title stays put, the badge and the arrow go), and then each
	   of the six glides from where it sat in the fan — measured on the screen before the fold — to its place on the
	   wall, measured after it, so nothing jumps and nothing plays twice. The rest of the photos pop in around them. */
	const toGrid = () => {
		if (state !== 'stack') return;
		state = 'grid';
		removeEventListener('scroll', onScroll);
		removeEventListener('resize', onResize);
		const from = fan.map((el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: el.style.transform }; });
		const titles = $('#mo-titles', main), titleTop = titles.getBoundingClientRect().top;
		fan.forEach((el) => { el.getAnimations().forEach((a) => a.cancel()); el.style.transform = ''; });
		$('#mo-down', main)?.remove();
		$('#mo-badge', main)?.getAnimations().forEach((a) => a.cancel());
		intro.classList.add('is-done');
		intro.classList.remove('is-stack');
		main.classList.remove('mo-stacked');
		main.classList.add('mo-grid');
		titles.animate([{ transform: `translateY(${titleTop - titles.getBoundingClientRect().top}px)` }, { transform: 'none' }], { duration: 500, easing: EASE_OUT });
		fan.forEach((el, n) => {
			const r = el.getBoundingClientRect();
			const dx = from[n].x - (r.left + r.width / 2), dy = from[n].y - (r.top + r.height / 2);
			const f = FAN[n];
			el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${f.s}) rotate(${f.r}deg)` }, { transform: 'none' }], { duration: 700, delay: n * 40, easing: 'cubic-bezier(0.3, 0.9, 0.3, 1.05)', fill: 'backwards' });
		});
		rest.forEach((el, n) => el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, delay: 250 + n * 35, easing: EASE_OUT, fill: 'backwards' }));
		wallH?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 150, easing: 'ease-out', fill: 'backwards' });
		$('#mo-day', main)?.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 100, easing: EASE_OUT, fill: 'backwards' });
	};
	const onScroll = () => { if (scrollY > 8) toGrid(); };
	let t;
	const onResize = () => { clearTimeout(t); t = setTimeout(() => place(false), 60); };
	$('#mo-down', main).onclick = toGrid;
	addEventListener('scroll', onScroll, { passive: true });
	addEventListener('resize', onResize);
	// arriving already scrolled (back button), or leaving for another page while stacked
	if (scrollY > 8) toGrid();
}
