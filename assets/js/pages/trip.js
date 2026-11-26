import { L, Y, T, esc, pageHead, related, App, $, $$, qs, longDate, img, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { openSketch } from '../sketch.js';
import { hangWall } from '../hang.js';
import { setupNote } from './journal.js';
import { loadTrips, govName, anniversary, mapSVG, paintMap, shrinkPhoto, coverOf, coverHTML } from './trips.js';

/* One anniversary trip: where, when, and every memory either of us added — photos hang on the light strings,
   notes and sketches sit below. The top is a postcard from the trip: its first photo taped on one half; on the other
   «greetings from» the governorate in big script, which anniversary it was, the date and the place, what we wrote about
   it on the card's lines, a stamp in the corner with Egypt and that governorate coloured, and a postmark with the year.
   Under it the trips either side and which one this is. */
export default {
	title: { ar: 'رحلة', en: 'A trip' },
	async load(s) { this.trips = await loadTrips(s); },
	render(s) {
		const trips = this.trips || [];
		const k = trips.findIndex((x) => x.id === qs('id'));
		const x = trips[k];
		if (!x) return `${pageHead(L('مش لاقي الرحلة دي', 'Trip not found'), '', [{ href: 'anniversaries.html', ar: 'عيد جوازنا', en: 'Our anniversaries' }])}<p class="center"><a class="btn" href="anniversaries.html">${L('كل الرحلات', 'All trips')}</a></p>`;
		this.title = { ar: `${govName(x.gov)} ${x.year}`, en: `${govName(x.gov)} ${x.year}` };
		this.trip = x;
		const prev = trips[k - 1], next = trips[k + 1];
		const ok = live.canWrite();
		const name = (w) => T(w === 'him' ? s.him : s.her);
		const photos = [...(x.photos || []).map((p) => ({ html: img(typeof p === 'string' ? p : p.photo, '', 'zoom'), caption: typeof p === 'string' ? '' : App.t(p.caption) })),
			...x.memories.filter((m) => m.img).map((m) => ({ html: `<img class="zoom" data-sketch="${esc(m.img)}" alt="">`, caption: m.text || '', sub: m.by ? App.t(m.by === 'him' ? s.him : s.her) : '' }))];
		const notes = x.memories.filter((m) => !m.img || m.sketch);
		const cover = coverOf(x);
		const ann = anniversary(s, x.year);
		const yr = App.lang === 'ar' ? String(x.year).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(x.year);
		return `
		<section class="sec sec--top tp2-top"><div class="wrap">
			<div class="tp2">
				<figure class="tp2-ph">
					<span class="tp2-ph__none">${doodle('suitcase', 80)}</span>
					${cover ? `<span class="tp2-ph__img" data-media-box>${coverHTML(cover, govName(x.gov))}</span>` : ''}
					<span class="tp2-tape" aria-hidden="true"></span>
				</figure>
				<div class="tp2-back">
					<span class="tp2-stamp" aria-hidden="true">${mapSVG('eg--mini')}<small>${esc(govName(x.gov))}</small></span>
					<span class="tp2-post" aria-hidden="true"><small>${L('عيد جوازنا', 'Anniversary')}</small><b>${yr}</b></span>
					${ann ? `<p class="tp2-k">${doodle('ring', 15)} ${esc(ann)}</p>` : ''}
					<h2 class="tp2-t"><small>${L('تحيات من', 'Greetings from')}</small>${esc(govName(x.gov))}</h2>
					<ul class="tp2-lines">
						${x.date ? `<li>${doodle('calendar', 16)} ${longDate(x.date)}</li>` : ''}
						${x.place ? `<li dir="auto">${doodle('pin', 16)} ${esc(x.place)}</li>` : ''}
						${x.title && x.title.trim() !== ann ? `<li class="is-big" dir="auto">${esc(x.title)}</li>` : ''}
						${x.note ? `<li class="is-note" dir="auto">${esc(x.note)}</li>` : ''}
						${photos.length ? `<li>${doodle('camera', 16)} ${L(`${photos.length} صورة من الرحلة`, `${photos.length} photo${photos.length === 1 ? '' : 's'} from the trip`)}</li>` : ''}
					</ul>
					${x.by ? `<p class="tp2-sign">— ${L('سجّلها', 'logged by')} ${name(x.by)}</p>` : '<p class="tp2-sign">♥</p>'}
				</div>
			</div>
			<nav class="tp2-nav" aria-label="${L('رحلات تانية', 'Other trips')}">
				${prev ? `<a href="trip.html?id=${esc(prev.id)}">${doodle(L('forward', 'back'), 16)} <span><small>${L('اللي قبلها', 'Before')}</small><b>${prev.year} · ${esc(govName(prev.gov))}</b></span></a>` : '<span></span>'}
				<span class="tp2-nav__n">${L(`رحلة ${k + 1} من ${trips.length}`, `Trip ${k + 1} of ${trips.length}`).replace(/\d/g, (d) => (App.lang === 'ar' ? '٠١٢٣٤٥٦٧٨٩'[d] : d))}</span>
				${next ? `<a href="trip.html?id=${esc(next.id)}"><span><small>${L('اللي بعدها', 'After')}</small><b>${next.year} · ${esc(govName(next.gov))}</b></span> ${doodle(L('back', 'forward'), 16)}</a>` : '<span></span>'}
			</nav>
		</div></section>
		${pageHead(`${govName(x.gov)} ${x.year}`, [ann, x.place].filter(Boolean).join(' · '), [{ href: 'anniversaries.html', ar: 'عيد جوازنا', en: 'Our anniversaries' }, { href: '#', label: govName(x.gov) }], { band: '' })}
		<section class="sec sec--top"><div class="wrap">
			${photos.length ? `<div class="hang-night"><h2 class="sec__title">${L('صور الرحلة', 'Trip photos')}</h2>${hangWall(photos)}</div>` : ''}

			${ok ? `<details class="composer reveal" id="mem-composer" style="margin-top:28px"${photos.length || notes.length ? '' : ' open'}>
				<summary><span>${doodle('camera', 22)}</span> ${Y('ضيف ذكرى من الرحلة', 'ضيفي ذكرى من الرحلة', 'Add a memory from the trip')}</summary>
				<form id="mem-form" autocomplete="off">
					<label class="f"><span>${L('فاكرين إيه؟', 'What do you remember?')}</span><textarea name="text" dir="auto" rows="3" maxlength="800"></textarea></label>
					<div class="photo-pick" id="mem-preview"></div>
					<p class="form-msg" id="mem-msg" role="status"></p>
					<div class="f-actions">
						<label class="btn btn--ghost file-btn">${doodle('camera', 18)} ${L('صور', 'Photos')}<input type="file" name="photos" accept="image/*" multiple></label>
						<button class="btn btn--ghost" type="button" id="mem-draw">${doodle('pencil', 18)} ${L('رسمة', 'Sketch')}</button>
						<button class="btn btn--coral" type="submit">${Y('احفظ الذكرى ♥', 'احفظي الذكرى ♥', 'Save the memory ♥')}</button>
					</div>
				</form>
			</details>` : `<div class="narrow" style="margin:28px auto 0">${setupNote()}</div>`}

			${notes.length ? `<div class="memories">${notes.map((m) => `
				<article class="memory memory--${m.by === 'him' ? 'him' : 'her'}">
					${m.sketch ? `<img class="zoom" data-sketch="${esc(m.sketch)}" alt="${L('رسمة', 'Sketch')}">` : ''}
					${m.text ? `<p dir="auto">${esc(m.text)}</p>` : ''}
					<footer><span>${m.by ? name(m.by) : ''}</span>${m.by === live.me() && ok ? `<button class="link link--danger" type="button" data-del="${esc(m.id)}">${L('مسح', 'Delete')}</button>` : ''}</footer>
				</article>`).join('')}</div>` : ''}

			<nav class="pager" aria-label="${L('رحلات تانية', 'Other trips')}">
				${prev ? `<a class="pager__prev" href="trip.html?id=${esc(prev.id)}"><small>${L('اللي قبلها', 'Before')}</small><b>${prev.year} · ${esc(govName(prev.gov))}</b></a>` : '<span></span>'}
				${next ? `<a class="pager__next" href="trip.html?id=${esc(next.id)}"><small>${L('اللي بعدها', 'After')}</small><b>${next.year} · ${esc(govName(next.gov))}</b></a>` : '<span></span>'}
			</nav>
		</div></section>
		${related(['anniversaries', 'gallery', 'journal'])}`;
	},

	after(main, s) {
		const x = this.trip;
		if (!x) return;
		const svg = $('.eg--mini', main);
		if (svg) paintMap(svg, this.trips.filter((y) => y.gov === x.gov), { focus: x.gov });
		hydrate(main);
		live.hydrateSketches(main);

		main.onclick = async (e) => {
			const del = e.target.closest('[data-del]');
			if (!del || !confirm(Y('تمسح الذكرى دي؟', 'تمسحي الذكرى دي؟', 'Delete this memory?'))) return;
			try { await live.save('trips', (d) => { const t = (d.items || []).find((y) => y.id === x.id); if (t) t.memories = (t.memories || []).filter((m) => m.id !== del.dataset.del); }); location.reload(); }
			catch (err) { alert(live.why(err)); }
		};

		const form = $('#mem-form', main);
		if (!form) return;
		let sketch = null;
		const preview = $('#mem-preview', main);
		const showPicks = () => {
			preview.innerHTML = [...form.photos.files].map((f) => `<img src="${URL.createObjectURL(f)}" alt="">`).join('') + (sketch ? `<img src="${URL.createObjectURL(sketch)}" alt="">` : '');
		};
		form.photos.onchange = showPicks;
		$('#mem-draw', main).onclick = async () => { const b = await openSketch({ title: `${govName(x.gov)} ${x.year}` }); if (b) { sketch = b; showPicks(); } };

		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#mem-msg', main);
			const text = form.text.value.trim();
			const files = [...form.photos.files];
			if (!text && !files.length && !sketch) return form.text.focus();
			const btn = form.querySelector('[type=submit]');
			btn.disabled = true;
			try {
				const add = [];
				for (const [n, f] of files.entries()) {
					msg.textContent = L(`بنرفع الصورة ${n + 1} من ${files.length}…`, `Uploading photo ${n + 1} of ${files.length}…`);
					add.push({ id: live.newId(), img: await live.putSketch(await shrinkPhoto(f)), text: n === 0 && !sketch ? text : '', by: live.me(), at: Date.now() });
				}
				if (sketch) add.push({ id: live.newId(), sketch: await live.putSketch(sketch), text: files.length ? '' : text, by: live.me(), at: Date.now() });
				if (!files.length && !sketch) add.push({ id: live.newId(), text, by: live.me(), at: Date.now() });
				msg.textContent = L('بنحفظ…', 'Saving…');
				await live.save('trips', (d) => {
					d.items = d.items || [];
					let t = d.items.find((y) => y.id === x.id);
					// a trip from story.json gets its phone memories stored under the same id
					if (!t) d.items.push((t = { id: x.id, memories: [] }));
					(t.memories = t.memories || []).push(...add);
				});
				location.reload();
			} catch (err) { msg.textContent = live.why(err); btn.disabled = false; }
		};
	}
};
