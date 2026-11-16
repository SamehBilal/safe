import { L, Y, T, esc, num, pageHead, related, img, hydrate, fmtDate, $ } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';

/* Adventures we dream of: a hundred-odd things to do together one day (private/live/adventures.json, photos in
   private/media/adventures/), pinned up like postcards on a travel board. A dashed route across the top shows how
   far along we are; tick one off and it gets a red «done» stamp with the date. Filter by kind, or let the dice pick
   the next one. */
export const KINDS = [
	{ id: 'water', d: 'wave', ar: 'مية وبحر', en: 'Sea & water' },
	{ id: 'sky', d: 'plane', ar: 'في السما', en: 'In the sky' },
	{ id: 'snow', d: 'sparkle', ar: 'تلج وبرد', en: 'Snow & ice' },
	{ id: 'places', d: 'pin', ar: 'أماكن نزورها', en: 'Places to see' },
	{ id: 'thrill', d: 'party', ar: 'مغامرة وأدرينالين', en: 'Thrills' },
	{ id: 'sweet', d: 'heart', ar: 'حاجات حلوة سوا', en: 'Sweet things together' }
];
const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[5];
const FIRST = 24;

export default {
	title: { ar: 'مغامرات نفسنا فيها', en: 'Adventures we dream of' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('مغامرات نفسنا فيها', 'Adventures we dream of'), L('أكتر من ١٠٠ حاجة نفسنا نعملها سوا في يوم من الأيام — وكل ما نعمل واحدة، نختمها ♥', 'A hundred-odd things we want to do together one day — and each one we do gets its stamp ♥'), [{ href: 'bucket.html', ar: 'قايمة الأحلام', en: 'Our bucket list' }, { href: 'adventures.html', ar: 'مغامرات نفسنا فيها', en: 'Adventures we dream of' }], { band: `<div class="adv-band" id="adv-band" aria-hidden="true"></div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="adv-route" id="adv-route"></div>
			${ok ? '' : `<div class="narrow" style="margin:24px auto 0">${setupNote()}</div>`}
			<div class="adv-bar">
				<div class="chips" id="adv-kinds" role="group" aria-label="${L('النوع', 'Kind')}"></div>
				<button class="btn btn--coral adv-pick" type="button" id="adv-pick">${doodle('dice', 20)} ${L('اختارولنا المغامرة الجاية', 'Pick our next adventure')}</button>
			</div>
			<p class="adv-picked" id="adv-picked" role="status" hidden></p>
			<ol class="adv-grid" id="adv-grid"></ol>
			<p class="adv-more"><button class="btn btn--ghost" type="button" id="adv-more" hidden></button></p>
			<form class="adv-add" id="adv-form" autocomplete="off"${ok ? '' : ' hidden'}>
				<label class="f"><span>${Y('نفسك نعمل إيه كمان؟', 'نفسك نعمل إيه كمان؟', 'What else should we do?')}</span><input name="what" dir="auto" maxlength="90" required placeholder="${L('مغامرة جديدة…', 'A new adventure…')}"></label>
				<label class="f"><span>${L('نوعها', 'Kind')}</span><select name="kind">${KINDS.map((k) => `<option value="${k.id}"${k.id === 'sweet' ? ' selected' : ''}>${esc(L(k.ar, k.en))}</option>`).join('')}</select></label>
				<label class="f"><span>${L('فين؟ (اختياري)', 'Where? (optional)')}</span><input name="where" dir="auto" maxlength="60"></label>
				<button class="btn" type="submit">${L('ضيفوها ♥', 'Add it ♥')}</button>
			</form>
		</div></section>
		${related(['bucket', 'trips', 'wishes'])}`;
	},

	async after(main) {
		let data = await live.load('adventures');
		let kind = '', all = false, picked = '';
		const items = () => data.items || [];
		// opened from a search result for one further down: show them all so it can be found
		const find = decodeURIComponent((location.hash.match(/find=([^&]*)/) || [])[1] || '').trim();
		if (find) all = true;

		// in our order; one we've done keeps its place and gets its stamp there («اتحققت» lists them on their own)
		const list = () => items().filter((x) => !kind || (kind === 'done' ? x.done : (x.kind || 'sweet') === kind));

		const card = (x, k) => {
			const n = items().indexOf(x) + 1;
			const kd = kindOf(x.kind);
			return `<li class="adv-card adv--${esc(kd.id)}${x.done ? ' is-done' : ''}${x.id === picked ? ' is-picked' : ''}" id="${esc(x.id)}" style="--i:${k % FIRST}">
				<span class="adv-tape" aria-hidden="true"></span>
				<span class="adv-ph"${x.photo ? ' data-media-box' : ''}>${x.photo ? img(x.photo, '', 'adv-img') : `<span class="adv-dd">${doodle(kd.d, 54)}</span>`}
					${x.done ? `<span class="adv-stamp" aria-hidden="true"><b>${L('اتحققت', 'Done')}</b><small>${esc(fmtDate(x.done))}</small></span>` : ''}
				</span>
				<span class="adv-tx">
					<span class="adv-n">#${num(n)} · ${esc(L(kd.ar, kd.en))}</span>
					<b dir="auto">${T(x.what)}</b>
					${x.where ? `<small class="adv-where">${doodle('pin', 14)} ${T(x.where)}</small>` : ''}
					${x.done ? `<small class="adv-when">✓ ${L('عملناها في', 'We did it on')} ${esc(fmtDate(x.done))}</small>` : ''}
				</span>
				${live.canWrite() ? `<button class="adv-tog${x.done ? ' is-on' : ''}" type="button" data-tog="${esc(x.id)}">${x.done ? L('لسه ماعملناهاش', 'Not done yet') : `<span aria-hidden="true">✓</span> ${Y('عملناها', 'عملناها', 'We did it')}`}</button>` : ''}
				${live.canWrite() && !x.photo && x.by === live.me() ? `<button class="link adv-del" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}
			</li>`;
		};

		const route = () => {
			const total = items().length, done = items().filter((x) => x.done).length;
			const pct = total ? Math.round((done / total) * 100) : 0;
			$('#adv-route', main).innerHTML = `
				<p class="adv-count"><b>${num(done)}</b><span>${L(`من ${num(total)} اتحققت`, `of ${total} done`)}</span></p>
				<div class="adv-track" style="--p:${Math.max(pct, 2)}%" role="img" aria-label="${esc(L(`عملنا ${num(done)} من ${num(total)}`, `${done} of ${total} done`))}">
					<span class="adv-line"></span><span class="adv-plane">${doodle('plane', 30)}</span><span class="adv-end">${doodle('heart', 24)}</span>
				</div>`;
			// the band: a few of the dreams as taped postcards
			// a different five every day (the ones we've done first)
			const ph = items().filter((x) => x.photo && !x.done);
			const day = Math.floor(Date.now() / 864e5);
			const show = items().filter((x) => x.photo && x.done).concat(ph.slice((day * 5) % (ph.length || 1)), ph).slice(0, 5);
			$('#adv-band', main).innerHTML = show.map((x, i) => `<figure class="adv-pc" style="--i:${i}" data-media-box>${img(x.photo, '', 'adv-pc-img')}<figcaption>${T(x.what)}</figcaption></figure>`).join('');
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
		};
		draw();

		const save = async (fn) => { data = await live.save('adventures', fn); draw(); };
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
				try { await save((d) => { const x = (d.items || []).find((y) => y.id === tog.dataset.tog); if (x) x.done = x.done ? undefined : live.today(); }); }
				catch (err) { alert(live.why(err)); }
				$('#' + CSS.escape(tog.dataset.tog), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				return;
			}
			const del = e.target.closest('[data-del]');
			if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) {
				try { await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); } catch (err) { alert(live.why(err)); }
			}
		});

		const form = $('#adv-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const what = form.what.value.trim();
			if (!what) return;
			const item = { id: live.newId(), what, kind: form.kind.value, by: live.me(), at: Date.now() };
			if (form.where.value.trim()) item.where = form.where.value.trim();
			try {
				kind = ''; all = true;
				await save((d) => { (d.items = d.items || []).push(item); });
				form.reset();
				$('#' + CSS.escape(item.id), main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} catch (err) { alert(live.why(err)); }
		};
	}
};
