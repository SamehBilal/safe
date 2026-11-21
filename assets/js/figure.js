/* The figure on «لبس الليلة» in our room (secret.js): a woman drawn in thin brown line art, in the style of a fashion
   sketch — an inverted-triangle figure (shoulders and bust broader than the hips, slim legs), standing front-on with her
   hands resting by her thighs, in a 600×600 drawing — and whatever's chosen for tonight drawn on her. Each outfit piece
   in secret.json names its `look`; LOOKS says how that look is drawn (and what it covers: the plain underwear she has on
   until a set or something underneath is chosen). A look we don't know is simply not drawn (the label still shows it). */

const INK = '#5b3a2e', SKIN = '#f7dcc8', HAIR = '#6b4330', GOLD = '#d4a017';
const mirror = 'transform="matrix(-1 0 0 1 600 0)"';

/* her outline: the torso and legs as one shape, an arm (the other is its mirror), the head, the hair */
const BODY = `M288 134 C278 142 254 146 238 152 C226 156 222 168 226 184 L246 204 C244 226 250 248 266 272 C270 290 262 312 256 336 C252 356 252 372 256 390
	C260 430 264 456 270 476 C272 504 274 532 278 554 C276 568 268 580 272 588 C282 592 292 590 295 584 C295 572 293 560 292 552
	C294 520 296 492 294 476 C294 444 298 414 299 392 C299.5 386 300.5 386 301 392 C302 414 306 444 306 476 C304 492 306 520 308 552
	C307 560 305 572 305 584 C308 590 318 592 328 588 C332 580 324 568 322 554 C326 532 328 504 330 476 C336 456 340 430 344 390
	C348 372 348 356 344 336 C338 312 330 290 334 272 C350 248 356 226 354 204 L374 184 C378 168 374 156 362 152 C346 146 322 142 312 134 Z`;
const ARM = `M232 154 C216 162 212 182 212 206 C210 232 212 254 214 272 C212 296 214 320 222 344 C224 356 228 372 236 380 C242 384 248 378 246 368
	C244 356 238 346 236 338 C232 316 232 292 234 272 C238 250 242 228 244 206 Z`;
const HAIR_BACK = `M300 28 C262 28 242 54 244 92 C244 116 236 136 228 152 C224 162 230 172 240 170 C236 180 246 188 256 180 C262 172 266 150 270 128 C274 96 286 66 300 60
	C314 66 326 96 330 128 C334 150 338 172 344 180 C354 188 364 180 360 170 C370 172 376 162 372 152 C364 136 356 116 356 92 C358 54 338 28 300 28 Z`;
const FRINGE = 'M274 86 C274 62 290 50 304 52 C318 54 328 66 327 84 C320 70 310 64 300 66 C290 70 280 78 274 86 Z';
const NECK = 'M289 104 L288 140 L312 140 L311 104 Z';
const DETAIL = `M278 150 C288 156 296 156 300 152 M322 150 C312 156 304 156 300 152
	M256 226 C268 240 286 240 296 230 M304 230 C314 240 332 240 344 226
	M299 292 C300 295 301 295 302 292 M274 470 C278 474 282 474 286 470 M314 470 C318 474 322 474 326 470`;
const FACE = `<path d="M283 84 C287 88 293 88 297 84 M303 84 C307 88 313 88 317 84" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
	<path d="M299 89 C298 93 298 95 300 96" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
	<path d="M294 101 C297 99 299 100 300 101 C301 100 303 99 306 101 C303 105 297 105 294 101 Z" fill="#c0392b"/>
	<ellipse cx="285" cy="94" rx="5" ry="3" fill="#f0a3a0" opacity=".55"/><ellipse cx="315" cy="94" rx="5" ry="3" fill="#f0a3a0" opacity=".55"/>`;

