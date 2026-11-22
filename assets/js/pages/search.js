import { App, L, Y, T, t, esc, num, fmtDate, pageHead, related, icon, PAGES, store, $ } from '../shell.js';
import { load, KINDS } from '../live.js';
import { doodle } from '../doodles.js';

/* دوّر — one search over everything: the pages themselves, the story (dates, big days, places, notes, the family,
   the album) and every list you both keep from your phones. It all happens on this phone, after the site is
   unlocked: nothing typed here leaves it. Results come grouped by page, the words found marked with a highlighter,
   and each one opens its page scrolled to the right spot (#find=…, see findOnPage in shell.js).
   Left out on purpose: «أوضتنا» (behind its own PIN), the secret gift ideas, and the time-capsule letters. */

const HIDDEN = new Set(['secret', 'giftideas', 'capsule']);
// which page shows each list (when it isn't the page of the same name)
const PAGE_OF = { where: 'distances', spots: 'cities', tree: 'family', trips: 'anniversaries', bucket: 'adventures', recipes: 'food', soundtrack: 'music' };
const RECENT = 'us.search.recent';
const MIN = 2;

/* Forgiving match: case, Arabic letter forms, tashkeel and Arabic digits don't matter (like the gate's answers). */
export const fold = (s) => String(s ?? '').normalize('NFKC').toLowerCase()
	.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
	.replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

/* All the readable text in a value, in both languages: strings, { ar, en }, arrays, nested objects.
   Ids, dates, file names, links and colours are skipped. */
