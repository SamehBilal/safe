import { L, Y, T, esc, num, pageHead, related, img, hydrate, fmtDate, $, App } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* Our bucket list and the adventures we dream of, one page (it used to be two: «قايمة الأحلام» and «مغامرات نفسنا
   فيها»). A hundred-odd things to do together one day (private/live/adventures.json, photos in
   private/media/adventures/; the ones added from a phone carry their own photo, sealed like every phone photo), pinned
   up like postcards on a travel board — Egypt first among the places. Above the title, four of them taped up and, as
   the last card, the checklist on its clipboard: what's next, ticked as we go, and how many are done. A dashed route
   shows how far along we are; tick one off and it gets a red «done» stamp with the date. Filter by kind (or Egypt), let
   the dice pick the next one, or add one in a window, with a photo.
   What was on the old bucket list from the phones (content/live/bucket.bin) shows here too, and is ticked there. */
export const KINDS = [
	{ id: 'egypt', d: 'pin', ar: 'في مصر', en: 'In Egypt' },
	{ id: 'water', d: 'wave', ar: 'مية وبحر', en: 'Sea & water' },
	{ id: 'sky', d: 'plane', ar: 'في السما', en: 'In the sky' },
	{ id: 'snow', d: 'sparkle', ar: 'تلج وبرد', en: 'Snow & ice' },
	{ id: 'places', d: 'pin', ar: 'أماكن نزورها', en: 'Places to see' },
	{ id: 'thrill', d: 'party', ar: 'مغامرة وأدرينالين', en: 'Thrills' },
	{ id: 'sweet', d: 'heart', ar: 'حاجات حلوة سوا', en: 'Sweet things together' }
];
const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[6];
const FIRST = 24;
const short = (s, n) => { const a = [...String(s)]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : s; };

