import { L, Y, T, esc, longDate, pageHead, related, REDUCE, App, $, $$ } from '../shell.js';

/* Letters for you. Each letter waits in a pink envelope that floats over its shadow, its card peeking out on hover
   and little hearts rising from it (after Lena Stanley's «CSS Love letter»). The heart on the front opens it: the flap
   folds back and the letter comes out as a stack of pages, a paragraph to a page, each set a little askew — drag a page
   aside, or tap the hearts at its top, to read the next (after Frills' «CSS Love Letters»). */

/* a letter's pages: «to» and the first paragraph, the middle ones, the last with the signature */
function pagesOf(x) {
	const paras = App.t(x.body).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
	if (!paras.length) paras.push('');
	return paras.map((p, n) => `
		<blockquote class="lv-page" style="--n:${n}; z-index:${paras.length - n}" tabindex="0">
			<button class="lv-page__x" type="button" aria-label="${L('الصفحة اللي بعدها', 'Next page')}"><span aria-hidden="true">˚ʚ♥ɞ˚</span></button>
			${n === 0 ? `<h3>${T(x.to)}</h3>` : ''}
			<p>${esc(p)}</p>
			${n === paras.length - 1 ? `<cite>${T(x.from)}</cite>` : ''}
			<small class="lv-page__n">${paras.length > 1 ? `${n + 1} / ${paras.length}` : ''}</small>
		</blockquote>`).join('');
}

export default {
	title: { ar: 'جوابات', en: 'Letters' },
	render(s) {
		const list = s.letters || [];
		return `
		${pageHead(L('جواباتنا', 'Letters for you'), Y('دوس على القلب عشان الجواب يتفتح', 'دوسي على القلب عشان الجواب يتفتح', 'Tap the heart to open a letter'), [{ href: 'letters.html', ar: 'جوابات', en: 'Letters' }])}
		<section class="sec sec--top"><div class="wrap">
			${list.map((x, k) => `
			<div class="lv-block" id="${esc(x.id)}">
				<h2 class="letter-block__h reveal">${T(x.title)}</h2>
				${x.date ? `<p class="sec__sub reveal">${longDate(x.date)}</p>` : ''}
				<div class="lv reveal" data-k="${k}">
					<div class="lv-float">
						<div class="lv-hearts" aria-hidden="true"><i>♥</i><i>♥</i><i>♥</i><i>♥</i><i>♥</i></div>
						<div class="lv-env">
							<div class="lv-back"></div>
							<div class="lv-card"><span dir="auto">${T(x.to)}</span><i aria-hidden="true">♥</i></div>
							<div class="lv-fold lv-fold--l"></div>
							<div class="lv-fold lv-fold--r"></div>
							<div class="lv-fold lv-fold--b"></div>
							<div class="lv-flap"></div>
							<button class="lv-heart" type="button" aria-expanded="false" aria-controls="lv-pages-${k}"><span>${Y('افتح', 'افتحي', 'Open')}</span></button>
						</div>
					</div>
					<div class="lv-shadow" aria-hidden="true"></div>
				</div>
				<div class="lv-pages" id="lv-pages-${k}" hidden>
					<div class="lv-stack">${pagesOf(x)}</div>
					<p class="lv-again" hidden><button class="btn btn--ghost" type="button">${L('اقرا الجواب تاني', 'Read it again')} ♥</button></p>
				</div>
			</div>`).join('')}
		</div></section>
		${related(['notes', 'birthday', 'wishes'])}`;
	},
	after(main) {
		for (const lv of $$('.lv', main)) {
			const btn = $('.lv-heart', lv);
			const box = $('#' + btn.getAttribute('aria-controls'), main);
			btn.onclick = () => {
				if (lv.classList.contains('is-open')) return;
				lv.classList.add('is-open');
				btn.setAttribute('aria-expanded', 'true');
				setTimeout(() => {
					box.hidden = false;
					box.classList.add('is-in');
					box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
				}, REDUCE ? 0 : 1100);
			};
			stack(box);
		}
	}
};

/* the pages: the top one goes when it's dragged far enough or its hearts are tapped; when none are left, read again */
function stack(box) {
	const pages = $$('.lv-page', box);
	const again = $('.lv-again', box);
	const top = () => pages.find((p) => !p.classList.contains('is-away'));
	const away = (p, dx = 1) => {
		const dir = Math.sign(dx) || (App.lang === 'ar' ? -1 : 1);
		p.classList.add('is-away');
		p.style.setProperty('--out', `${dir * 130}%`);
		p.style.translate = '';
		const next = top();
		if (next) next.focus({ preventScroll: true });
		else setTimeout(() => { again.hidden = false; }, 350);
	};
	for (const p of pages) {
		$('.lv-page__x', p).onclick = (e) => { e.stopPropagation(); if (top() === p) away(p); };
		p.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === p && top() === p) { e.preventDefault(); away(p); } };
		// drag (mouse or finger) the top page aside
		let x0 = null, y0 = 0, dx = 0, dy = 0;
		p.addEventListener('pointerdown', (e) => {
			if (e.target.closest('button') || top() !== p) return;
			x0 = e.clientX; y0 = e.clientY; dx = dy = 0;
			p.setPointerCapture(e.pointerId);
			p.classList.add('is-drag');
		});
		p.addEventListener('pointermove', (e) => {
			if (x0 === null) return;
			dx = e.clientX - x0; dy = e.clientY - y0;
			p.style.translate = `${dx}px ${dy}px`;
		});
		const drop = () => {
			if (x0 === null) return;
			x0 = null;
			p.classList.remove('is-drag');
			if (Math.hypot(dx, dy) > 110) away(p, dx);
			else p.style.translate = '';
		};
		p.addEventListener('pointerup', drop);
		p.addEventListener('pointercancel', drop);
	}
	$('button', again).onclick = () => {
		again.hidden = true;
		pages.forEach((p, n) => setTimeout(() => p.classList.remove('is-away'), n * 90));
		setTimeout(() => pages[0].focus({ preventScroll: true }), pages.length * 90);
	};
}
