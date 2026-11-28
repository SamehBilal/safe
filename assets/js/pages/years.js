import { L, T, esc, img, num, fmtDate, related, App, $, $$, hydrate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { loadTrips, govName } from './trips.js';
import { citiesOf } from './atlas.js';
import { yearGame, canYear } from '../photogames.js';

/* Year by year: our story one year at a time.
   The top: «نهر السنين» — every year a bar as tall as how full it was, with what changed our life marked over it (the
   first hello, the wedding, each baby), the fullest year crowned; tap a bar to open its year.
   A year: where we were in our life (before the wedding, the wedding year, our Nth married year, everyone's ages), what
   happened that changed it, its numbers against the year before, a month-by-month strip, the photo of the year (the one
   we chose on «صورة كل سنة» first) and a wall of its photos, the cities (new ones marked), its trips, firsts, journal
   pages and every moment month by month, and a few things worked out from all of it.
   Everything comes from the story and the shared lists, so anything new shows up here too. */

const yearOf = (d) => { const m = /^(\d{4})/.exec(String(d ?? '')); return m ? +m[1] : null; };
const monthOf = (d) => { const m = /^\d{4}-(\d\d)/.exec(String(d ?? '')); return m ? +m[1] - 1 : null; };
const yr = (y) => num(y).replace(/[٬,]/g, '');
// Arabic counts: one, two, three to ten, eleven and up (few may be { two, few })
const plural = (n, one, few, many) => (n === 1 ? one : n === 2 && few?.two ? few.two : n <= 10 ? (few?.few ?? few) : many);
const photoOf = (x) => (typeof x === 'string' ? x : x?.photo || '');
const monthName = (m, short) => new Date(2020, m, 1).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: short ? 'short' : 'long' });
const ageIn = (born, y) => (born ? y - +String(born).slice(0, 4) : null);
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