const SKIP = /^(id|at|by|who|photo|photos|cover|audio|sketch|color|icon|emoji|href|link|url|lat|lng|x|y|z|kind|k|done|fav|rating|order)$/i;
function texts(v, out = [], depth = 0) {
	if (v == null || depth > 5) return out;
	if (typeof v === 'string') {
		if (v.length > 1 && !/^(media:|song:|https?:|data:|#[0-9a-f]{3,8}$|\d{4}-\d{2}(-\d{2})?$)/i.test(v)) out.push(v);
	} else if (typeof v === 'number') return out;
	else if (Array.isArray(v)) v.forEach((x) => texts(x, out, depth + 1));
	else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!SKIP.test(k)) texts(x, out, depth + 1);
	return out;
}
const TITLE_KEYS = ['title', 'name', 'what', 'q', 'question', 'text', 'song', 'dish', 'place', 'word', 'label', 'body', 'note'];
const titleOf = (x) => { for (const k of TITLE_KEYS) { const v = t(x?.[k]); if (v && typeof v === 'string') return v; } return texts(x)[0] || ''; };
const dateOf = (x) => [x?.date, x?.day, x?.when, x?.done].find((d) => /^\d{4}-\d{2}/.test(String(d || ''))) || '';

/* Every object with an id (or a title) inside a list's data, wherever the list keeps them. */
function records(data, depth = 0, out = []) {
	if (!data || depth > 4) return out;
	if (Array.isArray(data)) {
		for (const x of data) {
			if (x && typeof x === 'object' && !Array.isArray(x) && (x.id || titleOf(x))) out.push(x);
			else records(x, depth + 1, out);
		}
	} else if (typeof data === 'object') for (const v of Object.values(data)) records(v, depth + 1, out);
	return out;
}

const pageOf = (id) => PAGES.find((p) => p.id === id);
let index = null;

/* The whole index: [{ page, title, sub, date, href, hay }] — built once per visit. */
async function build(s) {
	const out = [];
	const add = (pageId, x, title, sub, href) => {
		const all = texts(x);
		if (!title && !all.length) return;
		out.push({ page: pageId, title: title || all[0], sub: sub || '', date: dateOf(x), href, all, hay: fold([title, sub, ...all].join('   ')) });
	};
	// the pages themselves (all of them: only what's inside the private ones is left out)
	for (const p of PAGES) out.push({ page: 'pages', title: L(p.ar, p.en), sub: L(p.dar || '', p.den || ''), href: p.href, ic: p.ic, all: [], hay: fold([p.ar, p.en, p.dar, p.den].join(' ')) });
	// the story
	for (const x of s.timeline || []) add('story', x, t(x.title), t(x.text), `moment.html?id=${encodeURIComponent(x.id)}`);
	for (const x of s.chapters || []) add('chapters', x, t(x.title), t(x.sub), `chapter.html?id=${encodeURIComponent(x.id)}`);
	for (const x of s.places || []) add('places', x, t(x.title), t(x.where), 'places.html');
	for (const x of s.notes || []) add('notes', x, t(x.text), t(x.by === 'him' ? s.him : s.her), 'notes.html');
	// letters wait to be opened: only who wrote them and their titles are searched, never what's inside
	for (const x of s.letters || []) add('letters', { title: x.title, from: x.from, to: x.to }, t(x.title), '', 'letters.html');
	for (const m of s.family?.members || []) add('family', m, t(m.name), t(m.role), `member.html?id=${encodeURIComponent(m.id)}`);
	const albums = new Map();
	for (const g of s.gallery || []) {
		const a = t(g.album) || '';
		if (t(g.caption)) add('gallery', { caption: g.caption, album: g.album, date: g.date }, t(g.caption), a, 'gallery.html');
		else if (a && !albums.has(a)) albums.set(a, g);
	}
	for (const [a, g] of albums) add('gallery', { album: a, date: g.date }, a, '', 'gallery.html');
	// the lists from the phones
	const kinds = KINDS.filter((k) => !HIDDEN.has(k));
	const lists = await Promise.all(kinds.map((k) => load(k).catch(() => null)));
	kinds.forEach((k, n) => {
		const pageId = PAGE_OF[k] || k;
		const p = pageOf(pageId);
		if (!p || !lists[n]) return;
		for (const x of records(lists[n])) add(pageId, x, titleOf(x), '', p.href);
	});
	return out;
}

/* Searching by date. Day first, the way we write dates: 12-10-2017, 12/10/2017, 12.10.2017, ١٢-١٠-٢٠١٧, 2017-10-12,
   «12 أكتوبر 2017», «October 2017», 10-2017, 2017 — or a day in every year: 12-10, «14 يوليو». Any other words
   typed with the date narrow it down («2017 كورنيش»). Returns { label, test(iso), exact, rest } or null. */
const MONTHS = [
	['يناير', 'jan', 'january'], ['فبراير', 'feb', 'february'], ['مارس', 'mar', 'march'], ['ابريل', 'apr', 'april'],
	['مايو', 'may'], ['يونيو', 'يونيه', 'jun', 'june'], ['يوليو', 'يوليه', 'jul', 'july'], ['اغسطس', 'aug', 'august'],
	['سبتمبر', 'sep', 'sept', 'september'], ['اكتوبر', 'oct', 'october'], ['نوفمبر', 'nov', 'november'], ['ديسمبر', 'dec', 'december']
];
const MONTH_OF = new Map(MONTHS.flatMap((names, i) => names.map((n) => [n, i + 1])));
const MONTH_RE = [...MONTH_OF.keys()].sort((a, b) => b.length - a.length).join('|');
const MONTH_NAME = (m) => L(MONTHS[m - 1][0].replace('ابريل', 'أبريل').replace('اغسطس', 'أغسطس').replace('اكتوبر', 'أكتوبر'), MONTHS[m - 1].at(-1)[0].toUpperCase() + MONTHS[m - 1].at(-1).slice(1));
export function dateQuery(q) {
	const s = ` ${fold(q).replace(/[،,]/g, ' ').replace(/\s+/g, ' ').trim()} `;
	const pad = (n) => String(n).padStart(2, '0');
	const full = (y) => (String(y).length === 2 ? `20${y}` : String(y));
	const day = (d, m) => d >= 1 && d <= 31 && m >= 1 && m <= 12;
	const out = (found, y, m, d) => {
		const rest = s.replace(found, ' ').trim();
		if (y && m && d && new Date(Date.UTC(+y, m - 1, d)).getUTCDate() !== d) return null; // 31 February
		if (y && m && d) { const iso = `${y}-${pad(m)}-${pad(d)}`; return { label: `${d} ${MONTH_NAME(m)} ${y}`, iso, exact: true, rest, test: (x) => String(x).slice(0, 10) === iso }; }
		if (y && m) { const p = `${y}-${pad(m)}`; return { label: `${MONTH_NAME(m)} ${y}`, rest, test: (x) => String(x).startsWith(p) }; }
		if (m && d) { const p = `-${pad(m)}-${pad(d)}`; return { label: `${d} ${MONTH_NAME(m)} ${L('(كل سنة)', '(every year)')}`, rest, test: (x) => String(x).slice(4, 10) === p }; }
		return { label: String(y), rest, test: (x) => String(x).startsWith(y + '-') };
	};
	let m;
	if ((m = s.match(/ (\d{4})[-/.](\d{1,2})[-/.](\d{1,2}) /)) && day(+m[3], +m[2])) return out(m[0], m[1], +m[2], +m[3]);
	if ((m = s.match(/ (\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2}) /)) && day(+m[1], +m[2])) return out(m[0], full(m[3]), +m[2], +m[1]);
	if ((m = s.match(/ (\d{4})[-/.](\d{1,2}) /)) && +m[2] >= 1 && +m[2] <= 12) return out(m[0], m[1], +m[2]);
	if ((m = s.match(/ (\d{1,2})[-/.](\d{4}) /)) && +m[1] >= 1 && +m[1] <= 12) return out(m[0], m[2], +m[1]);
	if ((m = s.match(/ (\d{1,2})[-/.](\d{1,2}) /)) && day(+m[1], +m[2])) return out(m[0], 0, +m[2], +m[1]);
	if ((m = s.match(new RegExp(` (?:(\\d{1,2}) )?(${MONTH_RE})(?: (\\d{4}))? `)))) {
		const mo = MONTH_OF.get(m[2]), d = m[1] ? +m[1] : 0;
		if (m[3] || d) return out(m[0], m[3] || 0, mo, d && day(d, mo) ? d : 0);
		return null; // a month on its own is too often just a word
	}
	if ((m = s.match(/ ((?:19|20)\d\d) /))) return out(m[0], m[1]);
	return null;
}

