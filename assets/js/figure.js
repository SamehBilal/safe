/* The figure on «لبس الليلة» in our room (secret.js): a woman drawn in thin brown line art, in the style of a fashion
   sketch, standing front-on in a 600×600 drawing — and whatever's chosen for tonight drawn on her. Each outfit piece in
   secret.json names its `look`; LOOKS says how that look is drawn (and what it covers: the plain underwear she has on
   until a set or something underneath is chosen). A look we don't know is simply not drawn (the label still shows it). */

const INK = '#5b3a2e', SKIN = '#f7dcc8', HAIR = '#6b4330', GOLD = '#d4a017';
const mirror = 'transform="matrix(-1 0 0 1 600 0)"';

/* her outline: the torso and legs as one shape, an arm (the other is its mirror), the head, the hair */
const BODY = `M288 134 C282 142 262 146 246 152 C236 156 232 166 236 180 L250 200 C248 224 252 246 262 268 C268 288 256 306 246 326 C238 344 238 362 242 378
	C246 420 254 452 262 470 C266 500 268 530 272 552 C270 568 262 580 266 588 C276 592 288 590 292 584 C292 572 290 560 290 552
	C292 520 294 490 292 470 C292 440 296 410 298 380 C299 372 301 372 302 380 C304 410 308 440 308 470 C306 490 308 520 310 552
	C310 560 308 572 308 584 C312 590 324 592 334 588 C338 580 330 568 328 552 C332 530 334 500 338 470 C346 452 354 420 358 378
	C362 362 362 344 354 326 C344 306 332 288 338 268 C348 246 352 224 350 200 L364 180 C368 166 364 156 354 152 C338 146 318 142 312 134 Z`;
const ARM = `M240 156 C226 164 222 182 222 204 C220 230 218 250 220 266 C216 290 210 312 208 332 C204 344 202 360 208 372 C214 378 222 372 224 362
	C226 352 228 342 230 334 C234 312 238 292 240 270 C244 248 248 226 250 204 Z`;
const HAIR_BACK = `M300 28 C262 28 244 56 246 96 C248 132 240 166 232 196 C246 204 262 198 270 188 C274 160 274 128 276 104 C280 76 290 62 300 60
	C310 62 320 76 324 104 C326 128 326 160 330 188 C338 198 354 204 368 196 C360 166 352 132 354 96 C356 56 338 28 300 28 Z`;
const FRINGE = 'M274 84 C276 62 290 52 302 52 C316 52 326 62 327 82 C318 68 306 64 296 68 C288 72 280 76 274 84 Z';
const NECK = 'M289 104 L288 140 L312 140 L311 104 Z';
const DETAIL = `M282 150 C290 155 296 155 300 152 M318 150 C310 155 304 155 300 152
	M262 222 C272 234 288 234 296 226 M304 226 C312 234 328 234 338 222
	M299 290 C300 293 301 293 302 290 M268 462 C272 466 276 466 280 462 M320 462 C324 466 328 466 332 462`;
const FACE = `<path d="M283 84 C287 88 293 88 297 84 M303 84 C307 88 313 88 317 84" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
	<path d="M299 89 C298 93 298 95 300 96" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
	<path d="M294 101 C297 99 299 100 300 101 C301 100 303 99 306 101 C303 105 297 105 294 101 Z" fill="#c0392b"/>
	<ellipse cx="285" cy="94" rx="5" ry="3" fill="#f0a3a0" opacity=".55"/><ellipse cx="315" cy="94" rx="5" ry="3" fill="#f0a3a0" opacity=".55"/>`;

/* the plain set she wears until something covers it */
const BRA = 'M256 204 C258 228 286 236 297 222 L303 222 C314 236 342 228 344 204 C330 198 312 202 300 214 C288 202 270 198 256 204 Z';
const STRAPS = 'M260 206 L268 150 M340 206 L332 150';
const BRIEF = 'M250 316 C268 322 290 324 300 324 C310 324 332 322 350 316 C346 334 330 352 302 372 L298 372 C270 352 254 334 250 316 Z';
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

