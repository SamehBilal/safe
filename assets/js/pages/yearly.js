import { L, Y, esc, pageHead, related, App, $, $$, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* A photo every year: the same family photo, taken again each year. Above the title a stack of polaroids tosses the
   top one aside every few seconds to show the year before; below, a before-and-after slider to set any two years
   side by side, and every year's polaroid on the page. */

const yearTxt = (y) => (App.lang === 'ar' ? num(y).replace(/[٬,]/g, '') : String(y));

export default {
	title: { ar: 'صورة كل سنة', en: 'A photo every year' },
	render() {
		const ok = live.canWrite();
		const y = new Date().getFullYear();
		return `
		${pageHead(L('صورة كل سنة', 'A photo every year'), L('نفس الصورة كل سنة… ونشوف إحنا كبرنا قد إيه', 'The same photo every year… to see how much we’ve grown'), [{ href: 'yearly.html', ar: 'صورة كل سنة', en: 'A photo every year' }], {
			band: `<div class="yr-band" id="yr-band"></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:0 auto 30px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('camera', 22)}</span> ${Y('ضيف صورة السنة', 'ضيفي صورة السنة', 'Add this year’s photo')}</summary>
				<form id="yr-form" autocomplete="off">
					<div class="f-row">
						<label class="f"><span>${L('السنة', 'Year')}</span><input name="year" type="number" min="1980" max="${y + 1}" value="${y}" required inputmode="numeric"></label>
						<label class="f f--grow yr-drop"><span>${L('الصورة', 'Photo')}</span>
							<span class="yr-drop__pol"><span class="yr-drop__ph" id="yr-prev">${doodle('camera', 34)}<small>${Y('اختار الصورة', 'اختاري الصورة', 'Choose the photo')}</small></span></span>
							<input name="photo" type="file" accept="image/*" required></label>
					</div>
					<label class="f"><span>${L('كلمتين عن السنة دي (اختياري)', 'A few words about this year (optional)')}</span><input name="note" dir="auto" maxlength="140"></label>
					<p class="form-msg" id="yr-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('حطها في الألبوم ♥', 'حطيها في الألبوم ♥', 'Put it in the album ♥')}</button></div>
				</form>
			</details>
			<div class="yr-compare" id="yr-compare" hidden>
				<h2 class="sec__title">${L('قارن سنتين', 'Compare two years')}</h2>
				<div class="yr-pick">
					<label class="yr-tagsel"><small>${L('من', 'From')}</small><select id="yr-a" aria-label="${L('السنة الأولى', 'First year')}"></select></label>
					<span class="yr-pick__arrow" aria-hidden="true">${App.lang === 'ar' ? '⟵' : '⟶'}</span>
					<label class="yr-tagsel"><small>${L('لـ', 'To')}</small><select id="yr-b" aria-label="${L('السنة التانية', 'Second year')}"></select></label>
				</div>
				<div class="yr-frame">
					<span class="yr-frame__tape yr-frame__tape--a" aria-hidden="true"></span><span class="yr-frame__tape yr-frame__tape--b" aria-hidden="true"></span>
					<div class="yr-slide" id="yr-slide">
						<img class="yr-slide__b" id="yr-img-b" alt="">
						<div class="yr-slide__a" id="yr-clip"><img id="yr-img-a" alt=""></div>
						<span class="yr-slide__yr yr-slide__yr--a" id="yr-lab-a"></span><span class="yr-slide__yr yr-slide__yr--b" id="yr-lab-b"></span>
						<input class="yr-slide__range" id="yr-range" type="range" min="0" max="100" value="50" aria-label="${Y('حرّك عشان تقارن', 'حرّكي عشان تقارني', 'Slide to compare')}">
						<span class="yr-slide__bar" aria-hidden="true"></span>
					</div>
					<p class="yr-frame__cap">${Y('اسحب الخط عشان تشوف الفرق', 'اسحبي الخط عشان تشوفي الفرق', 'Drag the line to see the difference')}</p>
				</div>
			</div>
			<h2 class="sec__title">${L('سنة ورا سنة', 'Year after year')}</h2>
			<div class="yr-grid" id="yr-grid"></div>
		</div></section>
		${related(['gallery', 'firsts', 'calendar'])}`;
	},

	async after(main) {
		let data = await live.load('yearly');
		let timer = 0;
		this.leave = () => clearInterval(timer);
		const byYear = () => (data.items || []).slice().sort((a, b) => b.year - a.year || (b.at || 0) - (a.at || 0));

		const paint = () => {
			const list = byYear();
			/* the band: a stack of polaroids, the top one tossed aside to show the year before */
			clearInterval(timer);
			const band = $('#yr-band', main);
			const shown = list.length ? list.slice(0, 8) : [{ year: new Date().getFullYear(), empty: true }, { year: new Date().getFullYear() - 1, empty: true }, { year: new Date().getFullYear() - 2, empty: true }];
			band.innerHTML = `<div class="yr-stack">${shown.map((p, i) => `
				<figure class="yr-pol" style="--i:${i};--r:${[-4, 3, -2, 5, -5, 2, -3, 4][i % 8]}deg;z-index:${shown.length - i}" data-year="${p.year}">
					<span class="yr-pol__ph">${p.empty ? `<span class="yr-pol__q">?</span>` : `<img data-sketch="${esc(p.photo)}" alt="">`}</span>
					<figcaption>${p.empty ? L('صورة السنة دي', 'This year’s photo') : esc(p.note || yearTxt(p.year))}</figcaption>
				</figure>`).join('')}</div>
				<p class="yr-year" id="yr-year">${yearTxt(shown[0].year)}</p>`;
			live.hydrateSketches(band);
			let top = 0;
			if (shown.length > 1) timer = setInterval(() => {
				if (document.hidden) return;
				const pols = $$('.yr-pol', band);
				const cur = pols[top];
				cur.classList.add('is-tossed');
				top = (top + 1) % pols.length;
				$('#yr-year', band).textContent = yearTxt(shown[top].year);
				$('#yr-year', band).classList.remove('is-in'); void band.offsetWidth; $('#yr-year', band).classList.add('is-in');
				// the tossed one goes to the bottom of the pile
				setTimeout(() => { cur.classList.remove('is-tossed'); pols.forEach((p, i) => { p.style.zIndex = String(((i - top + pols.length) % pols.length) * -1 + pols.length); }); }, 800);
			}, 3200);

			/* every year's polaroid */
			$('#yr-grid', main).innerHTML = list.length ? list.map((p, i) => `
				<figure class="yr-card reveal is-in" style="--r:${[-2, 1.5, -1, 2][i % 4]}deg">
					<span class="yr-card__ph"><img data-sketch="${esc(p.photo)}" alt="${esc(yearTxt(p.year))}" loading="lazy"></span>
					<figcaption><b>${yearTxt(p.year)}</b>${p.note ? `<span dir="auto">${esc(p.note)}</span>` : ''}</figcaption>
					${p.by === live.me() && live.canWrite() ? `<button class="link link--danger" type="button" data-del="${esc(p.id)}">${L('مسح', 'Delete')}</button>` : ''}
				</figure>`).join('') : `<p class="empty">${L('أول صورة هتبدأ الحكاية — صورة العيلة النهارده ♥', 'The first photo starts the story — today’s family photo ♥')}</p>`;
			live.hydrateSketches($('#yr-grid', main));

			/* compare two years */
			const years = [...new Set(list.map((p) => p.year))];
			const cmp = $('#yr-compare', main);
			cmp.hidden = years.length < 2;
			if (years.length >= 2) {
				const opts = years.map((y) => `<option value="${y}">${yearTxt(y)}</option>`).join('');
				const a = $('#yr-a', main), b = $('#yr-b', main);
				a.innerHTML = opts; b.innerHTML = opts;
				a.value = String(years[years.length - 1]); b.value = String(years[0]);
				const show = () => {
					const pa = list.find((p) => String(p.year) === a.value), pb = list.find((p) => String(p.year) === b.value);
					$('#yr-lab-a', main).textContent = yearTxt(+a.value);
					$('#yr-lab-b', main).textContent = yearTxt(+b.value);
					if (pa) live.sketchURL(pa.photo).then((u) => { $('#yr-img-a', main).src = u; }).catch(() => {});
					if (pb) live.sketchURL(pb.photo).then((u) => { $('#yr-img-b', main).src = u; }).catch(() => {});
				};
				a.onchange = b.onchange = show;
				show();
			}
		};
		const range = $('#yr-range', main);
		range.oninput = () => $('#yr-slide', main).style.setProperty('--at', `${range.value}%`);

		$('#yr-grid', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]');
			if (!del || !confirm(Y('تمسح الصورة دي؟', 'تمسحي الصورة دي؟', 'Delete this photo?'))) return;
			try { data = await live.save('yearly', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); paint(); } catch (err) { alert(live.why(err)); }
		});
		const form = $('#yr-form', main);
		const prev = $('#yr-prev', main), blank = prev.innerHTML;
		form.photo.onchange = () => {
			const file = form.photo.files[0];
			if (!file) { prev.innerHTML = blank; return; }
			const u = URL.createObjectURL(file);
			prev.innerHTML = `<img src="${u}" alt="">`;
			prev.firstChild.onload = () => URL.revokeObjectURL(u);
		};
		form.addEventListener('reset', () => { prev.innerHTML = blank; });
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#yr-msg', main);
			const file = form.photo.files[0];
			if (!file) return;
			msg.textContent = L('بنحفظ…', 'Saving…');
			try {
				const photo = await live.putSketch(await shrinkPhoto(file, 1400));
				const p = { id: live.newId(), year: Math.round(+form.year.value), photo, note: form.note.value.trim() || undefined, by: live.me(), at: Date.now() };
				data = await live.save('yearly', (d) => { (d.items = d.items || []).push(p); });
				form.reset(); form.year.value = String(new Date().getFullYear());
				msg.textContent = L('اتحطت ♥', 'Added ♥');
				paint();
			} catch (err) { msg.textContent = live.why(err); }
		};
		paint();
	}
};