/* the plain set she wears until something covers it */
const BRA = 'M252 204 C254 230 284 238 297 224 L303 224 C316 238 346 230 348 204 C334 196 314 200 300 214 C286 200 266 196 252 204 Z';
const STRAPS = 'M256 206 L264 150 M344 206 L336 150';
const BRIEF = 'M258 314 C274 320 292 322 300 322 C308 322 326 320 342 314 C340 334 326 354 302 374 L298 374 C274 354 260 334 258 314 Z';
const base = (fill, stroke = INK) => ({
	bra: `<path d="${STRAPS}" stroke="${stroke}" stroke-width="2" fill="none"/><path d="${BRA}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`,
	brief: `<path d="${BRIEF}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`
});
const chain = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="${w}" stroke-dasharray="2.2 1.6" stroke-linecap="round"/>`;
const butterfly = (x, y, s = 1, c = GOLD) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-6 -8 -10 -4 -8 0 C-10 4 -6 7 0 1 C6 7 10 4 8 0 C10 -4 6 -8 0 0 Z" fill="${c}" stroke="${INK}" stroke-width=".6"/></g>`;
const coins = (pts, r = 2.6) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${INK}" stroke-width=".6"/>`).join('');
const along = (x0, x1, y, n, sag = 0) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), x = x0 + (x1 - x0) * t; return [x, y + Math.sin(t * Math.PI) * sag]; });
/* a ruffled hem from x0 to x1 at y, as little scallops */
const ruffle = (x0, x1, y, n = 9, d = 8) => { const w = (x1 - x0) / n; let s = ''; for (let i = 0; i < n; i++) s += ` Q${(x0 + w * (i + 0.5)).toFixed(1)} ${y + d} ${(x0 + w * (i + 1)).toFixed(1)} ${y}`; return s; };

