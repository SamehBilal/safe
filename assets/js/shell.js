/* Shared by every page: language (Arabic first, English second), the lock (questions -> loader -> intro),
   the header with its mega menus, the phone menu, the footer, and helpers the page modules use.

   Each page is a plain HTML file with <body data-page="story"> and one script tag for this file.
   This file loads assets/js/pages/<page>.js and calls its render() once the story is unlocked. */
import { unlock, readVault, open, toB64, fromB64 } from './core.js';
import { sky, dust } from './stardust.js';
import { nightScene } from './scene.js';
import { doodle, doodleDefs } from './doodles.js';
import { initPWA, pwaChrome } from './pwa.js';
import * as radio from './radio.js';

const KEY = 'us.key';
const LANG = 'us.lang';
const SEEN_INTRO = 'us.intro';
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ small helpers */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const store = {
	get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
	set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
	del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};
export const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCE ? Math.min(ms, 120) : ms));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const rand = (a, b) => +(a + Math.random() * (b - a)).toFixed(2);
export const qs = (k) => new URLSearchParams(location.search).get(k);

export const App = {
	lang: store.get(LANG) === 'en' ? 'en' : 'ar',
	story: null,
	/** A text from the data: a plain string, or { ar, en }. */
	t(v) {
		if (v == null) return '';
		if (typeof v === 'string' || typeof v === 'number') return String(v);
		return v[App.lang] ?? v.ar ?? v.en ?? '';
	},
	/** UI text: L('عربي', 'English'). */
	L: (ar, en) => (App.lang === 'ar' ? ar : en),
	get arrow() { return App.lang === 'ar' ? '←' : '→'; }
};
export const t = (v) => App.t(v);
export const L = (ar, en) => App.L(ar, en);
/** Who is holding the phone — 'him' or 'her' — as picked on the questions screen or in Settings ('' until then). */
export const who = () => { const v = store.get('us.me'); return v === 'her' ? 'her' : v === 'him' ? 'him' : ''; };
/** UI text spoken to whoever is here, not to the two of us: Y('اكتب', 'اكتبي', 'Write') — to him, to her, English. */
export const Y = (him, her, en) => (App.lang === 'ar' ? (who() === 'her' ? her : him) : en);
export const T = (v) => esc(App.t(v));

