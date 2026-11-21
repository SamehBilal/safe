/* Calm sounds for reading, made right here in the browser (Web Audio — no files, nothing fetched): a slow piano that
   wanders over four soft chords, a lo-fi beat, a music box; rain, the sea, a stream, the wind, a fire, birds in the
   morning, crickets at night, and a clock ticking. Any of them can play together, with one
   volume, and they can stop by themselves after a while. Used on «كتبنا» (books.js). */

let ctx = null, master = null, verb = null;
const on = {}; // what's playing: name → stop()

function setup() {
	if (ctx) return;
	ctx = new (window.AudioContext || window.webkitAudioContext)();
	master = ctx.createGain();
	master.gain.value = 0.6;
	master.connect(ctx.destination);
	// a soft room for the piano: a short decaying noise as the reverb's echo
	verb = ctx.createConvolver();
	const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
	for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
	verb.buffer = ir;
	const wet = ctx.createGain();
	wet.gain.value = 0.35;
	verb.connect(wet).connect(master);
}

function noise(seconds = 4, brown = false) {
	const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
	let last = 0;
	for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = brown ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w; }
	const src = ctx.createBufferSource();
	src.buffer = buf;
	src.loop = true;
	return src;
}

/* the piano: Cmaj7 → Am7 → Fmaj7 → G6, a note or two at a time, never in a hurry */
const CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function piano() {
	const out = ctx.createGain();
	out.gain.value = 0.9;
	out.connect(master);
	out.connect(verb);
	let bar = 0, alive = true, timer = 0;
	const note = (m, t, v = 0.18) => {
		for (const [type, mul, g] of [['triangle', 1, 1], ['sine', 2, 0.25]]) {
			const o = ctx.createOscillator(), e = ctx.createGain();
			o.type = type;
			o.frequency.value = hz(m) * mul;
			e.gain.setValueAtTime(0, t);
			e.gain.linearRampToValueAtTime(v * g, t + 0.02);
			e.gain.exponentialRampToValueAtTime(0.0008, t + 3.6);
			o.connect(e).connect(out);
			o.start(t);
			o.stop(t + 3.8);
		}
	};
	const play = () => {
		if (!alive) return;
		const t = ctx.currentTime + 0.05, ch = CHORDS[bar % CHORDS.length];
		note(ch[0] - 12, t, 0.14); // the bass, low and soft
		const steps = [0, 0.9, 1.6, 2.5, 3.1];
		for (const s of steps) if (Math.random() < 0.72) note(ch[Math.floor(Math.random() * ch.length)] + (Math.random() < 0.25 ? 12 : 0), t + s + Math.random() * 0.15, 0.08 + Math.random() * 0.07);
		bar++;
		timer = setTimeout(play, 4000);
	};
	play();
	return () => { alive = false; clearTimeout(timer); out.gain.setTargetAtTime(0, ctx.currentTime, 0.6); setTimeout(() => out.disconnect(), 3000); };
}

/* rain: soft hiss through a low filter, swelling a little, with drops now and then */
function rain() {
	const out = ctx.createGain();
	out.gain.value = 0;
	out.gain.setTargetAtTime(0.5, ctx.currentTime, 1.5);
	out.connect(master);
	const n = noise(5), lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter();
	lp.type = 'lowpass'; lp.frequency.value = 1400;
	hp.type = 'highpass'; hp.frequency.value = 300;
	n.connect(hp).connect(lp).connect(out);
	n.start();
	const swell = ctx.createOscillator(), depth = ctx.createGain();
	swell.frequency.value = 0.07; depth.gain.value = 350;
	swell.connect(depth).connect(lp.frequency);
	swell.start();
	let alive = true, timer = 0;
	const drop = () => {
		if (!alive) return;
		const t = ctx.currentTime, o = ctx.createOscillator(), e = ctx.createGain();
		o.type = 'sine';
		o.frequency.setValueAtTime(1800 + Math.random() * 2200, t);
		o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
		e.gain.setValueAtTime(0.05 * Math.random(), t);
		e.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
		o.connect(e).connect(out);
		o.start(t); o.stop(t + 0.08);
		timer = setTimeout(drop, 40 + Math.random() * 220);
	};
	drop();
	return () => { alive = false; clearTimeout(timer); out.gain.setTargetAtTime(0, ctx.currentTime, 0.8); setTimeout(() => { n.stop(); swell.stop(); out.disconnect(); }, 4000); };
}

