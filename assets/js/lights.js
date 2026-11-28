const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* A string of little lights hanging in swags, after Mark Sottek's «Let It Twinkle: Warm White Mini Lights»
   (codepen.io/mark_sottek): old-fashioned mini bulbs on a thin wire, each glowing and dimming on its own clock, a
   few now and then winking right out — so the string never blinks all together. The pen picks each bulb's timing
   with CSS random(); few browsers have that yet, so here each bulb gets its own numbers when the string is made.
   Drawn like the rest of the site: an ink wire, bulbs with an ink socket, the glow warm on the dark and still
   visible on the paper. With «reduce motion» they stay lit and still.
   hang(host, opt) puts a string across the top of host and returns take-down();
   opt: { colors: 'warm' | 'eid' (the coloured Eid string), swags: how many dips (else from the width),
   sag: px each dips, top: px from the top, cls: an extra class, wire: false to hang on a line already drawn } */

const WARM = ['#ffe3a1', '#ffd98a', '#ffeab8'];
const EID = ['#ff6b6b', '#ffd23f', '#5ad17a', '#4cb3ff', '#ff8fd0', '#ffa54a'];
const r = (a, b) => a + Math.random() * (b - a);

export function lightsHTML(width, opt = {}) {
	const W = Math.max(280, width || 1000);
	const swags = opt.swags || Math.max(2, Math.round(W / 260));
	const sag = opt.sag ?? Math.min(26, 12 + W / 120);
	const H = sag + 34;
	const n = Math.max(10, Math.round(W / 36));
	const pal = opt.colors === 'eid' ? EID : WARM;
	// the wire: a dip between each pair of hooks (in a 1000-wide box stretched to the width)
	const seg = 1000 / swags;
	let d = 'M0 2';
	for (let k = 0; k < swags; k++) d += `Q${(k + 0.5) * seg} ${2 + sag * 2} ${(k + 1) * seg} 2`;
	const bulbs = Array.from({ length: n }, (_, i) => {
		const x = (i + 0.5) / n, f = (x * swags) % 1;
		const y = 2 + sag * 4 * f * (1 - f);                          // on the curve: the dip is sag·4f(1−f)
		const slope = (sag * 4 * (1 - 2 * f) * swags) / W;           // which way the wire runs there, so the bulb hangs off it
		const tilt = Math.atan(slope) * 57.3 + r(-14, 14);
		const c = opt.colors === 'eid' ? pal[i % pal.length] : pal[Math.floor(Math.random() * pal.length)];
		const wink = Math.random() < 0.18;
		return `<i class="lt-b${wink ? ' is-wink' : ''}" style="--x:${(x * 100).toFixed(2)}%;--y:${y.toFixed(1)}px;--r:${tilt.toFixed(1)}deg;--c:${c};--t:${r(wink ? 3.5 : 1.8, wink ? 7 : 4.6).toFixed(2)}s;--d:${(-r(0, 6)).toFixed(2)}s;--lo:${r(0.35, 0.7).toFixed(2)}"></i>`;
	}).join('');
	return `<div class="lt${opt.colors === 'eid' ? ' lt--eid' : ''}${opt.cls ? ` ${opt.cls}` : ''}${REDUCE ? ' is-still' : ''}" aria-hidden="true" style="--h:${H}px;top:${opt.top ?? 0}px">
		${opt.wire === false ? '' : `<svg class="lt-wire" viewBox="0 0 1000 ${H}" preserveAspectRatio="none"><path d="${d}"/></svg>`}
		${bulbs}
	</div>`;
}

export function hang(host, opt = {}) {
	if (!host) return () => {};
	if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
	const t = document.createElement('template');
	t.innerHTML = lightsHTML(host.clientWidth || innerWidth, opt).trim();
	const el = t.content.firstChild;
	host.append(el);
	return () => el.remove();
}

/* is it Eid today? (1–3 Shawwal, 10–13 Dhu al-Hijjah, by the Umm al-Qura calendar) */
export function eidToday(now = new Date()) {
	try {
		const p = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' }).formatToParts(now).map((x) => [x.type, x.value]));
		return (+p.month === 10 && +p.day <= 3) || (+p.month === 12 && +p.day >= 10 && +p.day <= 13);
	} catch { return false; }
}
