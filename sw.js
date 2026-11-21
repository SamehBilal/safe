/* Service worker: installs the site as an app and keeps it working offline.
   - App shell + encrypted content: precached, refreshed in the background.
   - content/m/*.bin (encrypted photos): cached forever once seen — names change when files do.
   - Google Fonts and the places map's tiles: cached once seen.
   A new version waits until the page asks it to take over (its «Update now», assets/js/pwa.js).
   VERSION is rewritten by tools/build.mjs on every build. */
'use strict';

var VERSION = 'us-89e4b12a35';
var SHELL = [
	'./',
	'adventures.html',
	'anniversaries.html',
	'beforeus.html',
	'birthday.html',
	'books.html',
	'bucket.html',
	'calendar.html',
	'capsule.html',
	'chapter.html',
	'chapters.html',
	'chats.html',
	'chores.html',
	'cities.html',
	'distances.html',
	'draw.html',
	'drawings.html',
	'family.html',
	'familytree.html',
	'favorites.html',
	'firsts.html',
	'food.html',
	'gallery.html',
	'games.html',
	'giftideas.html',
	'gifts.html',
	'goals.html',
	'growth.html',
	'guestbook.html',
	'health.html',
	'hosting.html',
	'index.html',
	'journal.html',
	'journeys.html',
	'letters.html',
	'member.html',
	'minute.html',
	'moment.html',
	'movies.html',
	'music.html',
	'notes.html',
	'numbers.html',
	'offline.html',
	'onthisday.html',
	'ourfirsts.html',
	'places.html',
	'posts.html',
	'questions.html',
	'ramadan.html',
	'recipes.html',
	'remember.html',
	'sayings.html',
	'search.html',
	'secret.html',
	'settings.html',
	'soundtrack.html',
	'story.html',
	'tickets.html',
	'trip.html',
	'trips.html',
	'wishes.html',
	'yearly.html',
	'manifest.webmanifest',
	'assets/css/app.css',
	'assets/css/bujo.css',
	'assets/css/chrome.css',
	'assets/css/discshelf.css',
	'assets/css/home.css',
	'assets/css/letters.css',
	'assets/css/live.css',
	'assets/css/more.css',
	'assets/css/plans.css',
	'assets/css/secret.css',
	'assets/css/trips.css',
	'assets/js/bdmore.js',
	'assets/js/bdsky.js',
	'assets/js/caltip.js',
	'assets/js/core.js',
	'assets/js/cppconsole.js',
	'assets/js/defaults.js',
	'assets/js/doodles.js',
	'assets/js/egypt.js',
	'assets/js/figure.js',
	'assets/js/hang.js',
	'assets/js/listpage.js',
	'assets/js/live.js',
	'assets/js/merge.js',
	'assets/js/numslide.js',
	'assets/js/occ.js',
	'assets/js/orca.js',
	'assets/js/pwa.js',
	'assets/js/radio.js',
	'assets/js/scene.js',
	'assets/js/shell.js',
	'assets/js/sketch.js',
	'assets/js/stardust.js',
	'assets/js/tilemap.js',
	'assets/js/tree.js',
	'assets/js/pages/adventures.js',
	'assets/js/pages/anniversaries.js',
	'assets/js/pages/beforeus.js',
	'assets/js/pages/birthday.js',
	'assets/js/pages/books.js',
	'assets/js/pages/calendar.js',
	'assets/js/pages/capsule.js',
	'assets/js/pages/chapter.js',
	'assets/js/pages/chapters.js',
	'assets/js/pages/chats.js',
	'assets/js/pages/chores.js',
	'assets/js/pages/cities.js',
	'assets/js/pages/distances.js',
	'assets/js/pages/draw.js',
	'assets/js/pages/drawings.js',
	'assets/js/pages/family.js',
	'assets/js/pages/familytree.js',
	'assets/js/pages/favorites.js',
	'assets/js/pages/firsts.js',
	'assets/js/pages/food.js',
	'assets/js/pages/gallery.js',
	'assets/js/pages/games.js',
	'assets/js/pages/giftideas.js',
	'assets/js/pages/gifts.js',
	'assets/js/pages/goals.js',
	'assets/js/pages/growth.js',
	'assets/js/pages/guestbook.js',
	'assets/js/pages/health.js',
	'assets/js/pages/home.js',
	'assets/js/pages/hosting.js',
	'assets/js/pages/journal.js',
	'assets/js/pages/journeys.js',
	'assets/js/pages/letters.js',
	'assets/js/pages/member.js',
	'assets/js/pages/minute.js',
	'assets/js/pages/moment.js',
	'assets/js/pages/movies.js',
	'assets/js/pages/music.js',
	'assets/js/pages/notes.js',
	'assets/js/pages/numbers.js',
	'assets/js/pages/offline.js',
	'assets/js/pages/onthisday.js',
	'assets/js/pages/ourfirsts.js',
	'assets/js/pages/places.js',
	'assets/js/pages/posts.js',
	'assets/js/pages/questions.js',
	'assets/js/pages/ramadan.js',
	'assets/js/pages/recipes.js',
	'assets/js/pages/remember.js',
	'assets/js/pages/sayings.js',
	'assets/js/pages/search.js',
	'assets/js/pages/secret.js',
	'assets/js/pages/settings.js',
	'assets/js/pages/soundtrack.js',
	'assets/js/pages/story.js',
	'assets/js/pages/tickets.js',
	'assets/js/pages/trip.js',
	'assets/js/pages/trips.js',
	'assets/js/pages/wishes.js',
	'assets/js/pages/yearly.js',
	'assets/icons/apple-touch-icon.png',
	'assets/icons/icon-192.png',
	'assets/icons/icon-512.png',
	'assets/icons/icon.svg',
	'assets/icons/maskable-192.png',
	'assets/icons/maskable-512.png',
	'assets/icons/maskable.svg',
	'assets/audio/crackle.mp3',
	'content/gate.json',
	'content/vault.json'
];
var SHELL_CACHE = 'shell-' + VERSION;
var MEDIA_CACHE = 'media-v1';
var FONT_CACHE = 'fonts-v1';

