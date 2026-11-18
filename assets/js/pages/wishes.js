import { L, Y, T, esc, pageHead, related, sleep, store, $, $$, App } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';

const KEY = 'us.wishes';
const JAR = `<svg viewBox="0 0 200 260" aria-hidden="true">
	<rect x="30" y="70" width="140" height="180" rx="34" fill="rgba(230,247,255,.55)" stroke="#27525c" stroke-width="5"/>
	<path d="M138 92c10 30 10 110 0 140" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>
	<rect x="48" y="52" width="104" height="22" rx="6" fill="#cfe3ec" stroke="#27525c" stroke-width="5"/>
	<g class="jar__lid"><rect x="40" y="26" width="120" height="28" rx="10" fill="#66a8b8" stroke="#27525c" stroke-width="5"/><path d="M56 38h88" stroke="#27525c" stroke-width="3" opacity=".35"/></g>
</svg>`;

/* The night sky over the jar, after indextwo's «BANANA 🍌» pen on CodePen: the wish jar drawn as a glowing neon line
   whose dashes keep marching round it, in a sky of little twinkling stars that keep clear of the jar and fade
   towards the ground. */
const NEON = `<svg class="sky__jar" viewBox="0 0 220 300" aria-hidden="true">
	<filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
		<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="near"/>
		<feGaussianBlur in="SourceGraphic" stdDeviation="9" result="far"/>
		<feMerge><feMergeNode in="far"/><feMergeNode in="near"/><feMergeNode in="SourceGraphic"/></feMerge>
	</filter>
	<g fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#neon-glow)">
		<path class="neon neon--jar" d="M64 22h92a9 9 0 0 1 9 9v14a9 9 0 0 1-9 9H64a9 9 0 0 1-9-9V31a9 9 0 0 1 9-9Z M74 54v16q-46 14-46 66v104q0 38 38 38h88q38 0 38-38V136q0-52-46-66V54 M54 150q-6 50 4 92"/>
		<path class="neon neon--heart" d="M110 232c-32-22-46-40-46-58a22 22 0 0 1 46-7 22 22 0 0 1 46 7c0 18-14 36-46 58Z"/>
		<path class="neon neon--star" d="M152 104l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z"/>
	</g>
</svg>`;
const STAR = `<symbol id="sky-star" viewBox="-6 -6 12 12"><circle class="shine" r="5.5" fill="url(#sky-glow)"/><path d="M0-4.2L1.1-1.1 4.2 0 1.1 1.1 0 4.2-1.1 1.1-4.2 0-1.1-1.1Z" fill="#fff4c8"/></symbol>`;

/* the night sky takes the place of the polaroids above the page title */
const SKY = `<div class="sky sky--band" id="wish-sky">
	<svg class="sky__stars" aria-hidden="true"><defs><radialGradient id="sky-glow"><stop offset="10%" stop-color="rgba(254,202,87,1)"/><stop offset="95%" stop-color="rgba(254,202,87,0)"/></radialGradient>${STAR}</defs><g class="sky__field"></g></svg>
	${NEON}
	<p class="sky__count" id="sky-count"></p>
</div>`;

function sky(el) {
	const svg = el.querySelector('.sky__stars');
	const draw = () => {
		const W = el.clientWidth, H = el.clientHeight;
		if (!W) return;
		// the jar sits centred, 5% from the top and 74% of the sky's height (see .sky__jar), so its box follows from the sky's size
		const jh = H * 0.74, jw = (jh * 220) / 300;
		const keep = { x0: (W - jw) / 2 - 24, x1: (W + jw) / 2 + 24, y0: H * 0.05 - 24, y1: H * 0.05 + jh + 24 };
		const clear = (x, y) => x < keep.x0 || x > keep.x1 || y < keep.y0 || y > keep.y1;
		const rnd = (a, z) => a + Math.random() * (z - a);
		let html = '';
		for (let i = 0; i < Math.round(W / 18); i++) {
			let x, y, n = 0;
			do { x = rnd(0, W); y = rnd(0, H * 0.92); } while (!clear(x, y) && ++n < 50);
			const fade = 1 - (y / H) * 0.85;
			const s = rnd(0.5, 1.5) * fade;
			const glow = Math.random() < 0.3 ? ` class="tw" style="--t:${rnd(0.6, 3).toFixed(2)}s;--d:-${rnd(0, 2).toFixed(2)}s"` : '';
			html += `<use href="#sky-star" x="${(x - 6 * s).toFixed(1)}" y="${(y - 6 * s).toFixed(1)}" width="${(12 * s).toFixed(1)}" height="${(12 * s).toFixed(1)}" opacity="${fade.toFixed(2)}"${glow}/>`;
		}
		svg.querySelector('.sky__field').innerHTML = html;
	};
	draw();
	let w = el.clientWidth;
	new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 40) { w = el.clientWidth; draw(); } }).observe(el);
}

/* Our wish jar, shared by both phones (content/live/wishes.bin, encrypted). Wishes made on a phone before the jar
   was shared (kept only on that phone) are moved into it the first time that phone can save. */
