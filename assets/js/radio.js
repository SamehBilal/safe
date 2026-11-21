/* The song that keeps playing while we walk around the site, like SoundCloud: one player for every page, and a bar
   along the bottom (a little spinning record, the song, back / play / next, how far in) that shows up once a song
   has been played and stays until it's closed. While it's up, links swap only the page itself (shell.js) so the
   music carries on. Songs with their own recording play here; a YouTube or Spotify song plays in a small screen
   above the bar; anything else opens in its own app. The music page's turntable follows whatever this is playing.
   The list button opens the playlist above the bar: shuffle, repeat (the list / this one / none), sort it, drag a
   song by its handle to move it, or take it out. Shuffle and repeat are remembered on this phone. */
import { L, Y, App, $, esc, store, mediaURL } from './shell.js';

/* every song gets its own sleeve colours, the same on both phones */
const PALETTE = [['#c2185b', '#ffd1dc'], ['#0e6990', '#cfe9f5'], ['#e39b2d', '#fff0cf'], ['#5a9e6f', '#dcf1df'], ['#6d4bb3', '#e6dcff'], ['#d9534f', '#ffe0dc'], ['#26706b', '#d2f0ec'], ['#8a5a2b', '#f3e2cc']];
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const colours = (x) => PALETTE[hash(x.id || x.title) % PALETTE.length];

export const safeLink = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
export const searchLink = (x) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${x.title} ${x.artist || ''}`.trim())}`;