/* each look: what it hides of the plain set, what goes behind her, under her arms, and over everything */
const LOOKS = {
	'ruffle-dress': { hide: ['bra', 'brief'], under: () => {
		const red = '#c62828', dark = '#8e1b1b';
		return `<path d="M262 206 L266 150 M338 206 L334 150" stroke="${red}" stroke-width="3"/>
		<path d="M256 202 C272 196 288 204 300 212 C312 204 328 196 344 202 C346 226 342 250 338 268 C352 300 368 350 384 404${ruffle(384, 216, 404, 10, 9)} C232 350 248 300 262 268 C258 250 254 226 256 202 Z" fill="${red}" stroke="${dark}" stroke-width="1.6"/>
		<path d="M262 268 C286 276 314 276 338 268" fill="none" stroke="${dark}" stroke-width="1.4"/>
		<path d="M236 356 C270 368 330 368 364 356${''}" fill="none" stroke="${dark}" stroke-width="1.2" opacity=".6"/>
		<path d="M224 384${ruffle(224, 376, 384, 9, 7).replace(/^/, '')}" fill="none" stroke="${dark}" stroke-width="1.2" opacity=".7"/>`; } },
	'lace-body': { hide: ['bra', 'brief'], over: () => `<g clip-path="url(#sx-skin)"><rect x="150" y="146" width="300" height="420" fill="url(#sx-lace)"/></g>
		<path d="M262 152 C280 176 320 176 338 152" fill="none" stroke="#111" stroke-width="2.4"/>
		<path d="M256 204 C270 196 290 204 300 214 C310 204 330 196 344 204" fill="none" stroke="#111" stroke-width="1.6" opacity=".8"/>` },
	dance: { hide: ['bra', 'brief'], under: () => {
		const tq = '#1aa6a6', dk = '#0b6b6b';
		return `<path d="M250 318 C230 380 226 470 232 556 L292 556 C292 470 296 400 300 372 C304 400 308 470 308 556 L368 556 C374 470 370 380 350 318 Z" fill="${tq}" opacity=".42" stroke="${dk}" stroke-width="1"/>
		<path d="M262 206 L268 150 M338 206 L332 150" stroke="${tq}" stroke-width="3"/>
		<path d="${BRA}" fill="${tq}" stroke="${dk}" stroke-width="1.6"/>${coins([[262, 224], [270, 230], [280, 234], [290, 232], [310, 232], [320, 234], [330, 230], [338, 224]])}
		<path d="M248 312 C268 320 290 322 300 322 C310 322 332 320 352 312 L354 330 C332 338 310 340 300 340 C290 340 268 338 246 330 Z" fill="${tq}" stroke="${dk}" stroke-width="1.6"/>
		<path d="M262 340 C280 370 320 370 338 340 Z" fill="${tq}" stroke="${dk}" stroke-width="1.2"/>
		${coins(along(250, 350, 342, 14, 10).map(([x, y]) => [x, y]), 3)}` ; } },
	bride: { hide: ['bra', 'brief'], back: () => `<path d="M272 42 C230 80 212 200 214 330 C240 336 262 330 270 320 C266 240 270 140 300 40 C330 140 334 240 330 320 C338 330 360 336 386 330 C388 200 370 80 328 42 Z" fill="#ffffff" opacity=".82" stroke="#ece7df" stroke-width="1.2"/>`,
		under: () => `<path d="${STRAPS}" stroke="#fff" stroke-width="2.4" fill="none"/><path d="${BRA}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="1.6"/>
		<path d="M262 212 C276 224 290 224 296 218 M304 218 C310 224 324 224 338 212" fill="none" stroke="#d8cfc2" stroke-dasharray="1.5 2.5"/>
		<path d="${BRIEF}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="1.6"/>
		<path d="M256 328 L262 410 M344 328 L338 410" stroke="#e8e2d8" stroke-width="1.6"/><path d="M248 408 C256 414 270 414 278 410 M322 410 C330 414 344 414 352 408" fill="none" stroke="#fffdf8" stroke-width="7" stroke-linecap="round"/><path d="M248 408 C256 414 270 414 278 410 M322 410 C330 414 344 414 352 408" fill="none" stroke="#bfb6aa" stroke-width="1" stroke-dasharray="2 2"/>`,
		head: () => `<path d="M278 46 C286 34 314 34 322 46" fill="none" stroke="#f4f0ea" stroke-width="5" stroke-linecap="round"/>${coins(along(280, 320, 44, 6, -5), 2)}` },
	harness: { hide: ['bra', 'brief'], under: () => {
		const k = '#1b1b1f';
		return `<path d="${STRAPS}" stroke="${k}" stroke-width="2.4" fill="none"/><path d="${BRA}" fill="${k}" stroke="${k}"/><path d="${BRIEF}" fill="${k}" stroke="${k}"/>
		<path d="M286 134 C294 138 306 138 314 134" fill="none" stroke="${k}" stroke-width="6" stroke-linecap="round"/>
		<path d="M300 138 L300 300 M258 238 C280 246 320 246 342 238 M262 270 C284 278 316 278 338 270 M262 238 L262 270 M338 238 L338 270 M290 140 L262 204 M310 140 L338 204" fill="none" stroke="${k}" stroke-width="3.2"/>
		<circle cx="300" cy="244" r="5" fill="none" stroke="#c0c0c8" stroke-width="2"/><circle cx="300" cy="138" r="4" fill="none" stroke="#c0c0c8" stroke-width="2"/>
		<path d="M250 340 C262 330 274 350 262 380 M350 340 C338 330 326 350 338 380" fill="none" stroke="${k}" stroke-width="3"/>`; },
		head: () => '<path d="M274 80 C282 70 296 72 300 80 C304 72 318 70 326 80 C328 90 318 96 308 93 C304 91 302 89 300 89 C298 89 296 91 292 93 C282 96 272 90 274 80 Z" fill="#1b1b1f"/><path d="M276 80 L262 76 M324 80 L338 76" stroke="#1b1b1f" stroke-width="2.4"/>' },
	'gold-chains': { over: () => `${chain('M268 150 C282 188 318 188 332 150')}${chain('M262 152 C276 214 324 214 338 152')}${chain('M300 200 L300 292', 2)}
		${chain('M262 284 C280 300 320 300 338 284')}${chain('M248 332 C270 358 330 358 352 332')}${coins([[300, 186], [300, 212], [300, 296], [300, 352]], 3)}` },
	'arm-chain': { over: () => `${chain('M222 214 C228 224 244 224 250 212', 2.4)}${chain('M224 228 C230 236 242 236 248 226', 1.8)}${butterfly(236, 226, 0.9)}` },
	cuffs: { over: () => {
		const k = '#1b1b1f';
		return `<path d="M207 326 L231 330 L229 342 L205 338 Z M393 326 L369 330 L371 342 L395 338 Z" fill="${k}"/>
		<circle cx="218" cy="336" r="3" fill="none" stroke="#c0c0c8" stroke-width="1.6"/><circle cx="382" cy="336" r="3" fill="none" stroke="#c0c0c8" stroke-width="1.6"/>
		<path d="M260 262 C284 272 316 272 340 262 L342 276 C316 286 284 286 258 276 Z" fill="${k}"/><circle cx="300" cy="278" r="4" fill="none" stroke="#c0c0c8" stroke-width="1.8"/>`; } },
	cymbals: { over: () => coins([[206, 366], [212, 372], [394, 366], [388, 372]], 3.6) },
	'pearl-thong': { hide: ['brief'], under: () => {
		const pts = [...along(252, 348, 318, 13, 6), ...Array.from({ length: 6 }, (_, i) => [300 + (i % 2 ? 1 : -1) * 0.5, 328 + i * 8])];
		return pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fffaf0" stroke="#b9ab95" stroke-width=".8"/>`).join('') + '<path d="M286 326 C292 340 296 352 300 372 C304 352 308 340 314 326 Z" fill="#f2e6e9" stroke="#b9ab95" stroke-width="1"/>'; } },
	'butterfly-anklet': { over: () => `${chain('M272 548 C278 556 286 556 291 548', 2)}${butterfly(281, 555, 0.6)}${butterfly(288, 552, 0.45)}` },
	'coin-anklet': { over: () => `${chain('M309 548 C314 556 322 556 329 548', 2)}${coins(along(311, 327, 556, 5, 2), 2.2)}` }
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