self.addEventListener('install', function (e) {
	e.waitUntil(caches.open(SHELL_CACHE).then(function (c) {
		return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
	}));
});

self.addEventListener('message', function (e) {
	if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
	e.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (k) {
			return k.indexOf('shell-') === 0 && k !== SHELL_CACHE;
		}).map(function (k) { return caches.delete(k); }));
	}).then(function () { return self.clients.claim(); }));
});

function cacheFirst(req, name) {
	return caches.open(name).then(function (c) {
		return c.match(req).then(function (hit) {
			return hit || fetch(req).then(function (res) {
				if (res.ok || res.type === 'opaque') c.put(req, res.clone());
				return res;
			});
		});
	});
}

// Network first (fresh content after a rebuild), cache when offline or slow.
function networkFirst(req, key) {
	return caches.open(SHELL_CACHE).then(function (c) {
		var net = fetch(req).then(function (res) {
			if (res.ok) c.put(key || req, res.clone());
			return res;
		});
		var timeout = new Promise(function (resolve) { setTimeout(resolve, 3500); });
		return Promise.race([net, timeout.then(function () { return c.match(key || req, { ignoreSearch: true }); })])
			.then(function (r) { return r || net; })
			.catch(function () { return c.match(key || req, { ignoreSearch: true }); })
			.then(function (r) { return r || c.match('index.html'); });
	});
}

self.addEventListener('fetch', function (e) {
	var req = e.request;
	if (req.method !== 'GET') return;
	var url = new URL(req.url);

	if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
		e.respondWith(cacheFirst(req, FONT_CACHE));
		return;
	}
	// the places map's tiles: kept once seen, so the map works offline too
	if (url.hostname === 'tile.openstreetmap.org') {
		e.respondWith(cacheFirst(req, 'tiles-v1'));
		return;
	}
	if (url.origin !== location.origin) return;

	// photos and videos here, and our songs on the songs site (same address, its own folder): kept once seen
	if (url.pathname.indexOf('/content/m/') !== -1 || url.pathname.indexOf('/safe-songs/m/') === 0) {
		e.respondWith(cacheFirst(req, MEDIA_CACHE));
		return;
	}
	if (req.mode === 'navigate') {
		// moment.html?id=… is one page filled in from the data: cache it without the query
		var file = url.pathname.split('/').pop() || 'index.html';
		e.respondWith(networkFirst(req, file));
		return;
	}
	e.respondWith(networkFirst(req));
});