/* Dates: stored as YYYY-MM-DD, shown day.month.year like the poster. */
export const parseDate = (iso) => { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const fmtDate = (iso) => { if (!iso) return ''; const [y, m, d] = String(iso).split('-'); return [d, m, y].filter(Boolean).join('.'); };
export function longDate(iso) {
	return parseDate(iso).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function yearsBetween(a, b = new Date()) {
	let y = b.getFullYear() - a.getFullYear();
	if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) y--;
	return y;
}
export const daysBetween = (a, b = new Date()) => Math.floor((b - a) / 864e5);
export const num = (n) => new Intl.NumberFormat(App.lang === 'ar' ? 'ar-EG' : 'en').format(n);

/** "3 years" / "٣ سنين", "4 months" / "٤ شهور" — Egyptian Arabic plural rules kept simple. */
export function age(iso, now = new Date()) {
	const b = parseDate(iso);
	let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
	if (now.getDate() < b.getDate()) months--;
	if (months < 0) return L('لسه جاي', 'on the way');
	if (months < 1) { const d = daysBetween(b, now); return App.lang === 'ar' ? `${num(d)} ${d === 1 ? 'يوم' : d === 2 ? 'يومين' : d <= 10 ? 'أيام' : 'يوم'}` : `${d} day${d === 1 ? '' : 's'}`; }
	if (months < 24) return App.lang === 'ar' ? (months === 1 ? 'شهر' : months === 2 ? 'شهرين' : `${num(months)} ${months <= 10 ? 'شهور' : 'شهر'}`) : `${months} month${months === 1 ? '' : 's'}`;
	const y = Math.floor(months / 12);
	return App.lang === 'ar' ? (y === 2 ? 'سنتين' : `${num(y)} ${y <= 10 ? 'سنين' : 'سنة'}`) : `${y} years`;
}
export function yearsAgo(iso) {
	const y = yearsBetween(parseDate(iso));
	if (y <= 0) return '';
	return App.lang === 'ar' ? `من ${y === 1 ? 'سنة' : y === 2 ? 'سنتين' : num(y) + (y <= 10 ? ' سنين' : ' سنة')}` : `${y} year${y === 1 ? '' : 's'} ago`;
}
/** Days from today to the next time this month/day comes round (0 = today). */
export function daysUntil(iso, from = new Date()) {
	const d = parseDate(iso);
	const t0 = new Date(from.getFullYear(), from.getMonth(), from.getDate());
	let n = new Date(t0.getFullYear(), d.getMonth(), d.getDate());
	if (n < t0) n = new Date(t0.getFullYear() + 1, d.getMonth(), d.getDate());
	return Math.round((n - t0) / 864e5);
}

/** Our days that come round every year — each of our birthdays, our wedding anniversary, the day we met —
    nearest first, with how many days to go and which one it will be. */
export function occasions(s, from = new Date()) {
	const list = [];
	const turning = (iso) => yearsBetween(parseDate(iso), from) + (daysUntil(iso, from) === 0 ? 0 : 1);
	for (const m of s.family?.members || []) {
		if (!m.born) continue;
		const days = daysUntil(m.born, from);
		const n = turning(m.born);
		const name = t(m.name);
		list.push({ kind: 'birthday', id: m.id, member: m, emoji: 'cake', date: m.born, days, years: n,
			title: L(`عيد ميلاد ${name}`, `${name}'s birthday`),
			sub: (() => { const yrs = n === 1 ? 'سنة' : n === 2 ? 'سنتين' : `${num(n)} ${n <= 10 ? 'سنين' : 'سنة'}`; // Arabic follows whether it's him or her: هيكمل / هتكمل, بقى عنده / بقت عندها
			const she = !!m.female;
			return days === 0 ? L(`${name} ${she ? 'بقت عندها' : 'بقى عنده'} ${yrs} ♥`, `${name} turns ${n} today ♥`) : L(`${name} ${she ? 'هتكمل' : 'هيكمل'} ${yrs}`, `${name} turns ${n}`); })() });
	}
	if (s.married) {
		const n = turning(s.married);
		list.push({ kind: 'anniversary', emoji: 'ring', date: s.married, days: daysUntil(s.married, from), years: n,
			title: L('عيد جوازنا', 'Our anniversary'), sub: L(`${num(n)} سنين جواز ♥`, `${n} years married ♥`) });
	}
	if (s.met) {
		const n = turning(s.met);
		list.push({ kind: 'met', emoji: 'chat', date: s.met, days: daysUntil(s.met, from), years: n,
			title: L('يوم أول سلام', 'The day we met'), sub: L(`${num(n)} سنة من أول رسالة`, `${n} years since the first message`) });
	}
	return list.sort((a, b) => a.days - b.days);
}

export function isToday(iso) {
	const d = parseDate(iso), n = new Date();
	return d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/* ------------------------------------------------------------------ media (encrypted photos) */

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg' };
const media = new Map();
let masterKey;
/** The unlocked master key (CryptoKey), for live.js. */
export const getKey = () => masterKey;
export const mimeOf = (ref) => MIME[(String(ref).match(/\.(\w+)$/) || [])[1]?.toLowerCase()] || 'application/octet-stream';
export const isVideo = (ref) => /^video\//.test(mimeOf(ref));

/* where a sealed file lives: photos and videos here (content/m), songs on our songs site (tools/songs.mjs) */
const SONGS_URL = 'https://samehbilal.github.io/safe-songs/';
export function binURL(ref) {
	const m = /^(media|song):([a-f0-9]+)\.\w+$/.exec(ref || '');
	if (!m) return '';
	return m[1] === 'song' ? `${App.story?.$songs || SONGS_URL}m/${m[2]}.bin` : `content/m/${m[2]}.bin`;
}

export function mediaURL(ref) {
	if (!ref) return Promise.reject(new Error('none'));
	if (/^https?:\/\//.test(ref)) return Promise.resolve(ref);
	const url = binURL(ref);
	if (!url) return Promise.reject(new Error('not built: ' + ref));
	if (!media.has(ref)) {
		media.set(ref, fetch(url)
			.then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
			.then((buf) => open(masterKey, buf))
			.then((bytes) => URL.createObjectURL(new Blob([bytes], { type: mimeOf(ref) }))));
	}
	return media.get(ref);
}

/* links out of the site (a full video kept in Google Drive, say): story.json "links": [{ href, ar, en }] */
export const linksOut = (o) => (o?.links || []).filter((l) => String(l.href || '').startsWith('https://')).map((l) => `<a class="btn btn--coral reveal" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" style="margin:8px 0 18px">▶ ${esc(L(l.ar, l.en))}</a>`).join(' ');

/** Markup for a photo/video, filled in by hydrate(). `box` marks the element to remove if it fails. */
export function img(ref, alt = '', cls = '') {
	if (!ref) return '';
	return isVideo(ref)
		? `<video class="${cls}" data-m="${esc(ref)}" playsinline muted loop controls preload="metadata"></video>`
		: `<img class="${cls}" data-m="${esc(ref)}" alt="${esc(alt)}" decoding="async">`;
}

/* When a page is first drawn (lazy = true), its photos are fetched and decrypted only as they come near the screen
   (a screen and a half ahead), so a page with hundreds of them opens as fast as one with three. A page asking for
   photos itself (a slide it's about to show, say) gets them straight away, and so do ones marked data-eager. */
const fill = (el) => {
	if (el.dataset.done) return;
	el.dataset.done = '1';
	mediaURL(el.dataset.m)
		.then((url) => { el.src = url; })
		.catch(() => { (el.closest('[data-media-box]') || el).remove(); });
};
const nearby = 'IntersectionObserver' in window
	? new IntersectionObserver((entries) => {
		for (const e of entries) if (e.isIntersecting) { nearby.unobserve(e.target); fill(e.target); }
	}, { rootMargin: '150% 100% 150% 100%' })
	: null;
export function hydrate(root = document, lazy = false) {
	for (const el of $$('[data-m]', root)) {
		if (el.dataset.done) continue;
		if (el.dataset.watch) { if (!lazy) { nearby.unobserve(el); fill(el); } continue; }
		if (!lazy || !nearby || 'eager' in el.dataset) fill(el);
		else { el.dataset.watch = '1'; nearby.observe(el); }
	}
}

/** Every photo the story refers to (for the "first photo of …" covers). */
export const firstPhoto = (o) => o?.cover || o?.photo || (o?.photos || []).map((p) => (typeof p === 'string' ? p : p.photo))[0] || '';

/* ------------------------------------------------------------------ language */

function applyLang() {
	const html = document.documentElement;
	html.lang = App.lang;
	html.dir = App.lang === 'ar' ? 'rtl' : 'ltr';
}

function setLang(l) {
	App.lang = l;
	store.set(LANG, l);
	applyLang();
	if (App.story) {
		renderChrome();
		renderPage();
		radio.redraw();
	} else if (gateRedraw) {
		gateRedraw();
	}
}

/* ------------------------------------------------------------------ boot */

let page;
let vault;
let gate;
let gateRedraw;

async function boot() {
	applyLang();
	doodleDefs();
	floatHearts();
	initPWA();
	const id = document.body.dataset.page || 'home';
	const pageP = import(`./pages/${id}.js`).then((m) => m.default).catch(() => import('./pages/home.js').then((m) => m.default));
	try {
		[vault, gate, page] = await Promise.all([getJSON('content/vault.json'), getJSON('content/gate.json'), pageP]);
	} catch {
		return fatal(Y('مش قادر أحمّل الموقع — اتأكد من النت وجرّب تاني ♥', 'مش قادر أحمّل الموقع — اتأكدي من النت وجرّبي تاني ♥', 'Couldn’t load — check your connection and try again ♥'));
	}
	const saved = store.get(KEY);
	if (saved) {
		try {
			const res = await readVault(vault, fromB64(saved));
			return enter(res, { intro: qs('intro') !== null, loader: false });
		} catch {
			store.del(KEY); // rebuilt with a new key, or storage got mangled
		}
	}
	runGate();
}

async function getJSON(url) {
	const r = await fetch(url, { cache: 'no-cache' });
	if (!r.ok) throw new Error(url + ' ' + r.status);
	return r.json();
}

function stage(html, cls) {
	let el = $('#stage');
	if (!el) {
		el = document.createElement('section');
		el.id = 'stage';
		document.body.prepend(el);
	}
	el.className = 'stage ' + cls;
	el.innerHTML = html;
	el.hidden = false;
	document.body.classList.add('is-locked');
	return el;
}

async function leaveStage() {
	const el = $('#stage');
	if (!el) return;
	el.classList.add('is-leaving');
	await sleep(480);
	el.remove();
	document.body.classList.remove('is-locked');
}

function fatal(msg) {
	stage(`<div class="gate__card"><h1 class="gate__title">${L('أوبس', 'Oops')}</h1><p>${esc(msg)}</p><button class="btn" onclick="location.reload()">${Y('جرّب تاني', 'جرّبي تاني', 'Try again')}</button></div>`, 'gate');
}

const THEME = 'us.theme';
const isDark = () => document.documentElement.dataset.theme === 'dark';
const themeBtn = () => `<button class="icon-btn theme-toggle" type="button" aria-pressed="${isDark()}" aria-label="${L('الوضع الليلي', 'Dark mode')}" title="${L('ليلي / نهاري', 'Dark / light')}"><span aria-hidden="true">${doodle(isDark() ? 'sun' : 'moon', 20)}</span></button>`;
function toggleTheme() {
	const next = isDark() ? 'light' : 'dark';
	document.documentElement.dataset.theme = next;
	store.set(THEME, next);
	for (const b of $$('.theme-toggle')) { b.setAttribute('aria-pressed', String(next === 'dark')); b.firstElementChild.innerHTML = doodle(next === 'dark' ? 'sun' : 'moon', 20); }
}
const langBtn = () => `<button class="lang-toggle" type="button" lang="${App.lang === 'ar' ? 'en' : 'ar'}" aria-label="${App.lang === 'ar' ? 'English' : 'عربي'}"><span class="lang-long">${App.lang === 'ar' ? 'English' : 'عربي'}</span><span class="lang-short" aria-hidden="true">${App.lang === 'ar' ? 'EN' : 'ع'}</span></button>`;

/* ------------------------------------------------------------------ 1. the gate */

function runGate() {
	const qsList = gate.questions;
	const answers = qsList.map(() => '');
	let i = 0;
	let wrong = false;

	/* the gate's own lines, spoken to whoever picked themselves above the questions (to both until then) */
	const say = (both, him, her, en) => (who() ? Y(him, her, en) : L(both, en));
	const draw = (animate) => {
		const q = qsList[i];
		const last = i === qsList.length - 1;
		const me = who();
		const el = stage(`
			<div class="stage__lang">${themeBtn()}${langBtn()}</div>
			<form class="gate__card" id="gate-form" autocomplete="off" novalidate>
				<svg class="gate__lock" viewBox="0 0 64 72" aria-hidden="true">
					<path class="gate__shackle" d="M18 32V22a14 14 0 0 1 28 0v10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
					<path class="gate__body" d="M32 70C14 58 4 48 4 38a12 12 0 0 1 22-7l6 6 6-6a12 12 0 0 1 22 7c0 10-10 20-28 32Z"/>
					<g fill="#fff"><circle cx="24" cy="44" r="2.6"/><circle cx="32" cy="44" r="2.6"/><circle cx="40" cy="44" r="2.6"/></g>
				</svg>
				<h1 class="gate__title">${say('أهلًا بيكم', 'أهلًا بيك', 'أهلًا بيكي', 'Welcome home')}</h1>
				<p class="gate__intro">${say('المكان ده بتاعنا إحنا بس. جاوبوا وادخلوا.', 'المكان ده بتاعنا إحنا بس. جاوب وادخل.', 'المكان ده بتاعنا إحنا بس. جاوبي وادخلي.', 'This place is only ours. Answer and come in.')}</p>
				<div class="gate__who" role="radiogroup" aria-label="${L('مين معانا؟', 'Who’s here?')}">
					<span class="gate__who-q">${L('مين معانا؟', 'Who’s here?')}</span>
					<button type="button" class="chip${me === 'him' ? ' is-on' : ''}" role="radio" data-me="him" aria-checked="${me === 'him'}">${doodle('groom', 26)}<span>${L('أنا العريس', 'I’m the groom')}</span></button>
					<button type="button" class="chip${me === 'her' ? ' is-on' : ''}" role="radio" data-me="her" aria-checked="${me === 'her'}">${doodle('princess', 26)}<span>${L('أنا العروسة', 'I’m the bride')}</span></button>
				</div>
				<ol class="gate__steps" aria-hidden="true">${qsList.map((_, n) => `<li class="${n < i ? 'is-done' : n === i ? 'is-now' : ''}"></li>`).join('')}</ol>
				<div class="gate__ask ${animate ? 'swap' : ''}">
					<label class="gate__q" for="gate-input">${T(q.q)}</label>
					<input class="gate__input" id="gate-input" type="text" dir="auto" autocapitalize="off" autocorrect="off" spellcheck="false"
						inputmode="${q.type === 'number' ? 'numeric' : 'text'}" enterkeyhint="${last ? 'go' : 'next'}" placeholder="${esc(t(q.placeholder))}" value="${esc(answers[i])}">
					${q.hint ? `<button type="button" class="link" id="gate-hint-btn">${say('محتاجين تلميح؟', 'محتاج تلميح؟', 'محتاجة تلميح؟', 'Need a hint?')}</button><p class="gate__hint" id="gate-hint" hidden>${T(q.hint)}</p>` : ''}
				</div>
				<p class="gate__msg" id="gate-msg" role="alert">${wrong ? say('في إجابة مش مظبوطة… جربوا تاني ♥', 'في إجابة مش مظبوطة… جرّب تاني ♥', 'في إجابة مش مظبوطة… جرّبي تاني ♥', 'Not quite — try again ♥') : ''}</p>
				<div class="gate__actions">
					${i > 0 ? `<button type="button" class="btn btn--ghost" id="gate-back">${L('رجوع', 'Back')}</button>` : ''}
					<button type="submit" class="btn" id="gate-next">${last ? say('افتحوا ♥', 'افتح ♥', 'افتحي ♥', 'Unlock ♥') : L('التالي', 'Next')}</button>
				</div>
			</form>`, 'gate');
		wire(el);
	};
	gateRedraw = () => { answers[i] = $('#gate-input')?.value ?? answers[i]; draw(false); };

	const shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); navigator.vibrate?.(120); };

	function wire(el) {
		const form = $('#gate-form', el);
		const input = $('#gate-input', el);
		$('.lang-toggle', el).onclick = () => setLang(App.lang === 'ar' ? 'en' : 'ar');
		$('.theme-toggle', el).onclick = toggleTheme;
		// who's here: remembered as this phone's owner (the same as Settings → whose phone), and the gate re-speaks to them
		for (const b of $$('[data-me]', el)) b.onclick = () => { store.set('us.me', b.dataset.me); gateRedraw(); $('#gate-input')?.focus({ preventScroll: true }); };
		$('#gate-hint-btn', el)?.addEventListener('click', (e) => { $('#gate-hint', el).hidden = false; e.currentTarget.hidden = true; });
		$('#gate-back', el)?.addEventListener('click', () => { answers[i] = input.value; i--; wrong = false; draw(true); });
		input.oninput = () => { $('#gate-msg', el).textContent = ''; };
		input.focus({ preventScroll: true });

		form.onsubmit = async (e) => {
			e.preventDefault();
			const v = input.value.trim();
			if (!v) return shake(input);
			answers[i] = v;
			if (!who()) { $('#gate-msg', el).textContent = L('الأول: مين معانا؟ ♥', 'First — who’s here? ♥'); return shake($('.gate__who', el)); }
			if (i < qsList.length - 1) { i++; wrong = false; draw(true); return; }
			const next = $('#gate-next', el);
			next.disabled = true;
			next.textContent = L('ثانية واحدة…', 'Checking…');
			let raw = null;
			try { raw = await unlock(vault, answers); } catch { /* treated as wrong */ }
			if (!raw) { i = 0; wrong = true; draw(false); shake($('#gate-form')); return; }
			store.set(KEY, toB64(raw));
			gateRedraw = null;
			next.textContent = Y('أهلًا بيك في بيتنا ♥', 'أهلًا بيكي في بيتنا ♥', 'Welcome home ♥');
			$$('.gate__steps li', el).forEach((li) => (li.className = 'is-done'));
			el.classList.add('is-open');
			navigator.vibrate?.([60, 80, 60]);
			const res = await readVault(vault, raw);
			await sleep(2000);
			enter(res, { intro: true, loader: true });
		};
	}

	draw(false);
}

/* ------------------------------------------------------------------ 2. loader, 3. intro */

async function enter({ key, story }, { intro, loader }) {
	masterKey = key;
	App.story = story;

	if (loader) {
		const label = L('ثواني… وحكايتنا تبدأ', 'A few seconds… and our story begins');
		// our anchor, filling up from the bottom as the pictures arrive: one shape (ring, shank, stock, arms, flukes) used three
		// times — grown a little in blue for the outline, in blush underneath, and as the mask the coral wave rises inside
		const el = stage(`
			<svg class="loader__heart loader__anchor" viewBox="-10 -8 120 116" aria-hidden="true">
				<defs>
					<g id="anchor" transform="rotate(-10 50 52)" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="50" cy="13" r="8.5" fill="none" stroke-width="7"/>
						<path d="M50 22V90" stroke-width="10"/>
						<path d="M28 34H72" stroke-width="7"/>
						<circle cx="26" cy="34" r="6.5"/><circle cx="74" cy="34" r="6.5"/>
						<path d="M17 62Q22 88 50 92Q78 88 83 62" fill="none" stroke-width="10"/>
						<path d="M7 68L15 47L28 64Z" stroke-width="3"/><path d="M93 68L85 47L72 64Z" stroke-width="3"/>
					</g>
					<mask id="anchor-mask" maskUnits="userSpaceOnUse" x="-10" y="-8" width="120" height="116"><use href="#anchor" fill="#fff" stroke="#fff"/></mask>
					<filter id="anchor-line" x="-10%" y="-10%" width="120%" height="120%"><feMorphology operator="dilate" radius="2.6"/></filter>
				</defs>
				<use href="#anchor" fill="#0E6990" stroke="#0E6990" filter="url(#anchor-line)"/>
				<use href="#anchor" fill="#fde3e0" stroke="#fde3e0"/>
				<g mask="url(#anchor-mask)"><g id="loader-fill"><path class="loader__wave" d="M-100 104 Q-75 98 -50 104 T0 104 T50 104 T100 104 T150 104 T200 104 V220 H-100Z" fill="#F2726F"/></g></g>
			</svg>
			<p class="loader__text">${App.lang === 'ar' ? esc(label) : [...label].map((c, n) => `<span style="--i:${n};--r:${(n % 2 ? 1 : -1) * 8}deg">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</p>
			<p class="loader__pct" id="loader-pct">0%</p>`, 'loader');
		const fill = $('#loader-fill', el);
		const pct = $('#loader-pct', el);
		const set = (p) => { fill.style.transform = `translateY(${-p * 110}px)`; pct.textContent = Math.round(p * 100) + '%'; };
		set(0);
		const images = (story.$media || []).filter((r) => /^image\//.test(mimeOf(r)));
		let done = 0;
		const started = performance.now();
		const queue = [...images];
		await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
			while (queue.length) {
				try { await mediaURL(queue.shift()); } catch { /* shown as missing later */ }
				set((++done / Math.max(images.length, 1)) * 0.95);
			}
		}));
		set(1);
		await sleep(Math.max(0, 1500 - (performance.now() - started)));
		await leaveStage();
	}

	const night = intro && story.intro?.length;
	if (night) await runIntro(story);
	store.set(SEEN_INTRO, '1');
	// straight after the intro (or the loader) the site lands instead of just appearing: see land()
	const dusk = (night || loader) && !REDUCE ? landDusk(night) : null;
	await leaveStage();
	if (night || loader) document.body.classList.add('just-in');
	renderChrome();
	await renderPage();
	if (dusk) land(dusk);
	if (qs('intro') !== null) history.replaceState(null, '', location.pathname + location.hash);
	wireLinks();
}
/* The landing. A layer the colour of what we're leaving (the intro's night sky, or the paper after the loader) waits
   under the fading stage; once the page is drawn beneath it, it opens in a widening circle from the middle while the
   home builds itself up (CSS under body.just-in: the title comes into focus, the ribbon unrolls, the names slide in to
   the heart, the occasion drops in, the header slides down), and the heart in the ribbon sends out a little burst. */
function landDusk(night) {
	const d = document.createElement('div');
	d.className = 'dusk' + (night ? '' : ' dusk--day');
	d.setAttribute('aria-hidden', 'true');
	document.body.append(d);
	return d;
}
function land(dusk) {
	requestAnimationFrame(() => dusk.classList.add('go'));
	dusk.addEventListener('animationend', () => dusk.remove(), { once: true });
	setTimeout(() => dusk.remove(), 2500);
	const heart = $('.hero .ribbon .heart');
	if (heart) setTimeout(() => {
		const b = heart.getBoundingClientRect();
		const burst = document.createElement('div');
		burst.className = 'burst';
		burst.setAttribute('aria-hidden', 'true');
		burst.style.cssText = `left:${b.left + b.width / 2}px;top:${b.top + b.height / 2}px`;
		burst.innerHTML = Array.from({ length: 14 }, (_, k) => {
			const a = (k / 14) * Math.PI * 2 + rand(-0.2, 0.2), r = rand(60, 130);
			return `<i style="--x:${(Math.cos(a) * r).toFixed(0)}px;--y:${(Math.sin(a) * r).toFixed(0)}px;--s:${rand(0.6, 1.3)};--d:${rand(0, 0.15)}s">${k % 3 ? '♥' : '✦'}</i>`;
		}).join('');
		document.body.append(burst);
		setTimeout(() => burst.remove(), 1600);
	}, 1650);
	// only this once: a language switch or the next page shouldn't play it again
	setTimeout(() => document.body.classList.remove('just-in'), 3600);
}

/* A heart made of stars, in the colour of the intro's star dust: dots along the outline and scattered inside,
   each twinkling on its own. Points inside satisfy (x² + y² − 1)³ − x²y³ ≤ 0, the classic heart curve. */
function starHeart() {
	const pts = [];
	for (let k = 0; k < 34; k++) {
		const a = (k / 34) * Math.PI * 2;
		pts.push([16 * Math.sin(a) ** 3, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]);
	}
	for (let tries = 0; pts.length < 90 && tries < 4000; tries++) {
		const x = Math.random() * 2.4 - 1.2, y = Math.random() * 2.6 - 1.4;
		if ((x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0) pts.push([x * 14, -y * 14 + 1]);
	}
	return `<svg viewBox="-19 -19 38 36" aria-hidden="true">${pts.map(([x, y], k) =>
		`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(k < 34 ? 0.95 : 0.4 + Math.random() * 0.7).toFixed(2)}" style="--d:${(Math.random() * 2.4).toFixed(2)}s"/>`).join('')}</svg>`;
}

async function runIntro(story) {
	let skipped = false;
	let onSkip;
	const skipP = new Promise((r) => (onSkip = r));
	const pause = (ms) => Promise.race([sleep(ms), skipP]);
	/* a starry night over a hill where the four of us sit; each sentence is spelt out in golden dust,
	   which then scatters and re-forms into the next (after codepen.io/CCG/pen/aZpVVv) */
	const P = (cx, cy, rx, ry, rot, seed) => `<path d="${pebble(cx, cy, rx, ry, rot, seed)}"/>`;
	const el = stage(`
		<canvas class="intro__sky" aria-hidden="true"></canvas>
		${nightScene(`<g transform="translate(800 249) scale(.6) translate(-323 -349)">${P(238, 296, 39, 53, -8, 3)}${P(255, 213, 22, 25, 12, 5)}${P(318, 298, 34, 49, 4, 11)}${P(301, 232, 21, 21, 0, 13)}${P(380, 310, 26, 31, 6, 17)}${P(357, 266, 15, 15, 0, 19)}${P(432, 322, 16, 21, 4, 23)}${P(429, 292, 11, 11, 0, 29)}</g>`)}
		<button class="intro__skip link" type="button">${L('تخطي ←', 'Skip →')}</button>
		<canvas class="intro__dust" aria-hidden="true"></canvas>
		<p class="intro__lines" aria-live="polite"></p>
		<div class="intro__end"></div>`, 'intro');
	$('.intro__skip', el).onclick = () => { skipped = true; onSkip(); };
	const lines = $('.intro__lines', el);
	sky($('.intro__sky', el));
	const sand = REDUCE ? null : dust($('.intro__dust', el), { font: getComputedStyle(document.documentElement).getPropertyValue('--f-script').trim() || 'serif' });
	if (sand) lines.classList.add('sr-only');

	for (const line of story.intro) {
		if (skipped) break;
		const text = t(line);
		lines.textContent = text;
		if (sand) await sand.show(text);
		await pause(Math.min(4600, 2200 + text.length * 45));
	}
	if (sand) { sand.scatter(); await pause(900); sand.stop(); }
	lines.textContent = '';

	// "Our Love Story" — unless today is one of our days, then that
	const today = occasions(story).find((o) => o.days === 0);
	const words = (today ? today.title : L('حكاية حبنا', 'Our Love Story')).split(' ');
	const [first, ...rest] = words;
	$('.intro__dust', el).remove();
	$('.intro__skip', el).remove();
	$('.intro__end', el).innerHTML = `
		<div class="intro__final">
			<div class="names"><span class="n1">${T(story.him)}</span><span class="heart heart--stars" aria-label="♥">${starHeart()}</span><span class="n2">${T(story.her)}</span></div>
			<h1 class="pop"><span>${esc(first)}</span>${rest.length ? `<span class="pop__word"><span>${esc(rest.join(' '))}</span></span>` : ''}</h1>
			<p class="sub">${today ? esc(today.sub) : T(story.closing)}</p>
		</div>`;
	// no button: once the names and the title have had their moment (their animations end near 3.4s), the site
	// opens by itself; a tap anywhere goes in sooner
	await new Promise((r) => {
		setTimeout(r, skipped ? 3500 : 5500);
		el.addEventListener('click', r, { once: true });
	});
}

/* ------------------------------------------------------------------ pages, menus */

/* Every page of the site, in the order of the phone menu and the footer. */
export const PAGES = [
	{ href: 'index.html', id: 'home', ic: 'home', ar: 'الرئيسية', en: 'Home' },
	{ href: 'story.html', id: 'story', ic: 'book', ar: 'حكايتنا', en: 'Our story', dar: 'كل تاريخ عملنا إحنا', den: 'Every date that made us', group: 'story' },
	{ href: 'chapters.html', id: 'chapters', ic: 'ring', ar: 'أيام فارقة', en: 'Big days', dar: 'الخطوبة، كتب الكتاب، الفرح', den: 'Engagement, wedding and more', group: 'story' },
	{ href: 'places.html', id: 'places', ic: 'pin', ar: 'أماكننا', en: 'Our places', dar: 'أماكن فيها حتة مننا', den: 'Places that hold a piece of us', group: 'story' },
	{ href: 'anniversaries.html', id: 'anniversaries', ic: 'ring', ar: 'عيد جوازنا', en: 'Our anniversaries', dar: 'رحلة كل سنة على الخريطة، وكل سنة جواز عملنا فيها إيه', den: 'A trip every year on the map, and how we marked each one', group: 'story' },
	{ href: 'journeys.html', id: 'journeys', ic: 'map', ar: 'رحلاتنا', en: 'Our trips', dar: 'كل رحلة طريق على الخريطة، محطة ورا محطة', den: 'Every trip a road on the map, stop by stop', group: 'story' },
	{ href: 'cities.html', id: 'cities', ic: 'city', ar: 'خرايط مدننا', en: 'Our city maps', dar: 'كل مدينة رحناها، وأماكننا منورة فيها', den: 'Every city we’ve been to, our spots lit up', group: 'story' },
	{ href: 'journal.html', id: 'journal', ic: 'pen', ar: 'دفترنا', en: 'Our journal', dar: 'بنكتب حكايتنا سوا، يوم بيوم', den: 'We write our story together, day by day', group: 'story' },
	{ href: 'ourfirsts.html', id: 'ourfirsts', ic: 'heart', ar: 'أول مرة لينا', en: 'Our firsts', dar: 'أول مقابلة، أول «بحبك»، أول رحلة', den: 'First meeting, first “I love you”, first trip', group: 'story' },
	{ href: 'beforeus.html', id: 'beforeus', ic: 'route', ar: 'قبل ما نتقابل', en: 'Before us', dar: 'حياتنا الاتنين جنب بعض لحد ٢٠٠٩', den: 'Our two lives side by side until 2009', group: 'story' },
	{ href: 'minute.html', id: 'minute', ic: 'film', ar: 'الحكاية في دقيقة', en: 'Our story in a minute', dar: 'كل ذكرى بصورة، ورا بعض', den: 'Every memory, one photo after another', group: 'story' },
	{ href: 'draw.html', id: 'draw', ic: 'dice', ar: 'قرعة الليلة', en: 'Tonight’s draw', dar: 'لبس، خروجة، دليفري، فيلم، لعبة، وأكتر', den: 'Outfit, dinner, delivery, a film, a game, and more', group: 'nights' },
	{ href: 'movies.html', id: 'movies', ic: 'film', ar: 'اتفرجنا على إيه', en: 'What we’ve watched', dar: 'أفلامنا ومسلسلاتنا بالأرقام', den: 'Our films and series, in numbers', group: 'nights' },
	{ href: 'music.html', id: 'music', ic: 'music', ar: 'أغانينا', en: 'Our songs', dar: 'الأغاني اللي بتفكرنا ببعض', den: 'The songs that remind us of each other', group: 'nights' },
	{ href: 'food.html', id: 'food', ic: 'food', ar: 'أكلنا', en: 'Our food', dar: 'مطاعمنا والمنيو بتاع كل واحد، واللي بنطبخه في البيت', den: 'Our restaurants and their menus, and what we cook at home', group: 'nights' },
	{ href: 'books.html', id: 'books', ic: 'book', ar: 'كتبنا', en: 'Our books', dar: 'اللي بنقراه، واللي خلصناه', den: 'What we’re reading, and what we’ve finished', group: 'nights' },
	{ href: 'games.html', id: 'games', ic: 'dice', ar: 'ألعابنا', en: 'Our games', dar: 'كوتشينة ودومينو… ومين بيكسب', den: 'Cards, dominoes… who’s winning', group: 'nights' },
	{ href: 'adventures.html', id: 'adventures', ic: 'star', ar: 'أحلامنا ومغامراتنا', en: 'Our bucket list', dar: 'حاجات نفسنا نعملها سوا، في مصر وبرّاها', den: 'Things we want to do together, in Egypt and beyond', group: 'nights' },
	{ href: 'offline.html', id: 'offline', ic: 'moon', ar: 'سهرة من غير موبايل', en: 'Offline nights', dar: 'كروت أسئلة، والموبايلات في السلة', den: 'Question cards, phones in the basket', group: 'nights' },
	{ href: 'secret.html', id: 'secret', ic: 'heart', ar: 'أوضتنا', en: 'Our room', dar: 'لينا إحنا الاتنين بس — بالرقم السري', den: 'Just for the two of us — behind a PIN', group: 'nights' },
	{ href: 'gallery.html', id: 'gallery', ic: 'image', ar: 'ألبوم الصور', en: 'Photo album', dar: 'إحنا بالصور، سنة بسنة', den: 'Us in pictures, year by year', group: 'memories' },
	{ href: 'notes.html', id: 'notes', ic: 'note', ar: 'رسايل حب', en: 'Love notes', dar: 'كلام كتبناه لبعض', den: 'Little things we wrote', group: 'memories' },
	{ href: 'letters.html', id: 'letters', ic: 'mail', ar: 'جوابات', en: 'Letters', dar: 'جوابات لبعض، مستنية تتفتح', den: 'Letters for you — open them', group: 'memories' },
	{ href: 'guestbook.html', id: 'guestbook', ic: 'mail', ar: 'دفتر المعازيم', en: 'Wedding guestbook', dar: 'اللي كتبه حبايبنا يوم فرحنا', den: 'What our loved ones wrote for our wedding', group: 'memories' },
	{ href: 'posts.html', id: 'posts', ic: 'phone', ar: 'بوستاتنا', en: 'Our posts', dar: 'اللي كتبناه لبعض على السوشيال ميديا', den: 'What we posted about each other', group: 'memories' },
	{ href: 'tickets.html', id: 'tickets', ic: 'film', ar: 'تذاكر وفواتير', en: 'Tickets & receipts', dar: 'كشكول كل تذكرة وفاتورة احتفظنا بيها', den: 'A scrapbook of every ticket we kept', group: 'memories' },
	{ href: 'onthisday.html', id: 'onthisday', ic: 'calendar', ar: 'سنة من الذكريات', en: 'A year of memories', dar: 'كل يوم في السنة وحصل فيه إيه', den: 'Every date and what it held', group: 'memories' },
	{ href: 'remember.html', id: 'remember', ic: 'dice', ar: 'فاكر؟', en: 'Do you remember?', dar: 'لعبة من صورنا وحكايتنا: مين فاكر أكتر؟', den: 'A game made of our photos: who remembers more?', group: 'memories' },
	{ href: 'chats.html', id: 'chats', ic: 'chat', ar: 'محادثاتنا', en: 'Our chats', dar: 'أحلى رسايلنا باسكرينشوت', den: 'Our best messages, screenshotted', group: 'memories' },
	{ href: 'family.html', id: 'family', ic: 'family', ar: 'عيلتنا', en: 'Our family', dar: 'جريدتنا وشجرة العيلة', den: 'Our paper and family tree', group: 'family' },
	{ href: 'distances.html', id: 'distances', ic: 'route', ar: 'المسافات', en: 'Miles apart', dar: 'إحنا الأربعة بعاد قد إيه', den: 'How far apart we are', group: 'family' },
	{ href: 'goals.html', id: 'goals', ic: 'flag', ar: 'أهدافنا', en: 'Our goals', dar: 'اللي نفسنا فيه، ونشطبه', den: 'What we want, crossed out', group: 'family' },
	{ href: 'chores.html', id: 'chores', ic: 'chores', ar: 'مين بيعمل إيه', en: 'Who does what', dar: 'شغل البيت بالدور', den: 'House jobs in turns', group: 'family' },
	{ href: 'favorites.html', id: 'favorites', ic: 'star', ar: 'بيحب إيه دلوقتي', en: 'What they love now', dar: 'بيحبوا إيه في كل سن', den: 'What they love at each age', group: 'family' },
	{ href: 'drawings.html', id: 'drawings', ic: 'image', ar: 'رسوماتنا', en: 'Our drawings', dar: 'كل رسمة رسمناها', den: 'Every drawing we made', group: 'family' },
	{ href: 'growth.html', id: 'growth', ic: 'chart', ar: 'طول الولاد', en: 'Growth chart', dar: 'الطول والوزن', den: 'Height and weight', group: 'family' },
	{ href: 'sayings.html', id: 'sayings', ic: 'chat', ar: 'كلام الولاد', en: 'What the boys said', dar: 'قاموس كلامهم', den: 'Their own dictionary', group: 'family' },
	{ href: 'shopping.html', id: 'shopping', ic: 'food', ar: 'طلبات البيت', en: 'Shopping list', dar: 'اللي ناقص في البيت', den: 'What the house needs', group: 'family' },
	{ href: 'routine.html', id: 'routine', ic: 'hourglass', ar: 'روتيننا', en: 'Our routine', dar: 'يوم العيلة، وروتين كل واحد', den: 'The family’s day, and each one’s', group: 'family' },
	{ href: 'fixes.html', id: 'fixes', ic: 'gear', ar: 'تصليحات البيت', en: 'House fixes', dar: 'اللي محتاج يتصلح أو يتعمل', den: 'What needs fixing or doing', group: 'family' },
	{ href: 'expenses.html', id: 'expenses', ic: 'chart', ar: 'مصاريف الشهر', en: 'Monthly expenses', dar: 'الثابت والمتغير، دفعنا إيه وفاضل إيه', den: 'Fixed and variable — paid and left', group: 'family' },
	{ href: 'debts.html', id: 'debts', ic: 'coins', ar: 'ديوننا', en: 'Our debts', dar: 'اللي علينا واللي لينا، قسط بقسط', den: 'What we owe and are owed, payment by payment', group: 'family' },
	{ href: 'people.html', id: 'people', ic: 'family', ar: 'ناسنا', en: 'Our people', dar: 'القرايب والصحاب والجيران، وكل يوم حد نسأل عليه', den: 'Relatives, friends, neighbours — one to reach each day', group: 'family' },
	{ href: 'nokta.html', id: 'nokta', ic: 'coins', ar: 'النقطة', en: 'The nokta', dar: 'مين نقّطنا وردّيناها', den: 'Who gave, and what we gave back', group: 'family' },
	{ href: 'health.html', id: 'health', ic: 'note', ar: 'دفتر صحتنا', en: 'Our health book', dar: 'تطعيمات ودكاترة وأدوية', den: 'Jabs, doctors and medicines', group: 'family' },
	{ href: 'birthday.html', id: 'birthday', ic: 'cake', ar: 'أعياد الميلاد', en: 'Birthdays', dar: 'عيد ميلاد كل واحد فينا', den: 'Every one of our birthdays', group: 'you' },
	{ href: 'numbers.html', id: 'numbers', ic: 'chart', ar: 'إحنا بالأرقام', en: 'Us in numbers', dar: 'كل يوم وكل سنة، متعدّين واحد واحد', den: 'Every day and every year, counted', group: 'you' },
	{ href: 'wishes.html', id: 'wishes', ic: 'star', ar: 'برطمان الأمنيات', en: 'Wish jar', dar: 'أمنياتنا في أمان هنا', den: 'Our wishes, kept safe', group: 'you' },
	{ href: 'calendar.html', id: 'calendar', ic: 'calendar', ar: 'تقويمنا', en: 'Our calendar', dar: 'كل مناسباتنا في سنة واحدة', den: 'All our occasions in one year', group: 'you' },
	{ href: 'yearly.html', id: 'yearly', ic: 'image', ar: 'صورة كل سنة', en: 'A photo every year', dar: 'نفس الصورة، سنة ورا سنة', den: 'The same photo, year after year', group: 'you' },
	{ href: 'ramadan.html', id: 'ramadan', ic: 'moon', ar: 'رمضان والعيد', en: 'Ramadan & Eid', dar: 'العد التنازلي، وعاداتنا، والعيدية', den: 'Countdowns, our traditions, and the Eid money', group: 'you' },
	{ href: 'firsts.html', id: 'firsts', ic: 'steps', ar: 'أول مرة', en: 'Firsts', dar: 'أول خطوة، أول كلمة', den: 'First step, first word', group: 'you' },
	{ href: 'gifts.html', id: 'gifts', ic: 'gift', ar: 'هدايانا', en: 'Our gifts', dar: 'كل هدية، ومين جابها — واللي نفسنا فيه', den: 'Every gift, who gave it — and what we’d love', group: 'you' },
	{ href: 'capsule.html', id: 'capsule', ic: 'hourglass', ar: 'كبسولة زمنية للولاد', en: 'The boys’ time capsule', dar: 'جوابات بتستنى لحد ما يكبروا', den: 'Letters waiting for them to grow up', group: 'you' },
	{ href: 'hosting.html', id: 'hosting', ic: 'home', ar: 'عزايمنا', en: 'Hosting & visits', dar: 'مين جالنا، ورحنا لمين', den: 'Who came over, and who we visited', group: 'you' },
	{ href: 'search.html', id: 'search', ic: 'search', ar: 'دوّر', en: 'Search', dar: 'دوّر في كل حاجة كتبناها', den: 'Look through everything we’ve written', group: 'app' },
	{ href: 'settings.html', id: 'settings', ic: 'gear', ar: 'الإعدادات', en: 'Settings', dar: 'مين ماسك الموبايل، وإزاي الجديد يتبعت', den: 'Whose phone, and sharing what’s new', group: 'app' }
];

/* What a night can be drawn for (draw.html?k=…). */
export const DRAW_KINDS = [
	{ id: 'nightin', emoji: 'house', color: '#c2185b', ar: 'سهرة في البيت', en: 'A night in', dar: 'نعمل إيه سوا في البيت الليلة؟', den: 'What shall we do together at home tonight?', sketch: { ar: 'رسمة السهرة', en: 'Sketch the night' } },
	{ id: 'dining', emoji: 'dinner', color: '#e39b2d', ar: 'خروجة عشا', en: 'Dining out', dar: 'نتعشى برا فين؟', den: 'Where shall we eat out?', sketch: { ar: 'رسمة المكان', en: 'Sketch the place' } },
	{ id: 'delivery', emoji: 'scooter', color: '#5a9e6f', ar: 'دليفري', en: 'Delivery night', dar: 'نطلب إيه النهارده؟', den: 'What shall we order in?', sketch: { ar: 'رسمة الأكلة', en: 'Sketch the meal' } },
	{ id: 'movie', emoji: 'clapper', color: '#0e6990', ar: 'سهرة فيلم', en: 'Movie night', dar: 'هنتفرج على إيه؟', den: 'What are we watching?', sketch: { ar: 'رسمة بوستر الفيلم', en: 'Sketch the poster' } },
	{ id: 'game', emoji: 'dice', color: '#8e5bd1', ar: 'سهرة ألعاب', en: 'Game night', dar: 'هنلعب إيه الليلة؟', den: 'What are we playing tonight?', sketch: { ar: 'رسمة الماتش', en: 'Sketch the game' } },
	{ id: 'sweet', emoji: 'cake', color: '#f2726f', ar: 'حاجة حلوة', en: 'Something sweet', dar: 'نحلّي بإيه؟', den: 'What’s for dessert?', sketch: { ar: 'رسمة الحلو', en: 'Sketch the dessert' } },
	{ id: 'outing', emoji: 'walk', color: '#13789f', ar: 'خروجة يوم إجازة', en: 'A day out', dar: 'نروح فين يوم الإجازة؟', den: 'Where to on our day off?', sketch: { ar: 'رسمة المكان', en: 'Sketch the place' } },
	{ id: 'kids', emoji: 'family', color: '#5a9e6f', ar: 'نشاط مع الولاد', en: 'With the boys', dar: 'نعمل إيه مع فهد وعبد الرحمن؟', den: 'What shall we do with Fahd and Abdulrahman?', sketch: { ar: 'رسمة النشاط', en: 'Sketch it' } }
];
/* pages that are one page per item, and which menu they belong to */
const DETAIL_OF = { moment: 'story', chapter: 'story', member: 'family', trip: 'story', journey: 'journeys' };

const ICONS = {
	home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
	book: '<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/>',
	ring: '<circle cx="12" cy="14" r="6"/><path d="m9.5 8-2-3h9l-2 3"/>',
	coins: '<ellipse cx="12" cy="7" rx="7" ry="2.5"/><path d="M5 7v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7M5 11v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 15v2.5C5 18.9 8.1 20 12 20s7-1.1 7-2.5V15"/>',
	pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.3"/>',
	image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>',
	note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 12.5h5"/>',
	mail: '<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="m4 7 8 6 8-6"/>',
	family: '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><circle cx="12" cy="13" r="1.8"/><path d="M3.5 20v-3.5A4 4 0 0 1 7.5 12.5h1M20.5 20v-3.5a4 4 0 0 0-4-4h-1M9 20v-1.5a3 3 0 0 1 6 0V20"/>',
	cake: '<path d="M4 20h16v-7H4zM4 15.5c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0"/><path d="M8 13V10M12 13V10M16 13V10"/><path d="M8 7.5c.6-.6.6-1.4 0-2.5-.6 1.1-.6 1.9 0 2.5ZM12 7.5c.6-.6.6-1.4 0-2.5-.6 1.1-.6 1.9 0 2.5ZM16 7.5c.6-.6.6-1.4 0-2.5-.6 1.1-.6 1.9 0 2.5Z"/>',
	chat: '<path d="M4 5h16v11h-9l-5 4v-4H4Z"/><path d="M10.3 9.2a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1M12 13.8h.01"/>',
	chores: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9ZM8.5 11l1.5 1.5 3-3M8.5 16.5l1.5 1.5 3-3M15 11.5h1M15 17h1"/>',
	calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13.5h2M14 13.5h2M8 17h2"/>',
	moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/><path d="m17 4 .5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5Z"/>',
	gift: '<rect x="4" y="9.5" width="16" height="11" rx="1"/><path d="M3 9.5h18M12 9.5v11M12 9.5c-2-4.5-6.5-4.5-6.5-2S9.5 9.5 12 9.5Zm0 0c2-4.5 6.5-4.5 6.5-2S14.5 9.5 12 9.5Z"/>',
	hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 5 9 6 9 8.5s-9 3.5-9 8.5M16.5 3.5c0 5-9 6-9 8.5s9 3.5 9 8.5"/>',
	steps: '<path d="M8 4.5c1.6 0 2.5 1.8 2.5 4s-1 4-2.5 4-2.5-1.8-2.5-4 .9-4 2.5-4ZM16 9.5c1.6 0 2.5 1.8 2.5 4s-1 4-2.5 4-2.5-1.8-2.5-4 .9-4 2.5-4Z"/><path d="M7 15.5h2.5v2.5c0 .8-.6 1.5-1.3 1.5S7 18.8 7 18ZM15 20.5h2.5"/>',
	chart: '<path d="M4 20.5h16"/><path d="M6.5 20.5v-6h3v6M10.5 20.5V9h3v11.5M14.5 20.5v-8.5h3v8.5"/><path d="M5 9.5 9 6l3.5 2L19 3.5"/>',
	star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
	map: '<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
	film: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M3.5 15h17M8 5v4M12 5v4M16 5v4M8 15v4M12 15v4M16 15v4"/>',
	pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3M4 20h6"/>',
	music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9l11-2"/>',
	dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/>',
	gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
	heart: '<path d="M12 20C6 16 3.5 12.7 3.5 9.5A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.5 2.3C20.5 12.7 18 16 12 20Z"/>',
	city: '<path d="M3.5 20.5h17M5 20.5V10l4-2v12.5M9 20.5V5l6 2.5v13M15 20.5V11l4 1.5v8"/><path d="M11.5 10h1M11.5 13h1M11.5 16h1"/>',
	route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 17.2c4-1.5 2.5-5 6-6.5s3-2.2 3-3"/>',
	flag: '<path d="M5.5 21V4M5.5 4.5h11l-2.5 4 2.5 4h-11"/>',
	food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1.5-3 4-3 7 0 2 1 3 3 3"/>',
	phone: '<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 18h3"/><path d="M12 13.2c-2-1.3-3-2.4-3-3.6a1.5 1.5 0 0 1 3-.4 1.5 1.5 0 0 1 3 .4c0 1.2-1 2.3-3 3.6Z"/>',
	search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/><path d="M8 9.2a2.6 2.6 0 0 1 2.4-1.6"/>',
	baby: '<circle cx="12" cy="11" r="6.5"/><circle cx="9.8" cy="10.5" r=".8"/><circle cx="14.2" cy="10.5" r=".8"/><path d="M10 13.6c1.2 1 2.8 1 4 0M12 4.5c1-1 2.2-.8 2.6 0"/>'
};
export const icon = (k, size = 18) => `<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.heart}</svg></span>`;

const currentFile = () => location.pathname.split('/').pop() || 'index.html';
const pageId = () => document.body.dataset.page || 'home';
const groupOf = (id) => DETAIL_OF[id] || PAGES.find((p) => p.id === id)?.group || '';

function megaHTML(s) {
	const here = currentFile();
	const up = DETAIL_OF[pageId()] ? `${DETAIL_OF[pageId()]}.html` : '';
	const cur = (href) => (href === here || href === up ? ' aria-current="page"' : '');
	const item = (p) => `<a class="mg-item" href="${p.href}"${cur(p.href)}>${icon(p.ic)}<span class="mg-tx"><b>${esc(L(p.ar, p.en))}</b>${p.dar ? `<small>${esc(L(p.dar, p.den))}</small>` : ''}</span></a>`;
	const row = (p) => `<a class="mg-row" href="${p.href}"${cur(p.href)}>${icon(p.ic)}<span class="mg-tx"><b>${esc(L(p.ar, p.en))}</b>${p.dar ? `<small>${esc(L(p.dar, p.den))}</small>` : ''}</span><span class="mg-arr" aria-hidden="true">${App.arrow}</span></a>`;
	const panel = (id, label, inner) => `<div class="mega mega-${id}" id="mega-${id}" role="group" aria-label="${esc(label)}"><div class="mega-in">${inner}</div></div>`;
	const top = (id, label) => `<button class="mnav-btn${groupOf(pageId()) === id ? ' is-here' : ''}" type="button" aria-expanded="false" aria-controls="mega-${id}" data-mega="${id}">${esc(label)}<svg class="mnav-chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
	const pages = (g) => PAGES.filter((p) => p.group === g);

	// حكايتنا — the big days as photo cards, then the story pages, then "on this day".
	const chapters = (s.chapters || []).slice(0, 3);
	// today's moment: one with a photo when several fell on this date
	const todays = (s.timeline || []).filter((x) => !x.when && isToday(x.date));
	const today = todays.find((x) => firstPhoto(x)) || todays[0];
	const todayPhoto = today && firstPhoto(today);
	const story = panel('story', L('حكايتنا', 'Our story'),
		`<div class="mg-cards">${chapters.map((c) => `
			<a class="mg-card" href="chapter.html?id=${esc(c.id)}" data-media-box>
				${img(firstPhoto(c), '', 'mg-cover')}
				<span class="mg-card-t"><b>${T(c.title)}</b><small>${fmtDate(c.date)}</small></span>
			</a>`).join('')}</div>
		<div class="mg-more"><p class="mg-h">${L('الحكاية', 'The story')}</p>${pages('story').map(row).join('')}</div>
		<a class="mg-band${todayPhoto ? ' has-photo' : ''}" href="${today ? `moment.html?id=${esc(today.id)}` : 'story.html'}">
			${todayPhoto ? `<span class="mg-band-pic" data-media-box>${img(todayPhoto, '', 'mg-band-img')}</span>` : ''}
			<b>${today ? L('النهارده في حكايتنا', 'Today in our story') : L('من أول رسالة لحد النهارده', 'From the first message until today')}</b>
			<small>${today ? `${T(today.title)} · ${yearsAgo(today.date)}` : `${fmtDate(s.met)} — ${L('ولسه مكملين', 'and still going')}`} ${App.arrow}</small>
		</a>`);

	// ذكرياتنا — حكايتنا in a mirror: the memory pages on the other side, three taped polaroids tilting the other way
	// (a photo from the album, a love note, the wedding guestbook), and instead of a band, a strip of film with five
	// moments from our story. The photo, the note and the five frames change every time it opens.
	const gb = s.guestbook;
	const memories = panel('memories', L('ذكرياتنا', 'Memories'),
		`<div class="mg-cards">
			<a class="mg-card" href="gallery.html" id="mg-album">${albumHTML(s)}</a>
			<a class="mg-card mg-card--note" href="notes.html">
				<span class="mg-note" id="mg-note">${noteHTML(s)}</span>
				<span class="mg-card-t"><b>${L('رسايل حب', 'Love notes')}</b><small>${num((s.notes || []).length)} ${L('رسالة', 'notes')}</small></span>
			</a>
			${gb?.entries?.length ? `<a class="mg-card" href="guestbook.html" data-media-box>
				${img(gb.photo, '', 'mg-cover')}
				<span class="mg-card-t"><b>${L('دفتر المعازيم', 'Guestbook')}</b><small>${num(gb.entries.length)} ${L('تهنئة', 'wishes')}</small></span>
			</a>` : `<a class="mg-card mg-card--note" href="letters.html"><span class="mg-note"><q>${L('جوابات مستنية تتفتح', 'Letters waiting to be opened')}</q></span><span class="mg-card-t"><b>${L('جوابات', 'Letters')}</b><small>${num((s.letters || []).length)}</small></span></a>`}
			<a class="mg-card mg-card--ticket" href="tickets.html">
				<span class="mg-ticket" aria-hidden="true"><small>${L('تذكرة دخول', 'Admit one')}</small><b>♥</b><small>${L('سينما · قطر · كافيه', 'Cinema · train · café')}</small></span>
				<span class="mg-card-t"><b>${L('تذاكر وفواتير', 'Tickets')}</b><small>${L('كشكول ذكرياتنا', 'Our scrapbook')}</small></span>
			</a>
		</div>
		<div class="mg-more"><p class="mg-h">${L('ذكرياتنا', 'Our memories')}</p>${pages('memories').map(row).join('')}</div>
		<div class="mg-film"><p class="mg-film-h">${L('ذكريات من حكايتنا', 'Moments from our story')}</p><div class="mg-film-strip" id="mg-film">${filmHTML(s)}</div></div>`);

	// عيلتنا — one card per person.
	const members = s.family?.members || [];
	const family = panel('family', L('عيلتنا', 'Our family'),
		`<div class="mg-figs">${members.map((m) => `
			<a class="mg-fig" href="member.html?id=${esc(m.id)}" style="--c:${esc(m.color || '#0e6990')}"${here === 'member.html' && qs('id') === m.id ? ' aria-current="page"' : ''}>
				<span class="mg-fig-box">${m.photo ? img(m.photo, '', 'mg-fig-img') : `<span class="mg-fig-emoji">${doodle(m.emoji, 40)}</span>`}</span>
				<span class="mg-fig-t"><b>${T(m.name)}</b><small>${m.born && m.kid ? age(m.born) : T(m.role)}</small></span>
			</a>`).join('')}</div>
		<div class="mg-more"><p class="mg-h">${L('البيت', 'Home')}</p>${pages('family').map(row).join('')}</div>
		${tapeHTML(members)}`);

	// لِكِ — birthday, wishes, and us in numbers.
	const met = parseDate(s.met || '2009-06-10');
	const yrs = yearsBetween(met);
	const you = panel('you', L('مناسباتنا', 'Occasions'),
		`<div class="mg-list"><p class="mg-h">${L('مناسباتنا', 'Our occasions')}</p>${pages('you').map(item).join('')}</div>
		<a class="mg-data" href="numbers.html"${cur('numbers.html')}>
			<span class="mg-new">${L('بالأرقام', 'In numbers')}</span>
			<span class="mg-bars" aria-hidden="true">${Array.from({ length: Math.min(yrs + 1, 20) }, (_, k) => `<i style="height:${18 + Math.round(82 * (k + 1) / Math.min(yrs + 1, 20))}%"></i>`).join('')}</span>
			<b>${num(daysBetween(met))} ${L('يوم من أول سلام', 'days since hello')}</b>
			<small>${L('وكل سنة الحب بيزيد', 'and every year it grows')}</small>
			<span class="mg-go">${Y('شوف الأرقام', 'شوفي الأرقام', 'See the numbers')} ${App.arrow}</span>
		</a>
		${calendarHTML(s)}
		${nextTagsHTML(s)}`);

	// ليالينا — the four draws as coloured cards, then the songs and the rest of the evenings.
	const kind = qs('k');
	const nights = panel('nights', L('ليالينا', 'Our nights'),
		`<div class="mg-kinds">${DRAW_KINDS.map((k) => `
			<a class="mg-kind" href="draw.html?k=${k.id}" style="--c:${k.color}"${here === 'draw.html' && kind === k.id ? ' aria-current="page"' : ''}>
				<span class="mg-kind-e" aria-hidden="true">${doodle(k.emoji, 40)}</span><b>${esc(L(k.ar, k.en))}</b><small>${esc(L(k.dar, k.den))}</small>
			</a>`).join('')}</div>
		<div class="mg-more"><p class="mg-h">${L('سهراتنا', 'Our evenings')}</p>${pages('nights').map(row).join('')}</div>
		<a class="mg-sky" id="mg-sky" href="draw.html">${skyHTML()}</a>`);

	const link = (href, ar, en) => `<a class="mnav-link" href="${href}"${cur(href)}>${esc(L(ar, en))}</a>`;
	return `<nav class="mnav" aria-label="${L('القائمة الرئيسية', 'Main')}">
		${link('index.html', 'الرئيسية', 'Home')}
		${top('story', L('حكايتنا', 'Our story'))}${top('memories', L('ذكرياتنا', 'Memories'))}${top('family', L('عيلتنا', 'Family'))}${top('nights', L('ليالينا', 'Our nights'))}${top('you', L('مناسباتنا', 'Occasions'))}
		<a class="mnav-link mnav-cta" href="journal.html"${cur('journal.html')}>${doodle('pen', 18)} ${Y('اكتب النهارده', 'اكتبي النهارده', 'Write today')}</a>
		${story}${memories}${family}${nights}${you}
	</nav>`;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* عيلتنا: a tailor's tape with the four of us standing on it at our ages — from the baby near nought to the two of
   us in our thirties — every year a tick, every five a number. Takes you to the growth chart. */
function tapeHTML(members) {
	const now = new Date();
	const ages = members.filter((m) => m.born && parseDate(m.born) <= now)
		.map((m) => ({ m, a: (now - parseDate(m.born)) / (365.2425 * 864e5) })).sort((x, y) => x.a - y.a);
	if (!ages.length) return '';
	const max = Math.max(10, Math.ceil((ages.at(-1).a + 1) / 5) * 5);
	const ticks = Array.from({ length: max + 1 }, (_, i) => `<i class="${i % 5 ? '' : 'is-5'}" style="--p:${(i / max) * 100}%">${i % 5 ? '' : `<b>${num(i)}</b>`}</i>`).join('');
	const pins = ages.map(({ m, a }, i) => `
		<span class="mg-tape-pin ${i % 2 ? 'is-up' : 'is-down'}${a / max > 0.6 ? ' is-end' : ''}" style="--p:${(a / max) * 100}%;--c:${esc(m.color || '#0e6990')}">
			<span class="mg-tape-dot">${doodle(m.emoji, 22)}</span><small><b>${T(m.name)}</b> ${m.kid ? age(m.born, now) : `${num(Math.floor(a))} ${L('سنة', 'yrs')}`}</small>
		</span>`).join('');
	return `<a class="mg-tape" href="growth.html" aria-label="${L('مين كبر قد إيه', 'How much each of us has grown')}">
		<span class="mg-tape-h">${L('مين كبر قد إيه', 'How tall we’ve grown')}</span>
		<span class="mg-tape-track" aria-hidden="true">${ticks}${pins}</span>
	</a>`;
}

/* ليالينا: tonight's sky — the real moon over Egypt tonight, drawn and named, a few stars, and one of the four draws
   suggested for tonight (a different one each time it opens). */
export function moonTonight(now = new Date()) {
	const SYN = 29.530588853, NEW = Date.UTC(2000, 0, 6, 18, 14);
	const days = (((now - NEW) / 864e5) % SYN + SYN) % SYN;
	const f = days / SYN, lit = (1 - Math.cos(2 * Math.PI * f)) / 2;
	// named by how much of it is lit (not by rounding to the nearest of eight): a quarter only when it's about half lit
	const waxing = f < 0.5;
	const name = lit < 0.03 ? ['محاق', 'New moon'] : lit > 0.97 ? ['بدر', 'Full moon']
		: Math.abs(lit - 0.5) < 0.06 ? (waxing ? ['تربيع أول', 'First quarter'] : ['تربيع تاني', 'Last quarter'])
		: lit < 0.5 ? ['هلال', waxing ? 'Waxing crescent' : 'Waning crescent'] : ['أحدب', waxing ? 'Waxing gibbous' : 'Waning gibbous'];
	// in plain words: how much of it is lit, and whether it's growing or shrinking
	const pct = Math.round(lit * 100);
	const how = lit < 0.03 ? L('مش باين الليلة', 'Not visible tonight') : lit > 0.97 ? L('منوّر كله', 'Fully lit')
		: `${L(`منوّر ${num(pct)}٪`, `${pct}% lit`)} · ${waxing ? L('وبيكبر', 'growing') : L('وبيصغر', 'shrinking')}`;
	// the lit part: a half disc on the lit side (right while it grows, left while it wanes) closed by the terminator,
	// an ellipse whose width follows the phase
	const r = 18, k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r;
	const half = waxing ? `M0 ${-r} A${r} ${r} 0 0 1 0 ${r}` : `M0 ${-r} A${r} ${r} 0 0 0 0 ${r}`;
	const term = `A${rx.toFixed(2)} ${r} 0 0 ${waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0)} 0 ${-r}`;
	const svg = `<svg class="mg-moon" viewBox="-22 -22 44 44" aria-hidden="true"><circle r="${r}" class="mg-moon-dark"/>${lit > 0.01 ? `<path d="${half} ${term}Z" class="mg-moon-lit"/>` : ''}<circle r="${r}" class="mg-moon-rim"/></svg>`;
	return { svg, name: L(...name), how };
}
function skyHTML(a) {
	const moon = moonTonight();
	const k = pick(DRAW_KINDS);
	if (a) a.href = `draw.html?k=${k.id}`;
	else queueMicrotask(() => { const el = document.getElementById('mg-sky'); if (el) el.href = `draw.html?k=${k.id}`; });
	const stars = Array.from({ length: 22 }, () => `<i style="--x:${rand(2, 98)}%;--y:${rand(6, 94)}%;--s:${rand(1.5, 3.2)}px;--d:${rand(1.8, 4.5)}s;--delay:-${rand(0, 4)}s"></i>`).join('');
	return `<span class="mg-sky-stars" aria-hidden="true">${stars}</span>
		${moon.svg}
		<span class="mg-sky-tx">
			<span class="mg-sky-h">${L('قمر الليلة', 'Tonight’s moon')}</span>
			<b>${esc(moon.name)}</b>
			<span class="mg-sky-how">${esc(moon.how)}</span>
			<small>${L('ونسهر على إيه الليلة؟', 'What shall we do tonight?')} <span class="mg-sky-k" style="--c:${k.color}">${doodle(k.emoji, 18)} ${esc(L(k.ar, k.en))}</span> ${App.arrow}</small>
		</span>`;
}

/* مناسباتنا: a desk calendar torn to the next occasion — the day in big numbers, the month, what it is and how long
   is left — with the two after it peeking out behind. */
function calendarHTML(s) {
	const next = occasions(s).slice(0, 3);
	if (!next.length) return '';
	const [o] = next;
	const when = new Date(); when.setHours(12, 0, 0, 0); when.setDate(when.getDate() + o.days);
	const loc = App.lang === 'ar' ? 'ar-EG' : 'en-GB';
	const month = new Intl.DateTimeFormat(loc, { month: 'long' }).format(when);
	const wday = new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(when);
	const left = o.days === 0 ? L('النهارده ♥', 'Today ♥') : o.days === 1 ? L('بكرة', 'Tomorrow') : L(`بعد ${num(o.days)} يوم`, `in ${o.days} days`);
	return `<a class="mg-cal" href="calendar.html" aria-label="${esc(`${o.title} — ${left}`)}">
		${next.slice(1).map((x, i) => `<span class="mg-cal-back" style="--n:${i + 1}" aria-hidden="true"><small>${esc(x.title)}</small></span>`).join('')}
		<span class="mg-cal-page">
			<span class="mg-cal-rings" aria-hidden="true"><i></i><i></i></span>
			<span class="mg-cal-month">${esc(month)}</span>
			<span class="mg-cal-day">${num(when.getDate())}</span>
			<span class="mg-cal-wday">${esc(wday)}</span>
			<b>${esc(o.title)}</b>
			<small>${esc(o.sub)}</small>
			<span class="mg-cal-left${o.days === 0 ? ' is-today' : ''}">${left}</span>
		</span>
	</a>`;
}

/* مناسباتنا, under the calendar: «وبعدها», a page of the planner with the two occasions after the next one, side by side —
   each a torn-off calendar leaf (month and day), what it is, and how long is left */
function nextTagsHTML(s) {
	const after = occasions(s).slice(1, 3);
	if (!after.length) return '';
	const loc = App.lang === 'ar' ? 'ar-EG' : 'en-GB';
	const dateOf = (o) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o.days); return d; };
	const month = (o) => new Intl.DateTimeFormat(loc, { month: 'short' }).format(dateOf(o));
	const href = (o) => (o.kind === 'birthday' ? `birthday.html?id=${esc(o.id)}` : 'calendar.html');
	return `<div class="mg-tags">
		<p class="mg-tags-h">${L('وبعدها', 'And after that')}</p>
		<div class="mg-tags-row">${after.map((o, i) => `<a class="mg-tag" href="${href(o)}" style="--i:${i}">
			<span class="mg-tag-leaf" aria-hidden="true"><i>${esc(month(o))}</i><b>${num(dateOf(o).getDate())}</b></span>
			<span class="mg-tag-tx"><b>${esc(o.title)}</b><small><span class="mg-tag-e" aria-hidden="true">${doodle(o.emoji, 14)}</span>${L(`بعد ${num(o.days)} يوم`, `in ${o.days} days`)}</small></span>
		</a>`).join('')}</div>
	</div>`;
}

/* the album polaroid in ذكرياتنا: any photo from the album, a different one each time */
function albumHTML(s) {
	const photos = (s.gallery || []).map(firstPhoto).filter((p) => p && !isVideo(p));
	const p = photos.length ? pick(photos) : s.poster;
	return `${p ? `<span class="mg-pic" data-media-box>${img(p, '', 'mg-cover')}</span>` : ''}
		<span class="mg-card-t"><b>${L('ألبوم الصور', 'Photo album')}</b><small>${L('إحنا بالصور', 'Us in pictures')}</small></span>`;
}

/* the film strip in ذكرياتنا: five moments from our story with photos (never today's — حكايتنا shows that one),
   five different ones each time it opens, laid out oldest first like a reel */
function filmHTML(s) {
	const all = (s.timeline || []).filter((x) => !x.when && firstPhoto(x) && !isVideo(firstPhoto(x)) && !isToday(x.date));
	const five = [];
	while (five.length < 5 && five.length < all.length) { const m = pick(all); if (!five.includes(m)) five.push(m); }
	return five.sort((a, b) => String(a.date).localeCompare(String(b.date))).map((m) => `
		<a class="mg-frame" href="moment.html?id=${esc(m.id)}" title="${T(m.title)}" data-media-box>${img(firstPhoto(m), App.t(m.title), 'mg-frame-img')}<small>${fmtDate(m.date)}</small></a>`).join('');
}

let lastNote = -1;
function noteHTML(s) {
	const notes = (s.notes || []).filter((n) => t(n.text).length <= 140);
	if (!notes.length) return `<q>${T(s.closing)}</q>`;
	let k = Math.floor(Math.random() * notes.length);
	if (k === lastNote && notes.length > 1) k = (k + 1) % notes.length;
	lastNote = k;
	const n = notes[k];
	return `<q>${T(n.text)}</q><small>— ${T(n.by === 'him' ? s.him : s.her)}</small>`;
}

/* open on hover (mouse), click/tap, Enter or ↓; close on leaving, Escape, a click outside or focus leaving */
function wireMega(header) {
	const nav = $('.mnav', header);
	const btns = $$('.mnav-btn', nav);
	const fine = matchMedia('(hover: hover) and (pointer: fine)');
	let openId = '';
	let timer = 0;
	let openedAt = 0;
	const set = (id) => {
		clearTimeout(timer);
		if (id === 'memories' && openId !== 'memories') {
			// a new love note, album photo and moment every time ذكرياتنا opens
			const tx = $('#mg-note', nav); if (tx) tx.innerHTML = noteHTML(App.story);
			const al = $('#mg-album', nav); if (al) al.innerHTML = albumHTML(App.story);
			const fm = $('#mg-film', nav); if (fm) fm.innerHTML = filmHTML(App.story);
		}
		// a new suggestion under tonight's moon each time ليالينا opens
		if (id === 'nights' && openId !== 'nights') { const sk = $('#mg-sky', nav); if (sk) sk.innerHTML = skyHTML(sk); }
		if (id) hydrate(nav);
		openId = id;
		for (const b of btns) {
			const on = b.dataset.mega === id;
			b.setAttribute('aria-expanded', String(on));
			$('#mega-' + b.dataset.mega).classList.toggle('is-open', on);
		}
		header.classList.toggle('mega-open', !!id);
		if (id) openedAt = Date.now();
	};
	for (const b of btns) {
		const id = b.dataset.mega;
		b.onclick = () => (openId === id && Date.now() - openedAt > 450 ? set('') : set(id));
		b.onkeydown = (ev) => {
			if (ev.key !== 'ArrowDown') return;
			ev.preventDefault();
			set(id);
			$('#mega-' + id + ' a')?.focus();
		};
		b.onpointerenter = (ev) => {
			if (ev.pointerType !== 'mouse' || !fine.matches) return;
			clearTimeout(timer);
			timer = setTimeout(() => set(id), openId ? 0 : 110);
		};
		b.onpointerleave = () => { if (!openId) clearTimeout(timer); };
	}
	for (const a of $$('.mnav-link', nav)) a.onpointerenter = (ev) => { if (ev.pointerType === 'mouse' && openId) { clearTimeout(timer); timer = setTimeout(() => set(''), 140); } };
	header.onpointerleave = (ev) => { if (ev.pointerType === 'mouse' && openId) { clearTimeout(timer); timer = setTimeout(() => set(''), 260); } };
	header.onpointerenter = (ev) => { if (ev.pointerType === 'mouse' && openId) clearTimeout(timer); };
	nav.addEventListener('click', (ev) => { if (ev.target.closest('.mega a')) set(''); });
	nav.addEventListener('focusout', (ev) => { if (openId && ev.relatedTarget && !nav.contains(ev.relatedTarget)) set(''); });
	header._mega = { nav, set, open: () => openId };
	if (header.dataset.wired) return;
	header.dataset.wired = '1';
	document.addEventListener('keydown', (ev) => {
		if (ev.key !== 'Escape') return;
		const m = header._mega;
		if (m.open()) { const b = $(`[data-mega="${m.open()}"]`, m.nav); m.set(''); b?.focus(); }
		if (header.classList.contains('menu-open')) { header._menu(false); $('.menu-btn', header).focus(); }
	});
	document.addEventListener('click', (ev) => {
		if (!header.contains(ev.target)) { header._mega.set(''); header._menu?.(false); }
	});
	// «/» or Ctrl/⌘+K: search, from anywhere (not while typing in a box)
	document.addEventListener('keydown', (ev) => {
		const typing = ev.target.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
		const slash = ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
		const k = (ev.ctrlKey || ev.metaKey) && !ev.altKey && ev.key.toLowerCase() === 'k';
		if (!slash && !k) return;
		ev.preventDefault();
		const box = $('#sr-q');
		if (box) { box.focus(); box.select(); return; }
		const a = $('.search-btn', header);
		if (a) a.click();
	});
	matchMedia('(max-width: 979px)').addEventListener('change', () => { header._mega.set(''); header._menu?.(false); });
}

/* The phone menu: the diary's contents page, as in the footer. Home on its own line at the top, then a chapter per
   menu under a coloured divider tab with its number and how many pages it holds — tap a tab to open it (one at a
   time), the chapter of the page you're on already open — its pages two to a row, and search and settings at the foot. */
const PN_CHAPTERS = [['story', 'حكايتنا', 'Our story'], ['memories', 'ذكرياتنا', 'Memories'], ['family', 'عيلتنا', 'Our family'], ['nights', 'ليالينا', 'Our nights'], ['you', 'مناسباتنا', 'Occasions']];
function pnavHTML(here) {
	const cur = (p) => (p.href === here ? ' aria-current="page"' : '');
	const mine = groupOf(pageId());
	const link = (p, k) => `<a href="${p.href}" style="--i:${k}"${cur(p)}>${icon(p.ic)}<span>${esc(L(p.ar, p.en))}</span></a>`;
	const home = PAGES[0];
	return `<a class="pn-home" href="${home.href}"${cur(home)}>${icon(home.ic)}<span>${esc(L(home.ar, home.en))}</span></a>
		${PN_CHAPTERS.map(([g, ar, en], n) => {
			const ps = PAGES.filter((p) => p.group === g);
			return `<details class="pn-ch" name="pn" style="--n:${n}"${g === mine ? ' open' : ''}>
				<summary><i aria-hidden="true">${num(n + 1)}</i><b>${esc(L(ar, en))}</b><small>${num(ps.length)} ${L('صفحة', ps.length === 1 ? 'page' : 'pages')}</small></summary>
				<div class="pn-list">${ps.map(link).join('')}</div>
			</details>`;
		}).join('')}
		<div class="pn-app">${PAGES.filter((p) => p.group === 'app').map(link).join('')}</div>`;
}

/* The morphing search, after Codrops' «Morphing Search»: the magnifier in the header grows into a whole page — the
   box flies from the button to fill the screen, its words grow big, and three columns rise under it: pages, moments
   from our story, and everything else (before typing: a few pages, the newest moments, and what was searched before).
   Enter opens the full search page with the words; Esc or the ✕ shrinks it back into the button. */
async function morphSearch(btn) {
	if ($('.ms')) return;
	const r = btn.getBoundingClientRect();
	const ms = document.createElement('div');
	ms.className = 'ms';
	ms.setAttribute('role', 'dialog');
	ms.setAttribute('aria-modal', 'true');
	ms.setAttribute('aria-label', L('دوّر', 'Search'));
	ms.style.cssText = `--x:${r.left}px;--y:${r.top}px;--w:${r.width}px;--h:${r.height}px`;
	ms.innerHTML = `<form class="ms-form" role="search" action="search.html">
			<p class="ms-tape">${L('دوّر في حكايتنا', 'Search our story')}</p>
			<input class="ms-input" name="q" type="search" autocomplete="off" spellcheck="false" dir="auto" enterkeyhint="search" placeholder="${esc(Y('بتدوّر على إيه؟', 'بتدوّري على إيه؟', 'Search…'))}" aria-label="${esc(L('دوّر', 'Search'))}">
			<button class="ms-go" type="submit" aria-label="${esc(L('دوّر', 'Search'))}">${icon('search', 34)}</button>
		</form>
		<div class="ms-sug" aria-label="${esc(L('اقتراحات', 'Suggestions'))}"><span class="ms-sug__h" data-sh></span><div class="ms-sug__row" data-sug></div></div>
		<button class="ms-close" type="button" aria-label="${esc(L('اقفل', 'Close'))}"></button>
		<div class="ms-cols" aria-live="polite">
			<section class="ms-col"><h2><i aria-hidden="true">${icon('book', 16)}</i><span>${L('صفحات', 'Pages')}</span><small data-n="1"></small></h2><div class="ms-list" data-c="1"></div></section>
			<section class="ms-col"><h2><i aria-hidden="true">${icon('heart', 16)}</i><span>${L('من حكايتنا', 'From our story')}</span><small data-n="2"></small></h2><div class="ms-list" data-c="2"></div></section>
			<section class="ms-col"><h2><i aria-hidden="true">${icon('star', 16)}</i><span data-h3>${L('في اليوم ده', 'On this day')}</span><small data-n="3"></small></h2><div class="ms-list" data-c="3"></div></section>
		</div>`;
	document.body.append(ms);
	document.body.classList.add('menu-lock');
	const input = $('.ms-input', ms);
	let find = {};
	const close = () => {
		ms.classList.remove('is-open');
		document.body.classList.remove('menu-lock');
		removeEventListener('keydown', onKey);
		setTimeout(() => { ms.remove(); btn.focus({ preventScroll: true }); }, REDUCE ? 0 : 520);
	};
	const onKey = (e) => { if (e.key === 'Escape') close(); };
	addEventListener('keydown', onKey);
	$('.ms-close', ms).onclick = close;
	void ms.offsetWidth; // the box starts on the button, then grows
	ms.classList.add('is-open');
	setTimeout(() => input.focus({ preventScroll: true }), REDUCE ? 0 : 450);
	ms.addEventListener('click', (e) => { if (e.target.closest('.ms-list a')) { find.rememberSearch?.(input.value); setTimeout(close, 60); } });
	$('.ms-form', ms).onsubmit = (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; find.rememberSearch?.(q); location.href = `search.html?q=${encodeURIComponent(q)}`; };

	const card = (h) => `<a href="${esc(h.href)}">${icon(h.ic || 'heart', 20)}<span><b dir="auto">${esc(h.title)}</b>${h.date ? `<small>${fmtDate(h.date)}</small>` : h.sub ? `<small>${esc(h.sub)}</small>` : ''}</span></a>`;
	const fill = (n, list, empty) => {
		$(`[data-c="${n}"]`, ms).innerHTML = list.length ? list.map(card).join('') : `<p class="ms-none">${empty}</p>`;
		$(`[data-n="${n}"]`, ms).textContent = list.length ? num(list.length) : '';
	};
	// the chips under the box: before typing, what to try (what was searched before, ideas, today's date in other
	// years, a year); while typing, the titles that match, to finish the words with a tap
	const chips = (head, list) => {
		$('[data-sh]', ms).textContent = head;
		$('[data-sug]', ms).innerHTML = list.map((c) => `<button type="button" class="ms-chip${c.kind ? ` ms-chip--${c.kind}` : ''}" data-q="${esc(c.q)}">${c.kind === 'recent' ? icon('search', 14) : c.kind === 'date' ? icon('calendar', 14) : ''}<span dir="auto">${esc(c.label || c.q)}</span></button>`).join('');
	};
	$('[data-sug]', ms).addEventListener('click', (e) => {
		const c = e.target.closest('[data-q]');
		if (!c) return;
		input.value = c.dataset.q;
		input.focus({ preventScroll: true });
		draw();
	});
	find = await import('./pages/search.js');
	const s = App.story;
	await find.ensureIndex(s);
	const now = new Date(), md = `-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	const moments = (s.timeline || []).filter((x) => x.date && !x.when);
	const start = () => {
		const ideas = [L('عيد ميلاد', 'birthday'), L('رحلة', 'trip'), L('أول مرة', 'first'), L('أغنية', 'song'), L('ستاربكس', 'Starbucks'), L('فهد', 'Fahd')];
		const years = [...new Set(moments.map((x) => x.date.slice(0, 4)))];
		chips(Y('جرّب', 'جرّبي', 'Try'), [
			...find.recentSearches().slice(0, 4).map((q) => ({ q, kind: 'recent' })),
			{ q: `${now.getDate()}-${now.getMonth() + 1}`, label: L('النهارده في السنين اللي فاتت', 'Today in past years'), kind: 'date' },
			...(years.length ? [{ q: years[Math.floor(Math.random() * years.length)], kind: 'date' }] : []),
			...ideas.map((q) => ({ q }))
		]);
		fill(1, ['story', 'gallery', 'places', 'cities', 'remember', 'calendar'].map((id) => PAGES.find((p) => p.id === id)).filter(Boolean).map((p) => ({ title: L(p.ar, p.en), sub: L(p.dar || '', p.den || ''), href: p.href, ic: p.ic })), '');
		fill(2, moments.slice(-5).reverse().map((x) => ({ title: App.t(x.title), date: x.date, href: `moment.html?id=${encodeURIComponent(x.id)}`, ic: 'book' })), '');
		// on this day: the moments of today's date in other years, else the ones closest to it
		const today = moments.filter((x) => x.date.slice(4, 10) === md);
		const day = (d) => { const x = new Date(`2000${d.slice(4, 10)}T12:00:00`); const t = new Date(`2000${md}T12:00:00`); const k = Math.abs(x - t) / 864e5; return Math.min(k, 366 - k); };
		const near = today.length ? today : [...moments].sort((a, b) => day(a.date) - day(b.date)).slice(0, 4);
		$('[data-h3]', ms).textContent = today.length ? L('في اليوم ده', 'On this day') : L('قريب من النهارده', 'Close to today');
		fill(3, near.slice(0, 5).map((x) => ({ title: App.t(x.title), date: x.date, href: `moment.html?id=${encodeURIComponent(x.id)}`, ic: 'calendar' })), '');
	};
	let timer = 0;
	const draw = () => {
		const q = input.value;
		if (q.trim().length < 2) return start();
		const hits = find.quick(q, 60);
		// finish the words: the titles that match, each once, the shortest first
		const fq = q.trim().toLowerCase();
		const done = [...new Set(hits.map((h) => h.title.replace(/…$/, '')))].filter((t) => t.toLowerCase() !== fq).sort((a, b) => a.length - b.length).slice(0, 6);
		chips(done.length ? L('قصدك؟', 'Did you mean') : '', done.map((t) => ({ q: t })));
		$('[data-h3]', ms).textContent = L('وكمان', 'And more');
		const none = L('مفيش هنا', 'Nothing here');
		fill(1, hits.filter((h) => h.page === 'pages').slice(0, 6), none);
		fill(2, hits.filter((h) => h.page === 'story' || h.page === 'chapters').slice(0, 6), none);
		fill(3, hits.filter((h) => !['pages', 'story', 'chapters'].includes(h.page)).slice(0, 6).map((h) => ({ ...h, sub: h.group, date: '' })), none);
	};
	input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
	start();
}

function renderChrome() {
	const s = App.story;
	let header = $('#site-header');
	if (!header) { header = document.createElement('header'); header.id = 'site-header'; document.body.prepend(header); }
	header.className = 'site-header';
	const here = currentFile();
	header.innerHTML = `
		<a class="skip" href="#main">${Y('روح للمحتوى', 'روحي للمحتوى', 'Skip to content')}</a>
		<div class="hd-wrap">
			<button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${L('القائمة', 'Menu')}"><span class="stack" aria-hidden="true"><i></i><i></i><i></i></span></button>
			<a class="brand" href="index.html"><span class="brand-names">${T(s.him)} <i>♥</i> ${T(s.her)}</span><span class="brand-sub">${L('حكاية حب', 'A love story')} · ${(s.met || '2009').slice(0, 4)}</span></a>
			<nav class="pnav" id="site-nav" aria-label="${L('الفهرس', 'Contents')}" data-title="${L('الفهرس', 'Contents')}">${pnavHTML(here)}</nav>
			${megaHTML(s)}
			<div class="tools"><a class="icon-btn search-btn" href="search.html"${here === 'search.html' ? ' aria-current="page"' : ''} aria-label="${L('دوّر', 'Search')}" title="${L('دوّر', 'Search')} (/)">${icon('search', 20)}</a>${themeBtn()}${langBtn()}</div>
		</div>`;
	const setMenu = (on) => {
		header.classList.toggle('menu-open', on);
		$('.menu-btn', header).setAttribute('aria-expanded', String(on));
		document.body.classList.toggle('menu-lock', on);
	};
	header._menu = setMenu;
	$('.menu-btn', header).onclick = () => setMenu(!header.classList.contains('menu-open'));
	$('.pnav', header).onclick = (ev) => { if (ev.target.closest('a')) setMenu(false); };
	$('.lang-toggle', header).onclick = () => setLang(App.lang === 'ar' ? 'en' : 'ar');
	$('.theme-toggle', header).onclick = toggleTheme;
	// the magnifier opens the morphing search over the page (on the search page itself it just goes to the box)
	$('.search-btn', header).onclick = (e) => {
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
		e.preventDefault();
		const box = $('#gs-input') && $('#gs .gs-say');
		if (pageId() === 'search') { if (box) box.click(); else $('#sr-q')?.focus(); return; }
		morphSearch(e.currentTarget);
	};
	wireMega(header);

	let main = $('#main');
	if (!main) { main = document.createElement('main'); main.id = 'main'; header.after(main); }
	main.tabIndex = -1;

	let footer = $('#site-footer');
	if (!footer) { footer = document.createElement('footer'); footer.id = 'site-footer'; main.after(footer); }
	footer.className = 'site-footer';
	footer.innerHTML = footerHTML(s);
	$('#lock-btn', footer).onclick = () => {
		if (!confirm(Y('تقفل الموقع تاني؟ هتحتاج تجاوب على الأسئلة المرة الجاية.', 'تقفلي الموقع تاني؟ هتحتاجي تجاوبي على الأسئلة المرة الجاية.', 'Lock it again? You’ll need to answer the questions next time.'))) return;
		store.del(KEY);
		location.href = 'index.html';
	};
	pwaChrome();
	pet(footer);
}

/* The footer: the four of us as the river stones from the portrait Sameh made for Esraa, sitting together on a dune
   by the Nile at sunset — pyramids, palms, a felucca, the places our anniversaries take us. Each of us is a link to
   our own page. Then the links, the tools, and the maker's line with its owl. */

/* A smooth, slightly uneven stone: points around an ellipse, nudged by a seed, joined with curves. */
function pebble(cx, cy, rx, ry, rot = 0, seed = 1) {
	const n = 10;
	const rnd = (k) => { const x = Math.sin(seed * 97.13 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
	const a0 = (rot * Math.PI) / 180;
	const pts = Array.from({ length: n }, (_, k) => {
		const a = (k / n) * Math.PI * 2;
		const w = 1 + (rnd(k) - 0.5) * 0.12;
		const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
		return [cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0)];
	});
	const r = (v) => v.toFixed(1);
	let d = 'M' + r(pts[0][0]) + ' ' + r(pts[0][1]);
	for (let k = 0; k < n; k++) {
		const p0 = pts[(k - 1 + n) % n], p1 = pts[k], p2 = pts[(k + 1) % n], p3 = pts[(k + 2) % n];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += 'C' + [...c1, ...c2, ...p2].map(r).join(' ');
	}
	return d + 'Z';
}

/* The footer scene, drawn by hand: pencil lines that wobble (two strokes each, never quite on top of each
   other), watercolour washes that miss the lines a little, hatching for shadows, and our names written in with
   arrows — the four pebbles from the portrait, sitting by the Nile. In dark mode it turns to chalk. */
function familyScene(s) {
	const members = s.family?.members || [];
	const grown = members.filter((m) => !m.kid);
	const kids = members.filter((m) => m.kid);
	const [dad, mum] = grown;
	let clipN = 0;
	const f = (v) => v.toFixed(1);

	// a pencil line: a firm stroke and a lighter one just beside it, each roughened differently
	const ink = (d, cls = 'sk-ink', w = 2.2) =>
		`<path d="${d}" class="${cls}" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#skA)"/>` +
		`<path d="${d}" class="${cls} sk-ghost" fill="none" stroke-width="${f(w * 0.6)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.6 -1.2)" filter="url(#skB)"/>`;
	// a watercolour wash, nudged off the lines with ragged edges
	const wash = (d, color, dx = 4, dy = 3) => `<path d="${d}" fill="${color}" class="sk-wash" transform="translate(${dx} ${dy})" filter="url(#skW)"/>`;
	// pencil hatching inside a shape
	const hatch = (clip, x0, y0, x1, y1, gap = 7, cls = 'sk-ink') => {
		const id = `skc${clipN++}`;
		const h = y1 - y0;
		let d = '';
		for (let x = x0 - h; x < x1; x += gap) d += `M${f(x)} ${f(y1)}L${f(x + h)} ${f(y0)}`;
		return `<clipPath id="${id}"><path d="${clip}"/></clipPath><path d="${d}" clip-path="url(#${id})" class="${cls} sk-hatch" fill="none" stroke-width="1.1" stroke-linecap="round" filter="url(#skA)"/>`;
	};
	const circle = (cx, cy, r) => `M${cx + r} ${cy}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0`;

	/* a pebble: wash, outline, and one curved stroke on its shadow side for roundness */
	const DX = 288, DY = -24; // the portrait's layout, moved to the middle of the page
	const stone = (cx, cy, rx, ry, rot, seed, color) => {
		cx += DX; cy += DY;
		const d = pebble(cx, cy, rx, ry, rot, seed);
		const c = `M${f(cx + rx * 0.62)} ${f(cy - ry * 0.25)}Q${f(cx + rx * 0.82)} ${f(cy + ry * 0.55)} ${f(cx + rx * 0.05)} ${f(cy + ry * 0.82)}`;
		return wash(d, color, 3, 2) + ink(d) + ink(c, 'sk-ink', 1.2);
	};
	const who = (m, inner, k) => (m
		? `<a class="pb-person" href="member.html?id=${esc(m.id)}" style="--k:${k}"><title>${esc(t(m.name))}</title>${inner}</a>`
		: `<g class="pb-person" style="--k:${k}">${inner}</g>`);

	const people = [
		who(dad, stone(238, 296, 39, 53, -8, 3, '#e3b46a') + stone(255, 213, 22, 25, 12, 5, '#d99a44') + stone(264, 290, 15, 9, 38, 8, '#c98a3a'), 0),
		who(mum, stone(318, 298, 34, 49, 4, 11, '#c9cfa6') + stone(301, 232, 21, 21, 0, 13, '#9fa77f'), 1),
		kids[0] ? who(kids[0], stone(380, 310, 26, 31, 6, 17, '#e2cf9d') + stone(357, 266, 15, 15, 0, 19, '#e6a24c'), 2) : '',
		kids[1] ? who(kids[1], stone(432, 322, 16, 21, 4, 23, '#f1e3c0') + stone(429, 292, 11, 11, 0, 29, '#e6a24c'), 3) : '',
	].join('');
	const more = kids.slice(2).map((m, k) => who(m, stone(466 + k * 26, 326, 12, 16, 0, 41 + k, '#e2cf9d') + stone(464 + k * 26, 303, 8, 8, 0, 47 + k, '#e6a24c'), 4 + k)).join('');

	/* names written beside each of us, with a little arrow */
	const label = (m, x, y, d) => (m ? `<text class="sk-label" x="${x}" y="${y}" text-anchor="middle">${esc(t(m.name))}</text>${ink(d, 'sk-ink', 1.4)}` : '');
	const labels = label(dad, 430, 236, 'M450 244q22 4 34 20m0 0l-1-9m1 9l-9-2')
		+ label(mum, 520, 166, 'M548 172q24 4 32 26m0 0l1-9m-1 9l-8-4')
		+ label(kids[0], 690, 196, 'M682 204q-12 8-26 24m0 0l9-2m-9 2l1-9')
		+ label(kids[1], 800, 300, 'M770 304q-16 0-30 4m0 0l8 4m-8-4l7-6');

	/* pyramids: outline, sand wash, hatching on the shaded face */
	const pyramid = (x, w, h) => {
		const base = 244, apex = `${x + w / 2} ${base - h}`;
		const d = `M${x} ${base}L${apex}L${x + w} ${base}`;
		const face = `M${apex}L${x + w} ${base}L${x + w / 2 + w * 0.08} ${base}Z`;
		return wash(`${d}Z`, '#e8c48a', 5, 2) + hatch(face, x + w / 2, base - h, x + w, base, 6) + ink(d) + ink(`M${apex}L${x + w / 2 + w * 0.08} ${base}`, 'sk-ink', 1.3);
	};
	const palm = (x, h, lean = 1) => {
		const tx = x + 6 * lean, ty = 244 - h;
		const trunk = `M${x} 244q${-6 * lean} ${-h * 0.5} ${6 * lean} ${-h}`;
		const ticks = Array.from({ length: Math.floor(h / 12) }, (_, k) => `M${f(x - 3 + lean * k * 0.4)} ${244 - 10 - k * 12}l7 -3`).join('');
		const fronds = [[-46, 6], [-38, -14], [-14, -24], [16, -22], [40, -10], [48, 8]].map(([dx, dy]) => `M${tx} ${ty}q${f(dx * 0.5)} ${dy - 14} ${dx} ${dy}`).join('');
		return wash(`M${tx - 40} ${ty}c10-26 70-26 80 0c-20 10-60 10-80 0Z`, '#9cbb7a', 0, 4) + ink(trunk, 'sk-ink', 2.4) + ink(ticks, 'sk-ink', 1) + ink(fronds, 'sk-green', 2);
	};
	const waves = [[60, 262], [210, 280], [380, 268], [540, 288], [700, 264], [860, 282], [1010, 268], [1120, 286], [300, 292], [960, 296]]
		.map(([x, y]) => `M${x} ${y}q8-6 16 0t16 0t16 0`).join('');
	const rays = Array.from({ length: 12 }, (_, k) => {
		const a = (k / 12) * Math.PI * 2;
		return `M${f(880 + Math.cos(a) * 46)} ${f(118 + Math.sin(a) * 46)}L${f(880 + Math.cos(a) * 62)} ${f(118 + Math.sin(a) * 62)}`;
	}).join('');
	const cloud = (x, y, k = 1) => `M${x} ${y}c${10 * k}-${18 * k} ${34 * k}-${18 * k} ${40 * k}-${4 * k}c${12 * k}-${12 * k} ${34 * k}-${6 * k} ${32 * k} ${8 * k}c${12 * k} ${2 * k} ${12 * k} ${18 * k}-${4 * k} ${18 * k}H${x}c-${14 * k} 0-${16 * k}-${18 * k} 0-${22 * k}Z`;
	const heart = 'M612 160c-5-7-16-4-16 4 0 9 16 18 16 18s16-9 16-18c0-8-11-11-16-4Z';

	return `<svg class="fs fs--sketch" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${esc(L('رسمة بالقلم الرصاص: إحنا الأربعة حجارة صغيرة قاعدين جنب النيل', 'A pencil sketch: the four of us as pebbles, sitting by the Nile'))}">
		<defs>
			<filter id="skA" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
			<filter id="skB" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
			<filter id="skW" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G"/></filter>
		</defs>
		<g class="fs-cloud">${ink(cloud(0, 70), 'sk-ink', 1.4)}</g>
		<g class="fs-cloud c2">${ink(cloud(0, 104, 0.8), 'sk-ink', 1.2)}</g>
		<g class="fs-sun">${wash(circle(880, 118, 34), '#ffd36b', 5, 4)}${ink(circle(880, 118, 34), 'sk-sun', 2.2)}${ink(rays, 'sk-sun', 1.8)}</g>
		${[0, 1].map((k) => `<g class="fs-bird${k ? ' b2' : ''}"><g transform="translate(0 ${80 + k * 34}) scale(${k ? 0.8 : 1})">${ink('M0 0q8-9 16 0q8-9 16 0', 'sk-ink', 1.8)}</g></g>`).join('')}
		${pyramid(60, 80, 44)}${pyramid(120, 170, 94)}${pyramid(250, 120, 66)}
		${palm(400, 60)}${palm(1060, 74, -1)}${palm(1112, 56)}
		${ink('M0 246C200 238 420 244 620 240S1000 236 1200 244', 'sk-ink', 1.8)}
		${wash('M0 252C300 246 600 258 900 250S1150 254 1200 250L1200 294C900 302 600 290 300 298S50 292 0 296Z', '#9cc9de', 0, 0)}
		${ink(waves, 'sk-blue', 1.6)}
		<g class="fs-boat"><g class="fs-boat-bob">${wash('M37 212q26 30 24 62H37Z', '#fff4dc', 3, 2)}${ink('M2 276q34 16 70 0', 'sk-ink', 2.2)}${ink('M35 278V206M37 212q26 30 24 62H37Z', 'sk-ink', 1.8)}</g></g>
		${wash('M0 360V322C200 304 380 300 470 290C540 280 660 280 740 290S1000 306 1200 316V360Z', '#e9cf9c', 0, 0)}
		${ink('M0 322C200 304 380 300 470 290C540 280 660 280 740 290S1000 306 1200 316', 'sk-ink', 2)}
		${ink('M380 342q40-8 80 0M720 336q50-10 100 0M540 352q30-6 60 0M180 336q30-6 60 0M960 344q40-8 70 0', 'sk-ink', 1.1)}
		${hatch(`M${600 - 130} 330a130 13 0 1 0 260 0a130 13 0 1 0 -260 0`, 470, 316, 730, 344, 6)}
		<g class="fs-family" transform="translate(0 6)">${people}${more}</g>
		${labels}
		<g class="fs-heart">${wash(heart, '#f2726f', 2, 2)}${ink(heart, 'sk-red', 2.4)}</g>
	</svg>`;
}

function footerHTML(s) {
	// each group a chapter of the diary's contents page: a coloured divider tab with its number, the pages under it
	const col = (n, title, list) => `<nav class="ft-links" style="--n:${n}" aria-label="${esc(title)}"><h2><i aria-hidden="true">${String(n).padStart(2, '0')}</i>${esc(title)}</h2><div class="ft-links__list">${list.map((p) => `<a href="${p.href}">${esc(L(p.ar, p.en))}</a>`).join('')}</div></nav>`;
	const g = (id) => PAGES.filter((p) => p.group === id);
	return `
	<div class="ft-scene">${familyScene(s)}</div>
	<div class="ft-body"><div class="ft-wrap">
		<div class="ft-brand">
			<span class="ft-names">${T(s.him)} <i>♥</i> ${T(s.her)}</span>
			<span class="ft-dates" dir="ltr">${(s.met || '2009').slice(0, 4)} — ∞</span>
			<div class="ft-tools">
				<button class="btn btn--coral btn--sm" type="button" id="install-btn" hidden>${Y('حطها على الشاشة الرئيسية', 'حطيها على الشاشة الرئيسية', 'Add to home screen')}</button>
				<button class="btn btn--ghost btn--sm" type="button" id="save-btn" hidden>${Y('احفظها من غير نت', 'احفظيها من غير نت', 'Save for offline')}</button>
				<a class="btn btn--ghost btn--sm" href="index.html?intro">${Y('شوف المقدمة تاني', 'شوفي المقدمة تاني', 'Replay intro')}</a>
				<button class="btn btn--ghost btn--sm" type="button" id="lock-btn">${doodle('lock', 16)} ${Y('اقفل', 'اقفلي', 'Lock')}</button>
			</div>
		</div>
		<div class="ft-book">
			<span class="ft-book__holes" aria-hidden="true"></span>
			<p class="ft-book__h">${L('الفهرس', 'Contents')}</p>
			<div class="ft-book__ch">
				${col(1, L('حكايتنا', 'Our story'), [PAGES[0], ...g('story')])}
				${col(2, L('ذكرياتنا', 'Memories'), g('memories'))}
				${col(3, L('ليالينا', 'Our nights'), [...g('nights'), ...DRAW_KINDS.map((k) => ({ href: `draw.html?k=${k.id}`, ar: k.ar, en: k.en }))])}
				${col(4, L('عيلتنا ومناسباتنا', 'Family & occasions'), [...g('family'), ...g('you'), ...g('app')])}
			</div>
		</div>
		<div class="ft-maker">
			${App.lang === 'ar'
				? `<p class="ft-copy" dir="rtl">حقوق النشر @${new Date().getFullYear()}، ${petHTML()}كل الحب محفوظ. <span>صُنع بـ <span class="ft-heart">${doodle('heart', 16)}</span> سامح بلال</span></p>`
				: `<p class="ft-copy" dir="ltr">Copyright @${new Date().getFullYear()}, ${petHTML()}All love reserved. <span>Crafted with <span class="ft-heart">${doodle('heart', 16)}</span> Sameh Bilal</span></p>`}
		</div>
	</div>
	<p class="ft-end">${T(s.closing)} <span aria-hidden="true">♥</span></p></div>`;
}

/* the footer pet, as on Sameh's portfolio: on each visit the ASCII orca (3 in 4) or the owl (1 in 4).
   The orca (orca.js, from the portfolio) loads only when it's picked; when the footer is drawn again (moving between
   pages while a song plays) the same swimming orca is moved into the new footer; if orca.js fails, the owl stays. */
let PET = Math.random() < 0.75 ? 'orca' : 'owl';
let orcaEl = null;
const OWL_HTML = '<span class="ascii owl" aria-hidden="true">,___,\n[o,o]\n/)__)\n~"--"~</span>';
// the pet sits on a line of its own, in the middle, above the copyright line (its wrapper keeps it there when the orca
// gives way to the owl)
const petHTML = () => `<span class="ft-pet">${PET === 'orca' ? '<span class="ascii orca" data-len="34" aria-hidden="true"></span>' : OWL_HTML}</span>`;
function pet(footer) {
	if (PET === 'owl') return owl();
	const spot = $('.orca', footer);
	if (!spot) return;
	if (orcaEl) return spot.replaceWith(orcaEl);
	const toOwl = () => { PET = 'owl'; const el = $('.site-footer .orca'); if (el) el.outerHTML = OWL_HTML; owl(); };
	const mount = () => { const el = $('.site-footer .orca'); if (!el || !window.AsciiOrca) return toOwl(); orcaEl = el; window.AsciiOrca.mount([el]); };
	if (window.AsciiOrca) return mount();
	const sc = document.createElement('script');
	sc.src = new URL('orca.js', import.meta.url).href;
	sc.onload = mount;
	sc.onerror = toOwl;
	document.head.append(sc);
}

/* the footer owl (from Sameh's portfolio): blinks while idle, glances when the page scrolls */
let owlTimer;
function owl() {
	const F = { idle: [',___,\n[o,o]\n/)__)\n~"--"~', ',___,\n[o,-]\n/)__)\n~"--"~', ',___,\n[-,o]\n/)__)\n~"--"~'], scroll: [',___,\n[o,o]\n<(__)\n~"--"~', ',___,\n[o,o]\n/)__>\n~"--"~'] };
	if (REDUCE || owlTimer) return;
	let k = 0;
	let scrolled = 0;
	addEventListener('scroll', () => { scrolled = Date.now(); }, { passive: true });
	owlTimer = setInterval(() => {
		const el = $('.site-footer .owl');
		if (!el) return;
		const list = Date.now() - scrolled < 400 ? F.scroll : F.idle;
		k = (k + 1) % (list === F.idle ? 12 : 2);
		el.textContent = list === F.idle ? (k < 2 ? list[k + 1] : list[0]) : list[k % 2];
	}, 380);
}

/* ------------------------------------------------------------------ moving between pages without stopping the song

   Every page is the same shell with a different <body data-page>, so while a song is playing (radio.js) a link to
   another page of ours doesn't load it afresh: it swaps the page's module, redraws the header and footer and renders
   the new page into <main>, and the address and the back button work as usual. With nothing playing, links load
   pages the ordinary way. */
// every page of ours — written by tools/heads.mjs (which tools/build.mjs runs) from the pages themselves, so a new page
// joins by itself; a page left out of here would reload and stop the song
const PAGE_IDS = new Set(['adventures', 'anniversaries', 'beforeus', 'birthday', 'books', 'calendar', 'capsule', 'chapter', 'chapters', 'chats', 'chores', 'cities', 'debts', 'distances', 'draw', 'drawings', 'expenses', 'family', 'favorites', 'firsts', 'fixes', 'food', 'gallery', 'games', 'gifts', 'goals', 'growth', 'guestbook', 'health', 'hosting', 'home', 'journal', 'journey', 'journeys', 'letters', 'member', 'minute', 'moment', 'movies', 'music', 'nokta', 'notes', 'numbers', 'offline', 'onthisday', 'ourfirsts', 'people', 'places', 'posts', 'ramadan', 'remember', 'routine', 'sayings', 'search', 'secret', 'settings', 'shopping', 'story', 'tickets', 'trip', 'wishes', 'yearly']);
/* the stylesheet a page has besides the shared ones (its <head>, written by tools/heads.mjs), put in when it's reached this way */
const OWN_CSS = { adventures: 'more', anniversaries: 'more', beforeus: 'more', chats: 'more', debts: 'more', drawings: 'more', expenses: 'more', family: 'more', favorites: 'more', fixes: 'more', food: 'more', gifts: 'more', growth: 'more', guestbook: 'more', health: 'more', hosting: 'more', home: 'home', letters: 'letters', minute: 'more', moment: 'more', music: 'discshelf', nokta: 'more', offline: 'more', onthisday: 'more', ourfirsts: 'more', people: 'more', remember: 'more', routine: 'more', sayings: 'more', secret: 'secret', shopping: 'more', tickets: 'more' };
function ownCSS(id) {
	const name = OWN_CSS[id];
	if (!name || $(`link[href$="css/${name}.css"]`)) return Promise.resolve();
	const l = document.createElement('link');
	l.rel = 'stylesheet';
	l.href = `assets/css/${name}.css`;
	const done = new Promise((r) => { l.onload = l.onerror = r; });
	document.head.append(l);
	return done;
}
const dirOf = (p) => p.slice(0, p.lastIndexOf('/') + 1);
function pageOf(url) {
	if (url.origin !== location.origin || dirOf(url.pathname) !== dirOf(location.pathname)) return '';
	const file = url.pathname.slice(dirOf(url.pathname).length) || 'index.html';
	const id = file === 'index.html' ? 'home' : file.replace(/\.html$/, '');
	return file.endsWith('.html') || file === 'index.html' ? (PAGE_IDS.has(id) ? id : '') : '';
}

let softCount = 0;
let going = 0;
async function go(url, { push = true } = {}) {
	const id = pageOf(url);
	if (!id) { location.href = url.href; return; }
	const ask = ++going;
	let mod;
	try { [mod] = await Promise.all([import(`./pages/${id}.js`).then((m) => m.default), ownCSS(id)]); } catch { location.href = url.href; return; }
	if (ask !== going) return;
	if (push) history.pushState({ soft: ++softCount }, '', url.href);
	document.body.dataset.page = id;
	document.body.classList.remove('menu-lock');
	$$('.lightbox').forEach((b) => b.remove());
	page = mod;
	renderChrome();
	await renderPage();
	if (ask !== going) return;
	if (!url.hash) scrollTo({ top: 0, behavior: 'instant' });
	$('#main')?.focus({ preventScroll: true });
}

function wireLinks() {
	if (wireLinks.done) return;
	wireLinks.done = true;
	history.replaceState({ ...(history.state || {}), soft: 0 }, '', location.href);
	document.addEventListener('click', (e) => {
		if (!radio.active() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const a = e.target.closest('a[href]');
		if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
		const url = new URL(a.href, location.href);
		if (!pageOf(url)) return;
		// the same page, only a different spot on it: let the browser scroll
		if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
		e.preventDefault();
		go(url);
	});
	addEventListener('popstate', (e) => {
		if (e.state && 'soft' in e.state) go(new URL(location.href), { push: false });
	});
}

/* ------------------------------------------------------------------ the page itself */

let shownPage = null;
async function renderPage() {
	const main = $('#main');
	const s = App.story;
	// the page on screen tidies up first (stops its own sounds, timers and listeners): a new page, or this one in the other language
	try { shownPage?.leave?.(); } catch { /* the old page's own trouble */ }
	shownPage = page;
	// <main> stays between pages, so handlers a page put on it go with it
	main.onclick = main.onkeydown = main.oninput = main.onchange = main.onsubmit = null;
	// a page may fetch what it shows first (e.g. the journal entries the timeline includes)
	if (page.load) { try { await page.load(s); } catch { /* render without it */ } }
	main.innerHTML = page.render(s) || '';
	document.title = `${t(page.title) || L('حكايتنا', 'Our story')} — ${t(s.him)} ♥ ${t(s.her)}`;
	hydrate(main, true);
	reveal(main);
	lightbox(main);
	composers(main);
	page.after?.(main, s);
	// a page about one thing (a moment, a big day, one of us, a trip) is named after it in the tab
	const own = DETAIL_OF[pageId()] && $('h1', main)?.textContent.trim();
	if (own) document.title = `${own} — ${t(s.him)} ♥ ${t(s.her)}`;
	if (location.hash.startsWith('#find=')) findOnPage(main, decodeURIComponent(location.hash.slice(6)));
	// by id, not as a selector: a hash like #01-21 (a date on «سنة من الذكريات») isn't a valid one
	else if (location.hash) document.getElementById(location.hash.slice(1).replace(/[^\w-]/g, ''))?.scrollIntoView();
}

/* Coming from a search result (page.html#find=<its title>): scroll to the first card on the page that holds that
   text and give it a highlighter glow for a moment. Lists fill in after their data arrives, so it keeps looking
   for a few seconds. */
function findOnPage(main, text) {
	const fold = (x) => String(x || '').normalize('NFKC').toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
	const want = fold(text).slice(0, 40);
	if (!want) return;
	const box = 'article, figure, li, .card, [class*="card"], [class*="item"], details, section';
	const look = () => {
		const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			const el = n.parentElement;
			if (!el || el.closest('.ph, .related, [hidden], .cmodal') || !fold(el.textContent).includes(want)) continue;
			const target = el.closest(box) || el;
			if (target === main || target.offsetParent === null) continue;
			target.scrollIntoView({ block: 'center', behavior: REDUCE ? 'auto' : 'smooth' });
			target.classList.add('is-found');
			setTimeout(() => target.classList.remove('is-found'), 2600);
			history.replaceState(history.state, '', location.pathname + location.search);
			return true;
		}
		return false;
	};
	if (look()) return;
	const mo = new MutationObserver(() => { if (look()) stop(); });
	const stop = () => { mo.disconnect(); clearTimeout(timer); };
	const timer = setTimeout(stop, 6000);
	mo.observe(main, { childList: true, subtree: true });
}

/* Every add-something form (a <details class="composer">) is a small button that opens it in a window. The <details>
   stays where it was, hidden (pages open and close it through .open, and look things up inside <main>); the form
   moves into a <dialog> right after it, and the two keep in step. The window closes with ✕, a tap outside, Esc, or
   once the form is cleared after saving. A page with its own opener marks its <details data-own-button>. */
export function composers(root) {
	for (const d of root.querySelectorAll('details.composer:not([data-modal])')) {
		const sum = d.querySelector(':scope > summary'), form = d.querySelector(':scope > form');
		if (!sum || !form) continue;
		d.dataset.modal = '1';
		const title = sum.innerHTML;
		const dlg = document.createElement('dialog');
		dlg.className = 'cmodal';
		dlg.setAttribute('aria-label', sum.textContent.trim());
		dlg.innerHTML = `<div class="cmodal__in"><header class="cmodal__hd"><h2>${title}</h2><button type="button" class="cmodal__x" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button></header></div>`;
		dlg.firstElementChild.append(form);
		d.after(dlg);
		if (!d.hasAttribute('data-own-button')) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'btn btn--sm composer-btn';
			btn.innerHTML = title;
			btn.hidden = d.hidden;
			btn.onclick = () => { d.open = true; };
			d.after(btn);
			new MutationObserver(() => { btn.hidden = d.hidden; }).observe(d, { attributes: true, attributeFilter: ['hidden'] });
		}
		const sync = () => {
			if (d.open && !dlg.open) {
				dlg.showModal();
				// straight to the first box on a computer; on a phone, wait for a tap (no keyboard jumping up)
				if (matchMedia('(hover: hover)').matches) dlg.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select')?.focus();
			} else if (!d.open && dlg.open) dlg.close();
		};
		d.addEventListener('toggle', sync);
		dlg.addEventListener('close', () => { if (d.open) d.open = false; });
		dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.cmodal__x')) dlg.close(); });
		form.addEventListener('reset', () => setTimeout(() => { if (dlg.open) dlg.close(); }, 0));
		d.classList.add('is-modal');
		if (d.open) sync();
	}
}