/* each look: what it hides of the plain set, what goes behind her, under her arms, over everything, and on her head */
const LOOKS = {
	'ruffle-dress': { hide: ['bra', 'brief'], under: () => {
		const red = '#c62828', dark = '#8e1b1b';
		return `<path d="M258 206 L264 150 M342 206 L336 150" stroke="${red}" stroke-width="3"/>
		<path d="M252 202 C268 196 288 204 300 212 C312 204 332 196 348 202 C350 226 346 250 336 272 C350 300 366 350 380 404${ruffle(380, 220, 404, 10, 9)} C234 350 250 300 264 272 C254 250 250 226 252 202 Z" fill="${red}" stroke="${dark}" stroke-width="1.6"/>
		<path d="M264 272 C286 280 314 280 336 272" fill="none" stroke="${dark}" stroke-width="1.4"/>
		<path d="M240 356 C272 368 328 368 360 356" fill="none" stroke="${dark}" stroke-width="1.2" opacity=".6"/>
		<path d="M228 384${ruffle(228, 372, 384, 9, 7)}" fill="none" stroke="${dark}" stroke-width="1.2" opacity=".7"/>`; } },
	'lace-body': { hide: ['bra', 'brief'], over: () => `<g clip-path="url(#sx-skin)"><rect x="150" y="146" width="300" height="420" fill="url(#sx-lace)"/></g>
		<path d="M260 152 C278 178 322 178 340 152" fill="none" stroke="#111" stroke-width="2.4"/>
		<path d="M252 204 C266 196 288 204 300 214 C312 204 334 196 348 204" fill="none" stroke="#111" stroke-width="1.6" opacity=".8"/>` },
	dance: { hide: ['bra', 'brief'], under: () => {
		const tq = '#1aa6a6', dk = '#0b6b6b';
		return `<path d="M256 318 C240 380 236 470 240 556 L294 556 C294 470 298 400 300 374 C302 400 306 470 306 556 L360 556 C364 470 360 380 344 318 Z" fill="${tq}" opacity=".42" stroke="${dk}" stroke-width="1"/>
		<path d="M258 206 L266 150 M342 206 L334 150" stroke="${tq}" stroke-width="3"/>
		<path d="${BRA}" fill="${tq}" stroke="${dk}" stroke-width="1.6"/>${coins([[258, 224], [266, 231], [277, 236], [289, 234], [311, 234], [323, 236], [334, 231], [342, 224]])}
		<path d="M256 312 C272 320 292 322 300 322 C308 322 328 320 344 312 L346 330 C328 338 310 340 300 340 C290 340 272 338 254 330 Z" fill="${tq}" stroke="${dk}" stroke-width="1.6"/>
		<path d="M266 340 C282 370 318 370 334 340 Z" fill="${tq}" stroke="${dk}" stroke-width="1.2"/>
		${coins(along(256, 344, 342, 12, 10), 3)}`; } },
	bride: { hide: ['bra', 'brief'], back: () => `<path d="M272 42 C230 80 210 200 212 330 C238 336 260 330 268 320 C264 240 270 140 300 40 C330 140 336 240 332 320 C340 330 362 336 388 330 C390 200 370 80 328 42 Z" fill="#ffffff" opacity=".82" stroke="#ece7df" stroke-width="1.2"/>`,
		under: () => `<path d="${STRAPS}" stroke="#fff" stroke-width="2.4" fill="none"/><path d="${BRA}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="1.6"/>
		<path d="M258 212 C272 226 288 226 296 220 M304 220 C312 226 328 226 342 212" fill="none" stroke="#d8cfc2" stroke-dasharray="1.5 2.5"/>
		<path d="${BRIEF}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="1.6"/>
		<path d="M262 328 L266 410 M338 328 L334 410" stroke="#e8e2d8" stroke-width="1.6"/><path d="M258 408 C266 414 282 414 294 410 M306 410 C318 414 334 414 342 408" fill="none" stroke="#fffdf8" stroke-width="7" stroke-linecap="round"/><path d="M258 408 C266 414 282 414 294 410 M306 410 C318 414 334 414 342 408" fill="none" stroke="#bfb6aa" stroke-width="1" stroke-dasharray="2 2"/>`,
		head: () => `<path d="M278 46 C286 34 314 34 322 46" fill="none" stroke="#f4f0ea" stroke-width="5" stroke-linecap="round"/>${coins(along(280, 320, 44, 6, -5), 2)}` },
	harness: { hide: ['bra', 'brief'], under: () => {
		const k = '#1b1b1f';
		return `<path d="${STRAPS}" stroke="${k}" stroke-width="2.4" fill="none"/><path d="${BRA}" fill="${k}" stroke="${k}"/><path d="${BRIEF}" fill="${k}" stroke="${k}"/>
		<path d="M286 134 C294 138 306 138 314 134" fill="none" stroke="${k}" stroke-width="6" stroke-linecap="round"/>
		<path d="M300 138 L300 300 M262 240 C284 248 316 248 338 240 M266 272 C286 280 314 280 334 272 M262 240 L266 272 M338 240 L334 272 M290 140 L258 204 M310 140 L342 204" fill="none" stroke="${k}" stroke-width="3.2"/>
		<circle cx="300" cy="246" r="5" fill="none" stroke="#c0c0c8" stroke-width="2"/><circle cx="300" cy="138" r="4" fill="none" stroke="#c0c0c8" stroke-width="2"/>
		<path d="M258 340 C268 330 280 350 268 382 M342 340 C332 330 320 350 332 382" fill="none" stroke="${k}" stroke-width="3"/>`; },
		head: () => '<path d="M274 80 C282 70 296 72 300 80 C304 72 318 70 326 80 C328 90 318 96 308 93 C304 91 302 89 300 89 C298 89 296 91 292 93 C282 96 272 90 274 80 Z" fill="#1b1b1f"/><path d="M276 80 L262 76 M324 80 L338 76" stroke="#1b1b1f" stroke-width="2.4"/>' },
	'gold-chains': { over: () => `${chain('M266 150 C280 190 320 190 334 150')}${chain('M258 152 C274 216 326 216 342 152')}${chain('M300 202 L300 294', 2)}
		${chain('M266 284 C282 300 318 300 334 284')}${chain('M256 334 C276 358 324 358 344 334')}${coins([[300, 188], [300, 214], [300, 298], [300, 352]], 3)}` },
	'arm-chain': { over: () => `${chain('M212 214 C218 224 236 224 244 212', 2.4)}${chain('M213 228 C220 236 236 236 243 226', 1.8)}${butterfly(228, 227, 0.9)}` },
	cuffs: { over: () => {
		const k = '#1b1b1f';
		return `<path d="M219 334 L238 330 L241 343 L222 348 Z M381 334 L362 330 L359 343 L378 348 Z" fill="${k}"/>
		<circle cx="230" cy="340" r="3" fill="none" stroke="#c0c0c8" stroke-width="1.6"/><circle cx="370" cy="340" r="3" fill="none" stroke="#c0c0c8" stroke-width="1.6"/>
		<path d="M264 266 C286 276 314 276 336 266 L338 280 C314 290 286 290 262 280 Z" fill="${k}"/><circle cx="300" cy="282" r="4" fill="none" stroke="#c0c0c8" stroke-width="1.8"/>`; } },
	cymbals: { over: () => coins([[238, 377], [244, 381], [362, 377], [356, 381]], 3.6) },
	'pearl-thong': { hide: ['brief'], under: () => {
		const pts = [...along(258, 342, 316, 12, 6), ...Array.from({ length: 6 }, (_, i) => [300 + (i % 2 ? 1 : -1) * 0.5, 328 + i * 8])];
		return pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fffaf0" stroke="#b9ab95" stroke-width=".8"/>`).join('') + '<path d="M286 326 C292 340 296 352 300 374 C304 352 308 340 314 326 Z" fill="#f2e6e9" stroke="#b9ab95" stroke-width="1"/>'; } },
	'butterfly-anklet': { over: () => `${chain('M277 548 C282 556 289 556 293 548', 2)}${butterfly(285, 555, 0.6)}${butterfly(291, 552, 0.45)}` },
	'coin-anklet': { over: () => `${chain('M307 548 C312 556 318 556 323 548', 2)}${coins(along(309, 321, 556, 4, 2), 2.2)}` }
};

/** The drawing: her, and the given looks on her (ids from LOOKS, the ones we don't know are skipped). */
export function figureSVG(looks = []) {
	const on = looks.map((l) => LOOKS[l]).filter(Boolean);
	const hidden = new Set(on.flatMap((l) => l.hide || []));
	const layer = (k) => on.map((l) => l[k]?.() || '').join('');
	const plain = base('#e8d3c3');
	return `<svg class="sx-fig__svg" viewBox="0 0 600 600" aria-hidden="true">
		<defs>
			<clipPath id="sx-skin"><path d="${BODY}"/><path d="${ARM}"/><path d="${ARM}" ${mirror}/></clipPath>
			<pattern id="sx-lace" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#151518" opacity=".28"/><path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke="#111" stroke-width="1" opacity=".85"/><circle cx="6" cy="6" r="1.2" fill="#111" opacity=".8"/></pattern>
		</defs>
		<path d="${HAIR_BACK}" fill="${HAIR}" stroke="${INK}" stroke-width="1.4"/>
		${layer('back')}
		<path d="${NECK}" fill="${SKIN}" stroke="${INK}" stroke-width="1.6"/>
		<path d="${BODY}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
		<path d="${DETAIL}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
		${hidden.has('bra') ? '' : plain.bra}${hidden.has('brief') ? '' : plain.brief}
		${layer('under')}
		<path d="${ARM}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
		<path d="${ARM}" ${mirror} fill="${SKIN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
		${layer('over')}
		<ellipse cx="300" cy="84" rx="24" ry="30" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/>
		<path d="${FRINGE}" fill="${HAIR}" stroke="${INK}" stroke-width="1.2"/>
		${FACE}
		${layer('head')}
	</svg>`;
}
