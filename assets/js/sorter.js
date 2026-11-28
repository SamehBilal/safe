import { L, esc, img, hydrate, REDUCE, App, $, $$ } from './shell.js';
import { doodle } from './doodles.js';

/* The photo sorter, after Pavel Troshkin's «Photo Sorter Boxes» (Reactive CSS): a pile of our photos in the middle of
   the screen and a box on each side of it — drag a photo to a box, flick it, or press the arrow key that points at it,
   and it flies in and the box gulps it. Three ways to play it, all on this one screen:
   - «free»: we sort our own photos (نقّي صورنا) — every box takes what it's given, with undo.
   - «quiz»: each photo has a right box (which year was it?) — the boxes are labelled again for each photo; a wrong
     guess still ends in the right box, so you see where it belonged, and the day it came from is said under the pile.
   - «toy»: for Fahd — a wrong box shakes its head and the photo springs back to the middle to try again; a right one
     gets a burst of stars. Big boxes with a face on each.

   openSorter({ mode, title, sub, items: [{ photo, caption }], boxes: [up, right, down, left] | (item) => boxes,
                judge(item, k) → true/false, reveal(item) → html, onPut(item, k), onUndo(item, k), end(stats) → html,
                again() → new items })
   A box: { id, label, ic (a doodle), c (its colour), face (a photo shown on its front) }. */

const SIDES = ['up', 'right', 'down', 'left'];
const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
const n = (x) => (App.lang === 'ar' ? Number(x).toLocaleString('ar-EG') : String(x));

const boxSVG = `<svg class="srt-box__svg" viewBox="0 0 120 100" aria-hidden="true">
	<path class="srt-box__tab" d="M24 34V15q0-5 5-5h20l7 7h36q5 0 5 5v12z"/>
	<path class="srt-box__in" d="M14 30h92l-4 14H18z"/>
	<rect class="srt-box__front" x="9" y="40" width="102" height="54" rx="6"/>
	<path class="srt-box__dots" d="M96 46v42M101 46v42M106 46v42"/>
	<rect class="srt-box__slot" x="42" y="55" width="36" height="20" rx="4"/>
</svg>`;

let current = null;