/* Score: every word must be found; the title counts most, then how early and how whole the match is. */
function search(q) {
	const words = fold(q).split(/\s+/).filter((w) => w.length >= 1);
	if (!words.length) return [];
	const hits = [];
	for (const r of index) {
		if (!words.every((w) => r.hay.includes(w))) continue;
		const ti = fold(r.title);
		let score = 0;
		for (const w of words) {
			if (ti.includes(w)) score += ti.startsWith(w) ? 12 : 8;
			if (new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(r.hay)) score += 3;
		}
		if (r.page === 'pages') score += 2;
		hits.push({ r, score });
	}
	return hits.sort((a, b) => b.score - a.score || String(b.r.date).localeCompare(String(a.r.date))).map((h) => h.r);
}

/* Marks the found words in a text with the highlighter; folding can change lengths, so the match is made
   character by character over a folded copy that keeps a map back to the original. */
function marked(text, q, max = 0) {
	let s = String(text || '');
	const words = fold(q).split(/\s+/).filter(Boolean);
	if (max && [...s].length > max) {
		// a window around the first word found
		const f = fold(s);
		const at = Math.min(...words.map((w) => f.indexOf(w)).filter((i) => i >= 0), Infinity);
		const start = at === Infinity ? 0 : Math.max(0, at - Math.floor(max / 3));
		s = (start ? '…' : '') + s.slice(start, start + max).trim() + (start + max < s.length ? '…' : '');
	}
	const chars = [...s];
	const folded = chars.map((c) => fold(c));
	const flat = folded.join('');
	const owner = folded.flatMap((f, i) => Array.from(f, () => i));
	const on = new Array(chars.length).fill(false);
	for (const w of words) {
		let i = flat.indexOf(w);
		while (i >= 0) {
			for (let k = i; k < i + w.length; k++) on[owner[k]] = true;
			i = flat.indexOf(w, i + w.length);
		}
	}
	let html = '', open = false;
	chars.forEach((c, i) => {
		if (on[i] && !open) { html += '<mark>'; open = true; }
		if (!on[i] && open) { html += '</mark>'; open = false; }
		html += esc(c);
	});
	return html + (open ? '</mark>' : '');
}

