import { L, Y, esc, pageHead, related, App, $, $$, num, longDate, age } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* The boys' firsts: the first step, first word, first tooth, first day at school… each with its date, a line and a
   photo. Above the title little footprints walk along a dotted path, a flag going up for each first; below, the
   timeline for each boy, and the door frame with a pencil mark every time they're measured. */

const IDEAS = [['أول ضحكة', 'First laugh'], ['أول سنة', 'First tooth'], ['أول مرة يقعد', 'First time sitting up'], ['أول حبو', 'First crawl'], ['أول خطوة', 'First step'], ['أول كلمة', 'First word'], ['قال بابا', 'Said “Baba”'], ['قال ماما', 'Said “Mama”'], ['أول يوم حضانة', 'First day at nursery'], ['أول يوم مدرسة', 'First day at school'], ['أول عجلة', 'First bike ride'], ['أول مرة في البحر', 'First time at the sea'], ['أول مرة يصوم', 'First fast'], ['أول جايزة', 'First prize']];
const KID_C = ['#e39b2d', '#5a9e6f', '#0e6990', '#c2185b'];

export default {
	title: { ar: 'أول مرة', en: 'Firsts' },
	render(s) {
		const ok = live.canWrite();
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const opts = kids.map((k) => `<option value="${esc(k.id)}">${esc(App.t(k.name))}</option>`).join('');
		return `
		${pageHead(L('أول مرة', 'Firsts'), L('كل أول مرة للولاد، قبل ما ننساها', 'Every one of the boys’ firsts, before we forget'), [{ href: 'firsts.html', ar: 'أول مرة', en: 'Firsts' }], {
			band: `<div class="ft1-band" id="ft1-band"></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<div class="ft1-forms"${ok ? '' : ' hidden'}>
				<details class="composer reveal">
					<summary><span>${doodle('baby', 22)}</span> ${Y('ضيف أول مرة', 'ضيفي أول مرة', 'Add a first')}</summary>
					<form id="ft1-form" autocomplete="off">
						<div class="f-row">
							<label class="f"><span>${L('مين؟', 'Who?')}</span><select name="kid">${opts}</select></label>
							<label class="f f--grow"><span>${L('أول مرة إيه؟', 'First what?')}</span><input name="what" dir="auto" maxlength="60" required list="ft1-ideas"></label>
						</div>
						<datalist id="ft1-ideas">${IDEAS.map(([ar, en]) => `<option value="${esc(L(ar, en))}">`).join('')}</datalist>
						<div class="f-row">
							<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date" required></label>
							<label class="f f--grow"><span>${L('صورة (اختياري)', 'A photo (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
						</div>
						<label class="f"><span>${L('حصل إزاي؟', 'How did it happen?')}</span><textarea name="note" dir="auto" rows="2" maxlength="280"></textarea></label>
						<p class="form-msg" id="ft1-msg" role="status"></p>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('افتكرها ♥', 'افتكريها ♥', 'Remember it ♥')}</button></div>
					</form>
				</details>
				<details class="composer reveal">
					<summary><span>${doodle('pencil', 22)}</span> ${Y('علّم طوله على الباب', 'علّمي طوله على الباب', 'Mark his height on the door')}</summary>
					<form id="ft1-h" autocomplete="off">
						<div class="f-row">
							<label class="f"><span>${L('مين؟', 'Who?')}</span><select name="kid">${opts}</select></label>
							<label class="f"><span>${L('الطول (سم)', 'Height (cm)')}</span><input name="cm" type="number" min="30" max="220" step="0.5" required inputmode="decimal"></label>
							<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date" required></label>
						</div>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${L('علّم ✎', 'Mark it ✎')}</button></div>
					</form>
				</details>
			</div>
			<div class="chips" id="ft1-kids" role="toolbar" aria-label="${L('مين', 'Who')}"><button class="chip is-on" type="button" data-kid="">${L('الكل', 'All')}</button>${kids.map((k) => `<button class="chip" type="button" data-kid="${esc(k.id)}">${esc(App.t(k.name))}</button>`).join('')}</div>
			<div class="ft1-layout">
				<ol class="ft1-line" id="ft1-line"></ol>
				<aside class="ft1-door" id="ft1-door" aria-label="${L('الطول على الباب', 'Heights on the door')}"></aside>
			</div>
		</div></section>
		${related(['family', 'yearly', 'capsule'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const kidOf = (id) => kids.find((k) => k.id === id);
		const color = (id) => kidOf(id)?.color || KID_C[Math.max(0, kids.findIndex((k) => k.id === id)) % KID_C.length];
		let data = await live.load('firsts');
		let who = '';
		const mine = (x) => x.by === live.me() && live.canWrite();
		const save = async (fn) => { data = await live.save('firsts', fn); paint(); };

		const paint = () => {
			const all = data.items || [];
			const firsts = all.filter((x) => x.type !== 'height' && (!who || x.kid === who)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
			/* the band: footprints along a dotted path, a flag for each of the latest firsts */
			const flags = (firsts.length ? firsts.slice(0, 5).map((x) => x.what) : IDEAS.slice(4, 9).map(([ar, en]) => L(ar, en))).reverse();
			const steps = 16;
			const at = (i) => { const t = i / (steps - 1); return [60 + t * 880, 120 + Math.sin(t * Math.PI * 2) * 34]; };
			const mirror = App.lang === 'ar';
			$('#ft1-band', main).innerHTML = `<svg class="ft1-svg" viewBox="0 0 1000 220" aria-hidden="true"${mirror ? ' style="transform:scaleX(-1)"' : ''}>
				<path class="ft1-path" d="M40 120${Array.from({ length: 40 }, (_, i) => { const t = (i + 1) / 40; return ` L${(40 + t * 920).toFixed(1)} ${(120 + Math.sin(t * Math.PI * 2) * 34).toFixed(1)}`; }).join('')}"/>
				${Array.from({ length: steps }, (_, i) => {
					const [x, y] = at(i), [x2, y2] = at(Math.min(steps - 1, i + 1)), ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 90, side = i % 2 ? 9 : -9;
					return `<g class="ft1-foot" style="--i:${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)}) translate(${side} 0)">
						<ellipse rx="7" ry="11"/><circle cx="-5" cy="-14" r="2.2"/><circle cx="-1.5" cy="-16" r="2.4"/><circle cx="2.5" cy="-15.5" r="2.2"/><circle cx="5.5" cy="-13" r="1.9"/></g>`;
				}).join('')}
				${flags.map((f, j) => { const i = Math.round(((j + 1) / (flags.length + 1)) * (steps - 1)); const [x, y] = at(i); return `<g class="ft1-flag" style="--i:${i}" transform="translate(${x.toFixed(1)} ${(y - 26).toFixed(1)})"><path class="ft1-flag__pole" d="M0 0V-56"/><g transform="translate(0 -56)${mirror ? ' scale(-1 1)' : ''}"><rect class="ft1-flag__bg" x="2" y="-2" width="${Math.max(54, [...f].length * 9)}" height="24" rx="3"/><text x="${2 + Math.max(54, [...f].length * 9) / 2}" y="15" text-anchor="middle">${esc(f)}</text></g></g>`; }).join('')}
			</svg>`;

			/* the timeline */
			$('#ft1-line', main).innerHTML = firsts.map((x) => `
				<li class="ft1-item reveal is-in" style="--c:${color(x.kid)}">
					<span class="ft1-item__dot" aria-hidden="true"></span>
					<article class="ft1-card">
						${(x.photos?.length ? x.photos : x.photo ? [x.photo] : []).map((p, i) => `<img class="zoom${i ? ' ft1-more' : ''}" data-sketch="${esc(p)}" alt="" loading="lazy">`).join('')}
						<p class="ft1-card__k">${esc(App.t(kidOf(x.kid)?.name || ''))}${kidOf(x.kid)?.born ? ` · ${esc(age(kidOf(x.kid).born, new Date(x.date)))}` : ''}</p>
						<h3 dir="auto">${esc(x.what)}</h3>
						<p class="ft1-card__d">${esc(longDate(x.date))}</p>
						${x.note ? `<p class="ft1-card__note" dir="auto">${esc(x.note)}</p>` : ''}
						${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}
					</article>
				</li>`).join('') || `<li class="empty">${L('أول «أول مرة» هتتكتب هنا ♥', 'The first “first” goes here ♥')}</li>`;
			live.hydrateSketches($('#ft1-line', main));

			/* the door frame: a pencil mark for every measuring */
			const hs = all.filter((x) => x.type === 'height' && (!who || x.kid === who)).sort((a, b) => a.cm - b.cm);
			const lo = 40, hi = Math.max(130, ...hs.map((x) => +x.cm + 10));
			const pos = (cm) => ((cm - lo) / (hi - lo)) * 100;
			let ticks = '';
			for (let c = lo; c <= hi; c += 10) ticks += `<span class="ft1-tick" style="bottom:${pos(c)}%"><i>${num(c)}</i></span>`;
			$('#ft1-door', main).innerHTML = `<h3>${L('على الباب', 'On the door')}</h3><div class="ft1-frame">${ticks}${hs.map((x, i) => `<span class="ft1-mark${i % 2 ? ' is-alt' : ''}" style="bottom:${pos(+x.cm)}%;--c:${color(x.kid)}" title="${esc(longDate(x.date))}"><b>${esc(App.t(kidOf(x.kid)?.name || ''))}</b> ${num(+x.cm)} ${L('سم', 'cm')} <small>${esc(String(x.date).slice(0, 4))}</small>${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">✕</button>` : ''}</span>`).join('')}</div>`;
		};

		$('#ft1-kids', main).addEventListener('click', (e) => { const c = e.target.closest('[data-kid]'); if (!c) return; who = c.dataset.kid; $$('#ft1-kids .chip', main).forEach((x) => x.classList.toggle('is-on', x === c)); paint(); });
		$('.sec', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]');
			if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) try { await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); } catch (err) { alert(live.why(err)); }
		});
		const f = $('#ft1-form', main);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#ft1-msg', main);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const photo = f.photo.files[0] ? await live.putSketch(await shrinkPhoto(f.photo.files[0], 1000)) : undefined;
				await save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'first', kid: f.kid.value, what: f.what.value.trim(), date: f.date.value, note: f.note.value.trim() || undefined, photo, by: live.me(), at: Date.now() }); });
				f.reset(); msg.textContent = L('اتحفظت ♥', 'Saved ♥');
			} catch (err) { msg.textContent = live.why(err); }
		};
		const h = $('#ft1-h', main);
		h.onsubmit = async (e) => {
			e.preventDefault();
			try { await save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'height', kid: h.kid.value, cm: +h.cm.value, date: h.date.value, by: live.me(), at: Date.now() }); }); h.reset(); } catch (err) { alert(live.why(err)); }
		};
		paint();
	}
};