/* a fire: a low warm rumble, and crackles */
function fire() {
	const out = ctx.createGain();
	out.gain.value = 0;
	out.gain.setTargetAtTime(0.55, ctx.currentTime, 1.5);
	out.connect(master);
	const n = noise(6, true), lp = ctx.createBiquadFilter();
	lp.type = 'lowpass'; lp.frequency.value = 500;
	n.connect(lp).connect(out);
	n.start();
	let alive = true, timer = 0;
	const crack = () => {
		if (!alive) return;
		const t = ctx.currentTime, len = 0.01 + Math.random() * 0.03;
		const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), d = b.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
		const s = ctx.createBufferSource(), e = ctx.createGain(), bp = ctx.createBiquadFilter();
		s.buffer = b; bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 3000; e.gain.value = 0.25 + Math.random() * 0.5;
		s.connect(bp).connect(e).connect(out);
		s.start(t);
		timer = setTimeout(crack, Math.random() < 0.2 ? 60 : 200 + Math.random() * 900);
	};
	crack();
	return () => { alive = false; clearTimeout(timer); out.gain.setTargetAtTime(0, ctx.currentTime, 0.8); setTimeout(() => { n.stop(); out.disconnect(); }, 4000); };
}


/* a bus to send a sound to, fading in, and how to fade it out and let it go */
function bus(level) {
	const out = ctx.createGain();
	out.gain.value = 0;
	out.gain.setTargetAtTime(level, ctx.currentTime, 1.5);
	out.connect(master);
	return out;
}
const fadeOut = (out, then) => { out.gain.setTargetAtTime(0, ctx.currentTime, 0.8); setTimeout(() => { then?.(); out.disconnect(); }, 4000); };
/* something that happens again and again, a while apart, until it's stopped */
function every(fn, wait) { let alive = true, t = 0; const go = () => { if (!alive) return; fn(); t = setTimeout(go, wait()); }; go(); return () => { alive = false; clearTimeout(t); }; }

/* the sea: waves rolling in and drawing back */
function waves() {
	const out = bus(0.6), n = noise(6), lp = ctx.createBiquadFilter(), swell = ctx.createGain();
	lp.type = 'lowpass'; lp.frequency.value = 700;
	swell.gain.value = 0.2;
	n.connect(lp).connect(swell).connect(out);
	n.start();
	const roll = (t, d) => { swell.gain.setTargetAtTime(0.9, t, d * 0.25); lp.frequency.setTargetAtTime(1600, t, d * 0.25); swell.gain.setTargetAtTime(0.12, t + d * 0.45, d * 0.3); lp.frequency.setTargetAtTime(450, t + d * 0.45, d * 0.3); };
	const stop = every(() => roll(ctx.currentTime, 7), () => 6500 + Math.random() * 3000);
	return () => { stop(); fadeOut(out, () => n.stop()); };
}

/* a stream over stones: bright water, always moving */
function stream() {
	const out = bus(0.4), n = noise(5), bp = ctx.createBiquadFilter(), wob = ctx.createOscillator(), depth = ctx.createGain();
	bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
	wob.frequency.value = 0.35; depth.gain.value = 700;
	wob.connect(depth).connect(bp.frequency);
	n.connect(bp).connect(out);
	n.start(); wob.start();
	const stop = every(() => {
		const t = ctx.currentTime, o = ctx.createOscillator(), e = ctx.createGain();
		o.frequency.setValueAtTime(600 + Math.random() * 900, t);
		o.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 800, t + 0.08);
		e.gain.setValueAtTime(0.04, t); e.gain.exponentialRampToValueAtTime(0.0005, t + 0.1);
		o.connect(e).connect(out); o.start(t); o.stop(t + 0.12);
	}, () => 80 + Math.random() * 260);
	return () => { stop(); fadeOut(out, () => { n.stop(); wob.stop(); }); };
}

/* wind outside: a slow low howl rising and falling */
function wind() {
	const out = bus(0.5), n = noise(6), bp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), depth = ctx.createGain(), lfo2 = ctx.createOscillator(), d2 = ctx.createGain();
	bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 3;
	lfo.frequency.value = 0.09; depth.gain.value = 300;
	lfo2.frequency.value = 0.05; d2.gain.value = 0.25;
	lfo.connect(depth).connect(bp.frequency);
	const g = ctx.createGain(); g.gain.value = 0.5;
	lfo2.connect(d2).connect(g.gain);
	n.connect(bp).connect(g).connect(out);
	n.start(); lfo.start(); lfo2.start();
	return () => fadeOut(out, () => { n.stop(); lfo.stop(); lfo2.stop(); });
}

/* birds in the morning: little chirps and trills from here and there */
function birds() {
	const out = bus(0.35);
	const chirp = () => {
		const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
		if (pan.pan) pan.pan.value = Math.random() * 1.6 - 0.8;
		pan.connect(out);
		const base = 2200 + Math.random() * 2200, n = 1 + Math.floor(Math.random() * 5);
		for (let i = 0; i < n; i++) {
			const t = ctx.currentTime + i * (0.08 + Math.random() * 0.05), o = ctx.createOscillator(), e = ctx.createGain();
			o.type = 'sine';
			o.frequency.setValueAtTime(base, t);
			o.frequency.exponentialRampToValueAtTime(base * (Math.random() < 0.5 ? 1.5 : 0.7), t + 0.07);
			e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.12, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
			o.connect(e).connect(pan); o.start(t); o.stop(t + 0.1);
		}
	};
	const stop = every(chirp, () => 500 + Math.random() * 2600);
	return () => { stop(); fadeOut(out); };
}

