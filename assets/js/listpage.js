/* One page that keeps a shared list: a header band of its own above the title, an «add» form built from the page's
   fields, filter chips, and the cards. The pages that use it (ourfirsts, beforeus, soundtrack, chats, sayings, health,
   recipes, offline, giftideas, hosting, growth) only say what's different about them.

   cfg = {
     id, kind,                       the page id and the shared list it keeps (content/live/<kind>.bin)
     title, sub, add: [ar, en],      the title, the line under it, the «add» button
     icon,                           doodle for the «add» button
     fields: [{ n, t, l: [ar, en], req, opts, ideas, grow, ph }]
             t: text | area | date | num | sel | photo | url;  opts: 'kids' | 'who' | 'whoBoth' | [[value, ar, en]] | (s) => same
     band(items, ctx) → html         the header band (drawn again whenever the list changes)
     card(x, ctx) → html             one entry
     sort(a, b), keep(x, ctx)        order; which entries this phone shows
     chips: { n, l, opts }           filter chips on a field
     toggle: { n, on: [ar, en], off: [ar, en] }   a done/undone button on each card
     top(items, ctx) → html          something between the form and the list
     empty: [ar, en], related: [ids], note: [ar, en] (a line under the form)
   } */
import { L, Y, T, esc, pageHead, related, App, $, $$, longDate, age } from './shell.js';
import { doodle } from './doodles.js';
import * as live from './live.js';
import { setupNote } from './pages/journal.js';
import { shrinkPhoto } from './pages/trips.js';

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
	if (o === 'whoBoth') return [['both', L('إحنا الاتنين', 'Both of us')], ['him', T(s.him)], ['her', T(s.her)]];
	return (o || []).map(([v, ar, en]) => [v, L(ar, en ?? ar)]);
}

function input(f, s) {
	const lab = L(...f.l), req = f.req ? ' required' : '';
	const ph = f.ph ? ` placeholder="${esc(L(...f.ph))}"` : '';
	let el;
	switch (f.t) {
		case 'area': el = `<textarea name="${f.n}" dir="auto" rows="${f.rows || 3}" maxlength="${f.max || 1200}"${req}${ph}></textarea>`; break;
		case 'date': el = `<input name="${f.n}" type="date"${req}>`; break;
		case 'num': el = `<input name="${f.n}" type="number" step="${f.step || 'any'}" min="${f.min ?? 0}" inputmode="decimal"${req}${ph}>`; break;
		case 'url': el = `<input name="${f.n}" type="url" dir="ltr"${req}${ph}>`; break;
		case 'photo': el = `<input name="${f.n}" type="file" accept="image/*"${f.many ? ' multiple' : ''}${req}>`; break;
		case 'sel': el = `<select name="${f.n}"${req}>${optsOf(f, s).map(([v, x]) => `<option value="${esc(v)}">${esc(x)}</option>`).join('')}</select>`; break;
		default: el = `<input name="${f.n}" dir="auto" maxlength="${f.max || 140}"${req}${ph}${f.ideas ? ` list="lp-${f.n}"` : ''}>${f.ideas ? `<datalist id="lp-${f.n}">${f.ideas.map(([ar, en]) => `<option value="${esc(L(ar, en ?? ar))}">`).join('')}</datalist>` : ''}`;
	}
	return `<label class="f${f.grow ? ' f--grow' : ''}"><span>${esc(lab)}</span>${el}</label>`;
}

