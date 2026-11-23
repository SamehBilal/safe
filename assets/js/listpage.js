/* One page that keeps a shared list: a header band of its own above the title, an «add» form built from the page's
   fields, filter chips, and the cards. The pages that use it (ourfirsts, beforeus, chats, sayings, health,
   recipes, offline, giftideas, hosting, growth) only say what's different about them.

   cfg = {
     id, kind,                       the page id and the shared list it keeps (content/live/<kind>.bin)
     title, sub, add: [ar, en],      the title, the line under it, the «add» button
     icon,                           doodle for the «add» button
     fields: [{ n, t, l: [ar, en], req, opts, ideas, grow, ph }]
             t: text | area | date | num | sel | photo | url | voice (recorded here, or a sound file);  opts: 'kids' | 'who' | 'whoBoth' | 'all' | [[value, ar, en]] | (s) => same
             a photo field with sketch: true can also be drawn right here, on the sketch pad (sketch.js)
             a text/area field with pic: true (and ic: a drawing) is a tile with its own picture, a photo or drawn, kept as <n>Pic
     band(items, ctx) → html         the header band (drawn again whenever the list changes)
     card(x, ctx) → html             one entry
     sort(a, b), keep(x, ctx)        order; which entries this phone shows
     chips: { n, l, opts, def }      filter chips on a field (def: what an entry without that field counts as)
     toggle: { n, on: [ar, en], off: [ar, en] }   a done/undone button on each card
     top(items, ctx) → html          something between the form and the list
     bottom(items, ctx) → html       something under the list
     empty: [ar, en], related: [ids], note: [ar, en] (a line under the form)
   }
   A list can also live inside another page (recipes inside «أكلنا»): that page puts section(s, head) where it wants
   the list and an element #lp-band for the band, and calls after(main, s, root) with root = that section, so the
   list's clicks and lookups stay inside it. */
import { L, Y, T, esc, pageHead, related, App, $, $$, longDate, age } from './shell.js';
import { doodle } from './doodles.js';
import * as live from './live.js';
import { setupNote } from './pages/journal.js';
import { shrinkPhoto } from './pages/trips.js';
import { openSketch } from './sketch.js';

const WHO = [['him', '', ''], ['her', '', '']];
export function ctxOf(s) {
	const kids = (s.family?.members || []).filter((m) => m.kid);
	const kidOf = (id) => kids.find((k) => k.id === id);
	const whoName = (w) => (w === 'him' ? T(s.him) : w === 'her' ? T(s.her) : w === 'both' ? L('إحنا الاتنين', 'Both of us') : kidOf(w) ? App.t(kidOf(w).name) : '');
	return {
		s, kids, kidOf, whoName,
		kidName: (id) => (kidOf(id) ? App.t(kidOf(id).name) : ''),
		kidAge: (id, date) => (kidOf(id)?.born ? age(kidOf(id).born, new Date(date)) : ''),
		mine: (x) => live.canWrite() && x.by === live.me(),
		date: (d) => (d ? esc(longDate(d)) : ''),
		photo: (x, n = 'photo') => (x[n] ? `<img class="zoom" data-sketch="${esc(x[n])}" alt="" loading="lazy">` : ''),
		del: (x) => (live.canWrite() && x.by === live.me() ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : '')
	};
}

function optsOf(f, s) {
	const o = typeof f.opts === 'function' ? f.opts(s) : f.opts;
	if (o === 'kids') return (s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, App.t(k.name)]);
	if (o === 'who') return [['him', T(s.him)], ['her', T(s.her)]];
	if (o === 'all') return [['him', T(s.him)], ['her', T(s.her)], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, App.t(k.name)])];
	if (o === 'whoBoth') return [['both', L('إحنا الاتنين', 'Both of us')], ['him', T(s.him)], ['her', T(s.her)]];
	return (o || []).map(([v, ar, en]) => [v, L(ar, en ?? ar)]);
}