/* The top of every inner page: polaroids tossed on the page (after &Toc's «Scattered Polaroids — CSS random()» on CodePen),
   each at its own tilt, nudge and shadow, placed so no two overlap by more than about a third; then a small label, the
   title and a line about the page. Our own photos mix in with drawn ones, each with a word in handwriting. The scatter is
   the same on every visit to a page, and is worked out twice: once for wide screens and once for phones. */
const BAND = {
	story: [['calendar', 'كل تاريخ', 'Every date'], ['book', 'حكايتنا', 'Our story'], ['heart', 'من أول يوم', 'Since day one'], ['star', 'لسه جاي', 'More to come']],
	chapters: [['ring', 'الخطوبة', 'Engaged'], ['bride', 'الفرح', 'The wedding'], ['groom', 'العريس', 'The groom'], ['baby', 'وجه فهد', 'Then Fahd']],
	moment: [['calendar', 'اليوم ده', 'This day'], ['heart', 'فاكرينه', 'We remember'], ['star', 'ذكرى', 'A memory']],
	chapter: [['ring', 'يوم فارق', 'A big day'], ['heart', 'إحنا', 'Us'], ['sparkle', 'للأبد', 'Forever']],
	places: [['pin', 'هنا', 'Here'], ['couple', 'إحنا الاتنين', 'The two of us'], ['sun', 'مشوار', 'A day out'], ['walk', 'سوا', 'Together']],
	anniversaries: [['plane', 'يلا بينا', 'Let’s go'], ['suitcase', 'الشنط', 'Packed'], ['pin', 'محافظة جديدة', 'A new place'], ['camera', 'صور', 'Snapshots']],
	trip: [['suitcase', 'رحلتنا', 'Our trip'], ['camera', 'صورنا', 'Our photos'], ['pin', 'هنا', 'Here']],
	journal: [['pen', 'بقلمنا', 'In our hand'], ['book', 'دفترنا', 'Our journal'], ['coffee', 'صباحية', 'Mornings'], ['heart', 'يوم بيوم', 'Day by day']],
	draw: [['dress', 'لبس', 'Outfit'], ['dinner', 'عشا', 'Dinner'], ['dice', 'نصيبنا', 'Luck'], ['scooter', 'دليفري', 'Delivery'], ['clapper', 'فيلم', 'A film']],
	movies: [['popcorn', 'فشار', 'Popcorn'], ['clapper', 'أكشن', 'Action'], ['eyes', 'مركزين', 'Glued'], ['love', 'حبيناه', 'Loved it']],
	music: [['music', 'أغنيتنا', 'Our song'], ['heart', 'بتفكرنا', 'Reminds us'], ['sparkle', 'ليلة حلوة', 'A good night']],
	gallery: [['camera', 'كليك', 'Click'], ['family', 'إحنا', 'Us'], ['heart', 'ذكرى', 'A memory'], ['sun', 'أحلى يوم', 'Best day']],
	notes: [['pen', 'كلمتين', 'A few words'], ['letter', 'ليكي', 'For you'], ['smitten', 'بحبك', 'Love you'], ['heart', '♥', '♥']],
	letters: [['letter', 'افتحيه', 'Open me'], ['scroll', 'جواب', 'A letter'], ['heart', 'من القلب', 'From the heart'], ['pen', 'بخط إيدي', 'By hand']],
	family: [['lion', 'فهد', 'Fahd'], ['family', 'إحنا الأربعة', 'The four of us'], ['chick', 'عبد الرحمن', 'Abdulrahman'], ['baby', 'بيتنا', 'Home']],
	member: [['family', 'عيلتنا', 'Family'], ['heart', 'حبيبنا', 'Our dear'], ['star', 'نجم', 'A star']],
	birthday: [['gift', 'هدية', 'A gift'], ['cake', 'تورتة', 'Cake'], ['party', 'هيييه', 'Hooray'], ['sparkle', 'سنة حلوة', 'Happy year']],
	wishes: [['star', 'أمنية', 'A wish'], ['bottle', 'البرطمان', 'The jar'], ['sparkle', 'هتتحقق', 'It’ll come true'], ['moon', 'بالليل', 'At night']],
	settings: [['phone', 'موبايلي', 'My phone'], ['gear', 'ظبط', 'Set up'], ['lock', 'في أمان', 'Safe']],
	search: [['eyes', 'فين؟', 'Where?'], ['book', 'في الحكاية', 'In our story'], ['music', 'أغنية', 'A song'], ['pen', 'في الدفتر', 'In the journal']]
};
const EYEBROW = {
	story: ['حكايتنا', 'Our story'], nights: ['سهراتنا', 'Our nights'], memories: ['ذكرياتنا', 'Our memories'],
	family: ['عيلتنا', 'Our family'], you: ['مناسباتنا', 'Our occasions'], app: ['التطبيق', 'The app']
};
/* steady pseudo-random numbers, so a page's polaroids land the same way every visit */
const rnd = (i, salt) => { const x = Math.sin((i + 1) * 9301 + salt * 49297) * 233280; return x - Math.floor(x); };

