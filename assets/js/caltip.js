/* The calendar's tooltips, after Codrops' «Tooltip Animations» (tympanus.net/codrops, Mary Lou, 2017): a hand-drawn
   speech shape pops out of a marked day, each kind of day with its own shape and its own way of arriving — Cora's
   round bubble spins in for us, Dori's banner drops on an elastic for our days, Smaug's pill swings in for the
   family, Gram's capsule stretches for Ramadan and the Eids, Indis' card rises for the days of the year, and Malva's
   burst shakes for a capsule letter. The original runs on anime.js; here the same moves are Web Animations, so
   nothing more is loaded. One tooltip serves the whole page: it moves to whichever day the mouse (or keyboard) is on. */
import { REDUCE } from './shell.js';

const SHAPES = {
	cora: 'M 199,21.9 C 152,22.2 109,35.7 78.8,57.4 48,79.1 29,109 29,142 29,172 45.9,201 73.6,222 101,243 140,258 183,260 189,270 200,282 200,282 200,282 211,270 217,260 261,258 299,243 327,222 354,201 371,172 371,142 371,109 352,78.7 321,57 290,35.3 247,21.9 199,21.9 Z',
	smaug: 'M 314,70 C 313,70 312,70 311,70 L 89.5,70 C 55.9,70 29.1,105 29.1,150 29.1,194 53.1,231 89.5,231 L 184,231 200,253 217,231 311,231 C 344,231 371,194 371,150 371,106 346,69 314,70 Z',
	dori: 'M 22,54.2 22,232 C 22,232 82,232 103,232 124,232 184,232 184,232 L 200,253 216,232 C 216,232 274,232 297,232 320,232 378,232 378,232 L 378,54.2 C 378,54.2 318,53.7 200,53.7 82,53.7 22,54.2 22,54.2 Z',
	gram: 'M 92.4,59 C 136,59 156,59.1 200,59.4 244,59.7 262,59 308,59 354,59 381,101 381,150 381,199 346,240 308,241 270,242 236,241 200,241 164,241 130,242 92.4,241 54.4,240 19,199 19,150 19,101 48.6,59 92.4,59 Z',
	indis: 'M 44.5,24 C 148,24 252,24 356,24 367,24 376,32.9 376,44 L 376,256 C 376,267 367,276 356,276 252,276 148,276 44.5,276 33.4,276 24.5,267 24.5,256 L 24.5,44 C 24.5,32.9 33.4,24 44.5,24 Z',
	malva: 'M 94.9,90.2 101,30.7 163,72.3 229,17.7 263,68.2 319,55.9 315,102 375,144 316,175 340,228 265,220 251,263 180,233 143,282 98.9,218 57.5,236 82,189 25,170 82.8,141 48.7,93.7 Z'
};
export const TYPE = { us: 'cora', days: 'dori', family: 'smaug', holy: 'gram', egypt: 'indis', capsule: 'malva' };

/* anime.js' easings, as CSS can say them */
const QUINT = 'cubic-bezier(0.22, 1, 0.36, 1)', EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)', INQ = 'cubic-bezier(0.55, 0.085, 0.68, 0.53)';
const ELASTIC = (() => { // easeOutElastic, sampled into linear() where the browser knows it
	const pts = Array.from({ length: 41 }, (_, i) => { const t = i / 40; return t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1; });
	const s = `linear(${pts.map((v) => +v.toFixed(3)).join(', ')})`;
	return CSS.supports('transition-timing-function', s) ? s : 'cubic-bezier(0.34, 1.56, 0.64, 1)';
})();

