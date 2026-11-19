/* The night sky above the birthdays page, after two pens put together:
   - arcs' «Happy Birthday» (codepen.io/arcs/pen/XKKYZW): fireworks keep going up on their own, trails fading into
     the dark, and a tap anywhere sends three to five more to that spot;
   - Matei Copot's «Happy birthday Tiffany!» (codepen.io/towc/pen/LGMGQG): the greeting arrives a letter at a time,
     every letter its own colour of the rainbow, each shot up as a firework that blooms into it; after a while each
     letter is tied to a balloon of its colour and floats away, swaying, then it all starts again.
   An Arabic letter is the whole word drawn in that letter's colour and cut down to just its own slice (the browser
   says where each letter sits in the word), so the joins stay perfect while every letter flies on its own.
   No sky box of its own: it all sits on the page (deeper colours on the light paper). Two canvases, the fireworks
   behind and the letters in front, both wiped clean every frame as Matei's pen does; every firework and spark draws
   its own trail from where it has just been, so nothing is left behind and the balloons glide.
   sky(box, lines) starts it in box (lines: an array of strings) and returns stop(). */
import { App, REDUCE } from './shell.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
/* no sky of its own: it sits on the page, so on the light paper the colours go deeper */
const dark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
export function sky(box, lines) {
	const back = document.createElement('canvas');
	const front = document.createElement('canvas');
	for (const c of [back, front]) c.setAttribute('aria-hidden', 'true');
	front.className = 'bd-sky__front';
	box.prepend(back, front);
	const bx = back.getContext('2d'), fx = front.getContext('2d');
	const rtl = App.lang === 'ar';
	const face = rtl ? '"Aref Ruqaa", Lalezar, serif' : 'Lobster, "Aref Ruqaa", serif';   // the headlines' own script, so the greeting reads like the page
	let w = 0, h = 0, size = 40, k = 1;       // k: the pens were tuned for a ~1000px-wide screen
	let pieces = [], rockets = [], restart = 0, shown = 0, night = dark();

	/* ---------- the greeting, laid out to fit, a piece per letter ---------- */
	function layout() {
		fx.font = `100px ${face}`;
		const space = fx.measureText(' ').width * (rtl ? 1.6 : 1.2);
		const track = rtl ? 0 : 1;                       // the script's letters sit close, like handwriting; Arabic letters touch
		const plan = lines.map((line) => line.split(/\s+/).filter(Boolean).map((word) => (rtl ? slices(word) : [...word].map((t) => ({ t, w: fx.measureText(t).width })))));
		const widths = plan.map((ws) => ws.reduce((a, word) => a + word.reduce((b, l) => b + l.w + track, 0), 0) + space * (ws.length - 1));
		size = Math.min(100 * (w * 0.86) / Math.max(...widths, 1), h / (lines.length * 1.75), 96);
		k = Math.max(0.5, Math.min(1.4, w / 1000));
		const s = size / 100, lh = size * 1.2, total = lines.length * lh;
		const old = pieces;
		pieces = [];
		const count = plan.flat(2).length;
		let n = 0;
		plan.forEach((ws, li) => {
			const lw = widths[li] * s;
			let x = rtl ? (w + lw) / 2 : (w - lw) / 2;
			const y = h * 0.5 - total / 2 + lh * (li + 0.5);
			ws.forEach((word, wi) => {
				for (const l of word) {
					const lwid = l.w * s;
					const cx = rtl ? x - lwid / 2 : x + lwid / 2;
					x += (rtl ? -1 : 1) * (lwid + track * s);
					// every letter its own colour, around the rainbow in reading order, as in the pen
					const hue = Math.round((n / Math.max(count - 1, 1)) * 330);
					pieces.push(Object.assign(old[n] || fresh(), { text: l.t, x: cx, y, hue, cut: l.cut }));
					n++;
				}
				if (wi < ws.length - 1) x += (rtl ? -1 : 1) * space * s;
			});
		});
	}
	/* where each letter of an Arabic word sits, measured by the browser on the same font (at 100px) */
	function slices(word) {
		const probe = document.createElement('span');
		probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;direction:rtl;font:100px ${face};left:0;top:0`;
		probe.textContent = word;
		box.append(probe);
		const node = probe.firstChild, all = probe.getBoundingClientRect(), range = document.createRange(), out = [];
		let at = 0;
		for (const ch of [...word]) {
			range.setStart(node, at); range.setEnd(node, at + ch.length); at += ch.length;
			const r = range.getBoundingClientRect();
			// marks and the like take no room of their own: they ride with the letter before
			if (r.width < 0.5 && out.length) { out[out.length - 1].t += ch; continue; }
			out.push({ t: ch, l: r.left - all.left, r: r.right - all.left });
		}
		probe.remove();
		return out.map((o) => ({ t: o.t, w: o.r - o.l, cut: { word, l: o.l, r: o.r } }));
	}
	function fresh() { return { phase: 'wait', t: 0, wait: rnd(0, 3.3), shards: [], trail: [] }; }
	function reset() { pieces = pieces.map((p) => Object.assign(fresh(), { text: p.text, x: p.x, y: p.y, hue: p.hue, cut: p.cut })); }

	function resize() {
		const r = box.getBoundingClientRect();
		const dpr = Math.min(devicePixelRatio || 1, 2);
		w = r.width; h = r.height;
		for (const [c, x] of [[back, bx], [front, fx]]) {
			c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
			c.style.width = w + 'px'; c.style.height = h + 'px';
			x.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		bx.clearRect(0, 0, w, h);
		layout();
		if (REDUCE) still();
	}

	/* ---------- arcs' fireworks, behind ---------- */
	function rocket(tx, ty, hue = rnd(0, 360), kids = rnd(30, 110)) {
		rockets.push({ x: rnd(w * 0.38, w * 0.62), y: h, tx, ty, hue, kids: kids * k, trail: [], dead: false });
	}
	function stepRocket(r, dt) {
		const dx = r.tx - r.x, dy = r.ty - r.y;
		if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
			r.x += dx * 2 * dt; r.y += dy * 2 * dt;
			r.trail.push([r.x, r.y]);
			if (r.trail.length > 20) r.trail.shift();
		} else {
			if (r.kids && !r.burst) {
				const n = r.kids / 2;
				for (let i = 0; i < n; i++) rockets.push({ x: r.x, y: r.y, tx: r.x + r.kids * Math.cos((TAU * i) / n), ty: r.y + r.kids * Math.sin((TAU * i) / n), hue: r.hue, kids: 0, trail: [], dead: false });
			}
			r.burst = true;
			r.trail.shift();
		}
		if (!r.trail.length) { r.dead = true; return; }
		if (r.kids) r.trail.forEach(([x, y], i) => { bx.fillStyle = night ? `hsl(${r.hue},100%,${i * 2.5}%)` : `hsla(${r.hue},90%,${30 + i}%,${i / 20})`; bx.beginPath(); bx.arc(x, y, 1.2, 0, TAU); bx.fill(); });
		// a spark draws its own tail from where it has just been (no fading canvas, so nothing is left behind)
		else r.trail.forEach(([x, y], i, all) => { bx.fillStyle = `hsla(${r.hue},100%,${night ? 60 : 48}%,${(i + 1) / all.length})`; bx.beginPath(); bx.arc(x, y, 1.3, 0, TAU); bx.fill(); });
	}

	/* ---------- Matei's letters, in front: up, bloom, wait, balloon away ---------- */
	const col = (p, l, a = 1) => `hsla(${p.hue},80%,${l}%,${a})`;
	function letter(p, x, y) {
		fx.fillStyle = col(p, night ? 70 : 46);
		if (!p.cut) { fx.fillText(p.text, x, y); return; }
		// an Arabic letter: the whole word, cut down to this letter's slice
		const s = size / 100, c = p.cut, sw = (c.r - c.l) * s;
		fx.save();
		fx.beginPath(); fx.rect(x - sw / 2 - 0.5, y - size, sw + 1, size * 2); fx.clip();
		fx.textAlign = 'left';
		fx.direction = 'rtl';
		fx.fillText(c.word, x - sw / 2 - c.l * s, y);
		fx.restore();
	}
	/* the pen's balloon: a teardrop on its knot, with a little shine */
	function balloon(p, x, y, s, tilt = 0) {
		fx.save();
		fx.translate(x, y); fx.rotate(tilt);
		fx.beginPath();
		fx.moveTo(0, 0);
		fx.bezierCurveTo(-s / 2, -s / 2, -s / 4, -s, 0, -s);
		fx.bezierCurveTo(s / 4, -s, s / 2, -s / 2, 0, 0);
		fx.fillStyle = col(p, 52, p.alpha ?? 1); fx.fill();
		fx.beginPath(); fx.ellipse(s * 0.1, -s * 0.72, s * 0.05, s * 0.11, 0.5, 0, TAU);
		fx.fillStyle = `rgba(255,255,255,${0.45 * (p.alpha ?? 1)})`; fx.fill();
		fx.restore();
	}
	function letGo(p) {
		p.phase = 'balloon'; p.t = 0; p.spawn = rnd(0, 0.6); p.inflate = rnd(0.35, 0.6);
		p.bs = (rnd(24, 40) * size) / 34;
		p.vx = rnd(-0.35, 0.15) * 60 * k;            // drifting a little, mostly up, like the pen's balloons
		p.vy = -rnd(10, 22) * k;
		p.sway = rnd(0, TAU); p.swayW = rnd(1.2, 2.1);
		p.cx = p.x; p.cy = p.y;
	}
	function stepPiece(p, dt) {
		p.t += dt;
		if (p.phase === 'wait') { if (p.t >= p.wait) { p.phase = 'rise'; p.t = 0; p.reach = rnd(0.5, 1); p.sx = rnd(w * 0.4, w * 0.6); p.trail = [[p.sx, h]]; p.lw = rnd(5, 13) * k; } return; }
		if (p.phase === 'rise') {
			const f = Math.min(1, p.t / p.reach), arc = Math.sin(f * Math.PI / 2);
			const x = p.sx + (p.x - p.sx) * f, y = h + (p.y - h) * arc;
			p.trail.push([x, y, f * p.lw]);
			if (p.trail.length > 10) p.trail.shift();
			for (let i = 1; i < p.trail.length; i++) {
				fx.strokeStyle = col(p, 50, i / p.trail.length);
				fx.lineWidth = (p.trail[i][2] || 1) * (i / p.trail.length);
				fx.beginPath(); fx.moveTo(p.trail[i][0], p.trail[i][1]); fx.lineTo(p.trail[i - 1][0], p.trail[i - 1][1]); fx.stroke();
			}
			if (f >= 1) {
				p.phase = 'bloom'; p.t = 0; p.grow = rnd(0.5, 1); p.fade = rnd(0.17, 0.25); p.r = (rnd(20, 30) * size) / 40;
				const n = Math.round(rnd(5, 10));
				p.shards = Array.from({ length: n }, (_, i) => { const a = (TAU * i) / n, v = rnd(4, 6) * 60 * k; return { x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: rnd(3, 6) * k, trail: [] }; });
			}
			return;
		}
		if (p.phase === 'bloom' || p.phase === 'show') {
			if (p.phase === 'bloom') {
				if (p.t < p.grow) {
					const f = p.t / p.grow, e = -Math.cos(f * Math.PI) / 2 + 0.5;
					fx.fillStyle = col(p, 50 + 50 * f, f); fx.beginPath(); fx.arc(p.x, p.y, e * p.r, 0, TAU); fx.fill();
				} else {
					letter(p, p.x, p.y);
					const f = Math.min(1, (p.t - p.grow) / p.fade), e = -Math.cos(f * Math.PI) / 2 + 0.5;
					fx.fillStyle = col(p, 100, 1 - e); fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, TAU); fx.fill();
					if (f >= 1) { p.phase = 'show'; p.t = 0; }
				}
			} else letter(p, p.x, p.y);
			for (const s of p.shards) {
				s.x += s.vx * dt; s.vy += 360 * k * dt; s.y += s.vy * dt;
				s.trail.push([s.x, s.y]); if (s.trail.length > 4) s.trail.shift();
				for (let i = 0; i < s.trail.length - 1; i++) {
					fx.strokeStyle = col(p, 50, i / s.trail.length); fx.lineWidth = (i * s.s) / s.trail.length;
					fx.beginPath(); fx.moveTo(s.trail[i][0], s.trail[i][1]); fx.lineTo(s.trail[i + 1][0], s.trail[i + 1][1]); fx.stroke();
				}
			}
			p.shards = p.shards.filter((s) => s.trail[0]?.[1] < h + 20);
			return;
		}
		if (p.phase === 'balloon') {
			const hang = size * 0.55;                      // the letter hangs this far under the knot
			if (p.t < p.spawn) { letter(p, p.x, p.y); return; }
			if (p.t < p.spawn + p.inflate) {
				// the balloon blows up just above its letter, the string paying out
				const f = (p.t - p.spawn) / p.inflate, e = 1 - (1 - f) ** 3;
				p.alpha = e;
				const ky = p.y - hang * e;
				fx.strokeStyle = col(p, night ? 80 : 40, e); fx.lineWidth = 1;
				fx.beginPath(); fx.moveTo(p.x, ky); fx.lineTo(p.x, p.y - size * 0.35); fx.stroke();
				balloon(p, p.x, ky, p.bs * e);
				letter(p, p.x, p.y);
				return;
			}
			p.alpha = 1;
			// float: a gentle push up that builds, a slow drift, and a sway side to side
			const tt = p.t - p.spawn - p.inflate;
			p.vy = Math.max(p.vy - 34 * k * dt, -95 * k);
			p.cx += p.vx * dt; p.cy += p.vy * dt;
			const sway = Math.sin(tt * p.swayW + p.sway) * 9 * k;
			const kx = p.cx + sway, ky = p.cy - hang;
			const tilt = Math.cos(tt * p.swayW + p.sway) * 0.12;
			// the letter swings a beat behind the balloon, on a soft curved string
			const lx = p.cx + Math.sin(tt * p.swayW + p.sway - 0.6) * 9 * k, ly = p.cy;
			fx.strokeStyle = col(p, night ? 80 : 40); fx.lineWidth = 1;
			fx.beginPath(); fx.moveTo(kx, ky); fx.quadraticCurveTo((kx + lx) / 2 + sway * 0.6, (ky + ly) / 2, lx, ly - size * 0.35); fx.stroke();
			balloon(p, kx, ky, p.bs, tilt);
			letter(p, lx, ly);
			if (ky + size < -20 || kx < -w * 0.25 || kx > w * 1.25) p.phase = 'done';
		}
	}

	/* ---------- the loop ---------- */
	let raf = 0, then = 0, spawnIn = 0, on = false;
	function frame(now) {
		raf = requestAnimationFrame(frame);
		const dt = Math.min(0.05, (now - (then || now)) / 1000);
		then = now;
		// behind: wiped clean too; every firework carries its own trail
		bx.globalCompositeOperation = 'source-over';
		bx.clearRect(0, 0, w, h);
		night = dark();
		bx.globalCompositeOperation = night ? 'lighter' : 'source-over';
		spawnIn -= dt;
		if (spawnIn <= 0) { rocket(rnd(0, w), rnd(h * 0.08, h * 0.45)); spawnIn = rnd(0.5, 0.9); }
		for (const r of rockets) if (!r.dead) stepRocket(r, dt);
		if (rockets.length > 600) rockets = rockets.filter((r) => !r.dead);
		// in front: wiped clean every frame, like the pen
		fx.clearRect(0, 0, w, h);
		fx.font = `${size}px ${face}`; fx.textAlign = 'center'; fx.textBaseline = 'middle';
		for (const p of pieces) stepPiece(p, dt);
		if (pieces.every((p) => p.phase === 'show')) { shown += dt; if (shown > 6) { shown = 0; pieces.forEach(letGo); } } else shown = 0;
		if (pieces.every((p) => p.phase === 'done')) { restart += dt; if (restart > 1) { restart = 0; reset(); } }
	}
	function start() { if (on || REDUCE) return; on = true; then = 0; raf = requestAnimationFrame(frame); }
	function pause() { on = false; cancelAnimationFrame(raf); }
	/* with less motion asked for: just the greeting, still, on the night */
	function still() {
		bx.clearRect(0, 0, w, h);
		fx.clearRect(0, 0, w, h);
		night = dark();
		fx.font = `${size}px ${face}`; fx.textAlign = 'center'; fx.textBaseline = 'middle';
		for (const p of pieces) letter(p, p.x, p.y);
	}

	// a tap sends three to five to that spot, like the pen
	const tap = (e) => {
		const r = front.getBoundingClientRect();
		for (let i = 0, n = Math.round(rnd(3, 5)); i < n; i++) rocket(e.clientX - r.left, e.clientY - r.top, rnd(0, 260));
	};
	front.addEventListener('pointerdown', tap);

	const ro = new ResizeObserver(resize);
	ro.observe(box);
	const io = new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? start() : pause()));
	io.observe(box);
	const vis = () => (document.hidden ? pause() : box.isConnected && start());
	document.addEventListener('visibilitychange', vis);
	resize();
	// the fonts may still be on their way: lay the letters out again once they're here
	document.fonts?.load(`40px ${face}`).then(() => { layout(); if (REDUCE) still(); }).catch(() => {});

	return () => { pause(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis); front.removeEventListener('pointerdown', tap); };
}
