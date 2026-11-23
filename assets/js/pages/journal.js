import { L, Y, T, esc, pageHead, related, App, $, $$, longDate, store, REDUCE, num } from '../shell.js';
import { doodle, MOODS, doodleName } from '../doodles.js';
import * as live from '../live.js';
import { openSketch } from '../sketch.js';


const DRAFT = 'us.draft.journal';

/* Our journal: pages you both write. An entry can also be pinned to the story timeline.
   The top is the notebook lying open on a spiral: on one page a page of ours picked at random (its date, mood, title
   and the start of it — «صفحة تانية» turns to another, «اقرا الصفحة» goes to it), on the other how many pages, who wrote
   how many, the years they cover, the moods we wrote in most, and «write a new page».
   Every page below is a sheet of lined paper with a red margin: the date in handwriting, the mood as a sticker, the
   title and the words; when a page was written in Franco and translated, the translation sits apart under it; the
   photo of the page itself is taped beside it. Each month is a strip of washi tape with how many pages it holds. */
const SPLIT = /\n\n— بالعربي:\s*/;
const yr = (d) => String(d || '').slice(0, 4);
const MOOD_NAME = { love: ['حب', 'Love'], smitten: ['مغرمين', 'Smitten'], laugh: ['ضحك', 'Laughing'], teary: ['دموع', 'Teary'], calm: ['هدوء', 'Calm'], party: ['فرحة', 'Celebrating'], sleepy: ['نعسانين', 'Sleepy'], sick: ['تعبانين', 'Unwell'], angry: ['زعلانين', 'Upset'], rain: ['مطر', 'Rainy'] };
export default {
	title: { ar: 'دفترنا', en: 'Our journal' },
	render() {
		const ok = live.canWrite();
		return `<section class="sec sec--top jh-top"><div class="wrap"><div class="jh" id="jh" aria-live="polite"><p class="empty">${L('بنفتح الدفتر…', 'Opening the journal…')}</p></div></div></section>
		${pageHead(L('دفترنا', 'Our journal'), L('هنا بنكتب حكايتنا سوا — كل واحد بقلمه', 'Where we write our story together — each in our own hand'), [{ href: 'journal.html', ar: 'دفترنا', en: 'Our journal' }], { band: '' })}
		<section class="sec"><div class="wrap journal-wrap">
			${ok ? '' : setupNote()}
			<div class="toolbar">
				<div class="chips" role="toolbar" aria-label="${L('مين كتب', 'Written by')}">
					<button class="chip is-on" type="button" data-by="">${L('الكل', 'All')}</button>
					<button class="chip" type="button" data-by="him">${T(App.story.him)}</button>
					<button class="chip" type="button" data-by="her">${T(App.story.her)}</button>
				</div>
				<div class="toolbar__end">
					<input class="search" id="jr-q" type="search" dir="auto" placeholder="${Y('دوّر في الدفتر…', 'دوّري في الدفتر…', 'Search the journal…')}" aria-label="${L('بحث', 'Search')}">
					${ok ? `<button type="button" class="btn btn--coral btn--sm" id="jr-new" aria-controls="composer" aria-expanded="false">${doodle('pen', 18)} ${Y('اكتب صفحة جديدة', 'اكتبي صفحة جديدة', 'Write a new page')}</button>` : ''}
				</div>
			</div>
			<details class="composer" id="composer" data-own-button${ok ? '' : ' hidden'}>
				<summary><span>${doodle('pen', 22)}</span> ${Y('اكتب صفحة جديدة', 'اكتبي صفحة جديدة', 'Write a new page')}</summary>
				<form id="jr-form" autocomplete="off">
					<div class="f-row">
						<label class="f"><span>${L('اليوم', 'Date')}</span><input type="date" name="date" required></label>
						<label class="f f--grow"><span>${L('العنوان', 'Title')}</span><input name="title" dir="auto" maxlength="120" placeholder="${L('النهارده…', 'Today…')}"></label>
					</div>
					<label class="f"><span>${L('حصل إيه؟', 'What happened?')}</span><textarea name="text" dir="auto" rows="7" required placeholder="${Y('اكتب براحتك…', 'اكتبي براحتك…', 'Write as much as you like…')}"></textarea></label>
					<fieldset class="moods"><legend>${L('المود', 'Mood')}</legend>${MOODS.map((m, k) => `<label><input type="radio" name="mood" value="${m}"${k === 0 ? ' checked' : ''}><span>${doodle(m, 28)}</span></label>`).join('')}</fieldset>
					<label class="check"><input type="checkbox" name="timeline"> ${Y('ضيف اليوم ده لحكايتنا (التايم لاين)', 'ضيفي اليوم ده لحكايتنا (التايم لاين)', 'Add this day to our story timeline')}</label>
					<div class="sketch-attach" id="jr-sketch"></div>
					<p class="form-msg" id="jr-msg" role="status"></p>
					<div class="f-actions">
						<button type="button" class="btn btn--ghost" id="jr-draw">${doodle('pencil', 18)} ${Y('ارسم حاجة', 'ارسمي حاجة', 'Add a sketch')}</button>
						<button type="button" class="btn btn--ghost" id="jr-cancel" hidden>${L('إلغاء التعديل', 'Cancel edit')}</button>
						<button type="submit" class="btn btn--coral" id="jr-save">${Y('احفظ في الدفتر ♥', 'احفظي في الدفتر ♥', 'Save to the journal ♥')}</button>
					</div>
				</form>
			</details>
			<div id="jr-list" class="journal" aria-live="polite"><p class="empty">${L('بنفتح الدفتر…', 'Opening the journal…')}</p></div>
		</div></section>
		${related(['story', 'music', 'draw'])}`;
	},

	async after(main, s) {
		const form = $('#jr-form', main);
		const list = $('#jr-list', main);
		let data = { items: [] };
		let by = '';
		let q = '';
		let editing = null;
		let sketchBlob = null;
		let sketchId = null;

		const name = (who) => T(who === 'him' ? s.him : s.her);
		/* the notebook lying open at the top: a page picked at random on one side, the numbers on the other */
		let pick = null;
		const hero = () => {
			const box = $('#jh', main);
			const all = (data.items || []).filter((x) => x.text || x.title);
			if (!all.length) { box.innerHTML = `<p class="empty">${Y('الدفتر لسه فاضي… اكتب أول صفحة ♥', 'الدفتر لسه فاضي… اكتبي أول صفحة ♥', 'The journal is still empty… write the first page ♥')}</p>`; return; }
			const others = all.filter((x) => x !== pick);
			const pool = others.length ? others : all;
			pick = pool[Math.floor(Math.random() * pool.length)];
			const him = all.filter((x) => x.by === 'him').length, her = all.length - him;
			const years = all.map((x) => yr(x.date)).filter(Boolean).sort();
			const moods = {};
			for (const x of all) { const k = doodleName(x.mood) || x.mood; if (k) moods[k] = (moods[k] || 0) + 1; }
			const top = Object.entries(moods).sort((p, r) => r[1] - p[1]).slice(0, 4);
			const own = String(pick.text || '').split(SPLIT)[0];
			const pct = Math.round((him / all.length) * 100);
			const y0 = years.length ? num(+years[0]).replace(/[٬,]/g, '') : '', y1 = years.length ? num(+years.at(-1)).replace(/[٬,]/g, '') : '';
			box.innerHTML = `<div class="jh-book">
				<div class="jh-page jh-page--pick">
					<p class="jh-tag">${doodle('dice', 15)} ${L('صفحة من الدفتر', 'A page from the journal')}</p>
					<div class="jh-pick__hd"><span class="jp-mood">${doodle(pick.mood, 30)}</span><time class="jp-date">${longDate(pick.date)}</time></div>
					<h3 dir="auto">${esc(pick.title || longDate(pick.date))}</h3>
					<p class="jh-pick__tx" dir="auto">${esc(own)}</p>
					<p class="jh-pick__by">— ${name(pick.by)}</p>
					<div class="jh-btns"><a class="btn btn--sm" href="#${esc(pick.id)}" data-go>${doodle('book', 16)} ${Y('اقرا الصفحة', 'اقري الصفحة', 'Read the page')}</a><button class="btn btn--sm btn--ghost" type="button" id="jh-next">${doodle('shuffle', 16)} ${L('صفحة تانية', 'Another page')}</button></div>
				</div>
				<span class="jh-spiral" aria-hidden="true"></span>
				<div class="jh-page jh-page--facts">
					<p class="jh-count"><b>${num(all.length)}</b> <span>${L('صفحة كتبناها', all.length === 1 ? 'page we wrote' : 'pages we wrote')}</span></p>
					${years.length ? `<p class="jh-years">${doodle('calendar', 15)} ${L(`من ${y0} لـ ${y1}`, `from ${years[0]} to ${years.at(-1)}`)}</p>` : ''}
					<div class="jh-split" role="img" aria-label="${esc(`${name('him')} ${him}، ${name('her')} ${her}`)}"><span class="jh-split__bar"><i class="is-him" style="width:${pct}%"></i><i class="is-her" style="width:${100 - pct}%"></i></span><span class="jh-split__who"><span class="is-him">${name('him')} <b>${num(him)}</b></span><span class="is-her">${name('her')} <b>${num(her)}</b></span></span></div>
					${top.length ? `<p class="jh-moods-h">${L('كتبنا وإحنا…', 'We wrote while…')}</p><ul class="jh-moods">${top.map(([k, n]) => `<li>${doodle(k, 26)}<span>${esc(L(...(MOOD_NAME[k] || [k, k])))}</span><b>${num(n)}</b></li>`).join('')}</ul>` : ''}
					${live.canWrite() ? `<button class="btn btn--coral btn--sm" type="button" id="jh-write">${doodle('pen', 16)} ${Y('اكتب صفحة جديدة', 'اكتبي صفحة جديدة', 'Write a new page')}</button>` : ''}
				</div>
			</div>`;
			$('#jh-next', box).onclick = hero;
			const w = $('#jh-write', box);
			if (w) w.onclick = () => $('#jr-new', main)?.click();
			$('[data-go]', box).onclick = (e) => {
				e.preventDefault();
				by = ''; q = '';
				const qi = $('#jr-q', main); if (qi) qi.value = '';
				$$('.chip', main).forEach((c) => c.classList.toggle('is-on', !c.dataset.by));
				paint();
				const el = document.getElementById(pick.id);
				el?.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
				el?.classList.add('is-found');
				setTimeout(() => el?.classList.remove('is-found'), 2200);
			};
		};
		const paint = () => {
			const items = (data.items || [])
				.filter((x) => (!by || x.by === by) && (!q || `${x.title} ${x.text}`.toLowerCase().includes(q)))
				.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.at || 0) - (a.at || 0));
			if (!items.length) {
				list.innerHTML = `<p class="empty">${data.items?.length ? L('مفيش صفحات بالشكل ده', 'No pages match') : Y('الدفتر لسه فاضي… اكتب أول صفحة ♥', 'الدفتر لسه فاضي… اكتبي أول صفحة ♥', 'The journal is still empty… write the first page ♥')}</p>`;
				return;
			}
			const loc = App.lang === 'ar' ? 'ar-EG' : 'en-GB';
			const perMonth = {};
			for (const x of items) { const m = (x.date || '').slice(0, 7); perMonth[m] = (perMonth[m] || 0) + 1; }
			let month = '';
			list.innerHTML = items.map((x) => {
				const m = (x.date || '').slice(0, 7);
				const head = m !== month ? `<h2 class="jp-month"><span>${new Date(m + '-01T00:00').toLocaleDateString(loc, { month: 'long', year: 'numeric' })}</span><small>${L(`${num(perMonth[m])} ${perMonth[m] === 1 ? 'صفحة' : 'صفحات'}`, `${perMonth[m]} page${perMonth[m] === 1 ? '' : 's'}`)}</small></h2>` : '';
				month = m;
				const mine = x.by === live.me();
				const [own, tr] = String(x.text || '').split(SPLIT);
				return `${head}<article class="jp-page jp-page--${x.by === 'him' ? 'him' : 'her'}${x.sketch ? ' has-snap' : ''}" id="${esc(x.id)}">
					<div class="jp-paper">
						<span class="jp-mood" title="${esc(L(...(MOOD_NAME[doodleName(x.mood)] || ['', ''])))}">${doodle(x.mood, 30)}</span>
						<time class="jp-date" datetime="${esc(x.date || '')}">${longDate(x.date)}</time>
						<h3 dir="auto">${esc(x.title || longDate(x.date))}</h3>
						<div class="jp-text" dir="auto">${esc(own)}</div>
						${tr ? `<div class="jp-tr" dir="rtl"><small>${L('بالعربي', 'In Arabic')}</small>${esc(tr)}</div>` : ''}
						<footer class="jp-foot"><span>— ${name(x.by)}</span>${x.timeline ? `<a href="story.html#t-${esc(x.id)}">${doodle('pin', 14)} ${L('في حكايتنا', 'on our timeline')}</a>` : ''}${mine && live.canWrite() ? `<span class="jp-act"><button type="button" class="link" data-edit="${esc(x.id)}">${L('تعديل', 'Edit')}</button><button type="button" class="link link--danger" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button></span>` : ''}</footer>
					</div>
					${x.sketch ? `<figure class="jp-snap"><img class="zoom" data-sketch="${esc(x.sketch)}" alt="${esc(L('الصفحة نفسها', 'The page itself'))}"></figure>` : ''}
				</article>`;
			}).join('');
			live.hydrateSketches(list);
			if (location.hash) document.getElementById(location.hash.slice(1).replace(/[^\w-]/g, ''))?.scrollIntoView({ block: 'center' });
		};

		data = await live.load('journal');
		paint();
		hero();

		$$('.chip', main).forEach((c) => (c.onclick = () => { by = c.dataset.by; $$('.chip', main).forEach((x) => x.classList.toggle('is-on', x === c)); paint(); }));
		$('#jr-q', main).oninput = (e) => { q = e.target.value.trim().toLowerCase(); paint(); };
		if (!form) return;

		/* the composer: today's date, and whatever was left unsaved last time */
		const msg = $('#jr-msg', main);
		const reset = () => {
			form.reset();
			form.date.value = live.today();
			editing = null; sketchBlob = null; sketchId = null;
			$('#jr-sketch', main).innerHTML = '';
			$('#jr-cancel', main).hidden = true;
			$('#jr-save', main).textContent = Y('احفظ في الدفتر ♥', 'احفظي في الدفتر ♥', 'Save to the journal ♥');
		};
		reset();
		try { const d = JSON.parse(store.get(DRAFT) || 'null'); if (d) { form.title.value = d.title || ''; form.text.value = d.text || ''; } } catch { /* no draft */ }
		form.oninput = () => { if (!editing) store.set(DRAFT, JSON.stringify({ title: form.title.value, text: form.text.value })); };

		const showSketch = (url) => { $('#jr-sketch', main).innerHTML = url ? `<img src="${url}" alt=""><button type="button" class="link link--danger" id="jr-unsketch">${L('شيلي الرسمة', 'Remove sketch')}</button>` : ''; const b = $('#jr-unsketch', main); if (b) b.onclick = () => { sketchBlob = null; sketchId = null; showSketch(''); }; };
		$('#jr-draw', main).onclick = async () => {
			const blob = await openSketch({ title: form.title.value || L('رسمة للدفتر', 'A sketch for the journal') });
			if (blob) { sketchBlob = blob; sketchId = null; showSketch(URL.createObjectURL(blob)); }
		};
		$('#jr-cancel', main).onclick = reset;
		/* «write a new page» beside the search opens the form right under it; the form's own × folds it away */
		const composer = $('#composer', main);
		const newBtn = $('#jr-new', main);
		composer.addEventListener('toggle', () => { newBtn?.classList.toggle('is-on', composer.open); newBtn?.setAttribute('aria-expanded', String(composer.open)); });
		if (newBtn) newBtn.onclick = () => {
			composer.open = !composer.open;
			if (composer.open) { composer.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest' }); form.text.focus({ preventScroll: true }); }
		};

		list.addEventListener('click', async (e) => {
			const ed = e.target.closest('[data-edit]');
			const del = e.target.closest('[data-del]');
			if (ed) {
				const x = data.items.find((i) => i.id === ed.dataset.edit);
				if (!x) return;
				editing = x.id;
				form.date.value = x.date; form.title.value = x.title || ''; form.text.value = x.text || '';
				form.timeline.checked = !!x.timeline;
				const m = form.querySelector(`input[name=mood][value="${doodleName(x.mood) || x.mood}"]`); if (m) m.checked = true;
				sketchId = x.sketch || null; sketchBlob = null;
				if (sketchId) live.sketchURL(sketchId).then(showSketch).catch(() => {}); else showSketch('');
				$('#jr-cancel', main).hidden = false;
				$('#jr-save', main).textContent = Y('احفظ التعديل', 'احفظي التعديل', 'Save changes');
				$('#composer', main).open = true;
				$('#composer', main).scrollIntoView({ behavior: 'smooth' });
			} else if (del) {
				if (!confirm(Y('تمسح الصفحة دي من الدفتر؟', 'تمسحي الصفحة دي من الدفتر؟', 'Delete this page from the journal?'))) return;
				try { data = await live.save('journal', (d) => { d.items = (d.items || []).filter((i) => i.id !== del.dataset.del); }); paint(); }
				catch (err) { alert(live.why(err)); }
			}
		});

		form.onsubmit = async (e) => {
			e.preventDefault();
			const btn = $('#jr-save', main);
			btn.disabled = true;
			msg.textContent = L('بنحفظ…', 'Saving…');
			try {
				if (sketchBlob) sketchId = await live.putSketch(sketchBlob);
				const entry = {
					id: editing || live.newId(),
					date: form.date.value || live.today(),
					title: form.title.value.trim(),
					text: form.text.value.trim(),
					mood: form.mood.value,
					timeline: form.timeline.checked,
					sketch: sketchId || undefined,
					by: live.me()
				};
				data = await live.save('journal', (d) => {
					d.items = d.items || [];
					const old = d.items.find((i) => i.id === entry.id);
					if (old) Object.assign(old, entry, { by: old.by, edited: Date.now() });
					else d.items.push({ ...entry, at: Date.now() });
				});
				store.del(DRAFT);
				reset();
				$('#composer', main).open = false;
				msg.textContent = L('اتحفظت في الدفتر ♥', 'Saved to the journal ♥');
				paint();
				$('#' + entry.id, list)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} catch (err) {
				msg.textContent = live.why(err);
			} finally {
				btn.disabled = false;
			}
		};
	}
};

export function setupNote() {
	return `<a class="setup-note reveal" href="settings.html">${doodle('gear', 28)} <span><b>${Y('عشان تكتب هنا، قول مين ماسك الموبايل', 'عشان تكتبي هنا، قولي مين ماسك الموبايل', 'To write here, say whose phone this is')}</b><small>${L('مرة واحدة بس، من صفحة الإعدادات', 'Just once, on the settings page')}</small></span><span aria-hidden="true">${App.arrow}</span></a>`;
}