/* Links we can play right here; anything else opens in its own app. */
export function player(link) {
	const yt = /(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/.exec(link || '');
	// enablejsapi: the bar talks to the video (pause where it is, play on, jump, hear when it ends).
	// referrerpolicy: our pages send no referrer, and YouTube now refuses to play for a site that won't say who it is
	// (error 153), so this one frame tells it our address: just the site, never the page.
	if (yt) return `<iframe class="is-yt" referrerpolicy="origin" src="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}" title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
	const sp = /open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode)\/(\w+)/.exec(link || '');
	if (sp) return `<iframe class="is-spotify" src="https://open.spotify.com/embed/${sp[1]}/${sp[2]}?autoplay=1" title="Spotify" allow="autoplay; encrypted-media; clipboard-write"></iframe>`;
	return '';
}
const playable = (x) => !!(x && (x.audio || player(safeLink(x.link))));

const song = new Audio();
song.preload = 'none';
let queue = [];     // what back / next go through, in the order they'll play
let base = [];      // the same songs before shuffling
let orig = [];      // the order the list came in («as it was»)
// read straight from the phone: shell.js (and its store) is still loading when this file runs
const saved = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
let shuffle = saved('us.np.shuffle') === '1';
let repeat = ['off', 'one', 'all'].includes(saved('us.np.repeat')) ? saved('us.np.repeat') : 'all';
let listOpen = false;
let item = null;
let mode = '';      // 'audio' | 'yt' (a YouTube video we can steer) | 'embed' (Spotify) while a song is loaded
const yt = { time: 0, duration: 0, at: 0, ready: false };   // what the YouTube video last told us
let playing = false;
let asked = 0;
let bar = null;
const fans = new Set();

/** What's on now: { item, playing, mode, time, duration }. */
export const state = () => ({ item, playing, mode, shuffle, repeat, queue: queue.slice(), ...clock() });
function clock() {
	if (mode === 'yt') {
		// the video reports a few times a second; fill the gaps so the bar glides
		const t = yt.time + (playing && yt.at ? (performance.now() - yt.at) / 1000 : 0);
		return { time: yt.duration ? Math.min(t, yt.duration) : t, duration: yt.duration };
	}
	return { time: song.currentTime || 0, duration: isFinite(song.duration) ? song.duration : 0 };
}
/** True while the bar is up, so links should keep the music going. */
export const active = () => !!item;
/** Hear about every change (what: 'change' | 'meta' | 'time'). Returns the way to stop listening. */
export function on(fn) { fans.add(fn); return () => fans.delete(fn); }
const tell = (what = 'change') => { paint(what); for (const f of fans) { try { f(what, state()); } catch { /* a page's own trouble */ } } };

/** Play a song; the list it came from becomes what back / next go through. */
export function play(x, list) {
	if (!x) return;
	if (list?.length) { orig = list.slice(); base = list.slice(); queue = shuffle ? mix(base, x) : base.slice(); }
	else if (!queue.some((q) => q.id === x.id)) { orig = [x]; base = [x]; queue = [x]; }
	if (!playable(x)) { window.open(safeLink(x.link) || searchLink(x), '_blank', 'noopener'); return; }
	halt();
	item = x;
	playing = true;
	mount();
	const ask = ++asked;
	if (x.audio) {
		mode = 'audio';
		mediaURL(x.audio).then((url) => {
			if (ask !== asked || !playing) return;
			if (song.src !== url) song.src = url;
			return song.play();
		}).catch(() => {
			if (ask !== asked) return;
			const link = safeLink(x.link);
			if (player(link)) { embed(link); tell(); }
			else { stop(); window.open(link || searchLink(x), '_blank', 'noopener'); }
		});
	} else embed(safeLink(x.link));
	media();
	tell();
}

/* a song that lives on YouTube or Spotify plays in the little screen above the bar */
function embed(link) {
	const html = player(link);
	mode = html.includes('is-yt') ? 'yt' : 'embed';
	Object.assign(yt, { time: 0, duration: 0, at: 0, ready: false });
	ytLast = -1;
	screen(html);
	if (mode === 'yt') listen();
}

/* ---------- talking to the YouTube video (its iframe API, by messages: no script of theirs on our page) ---------- */
const ytFrame = () => bar && $('.np__screen iframe.is-yt', bar);
function ytSay(func, args = []) {
	ytFrame()?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}
/* ask the video to keep us posted; it answers once it's ready, so knock a few times until it does */
function listen() {
	const f = ytFrame();
	if (!f) return;
	const knock = () => f.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'np', channel: 'widget' }), '*');
	f.addEventListener('load', knock, { once: true });
	let n = 0;
	const again = setInterval(() => { if (yt.ready || ++n > 20 || !f.isConnected) clearInterval(again); else knock(); }, 500);
}
addEventListener('message', (e) => {
	const f = ytFrame();
	if (!f || e.source !== f.contentWindow || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
	let m;
	try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
	if (!m || typeof m !== 'object') return;
	if (m.event === 'onReady') yt.ready = true;
	const info = m.info && typeof m.info === 'object' ? m.info : {};
	if (m.event === 'infoDelivery' || m.event === 'initialDelivery') {
		yt.ready = true;
		const newLength = typeof info.duration === 'number' && info.duration > 0 && info.duration !== yt.duration;
		if (newLength) yt.duration = info.duration;
		if (typeof info.currentTime === 'number') { yt.time = info.currentTime; yt.at = performance.now(); }
		if (typeof info.playerState === 'number') ytState(info.playerState);
		if (newLength) tell('meta'); else paint('time');
	}
	if (m.event === 'onStateChange') ytState(typeof m.info === 'number' ? m.info : info.playerState);
});
let ytLast = -1;
/* the video's own state: 1 playing, 2 paused, 0 ended */
function ytState(s) {
	if (s === ytLast || mode !== 'yt') return;
	ytLast = s;
	if (s === 1 && !playing) { playing = true; tell(); }
	else if (s === 2 && playing) { playing = false; yt.at = 0; tell(); }
	else if (s === 0) {
		yt.time = yt.duration;
		if (repeat === 'one') { ytSay('seekTo', [0, true]); ytSay('playVideo'); }
		else step(1, true);
	}
}

export function pause() {
	if (!item || !playing) return;
	playing = false;
	asked++;
	if (mode === 'audio') song.pause();
	else if (mode === 'yt') { yt.time = clock().time; yt.at = 0; ytSay('pauseVideo'); }
	else screen('');
	tell();
}

export function resume() {
	if (!item || playing) return;
	if (mode === 'embed' || (mode === 'yt' && !ytFrame())) return play(item);
	if (mode === 'yt') { playing = true; yt.at = performance.now(); ytSay('playVideo'); tell(); return; }
	playing = true;
	const ask = ++asked;
	(song.src ? song.play() : mediaURL(item.audio).then((url) => { if (ask === asked) { song.src = url; return song.play(); } })).catch(() => {});
	tell();
}

export const toggle = () => (playing ? pause() : resume());

/** Back / next through the list, skipping songs that can only open elsewhere. When a song ends by itself (auto) and
    repeat is off, the last one stops there instead of going round again. */
export function step(dir, auto = false) {
	if (!queue.length) return;
	let i = queue.findIndex((q) => q.id === item?.id);
	for (let n = 0; n < queue.length; n++) {
		const j = i + dir;
		if (auto && repeat === 'off' && (j >= queue.length || j < 0)) { playing = false; asked++; song.currentTime = 0; tell(); return; }
		i = (j + queue.length) % queue.length;
		if (playable(queue[i])) return play(queue[i]);
	}
}

/* a fresh shuffle, the song that's on (if any) first */
function mix(list, first) {
	const rest = list.filter((q) => q.id !== first?.id);
	for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
	return first && list.some((q) => q.id === first.id) ? [first, ...rest] : rest;
}
const has = (list) => (x) => list.some((q) => q.id === x.id);

/** Shuffle on / off: off puts the list back the way it was before. */
export function setShuffle(on = !shuffle) {
	shuffle = !!on;
	store.set('us.np.shuffle', shuffle ? '1' : '0');
	queue = shuffle ? mix(queue, item) : base.filter(has(queue));
	tell();
}

/** Repeat: the whole list → this one song → none → … */
export function setRepeat(r) {
	repeat = r || { all: 'one', one: 'off', off: 'all' }[repeat];
	store.set('us.np.repeat', repeat);
	tell();
}

/** Sort the list: 'orig' (as it came), 'title', 'artist', or 'flip' (turn it round). Sorting ends the shuffle. */
export function sort(by) {
	const key = (x) => String((by === 'artist' ? x.artist : x.title) || '').toLocaleLowerCase();
	if (by === 'orig') queue = orig.filter(has(queue)).concat(queue.filter((q) => !orig.some((o) => o.id === q.id)));
	else if (by === 'flip') queue = queue.slice().reverse();
	else queue = queue.slice().sort((a, b) => key(a).localeCompare(key(b), App.lang) || String(a.title).localeCompare(String(b.title), App.lang));
	settle();
}

/** Put the list in this order (ids), after a song was dragged. */
export function reorder(ids) {
	const by = new Map(queue.map((q) => [q.id, q]));
	const next = ids.map((id) => by.get(id)).filter(Boolean);
	if (next.length !== queue.length) return;
	queue = next;
	settle();
}

/** Take a song out of the list (the one that's on keeps playing). */
export function drop(id) {
	const out = (x) => x.id !== id;
	queue = queue.filter(out); base = base.filter(out); orig = orig.filter(out);
	tell();
}

/* the order on screen is now ours: it's what «shuffle off» comes back to */
function settle() {
	base = queue.slice();
	if (shuffle) { shuffle = false; store.set('us.np.shuffle', '0'); }
	tell();
}

/** Stop and put the bar away. */
export function stop() {
	halt();
	item = null;
	mode = '';
	listOpen = false;
	if (bar?.isConnected) { $('.np__list', bar).hidden = true; bar.classList.remove('is-list'); }
	if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
	tell();
}

function halt() {
	playing = false;
	asked++;
	song.pause();
	// let go of the old song altogether: its «paused» arrives a moment later, and with the old song still loaded it would
	// read as «the phone paused it» — stopping the new song before it loads, and «play» bringing the old one back
	if (song.getAttribute('src')) { song.removeAttribute('src'); song.load(); }
	screen('');
}

export function seek(frac) {
	if (mode === 'yt') {
		if (!yt.duration) return;
		yt.time = Math.max(0, Math.min(1, frac)) * yt.duration;
		yt.at = playing ? performance.now() : 0;
		ytSay('seekTo', [yt.time, true]);
		return tell('time');
	}
	if (mode !== 'audio' || !isFinite(song.duration)) return;
	song.currentTime = Math.max(0, Math.min(1, frac)) * song.duration;
	tell('time');
}

song.onended = () => { if (repeat === 'one') { song.currentTime = 0; song.play().catch(() => {}); } else step(1, true); };
song.onloadedmetadata = () => tell('meta');
song.ontimeupdate = () => paint('time');
setInterval(() => { if (mode === 'yt' && playing) paint('time'); }, 500);   // a YouTube song's bar moves on between its reports
song.onpause = () => { if (playing && mode === 'audio' && !song.ended && song.src) { playing = false; tell(); } };   // the phone paused it (a call, the lock screen)
song.onplay = () => { if (!playing && item) { playing = true; tell(); } };

/* the phone's lock screen and headphone buttons */
function media() {
	if (!('mediaSession' in navigator) || !item) return;
	try {
		navigator.mediaSession.metadata = new MediaMetadata({ title: item.title, artist: item.artist || '', album: L('أغانينا', 'Our songs') });
		if (item.cover) mediaURL(item.cover).then((src) => { if (navigator.mediaSession.metadata && item) navigator.mediaSession.metadata.artwork = [{ src, sizes: '512x512' }]; }).catch(() => {});
		navigator.mediaSession.setActionHandler('play', resume);
		navigator.mediaSession.setActionHandler('pause', pause);
		navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
		navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
	} catch { /* older phones */ }
}

/* ---------- the bar ---------- */
const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ICON = {
	play: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor"/></svg>',
	pause: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/></svg>',
	prev: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 5v14M18 6v12a.8.8 0 0 1-1.2.7L8.5 12.7a.8.8 0 0 1 0-1.4l8.3-6A.8.8 0 0 1 18 6Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	next: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M18 5v14M6 6v12a.8.8 0 0 0 1.2.7l8.3-6a.8.8 0 0 0 0-1.4l-8.3-6A.8.8 0 0 0 6 6Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	close: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
	shuffle: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6c1.1 1.7 2.3 2.7 4.3 2.7H21M3 17h3.5c1.3 0 2.3-.4 3.1-1.2M14.4 8.2c.8-.8 1.8-1.2 3.1-1.2H21M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
	repeat: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20 5.5l-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5 4 18.5l3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/></svg>',
	one: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20 5.5l-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5 4 18.5l3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/><path d="M11 10.5l1.5-1v5" stroke-width="2"/></svg>',
	list: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h11M4 12h11M4 18h7M19 9v8.5M19 9l2 1"/><circle cx="17" cy="17.5" r="2" fill="currentColor"/></svg>',
	grip: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
	out: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
};
const REPEAT = () => ({
	all: [ICON.repeat, L('بيكرّر القايمة', 'Repeating the list')],
	one: [ICON.one, L('بيكرّر الأغنية دي', 'Repeating this song')],
	off: [ICON.repeat, L('من غير تكرار', 'No repeat')]
});

function mount() {
	if (bar?.isConnected) return;
	bar = document.createElement('div');
	bar.className = 'np';
	bar.id = 'np';
	bar.hidden = true;
	document.body.append(bar);
	draw();
}

/** Draw the bar's words again (the language changed). */
export function redraw() { if (bar?.isConnected) draw(); }

function draw() {
	// in Arabic "back" points right and sits on the right, so the arrows follow the reading direction
	const rtl = App.lang === 'ar';
	bar.setAttribute('role', 'region');
	bar.setAttribute('aria-label', L('الأغنية اللي شغالة', 'Now playing'));
	bar.innerHTML = `
		<div class="np__screen" hidden></div>
		<section class="np__list" id="np-list"${listOpen ? '' : ' hidden'} aria-label="${L('قايمة التشغيل', 'Playlist')}">
			<header class="np__lhd">
				<b>${L('قايمة التشغيل', 'Playlist')}</b><small class="np__count"></small>
				<span class="np__modes">
					<button type="button" class="chip np__mode" data-np="shuffle">${ICON.shuffle}<span>${L('عشوائي', 'Shuffle')}</span></button>
					<button type="button" class="chip np__mode" data-np="repeat"></button>
				</span>
			</header>
			<div class="np__sort" role="group" aria-label="${Y('رتّب القايمة', 'رتّبي القايمة', 'Sort the list')}">
				<span>${L('رتّب:', 'Sort:')}</span>
				<button type="button" class="chip" data-sort="orig">${L('زي ما هي', 'As it was')}</button>
				<button type="button" class="chip" data-sort="title">${L('بالاسم', 'By name')}</button>
				<button type="button" class="chip" data-sort="artist">${L('بالمطرب', 'By artist')}</button>
				<button type="button" class="chip" data-sort="flip">${L('اعكسها', 'Reverse')}</button>
			</div>
			<ol class="np__ol"></ol>
		</section>
		<div class="np__card">
			<div class="np__bar" role="slider" tabindex="0" aria-label="${L('وصلنا لفين في الأغنية', 'Position in the song')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
			<a class="np__song" href="music.html">
				<span class="np__lp" aria-hidden="true"><img alt="" hidden></span>
				<span class="np__words"><b class="np__title" dir="auto"></b><small class="np__artist" dir="auto"></small></span>
			</a>
			<span class="np__time" aria-hidden="true"></span>
			<div class="np__ctrls">
				<button class="np__btn np__btn--sm np__btn--mode" type="button" data-np="shuffle" aria-label="${L('عشوائي', 'Shuffle')}" title="${L('عشوائي', 'Shuffle')}">${ICON.shuffle}</button>
				<button class="np__btn" type="button" data-np="prev" aria-label="${L('اللي قبلها', 'Previous')}">${rtl ? ICON.next : ICON.prev}</button>
				<button class="np__btn np__btn--main" type="button" data-np="toggle"></button>
				<button class="np__btn" type="button" data-np="next" aria-label="${L('اللي بعدها', 'Next')}">${rtl ? ICON.prev : ICON.next}</button>
				<button class="np__btn np__btn--sm np__btn--mode" type="button" data-np="repeat"></button>
				<button class="np__btn np__btn--sm np__btn--list" type="button" data-np="list" aria-controls="np-list" aria-label="${L('قايمة التشغيل', 'Playlist')}" title="${L('قايمة التشغيل', 'Playlist')}">${ICON.list}</button>
			</div>
			<button class="np__x" type="button" data-np="close" aria-label="${Y('اقفل', 'اقفلي', 'Close')}" title="${Y('اقفل', 'اقفلي', 'Close')}">${ICON.close}</button>
		</div>`;
	bar.onclick = (e) => {
		const s = e.target.closest('[data-sort]');
		if (s) return sort(s.dataset.sort);
		const p = e.target.closest('[data-np-play]');
		if (p) { const x = queue.find((q) => q.id === p.dataset.npPlay); if (!x) return; return x.id === item?.id ? toggle() : play(x); }
		const r = e.target.closest('[data-np-rm]');
		if (r) return drop(r.dataset.npRm);
		const b = e.target.closest('[data-np]');
		if (!b) return;
		({ prev: () => step(-1), next: () => step(1), toggle, close: () => { openList(false); stop(); }, shuffle: () => setShuffle(), repeat: () => setRepeat(), list: () => openList(!listOpen) })[b.dataset.np]();
	};
	grips($('.np__ol', bar));
	const track = $('.np__bar', bar);
	const at = (e) => { const r = track.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; return document.documentElement.dir === 'rtl' ? 1 - f : f; };
	track.onpointerdown = (e) => {
		track.setPointerCapture(e.pointerId);
		seek(at(e));
		track.onpointermove = (m) => seek(at(m));
		track.onpointerup = track.onpointercancel = () => { track.onpointermove = null; };
	};
	track.onkeydown = (e) => {
		const d = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
		if (!d || (mode !== 'audio' && mode !== 'yt')) return;
		e.preventDefault();
		const { time, duration } = clock();
		if (duration) seek((time + d * (document.documentElement.dir === 'rtl' ? -1 : 1)) / duration);
	};
	screen(screenHTML);
	paint('change');
}

let screenHTML = '';
function screen(html) {
	screenHTML = html;
	const el = bar && $('.np__screen', bar);
	if (!el) return;
	el.innerHTML = html;
	el.hidden = !html;
}

/* ---------- the playlist ---------- */
function openList(on) {
	listOpen = !!on && !!item;
	if (!bar?.isConnected) return;
	$('.np__list', bar).hidden = !listOpen;
	bar.classList.toggle('is-list', listOpen);
	paint('change');
	if (listOpen) $('.np__ol .is-now', bar)?.scrollIntoView({ block: 'nearest' });
}

/* tap outside, or Esc, folds it away */
document.addEventListener('pointerdown', (e) => { if (listOpen && !e.target.closest('#np')) openList(false); });
document.addEventListener('keydown', (e) => { if (listOpen && e.key === 'Escape') openList(false); });

const howMany = (n) => (App.lang === 'ar' ? (n === 1 ? 'أغنية واحدة' : n === 2 ? 'أغنيتين' : `${n} ${n <= 10 ? 'أغاني' : 'أغنية'}`) : `${n} song${n === 1 ? '' : 's'}`);

function list() {
	const ol = bar && $('.np__ol', bar);
	if (!ol || !listOpen) return;
	const n = queue.length;
	$('.np__count', bar).textContent = howMany(n);
	const grip = Y('اسحب عشان تغيّر مكانها', 'اسحبي عشان تغيّري مكانها', 'Drag to move it');
	const rm = Y('شيلها من القايمة', 'شيليها من القايمة', 'Take it out of the list');
	ol.innerHTML = queue.map((x, i) => {
		const now = x.id === item?.id;
		const [ink] = colours(x);
		return `<li class="np__row${now ? ' is-now' : ''}${playable(x) ? '' : ' is-out'}" data-id="${esc(x.id)}" style="--c:${ink}">
			<button type="button" class="np__play" data-np-play="${esc(x.id)}"${now ? ' aria-current="true"' : ''}>
				<span class="np__n">${now ? '<span class="np__eq" aria-hidden="true"><i></i><i></i><i></i></span>' : i + 1}</span>
				<span class="np__rw"><b dir="auto">${esc(x.title)}</b>${x.artist ? `<small dir="auto">${esc(x.artist)}</small>` : ''}</span>
				${playable(x) ? '' : `<span class="np__ext" title="${L('بتفتح في التطبيق بتاعها', 'Opens in its own app')}">${ICON.out}</span>`}
			</button>
			${n > 1 ? `<button type="button" class="np__grip" data-grip aria-label="${grip} — ${esc(x.title)}" title="${grip}">${ICON.grip}</button>` : ''}
			<button type="button" class="np__rm" data-np-rm="${esc(x.id)}" aria-label="${rm} — ${esc(x.title)}" title="${rm}">${ICON.close}</button>
		</li>`;
	}).join('') || `<li class="np__empty">${L('القايمة فاضية', 'The list is empty')}</li>`;
}

/* drag a song by its handle (fingers too), or move it with the arrow keys */
function grips(ol) {
	ol.onpointerdown = (e) => {
		const g = e.target.closest('[data-grip]');
		if (!g) return;
		e.preventDefault();
		const li = g.closest('li');
		li.classList.add('is-drag');
		// listen on the window: moving the row in the page would drop a capture held by the handle
		const move = (m) => {
			if (m.pointerId !== e.pointerId) return;
			const box = ol.getBoundingClientRect();
			if (m.clientY < box.top + 24) ol.scrollTop -= 8;
			else if (m.clientY > box.bottom - 24) ol.scrollTop += 8;
			const over = document.elementFromPoint(box.left + box.width / 2, m.clientY)?.closest('.np__row');
			if (!over || over === li || over.parentNode !== ol) return;
			const r = over.getBoundingClientRect();
			ol.insertBefore(li, m.clientY > r.top + r.height / 2 ? over.nextSibling : over);
		};
		const end = (u) => {
			if (u.pointerId !== e.pointerId) return;
			removeEventListener('pointermove', move);
			removeEventListener('pointerup', end);
			removeEventListener('pointercancel', end);
			li.classList.remove('is-drag');
			reorder([...ol.children].map((l) => l.dataset.id));
		};
		addEventListener('pointermove', move);
		addEventListener('pointerup', end);
		addEventListener('pointercancel', end);
	};
	ol.onkeydown = (e) => {
		const g = e.target.closest('[data-grip]');
		const d = { ArrowUp: -1, ArrowDown: 1 }[e.key];
		if (!g || !d) return;
		e.preventDefault();
		const ids = [...ol.children].map((l) => l.dataset.id);
		const i = ids.indexOf(g.closest('li').dataset.id);
		const j = i + d;
		if (j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		reorder(ids);
		ol.children[j]?.querySelector('[data-grip]')?.focus();
	};
}

function paint(what) {
	if (!bar?.isConnected) return;
	const { time, duration } = state();
	const frac = duration ? time / duration : 0;
	$('.np__bar i', bar).style.transform = `scaleX(${frac})`;
	$('.np__bar', bar).setAttribute('aria-valuenow', String(Math.round(frac * 100)));
	$('.np__time', bar).textContent = (mode === 'audio' || mode === 'yt') && duration ? `${fmt(time)} / ${fmt(duration)}` : '';
	if (what === 'time') return;

	const show = !!item;
	if (bar.hidden === show) {
		bar.hidden = !show;
		document.body.classList.toggle('has-np', show);
	}
	if (!item) return;
	const [ink, paper] = colours(item);
	bar.style.setProperty('--np-ink', ink);
	bar.style.setProperty('--np-paper', paper);
	bar.classList.toggle('is-playing', playing);
	bar.classList.toggle('is-embed', mode === 'embed');
	const song$ = $('.np__song', bar);
	song$.href = `music.html#${encodeURIComponent(item.id || '')}`;
	song$.setAttribute('aria-label', `${item.title}${item.artist ? ' — ' + item.artist : ''}`);
	$('.np__title', bar).textContent = item.title;
	$('.np__artist', bar).textContent = item.artist || '';
	const img = $('.np__lp img', bar);
	if (img.dataset.for !== item.id) {
		img.dataset.for = item.id;
		img.hidden = true;
		img.removeAttribute('src');
		const x = item;
		if (x.cover) mediaURL(x.cover).then((url) => { if (item === x) { img.src = url; img.hidden = false; } }).catch(() => {});
	}
	const main = $('[data-np="toggle"]', bar);
	main.innerHTML = playing ? ICON.pause : ICON.play;
	main.setAttribute('aria-label', playing ? Y('وقّف', 'وقّفي', 'Pause') : Y('شغّل', 'شغّلي', 'Play'));
	const many = queue.filter(playable).length > 1;
	for (const b of bar.querySelectorAll('[data-np="prev"], [data-np="next"]')) b.disabled = !many;
	const [rIcon, rLabel] = REPEAT()[repeat];
	for (const b of bar.querySelectorAll('[data-np="shuffle"]')) { b.classList.toggle('is-on', shuffle); b.setAttribute('aria-pressed', String(shuffle)); }
	for (const b of bar.querySelectorAll('[data-np="repeat"]')) {
		b.classList.toggle('is-on', repeat !== 'off');
		b.setAttribute('aria-label', rLabel);
		b.title = rLabel;
		b.innerHTML = b.classList.contains('chip') ? `${rIcon}<span>${rLabel}</span>` : rIcon;
	}
	const lb = $('[data-np="list"]', bar);
	lb.classList.toggle('is-on', listOpen);
	lb.setAttribute('aria-expanded', String(listOpen));
	list();
}
