import { L, Y, esc, pageHead, related, App, $, $$, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* Our goals: one big sheet of white paper with every thing we want scattered over it — a car, a PlayStation, a coffee
   machine, a drill, the marbles and tazos of when we were little — each cut out of its picture. Tap one when we've got
   it and a red marker crosses it out, with the day under it; «شطبنا كام» counts them up top. Kept in the shared list
   content/live/goals.bin (each picture a sketch in content/live/s/), like the wishes. */

export const KINDS = [
	{ id: 'play', ar: 'ألعاب', en: 'Games', ic: 'dice' },
	{ id: 'tech', ar: 'أجهزة', en: 'Gadgets', ic: 'phone' },
	{ id: 'desk', ar: 'المكتب', en: 'The desk', ic: 'pen' },
	{ id: 'home', ar: 'البيت', en: 'Home', ic: 'house' },
	{ id: 'tools', ar: 'عِدّة', en: 'Tools', ic: 'gear' },
	{ id: 'ride', ar: 'عربيات وعجل', en: 'Rides', ic: 'scooter' },
	{ id: 'kids', ar: 'من طفولتنا', en: 'From when we were kids', ic: 'star' }
];
/* a sheet for each of us (the family in story.json) and one for the whole family; things saved before the boards
   were on Sameh's sheet */
const FAMILY = { id: 'family', name: { ar: 'العيلة كلها', en: 'The whole family' }, color: '#26706b' };
const boardsOf = (s) => [...(s.family?.members || []), FAMILY];
const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[3];
const name = (g) => L(g.title, g.en || g.title);
// a steady little tilt for each thing, from its id
const tilt = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h % 7) - 3) * 0.9; };