export default {
	title: { ar: 'سنة بسنة', en: 'Year by year' },
	render(s) {
		return `<section class="sec sec--top yt-top"><div class="wrap">
			<div class="yt-head">
				<p class="gh-k">${doodle('calendar', 16)} ${L('دفتر السنين', 'The book of our years')}</p>
				<h1 class="yt-t">${L('سنة بسنة', 'Year by year')}</h1>
				<p class="yt-sub">${L('حكايتنا سنة ورا سنة: اللي حصل، اللي اتغير، وصور كل سنة', 'Our story one year at a time: what happened, what changed, and each year’s photos')}</p>
				<ul class="yt-facts" id="yt-facts"></ul>
				${canYear(s) ? `<p class="yt-play"><button class="btn btn--sm" type="button" id="yt-game">${doodle('dice', 18)} ${L('أي سنة؟ — لعبة الصور', 'Which year? — the photo game')}</button></p>` : ''}
			</div>
			<div class="yt-river" id="yt-river" role="tablist" aria-label="${L('السنين', 'The years')}"><p class="empty">${L('بنجمّع السنين…', 'Gathering the years…')}</p></div>
			<p class="yt-hint">${doodle('pin', 14)} ${L('كل عمود سنة، وطوله قد إيه كانت مليانة — دوس على أي سنة', 'Each bar is a year, as tall as it was full — tap any year')}</p>
		</div></section>
		<section class="sec"><div class="wrap"><div class="yr" id="yr"></div></div></section>
		${related(['story', 'atlas', 'chapters'])}`;
	},

	async after(main, s) {
		$('#yt-game', main)?.addEventListener('click', () => yearGame(s));
		const none = { items: [] };
		const [trips, spots, ourfirsts, firsts, journal, yearly, anniv] = await Promise.all([
			loadTrips(s).catch(() => []), live.load('spots').catch(() => none), live.load('ourfirsts').catch(() => none),
			live.load('firsts').catch(() => none), live.load('journal').catch(() => none), live.load('yearly').catch(() => none),
			live.load('anniversaries').catch(() => none)
		]);
		const cities = citiesOf(s, trips, spots.items || []);
		const metY = yearOf(s.met), wedY = yearOf(s.married);
		const people = (s.family?.members || []).filter((m) => m.born);

		// when each city was first visited, to mark the new ones
		const firstVisit = new Map(cities.map((c) => [c, c.places.map((p) => yearOf(p.date)).filter(Boolean).sort()[0]]));

		// everything with a date, by year
		const by = new Map();
		const at = (y) => { if (!by.has(y)) by.set(y, { moments: [], places: [], firsts: [], trips: [], journeys: [], journal: [], letters: [], chapters: [], photos: [], tripPhotos: 0, chosen: null }); return by.get(y); };
		const addPhotos = (y, list, trip) => { const ps = list.map(photoOf).filter(Boolean); at(y).photos.push(...ps); if (trip) at(y).tripPhotos += ps.length; };
		// a moment's own photos count in its year too
		for (const m of s.timeline || []) { const y = yearOf(m.date); if (y) { at(y).moments.push(m); addPhotos(y, [m.photo, ...(m.photos || [])].filter(Boolean)); } }
		for (const c of cities) for (const p of c.places) { const y = yearOf(p.date); if (y) { at(y).places.push({ ...p, city: c }); addPhotos(y, p.photos); } }
		for (const t of s.trips || []) { const y = t.year || yearOf(t.date); if (y) { at(y).trips.push(t); addPhotos(y, t.photos || [], true); } }
		for (const j of s.journeys || []) { const y = yearOf(j.date); if (y) { at(y).journeys.push(j); addPhotos(y, j.stops.flatMap((st) => st.photos || []), true); } }
		for (const c of s.chapters || []) { const y = yearOf(c.date); if (y) { at(y).chapters.push(c); addPhotos(y, c.photos || []); } }
		for (const f of [...(ourfirsts.items || []), ...(firsts.items || [])]) { const y = yearOf(f.date); if (y) at(y).firsts.push(f); }
		for (const x of journal.items || []) { const y = yearOf(x.date); if (y) at(y).journal.push(x); }
		for (const x of s.letters || []) { const y = yearOf(x.date); if (y) at(y).letters.push(x); }
		for (const x of yearly.items || []) if (x.year && x.photo) at(+x.year).chosen = x;
		for (const d of by.values()) d.photos = [...new Set(d.photos)];

		const thisYear = new Date().getFullYear();
		const years = [...by.keys()].filter((y) => (!metY || y >= metY) && y <= thisYear).sort((a, b) => a - b);
		if (!years.length) { $('#yt-river', main).innerHTML = `<p class="empty">${L('لسه مفيش سنين', 'No years yet')}</p>`; return; }
		// how full a year was
		const score = (d) => d.moments.length * 2 + d.places.length * 2 + d.firsts.length * 2 + d.journal.length + (d.trips.length + d.journeys.length) * 4 + Math.min(d.photos.length, 120) / 6;
		const best = years.reduce((a, y) => (score(by.get(y)) > score(by.get(a)) ? y : a), years[0]);
		const maxS = score(by.get(best)) || 1;

		// the facts beside the title
		const allPhotos = new Set([...by.values()].flatMap((d) => d.photos)).size;
		$('#yt-facts', main).innerHTML = [
			metY ? [num(thisYear - metY), L(plural(thisYear - metY, 'سنة', { two: 'سنتين', few: 'سنين' }, 'سنة') + ' مع بعض', 'years together')] : null,
			wedY ? [num(Math.max(0, thisYear - wedY)), L(plural(thisYear - wedY, 'سنة', { two: 'سنتين', few: 'سنين' }, 'سنة') + ' جواز', 'years married')] : null,
			[num(years.length), L(plural(years.length, 'سنة', { two: 'سنتين', few: 'سنين' }, 'سنة') + ' متسجلة', 'years written down')],
			[num(allPhotos), L('صورة', 'photos')]
		].filter(Boolean).map(([b, t], i) => `<li style="--i:${i}"><b>${b}</b><span>${t}</span></li>`).join('');

		// what changed our life, by year
		const marks = new Map();
		const mark = (y, ic, t) => { if (!y) return; if (!marks.has(y)) marks.set(y, []); marks.get(y).push({ ic, t }); };
		mark(metY, 'chat', L('أول سلام', 'First hello'));
		mark(wedY, 'ring', L('اتجوزنا', 'We married'));
		for (const p of people) if (p.kid) mark(yearOf(p.born), 'baby', L(`اتولد ${App.t(p.name)}`, `${App.t(p.name)} was born`));

		// the river: every year from the first to the last, the empty ones as gaps
		const span = [];
		for (let y = years[0]; y <= years.at(-1); y++) span.push(y);
		const river = $('#yt-river', main);
		river.innerHTML = `<div class="yt-bars">${span.map((y, i) => {
			const d = by.get(y);
			const h = d ? Math.max(8, Math.round((score(d) / maxS) * 100)) : 3;
			const mk = marks.get(y) || [];
			return `<button class="yt-bar${d ? '' : ' is-gap'}${y === best ? ' is-best' : ''}" type="button" role="tab" data-y="${y}" style="--h:${h}%;--i:${i}"${d ? '' : ' disabled'} aria-label="${yr(y)}">
				<span class="yt-bar__marks">${mk.map((m) => `<i title="${esc(m.t)}">${doodle(m.ic, 16)}</i>`).join('')}${y === best ? `<i class="yt-crown" title="${L('أملى سنة', 'Our fullest year')}">${doodle('crown', 18)}</i>` : ''}</span>
				<span class="yt-bar__col"></span>
				<span class="yt-bar__y">${App.lang === 'ar' ? yr(y) : `’${String(y).slice(2)}`}</span>
			</button>`;
		}).join('')}</div>`;

		const show = (y) => {
			const d = by.get(y);
			if (!d) return;
			const k = years.indexOf(y), prev = by.get(years[k - 1]);
			const tripsN = d.trips.length + d.journeys.length;

			// where we were in our life
			const stage = !wedY ? '' : y < wedY ? L(`قبل الجواز بـ ${num(wedY - y)} ${plural(wedY - y, 'سنة', { two: 'سنتين', few: 'سنين' }, 'سنة')}`, `${wedY - y} year${wedY - y === 1 ? '' : 's'} before the wedding`) : y === wedY ? L('سنة جوازنا ♥', 'The year we married ♥') : L(`سنة الجواز رقم ${num(y - wedY)}`, `Married year ${y - wedY}`);
			const ages = people.filter((p) => ageIn(p.born, y) >= 0).map((p) => `<li>${doodle(p.kid ? 'baby' : 'heart', 14)} <b>${esc(App.t(p.name))}</b> ${ageIn(p.born, y) === 0 ? L('اتولد', 'born') : L(`${num(ageIn(p.born, y))} ${plural(ageIn(p.born, y), 'سنة', { two: 'سنتين', few: 'سنين' }, 'سنة')}`, `${ageIn(p.born, y)}`)}</li>`).join('');

			// its numbers, against the year before
			const tiles = [
				['star', d.moments.length, prev?.moments.length, L('لحظات', 'moments')],
				['pin', d.places.length, prev?.places.length, L('أماكن', 'places')],
				['heart', d.firsts.length, prev?.firsts.length, L('أول مرة', 'firsts')],
				['suitcase', tripsN, prev ? prev.trips.length + prev.journeys.length : undefined, L('رحلات', 'trips')],
				['pen', d.journal.length, prev?.journal.length, L('صفحات دفتر', 'journal pages')],
				['camera', d.photos.length, prev?.photos.length, L('صورة', 'photos')]
			];
			const delta = (n, p) => (p === undefined || n === p ? '' : `<em class="${n > p ? 'up' : 'down'}">${n > p ? '▲' : '▼'} ${num(Math.abs(n - p))}</em>`);

			// month by month
			const months = Array(12).fill(0);
			for (const x of [...d.moments, ...d.places, ...d.firsts, ...d.journal]) { const m = monthOf(x.date); if (m != null) months[m]++; }
			const top = Math.max(...months), busy = months.indexOf(top);

			// the cities, the new ones marked
			const count = new Map();
			for (const p of d.places) count.set(p.city, (count.get(p.city) || 0) + 1);
			const cityList = [...count].sort((a, b) => b[1] - a[1]);
			const govs = new Set(cityList.map(([c]) => c.gov)).size;

			// the photo of the year: the one we chose, else a trip's, else the first
			const hero = d.chosen ? `<img class="zoom" data-sketch="${esc(d.chosen.photo)}" alt="" loading="lazy">` : d.photos.length ? `<span data-media-box>${img(d.photos[0], '', 'zoom')}</span>` : '';
			const wall = d.photos.slice(d.chosen ? 0 : 1);

			// worked out from it all
			const dated = [...d.moments, ...d.places, ...d.firsts, ...d.journal].map((x) => String(x.date || '')).filter((x) => /^\d{4}-\d\d-\d\d/.test(x)).sort();
			let gap = 0, gapFrom = '';
			for (let i = 1; i < dated.length; i++) { const g = days(dated[i - 1], dated[i]); if (g > gap) { gap = g; gapFrom = dated[i - 1]; } }
			const facts = [
				top ? L(`أكتر شهر كان ${monthName(busy)}: ${num(top)} ${plural(top, 'حاجة', { two: 'حاجتين', few: 'حاجات' }, 'حاجة')}`, `The busiest month was ${monthName(busy)}: ${top} things`) : '',
				govs ? L(`رحنا ${num(govs)} ${plural(govs, 'محافظة', { two: 'محافظتين', few: 'محافظات' }, 'محافظة')}`, `We went to ${govs} governorate${govs === 1 ? '' : 's'}`) : '',
				d.photos.length && d.tripPhotos ? L(`${num(Math.round((d.tripPhotos / d.photos.length) * 100))}٪ من صور السنة من الرحلات`, `${Math.round((d.tripPhotos / d.photos.length) * 100)}% of the year’s photos are from trips`) : '',
				gap > 45 ? L(`أطول سكتة: ${num(gap)} يوم من غير ما نكتب حاجة، بعد ${fmtDate(gapFrom)}`, `The longest quiet: ${gap} days with nothing written, after ${fmtDate(gapFrom)}`) : '',
				prev && score(d) > score(prev) ? L('السنة دي كانت أملى من اللي قبلها', 'Fuller than the year before') : prev ? L('السنة دي كانت أهدى من اللي قبلها', 'Quieter than the year before') : '',
				y === best ? L('دي أملى سنة في حكايتنا كلها', 'Our fullest year of all') : ''
			].filter(Boolean);
			const firstOf = d.moments.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));

			$('#yr', main).innerHTML = `<article class="yr-card">
				<header class="yr-head">
					<button class="yr-arrow" type="button" data-go="${years[k - 1] ?? ''}" ${k ? '' : 'disabled'} aria-label="${L('السنة اللي قبلها', 'Previous year')}">${L('→', '←')}</button>
					<div class="yr-title"><b>${yr(y)}</b>${metY && y >= metY ? `<small>${L(`سنتنا رقم ${num(y - metY + 1)}`, `Our year no. ${y - metY + 1}`)}${stage ? ` · ${stage}` : ''}</small>` : ''}</div>
					<button class="yr-arrow" type="button" data-go="${years[k + 1] ?? ''}" ${k < years.length - 1 ? '' : 'disabled'} aria-label="${L('السنة اللي بعدها', 'Next year')}">${L('←', '→')}</button>
				</header>
				${(marks.get(y) || []).length || d.chapters.length ? `<ul class="yr-big">${(marks.get(y) || []).map((m) => `<li>${doodle(m.ic, 20)} ${esc(m.t)}</li>`).join('')}${d.chapters.map((c) => `<li>${doodle('book', 20)} <a href="chapter.html?id=${encodeURIComponent(c.id)}">${esc(T(c.title))}</a></li>`).join('')}</ul>` : ''}
				${ages ? `<ul class="yr-ages">${ages}</ul>` : ''}
				<ul class="yr-tiles">${tiles.map(([ic, n, p, t], i) => `<li style="--i:${i}" class="${n ? '' : 'is-zero'}">${doodle(ic, 20)}<b>${num(n)}</b><span>${t}</span>${delta(n, p)}</li>`).join('')}</ul>
				<div class="yr-months" aria-label="${L('شهر بشهر', 'Month by month')}">${months.map((n, m) => `<span class="${n ? '' : 'is-zero'}${m === busy && top ? ' is-top' : ''}" style="--v:${top ? n / top : 0}"><i>${n ? num(n) : ''}</i><small>${esc(monthName(m, true))}</small></span>`).join('')}</div>
				<div class="yr-body">
					<div class="yr-main">
						${hero ? `<figure class="yr-hero">${hero}<figcaption>${d.chosen ? L('صورة السنة اللي اخترناها', 'The photo we chose for the year') : L('صورة السنة', 'Photo of the year')}${d.chosen?.note ? ` · <span dir="auto">${esc(d.chosen.note)}</span>` : ''}</figcaption></figure>` : `<div class="yr-hero yr-hero--none">${doodle('camera', 40)}<span>${L('مفيش صور السنة دي لسه', 'No photos this year yet')}</span></div>`}
						${wall.length ? `<div class="yr-wall" id="yr-wall">${wall.slice(0, 12).map((p, i) => `<span style="--i:${i}" data-media-box>${img(p, '', 'zoom')}</span>`).join('')}</div>${wall.length > 12 ? `<p class="center"><button class="btn btn--sm btn--ghost" type="button" id="yr-more">${doodle('camera', 16)} ${L(`كل صور السنة (${num(wall.length)})`, `All the year’s photos (${wall.length})`)}</button></p>` : ''}` : ''}
						${facts.length ? `<div class="yr-facts"><p class="yr-k">${doodle('star', 16)} ${L('من الأرقام', 'From the numbers')}</p><ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
					</div>
					<div class="yr-side">
						${cityList.length ? `<p class="yr-k">${doodle('pin', 16)} ${L('المدن', 'Cities')}</p><ul class="yr-cities">${cityList.map(([c, n]) => `<li><a href="atlas.html#${encodeURIComponent(c.id)}"><b>${esc(L(c.ar, c.en))}</b> <small>${num(n)}</small>${firstVisit.get(c) === y ? `<em>${L('جديدة', 'new')}</em>` : ''}</a></li>`).join('')}</ul>` : ''}
						${tripsN ? `<p class="yr-k">${doodle('suitcase', 16)} ${L('رحلات السنة', 'The year’s trips')}</p><ul class="yr-trips">${d.journeys.map((j) => `<li><a href="journey.html?id=${encodeURIComponent(j.id)}"><b>${esc(T(j.title))}</b><small>${esc(fmtDate(j.date))}</small></a></li>`).join('')}${d.trips.map((t) => { const n = wedY ? t.year - wedY : 0; const a = (anniv.items || []).find((x) => +x.n === n); return `<li><a href="anniversaries.html"><b>${L(`عيد جوازنا ${n ? `الـ${num(n)}` : ''}`, `Anniversary${n ? ` no. ${n}` : ''}`)} · ${esc(govName(t.gov))}</b><small>${a?.did ? esc(a.did) : esc(fmtDate(t.date || ''))}</small></a></li>`; }).join('')}</ul>` : ''}
						${d.firsts.length ? `<p class="yr-k">${doodle('heart', 16)} ${L('أول مرة', 'Firsts')}</p><ul class="yr-firsts">${d.firsts.sort((a, b) => String(a.date).localeCompare(String(b.date))).map((f) => `<li dir="auto">${esc(App.t(f.what) || '')}<small>${f.date ? esc(fmtDate(f.date)) : ''}</small></li>`).join('')}</ul>` : ''}
						${d.journal.length ? `<p class="yr-k">${doodle('pen', 16)} ${L(`كتبنا ${num(d.journal.length)} ${plural(d.journal.length, 'صفحة', { two: 'صفحتين', few: 'صفحات' }, 'صفحة')} في الدفتر`, `${d.journal.length} journal page${d.journal.length === 1 ? '' : 's'}`)}</p><ul class="yr-journal">${d.journal.slice(-3).reverse().map((x) => `<li><a href="journal.html"><b dir="auto">${esc(App.t(x.title) || L('صفحة', 'A page'))}</b><small>${esc(fmtDate(x.date))}</small></a></li>`).join('')}</ul>` : ''}
						${d.letters.length ? `<p class="yr-k">${doodle('letter', 16)} ${L(`${num(d.letters.length)} ${plural(d.letters.length, 'جواب', { two: 'جوابين', few: 'جوابات' }, 'جواب')}`, `${d.letters.length} letter${d.letters.length === 1 ? '' : 's'}`)}</p>` : ''}
					</div>
				</div>
				${firstOf.length ? `<div class="yr-story"><p class="yr-k">${doodle('book', 16)} ${L('لحظات السنة، شهر بشهر', 'The year’s moments, month by month')}</p>
					${[...new Set(firstOf.map((m) => monthOf(m.date)))].map((m) => `<div class="yr-month"><h3>${esc(monthName(m ?? 0))}</h3><ol>${firstOf.filter((x) => monthOf(x.date) === m).map((x) => `<li><a href="moment.html?id=${encodeURIComponent(x.id)}"><small>${esc(fmtDate(x.date))}</small><b dir="auto">${esc(T(x.title))}</b>${x.text ? `<span dir="auto">${esc(T(x.text)).slice(0, 140)}${T(x.text).length > 140 ? '…' : ''}</span>` : ''}</a></li>`).join('')}</ol></div>`).join('')}
				</div>` : ''}
			</article>`;
			hydrate($('#yr', main));
			live.hydrateSketches?.($('#yr', main));
			$('#yr-more', main)?.addEventListener('click', (e) => {
				$('#yr-wall', main).insertAdjacentHTML('beforeend', wall.slice(12).map((p, i) => `<span style="--i:${i % 12}" data-media-box>${img(p, '', 'zoom')}</span>`).join(''));
				hydrate($('#yr-wall', main));
				e.currentTarget.remove();
			});
			$$('.yt-bar', river).forEach((b) => { const on = +b.dataset.y === y; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); if (on) b.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }); });
			history.replaceState(history.state, '', `#${y}`);
		};
		river.addEventListener('click', (e) => { const b = e.target.closest('[data-y]'); if (b && !b.disabled) { show(+b.dataset.y); $('#yr', main).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); } });
		$('#yr', main).addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b && b.dataset.go) show(+b.dataset.go); });
		const want = +location.hash.slice(1);
		// opens on the latest year that has photos (a year just begun is often still empty)
		const full = [...years].reverse().find((y) => y <= thisYear && by.get(y).photos.length);
		show(years.includes(want) ? want : full || years.at(-1));
	}
};