/* the picture that goes with a pic: true field: a small «photo» and «draw it», and the picture once it's there */
const picOf = (f) => ({ n: f.n + 'Pic', t: 'photo', sketch: true, inline: true, l: f.l, sketchTitle: f.picTitle || f.l });
function tile(f, s) {
	const p = picOf(f), lab = L(...f.l);
	const ph = f.ph ? ` placeholder="${esc(L(...f.ph))}"` : '';
	const el = f.t === 'area' ? `<textarea name="${f.n}" dir="auto" rows="${f.rows || 2}" maxlength="${f.max || 1200}"${ph}></textarea>` : `<input name="${f.n}" dir="auto" maxlength="${f.max || 140}"${ph}>`;
	return `<div class="lp-tile lp-pic${f.t === 'area' ? ' lp-tile--wide' : ''}">
		<label class="f"><span>${f.ic ? doodle(f.ic, 18) : ''} ${esc(lab)}</span>${el}</label>
		<div class="lp-tile__pics">
			<label class="lp-pic__opt lp-pic__opt--sm">${doodle('camera', 20)}<b>${L('صورة', 'A photo')}</b><input name="${p.n}" type="file" accept="image/*"></label>
			<button class="lp-pic__opt lp-pic__opt--sm" type="button" data-sketch-field="${p.n}">${doodle('pencil', 20)}<b>${Y('ارسمها', 'ارسميها', 'Draw it')}</b></button>
		</div>
		<span class="lp-pic__show" hidden><img class="lp-sketch__img" alt=""><button class="link link--danger" type="button" data-pic-clear="${p.n}">${L('شيلها', 'Remove')}</button></span>
	</div>`;
}

/* a voice: «record it» (the phone's microphone, up to two minutes) or «a sound file», then a player to hear it back */
function voice(f) {
	return `<div class="f lp-voice" data-voice-field="${f.n}"><span>${esc(L(...f.l))}</span>
		<div class="lp-voice__opts">
			<button class="lp-pic__opt lp-pic__opt--sm" type="button" data-rec="${f.n}">${doodle('mic', 20)}<b>${Y('سجّل صوته', 'سجّلي صوته', 'Record it')}</b></button>
			<label class="lp-pic__opt lp-pic__opt--sm">${doodle('music', 20)}<b>${L('ملف صوت', 'A sound file')}</b><input name="${f.n}" type="file" accept="audio/*"></label>
		</div>
		<div class="lp-voice__rec" hidden><span class="lp-voice__dot"></span><b class="lp-voice__t">0:00</b><span class="lp-voice__bars">${'<i></i>'.repeat(5)}</span><button class="btn btn--sm btn--coral" type="button" data-rec-stop="${f.n}">${L('وقّف', 'Stop')}</button></div>
		<div class="lp-voice__show" hidden><audio controls preload="metadata"></audio><button class="link link--danger" type="button" data-voice-clear="${f.n}">${L('شيله', 'Remove')}</button></div>
		<small class="lp-voice__msg muted"></small>
	</div>`;
}

function input(f, s) {
	if (f.pic) return tile(f, s);
	if (f.t === 'voice') return voice(f);
	const lab = L(...f.l), req = f.req ? ' required' : '';
	const ph = f.ph ? ` placeholder="${esc(L(...f.ph))}"` : '';
	let el;
	switch (f.t) {
		case 'area': el = `<textarea name="${f.n}" dir="auto" rows="${f.rows || 3}" maxlength="${f.max || 1200}"${req}${ph}></textarea>`; break;
		case 'date': el = `<input name="${f.n}" type="date"${req}>`; break;
		case 'num': el = `<input name="${f.n}" type="number" step="${f.step || 'any'}" min="${f.min ?? 0}" inputmode="decimal"${req}${ph}>`; break;
		case 'tel': el = `<input name="${f.n}" type="tel" dir="ltr" inputmode="tel" maxlength="30"${req}${ph}>`; break;
		case 'url': el = `<input name="${f.n}" type="url" dir="ltr"${req}${ph}>`; break;
		case 'photo':
			if (f.sketch) return `<div class="f lp-pic"><span>${esc(lab)}</span>
				<div class="lp-pic__opts">
					<label class="lp-pic__opt">${doodle('camera', 30)}<b>${L('صورة ليها', 'A photo of it')}</b><small>${L('من الموبايل أو الكاميرا', 'from the phone or camera')}</small><input name="${f.n}" type="file" accept="image/*"${req}></label>
					<button class="lp-pic__opt" type="button" data-sketch-field="${f.n}">${doodle('pencil', 30)}<b>${Y('ارسمها هنا', 'ارسميها هنا', 'Draw it here')}</b><small>${L('بإيدك على الشاشة', 'with a finger or pen')}</small></button>
				</div>
				<span class="lp-pic__show" hidden><img class="lp-sketch__img" alt=""><button class="link link--danger" type="button" data-pic-clear="${f.n}">${L('شيلها', 'Remove')}</button></span>
			</div>`;
			el = `<input name="${f.n}" type="file" accept="image/*"${f.many ? ' multiple' : ''}${req}>`; break;
		case 'sel': el = `<select name="${f.n}"${req}>${optsOf(f, s).map(([v, x]) => `<option value="${esc(v)}">${esc(x)}</option>`).join('')}</select>`; break;
		default: el = `<input name="${f.n}" dir="auto" maxlength="${f.max || 140}"${req}${ph}${f.ideas ? ` list="lp-${f.n}"` : ''}>${f.ideas ? `<datalist id="lp-${f.n}">${f.ideas.map(([ar, en]) => `<option value="${esc(L(ar, en ?? ar))}">`).join('')}</datalist>` : ''}`;
	}
	return `<label class="f${f.grow ? ' f--grow' : ''}"><span>${esc(lab)}</span>${el}</label>`;
}