/* the best line to show under a title: the first text, other than the title, where a word was found */
function snippet(r, q) {
	if (r.sub && fold(r.sub).includes(fold(q).split(/\s+/)[0] || '')) return marked(r.sub, q, 140);
	const ti = fold(r.title);
	const words = fold(q).split(/\s+/).filter(Boolean);
	const others = r.all.filter((x) => fold(x) !== ti);
	const line = others.find((x) => words.some((w) => fold(x).includes(w)));
	if (line) return marked(line, q, 140);
	if (r.sub) return marked(r.sub, q, 140);
	// nothing else matched: a little context instead (the artist, the place, the note)
	return others.length ? marked(others.slice(0, 2).join(' · '), q, 120) : '';
}

/* For the gooey band and the header's morphing search: the index, built once, and the best few hits for a query
   ({ title, href, page, date, group, ic }), dates understood too. */
export async function ensureIndex(s) {
	if (!index || indexOf !== s) { index = await build(s); indexOf = s; }
	return index;
}
let indexOf = null;
export function quick(q, n = 5) {
	const query = String(q || '').trim();
	if (!index || fold(query).replace(/\s/g, '').length < MIN) return [];
	const dq = dateQuery(query);
	const words = dq ? dq.rest.split(/\s+/).filter(Boolean) : [];
	const hits = dq ? index.filter((r) => r.date && dq.test(r.date) && words.every((w) => r.hay.includes(w))).sort((a, b) => String(a.date).localeCompare(String(b.date))) : search(query);
	return hits.slice(0, n).map((r) => ({ title: r.title.length > 60 ? r.title.slice(0, 58) + '…' : r.title, href: r.page === 'pages' ? r.href : hrefWith(r.href, r.title), page: r.page, date: r.date, group: groupName(r.page), ic: r.page === 'pages' ? r.ic : groupIcon(r.page) }));
}
export const recentSearches = () => recent();
export const rememberSearch = (q) => remember(q);

const recent = () => { try { return JSON.parse(store.get(RECENT) || '[]').slice(0, 8); } catch { return []; } };
function remember(q) {
	q = q.trim();
	if (q.length < MIN) return;
	store.set(RECENT, JSON.stringify([q, ...recent().filter((x) => fold(x) !== fold(q))].slice(0, 8)));
}

const groupName = (id) => (id === 'pages' ? L('صفحات الموقع', 'Pages') : (() => { const p = pageOf(id); return p ? L(p.ar, p.en) : id; })());
const groupIcon = (id) => (id === 'pages' ? 'book' : pageOf(id)?.ic || 'heart');
const hrefWith = (href, title) => `${href}#find=${encodeURIComponent(title.slice(0, 60))}`;

function resultsHTML(q) {
	const query = q.trim();
	if (fold(query).replace(/\s/g, '').length < MIN) return startHTML();
	const dq = dateQuery(query);
	if (dq) return dateHTML(dq);
	const hits = search(query);
	if (!hits.length) {
		return `<div class="sr-none reveal">${doodle('eyes', 64)}
			<p><b>${L('مالقيناش', 'Nothing found for')} «${esc(query)}»</b></p>
			<p>${Y('جرّب كلمة تانية، أو جزء من الكلمة', 'جرّبي كلمة تانية، أو جزء من الكلمة', 'Try another word, or just part of one')}</p></div>`;
	}
	return listHTML(hits, query, `<p class="sr-count" role="status">${num(hits.length)} ${hits.length === 1 ? L('نتيجة', 'result') : L('نتيجة', 'results')} ${L('لـ', 'for')} «${esc(query)}»</p>`);
}