export function openSorter(opt) {
	current?.close();
	const mode = opt.mode || 'free';
	let items = opt.items.slice();
	let at = 0;
	const undo = [];
	const counts = [0, 0, 0, 0];
	let right = 0, tries = 0, busy = false;
	const boxesOf = (it) => (typeof opt.boxes === 'function' ? opt.boxes(it) : opt.boxes);

	const back = document.activeElement;
	const el = document.createElement('div');
	el.className = `srt srt--${mode}`;
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');
	el.setAttribute('aria-label', opt.title);
	el.tabIndex = -1;
	el.innerHTML = `
		<div class="srt-bar">
			<div class="srt-bar__t"><b>${esc(opt.title)}</b><small id="srt-left"></small></div>
			<div class="srt-bar__btns">
				${mode === 'free' ? `<button class="btn btn--sm btn--ghost srt-undo" type="button" id="srt-undo" disabled>${doodle('back', 18)} ${L('رجّعها', 'Undo')}</button>` : ''}
				<button class="srt-x" type="button" id="srt-x" aria-label="${L('اقفل', 'Close')}">${doodle('eraser', 20)}</button>
			</div>
		</div>
		<div class="srt-stage" id="srt-stage">
			<svg class="srt-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0V100M0 50H100"/></svg>
			${SIDES.map((s, k) => `<button class="srt-box srt-box--${s}" type="button" data-k="${k}"><span class="srt-box__art">${boxSVG}<span class="srt-box__face"></span><b class="srt-box__n">0</b></span><span class="srt-box__l"><kbd aria-hidden="true"><svg viewBox="0 0 12 12" width="12" height="12" style="rotate:${k * 90}deg"><path d="M6 10V2.5M2.6 5.6 6 2.2l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></kbd><span class="srt-box__name"></span></span></button>`).join('')}
			<div class="srt-pile" id="srt-pile"></div>
		</div>
		<p class="srt-say${opt.sub ? ' is-hint' : ''}" id="srt-say" aria-live="polite">${esc(opt.sub || '')}</p>`;
	document.body.append(el);
	document.body.classList.add('srt-lock');
	const pile = $('#srt-pile', el), say = $('#srt-say', el), left = $('#srt-left', el), undoBtn = $('#srt-undo', el);
	const boxEls = $$('.srt-box', el);

	/* ---- the boxes: their names, faces and colours (again for each photo when they depend on it) ---- */
	let shownBoxes = null;
	function label(it) {
		const bs = boxesOf(it);
		if (!bs || bs === shownBoxes) return;
		const relabel = shownBoxes && !REDUCE;
		shownBoxes = bs;
		boxEls.forEach((b, k) => {
			const x = bs[k];
			b.hidden = !x;
			if (!x) return;
			const draw = () => {
				b.style.setProperty('--c', x.c || '#0e6990');
				$('.srt-box__name', b).innerHTML = `${x.ic ? doodle(x.ic, 18) : ''}<span>${esc(x.label)}</span>`;
				const face = $('.srt-box__face', b);
				face.innerHTML = x.face ? img(x.face, '', 'srt-box__img') : x.big ? `<span class="srt-box__big">${esc(x.big)}</span>` : '';
				b.setAttribute('aria-label', `${x.label} (${SIDES[k]})`);
				hydrate(face);
			};
			if (relabel) { b.animate([{ rotate: '0deg', scale: 1 }, { rotate: `${k % 2 ? 6 : -6}deg`, scale: 0.92 }, { rotate: '0deg', scale: 1 }], { duration: 380, easing: 'ease-out' }); setTimeout(draw, 140); }
			else draw();
		});
		if (mode !== 'quiz') boxEls.forEach((b, k) => { $('.srt-box__n', b).textContent = n(counts[k]); });
	}

	/* ---- the pile: the top photo and the two under it ---- */
	const cardHTML = (it, depth) => `<figure class="srt-card" data-depth="${depth}" style="--r:${(((at + depth) * 37) % 13) - 6}deg">
		<div class="srt-card__ph">${img(it.photo, it.caption || '', 'srt-card__img')}</div>
		${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`;
	function drawPile() {
		const rest = items.slice(at, at + 3);
		pile.innerHTML = rest.map((it, d) => cardHTML(it, d)).reverse().join('');
		hydrate(pile);
		const top = pile.lastElementChild;
		if (top) { top.classList.add('is-top'); grab(top); if (!REDUCE) top.animate([{ scale: 0.9, opacity: 0.4 }, { scale: 1, opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }); }
		left.textContent = mode === 'quiz'
			? L(`${n(Math.min(at + 1, items.length))} من ${n(items.length)} · صح ${n(right)}`, `${Math.min(at + 1, items.length)} of ${items.length} · ${right} right`)
			: L(`فاضل ${n(items.length - at)}`, `${items.length - at} left`);
		if (undoBtn) undoBtn.disabled = !undo.length;
		if (at < items.length) label(items[at]);
		else finish();
	}

	/* ---- dragging and flicking the top photo ---- */
	let hot = -1;
	const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
	const heat = (k) => { if (k === hot) return; hot = k; boxEls.forEach((b, j) => b.classList.toggle('is-hot', j === k)); };
	function grab(card) {
		let x0 = 0, y0 = 0, dx = 0, dy = 0, id = null, trail = [];
		card.addEventListener('pointerdown', (e) => {
			if (busy || e.button > 0) return;
			id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; trail = [[e.timeStamp, 0, 0]];
			card.setPointerCapture(id);
			card.classList.add('is-held');
			if (say.classList.contains('is-hint')) { say.classList.remove('is-hint'); say.textContent = ''; }
		});
		card.addEventListener('pointermove', (e) => {
			if (e.pointerId !== id) return;
			dx = e.clientX - x0; dy = e.clientY - y0;
			trail.push([e.timeStamp, dx, dy]); if (trail.length > 6) trail.shift();
			card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.06}deg)`;
			heat(Math.hypot(dx, dy) > 50 ? dirOf(dx, dy) : -1);
		});
		const up = (e) => {
			if (e.pointerId !== id) return;
			id = null;
			card.classList.remove('is-held');
			heat(-1);
			const [t0, ax, ay] = trail[0], dt = Math.max(16, e.timeStamp - t0);
			const vx = (dx - ax) / dt, vy = (dy - ay) / dt, speed = Math.hypot(vx, vy);
			const far = Math.hypot(dx, dy) > Math.min(110, pile.offsetWidth * 0.45);
			if (far || (speed > 0.55 && Math.hypot(dx, dy) > 24)) put(far ? dirOf(dx, dy) : dirOf(vx, vy), card);
			else springBack(card);
		};
		card.addEventListener('pointerup', up);
		card.addEventListener('pointercancel', up);
	}
	function springBack(card) {
		const from = card.style.transform || 'none';
		card.style.transform = '';
		if (!REDUCE) card.animate([{ transform: from }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.34, 1.56, .64, 1)' });
	}

	/* ---- a photo into a box ---- */
	const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
	function fly(card, k, then) {
		const art = $('.srt-box__art', boxEls[k]);
		const [bx, by] = centre(art.getBoundingClientRect());
		const r = card.getBoundingClientRect(), [cx, cy] = centre(r);
		const w = card.offsetWidth, h = card.offsetHeight;
		// the photo is lifted out of the pile (where it is now, dragged or not) so the next one can come up under it
		const ghost = card.cloneNode(true);
		ghost.className = 'srt-card srt-ghost';
		Object.assign(ghost.style, { left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, transform: 'none' });
		el.append(ghost);
		const tx = bx - cx, ty = by - cy;
		const done = () => { ghost.remove(); gulp(k); then?.(); };
		card.remove();
		if (REDUCE) return done();
		const a = ghost.animate([
			{ transform: 'none', opacity: 1 },
			{ transform: `translate(${tx}px, ${ty - 40}px) rotate(${k === 1 ? 18 : k === 3 ? -18 : 6}deg) scale(0.42)`, opacity: 1, offset: 0.75 },
			{ transform: `translate(${tx}px, ${ty + 6}px) scale(0.12)`, opacity: 0 }
		], { duration: 520, easing: 'cubic-bezier(.4,.1,.3,1)' });
		a.onfinish = done;
	}
	function gulp(k) {
		const b = boxEls[k];
		if (!REDUCE) $('.srt-box__art', b).animate([{ scale: '1 1' }, { scale: '1.12 0.86' }, { scale: '0.95 1.06' }, { scale: '1 1' }], { duration: 420, easing: 'ease-out' });
		$('.srt-box__n', b).textContent = n(counts[k]);
	}
	function shake(k) {
		const b = boxEls[k];
		b.classList.add('is-no');
		if (!REDUCE) $('.srt-box__art', b).animate([{ translate: '0' }, { translate: '-8px' }, { translate: '7px' }, { translate: '-5px' }, { translate: '3px' }, { translate: '0' }], { duration: 460 });
		setTimeout(() => b.classList.remove('is-no'), 700);
	}
	function stars(k) {
		if (REDUCE) return;
		const [x, y] = centre($('.srt-box__art', boxEls[k]).getBoundingClientRect());
		for (let i = 0; i < 9; i++) {
			const s = document.createElement('span');
			s.className = 'srt-star';
			s.innerHTML = doodle(i % 3 ? 'star' : 'sparkle', 22 + (i % 3) * 6);
			Object.assign(s.style, { left: `${x}px`, top: `${y}px` });
			el.append(s);
			const a = (i / 9) * Math.PI * 2, d = 70 + (i % 4) * 22;
			s.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${i * 40}deg)`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
		}
	}

	function put(k, card = pile.lastElementChild) {
		if (busy || at >= items.length || !card || boxEls[k].hidden) return;
		const it = items[at];
		if (say.classList.contains('is-hint')) { say.classList.remove('is-hint'); say.textContent = ''; }
		if (mode === 'toy') {
			tries++;
			if (!opt.judge(it, k)) {
				shake(k);
				say.innerHTML = opt.nope?.(it, k) || L('مش هنا… جرّب تاني', 'Not this one… try again');
				return springBack(card);
			}
			right++;
		}
		let to = k;
		if (mode === 'quiz') {
			tries++;
			const ok = opt.judge(it, k);
			if (ok) right++;
			else { shake(k); to = boxesOf(it).findIndex((b, j) => b && opt.judge(it, j)); if (to < 0) to = k; }
			say.innerHTML = `<b class="${ok ? 'is-ok' : 'is-no'}">${ok ? L('صح!', 'Right!') : L('لأ…', 'Not quite…')}</b> ${opt.reveal?.(it) || ''}`;
		}
		counts[to]++;
		busy = true;
		const go = () => {
			at++;
			busy = false;
			if (mode === 'toy') { stars(to); say.innerHTML = opt.yay?.(it, to) || L('برافو!', 'Well done!'); }
			drawPile();
		};
		if (mode === 'free') { undo.push([at, k]); opt.onPut?.(it, k); }
		fly(card, to, mode === 'quiz' && to !== k ? () => setTimeout(go, 250) : go);
	}

	function undoOne() {
		if (busy || !undo.length) return;
		const [i, k] = undo.pop();
		counts[k]--;
		$('.srt-box__n', boxEls[k]).textContent = n(counts[k]);
		at = i;
		opt.onUndo?.(items[i], k);
		el.classList.remove('is-done');
		$('.srt-end', el)?.remove();
		drawPile();
		const top = pile.lastElementChild;
		if (top && !REDUCE) {
			const [bx, by] = centre($('.srt-box__art', boxEls[k]).getBoundingClientRect()), [cx, cy] = centre(top.getBoundingClientRect());
			top.animate([{ transform: `translate(${bx - cx}px, ${by - cy}px) scale(.15)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
		}
		say.textContent = '';
	}

	/* ---- the end ---- */
	function finish() {
		el.classList.add('is-done');
		$('.srt-end', el)?.remove();
		const end = document.createElement('div');
		end.className = 'srt-end';
		end.innerHTML = `${opt.end?.({ counts, right, tries, total: items.length }) || `<p class="srt-end__big">${L('خلصنا!', 'All done!')}</p>`}
			<div class="srt-end__btns">${opt.again ? `<button class="btn btn--sm" type="button" data-again>${doodle('shuffle', 18)} ${L('تاني', 'Again')}</button>` : ''}
			<button class="btn btn--sm btn--ghost" type="button" data-close>${L('خلاص', 'Done')}</button></div>`;
		pile.append(end);
		$('[data-again]', end)?.addEventListener('click', () => {
			const more = opt.again();
			if (!more?.length) return;
			items = more; at = 0; right = 0; tries = 0; undo.length = 0; counts.fill(0); shownBoxes = null;
			el.classList.remove('is-done'); say.textContent = '';
			drawPile();
		});
		$('[data-close]', end).addEventListener('click', close);
		($('[data-again]', end) || $('[data-close]', end)).focus();
	}

	/* ---- keys, buttons, closing ---- */
	boxEls.forEach((b, k) => b.addEventListener('click', () => put(k)));
	undoBtn?.addEventListener('click', undoOne);
	$('#srt-x', el).addEventListener('click', close);
	const keys = (e) => {
		if (e.key === 'Escape') { e.preventDefault(); return close(); }
		if (e.key in KEYS && !el.classList.contains('is-done')) { e.preventDefault(); return put(KEYS[e.key]); }
		if ((e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) && mode === 'free') { e.preventDefault(); undoOne(); }
		if (e.key === 'Tab') { // keep the focus inside
			const f = $$('button:not([disabled]):not([hidden])', el).filter((x) => x.offsetParent);
			if (!f.length) return;
			const i = f.indexOf(document.activeElement);
			if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
		}
	};
	document.addEventListener('keydown', keys, true);
	function close() {
		document.removeEventListener('keydown', keys, true);
		document.body.classList.remove('srt-lock');
		el.classList.add('is-closing');
		setTimeout(() => el.remove(), REDUCE ? 0 : 220);
		current = null;
		opt.onClose?.({ counts, right, tries, total: items.length, at });
		back?.focus?.({ preventScroll: true });
	}
	current = { close };
	drawPile();
	el.focus({ preventScroll: true });
	return current;
}

export const shuffled = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