export function listPage(cfg) {
	return {
		title: { ar: cfg.title[0], en: cfg.title[1] },
		render(s) {
			const ok = live.canWrite();
			const rows = [];
			let row = [];
			for (const f of cfg.fields) {
				if (f.t === 'area' || f.full) { if (row.length) rows.push(row); rows.push([f]); row = []; }
				else { row.push(f); if (row.length === 3) { rows.push(row); row = []; } }
			}
			if (row.length) rows.push(row);
			const chips = cfg.chips ? `<div class="chips" id="lp-chips" role="toolbar"><button class="chip is-on" type="button" data-v="">${L('الكل', 'All')}</button>${optsOf(cfg.chips, s).map(([v, x]) => `<button class="chip" type="button" data-v="${esc(v)}">${esc(x)}</button>`).join('')}</div>` : '';
			return `
			${pageHead(L(...cfg.title), L(...cfg.sub), [{ href: cfg.id + '.html', ar: cfg.title[0], en: cfg.title[1] }], { band: `<div class="lp-band lp-band--${cfg.id}" id="lp-band" aria-hidden="true"></div>` })}
			<section class="sec sec--top"><div class="wrap">
				${cfg.fields.length ? `${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
				<details class="composer reveal"${ok ? '' : ' hidden'}>
					<summary><span>${doodle(cfg.icon || 'pen', 22)}</span> ${esc(L(...cfg.add))}</summary>
					<form id="lp-form" autocomplete="off">
						${rows.map((r) => (r.length === 1 && (r[0].t === 'area' || r[0].full) ? input(r[0], s) : `<div class="f-row">${r.map((f) => input(f, s)).join('')}</div>`)).join('')}
						${cfg.note ? `<p class="muted">${esc(L(...cfg.note))}</p>` : ''}
						<p class="form-msg" id="lp-msg" role="status"></p>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
					</form>
				</details>` : ''}
				<div id="lp-top"></div>
				${chips}
				<div class="lp-list lp-list--${cfg.id}" id="lp-list"></div>
			</div></section>
			${related(cfg.related || ['story', 'journal', 'gallery'])}`;
		},

		async after(main, s) {
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
				$('#lp-band', main).innerHTML = cfg.band ? cfg.band(items, ctx) : '';
				if (cfg.top) $('#lp-top', main).innerHTML = cfg.top(items, ctx);
				const shown = chip && cfg.chips ? items.filter((x) => String(x[cfg.chips.n]) === chip) : items;
				$('#lp-list', main).innerHTML = shown.map((x) => cfg.card(x, ctx)).join('') || (cfg.empty === false ? '' : `<p class="empty">${esc(L(...(cfg.empty || ['لسه مفيش حاجة هنا ♥', 'Nothing here yet ♥'])))}</p>`);
				live.hydrateSketches(main);
				cfg.painted?.(main, items, ctx);
			};
			main.addEventListener('click', async (e) => {
				const c = e.target.closest('#lp-chips [data-v]');
				if (c) { chip = c.dataset.v; $$('#lp-chips .chip', main).forEach((x) => x.classList.toggle('is-on', x === c)); return paint(); }
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
			const f = $('#lp-form', main);
			if (f) f.onsubmit = async (e) => {
				e.preventDefault();
				const msg = $('#lp-msg', main);
				try {
					msg.textContent = L('بنحفظ…', 'Saving…');
					const x = { id: live.newId(), by: live.me(), at: Date.now() };
					for (const fd of cfg.fields) {
						const el = f.elements[fd.n];
						if (fd.t === 'photo') {
							const files = [...el.files];
							if (fd.many) { if (files.length) x[fd.n] = []; for (const file of files) x[fd.n].push(await live.putSketch(await shrinkPhoto(file, 1200))); }
							else if (files[0]) x[fd.n] = await live.putSketch(await shrinkPhoto(files[0], 1200));
						} else if (fd.t === 'num') { if (el.value !== '') x[fd.n] = +el.value; }
						else if (el.value.trim()) x[fd.n] = el.value.trim();
					}
					cfg.prepare?.(x, ctx);
					await save((d) => { (d.items = d.items || []).push(x); });
					f.reset();
					msg.textContent = L('اتحفظت ♥', 'Saved ♥');
				} catch (err) { msg.textContent = live.why(err); }
			};
			await cfg.ready?.(main, ctx);
			paint();
		}
	};
}

/* helpers for bands */
export const hearts = (n, cls = '') => Array.from({ length: n }, (_, i) => `<span class="lp-heart ${cls}" style="--i:${i}">♥</span>`).join('');
export const shorten = (x, n = 22) => { const a = [...String(x || '')]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };
export { WHO };
