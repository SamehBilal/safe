/* Our site as an app (after the one on the Ahmed Khaled Tawfik site): registers sw.js and offers a new version when one
   is ready; an install button in the header (or the steps on iPhone/iPad) and in the footer; a word when the connection
   drops or comes back; "Save for offline", which keeps every photo and video (still encrypted) on the phone; and, after a
   few minutes of reading, a card offering whichever of those is still to do. The browser bar follows our theme, and the
   installed app gets a back button, since it has no browser bar of its own. */
import { App, L, Y, $, store, esc, binURL } from './shell.js';

const html = document.documentElement;
export let standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const mobile = /android|mobi/i.test(navigator.userAgent);
let deferred = null;

const SVG = (d, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON_INSTALL = SVG('<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5"/><path d="M5 19h14"/>');
const ICON_BACK = SVG('<path d="M15 5l-7 7 7 7"/>');

/* ---------- little cards at the bottom of the screen ---------- */
let tray;
/** A card at the bottom of the screen. ttl 0 keeps it until closed. Returns { el, dismiss }. */
export function notify(msg, { title = '', type = '', ttl = 5000, html: asHTML = false } = {}) {
	if (!tray) {
		tray = document.createElement('div');
		tray.className = 'ns-tray';
		tray.setAttribute('role', 'status');
		tray.setAttribute('aria-live', 'polite');
		document.body.append(tray);
	}
	const el = document.createElement('div');
	el.className = 'ns' + (type ? ' ns--' + type : '');
	el.innerHTML = `${title ? `<b class="ns-title">${esc(title)}</b>` : ''}<p>${asHTML ? msg : esc(msg)}</p>
		<button type="button" class="ns-close" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>`;
	let timer = 0;
	const dismiss = () => { clearTimeout(timer); el.classList.add('is-out'); setTimeout(() => el.remove(), 300); };
	el.querySelector('.ns-close').addEventListener('click', dismiss);
	tray.append(el);
	if (ttl) timer = setTimeout(dismiss, ttl);
	return { el, dismiss };
}

/* ---------- the browser bar follows the theme ---------- */
const dark = () => html.dataset.theme === 'dark';
function syncThemeColor() {
	const m = document.querySelector('meta[name="theme-color"]');
	if (m) m.setAttribute('content', dark() ? '#141a2e' : '#0E6990');
}

/* ---------- install ---------- */
const canInstall = () => !standalone && (deferred || ios);
function install() {
	if (deferred) {
		deferred.prompt();
		deferred.userChoice.then(() => { deferred = null; place(); });
		return;
	}
	if (ios) notify(Y('في سفاري: دوس على <b>مشاركة</b> ⎋ وبعدين <b>إضافة إلى الشاشة الرئيسية</b> ♥', 'في سفاري: دوسي على <b>مشاركة</b> ⎋ وبعدين <b>إضافة إلى الشاشة الرئيسية</b> ♥', 'In Safari, tap <b>Share</b> ⎋, then <b>Add to Home Screen</b> ♥'),
		{ title: Y('حط حكايتنا على الشاشة', 'حطي حكايتنا على الشاشة', 'Put our story on your home screen'), html: true, ttl: 10000 });
}
/* Chrome on a phone sends appinstalled as soon as the install is accepted, while it is still adding the icon, and often
   again once it is there: the first says it's on its way, the second (or ten seconds later) that it's there — once. */
let installing = null, wait = 0, told = false;
function installed() {
	if (told) return;
	told = true; clearTimeout(wait);
	installing?.dismiss();
	notify(L('حكايتنا بقت على الشاشة الرئيسية ♥', 'Our story is on your home screen now ♥'), { type: 'ok' });
}

/* ---------- save every photo and video for offline ---------- */
const MEDIA_CACHE = 'media-v1'; // the service worker's own photo cache
const canSave = () => 'caches' in window && 'serviceWorker' in navigator && !store.get('us.offline') && (App.story?.$media || []).length > 0;
let saving = false;
async function saveOffline() {
	if (saving || !('caches' in window)) return;
	const list = [...new Set((App.story?.$media || []).map(binURL).filter(Boolean))];
	if (!list.length) return;
	const mb = App.story.$mediaMB;
	if (!confirm(L(`هنحفظ ${list.length} صورة وفيديو${mb ? ` (حوالي ${mb} ميجا)` : ''} على الموبايل ده، عشان حكايتنا تفتح من غير نت. نكمل؟`,
		`This keeps ${list.length} photos and videos${mb ? ` (about ${mb} MB)` : ''} on this device, so our story opens without the internet. Go ahead?`))) return;
	saving = true;
	const n = notify(L('بنحفظ…', 'Saving…'), { title: L('من غير نت', 'For offline'), ttl: 0 });
	const p = $('p', n.el);
	let done = 0, failed = 0, i = 0;
	const c = await caches.open(MEDIA_CACHE);
	const next = async () => {
		while (i < list.length) {
			const u = list[i++];
			try { if (!(await c.match(u))) await c.add(u); } catch { failed++; }
			p.textContent = `${++done} / ${list.length}`;
		}
	};
	await Promise.all([next(), next(), next(), next()]);
	saving = false; n.dismiss();
	if (!failed) store.set('us.offline', String(Date.now()));
	notify(failed ? Y(`اتحفظ أغلبها؛ ${failed} معرفناش نحفظهم — جرّب تاني لما النت يبقى أحسن.`, `اتحفظ أغلبها؛ ${failed} معرفناش نحفظهم — جرّبي تاني لما النت يبقى أحسن.`, `Mostly saved; ${failed} couldn’t be — try again on a better connection.`)
		: L('كل صورنا وفيديوهاتنا بقت على الموبايل ده ♥', 'Every photo and video of ours is on this device now ♥'), { type: failed ? 'warn' : 'ok' });
	place();
}

/* ---------- the buttons: header and footer (both are redrawn when the language changes) ---------- */
function place() {
	const tools = $('.site-header .tools');
	if (tools) {
		let b = $('.install-app', tools);
		if (!canInstall()) b?.remove();
		else if (!b) {
			b = Object.assign(document.createElement('button'), { type: 'button', className: 'icon-btn install-app', title: Y('حطها كتطبيق', 'حطيها كتطبيق', 'Install as an app'), innerHTML: ICON_INSTALL });
			b.setAttribute('aria-label', b.title);
			b.onclick = install;
			tools.prepend(b);
		}
	}
	const ib = $('#install-btn'), sb = $('#save-btn');
	if (ib) { ib.hidden = !canInstall(); ib.onclick = install; }
	if (sb) { sb.hidden = !canSave(); sb.onclick = saveOffline; }
}

/* the installed app has no browser bar, so no back button: give it one (not on the home page) */
function backButton() {
	const wrap = $('.site-header .hd-wrap');
	if (!standalone || !wrap || $('.app-back', wrap) || document.body.dataset.page === 'home') return;
	const b = Object.assign(document.createElement('button'), { type: 'button', className: 'icon-btn app-back', innerHTML: ICON_BACK });
	b.setAttribute('aria-label', L('رجوع', 'Back'));
	b.onclick = () => (history.length > 1 ? history.back() : (location.href = 'index.html'));
	wrap.prepend(b);
}

/* ---------- after a while: offer the app and offline ----------
   Time spent on the site (a page in view, counted across pages and visits) adds up; after three minutes a card offers to
   install it and to save it for offline — whichever is still to do. «Later» puts it off for two weeks; never in the app. */
const INVITE_AFTER = 3 * 60 * 1000, INVITE_PAUSE = 14 * 864e5, TICK = 15000;
let invited = false, ticking = false;
function invite() {
	if (invited || standalone || document.visibilityState !== 'visible') return;
	if (Date.now() - (+store.get('us.invite-off') || 0) < INVITE_PAUSE) return;
	const i = canInstall(), s = canSave();
	if (!i && !s) return;
	invited = true;
	const n = notify(
		(i && s ? Y('حطها على الشاشة تفتح بدوسة زي أي تطبيق، واحفظ صورنا عليه عشان تفتح من غير نت.', 'حطيها على الشاشة تفتح بدوسة زي أي تطبيق، واحفظي صورنا عليه عشان تفتح من غير نت.', 'Put it on your home screen to open in one tap like an app, and keep our photos on it so it opens without the internet.')
			: i ? Y('حطها على الشاشة تفتح بدوسة زي أي تطبيق — واللي فتحته قبل كده بيفتح من غير نت.', 'حطيها على الشاشة تفتح بدوسة زي أي تطبيق — واللي فتحتيه قبل كده بيفتح من غير نت.', 'Put it on your home screen to open in one tap like an app — what you’ve opened before works offline.')
			: Y('احفظ صورنا وفيديوهاتنا على الموبايل عشان حكايتنا تفتح من غير نت.', 'احفظي صورنا وفيديوهاتنا على الموبايل عشان حكايتنا تفتح من غير نت.', 'Keep our photos and videos on this device so our story opens without the internet.')) +
		`<span class="ns-actions">${i ? `<button type="button" class="ns-action" data-do="install">${Y('حطها كتطبيق', 'حطيها كتطبيق', 'Install')}</button>` : ''}${s ? `<button type="button" class="ns-action" data-do="save">${Y('احفظها من غير نت', 'احفظيها من غير نت', 'Save for offline')}</button>` : ''}<button type="button" class="ns-action ns-later" data-do="later">${L('بعدين', 'Later')}</button></span>`,
		{ title: Y('حكايتنا معاك في كل حتة', 'حكايتنا معاكي في كل حتة', 'Take our story everywhere'), html: true, ttl: 0 });
	n.el.addEventListener('click', (ev) => {
		if (ev.target.closest('.ns-close')) return store.set('us.invite-off', String(Date.now())); // closing it counts as «later»
		const what = ev.target.closest('[data-do]')?.dataset.do;
		if (!what) return;
		store.set('us.invite-off', String(Date.now()));
		n.dismiss();
		if (what === 'install') install();
		else if (what === 'save') saveOffline();
	});
}
function countReading() {
	if (standalone || ticking) return;
	ticking = true;
	setInterval(() => {
		if (document.visibilityState !== 'visible' || invited) return;
		const t = (+store.get('us.read-ms') || 0) + TICK;
		store.set('us.read-ms', String(t));
		if (t >= INVITE_AFTER) invite();
	}, TICK);
}

/** Once the site is open (header and footer drawn): the buttons, the back button and the reading clock. */
export function pwaChrome() {
	place();
	backButton();
	countReading();
}

/* ---------- service worker and new versions ---------- */
let updateCard = null;
function offerUpdate(worker) {
	updateCard?.dismiss(); // one card, for the newest version
	const n = updateCard = notify(Y('فيه نسخة أجدد من حكايتنا. <button type="button" class="ns-action">حدّث دلوقتي</button>', 'فيه نسخة أجدد من حكايتنا. <button type="button" class="ns-action">حدّثي دلوقتي</button>', 'A newer version of our story is ready. <button type="button" class="ns-action">Update now</button>'),
		{ title: L('جديد ♥', 'New ♥'), html: true, ttl: 0 });
	$('.ns-action', n.el).onclick = () => { reloading = true; worker.postMessage('skipWaiting'); n.dismiss(); };
}
let reloading = false;

/** Once, as the page starts (before the gate). */
export function initPWA() {
	if (standalone) html.classList.add('is-app');
	syncThemeColor();
	new MutationObserver(syncThemeColor).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

	/* Chrome's offer to install. Each page's first script catches it (it can come before this module loads), and it is
	   not held back, so the browser still shows its own install banner and icon as well as our button. */
	deferred = window.__bip || null;
	addEventListener('beforeinstallprompt', (e) => { deferred = e; place(); });
	addEventListener('appinstalled', () => {
		deferred = null; place();
		if (told) return;
		if (!mobile || installing) return installed();
		installing = notify(L('بنحطها على الشاشة دلوقتي… لحظة.', 'Adding it to your home screen… a moment.'), { ttl: 10000 });
		wait = setTimeout(installed, 10000);
	});
	addEventListener('offline', () => notify(Y('النت فصل. الصفحات اللي فتحتها قبل كده لسه شغالة ♥', 'النت فصل. الصفحات اللي فتحتيها قبل كده لسه شغالة ♥', 'You’re offline. Pages you’ve opened before still work ♥'), { type: 'warn', ttl: 6000 }));
	addEventListener('online', () => notify(L('النت رجع.', 'Back online.'), { type: 'ok', ttl: 2500 }));

	if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
	navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
	navigator.serviceWorker.register('sw.js', { scope: './' }).then((reg) => {
		if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
		reg.addEventListener('updatefound', () => {
			const w = reg.installing;
			// only an update, not the first install
			w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w); });
		});
		// look for a new version when the app comes back to the front
		document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
	}).catch(() => {});
}
