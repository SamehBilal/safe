/* Calm sounds for reading, made right here in the browser (Web Audio — no files, nothing fetched): a slow piano that
   wanders over four soft chords, rain on the window, and a fire crackling. Any of them can play together, with one
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

const SOUNDS = { piano, rain, fire };
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