/* Where n cards go on a band W×H (card w×h, all in % of the band's width): each tries spots until it overlaps the
   ones already down by at most 35% of a card (the pen's permissive anti-collision), else takes the least crowded spot. */
function scatter(n, W, H, w, h, salt) {
	const put = [];
	for (let i = 0; i < n; i++) {
		let best = null, bestHit = Infinity;
		for (let t = 0; t < 400; t++) {
			const x = w / 2 + 1 + rnd(i * 401 + t, salt) * (W - w - 2);
			const y = h / 2 + 1 + rnd(i * 401 + t, salt + 7) * (H - h - 2);
			const hit = Math.max(0, ...put.map((p) => Math.max(0, w - Math.abs(p.x - x)) * Math.max(0, h - Math.abs(p.y - y)) / (w * h)));
			if (hit < bestHit) { best = { x, y }; bestHit = hit; }
			if (hit <= 0.35 && t > 20) break; // a few tries in, take any spot that's allowed
		}
		put.push(best);
	}
	return put;
}

function polaroids(id, cards) {
	const salt = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
	const wide = scatter(cards.length, 100, 38, 12.5, 15, salt);
	const phone = scatter(Math.min(cards.length, 4), 100, 70, 27, 32.4, salt + 3);
	return `<div class="pb" aria-hidden="true">${cards.map((c, i) => {
		const r = (rnd(i, salt + 11) * 2 - 1) * 13, s = rnd(i, salt + 13);
		const p = phone[i] || { x: -50, y: 0 };
		const pic = c.photo
			? `<div class="pol__ph">${img(c.photo, '', 'pol__img')}</div>`
			: `<div class="pol__ph pol__ph--dd">${doodle(c.icon, 64)}</div>`;
		return `<figure class="pol${i >= 4 ? ' pol--wide' : ''}"${c.photo ? ' data-media-box' : ''} style="--x:${wide[i].x.toFixed(1)};--y:${wide[i].y.toFixed(1)};--px:${p.x.toFixed(1)};--py:${p.y.toFixed(1)};--r:${r.toFixed(1)}deg;--s:${s.toFixed(2)};--i:${i}">
			${pic}<figcaption>${esc(c.cap)}</figcaption></figure>`;
	}).join('')}</div>`;
}

