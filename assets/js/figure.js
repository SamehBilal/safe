/* The figure on «لبس الليلة» in our room (secret.js): the inverted-triangle woman from the body-shapes drawing we chose
   (cut out of it, her swimsuit turned into a plain beige one, her skin tinted — sealed with the room's photos as
   `figure-base`), and whatever's chosen for tonight drawn on her. Each outfit piece in secret.json names its `look`;
   LOOKS draws it in the picture's own pixels (266×880), so it sits where her shoulders, bust, waist, wrists and ankles
   are. A set covers the beige swimsuit first; her arms are drawn again over what she wears, so her hands stay on top.
   A look we don't know is simply not drawn (the label still shows it). */

const INK = '#5b3a2e', SKIN = '#fae2d2', GOLD = '#d4a017';
const [W, H] = [266, 880];
const K = 584 / H, X0 = 300 - (W * K) / 2, Y0 = 8;
/** where a point of the picture lands in the 600×600 drawing (for the labels' lines) */
export const at = (u, v) => [Math.round(X0 + u * K), Math.round(Y0 + v * K)];

/* her, in the picture's pixels */
const SUIT = 'M118 170 C108 190 90 210 86 238 C84 260 92 276 98 286 C100 296 100 306 100 314 C96 334 88 352 85 370 C110 398 136 424 155 444 C176 424 200 396 212 364 C206 344 198 326 198 312 C198 300 200 290 202 282 C210 270 216 256 212 240 C208 214 188 190 172 170 C168 200 162 236 157 264 C150 234 132 198 118 170 Z';
const ARM_L = 'M42 178 L64 176 L86 228 L80 300 L76 350 L84 378 L102 392 L106 452 L84 458 L66 418 L56 392 L40 340 L30 300 L34 240 Z';
const ARM_R = 'M222 176 L242 178 L254 240 L262 300 L254 350 L238 384 L218 400 L214 452 L188 450 L190 406 L206 384 L222 350 L228 300 L214 240 Z';
const BRA = 'M86 236 C88 266 112 290 146 280 L156 268 L166 280 C190 292 212 270 214 244 C206 226 190 220 178 226 C168 232 162 248 156 262 C150 248 142 230 130 224 C116 218 96 222 86 236 Z';
const STRAPS = 'M100 228 L118 172 M204 230 L172 172';
const BRIEF = 'M88 370 C110 380 140 384 156 384 C172 384 196 378 212 364 C206 398 182 426 158 444 L152 444 C124 426 100 400 88 370 Z';
const cover = `<path d="${SUIT}" fill="${SKIN}"/><path d="M96 286 C112 292 132 288 146 280 M168 280 C180 290 196 290 204 282" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".55"/>`;