/* Everything on a date (or in a month, a year, or on a day in every year), oldest first. An exact day with nothing
   on it shows the closest moments of our story before and after it instead. */
function dateHTML(dq) {
	const words = dq.rest.split(/\s+/).filter(Boolean);
	const hits = index.filter((r) => r.date && dq.test(r.date) && words.every((w) => r.hay.includes(w)))
		.sort((a, b) => String(a.date).localeCompare(String(b.date)));
	const what = `${esc(dq.label)}${words.length ? ` · «${esc(dq.rest)}»` : ''}`;
	if (hits.length) return listHTML(hits, dq.rest, `<p class="sr-count" role="status">${doodle('calendar', 22)} ${num(hits.length)} ${hits.length === 1 ? L('حاجة', 'thing') : L('حاجة', 'things')} — ${what}</p>`);
	if (dq.exact && !words.length) {
		const day = Date.parse(dq.iso);
		const near = index.filter((r) => r.page === 'story' && r.date).map((r) => ({ r, d: Date.parse(String(r.date).slice(0, 10)) - day }))
			.sort((a, b) => Math.abs(a.d) - Math.abs(b.d)).slice(0, 4).map((x) => x.r).sort((a, b) => String(a.date).localeCompare(String(b.date)));
		if (near.length) return listHTML(near, '', `<p class="sr-count" role="status">${doodle('calendar', 22)} ${L('مفيش حاجة مكتوبة يوم', 'Nothing written on')} ${what} — ${L('دي أقرب ذكريات ليه', 'here are the closest moments')}</p>`);
	}
	return `<div class="sr-none reveal">${doodle('calendar', 64)}
		<p><b>${L('مفيش حاجة في', 'Nothing on')} ${what}</b></p>
		<p>${Y('جرّب شهر أو سنة بس، زي «أكتوبر 2017» أو «2017»', 'جرّبي شهر أو سنة بس، زي «أكتوبر 2017» أو «2017»', 'Try just a month or a year, like “October 2017” or “2017”')}</p></div>`;
}

/* results grouped by page, the found words marked */
function listHTML(hits, query, countLine) {
	const groups = new Map();
	for (const r of hits) { if (!groups.has(r.page)) groups.set(r.page, []); groups.get(r.page).push(r); }
	const order = [...groups.keys()];
	const chips = `<nav class="sr-jump" aria-label="${L('النتايج حسب الصفحة', 'Results by page')}">${order.map((g) => `<a href="#sr-${esc(g)}">${icon(groupIcon(g), 16)}<span>${esc(groupName(g))}</span><b>${num(groups.get(g).length)}</b></a>`).join('')}</nav>`;
	return `${countLine}
		${order.length > 1 ? chips : ''}
		${order.map((g) => {
			const list = groups.get(g);
			return `<section class="sr-group" id="sr-${esc(g)}" aria-labelledby="srh-${esc(g)}">
				<h2 class="sr-gh" id="srh-${esc(g)}">${icon(groupIcon(g), 22)}<span>${esc(groupName(g))}</span><small>${num(list.length)}</small></h2>
				<div class="sr-list">${list.slice(0, 40).map((r, i) => `
					<a class="sr-card" style="--i:${Math.min(i, 12)}" href="${esc(r.page === 'pages' ? r.href : hrefWith(r.href, r.title))}">
						${r.page === 'pages' ? `<span class="sr-ic">${icon(r.ic, 22)}</span>` : ''}
						<span class="sr-tx">
							<b dir="auto">${marked(r.title.length > 90 ? r.title.slice(0, 88) + '…' : r.title, query)}</b>
							${(() => { const sn = snippet(r, query); return sn ? `<small dir="auto">${sn}</small>` : ''; })()}
							${r.date ? `<em>${fmtDate(r.date)}</em>` : ''}
						</span>
						<span class="sr-go" aria-hidden="true">${App.arrow}</span>
					</a>`).join('')}
				</div>
				${list.length > 40 ? `<p class="sr-more">${L('و', 'and')} ${num(list.length - 40)} ${L('كمان — زوّد كلمة عشان تقرّب', 'more — add a word to narrow it down')}</p>` : ''}
			</section>`;
		}).join('')}`;
}