/** Page heading used on every inner page. opts: icon names for the drawn polaroids (an array), or { icons, photos }. */
export function pageHead(title, sub, crumbs = [], opts = {}) {
	if (Array.isArray(opts)) opts = { icons: opts };
	const id = pageId(), trail = [{ href: 'index.html', ar: 'الرئيسية', en: 'Home' }, ...crumbs];
	const eb = EYEBROW[groupOf(id)];
	const drawn = opts.icons ? opts.icons.map((ic) => (Array.isArray(ic) ? ic : [ic, title, title])) : BAND[id] || [['heart', '♥', '♥'], ['star', 'إحنا', 'Us']];
	// our photos: the page's own, else a couple from the album
	const photos = (opts.photos?.length ? opts.photos : (App.story?.gallery || []).map(firstPhoto)).filter(Boolean)
		.map((ref, n) => ({ ref, n: rnd(n, id.length) })).sort((a, b) => a.n - b.n).slice(0, 2).map((p) => p.ref);
	const cards = drawn.map(([icon, ar, en]) => ({ icon, cap: L(ar, en) }));
	photos.forEach((photo, n) => cards.splice(1 + n * 2, 0, { photo, cap: L('إحنا', 'Us') }));
	return `<header class="ph">
		${opts.band ?? polaroids(id, cards.slice(0, 7))}
		<div class="ph__in">
			<nav class="crumbs" aria-label="${L('أنت هنا', 'You are here')}">${trail.map((c) => `<a href="${c.href}">${esc(c.ar ? L(c.ar, c.en) : t(c.label))}</a>`).join('<span aria-hidden="true">/</span>')}</nav>
			${eb ? `<p class="ph__eyebrow">${esc(L(...eb) === title ? L('حكاية حبنا', 'Our love story') : L(...eb))}</p>` : ''}
			<h1 class="ph__title">${esc(title)}</h1>
			${sub ? `<p class="ph__sub">${esc(sub)}</p>` : ''}
		</div>
	</header>`;
}

