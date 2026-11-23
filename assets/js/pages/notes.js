import { L, Y, T, t, esc, img, num, fmtDate, pageHead, related, $, $$, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';

/* Love notes: the little things we wrote to each other.
   The top is an envelope with one note pulled out, read in full — «واحدة تانية» slips it back and draws another — and
   beside it how many there are, who wrote how many (a bar in his colour and hers), and chips to see all of them, only
   his or only hers.
   Below, the notes lie on the table where they fell: no rows and no columns. Each gets a width from how much it says
   (a line is a small slip, a long letter a wide sheet), and they are dropped one by one at a random spot across the
   board, each sliding up until it meets the notes already there, tilted its own way — so the layout is different on
   every visit and at every width. Each note is shown the way it was written (its «orig» language — Franco, English or
   Arabic) whichever language the site is in; only a note with no «orig» follows the site's language. */
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
const textOf = (n) => (n.orig && n.text?.[n.orig] ? n.text[n.orig] : t(n.text));
const dirOf = (n) => (n.orig === 'ar' ? 'rtl' : n.orig ? 'ltr' : 'auto');
const lenOf = (n) => [...String(textOf(n) || '')].length;
const yr = (d) => num(+String(d).slice(0, 4)).replace(/[٬,]/g, '');

let bye = null;

function hero(s, notes) {
	const him = notes.filter((n) => n.by === 'him').length, her = notes.length - him;
	const dated = notes.map((n) => n.date).filter(Boolean).sort();
	const withPhoto = notes.filter((n) => n.photo).length;
	const pct = notes.length ? Math.round((him / notes.length) * 100) : 50;
	return `<div class="nh">
		<div class="nh-env" aria-live="polite">
			<div class="nh-env__back"></div>
			<figure class="nh-slip" id="nh-slip"></figure>
			<div class="nh-env__front"><span class="nh-env__seal">${doodle('heart', 22)}</span></div>
		</div>
		<div class="nh-body">
			<p class="nh-k">${doodle('letter', 16)} ${L('من ساعة ما عرفنا بعض', 'Since we met')}${dated.length ? ` · ${L(`أول واحدة سنة ${yr(dated[0])}`, `the first in ${String(dated[0]).slice(0, 4)}`)}` : ''}</p>
			<p class="nh-count"><b>${num(notes.length)}</b> <span>${L('رسالة حب كتبناها لبعض', 'love notes we wrote each other')}</span></p>
			<div class="nh-split" role="img" aria-label="${esc(L(`${T(s.him)} ${num(him)}، ${T(s.her)} ${num(her)}`, `${t(s.him)} ${him}, ${t(s.her)} ${her}`))}">
				<span class="nh-split__bar"><i class="is-him" style="width:${pct}%"></i><i class="is-her" style="width:${100 - pct}%"></i></span>
				<span class="nh-split__who"><span class="is-him">${T(s.him)} <b>${num(him)}</b></span><span class="is-her">${T(s.her)} <b>${num(her)}</b></span></span>
			</div>
			${withPhoto ? `<p class="nh-more">${doodle('camera', 16)} ${L(`${num(withPhoto)} منهم معاها صورة`, `${withPhoto} come with a photo`)}</p>` : ''}
			<div class="nh-who" role="group" aria-label="${L('مين كاتبها', 'Who wrote it')}">
				<button class="chip is-on" type="button" data-who="all" aria-pressed="true">${L('الكل', 'All')}</button>
				<button class="chip" type="button" data-who="him" aria-pressed="false">${L(`من ${T(s.him)}`, `From ${t(s.him)}`)}</button>
				<button class="chip" type="button" data-who="her" aria-pressed="false">${L(`من ${T(s.her)}`, `From ${t(s.her)}`)}</button>
			</div>
			<div class="nh-btns">
				<button class="btn btn--sm" type="button" id="nh-next">${doodle('letter', 18)} ${Y('اقرا واحدة تانية', 'اقري واحدة تانية', 'Read another')}</button>
			</div>
		</div>
	</div>`;
}

export default {
	title: { ar: 'رسايل حب', en: 'Love notes' },
	render(s) {
		const notes = s.notes || [];
		return `<section class="sec sec--top nh-top"><div class="wrap">${hero(s, notes)}</div></section>
		${pageHead(L('رسايل حب', 'Love notes'), L('كلام صغير كتبناه لبعض', 'Little things we wrote to each other'), [{ href: 'notes.html', ar: 'رسايل حب', en: 'Love notes' }], { band: '' })}
		<section class="sec notes"><div class="wrap">
			<div class="nt-board" id="nt-board">${shuffle(notes).map((n) => `
				<figure class="note nt-note note--${n.by === 'him' ? 'him' : 'her'}" data-by="${n.by === 'him' ? 'him' : 'her'}" data-len="${lenOf(n)}"${n.photo ? ' data-photo' : ''} style="--tilt:${rnd(-5, 5).toFixed(1)}deg">
					${n.label ? `<small class="note__label">${T(n.label)}</small>` : ''}
					<p dir="${dirOf(n)}">${esc(textOf(n))}</p>
					${n.photo ? `<div data-media-box>${img(n.photo, '', 'zoom')}</div>` : ''}
					<footer>— ${T(n.by === 'him' ? s.him : s.her)}${n.date ? `، ${fmtDate(n.date)}` : ''}</footer>
				</figure>`).join('')}
			</div>
		</div></section>
		${related(['letters', 'gallery', 'wishes'])}`;
	},
	leave() { bye?.(); bye = null; },
	after(main, s) {
		bye?.();
		const ac = new AbortController(), on = { signal: ac.signal };
		bye = () => ac.abort();
		const notes = s.notes || [];
		let who = 'all';

		/* the envelope: one note out at a time, drawn from a shuffled pile; «another» slips it back and pulls the next */
		const slip = $('#nh-slip', main);
		let pile = [];
		const draw = () => {
			const pool = notes.filter((n) => textOf(n) && (who === 'all' || (who === 'him') === (n.by === 'him')));
			if (!pool.length) { slip.innerHTML = ''; return; }
			if (!pile.length) pile = shuffle(pool);
			const n = pile.pop();
			slip.className = `nh-slip note--${n.by === 'him' ? 'him' : 'her'}${lenOf(n) > 140 ? ' is-long' : ''}`;
			slip.innerHTML = `<p dir="${dirOf(n)}">${esc(textOf(n))}</p><footer>— ${T(n.by === 'him' ? s.him : s.her)}${n.date ? `، ${fmtDate(n.date)}` : ''}</footer>`;
		};
		const next = () => {
			if (REDUCE) return draw();
			slip.classList.add('is-in');
			setTimeout(() => { draw(); requestAnimationFrame(() => slip.classList.remove('is-in')); }, 380);
		};
		draw();
		$('#nh-next', main).addEventListener('click', next, on);

		/* the board: drop the notes one by one where they fit */
		const board = $('#nt-board', main);
		const cards = $$('.nt-note', board);
		const widthOf = (el, W) => {
			if (W < 560) return Math.round(W * rnd(0.8, 0.94));
			const len = +el.dataset.len;
			let w = len <= 16 ? rnd(190, 230) : len <= 45 ? rnd(230, 285) : len <= 110 ? rnd(280, 340) : rnd(400, 500);
			if (el.hasAttribute('data-photo')) w = Math.max(w, rnd(270, 320));
			return Math.round(Math.min(w, W - 16));
		};
		let lastW = 0;
		const lay = (force) => {
			const W = board.clientWidth;
			if (!W || (!force && W === lastW)) return;
			const resized = W !== lastW;
			lastW = W;
			const gap = W < 560 ? 30 : 34, placed = [];
			for (const el of cards) {
				if (el.hidden) continue;
				if (!el.dataset.w || resized) el.dataset.w = widthOf(el, W);
				const w = Math.min(+el.dataset.w, W - 8);
				el.style.width = `${w}px`;
				const h = el.offsetHeight;
				let best = null;
				const xs = [0, W - w, ...Array.from({ length: 22 }, () => Math.random() * (W - w))];
				for (const x of xs) {
					let y = 0;
					for (const r of placed) if (x < r.x + r.w + gap * 0.6 && r.x < x + w + gap * 0.6) y = Math.max(y, r.y + r.h + gap);
					const score = y + Math.random() * 46;
					if (!best || score < best.score) best = { x, y, score };
				}
				const y = best.y + (placed.length ? Math.round(rnd(0, 16)) : 8);
				placed.push({ x: best.x, y, w, h });
				el.style.insetInlineStart = '';
				el.style.left = `${Math.round(best.x)}px`;
				el.style.top = `${y}px`;
			}
			board.style.height = `${Math.max(0, ...placed.map((r) => r.y + r.h)) + 30}px`;
			// the first time they appear where they lie; after that (a filter, a new width) they slide there
			if (!board.classList.contains('is-laid')) requestAnimationFrame(() => requestAnimationFrame(() => board.classList.add('is-laid')));
		};
		lay(true);
		let tm;
		const again = (force) => { clearTimeout(tm); tm = setTimeout(() => lay(force), 120); };
		const ro = new ResizeObserver(() => again());
		ro.observe(board);
		ac.signal.addEventListener('abort', () => { clearTimeout(tm); ro.disconnect(); });
		board.addEventListener('load', () => again(true), { capture: true, signal: ac.signal });
		document.fonts?.ready.then(() => { if (!ac.signal.aborted) lay(true); });

		/* all of them, only his, or only hers */
		$('.nh-who', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-who]');
			if (!b || b.dataset.who === who) return;
			who = b.dataset.who;
			for (const c of $$('[data-who]', main)) { c.classList.toggle('is-on', c === b); c.setAttribute('aria-pressed', String(c === b)); }
			for (const el of cards) el.hidden = who !== 'all' && el.dataset.by !== who;
			pile = [];
			next();
			lay(true);
		}, on);
	}
};
