import { L, T, t, esc, img, num, fmtDate, pageHead, related } from '../shell.js';

/* Love notes: the little things we wrote to each other, scattered over the page like notes left on a table — in no
   order and no rows, each tilted its own way and nudged off the line, shuffled anew every visit. Each note is shown
   the way it was written (its «orig» language — Franco, English or Arabic) whichever language the site is in; only a
   note with no «orig» follows the site's language. */
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const rnd = (lo, hi) => (lo + Math.random() * (hi - lo)).toFixed(1);
const textOf = (n) => (n.orig && n.text?.[n.orig] ? n.text[n.orig] : t(n.text));
const short = (x, n) => { const a = [...String(x || '')]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };

/* the top: our fridge door — «B7BK ♥» in magnet letters, three of the notes held up by magnets, and a magnet that
   counts them, how many from him and how many from her */
const MAG = ['#d9534f', '#0e6990', '#fdc830', '#5a9e6f', '#8e5bd1'];
function fridge(s) {
	const all = s.notes || [];
	const him = all.filter((n) => n.by === 'him').length;
	const three = shuffle(all.filter((n) => !n.photo && textOf(n))).slice(0, 3);
	return `<div class="nf-band" aria-hidden="true"><div class="nf-door">
		<span class="nf-handle"></span>
		<p class="nf-letters">${[...'B7BK'].map((c, i) => `<b style="--c:${MAG[i % MAG.length]};--r:${[-8, 6, -4, 9][i]}deg">${c}</b>`).join('')}<b class="nf-heart" style="--c:${MAG[0]};--r:-6deg">♥</b></p>
		<div class="nf-notes">${three.map((n, i) => `<span class="nf-note nf-note--${i}" style="--m:${MAG[(i + 1) % MAG.length]}">
			<i class="nf-mag"></i>
			<span dir="auto">${esc(short(textOf(n), 54))}</span>
			<small>— ${T(n.by === 'him' ? s.him : s.her)}</small>
		</span>`).join('')}
			<span class="nf-count"><i class="nf-mag" style="--m:${MAG[2]}"></i><b>${num(all.length)}</b><small>${L('رسالة حب', 'love notes')}</small><em>${T(s.him)} ${num(him)} · ${T(s.her)} ${num(all.length - him)}</em></span>
		</div>
	</div></div>`;
}

export default {
	title: { ar: 'رسايل حب', en: 'Love notes' },
	render(s) {
		return `
		${pageHead(L('رسايل حب', 'Love notes'), L('كلام صغير كتبناه لبعض', 'Little things we wrote to each other'), [{ href: 'notes.html', ar: 'رسايل حب', en: 'Love notes' }], { band: fridge(s) })}
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