/** "More to see" links at the foot of a page. */
export function related(ids) {
	return `<aside class="related wrap" aria-label="${L('كمان', 'More')}"><h2 class="related__h">${Y('كمّل الحكاية', 'كمّلي الحكاية', 'Keep exploring')}</h2><div class="related__grid">
		${ids.map((id) => PAGES.find((p) => p.id === id)).filter(Boolean).map((p) => `<a class="related__card reveal" href="${p.href}">${icon(p.ic, 26)}<b>${esc(L(p.ar, p.en))}</b><small>${esc(L(p.dar || '', p.den || ''))}</small><span aria-hidden="true">${App.arrow}</span></a>`).join('')}
	</div></aside>`;
}

export function reveal(root) {
	const els = $$('.reveal:not(.is-in)', root);
	if (!('IntersectionObserver' in window) || REDUCE) return els.forEach((e) => e.classList.add('is-in'));
	const io = new IntersectionObserver((entries) => {
		for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
	}, { rootMargin: '0px 0px -10% 0px', threshold: 0.04 });
	els.forEach((e) => io.observe(e));
}

/* A tapped photo opens big, as a gallery of every photo shown with it (a moment's wall, an open pile in the album): the
   arrows (or ← →, or a swipe) go from one to the next in the reading direction, ▶ plays them as a slideshow with a line
   filling up to the next one, and ✕, Esc or a tap on the dark around them closes it. Photos not fetched yet are fetched
   as they come up, the next ones a step ahead. */
