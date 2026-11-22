import { L, T, t, esc, img, fmtDate, pageHead, related } from '../shell.js';

/* Love notes: the little things we wrote to each other, scattered over the page like notes left on a table — in no
   order and no rows, each tilted its own way and nudged off the line, shuffled anew every visit. Each note is shown
   the way it was written (its «orig» language — Franco, English or Arabic) whichever language the site is in; only a
   note with no «orig» follows the site's language. */
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const rnd = (lo, hi) => (lo + Math.random() * (hi - lo)).toFixed(1);
const textOf = (n) => (n.orig && n.text?.[n.orig] ? n.text[n.orig] : t(n.text));

export default {
	title: { ar: 'رسايل حب', en: 'Love notes' },
	render(s) {
		return `
		${pageHead(L('رسايل حب', 'Love notes'), L('كلام صغير كتبناه لبعض', 'Little things we wrote to each other'), [{ href: 'notes.html', ar: 'رسايل حب', en: 'Love notes' }])}
		<section class="sec notes"><div class="wrap">
			<div class="notes__scatter">${shuffle(s.notes || []).map((n, k) => `
				<figure class="note note--${n.by === 'him' ? 'him' : 'her'} reveal" style="--tilt:${rnd(-6, 6)}deg;--dx:${rnd(-22, 22)}px;--dy:${rnd(0, 34)}px;--w:${rnd(82, 100)}%;--delay:${(k % 4) * 0.08}s">
					${n.label ? `<small class="note__label">${T(n.label)}</small>` : ''}
					<p dir="auto">${esc(textOf(n))}</p>
					${n.photo ? `<div data-media-box>${img(n.photo, '', 'zoom')}</div>` : ''}
					<footer>— ${T(n.by === 'him' ? s.him : s.her)}${n.date ? `، ${fmtDate(n.date)}` : ''}</footer>
				</figure>`).join('')}
			</div>
		</div></section>
		${related(['letters', 'gallery', 'wishes'])}`;
	}
};