function startHTML() {
	const r = recent();
	const ideas = [L('عيد ميلاد', 'birthday'), L('رحلة', 'trip'), L('أغنية', 'song'), L('أول مرة', 'first'), L('فيلم', 'film'), L('بحبك', 'love')];
	// a date with something on it, a month, and today's day in every year
	const now = new Date();
	const dates = ['12-10-2017', L('أكتوبر 2017', 'October 2017'), `${now.getDate()}-${now.getMonth() + 1}`];
	return `<div class="sr-start">
		${r.length ? `<div class="sr-chips"><p>${L('دوّرت عليهم قبل كده', 'Searched before')}</p>${r.map((q) => `<button type="button" class="sr-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}<button type="button" class="sr-chip sr-chip--clear" data-clear>${L('امسح', 'Clear')}</button></div>` : ''}
		<div class="sr-chips"><p>${Y('جرّب', 'جرّبي', 'Try')}</p>${ideas.map((q) => `<button type="button" class="sr-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
		<div class="sr-chips"><p>${L('أو بالتاريخ', 'Or by date')}</p>${dates.map((q) => `<button type="button" class="sr-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
	</div>`;
}

/* The band above the title, after Codrops' «Gooey Search»: an ink pill that says «دوّر»; tap it and it stretches into
   a search box while a round bubble with the lens splits off its side, and as you type the best few finds drip out
   underneath — every shape goes through one SVG «goo» filter, so they melt into each other as they part and land.
   It types into the big search below too, so the full results follow. */
function gooeyHTML() {
	return `<div class="lp-band gs-band">
		<svg class="gs-defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="gs-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></svg>
		<div class="gs" id="gs">
			<div class="gs-goo">
				<div class="gs-drips" id="gs-drips"></div>
				<div class="gs-pill" id="gs-pill">
					<button class="gs-say" type="button" id="gs-say">${icon('search', 20)}<span>${Y('دوّر', 'دوّري', 'Search')}</span></button>
					<input class="gs-input" id="gs-input" type="search" autocomplete="off" spellcheck="false" dir="auto" tabindex="-1" placeholder="${esc(Y('اكتب أي حاجة…', 'اكتبي أي حاجة…', 'Type anything…'))}" aria-label="${esc(L('دوّر', 'Search'))}">
				</div>
				<span class="gs-bubble" id="gs-bubble" aria-hidden="true">${icon('search', 20)}</span>
			</div>
		</div>
	</div>`;
}

function gooey(main, big, draw) {
	const gs = $('#gs', main);
	if (!gs) return;
	const input = $('#gs-input', gs), drips = $('#gs-drips', gs), bubble = $('#gs-bubble', gs);
	const open = () => { if (gs.classList.contains('is-open')) return; gs.classList.add('is-open'); input.tabIndex = 0; setTimeout(() => input.focus({ preventScroll: true }), 120); };
	$('#gs-say', gs).onclick = open;
	let timer = 0, shown = '';
	const drip = () => {
		const q = input.value;
		const hits = quick(q, 4);
		const key = hits.map((h) => h.href).join('|');
		bubble.classList.remove('is-busy');
		if (key === shown) return;
		shown = key;
		// the old drops fall back into the pill first, then the new ones run out
		drips.innerHTML = hits.map((h, i) => `<a class="gs-drop" href="${esc(h.href)}" style="--i:${i}">${icon(h.ic, 16)}<b dir="auto">${esc(h.title)}</b><small>${esc(h.group)}</small></a>`).join('');
		void drips.offsetWidth; // lay the drops out where they start, so they run from the pill
		drips.classList.add('is-out');
	};
	input.addEventListener('input', () => {
		drips.classList.remove('is-out');
		bubble.classList.add('is-busy');
		clearTimeout(timer);
		timer = setTimeout(drip, 350);
		big.value = input.value;
		big.dispatchEvent(new Event('input'));
	});
	input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); rememberSearch(input.value); draw(); big.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
	big.addEventListener('input', () => { if (document.activeElement !== input) { input.value = big.value; if (big.value) open(); clearTimeout(timer); timer = setTimeout(drip, 350); } });
	drips.addEventListener('click', (e) => { if (e.target.closest('.gs-drop')) rememberSearch(input.value); });
	if (big.value) { input.value = big.value; gs.classList.add('is-open'); input.tabIndex = 0; setTimeout(drip, 400); }
}

export default {
	title: { ar: 'دوّر', en: 'Search' },
	render(s) {
		const q = new URLSearchParams(location.search).get('q') || '';
		return `
		${pageHead(Y('دوّر', 'دوّري', 'Search'), Y('دوّر في كل حاجة كتبناها: الحكاية، الأماكن، الأغاني، الدفتر، والقوايم', 'دوّري في كل حاجة كتبناها: الحكاية، الأماكن، الأغاني، الدفتر، والقوايم', 'Look through everything we’ve written: the story, places, songs, the journal, our lists'), [{ href: 'search.html', ar: 'دوّر', en: 'Search' }], { band: gooeyHTML() })}
		<section class="sec sec--top sr"><div class="wrap">
			<form class="sr-form" role="search" action="search.html" method="get">
				<label class="sr-field">
					<span class="sr-lens" aria-hidden="true">${icon('search', 24)}</span>
					<input id="sr-q" name="q" type="search" value="${esc(q)}" autocomplete="off" enterkeyhint="search" spellcheck="false" dir="auto"
						placeholder="${esc(Y('بتدوّر على إيه؟', 'بتدوّري على إيه؟', 'What are you looking for?'))}" aria-label="${esc(L('دوّر', 'Search'))}">
					<button class="sr-x" type="button" aria-label="${esc(L('امسح', 'Clear'))}" ${q ? '' : 'hidden'}>✕</button>
				</label>
			</form>
			<div class="sr-out" id="sr-out" aria-live="polite"><p class="sr-wait">${doodle('pencil', 28)} ${L('بنجهّز كل حاجة…', 'Gathering everything…')}</p></div>
		</div></section>
		${related(['story', 'journal', 'gallery'])}`;
	},
	async after(main, s) {
		const input = $('#sr-q', main), out = $('#sr-out', main), clear = $('.sr-x', main);
		const draw = () => {
			const q = input.value;
			clear.hidden = !q;
			out.innerHTML = resultsHTML(q);
			const url = new URL(location.href);
			if (q.trim()) url.searchParams.set('q', q.trim()); else url.searchParams.delete('q');
			url.hash = '';
			history.replaceState(history.state, '', url);
		};
		await ensureIndex(s);
		draw();
		let timer = 0;
		input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
		input.addEventListener('change', () => remember(input.value));
		$('.sr-form', main).addEventListener('submit', (e) => { e.preventDefault(); remember(input.value); draw(); input.blur(); });
		clear.onclick = () => { input.value = ''; draw(); input.focus(); };
		out.addEventListener('click', (e) => {
			const chip = e.target.closest('[data-q]');
			if (chip) { input.value = chip.dataset.q; remember(chip.dataset.q); draw(); return; }
			if (e.target.closest('[data-clear]')) { store.del(RECENT); draw(); return; }
			if (e.target.closest('.sr-card')) remember(input.value);
		});
		gooey(main, input, draw);
		// straight to typing on a computer; on a phone only when nothing was searched yet
		if (matchMedia('(hover: hover)').matches || !input.value) input.focus({ preventScroll: true });
	}
};
