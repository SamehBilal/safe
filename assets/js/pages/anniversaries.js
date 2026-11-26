import { L, Y, esc, pageHead, related, App, $, $$, num, REDUCE, sleep, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { GOVERNORATES } from '../egypt.js';
import { setupNote } from './journal.js';
import { hangWall } from '../hang.js';
import { loadTrips, coverOf, coverHTML, mapSVG, paintMap, govName, anniversary, marriedYear, shrinkPhoto, nextAnniversary } from './trips.js';

/* Our anniversaries, all on one page (it used to be two: «رحلات عيد جوازنا» and «عيد جوازنا»).
   Band: two rings rolling together, and the years married. Then the anniversary trips — every year a new governorate,
   coloured on the map of Egypt, the draw for the next one, and the memory wall (trips from the phones live in
   content/live/trips.bin, the ones in story.json are merged in) — and then each year of our marriage on a card of its
   own: what we did, where, the gifts and a photo (content/live/anniversaries.bin), with the years still to write. */

const wedding = (s) => (s.timeline || []).find((x) => x.id === 'wedding')?.date || s.married || '2020-09-10';
const yearsMarried = (s) => { const w = new Date(wedding(s)), now = new Date(); let n = now.getFullYear() - w.getFullYear(); if (now < new Date(now.getFullYear(), w.getMonth(), w.getDate())) n--; return Math.max(0, n); };

/* the band: the two rings and the years married; beside them the countdown to the next anniversary, a bar filling up
   from the last one to the next, and the days married; under them every anniversary on a thread — a heart for each
   year with the governorate it took us to (filled in once the trips load), the next one beating with a «?» */
function bandHTML(s, nx) {
	const w = new Date(wedding(s)), now = new Date();
	const last = new Date(nx.year - 1, w.getMonth(), w.getDate());
	const pct = Math.max(2, Math.min(100, Math.round(((365 - nx.days) / 365) * 100)));
	const married = Math.max(0, Math.floor((now - w) / 864e5));
	const yr = (y) => num(y).replace(/[٬,]/g, '');
	const years = [];
	for (let y = marriedYear(s) + 1; y <= nx.year; y++) years.push(y);
	const tripOf = (y) => (s.trips || []).find((t) => +t.year === y);
	return `<div class="lp-band lp-band--anniversaries"><div class="an2">
		<div class="an-band"><span class="an-ring an-ring--1" aria-hidden="true"></span><span class="an-ring an-ring--2" aria-hidden="true"></span>
			<p class="an-n"><b>${num(yearsMarried(s))}</b><small>${L('سنين جواز', 'years married')}</small></p></div>
		<div class="an2-next">
			<p class="an2-next__h">${nx.days === 0 ? L('النهارده عيد جوازنا! ♥', 'It’s our anniversary today! ♥') : L(`فاضل <b>${num(nx.days)}</b> يوم على ${esc(anniversary(s, nx.year))}`, `<b>${nx.days}</b> days to ${esc(anniversary(s, nx.year))}`)}</p>
			<span class="an2-bar" style="--p:${pct}%" role="img" aria-label="${esc(L(`${pct}٪ من السنة عدّت`, `${pct}% of the year gone`))}"><i></i><span class="an2-bar__heart">${doodle('heart', 16)}</span></span>
			<p class="an2-next__s"><span>${yr(last.getFullYear())}</span><small>${L(`${num(married)} يوم جواز`, `${married.toLocaleString('en')} days married`)}</small><span>${yr(nx.year)}</span></p>
		</div>
		<ol class="an2-years">${years.map((y, i) => { const t = tripOf(y), isNext = y === nx.year; return `<li class="${isNext ? 'is-next' : t ? 'is-been' : ''}" style="--i:${i}" data-year="${y}"><span class="an2-years__h">${isNext ? '?' : doodle('heart', 18)}</span><b>${yr(y)}</b><small>${isNext ? L('الجاية', 'next') : t ? esc(govName(t.gov)) : '—'}</small></li>`; }).join('')}</ol>
	</div></div>`;
}

export default {
	title: { ar: 'عيد جوازنا', en: 'Our anniversaries' },
	render(s) {
		const ok = live.canWrite();
		const nx = nextAnniversary(s);
		const years = [];
		for (let y = marriedYear(s) + 1; y <= new Date().getFullYear() + 1; y++) years.push(y);
		const govs = [...GOVERNORATES].sort((a, b) => L(a.ar, a.en).localeCompare(L(b.ar, b.en), App.lang));
		return `
		${pageHead(L('عيد جوازنا', 'Our anniversaries'), L('كل سنة من جوازنا: بنسافر فيها محافظة جديدة لحد ما نلف مصر كلها، وبنكتب عملنا فيها إيه', 'Every year of our marriage: a new governorate each time until we’ve seen all of Egypt, and how we celebrated it'), [{ href: 'anniversaries.html', ar: 'عيد جوازنا', en: 'Our anniversaries' }], {
			band: bandHTML(s, nx)
		})}
		<section class="sec sec--top"><div class="wrap">
			<div class="counters trip-stats">
				<div class="counter reveal"><b id="tr-been">–</b><span>${L('محافظة من ٢٧', 'of 27 governorates')}</span></div>
				<div class="counter reveal"><b>${nx.days === 0 ? doodle('party', 34) : num(nx.days)}</b><span>${nx.days === 0 ? L('النهارده عيد جوازنا!', 'It’s our anniversary today!') : esc(L(`يوم على ${anniversary(s, nx.year)}`, `days to ${anniversary(s, nx.year).toLowerCase()}`))}</span></div>
				<div class="counter reveal"><b id="tr-left">–</b><span>${L('محافظة لسه مستنيانا', 'still waiting for us')}</span></div>
			</div>

			<h2 class="sec__title reveal" style="margin-top:40px">${L('رحلات عيد جوازنا', 'Our anniversary trips')}</h2>
			<div class="trip-map">
				<div class="trip-map__map reveal">${mapSVG()}</div>
				<aside class="trip-map__side panel" id="tr-side" aria-live="polite"></aside>
			</div>

			${ok ? '' : `<div class="narrow" style="margin:28px auto 0">${setupNote()}</div>`}
			<div class="an-adds"${ok ? '' : ' hidden'}>
				<details class="composer reveal" id="tr-composer">
					<summary><span>${doodle('suitcase', 22)}</span> ${Y('سجّل رحلة', 'سجّلي رحلة', 'Log a trip')}</summary>
					<form id="tr-form" autocomplete="off">
						<div class="f-row">
							<label class="f"><span>${L('سنة كام؟', 'Which year?')}</span><select name="year">${years.map((y) => `<option value="${y}"${y === (nx.days === 0 ? nx.year : nx.year - 1) ? ' selected' : ''}>${y} — ${esc(anniversary(s, y))}</option>`).join('')}</select></label>
							<label class="f f--grow"><span>${L('المحافظة', 'Governorate')}</span><select name="gov" required><option value="">—</option>${govs.map((g) => `<option value="${g.id}">${esc(L(g.ar, g.en))}</option>`).join('')}</select></label>
						</div>
						<div class="f-row">
							<label class="f f--grow"><span>${L('رحنا فين بالظبط؟', 'Where exactly?')}</span><input name="place" dir="auto" maxlength="80" placeholder="${L('المدينة، الفندق، المكان…', 'Town, hotel, place…')}"></label>
							<label class="f"><span>${L('من يوم', 'From')}</span><input name="date" type="date"></label>
						</div>
						<label class="f"><span>${L('اسم للرحلة', 'Name the trip')}</span><input name="title" dir="auto" maxlength="80"></label>
						<label class="f"><span>${L('في كلمتين', 'In a few words')}</span><textarea name="note" dir="auto" rows="3" maxlength="600"></textarea></label>
						<p class="form-msg" id="tr-msg" role="status"></p>
						<div class="f-actions"><button class="btn btn--coral" type="submit">${Y('سجّل الرحلة ♥', 'سجّلي الرحلة ♥', 'Log the trip ♥')}</button></div>
					</form>
				</details>
				<details class="composer reveal" id="an-composer">
					<summary><span>${doodle('ring', 22)}</span> ${L('ضيفوا سنة', 'Add a year')}</summary>
					<form id="an-form" autocomplete="off">
						<div class="f-row">
							<label class="f"><span>${L('السنة رقم كام؟', 'Which anniversary?')}</span><input name="n" type="number" min="1" step="1" required inputmode="numeric"></label>
							<label class="f f--grow"><span>${L('عملنا إيه؟', 'What did we do?')}</span><input name="did" dir="auto" maxlength="140"></label>
							<label class="f"><span>${L('فين؟', 'Where?')}</span><input name="where" dir="auto" maxlength="140"></label>
						</div>
						<label class="f"><span>${L('الهدايا', 'The gifts')}</span><input name="gifts" dir="auto" maxlength="140"></label>
						<label class="f"><span>${L('أحلى حاجة في اليوم ده', 'The best part of the day')}</span><textarea name="note" dir="auto" rows="2" maxlength="1200"></textarea></label>
						<label class="f"><span>${L('صورة', 'A photo')}</span><input name="photo" type="file" accept="image/*"></label>
						<p class="form-msg" id="an-msg" role="status"></p>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
					</form>
				</details>
			</div>

			<div class="hang-night" style="margin-top:48px"><h2 class="sec__title">${L('حيطة الذكريات', 'Our memory wall')}</h2><div id="tr-list"></div></div>

			<h2 class="sec__title reveal" style="margin-top:56px">${L('كل سنة جواز', 'Every year married')}</h2>
			<div id="an-top"></div>
			<div class="lp-list lp-list--anniversaries" id="an-list"></div>
		</div></section>
		${related(['gifts', 'calendar', 'journeys'])}`;
	},

	async after(main, s) {
		const svg = $('.eg', main);
		const side = $('#tr-side', main);
		const list = $('#tr-list', main);
		let trips = await loadTrips(s);
		let focus = '';

		const sideIdle = () => `<h2>${Y('دوس على أي محافظة', 'دوسي على أي محافظة', 'Tap a governorate')}</h2>
			<p class="muted">${L('الملونة رحناها في عيد جوازنا، والباقي لسه مستنينا.', 'The coloured ones are where our anniversaries took us; the rest are still waiting.')}</p>
			<button class="btn btn--coral" type="button" id="tr-draw">${doodle('dice', 18)} ${L('قرعة الرحلة الجاية', 'Draw our next trip')}</button>
			<p class="trip-pick" id="tr-pick" aria-live="polite"></p>`;

		const showGov = (id) => {
			focus = id;
			paintMap(svg, trips, { focus });
			const here = trips.filter((x) => x.gov === id);
			side.innerHTML = `<h2>${esc(govName(id))}</h2>
				${here.length ? here.map((x) => `<a class="trip-mini" href="trip.html?id=${esc(x.id)}"><b>${x.year}</b><span>${esc(anniversary(s, x.year))}${x.place ? ` · <span dir="auto">${esc(x.place)}</span>` : ''}</span><i aria-hidden="true">${App.arrow}</i></a>`).join('')
					: `<p class="muted">${L('لسه مرحناهاش… يمكن تكون الجاية؟', 'We haven’t been yet… maybe it’s next?')}</p>
					${live.canWrite() ? `<button class="btn btn--ghost btn--sm" type="button" data-log="${id}">${doodle('suitcase', 16)} ${Y('سجّل رحلة هنا', 'سجّلي رحلة هنا', 'Log a trip here')}</button>` : ''}`}
				<button class="link" type="button" id="tr-back">${L('رجوع', 'Back')}</button>`;
			$('#tr-back', side).onclick = () => { focus = ''; paintMap(svg, trips); side.innerHTML = sideIdle(); wireDraw(); };
			$('[data-log]', side)?.addEventListener('click', (e) => {
				$('#tr-form', main).gov.value = e.currentTarget.dataset.log;
				$('#tr-composer', main).open = true;
			});
		};

		/* the draw: light up the governorates we haven't been to, one after another, and stop on one */
		function wireDraw() {
			const b = $('#tr-draw', side);
			if (!b) return;
			b.onclick = async () => {
				const been = new Set(trips.map((x) => x.gov));
				const left = GOVERNORATES.filter((g) => !been.has(g.id));
				if (!left.length) { $('#tr-pick', side).textContent = L('لفينا مصر كلها!', 'We’ve seen all of Egypt!'); return; }
				b.disabled = true;
				const pick = left[Math.floor(Math.random() * left.length)];
				const steps = REDUCE ? 1 : 18;
				for (let k = 0; k < steps; k++) {
					const g = k === steps - 1 ? pick : left[Math.floor(Math.random() * left.length)];
					paintMap(svg, trips, { focus: g.id });
					await sleep(60 + k * k * 1.2);
				}
				navigator.vibrate?.([30, 60, 30]);
				$('#tr-pick', side).innerHTML = `${L('الرحلة الجاية:', 'Next trip:')} <b>${esc(L(pick.ar, pick.en))}</b>`;
				b.disabled = false;
			};
		}

		const paintTrips = () => {
			// each anniversary on the band's thread says where it took us, now the trips from the phones are in too
			for (const li of $$('.an2-years li[data-year]:not(.is-next)', main)) { const t = trips.find((x) => +x.year === +li.dataset.year); li.classList.toggle('is-been', !!t); li.querySelector('small').textContent = t ? govName(t.gov) : '—'; }
			const been = new Set(trips.map((x) => x.gov));
			$('#tr-been', main).textContent = num(been.size);
			$('#tr-left', main).textContent = num(27 - been.size);
			list.innerHTML = hangWall(trips.slice().reverse().map((x) => ({ href: `trip.html?id=${x.id}`, html: coverHTML(coverOf(x), govName(x.gov)), caption: `${x.year} · ${govName(x.gov)}`, sub: x.title || x.place || anniversary(s, x.year) })), { empty: L('الرحلة الجاية ♥', 'Our next trip ♥') });
			hydrate(list);
			live.hydrateSketches(list);
		};

		paintMap(svg, trips);
		side.innerHTML = sideIdle();
		wireDraw();
		paintTrips();
		svg.onclick = (e) => { const el = e.target.closest('[data-gov]'); if (el) showGov(el.dataset.gov); };
		svg.onkeydown = (e) => { const el = e.target.closest('[data-gov]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showGov(el.dataset.gov); } };

		const tf = $('#tr-form', main);
		tf.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#tr-msg', main);
			const item = { id: live.newId(), year: +tf.year.value, gov: tf.gov.value, place: tf.place.value.trim(), date: tf.date.value || undefined, title: tf.title.value.trim(), note: tf.note.value.trim(), by: live.me(), at: Date.now(), memories: [] };
			if (!item.gov) return tf.gov.focus();
			msg.textContent = L('بنسجل…', 'Saving…');
			try {
				await live.save('trips', (d) => { (d.items = d.items || []).push(item); });
				location.href = `trip.html?id=${item.id}`;
			} catch (err) { msg.textContent = live.why(err); }
		};

		/* every year married: a card each, newest first, and the years still waiting to be written */
		let years = await live.load('anniversaries').catch(() => ({ items: [] }));
		const w = wedding(s);
		const paintYears = () => {
			const items = [...(years.items || [])].sort((a, b) => b.n - a.n);
			const n = yearsMarried(s);
			const missing = Array.from({ length: n }, (_, i) => i + 1).filter((k) => !items.some((x) => x.n === k));
			const next = new Date(w); next.setFullYear(next.getFullYear() + n + 1);
			$('#an-top', main).innerHTML = `${missing.length ? `<p class="lp-note an-miss">${L('سنين لسه مستنية تتكتب:', 'Years still waiting to be written:')} ${missing.map((k) => `<b>${num(k)}</b>`).join(' ')}</p>` : ''}
				<p class="lp-note an-next">${L('عيد الجواز الجاي:', 'Next anniversary:')} ${num(n + 1)} — ${esc(next.toLocaleDateString(L('ar-EG', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }))}</p>`;
			$('#an-list', main).innerHTML = items.map((x) => {
				const trip = trips.find((t) => t.year === new Date(w).getFullYear() + x.n);
				return `<article class="lp-card an-card">
					<span class="an-badge">${num(x.n)}</span>
					${x.photo ? `<img class="zoom" data-sketch="${esc(x.photo)}" alt="" loading="lazy">` : ''}
					<p class="lp-k">${num(new Date(w).getFullYear() + x.n)}${x.where ? ` · ${esc(x.where)}` : ''}</p>
					${x.did ? `<h3 dir="auto">${esc(x.did)}</h3>` : ''}
					${x.gifts ? `<p dir="auto">🎁 ${esc(x.gifts)}</p>` : ''}
					${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
					${trip ? `<a class="link" href="trip.html?id=${esc(trip.id)}">${doodle('suitcase', 16)} ${L('رحلة السنة دي', 'This year’s trip')} · ${esc(govName(trip.gov))}</a>` : ''}
					${live.canWrite() && x.by === live.me() ? `<button class="link link--danger" type="button" data-an-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}
				</article>`;
			}).join('') || `<p class="empty">${L('اكتبوا أول سنة جواز ♥', 'Write our first year ♥')}</p>`;
			live.hydrateSketches($('#an-list', main));
		};
		paintYears();
		$('#an-list', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-an-del]');
			if (!del || !confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) return;
			try { years = await live.save('anniversaries', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.anDel); }); paintYears(); } catch (err) { alert(live.why(err)); }
		});
		const af = $('#an-form', main);
		af.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#an-msg', main);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const x = { id: live.newId(), n: Math.round(+af.n.value), by: live.me(), at: Date.now() };
				for (const k of ['did', 'where', 'gifts', 'note']) if (af[k].value.trim()) x[k] = af[k].value.trim();
				if (af.photo.files[0]) x.photo = await live.putSketch(await shrinkPhoto(af.photo.files[0], 1200));
				years = await live.save('anniversaries', (d) => { (d.items = d.items || []).push(x); });
				af.reset();
				msg.textContent = L('اتحفظت ♥', 'Saved ♥');
				paintYears();
			} catch (err) { msg.textContent = live.why(err); }
		};
	}
};
