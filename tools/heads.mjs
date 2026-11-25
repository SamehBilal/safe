#!/usr/bin/env node
/* Writes the <head> of every page (*.html at the top of the site) from one template, so they never drift apart:
   the page's own title and description (from PAGES in assets/js/shell.js), the link-preview tags (WhatsApp, Telegram…),
   its stylesheets, and a modulepreload for every script the page needs, so they download side by side instead of
   one after another. Run it after adding a page or changing what a page imports:  node tools/heads.mjs
   It also keeps the songs player's list of pages in shell.js (PAGE_IDS and OWN_CSS) up to date: a link to a page on
   that list swaps the page in place so the song keeps playing, and a page left off it reloads and stops the music.
   tools/build.mjs runs this first, so a new page joins the list on the next build.
   Only names of pages go in here: everything about us stays encrypted in content/. */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://samehbilal.github.io/safe/';
const NAME = 'حكايتنا ♥';
const JS = path.join(ROOT, 'assets/js');

// PAGES, straight from the shell (no DOM needed to read an array literal)
const shell = await readFile(path.join(JS, 'shell.js'), 'utf8');
const PAGES = Function(`return ${shell.match(/export const PAGES = (\[[\s\S]*?\n\]);/)[1]}`)();
// pages that show one item each (moment.html?id=…), which aren't in the menu
const DETAIL = {
	moment: { ar: 'ذكرى', en: 'A moment', dar: 'يوم من حكايتنا، بصوره وحكايته', den: 'One day of our story, with its photos' },
	chapter: { ar: 'يوم فارق', en: 'A big day', dar: 'يوم من أيامنا الفارقة، بالصور', den: 'One of our big days, in photos' },
	member: { ar: 'عيلتنا', en: 'Our family', dar: 'صفحة كل واحد في عيلتنا', den: 'A page for each of our family' },
	trip: { ar: 'رحلة', en: 'A trip', dar: 'رحلة من رحلات عيد جوازنا', den: 'One of our anniversary trips' },
	journey: { ar: 'رحلة', en: 'A trip', dar: 'رحلة من رحلاتنا، محطة ورا محطة على الخريطة', den: 'One of our trips, stop by stop on the map' }
};

