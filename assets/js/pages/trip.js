import { L, Y, T, esc, pageHead, related, App, $, $$, qs, longDate, img, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { openSketch } from '../sketch.js';
import { hangWall } from '../hang.js';
import { setupNote } from './journal.js';
import { loadTrips, govName, anniversary, mapSVG, paintMap, shrinkPhoto } from './trips.js';

/* One anniversary trip: where, when, and every memory either of us added — photos hang on the light strings,
   notes and sketches sit below. */
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
		return `
		${pageHead(`${govName(x.gov)} ${x.year}`, [anniversary(s, x.year), x.place].filter(Boolean).join(' · '), [{ href: 'anniversaries.html', ar: 'عيد جوازنا', en: 'Our anniversaries' }, { href: '#', label: govName(x.gov) }])}
		<section class="sec sec--top"><div class="wrap">
			<div class="trip-hero panel reveal">
				<div class="trip-hero__facts">
					${x.title ? `<h2 dir="auto">${esc(x.title)}</h2>` : ''}
					${x.date ? `<p>${doodle('calendar', 18)} ${longDate(x.date)}</p>` : ''}
					${x.note ? `<p class="lede" style="text-align:start" dir="auto">${esc(x.note)}</p>` : ''}
					${x.by ? `<p class="muted">${L('سجّلها', 'Logged by')} ${name(x.by)}</p>` : ''}
				</div>
				${mapSVG('eg--mini')}
			</div>

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
