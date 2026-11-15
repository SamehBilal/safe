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
const PAGE_OF = { where: 'distances', spots: 'cities', tree: 'familytree' };
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
		if (v.length > 1 && !/^(media:|https?:|data:|#[0-9a-f]{3,8}$|\d{4}-\d{2}(-\d{2})?$)/i.test(v)) out.push(v);
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
	const hits = search(query);
	if (!hits.length) {
		return `<div class="sr-none reveal">${doodle('eyes', 64)}
			<p><b>${L('مالقيناش', 'Nothing found for')} «${esc(query)}»</b></p>
			<p>${Y('جرّب كلمة تانية، أو جزء من الكلمة', 'جرّبي كلمة تانية، أو جزء من الكلمة', 'Try another word, or just part of one')}</p></div>`;
	}
	const groups = new Map();
	for (const r of hits) { if (!groups.has(r.page)) groups.set(r.page, []); groups.get(r.page).push(r); }
	const order = [...groups.keys()];
	const chips = `<nav class="sr-jump" aria-label="${L('النتايج حسب الصفحة', 'Results by page')}">${order.map((g) => `<a href="#sr-${esc(g)}">${icon(groupIcon(g), 16)}<span>${esc(groupName(g))}</span><b>${num(groups.get(g).length)}</b></a>`).join('')}</nav>`;
	return `<p class="sr-count" role="status">${num(hits.length)} ${hits.length === 1 ? L('نتيجة', 'result') : L('نتيجة', 'results')} ${L('لـ', 'for')} «${esc(query)}»</p>
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
	return `<div class="sr-start">
		${r.length ? `<div class="sr-chips"><p>${L('دوّرت عليهم قبل كده', 'Searched before')}</p>${r.map((q) => `<button type="button" class="sr-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}<button type="button" class="sr-chip sr-chip--clear" data-clear>${L('امسح', 'Clear')}</button></div>` : ''}
		<div class="sr-chips"><p>${Y('جرّب', 'جرّبي', 'Try')}</p>${ideas.map((q) => `<button type="button" class="sr-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
	</div>`;
}

export default {
	title: { ar: 'دوّر', en: 'Search' },
	render(s) {
		const q = new URLSearchParams(location.search).get('q') || '';
		return `
		${pageHead(Y('دوّر', 'دوّري', 'Search'), Y('دوّر في كل حاجة كتبناها: الحكاية، الأماكن، الأغاني، الدفتر، والقوايم', 'دوّري في كل حاجة كتبناها: الحكاية، الأماكن، الأغاني، الدفتر، والقوايم', 'Look through everything we’ve written: the story, places, songs, the journal, our lists'), [{ href: 'search.html', ar: 'دوّر', en: 'Search' }])}
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
		index = index && App.story === s ? index : await build(s);
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
		// straight to typing on a computer; on a phone only when nothing was searched yet
		if (matchMedia('(hover: hover)').matches || !input.value) input.focus({ preventScroll: true });
	}
};