const BASE_CSS = ['app', 'chrome', 'live', 'trips', 'plans', 'bujo', 'widgets'];
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* every script a module pulls in with a static import, depth first */
async function deps(file, seen = new Set()) {
	if (seen.has(file)) return seen;
	seen.add(file);
	let src = '';
	try { src = await readFile(file, 'utf8'); } catch { return seen; }
	for (const m of src.matchAll(/^\s*(?:import|export)\s[^'";]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|^\s*import\s*['"](\.{1,2}\/[^'"]+)['"]/gm)) {
		await deps(path.resolve(path.dirname(file), m[1] || m[2]), seen);
	}
	return seen;
}
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

const files = (await readdir(ROOT)).filter((f) => f.endsWith('.html'));
let changed = 0;
const soft = [];   // [id, its own stylesheet] for every page, for the songs player
for (const file of files) {
	const html = await readFile(path.join(ROOT, file), 'utf8');
	const id = (html.match(/<body data-page="([\w-]+)"/) || [])[1];
	if (!id) continue;
	const p = PAGES.find((x) => x.id === id) || DETAIL[id];
	if (!p) { console.warn('· no page entry for', file); continue; }
	const title = id === 'home' ? NAME : `${p.ar} — ${NAME}`;
	const desc = id === 'home' ? 'حكاية حبنا من أول سلام لحد النهارده — مكان خاص لينا إحنا الاتنين بس.' : /الاتنين بس/.test(p.dar || "") ? `${p.dar}.` : `${p.dar || p.ar} · مكان خاص لينا إحنا الاتنين بس.`;
	const url = SITE + (file === 'index.html' ? '' : file);
	// the extra stylesheets this page had besides the shared ones
	const extra = [...html.matchAll(/assets\/css\/([\w-]+)\.css/g)].map((m) => m[1]).filter((c) => !BASE_CSS.includes(c));
	soft.push([id, extra[0] || '']);
	const pageJS = path.join(JS, 'pages', id + '.js');
	const scripts = [...await deps(path.join(JS, 'shell.js'))].concat([...await deps(pageJS)]);
	const pre = [...new Set(scripts.map(rel))];
	const body = html.slice(html.indexOf('<body'));
	const out = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<title>${attr(title)}</title>
	<meta name="description" content="${attr(desc)}">
	<meta name="robots" content="noindex, nofollow, noarchive, noimageindex">
	<meta name="referrer" content="no-referrer">
	<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
	<meta name="theme-color" content="#0E6990">
	<meta name="color-scheme" content="light">
	<meta name="application-name" content="${attr(NAME)}">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="default">
	<meta name="apple-mobile-web-app-title" content="S..&quot;!&quot;..E">
	<link rel="canonical" href="${url}">
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="${attr(NAME)}">
	<meta property="og:title" content="${attr(title)}">
	<meta property="og:description" content="${attr(desc)}">
	<meta property="og:url" content="${url}">
	<meta property="og:locale" content="ar_EG">
	<meta property="og:locale:alternate" content="en_US">
	<meta property="og:image" content="${SITE}assets/icons/icon-512.png">
	<meta property="og:image:width" content="512">
	<meta property="og:image:height" content="512">
	<meta property="og:image:alt" content="${attr(NAME)}">
	<meta name="twitter:card" content="summary">
	<meta name="twitter:title" content="${attr(title)}">
	<meta name="twitter:description" content="${attr(desc)}">
	<link rel="manifest" href="manifest.webmanifest">
	<link rel="icon" href="assets/icons/icon.svg" type="image/svg+xml">
	<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Bebas+Neue&family=Cairo:wght@400;600;800&family=Caveat:wght@500;700&family=Lalezar&family=Lobster&family=Nunito:wght@400;600;800&display=swap">
${BASE_CSS.concat(extra).map((c) => `\t<link rel="stylesheet" href="assets/css/${c}.css">`).join('\n')}
	<script>document.documentElement.dataset.theme='light';try{if(localStorage.getItem('us.lang')==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr'}if(localStorage.getItem('us.theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}addEventListener('beforeinstallprompt',function(e){window.__bip=e})</script>
${pre.map((s) => `\t<link rel="modulepreload" href="${s}">`).join('\n')}
</head>
${body.replace(/<\/script>\s+\n<\/body>/, '</script>\n</body>').replace(/[ \t]+\n/g, '\n')}`;
	if (out !== html) { await writeFile(path.join(ROOT, file), out); changed++; }
}
console.log(`✓ ${changed} of ${files.length} page(s) written`);

/* the songs player's pages in shell.js: every page above, so moving to any of them keeps the music going */
{
	const file = path.join(JS, 'shell.js');
	const src = await readFile(file, 'utf8');
	const ids = soft.map(([id]) => `'${id}'`).join(', ');
	const css = soft.filter(([, c]) => c).map(([id, c]) => `${id}: '${c}'`).join(', ');
	if (!/^const PAGE_IDS = new Set\(\[.*\]\);$/m.test(src) || !/^const OWN_CSS = \{.*\};$/m.test(src)) console.warn('· shell.js: PAGE_IDS / OWN_CSS not found — the songs player may stop on new pages');
	else {
		const out = src.replace(/^const PAGE_IDS = new Set\(\[.*\]\);$/m, () => `const PAGE_IDS = new Set([${ids}]);`)
			.replace(/^const OWN_CSS = \{.*\};$/m, () => `const OWN_CSS = { ${css} };`);
		if (out !== src) { await writeFile(file, out); console.log(`✓ songs player: ${soft.length} pages in shell.js`); }
	}
}