const chain = (d, w = 3) => `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="${w}" stroke-dasharray="3 2" stroke-linecap="round"/>`;
const butterfly = (x, y, s = 1, c = GOLD) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-6 -8 -10 -4 -8 0 C-10 4 -6 7 0 1 C6 7 10 4 8 0 C10 -4 6 -8 0 0 Z" fill="${c}" stroke="${INK}" stroke-width=".7"/></g>`;
const coins = (pts, r = 3.4) => pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>`).join('');
const along = (x0, x1, y0, y1, n, sag = 0) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag]; });
/* a ruffled hem from x0 to x1 at y, as little scallops */
const ruffle = (x0, x1, y, n = 10, d = 10) => { const w = (x1 - x0) / n; let s = ''; for (let i = 0; i < n; i++) s += ` Q${(x0 + w * (i + 0.5)).toFixed(1)} ${y + d} ${(x0 + w * (i + 1)).toFixed(1)} ${y}`; return s; };

/* each look: whether it covers the swimsuit, what goes behind her, what she wears (under her arms), what goes over
   everything (jewellery on her arms, hands and ankles), all in the picture's pixels */
const LOOKS = {
	'ruffle-dress': { cover: 1, wear: () => {
		const red = '#c62828', dark = '#8e1b1b';
		return `<path d="M98 238 L118 172 M206 240 L172 172" stroke="${red}" stroke-width="4"/>
		<path d="M86 236 C110 226 140 240 156 262 C170 240 196 226 214 240 C216 262 208 278 202 290 C198 300 196 310 198 318 C214 370 230 440 240 506${ruffle(240, 70, 506, 11, 12)} C80 440 92 370 100 318 C100 310 98 300 96 290 C88 278 82 262 86 236 Z" fill="${red}" stroke="${dark}" stroke-width="2"/>
		<path d="M100 318 C130 328 170 328 198 318" fill="none" stroke="${dark}" stroke-width="1.6"/>
		<path d="M84 440 C120 456 190 456 228 440" fill="none" stroke="${dark}" stroke-width="1.4" opacity=".6"/>
		<path d="M76 482${ruffle(76, 234, 482, 10, 9)}" fill="none" stroke="${dark}" stroke-width="1.4" opacity=".7"/>`; } },
	'lace-body': { cover: 1, wear: () => `<rect x="0" y="168" width="${W}" height="640" fill="url(#sx-lace)" mask="url(#sx-her)"/>
		<path d="M122 170 C134 196 176 196 182 170" fill="none" stroke="#111" stroke-width="3"/>
		<path d="${BRA}" fill="none" stroke="#111" stroke-width="2" opacity=".6"/>`, arms: () => `<rect x="0" y="168" width="${W}" height="300" fill="url(#sx-lace)" mask="url(#sx-her)" clip-path="url(#sx-arms)"/>` },
	dance: { cover: 1, wear: () => {
		const tq = '#1aa6a6', dk = '#0b6b6b';
		return `<path d="M90 372 C70 480 60 620 64 792 L150 792 C150 620 154 500 156 446 C158 500 166 620 170 792 L242 792 C246 620 236 480 212 366 Z" fill="${tq}" opacity=".42" stroke="${dk}" stroke-width="1.2"/>
		<path d="${STRAPS}" stroke="${tq}" stroke-width="4"/>
		<path d="${BRA}" fill="${tq}" stroke="${dk}" stroke-width="2"/>${coins(along(90, 146, 262, 286, 6, 6))}${coins(along(168, 210, 286, 258, 5, 6))}
		<path d="M86 358 C110 372 140 376 156 376 C172 376 196 370 214 354 L216 374 C196 390 172 394 156 394 C140 394 110 390 84 376 Z" fill="${tq}" stroke="${dk}" stroke-width="2"/>
		<path d="M128 394 C140 430 172 430 184 394 Z" fill="${tq}" stroke="${dk}" stroke-width="1.6"/>
		${coins(along(86, 214, 382, 380, 15, 12), 4)}`; } },
	bride: { cover: 1, back: () => `<path d="M118 30 C60 100 26 300 30 470 C70 478 100 468 112 452 C108 330 112 180 150 26 C188 180 194 330 192 452 C204 468 234 478 270 470 C274 300 240 100 186 30 Z" fill="#ffffff" opacity=".82" stroke="#ece7df" stroke-width="1.6"/>`,
		wear: () => `<path d="${STRAPS}" stroke="#fff" stroke-width="3.4" fill="none"/><path d="${BRA}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="2"/>
		<path d="M92 244 C110 262 134 262 148 254 M164 254 C178 262 198 262 210 248" fill="none" stroke="#d8cfc2" stroke-dasharray="2 3"/>
		<path d="${BRIEF}" fill="#fffdf8" stroke="#bfb6aa" stroke-width="2"/>
		<path d="M98 388 L100 516 M206 380 L204 512" stroke="#e8e2d8" stroke-width="2"/>
		<path d="M86 518 C104 528 130 528 146 520 M158 520 C176 528 200 528 218 514" fill="none" stroke="#fffdf8" stroke-width="10" stroke-linecap="round"/>
		<path d="M86 518 C104 528 130 528 146 520 M158 520 C176 528 200 528 218 514" fill="none" stroke="#bfb6aa" stroke-width="1.2" stroke-dasharray="2 2"/>`,
		head: () => `<path d="M112 54 C126 26 176 26 194 56" fill="none" stroke="#f4f0ea" stroke-width="7" stroke-linecap="round"/>${coins(along(116, 190, 48, 50, 7, -18), 2.8)}` },
	harness: { cover: 1, wear: () => {
		const k = '#1b1b1f';
		return `<path d="${STRAPS}" stroke="${k}" stroke-width="3.4" fill="none"/><path d="${BRA}" fill="${k}"/><path d="${BRIEF}" fill="${k}"/>
		<path d="M132 156 C144 166 160 166 172 154" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round"/>
		<path d="M154 164 L156 350 M96 290 C130 302 176 302 204 288 M100 320 C130 330 170 330 198 320 M98 290 L100 320 M202 288 L198 320 M140 164 L96 240 M168 164 L210 240" fill="none" stroke="${k}" stroke-width="4"/>
		<circle cx="155" cy="298" r="6" fill="none" stroke="#c0c0c8" stroke-width="2.4"/><circle cx="153" cy="164" r="5" fill="none" stroke="#c0c0c8" stroke-width="2.4"/>
		<path d="M90 384 C104 372 118 400 102 440 M210 376 C196 366 184 396 200 436" fill="none" stroke="${k}" stroke-width="4"/>`; },
		head: () => '<path d="M124 80 C132 70 150 72 156 82 C162 74 184 74 190 86 C190 98 176 102 166 98 C160 96 158 92 156 90 C152 94 148 98 138 98 C126 96 120 90 124 80 Z" fill="#1b1b1f"/><path d="M126 82 L104 76 M188 86 L212 82" stroke="#1b1b1f" stroke-width="3"/>' },
	'gold-chains': { over: () => `${chain('M126 172 C136 220 172 220 180 172')}${chain('M118 176 C128 264 180 266 188 176')}${chain('M156 268 L156 334', 2.4)}
		${chain('M100 314 C130 332 172 332 198 314')}${chain('M88 370 C120 400 186 400 212 362')}${coins([[155, 214], [155, 262], [156, 338], [152, 394]], 4)}` },
	/* round her left thigh, with little chains and butterflies hanging from it */
	'thigh-chain': { over: () => `${chain('M86 516 C104 530 132 532 150 520', 3)}${chain('M88 530 C106 542 130 544 148 534', 2.2)}${[[95, 527, 16], [108, 532, 24], [121, 533, 18], [134, 531, 24], [145, 526, 14]].map(([x, y, l]) => chain(`M${x} ${y} L${x} ${y + l}`, 1.6) + butterfly(x, y + l + 4, 0.75)).join('')}` },
	'arm-chain': { over: () => `${chain('M44 222 C54 236 74 238 84 226', 3)}${chain('M42 238 C54 250 72 250 82 240', 2.2)}${butterfly(62, 240, 1.1)}` },
	cuffs: { over: () => {
		const k = '#1b1b1f';
		return `<path d="M58 374 L84 378 L82 394 L56 390 Z M208 378 L236 372 L238 388 L210 394 Z" fill="${k}"/>
		<circle cx="70" cy="386" r="4" fill="none" stroke="#c0c0c8" stroke-width="2"/><circle cx="223" cy="385" r="4" fill="none" stroke="#c0c0c8" stroke-width="2"/>`; },
		wear: () => '<path d="M100 302 C130 314 170 314 198 302 L198 320 C170 332 130 332 100 320 Z" fill="#1b1b1f"/><circle cx="150" cy="322" r="5" fill="none" stroke="#c0c0c8" stroke-width="2.2"/>' },
	cymbals: { over: () => coins([[90, 446], [100, 440], [194, 446], [204, 440]], 4.6) },
	'pearl-thong': { wear: () => {
		const pts = [...along(88, 212, 366, 360, 15, 14), ...Array.from({ length: 7 }, (_, i) => [154 + (i % 2 ? 1 : -1), 384 + i * 9])];
		return pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.8" fill="#fffaf0" stroke="#b9ab95" stroke-width="1"/>`).join(''); } },
	'butterfly-anklet': { over: () => `${chain('M78 766 C86 780 100 780 108 766', 2.6)}${butterfly(92, 778, 0.8)}${butterfly(101, 774, 0.6)}` },
	'coin-anklet': { over: () => `${chain('M162 776 C170 790 180 790 188 776', 2.6)}${coins(along(164, 186, 784, 784, 5, 3), 2.8)}` }
};