/* each kind's way in and out: [keyframes, timing] for the shape (base) and for the words (content) */
const MOVES = {
	cora: {
		in: { base: [[{ transform: 'scale(0) rotate(-180deg)', opacity: 0 }, { transform: 'none', opacity: 1, offset: 0.17 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: QUINT }],
			content: [[{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 250, easing: QUINT }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 150, delay: 50, easing: INQ }],
			content: [[{ transform: 'none', opacity: 1 }, { transform: 'translateY(20px)', opacity: 0 }], { duration: 100, easing: INQ }] }
	},
	smaug: {
		in: { base: [[{ transform: 'rotate(35deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' }],
			content: [[{ transform: 'translateX(50px) rotate(10deg)', opacity: 0 }, { opacity: 1, offset: 0.1 }, { transform: 'none', opacity: 1 }], { duration: 1000, delay: 50, easing: ELASTIC }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'rotate(-35deg)', opacity: 0 }], { duration: 200, delay: 100, easing: INQ }],
			content: [[{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30px) rotate(-10deg)', opacity: 0 }], { duration: 200, easing: INQ }] }
	},
	dori: {
		in: { base: [[{ transform: 'translateY(60px) scale(0.5)', opacity: 0 }, { opacity: 1, offset: 0.12 }, { transform: 'none', opacity: 1 }], { duration: 800, easing: ELASTIC }],
			content: [[{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 100, easing: QUINT }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'translateY(60px) scale(0.5)', opacity: 0 }], { duration: 200, easing: INQ }],
			content: [[{ transform: 'none', opacity: 1 }, { transform: 'translateY(20px)', opacity: 0 }], { duration: 100, easing: INQ }] }
	},
	gram: {
		in: { base: [[{ transform: 'scaleX(1.2)', opacity: 0 }, { opacity: 1, offset: 0.12 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: QUINT }],
			content: [[{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 100, easing: QUINT }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'scale(1.1, 0.9)', opacity: 0 }], { duration: 200, easing: INQ }],
			content: [[{ transform: 'none', opacity: 1 }, { transform: 'scale(0.8)', opacity: 0 }], { duration: 150, easing: INQ }] }
	},
	indis: {
		in: { base: [[{ transform: 'translateY(100px) scale(0.3, 1.3)', opacity: 0 }, { opacity: 1, offset: 0.1 }, { transform: 'none', opacity: 1 }], { duration: 900, easing: ELASTIC }],
			content: [[{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 50, easing: 'ease-out' }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100px) scale(0, 1.5)', opacity: 0 }], { duration: 320, delay: 50, easing: 'cubic-bezier(0.86, 0, 0.07, 1)' }],
			content: [[{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40px)', opacity: 0 }], { duration: 300, easing: 'ease-in-out' }] }
	},
	malva: {
		in: { base: [[{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.12 },
			{ transform: 'translate(3px,-3px) scale(1.15)', offset: 0.25 }, { transform: 'translate(-3px,3px) scale(1.2)', offset: 0.35 }, { transform: 'translate(3px,-3px) scale(1.25)', offset: 0.45 },
			{ transform: 'translate(-3px,3px) scale(1.3)', offset: 0.55 }, { transform: 'translate(3px,-3px) scale(1.35)', offset: 0.65 }, { transform: 'translate(-3px,3px) scale(1.4)', offset: 0.8 },
			{ transform: 'none', opacity: 1 }], { duration: 1250, easing: 'linear' }],
			content: [[{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: 150, easing: 'linear' }] },
		out: { base: [[{ transform: 'none', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 150, delay: 50, easing: INQ }],
			content: [[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: INQ }] }
	}
};

/**
 * Tooltips on the marked days inside `root`: `sel` finds them, `html(el)` fills the words, `kind(el)` picks the shape.
 * Returns a function that takes it all away.
 */
export function tooltips(root, sel, { html, kind }) {
	const tip = document.createElement('div');
	tip.className = 'ctip';
	tip.setAttribute('role', 'tooltip');
	tip.id = 'ctip';
	tip.innerHTML = '<div class="ctip__base"><svg class="ctip__shape" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><path/></svg><div class="ctip__content"></div></div>';
	document.body.append(tip);
	const base = tip.firstElementChild, path = tip.querySelector('path'), content = tip.querySelector('.ctip__content');
	let on = null, type = 'cora', wait = 0, anims = [];

	const play = (dir) => {
		anims.forEach((a) => a.cancel());
		const m = MOVES[type][dir];
		if (REDUCE) { base.style.opacity = dir === 'in' ? 1 : 0; content.style.opacity = dir === 'in' ? 1 : 0; anims = []; return; }
		anims = [base.animate(m.base[0], { ...m.base[1], fill: 'both' }), content.animate(m.content[0], { ...m.content[1], fill: 'both' })];
	};
	const place = (el) => {
		const r = el.getBoundingClientRect();
		const w = tip.offsetWidth, h = tip.offsetHeight;
		const below = r.top - h < 8;                 // no room above: hang under the day, the shape turned over
		tip.classList.toggle('is-below', below);
		const x = Math.min(innerWidth - w / 2 - 8, Math.max(w / 2 + 8, r.left + r.width / 2));
		tip.style.left = `${x}px`;
		tip.style.top = below ? `${r.bottom + 2}px` : `${r.top - h + h * 0.05}px`;
		tip.style.setProperty('--nub', `${r.left + r.width / 2 - x}px`);
	};
	const show = (el) => {
		if (on === el) return;
		if (on) on.classList.remove('is-tip');
		on = el;
		type = MOVES[kind(el)] ? kind(el) : 'cora';
		tip.dataset.type = type;
		path.setAttribute('d', SHAPES[type]);
		tip.style.setProperty('--k', getComputedStyle(el).getPropertyValue('--k') || 'var(--coral)');
		content.innerHTML = html(el);
		// a busy day gets a taller shape: the words never spill over its edge
		tip.style.height = '';
		tip.style.height = `${Math.max(202, Math.ceil(content.scrollHeight / ({ cora: 0.5, malva: 0.45 }[type] || 0.62)))}px`;
		el.setAttribute('aria-describedby', 'ctip');
		el.classList.add('is-tip');
		place(el);
		play('in');
	};
	const hide = () => {
		clearTimeout(wait);
		if (!on) return;
		on.classList.remove('is-tip');
		on.removeAttribute('aria-describedby');
		on = null;
		play('out');
	};
	// like the original: a beat on the day before it opens, so sweeping the mouse across the month doesn't set off a storm
	const over = (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; const el = e.target.closest(sel); if (!el || !root.contains(el)) return; clearTimeout(wait); wait = setTimeout(() => show(el), on ? 0 : 75); };
	const out = (e) => { const el = e.target.closest(sel); if (!el || el.contains(e.relatedTarget)) return; hide(); };
	const focus = (e) => { const el = e.target.closest?.(sel); if (el && el.matches(':focus-visible')) show(el); };
	const blur = (e) => { if (e.target.closest?.(sel)) hide(); };
	const away = () => hide();
	root.addEventListener('pointerover', over);
	root.addEventListener('pointerout', out);
	root.addEventListener('focusin', focus);
	root.addEventListener('focusout', blur);
	addEventListener('scroll', away, { passive: true });
	return () => { hide(); tip.remove(); root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out); root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur); removeEventListener('scroll', away); };
}