export function listPage(cfg) {
	// every field the form sends, the pictures of pic: true fields among them
	const fields = cfg.fields.flatMap((f) => (f.pic ? [f, picOf(f)] : [f]));
	const page = {
		title: { ar: cfg.title[0], en: cfg.title[1] },
		render(s) {
			return `
			${pageHead(L(...cfg.title), L(...cfg.sub), [{ href: cfg.id + '.html', ar: cfg.title[0], en: cfg.title[1] }], { band: `<div class="lp-band lp-band--${cfg.id}" id="lp-band" aria-hidden="true"></div>` })}
			${page.section(s)}
			${related(cfg.related || ['story', 'journal', 'gallery'])}`;
		},
		/* the list itself — the form, what's on top, the chips and the cards — with an optional heading over it */
		section(s, head = '') {
			const ok = live.canWrite();
			const rows = [];
			let row = [];
			for (const f of cfg.fields) {
				/* pic: true fields side by side as tiles, one grid for each run of them */
				if (f.pic) { if (row.length) { rows.push(row); row = []; } if (rows.at(-1)?.tiles) rows.at(-1).push(f); else { const g = [f]; g.tiles = true; rows.push(g); } continue; }
				if (f.t === 'area' || f.t === 'voice' || f.full || f.sketch) { if (row.length) rows.push(row); rows.push([f]); row = []; }
				else { row.push(f); if (row.length === 3) { rows.push(row); row = []; } }
			}
			if (row.length) rows.push(row);
			const chips = cfg.chips ? `<div class="chips" id="lp-chips" role="toolbar"><button class="chip is-on" type="button" data-v="">${L('الكل', 'All')}</button>${optsOf(cfg.chips, s).map(([v, x]) => `<button class="chip" type="button" data-v="${esc(v)}">${esc(x)}</button>`).join('')}</div>` : '';
			return `
			<section class="sec${head ? '' : ' sec--top'}" id="lp-sec-${cfg.id}"><div class="wrap">
				${head}
				${cfg.fields.length ? `${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
				<details class="composer reveal"${ok ? '' : ' hidden'}>
					<summary><span>${doodle(cfg.icon || 'pen', 22)}</span> ${esc(L(...cfg.add))}</summary>
					<form id="lp-form" autocomplete="off">
						${rows.map((r) => (r.tiles ? `<div class="lp-tiles">${r.map((f) => input(f, s)).join('')}</div>` : r.length === 1 && (r[0].t === 'area' || r[0].t === 'voice' || r[0].full || r[0].sketch) ? input(r[0], s) : `<div class="f-row">${r.map((f) => input(f, s)).join('')}</div>`)).join('')}
						${cfg.note ? `<p class="muted">${esc(L(...cfg.note))}</p>` : ''}
						<p class="form-msg" id="lp-msg" role="status"></p>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
					</form>
				</details>` : ''}
				<div id="lp-top"></div>
				${chips}
				<div class="lp-list lp-list--${cfg.id}" id="lp-list"></div>
				${cfg.bottom ? '<div id="lp-bottom"></div>' : ''}
			</div></section>`;
		},

		async after(main, s, root = main) {
			const ctx = ctxOf(s);
			let data = await live.load(cfg.kind);
			let chip = '';
			const save = async (fn) => { data = await live.save(cfg.kind, fn); paint(); };
			ctx.save = save;
			ctx.data = () => data;
			ctx.repaint = () => paint();
			const paint = () => {
				let items = (data.items || []).filter((x) => !cfg.keep || cfg.keep(x, ctx));
				if (cfg.sort) items = [...items].sort(cfg.sort);
				{ const band = $('#lp-band', main); if (band) band.innerHTML = cfg.band ? cfg.band(items, ctx) : ''; }
				if (cfg.top) $('#lp-top', root).innerHTML = cfg.top(items, ctx);
				if (cfg.bottom) $('#lp-bottom', root).innerHTML = cfg.bottom(items, ctx);
				const shown = chip && cfg.chips ? items.filter((x) => String(x[cfg.chips.n] ?? cfg.chips.def ?? '') === chip) : items;
				$('#lp-list', root).innerHTML = shown.map((x) => cfg.card(x, ctx)).join('') || (cfg.empty === false ? '' : `<p class="empty">${esc(L(...(cfg.empty || ['لسه مفيش حاجة هنا ♥', 'Nothing here yet ♥'])))}</p>`);
				live.hydrateSketches(main);
				cfg.painted?.(root, items, ctx);
			};
			root.addEventListener('click', async (e) => {
				const c = e.target.closest('#lp-chips [data-v]');
				if (c) { chip = c.dataset.v; $$('#lp-chips .chip', root).forEach((x) => x.classList.toggle('is-on', x === c)); return paint(); }
				const del = e.target.closest('[data-del]');
				if (del) {
					if (confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) try { await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); } catch (err) { alert(live.why(err)); }
					return;
				}
				const tog = e.target.closest('[data-tog]');
				if (tog && cfg.toggle) {
					try { await save((d) => { const x = (d.items || []).find((y) => y.id === tog.dataset.tog); if (x) { x[cfg.toggle.n] = x[cfg.toggle.n] ? undefined : live.today(); } }); } catch (err) { alert(live.why(err)); }
					return;
				}
				cfg.click?.(e, ctx);
			});
			const f = $('#lp-form', root);
			/* «draw it here»: the sketch pad, and the drawing stands in for the photo */
			const sketched = {};
			f?.addEventListener('click', async (e) => {
				const b = e.target.closest('[data-sketch-field]');
				if (!b) return;
				const n = b.dataset.sketchField, fd = fields.find((x) => x.n === n);
				const blob = await openSketch({ title: L(...(fd.sketchTitle || fd.l)) });
				if (!blob) return;
				sketched[n] = blob;
				showPic(n, URL.createObjectURL(blob));
				f.elements[n].value = '';
				f.elements[n].required = false;
			});
			/* voices: recorded here, or a sound file */
			const recorded = {};
			let rec = null;
			const vbox = (n) => $(`[data-voice-field="${n}"]`, f);
			const showVoice = (n, url) => { const b = vbox(n); if (!b) return; const a = $('.lp-voice__show audio', b); if (a.src) URL.revokeObjectURL(a.src); a.removeAttribute('src'); if (url) a.src = url; $('.lp-voice__show', b).hidden = !url; $('.lp-voice__opts', b).hidden = !!url; };
			f?.addEventListener('click', async (e) => {
				const go = e.target.closest('[data-rec]'), stop = e.target.closest('[data-rec-stop]'), clr = e.target.closest('[data-voice-clear]');
				if (clr) { const n = clr.dataset.voiceClear; delete recorded[n]; f.elements[n].value = ''; showVoice(n, ''); return; }
				if (stop) { rec?.stop(); return; }
				if (!go) return;
				const n = go.dataset.rec, b = vbox(n), msg = $('.lp-voice__msg', b);
				msg.textContent = '';
				if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { msg.textContent = L('الموبايل ده مبيسجلش من هنا — اختاروا ملف صوت', 'This phone can’t record here — pick a sound file'); return; }
				let stream;
				try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { msg.textContent = L('محتاجين نستأذن الميكروفون — اسمحوا بيه وجرّبوا تاني', 'The microphone needs permission — allow it and try again'); return; }
				const chunks = [], m = new MediaRecorder(stream), t0 = Date.now();
				rec = m;
				const box = $('.lp-voice__rec', b), clock = $('.lp-voice__t', b);
				box.hidden = false; $('.lp-voice__opts', b).hidden = true;
				const tick = setInterval(() => { const sec = Math.floor((Date.now() - t0) / 1000); clock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; if (sec >= 120) m.stop(); }, 250);
				m.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
				m.onstop = () => {
					clearInterval(tick); stream.getTracks().forEach((t) => t.stop()); box.hidden = true; rec = null; clock.textContent = '0:00';
					const blob = new Blob(chunks, { type: (m.mimeType || 'audio/webm').split(';')[0] });
					if (!blob.size) { $('.lp-voice__opts', b).hidden = false; return; }
					recorded[n] = blob; f.elements[n].value = ''; showVoice(n, URL.createObjectURL(blob));
				};
				m.start();
			});
			f?.addEventListener('change', (e) => { const el = e.target; if (el.type !== 'file' || !el.closest('.lp-voice') || !el.files[0]) return; delete recorded[el.name]; showVoice(el.name, URL.createObjectURL(el.files[0])); });
			const showPic = (n, url) => { const box = $(`[data-pic-clear="${n}"]`, f)?.parentNode; if (!box) return; $('img', box).src = url || ''; box.hidden = !url; };
			f?.addEventListener('change', (e) => { const el = e.target; if (el.type !== 'file' || !el.closest('.lp-pic') || !el.files[0]) return; delete sketched[el.name]; showPic(el.name, URL.createObjectURL(el.files[0])); });
			f?.addEventListener('click', (e) => { const c = e.target.closest('[data-pic-clear]'); if (!c) return; const n = c.dataset.picClear; delete sketched[n]; f.elements[n].value = ''; const fd = fields.find((x) => x.n === n); if (fd?.req) f.elements[n].required = true; showPic(n, ''); });
			if (f) f.onsubmit = async (e) => {
				e.preventDefault();
				const msg = $('#lp-msg', root);
				try {
					msg.textContent = L('بنحفظ…', 'Saving…');
					const x = { id: live.newId(), by: live.me(), at: Date.now() };
					for (const fd of fields) {
						const el = f.elements[fd.n];
						if (fd.t === 'photo') {
							const files = [...el.files];
							if (fd.many) { if (files.length) x[fd.n] = []; for (const file of files) x[fd.n].push(await live.putSketch(await shrinkPhoto(file, 1200))); }
							else if (files[0]) x[fd.n] = await live.putSketch(await shrinkPhoto(files[0], 1200));
							else if (sketched[fd.n]) { x[fd.n] = await live.putSketch(sketched[fd.n]); if (fd.inline) x[fd.n + 'Drawn'] = true; else x.drawn = true; }
						} else if (fd.t === 'voice') {
							const v = el.files[0] || recorded[fd.n];
							if (v) {
								if (v.size > 5 * 1024 * 1024) throw Object.assign(new Error(L('الصوت أطول من اللازم — خلّيه أقصر من دقيقتين', 'The sound is too long — keep it under two minutes')), { say: true });
								x[fd.n] = await live.putSketch(v); x[fd.n + 'Type'] = (v.type || 'audio/webm').split(';')[0];
							}
						} else if (fd.t === 'num') { if (el.value !== '') x[fd.n] = +el.value; }
						else if (el.value.trim()) x[fd.n] = el.value.trim();
					}
					cfg.prepare?.(x, ctx);
					await save((d) => { (d.items = d.items || []).push(x); });
					f.reset();
					for (const fd of fields.filter((x) => x.t === 'voice')) { delete recorded[fd.n]; showVoice(fd.n, ''); }
					for (const fd of fields.filter((x) => x.sketch)) { delete sketched[fd.n]; showPic(fd.n, ''); if (fd.req) f.elements[fd.n].required = true; }
					msg.textContent = L('اتحفظت ♥', 'Saved ♥');
				} catch (err) { msg.textContent = err?.say ? err.message : live.why(err); }
			};
			await cfg.ready?.(root, ctx);
			paint();
		}
	};
	return page;
}

/* helpers for bands */
export const hearts = (n, cls = '') => Array.from({ length: n }, (_, i) => `<span class="lp-heart ${cls}" style="--i:${i}">♥</span>`).join('');
export const shorten = (x, n = 22) => { const a = [...String(x || '')]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };
export { WHO };