export default {
	title: { ar: 'أحلامنا ومغامراتنا', en: 'Our bucket list' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('أحلامنا ومغامراتنا', 'Our bucket list'), L('أكتر من ١٠٠ حاجة نفسنا نعملها سوا في يوم من الأيام — في مصر وبرّاها — وكل ما نعمل واحدة، نختمها ♥', 'A hundred-odd things we want to do together one day — in Egypt and beyond — and each one we do gets its stamp ♥'), [{ href: 'adventures.html', ar: 'أحلامنا ومغامراتنا', en: 'Our bucket list' }], { band: `<div class="adv-band" id="adv-band" aria-hidden="true"></div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="adv-route" id="adv-route"></div>
			${ok ? '' : `<div class="narrow" style="margin:24px auto 0">${setupNote()}</div>`}
			<details class="composer"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('star', 22)}</span> ${Y('ضيف حلم أو مغامرة', 'ضيفي حلم أو مغامرة', 'Add a dream')}</summary>
				<form id="adv-form" autocomplete="off">
					<label class="f"><span>${Y('نفسك نعمل إيه؟', 'نفسك نعمل إيه؟', 'What should we do?')}</span><input name="what" dir="auto" maxlength="90" required placeholder="${L('مغامرة جديدة…', 'A new adventure…')}"></label>
					<div class="f-row">
						<label class="f"><span>${L('نوعها', 'Kind')}</span><select name="kind">${KINDS.map((k) => `<option value="${k.id}"${k.id === 'sweet' ? ' selected' : ''}>${esc(L(k.ar, k.en))}</option>`).join('')}</select></label>
						<label class="f f--grow"><span>${L('فين؟ (اختياري)', 'Where? (optional)')}</span><input name="where" dir="auto" maxlength="60"></label>
					</div>
					<label class="f"><span>${L('ليه نفسنا فيها؟ (اختياري)', 'Why? (optional)')}</span><textarea name="note" dir="auto" rows="2" maxlength="300"></textarea></label>
					<label class="f"><span>${L('صورة (اختياري)', 'A photo (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
					<p class="form-msg" id="adv-msg" role="status"></p>
					<div class="f-actions"><button class="btn btn--coral" type="submit">${L('ضيفوها ♥', 'Add it ♥')}</button></div>
				</form>
			</details>
			<div class="adv-bar">
				<div class="chips" id="adv-kinds" role="group" aria-label="${L('النوع', 'Kind')}"></div>
				<button class="btn btn--coral adv-pick" type="button" id="adv-pick">${doodle('dice', 20)} ${L('اختارولنا المغامرة الجاية', 'Pick our next adventure')}</button>
			</div>
			<p class="adv-picked" id="adv-picked" role="status" hidden></p>
			<ol class="adv-grid" id="adv-grid"></ol>
			<p class="adv-more"><button class="btn btn--ghost" type="button" id="adv-more" hidden></button></p>
		</div></section>
		${related(['anniversaries', 'wishes', 'goals'])}`;
	},

	async after(main) {
		let data = await live.load('adventures');
		// the old bucket list's own entries, kept where they were and shown here with the rest
		let old = await live.load('bucket').catch(() => ({ items: [] }));
		let kind = '', all = false, picked = '';
		const items = () => [...(data.items || []), ...(old.items || []).map((x) => ({ ...x, kind: x.kind || 'sweet', from: 'bucket' }))];
		// opened from a search result for one further down: show them all so it can be found
		const find = decodeURIComponent((location.hash.match(/find=([^&]*)/) || [])[1] || '').trim();
		if (find) all = true;

		// in our order; one we've done keeps its place and gets its stamp there («اتحققت» lists them on their own)
		const list = () => items().filter((x) => !kind || (kind === 'done' ? x.done : (x.kind || 'sweet') === kind));
		const photoOf = (x, cls) => (x.photo && !x.from ? img(x.photo, '', cls) : x.photo || x.sketch ? `<img class="${cls}" data-sketch="${esc(x.sketch || x.photo)}" alt="">` : '');

		const card = (x, k) => {
			const n = items().indexOf(x) + 1;
			const kd = kindOf(x.kind);
			const pic = photoOf(x, 'adv-img');
			const mine = live.canWrite() && x.by === live.me();
			return `<li class="adv-card adv--${esc(kd.id)}${x.done ? ' is-done' : ''}${x.id === picked ? ' is-picked' : ''}" id="${esc(x.id)}" style="--i:${k % FIRST}">
				<span class="adv-tape" aria-hidden="true"></span>
				<span class="adv-ph"${pic ? ' data-media-box' : ''}>${pic || `<span class="adv-dd">${doodle(kd.d, 54)}</span>`}
					${x.done ? `<span class="adv-stamp" aria-hidden="true"><b>${L('اتحققت', 'Done')}</b><small>${esc(fmtDate(x.done))}</small></span>` : ''}
				</span>
				<span class="adv-tx">
					<span class="adv-n">#${num(n)} · ${esc(L(kd.ar, kd.en))}</span>
					<b dir="auto">${T(x.what)}</b>
					${x.where ? `<small class="adv-where">${doodle('pin', 14)} ${T(x.where)}</small>` : ''}
					${x.note ? `<small class="adv-note" dir="auto">${T(x.note)}</small>` : ''}
					${x.done ? `<small class="adv-when">✓ ${L('عملناها في', 'We did it on')} ${esc(fmtDate(x.done))}</small>` : ''}
				</span>
				${live.canWrite() ? `<button class="adv-tog${x.done ? ' is-on' : ''}" type="button" data-tog="${esc(x.id)}">${x.done ? L('لسه ماعملناهاش', 'Not done yet') : `<span aria-hidden="true">✓</span> ${Y('عملناها', 'عملناها', 'We did it')}`}</button>` : ''}
				${mine && !(x.photo && !x.from) ? `<button class="link adv-del" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}
			</li>`;
		};

		const route = () => {
			const every = items(), total = every.length, done = every.filter((x) => x.done).length;
			const pct = total ? Math.round((done / total) * 100) : 0;
			$('#adv-route', main).innerHTML = `
				<p class="adv-count"><b>${num(done)}</b><span>${L(`من ${num(total)} اتحققت`, `of ${total} done`)}</span></p>
				<div class="adv-track" style="--p:${Math.max(pct, 2)}%" role="img" aria-label="${esc(L(`عملنا ${num(done)} من ${num(total)}`, `${done} of ${total} done`))}">
					<span class="adv-line"></span><span class="adv-plane">${doodle('plane', 30)}</span><span class="adv-end">${doodle('heart', 24)}</span>
				</div>`;
			// the band: four of the dreams as taped postcards (a different four every day, the ones we've done first)…
			const ph = every.filter((x) => x.photo && !x.from && !x.done);
			const day = Math.floor(Date.now() / 864e5);
			const show = every.filter((x) => x.photo && !x.from && x.done).concat(ph.slice((day * 4) % (ph.length || 1)), ph).slice(0, 4);
			// …and, as the last card, the checklist on its clipboard: the latest ones we did, then what's next
			const rows = [...every.filter((x) => x.done).slice(-2), ...every.filter((x) => !x.done)].slice(0, 5);
			$('#adv-band', main).innerHTML = show.map((x, i) => `<figure class="adv-pc" style="--i:${i}" data-media-box>${img(x.photo, '', 'adv-pc-img')}<figcaption>${T(x.what)}</figcaption></figure>`).join('')
				+ `<figure class="adv-pc adv-pc--list" style="--i:4"><span class="adv-clip"></span>
					<ul>${rows.map((x, i) => `<li class="${x.done ? 'is-done' : ''}" style="--k:${i}"><i></i><span dir="auto">${esc(short(App.t(x.what), 22))}</span></li>`).join('')}</ul>
					<figcaption><b>${num(done)}</b>/${num(total)} ${L('اتحققت', 'done')}</figcaption></figure>`;
		};

		const draw = () => {
			route();
			const every = items();
			const count = (id) => every.filter((x) => (x.kind || 'sweet') === id).length;
			const done = every.filter((x) => x.done).length;
			$('#adv-kinds', main).innerHTML = [['', L('الكل', 'All'), every.length], ...KINDS.map((k) => [k.id, L(k.ar, k.en), count(k.id)]).filter((k) => k[2]), ...(done ? [['done', L('اتحققت ✓', 'Done ✓'), done]] : [])]
				.map(([id, label, n]) => `<button class="chip${id === kind ? ' is-on' : ''}" type="button" data-kind="${id}" aria-pressed="${id === kind}">${esc(label)} <small>${num(n)}</small></button>`).join('');
			const xs = list();
			const shown = all ? xs : xs.slice(0, FIRST);
			$('#adv-grid', main).innerHTML = shown.map(card).join('') || `<li class="empty">${L('مفيش حاجة هنا لسه ♥', 'Nothing here yet ♥')}</li>`;
			const more = $('#adv-more', main);
			more.hidden = xs.length <= FIRST;
			more.textContent = all ? L('أقل', 'Show fewer') : L(`شوف الكل (${num(xs.length)})`, `Show all ${xs.length}`);
			$('#adv-pick', main).disabled = !xs.some((x) => !x.done);
			hydrate(main, true);
			live.hydrateSketches(main);
		};
		draw();

		// an entry is saved in the list it came from
		const save = async (id, fn) => {
			if (items().find((x) => x.id === id)?.from === 'bucket') old = await live.save('bucket', fn);
			else data = await live.save('adventures', fn);
			draw();
		};
		main.addEventListener('click', async (e) => {
			const chip = e.target.closest('#adv-kinds [data-kind]');
			if (chip) { kind = chip.dataset.kind; all = false; picked = ''; $('#adv-picked', main).hidden = true; return draw(); }
			if (e.target.closest('#adv-more')) {
				all = !all; draw();
				if (!all) $('#adv-kinds', main).scrollIntoView({ behavior: 'smooth', block: 'center' });
				return;
			}
			if (e.target.closest('#adv-pick')) {
				const open = list().filter((x) => !x.done);
				if (!open.length) return;
				let x = open[Math.floor(Math.random() * open.length)];
				if (open.length > 1 && x.id === picked) x = open[(open.indexOf(x) + 1) % open.length];
				picked = x.id;
				if (list().indexOf(x) >= FIRST) all = true;
				draw();
				const out = $('#adv-picked', main);
				out.hidden = false;
				out.innerHTML = `${L('المغامرة الجاية:', 'Next up:')} <b dir="auto">${T(x.what)}</b>${x.where ? ` <small>(${T(x.where)})</small>` : ''} ${doodle('suitcase', 22)}`;
				$('#' + CSS.escape(x.id), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				return;
			}
			const tog = e.target.closest('[data-tog]');
			if (tog) {
				const id = tog.dataset.tog;
				try { await save(id, (d) => { const x = (d.items || []).find((y) => y.id === id); if (x) x.done = x.done ? undefined : live.today(); }); }
				catch (err) { alert(live.why(err)); }
				$('#' + CSS.escape(id), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				return;
			}
			const del = e.target.closest('[data-del]');
			if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) {
				const id = del.dataset.del;
				try { await save(id, (d) => { d.items = (d.items || []).filter((x) => x.id !== id); }); } catch (err) { alert(live.why(err)); }
			}
		});

		const form = $('#adv-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const what = form.what.value.trim();
			if (!what) return;
			const msg = $('#adv-msg', main);
			const item = { id: live.newId(), what, kind: form.kind.value, by: live.me(), at: Date.now() };
			if (form.where.value.trim()) item.where = form.where.value.trim();
			if (form.note.value.trim()) item.note = form.note.value.trim();
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				if (form.photo.files[0]) item.sketch = await live.putSketch(await shrinkPhoto(form.photo.files[0], 1200));
				kind = ''; all = true;
				data = await live.save('adventures', (d) => { (d.items = d.items || []).push(item); });
				draw();
				msg.textContent = '';
				form.reset();
				$('#' + CSS.escape(item.id), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} catch (err) { msg.textContent = live.why(err); }
		};
	}
};