export default {
	title: { ar: 'برطمان الأمنيات', en: 'Wish jar' },
	render() {
		return `
		${pageHead(L('برطمان الأمنيات', 'Wish jar'), L('أمنياتنا إحنا الاتنين، في برطمان واحد', 'Both our wishes, in one jar'), [{ href: 'wishes.html', ar: 'برطمان الأمنيات', en: 'Wish jar' }], { band: SKY })}
		${live.canWrite() ? '' : `<div class="wrap narrow" style="margin-top:16px">${setupNote()}</div>`}
		<section class="sec sec--top"><div class="wrap jar-wrap">
			<form class="wish-form reveal" id="wish-form" autocomplete="off">
				<label class="sr-only" for="wish-input">${L('نفسي…', 'I wish…')}</label>
				<input id="wish-input" dir="auto" maxlength="140" placeholder="${L('نفسي…', 'I wish…')}" enterkeyhint="send">
				<button type="submit" aria-label="${Y('حط الأمنية في البرطمان', 'حطي الأمنية في البرطمان', 'Put the wish in the jar')}">★</button>
			</form>
			<p class="wish-hint">${Y('دوس على أي نجمة عشان تقرا الأمنية اللي جواها', 'دوسي على أي نجمة عشان تقري الأمنية اللي جواها', 'Tap a star to read the wish inside')}</p>
			<div class="jar" id="jar">${JAR}<div class="jar__stars" id="jar-stars"></div></div>
			<div class="wish-note" id="wish-note" aria-live="polite" hidden></div>
			<p class="wish-toast" id="wish-toast" aria-live="polite"></p>
		</div></section>
		${related(['birthday', 'journal', 'notes'])}`;
	},
	async after(main) {
		const form = $('#wish-form', main);
		const input = $('#wish-input', main);
		const box = $('#jar-stars', main);
		const jar = $('#jar', main);
		const toast = $('#wish-toast', main);
		const name = (w) => App.t(w === 'him' ? App.story.him : App.story.her);
		let wishes = (await live.load('wishes')).items || [];
		// wishes this phone kept for itself before the jar was shared
		let mine = [];
		try { mine = JSON.parse(store.get(KEY) || '[]'); } catch { mine = []; }
		if (mine.length && live.canWrite()) {
			try { wishes = (await live.save('wishes', (d) => { (d.items = d.items || []).push(...mine.map((w) => ({ ...w, id: live.newId(), by: live.me() }))); })).items; store.del(KEY); }
			catch { /* try again next time */ }
		}
		// a star tapped: the wish inside unfolds out of the jar as a slip of paper — taped on, a gold star stamped on it,
		// whose wish it is, the wish in handwriting on ruled lines, and the day it went in
		const note = $('#wish-note', main);
		const open = (w, b) => {
			$$('.is-read', box).forEach((x) => x.classList.remove('is-read'));
			b.classList.add('is-read');
			toast.textContent = '';
			const day = w.at ? new Date(w.at).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
			note.innerHTML = `<span class="wish-note__tape" aria-hidden="true"></span>
				<span class="wish-note__stamp" aria-hidden="true">★</span>
				<small class="wish-note__k">${w.by ? esc(L(`أمنية ${name(w.by)}`, `A wish from ${name(w.by)}`)) : L('أمنية', 'A wish')}</small>
				<p class="wish-note__tx" dir="auto">${esc(w.text)}</p>
				${day ? `<small class="wish-note__day">${esc(L(`اتحطت في البرطمان ${day}`, `Into the jar on ${day}`))}</small>` : ''}`;
			note.hidden = false;
			note.classList.remove('is-in');
			void note.offsetWidth;
			note.classList.add('is-in');
		};
		const add = (w, animate) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.innerHTML = doodle('star', 22, 'dd--fill');
			b.setAttribute('aria-label', L('أمنية: ', 'Wish: ') + w.text);
			if (!animate) b.style.animation = 'none';
			b.onclick = () => open(w, b);
			box.append(b);
		};
		wishes.forEach((w) => add(w, false));
		const skyEl = $('#wish-sky', main);
		const count = () => { $('#sky-count', main).textContent = wishes.length ? L(`${wishes.length.toLocaleString('ar-EG')} ${wishes.length === 1 ? 'أمنية' : wishes.length <= 10 ? 'أمنيات' : 'أمنية'} في البرطمان ♥`, `${wishes.length} ${wishes.length === 1 ? 'wish' : 'wishes'} in the jar ♥`) : L('البرطمان مستني أول أمنية ♥', 'The jar is waiting for its first wish ♥'); };
		if (skyEl) { sky(skyEl); count(); }
		form.onsubmit = async (e) => {
			e.preventDefault();
			const text = input.value.trim();
			if (!text) return input.focus();
			if (!live.canWrite()) { toast.textContent = live.why({ code: 'setup' }); return; }
			const w = { id: live.newId(), text, by: live.me(), at: Date.now() };
			try { wishes = (await live.save('wishes', (d) => { (d.items = d.items || []).push(w); })).items; }
			catch (err) { toast.textContent = live.why(err); return; }
			input.value = '';
			const from = form.getBoundingClientRect();
			const to = jar.getBoundingClientRect();
			const star = Object.assign(document.createElement('span'), { className: 'flying-star', innerHTML: doodle('star', 30, 'dd--fill') });
			const sx = from.left + from.width / 2;
			star.style.left = sx + 'px';
			star.style.top = from.top + 'px';
			document.body.append(star);
			jar.classList.add('is-open');
			requestAnimationFrame(() => requestAnimationFrame(() => {
				star.style.transform = `translate(${to.left + to.width / 2 - sx}px, ${to.top + to.height * 0.5 - from.top}px) rotate(540deg) scale(.6)`;
				star.style.opacity = '0';
			}));
			await sleep(850);
			star.remove();
			add(w, true);
			count();
			await sleep(250);
			jar.classList.remove('is-open');
			toast.textContent = L('الأمنية في أمان جوه البرطمان', 'The wish is safe in the jar');
		};
	}
};