export default {
	title: { ar: 'أهدافنا', en: 'Our goals' },
	render(s) {
		const ok = live.canWrite();
		const boards = boardsOf(s);
		return `
		${pageHead(L('أهدافنا', 'Our goals'), L('كل حاجة نفسنا فيها على ورقة واحدة — واللي نجيبها نشطبها', 'Everything we want on one sheet of paper — and whatever we get, we cross out'), [{ href: 'goals.html', ar: 'أهدافنا', en: 'Our goals' }], {
			/* above the title: a little spiral notebook, «نفسنا في…» at the top and five of our things on its lines, a red
			   marker crossing them out one after another; then the page turns to five more */
			band: `<div class="gl-band" aria-hidden="true">
				<div class="gl-pad">
					<span class="gl-pad__rings">${'<i></i>'.repeat(9)}</span>
					<b class="gl-pad__h">${L('نفسنا في…', 'We wish for…')}</b>
					<ol class="gl-pad__list" id="gl-pad"></ol>
				</div>
				<svg class="gl-marker" viewBox="0 -40 200 120"><g transform="rotate(-18 100 20)"><rect x="30" y="10" width="130" height="20" rx="6" fill="#e0312b" stroke="#37353f" stroke-width="2"/><rect x="150" y="8" width="34" height="24" rx="6" fill="#37353f"/><path d="M30 13 10 18v4l20 5Z" fill="#fbe9e7" stroke="#37353f" stroke-width="2" stroke-linejoin="round"/><path d="M10 18v4l-4-2Z" fill="#e0312b"/><rect x="60" y="14" width="60" height="4" rx="2" fill="#fff" opacity=".5"/></g></svg>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<div class="gl-count" id="gl-count"></div>
			<details class="composer reveal narrow" style="margin:0 auto 26px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('star', 22)}</span> ${Y('ضيف حاجة للورقة', 'ضيفي حاجة للورقة', 'Add something to the sheet')}</summary>
				<form id="gl-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('نفسنا في إيه؟', 'What do we want?')}</span><input name="title" dir="auto" maxlength="60" required placeholder="${L('بلايستيشن ٥', 'A PlayStation 5')}"></label>
						<label class="f"><span>${L('على ورقة مين؟', 'Whose sheet?')}</span><select name="board">${boards.map((b) => `<option value="${esc(b.id)}">${esc(App.t(b.name))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('نوعها', 'Kind')}</span><select name="kind">${KINDS.map((k) => `<option value="${k.id}">${esc(L(k.ar, k.en))}</option>`).join('')}</select></label>
					</div>
					<label class="f"><span>${L('صورتها (على خلفية بيضا أحلى)', 'Its picture (best on white)')}</span><input name="photo" type="file" accept="image/*"></label>
					<p class="form-msg" id="gl-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('حطها على الورقة ♥', 'حطيها على الورقة ♥', 'Put it on the sheet ♥')}</button></div>
				</form>
			</details>
			<div class="toolbar">
				<div class="chips" id="gl-kinds" role="toolbar" aria-label="${L('النوع', 'Kind')}"></div>
				<div class="chips gl-tools">
					<button class="chip" type="button" id="gl-hide" aria-pressed="false">${L('نخبّي اللي شطبناه', 'Hide what’s crossed')}</button>
					${ok ? `<button class="chip" type="button" id="gl-edit" aria-pressed="false">${doodle('trash', 16)} ${L('نشيل حاجة', 'Remove things')}</button>` : ''}
				</div>
			</div>
			<div class="gl-tabs" id="gl-tabs" role="tablist" aria-label="${L('ورقة مين', 'Whose sheet')}"></div>
			<div class="gl-sheet" id="gl-sheet"><p class="empty">${L('بنجيب الورقة…', 'Fetching the sheet…')}</p></div>
		</div></section>
		${related(['wishes', 'gifts', 'adventures'])}`;
	},

	async after(main, s) {
		const sheet = $('#gl-sheet', main), form = $('#gl-form', main);
		let data = { items: [] }, only = '', hide = false, edit = false;
		const ok = live.canWrite();
		const boards = boardsOf(s), first = boards[0]?.id || 'family';
		const grown = (s.family?.members || []).filter((m) => !m.kid);
		const boardOf = (g) => g.board || first;
		// the sheet this phone opens on: its owner's, or the one in the link (goals.html#esraa)
		let board = boards.find((b) => b.id === location.hash.slice(1))?.id || (live.me() === 'her' ? grown[1]?.id : grown[0]?.id) || first;
		const everything = () => data.items || [];
		const all = () => everything().filter((g) => boardOf(g) === board);

		const item = (g) => {
			const k = kindOf(g.kind), done = !!g.done;
			return `<div class="gl-it${done ? ' is-done' : ''}" data-id="${esc(g.id)}" style="--r:${tilt(g.id)}deg">
				<button class="gl-it__btn" type="button" data-cross="${esc(g.id)}"${ok ? '' : ' disabled'} aria-pressed="${done}" aria-label="${esc(name(g))}${done ? ` — ${L('اتشطبت', 'crossed out')}` : ''}">
					${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="" loading="lazy">` : `<span class="gl-it__ic">${doodle(k.ic, 54)}</span>`}
					<svg class="gl-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M10 12C35 38 62 66 90 88"/><path pathLength="1" d="M88 10C62 40 38 64 12 90"/></svg>
				</button>
				<span class="gl-it__t" dir="auto">${esc(name(g))}</span>
				${done ? `<small class="gl-it__d">${L('جبناها', 'Got it')} · ${esc(longDate(g.done))}</small>` : ''}
				${edit && g.by === live.me() ? `<button class="gl-it__del" type="button" data-del="${esc(g.id)}" aria-label="${L('شيلها من الورقة', 'Take it off the sheet')}">${doodle('trash', 16)}</button>` : ''}
			</div>`;
		};

		const paint = () => {
			const items = all();
			/* the tabs on top of the sheet, like a notebook's index: whose sheet, and how many crossed out */
			$('#gl-tabs', main).innerHTML = boards.map((b) => {
				const mine = everything().filter((g) => boardOf(g) === b.id), got = mine.filter((g) => g.done).length;
				return `<button class="gl-tab${b.id === board ? ' is-on' : ''}" type="button" role="tab" aria-selected="${b.id === board}" data-board="${esc(b.id)}" style="--c:${esc(b.color || '#0e6990')}">
					<b>${esc(App.t(b.name))}</b><small>${mine.length ? `${num(got)}/${num(mine.length)}` : L('فاضية', 'empty')}</small></button>`;
			}).join('');
			const bd = boards.find((b) => b.id === board);
			sheet.style.setProperty('--c', bd?.color || '#0e6990');
			const got = items.filter((g) => g.done).length;
			$('#gl-count', main).innerHTML = items.length ? `
				<p class="gl-count__t">${L(`شطبنا <b>${num(got)}</b> من <b>${num(items.length)}</b>`, `Crossed out <b>${got}</b> of <b>${items.length}</b>`)}</p>
				<span class="gl-count__line" style="--p:${(got / items.length).toFixed(3)}"><i></i></span>
				<small>${got === items.length ? L('خلصنا الورقة كلها ♥', 'The whole sheet is done ♥') : L(`فاضل ${num(items.length - got)} — واحدة واحدة`, `${items.length - got} to go — one at a time`)}</small>` : '';
			const used = KINDS.filter((k) => items.some((g) => kindOf(g.kind) === k));
			$('#gl-kinds', main).innerHTML = `<button class="chip${only ? '' : ' is-on'}" type="button" data-kind="">${L('الكل', 'All')}</button>` + used.map((k) => `<button class="chip${only === k.id ? ' is-on' : ''}" type="button" data-kind="${k.id}">${doodle(k.ic, 16)} ${esc(L(k.ar, k.en))}</button>`).join('');
			const shown = items.filter((g) => (!only || kindOf(g.kind).id === only) && (!hide || !g.done));
			sheet.classList.toggle('is-edit', edit);
			sheet.innerHTML = shown.length ? shown.map(item).join('')
				: `<p class="empty">${items.length ? L('مفيش حاجة هنا', 'Nothing here') : L(`ورقة ${App.t(bd?.name)} لسه فاضية… أول حاجة ${board === 'family' ? 'نفسنا' : bd?.female ? 'نفسها' : 'نفسه'} فيها تتكتب من «ضيف حاجة للورقة» ♥`, `${App.t(bd?.name)}’s sheet is still empty… add the first wish above ♥`)}</p>`;
			if (form && !form.title.value) form.board.value = board;
			live.hydrateSketches(sheet);
		};

		/* a wide picture (a car, a desk, a monitor) takes two places on the sheet */
		sheet.addEventListener('load', (e) => {
			const img = e.target;
			if (img.tagName !== 'IMG' || !img.naturalWidth) return;
			const r = img.naturalWidth / img.naturalHeight;
			img.closest('.gl-it')?.classList.toggle('is-wide', r > 1.45);
		}, true);

		const save = async (fn) => {
			try { data = await live.save('goals', fn); paint(); }
			catch (err) { alert(live.why(err)); }
		};
		const find = (d, id) => (d.items || []).find((g) => g.id === id);

		$('#gl-tabs', main).addEventListener('click', (e) => { const t = e.target.closest('[data-board]'); if (!t || t.dataset.board === board) return; board = t.dataset.board; only = ''; history.replaceState(history.state, '', '#' + board); paint(); });
		$('#gl-kinds', main).addEventListener('click', (e) => { const c = e.target.closest('[data-kind]'); if (c) { only = c.dataset.kind; paint(); } });
		$('#gl-hide', main).onclick = (e) => { hide = !hide; e.currentTarget.classList.toggle('is-on', hide); e.currentTarget.setAttribute('aria-pressed', hide); paint(); };
		const ed = $('#gl-edit', main);
		if (ed) ed.onclick = () => { edit = !edit; ed.classList.toggle('is-on', edit); ed.setAttribute('aria-pressed', edit); paint(); };
		sheet.addEventListener('click', (e) => {
			const del = e.target.closest('[data-del]'), x = e.target.closest('[data-cross]');
			if (del) {
				const g = find(data, del.dataset.del);
				if (g && confirm(L(`نشيل «${g.title}» من الورقة؟`, `Take “${name(g)}” off the sheet?`))) save((d) => { d.items = (d.items || []).filter((y) => y.id !== g.id); });
				return;
			}
			if (!x || !ok) return;
			const g = find(data, x.dataset.cross);
			if (!g) return;
			if (g.done && !confirm(L('نرجّعها تاني على الورقة؟', 'Put it back on the list?'))) return;
			save((d) => { const y = find(d, g.id); if (!y) return; if (y.done) delete y.done; else y.done = live.today(); });
		});

		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gl-msg', main);
			const title = form.title.value.trim();
			if (!title) return;
			try {
				msg.textContent = L('بنحطها…', 'Adding…');
				const photo = form.photo.files[0] ? await live.putSketch(await shrinkPhoto(form.photo.files[0], 600)) : undefined;
				const g = { id: live.newId(), title, kind: form.kind.value, board: form.board.value, photo, by: live.me(), at: Date.now() };
				data = await live.save('goals', (d) => { (d.items = d.items || []).push(g); });
				form.reset();
				msg.textContent = L('اتحطت على الورقة ♥', 'On the sheet ♥');
				only = ''; hide = false; board = g.board;
				paint();
				$(`[data-id="${CSS.escape(g.id)}"]`, sheet)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} catch (err) { msg.textContent = live.why(err); }
		};

		/* the notebook above the title: five things on its lines, crossed out one after another, then five more */
		let padTimer = 0;
		this.leave = () => clearInterval(padTimer);
		const pad = () => {
			if (document.hidden) return;
			const pool = everything().filter((g) => !g.done);
			const five = (pool.length ? pool : everything()).slice().sort(() => Math.random() - 0.5).slice(0, 5);
			const ol = $('#gl-pad', main);
			if (!ol) return;
			ol.innerHTML = five.map((g, i) => `<li style="--i:${i}">${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="">` : `<span class="gl-pad__ic">${doodle(kindOf(g.kind).ic, 18)}</span>`}<span dir="auto">${esc(name(g))}</span></li>`).join('')
				|| `<li style="--i:0"><span>${L('أول حاجة نفسنا فيها', 'The first thing we wish for')}</span></li>`;
			live.hydrateSketches(ol);
		};

		data = await live.load('goals');
		pad();
		padTimer = setInterval(pad, 9000);
		paint();
	}
};