function lightbox(root) {
	if (root.dataset.lb) return;
	root.dataset.lb = '1';
	root.addEventListener('click', (e) => {
		const el = e.target.closest('img.zoom');
		if (!el || (!el.src && !el.dataset.m)) return;
		// the set: every zoomable photo on show beside it (hidden piles in the album don't count)
		const all = $$('img.zoom', root).filter((x) => x.dataset.m || x.src).filter((x) => x === el || x.offsetParent !== null);
		let i = Math.max(0, all.indexOf(el));
		const cap = (x) => x.closest('figure')?.querySelector('figcaption')?.textContent.trim() || x.alt || '';
		const src = (x) => (x.src ? Promise.resolve(x.src) : mediaURL(x.dataset.m));
		const many = all.length > 1;
		const rtl = document.documentElement.dir === 'rtl';
		const box = document.createElement('div');
		box.className = 'lightbox lb';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		box.setAttribute('aria-label', L('الصور', 'Photos'));
		box.innerHTML = `
			<button type="button" class="lb__x" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>
			<figure class="lb__fig"><span class="lb__frame"><img class="lb__img" alt=""></span><figcaption class="lb__cap" dir="auto"></figcaption></figure>
			${many ? `<button type="button" class="lb__go lb__go--prev" aria-label="${L('الصورة اللي قبل', 'Previous photo')}"><span aria-hidden="true">${rtl ? '→' : '←'}</span></button>
			<button type="button" class="lb__go lb__go--next" aria-label="${L('الصورة اللي بعد', 'Next photo')}"><span aria-hidden="true">${rtl ? '←' : '→'}</span></button>
			<div class="lb__bar">
				<button type="button" class="lb__play" aria-pressed="false"><span class="lb__play-ic" aria-hidden="true">▶</span><span class="lb__play-tx">${L('عرض الصور', 'Slideshow')}</span></button>
				<span class="lb__n" aria-live="polite"></span>
			</div>
			<span class="lb__time" aria-hidden="true"><i></i></span>` : ''}`;
		const im = $('.lb__img', box), capEl = $('.lb__cap', box), n = $('.lb__n', box), play = $('.lb__play', box), time = $('.lb__time i', box);
		let token = 0;
		const show = (k, dir = 0) => {
			i = (k + all.length) % all.length;
			const me = ++token, x = all[i];
			box.classList.remove('is-in', 'from-next', 'from-prev');
			if (dir) box.classList.add(dir > 0 ? 'from-next' : 'from-prev');
			box.classList.add('is-loading');
			src(x).then((u) => {
				if (me !== token) return;
				im.onload = () => { if (me !== token) return; box.classList.remove('is-loading'); void im.offsetWidth; box.classList.add('is-in'); };
				im.src = u;
				im.alt = x.alt || '';
			}).catch(() => { if (me === token) box.classList.remove('is-loading'); });
			const c = cap(x);
			capEl.textContent = c;
			capEl.hidden = !c;
			if (n) n.textContent = L(`${num(i + 1)} من ${num(all.length)}`, `${i + 1} of ${all.length}`);
			// the next two a step ahead
			for (const d of [1, 2, -1]) { const y = all[(i + d + all.length) % all.length]; if (y && !y.src && y.dataset.m) mediaURL(y.dataset.m).catch(() => {}); }
			if (playing) restartTimer();
		};
		/* the slideshow */
		const EVERY = 4000;
		let playing = false, timer = 0;
		const restartTimer = () => {
			clearTimeout(timer);
			if (!time) return;
			time.style.transition = 'none'; time.style.transform = 'scaleX(0)'; void time.offsetWidth;
			time.style.transition = `transform ${EVERY}ms linear`; time.style.transform = 'scaleX(1)';
			timer = setTimeout(() => show(i + 1, 1), EVERY);
		};
		const setPlay = (on) => {
			playing = on;
			box.classList.toggle('is-playing', on);
			if (!play) return;
			play.setAttribute('aria-pressed', String(on));
			$('.lb__play-ic', play).textContent = on ? '❚❚' : '▶';
			$('.lb__play-tx', play).textContent = on ? L('وقّف', 'Stop') : L('عرض الصور', 'Slideshow');
			if (on) restartTimer(); else { clearTimeout(timer); if (time) { time.style.transition = 'none'; time.style.transform = 'scaleX(0)'; } }
		};
		const step = (d) => show(i + d, d);
		const close = () => { clearTimeout(timer); box.remove(); document.removeEventListener('keydown', onKey); el.focus?.({ preventScroll: true }); };
		const onKey = (k) => {
			if (k.key === 'Escape') close();
			else if (many && (k.key === 'ArrowRight' || k.key === 'ArrowLeft')) { k.preventDefault(); step((k.key === 'ArrowRight') !== rtl ? 1 : -1); }
			else if (many && k.key === ' ' && k.target === document.body) { k.preventDefault(); setPlay(!playing); }
		};
		box.addEventListener('click', (k) => {
			if (k.target.closest('.lb__go--next')) step(1);
			else if (k.target.closest('.lb__go--prev')) step(-1);
			else if (k.target.closest('.lb__play')) setPlay(!playing);
			else if (k.target.closest('.lb__x') || !k.target.closest('.lb__frame, .lb__bar, .lb__cap')) close();
		});
		// a swipe across the photo goes on (or back)
		let sx = 0, sy = 0;
		box.addEventListener('touchstart', (t) => { sx = t.touches[0].clientX; sy = t.touches[0].clientY; }, { passive: true });
		box.addEventListener('touchend', (t) => {
			if (!many) return;
			const dx = t.changedTouches[0].clientX - sx, dy = t.changedTouches[0].clientY - sy;
			if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) step((dx < 0) !== rtl ? 1 : -1);
		}, { passive: true });
		document.addEventListener('keydown', onKey);
		document.body.append(box);
		show(i);
		$('.lb__x', box).focus();
	});
}

function floatHearts() {
	if (REDUCE) return;
	const box = document.createElement('div');
	box.className = 'hearts';
	box.setAttribute('aria-hidden', 'true');
	box.innerHTML = Array.from({ length: innerWidth < 600 ? 9 : 14 }, () =>
		`<span style="--x:${rand(0, 100)}%;--s:${rand(12, 28)}px;--d:${rand(12, 24)}s;--delay:-${rand(0, 24)}s;--o:${rand(0.12, 0.4)};--drift:${rand(-60, 60)}px;--r:${rand(-60, 60)}deg">♥</span>`).join('');
	document.body.prepend(box);
}

boot();
