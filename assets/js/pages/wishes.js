import { L, Y, T, esc, pageHead, related, sleep, store, $, $$, App } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';

const KEY = 'us.wishes';
const JAR = `<svg viewBox="0 0 200 270" aria-hidden="true">
	<path class="jar__shadow" d="M44 78c-14 14-16 32-16 60v84c0 26 14 38 40 38h76c26 0 40-12 40-38v-84c0-28-2-46-16-60Z"/>
	<path class="jar__glass" d="M40 74c-14 14-16 32-16 60v84c0 26 14 38 40 38h72c26 0 40-12 40-38v-84c0-28-2-46-16-60Z"/>
	<path d="M146 98c9 28 10 104 1 136" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".75"/>
	<path d="M58 104c-5 20-5 50-3 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>
	<path class="jar__neck" d="M48 56h104c3 0 4 2 4 5v12c0 3-1 4-4 4H48c-3 0-4-1-4-4V61c0-3 1-5 4-5Z"/>
	<g class="jar__lid">
		<path class="jar__cloth" d="M30 46c18-10 44-18 70-18s52 8 70 18c-4 6-6 12-4 20-20 4-44 6-66 6s-46-2-66-6c2-8 0-14-4-20Z"/>
		<path d="M30 46c18-10 44-18 70-18s52 8 70 18" fill="none" stroke="#37353f" stroke-width="2" stroke-dasharray="4 5" opacity=".5"/>
		<path class="jar__string" d="M36 62c22 6 106 6 128 0M150 64c6 8 14 10 20 6M150 64c2 10-2 16-8 18"/>
	</g>
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
			<div class="wj">
				<form class="wish-form reveal" id="wish-form" autocomplete="off">
					<span class="wish-form__tape" aria-hidden="true"></span>
					<label class="wish-form__h" for="wish-input">${L('نفسي…', 'I wish…')}</label>
					<textarea id="wish-input" dir="auto" maxlength="140" rows="3" enterkeyhint="send" placeholder="${L('اكتب أمنيتك هنا…', 'Write your wish here…')}"></textarea>
					<div class="wish-form__ft">
						<small class="wish-form__n" id="wish-n" aria-live="off">${L('١٤٠ حرف', '140 letters')}</small>
						<button type="submit" class="wish-form__go"><span aria-hidden="true">★</span> ${Y('حطها في البرطمان', 'حطيها في البرطمان', 'Into the jar')}</button>
					</div>
				</form>
				<div class="wj__jar">
					<div class="jar" id="jar">${JAR}<span class="jar__tag" aria-hidden="true">${L('أمنياتنا ♥', 'our wishes ♥')}</span><div class="jar__stars" id="jar-stars"></div></div>
					<p class="wish-hint"><span aria-hidden="true">↶</span> ${Y('دوس على أي نجمة عشان تقرا الأمنية اللي جواها', 'دوسي على أي نجمة عشان تقري الأمنية اللي جواها', 'Tap a star to read the wish inside')}</p>
				</div>
			</div>
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
		const left = () => { const n = 140 - input.value.length; $('#wish-n', main).textContent = L(`${n.toLocaleString('ar-EG')} حرف`, `${n} letters`); };
		input.addEventListener('input', left);
		input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
		form.onsubmit = async (e) => {
			e.preventDefault();
			const text = input.value.trim();
			if (!text) return input.focus();
			if (!live.canWrite()) { toast.textContent = live.why({ code: 'setup' }); return; }
			const w = { id: live.newId(), text, by: live.me(), at: Date.now() };
			try { wishes = (await live.save('wishes', (d) => { (d.items = d.items || []).push(w); })).items; }
			catch (err) { toast.textContent = live.why(err); return; }
			input.value = '';
			left();
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