/* a summer night: crickets singing together */
function crickets() {
	const out = bus(0.18);
	const voices = [4300, 4700, 5100].map((f, k) => {
		const o = ctx.createOscillator(), g = ctx.createGain(), am = ctx.createOscillator(), amg = ctx.createGain();
		o.frequency.value = f;
		am.type = 'square'; am.frequency.value = 22 + k * 3; amg.gain.value = 0.5;
		g.gain.value = 0;
		am.connect(amg).connect(g.gain);
		o.connect(g).connect(out);
		o.start(); am.start();
		// each one sings in bursts
		const stop = every(() => { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.5, t); g.gain.setValueAtTime(0, t + 0.3 + Math.random() * 0.4); }, () => 700 + Math.random() * 900);
		return () => { stop(); o.stop(); am.stop(); };
	});
	return () => fadeOut(out, () => voices.forEach((s) => s()));
}

/* a clock on the wall: tick… tock */
function clock() {
	const out = bus(0.5);
	let k = 0;
	const stop = every(() => {
		const t = ctx.currentTime, b = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate), d = b.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
		const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), e = ctx.createGain();
		s.buffer = b; bp.type = 'bandpass'; bp.frequency.value = k++ % 2 ? 2400 : 3200; bp.Q.value = 6; e.gain.value = 0.9;
		s.connect(bp).connect(e).connect(out); s.start(t);
	}, () => 1000);
	return () => { stop(); fadeOut(out); };
}

/* a music box: a little tune of bells, turning slowly */
const TUNE = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74];
function musicbox() {
	const out = bus(0.5);
	out.connect(verb);
	let i = 0;
	const stop = every(() => {
		const t = ctx.currentTime, m = TUNE[i++ % TUNE.length];
		for (const [mul, v] of [[1, 0.12], [3, 0.04], [5.4, 0.015]]) {
			const o = ctx.createOscillator(), e = ctx.createGain();
			o.frequency.value = hz(m) * mul;
			e.gain.setValueAtTime(v, t); e.gain.exponentialRampToValueAtTime(0.0004, t + 1.8);
			o.connect(e).connect(out); o.start(t); o.stop(t + 1.9);
		}
	}, () => (i % 4 === 0 ? 900 : 520));
	return () => { stop(); fadeOut(out); };
}

/* lo-fi: a lazy beat, warm chords and the crackle of an old record */
function lofi() {
	const out = bus(0.5);
	const vinyl = noise(4), hp = ctx.createBiquadFilter(), vg = ctx.createGain();
	hp.type = 'highpass'; hp.frequency.value = 3000; vg.gain.value = 0.015;
	vinyl.connect(hp).connect(vg).connect(out); vinyl.start();
	const beat = 60 / 72;
	const kick = (t) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25); e.gain.setValueAtTime(0.5, t); e.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(e).connect(out); o.start(t); o.stop(t + 0.32); };
	const snare = (t) => { const s = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); s.buffer = b; const bp = ctx.createBiquadFilter(), e = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1800; e.gain.value = 0.18; s.connect(bp).connect(e).connect(out); s.start(t); };
	const hat = (t) => { const s = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); s.buffer = b; const hp2 = ctx.createBiquadFilter(), e = ctx.createGain(); hp2.type = 'highpass'; hp2.frequency.value = 7000; e.gain.value = 0.06; s.connect(hp2).connect(e).connect(out); s.start(t); };
	const pad = (t, ch) => ch.forEach((m) => { const o = ctx.createOscillator(), e = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = hz(m); lp.type = 'lowpass'; lp.frequency.value = 900; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.035, t + 0.4); e.gain.setTargetAtTime(0, t + beat * 3.6, 0.3); o.connect(lp).connect(e).connect(out); o.start(t); o.stop(t + beat * 4 + 1); });
	let bar = 0;
	const stop = every(() => {
		const t = ctx.currentTime + 0.05;
		pad(t, CHORDS[bar % CHORDS.length].map((m) => m - 12));
		for (let b = 0; b < 4; b++) {
			const tb = t + b * beat;
			if (b === 0 || b === 2) kick(tb + (b === 2 ? beat * 0.5 : 0));
			if (b === 1 || b === 3) snare(tb);
			hat(tb); hat(tb + beat / 2 + 0.03);
		}
		bar++;
	}, () => beat * 4000);
	return () => { stop(); fadeOut(out, () => vinyl.stop()); };
}

const SOUNDS = { piano, lofi, musicbox, rain, waves, stream, wind, fire, birds, crickets, clock };
export const playing = (name) => !!on[name];
export function toggle(name) {
	setup();
	if (ctx.state === 'suspended') ctx.resume();
	if (on[name]) { on[name](); delete on[name]; return false; }
	on[name] = SOUNDS[name]();
	return true;
}
export function volume(v) { setup(); master.gain.setTargetAtTime(v, ctx.currentTime, 0.1); }
export function stopAll() { for (const k of Object.keys(on)) { on[k](); delete on[k]; } }