/** The drawing: her (the picture, from `src`), and the given looks on her (ids from LOOKS; unknown ones are skipped). */
export function figureSVG(looks = [], src = '') {
	const on = looks.map((l) => LOOKS[l]).filter(Boolean);
	const layer = (k) => on.map((l) => l[k]?.() || '').join('');
	const her = src ? `<image href="${src}" width="${W}" height="${H}"/>` : '';
	return `<svg class="sx-fig__svg" viewBox="0 0 600 600" aria-hidden="true">
		<defs>
			<clipPath id="sx-arms"><path d="${ARM_L}"/><path d="${ARM_R}"/></clipPath>
			<mask id="sx-her" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${her}</mask>
			<pattern id="sx-lace" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#151518" opacity=".3"/><path d="M7 1 L13 7 L7 13 L1 7 Z" fill="none" stroke="#111" stroke-width="1.2" opacity=".85"/><circle cx="7" cy="7" r="1.5" fill="#111" opacity=".8"/></pattern>
		</defs>
		<g transform="translate(${X0.toFixed(2)} ${Y0}) scale(${K.toFixed(5)})">
			${layer('back')}
			${her}
			${on.some((l) => l.cover) ? cover : ''}
			${layer('wear')}
			${on.some((l) => l.wear) && her ? `<g clip-path="url(#sx-arms)">${her}</g>` : ''}
			${layer('arms')}
			${layer('over')}
			${layer('head')}
		</g>
	</svg>`;
}
