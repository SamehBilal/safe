import { L, Y, esc, pageHead, related, App, $, $$, num, REDUCE, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';
import recipes from './recipes.js';

/* Our food: the restaurants we love, each with its menu as a folded paper flyer, after Codrops' «3D Restaurant Menu»
   (tympanus.net/codrops, Mary Lou): the cover swings open on its hinge, the last panel unfolds the other way, and
   picking a dish pushes the menu back while the dish comes forward on its own card. In Arabic the menu opens the
   other way, like an Arabic book. On a phone there's no room to open sideways, so the same flyer unfolds up and down:
   the cover lifts up over the top, the last panel drops down, and you scroll through it. Like the original, a dish
   can carry a photo (marked with a little eye) and a link out. The places live in the shared list
   content/live/food.bin; the first one is an example to show how a menu reads (edit it away or keep it).
   What we eat out and what we make ourselves are one page: the café chalkboard on top has two sides — «مطاعمنا»
   (every place, the year we first went) and «مطبخنا» (every dish we cook, how many times we've made it) — and
   «نأكل إيه النهارده؟» at its foot picks one of either. Under it a switch: «برا» shows the restaurants' menus, «في
   البيت» shows «نطبخ إيه» (recipes.js, its own list content/live/recipes.bin). A restaurant's cover can call them,
   open it on elmenus (their app if it's on the phone) or their site; the menus with prices came from elmenus. */

const COLORS = ['#c2185b', '#0e6990', '#26706b', '#e39b2d', '#6d4bb3', '#d9534f', '#8a5a2b'];
const FAV = { him: () => App.t(App.story.him), her: () => App.t(App.story.her), both: () => L('إحنا الاتنين', 'both of us') };
const safeLink = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
const EYE = '<svg class="fm-eye" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
const phone = () => matchMedia('(max-width: 960px)').matches;
/** A place's logo as a little round badge — its first letter in its colour until the logo is in. */
const badge = (r, cls) => r.img
	? `<span class="${cls} has-pic" aria-hidden="true"><img data-sketch="${esc(r.img)}" alt=""></span>`
	: `<span class="${cls}" aria-hidden="true" style="--c:${esc(r.color || COLORS[0])}">${esc([...String(App.t(r.name) || '♥').replace(/^(ال|thes+)/i, '')][0] || '♥')}</span>`;
const price = (p) => (p ? L(`${num(+p)} ج`, `EGP ${(+p).toLocaleString('en')}`) : '');
/* the kinds of place, for the tabs over the list of restaurants (a place can be more than one) */
export const CATS = [
	{ id: 'coffee', ar: 'قهوة ومشروبات', en: 'Coffee & drinks', ic: 'coffee' },
	{ id: 'sweets', ar: 'حلويات', en: 'Sweets', ic: 'cake' },
	{ id: 'burger', ar: 'برجر', en: 'Burgers', ic: 'dinner' },
	{ id: 'pizza', ar: 'بيتزا', en: 'Pizza', ic: 'dinner' },
	{ id: 'chicken', ar: 'فراخ', en: 'Chicken', ic: 'dinner' },
	{ id: 'crepe', ar: 'كريب وسندوتشات', en: 'Crêpes & sandwiches', ic: 'dinner' },
	{ id: 'pasta', ar: 'مكرونة وإيطالي', en: 'Pasta & Italian', ic: 'dinner' },
	{ id: 'egyptian', ar: 'أكل مصري', en: 'Egyptian', ic: 'dinner' },
	{ id: 'grills', ar: 'مشويات', en: 'Grills', ic: 'dinner' },
	{ id: 'seafood', ar: 'سمك وسي فود', en: 'Fish & seafood', ic: 'dinner' },
	{ id: 'asian', ar: 'آسيوي', en: 'Asian', ic: 'dinner' },
	{ id: 'restaurant', ar: 'مطعم وكافيه', en: 'Restaurant & café', ic: 'dinner' }
];
/* a place saved before it had kinds: guessed from what kind of food it says it is */
const GUESS = [[/قهوة|coffee|كافيه|café|cafe/i, 'coffee'], [/عصير|juice/i, 'coffee'], [/حلو|حلويات|dessert|sweet/i, 'sweets'], [/برجر|burger/i, 'burger'], [/بيتزا|pizza/i, 'pizza'], [/فراخ|chicken/i, 'chicken'], [/كريب|crepe|crêpe|سندوتش|sandwich/i, 'crepe'], [/مكرونة|pasta|إيطالي|italian/i, 'pasta'], [/مصري|egyptian|كشري|koshary|كبدة|liver/i, 'egyptian'], [/مشويات|grill/i, 'grills'], [/سمك|fish|sea/i, 'seafood'], [/كوري|korean|صيني|chinese|سوشي|sushi|آسيوي|asian/i, 'asian'], [/مطعم|restaurant|لبناني|lebanese/i, 'restaurant']];
export const catsOf = (r) => {
	if (r.cats?.length) return r.cats;
	const words = [r.cuisine?.ar, r.cuisine?.en, typeof r.cuisine === 'string' ? r.cuisine : ''].join(' ');
	const got = [...new Set(GUESS.filter(([re]) => re.test(words)).map(([, c]) => c))];
	return got.length ? got : ['restaurant'];
};
/* the days of the week, Sunday first like Date.getDay() */
const DAYS = [['الحد', 'Sunday'], ['الاتنين', 'Monday'], ['التلات', 'Tuesday'], ['الأربع', 'Wednesday'], ['الخميس', 'Thursday'], ['الجمعة', 'Friday'], ['السبت', 'Saturday']];
const dayName = (n) => L(...DAYS[n]);
const WHO = [['him', () => App.t(App.story.him)], ['her', () => App.t(App.story.her)], ['both', () => L('إحنا الاتنين', 'Both of us')]];
/* call them, order from elmenus (their app opens if it's on the phone), or their own site */
const actsHTML = (r) => {
	const tel = String(r.phone || '').replace(/[^\d+]/g, '');
	const acts = [
		tel ? `<a class="fm__act fm__act--call" href="tel:${esc(tel)}">${doodle('phone', 16)} ${L('اتصل', 'Call')} <span dir="ltr">${esc(r.phone)}</span></a>` : '',
		safeLink(r.elmenus) ? `<a class="fm__act fm__act--app" href="${esc(r.elmenus)}" target="_blank" rel="noopener noreferrer">${doodle('scooter', 16)} ${L('اطلب من المنيوز', 'Order on elmenus')}</a>` : '',
		safeLink(r.link) ? `<a class="fm__act" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${doodle('sparkle', 16)} ${L('موقعهم', 'Their site')}</a>` : ''
	].filter(Boolean);
	return acts.length ? `<div class="fm__acts">${acts.join('')}</div>` : '';
};

/** "# Section" lines start a section; "Dish | price | what's in it | him/her/both" lines are its dishes. */
export function parseMenu(text) {
	const sections = [];
	for (const raw of String(text || '').split('\n')) {
		const line = raw.trim();
		if (!line) continue;
		if (line.startsWith('#')) { sections.push({ id: live.newId() + sections.length, title: line.replace(/^#+\s*/, ''), dishes: [] }); continue; }
		if (!sections.length) sections.push({ id: live.newId(), title: L('المنيو', 'Menu'), dishes: [] });
		const [name, p, desc, fav] = line.split(/\s*[|｜]\s*/);
		const f = /هو|him|سامح/i.test(fav || '') ? 'him' : /هي|her|إسراء|اسراء/i.test(fav || '') ? 'her' : /اتنين|both|إحنا/i.test(fav || '') ? 'both' : undefined;
		sections.at(-1).dishes.push({ id: live.newId() + Math.random().toString(36).slice(2, 4), name, price: +String(p || '').replace(/[^\d.]/g, '') || undefined, desc: desc || undefined, fav: f });
	}
	return sections.filter((s) => s.dishes.length);
}

/* the sections spread over the three panels, as evenly as their dishes allow */
function panels(sections) {
	if (sections.length <= 3) return [0, 1, 2].map((i) => (sections[i] ? [sections[i]] : []));
	const weight = (s) => 1.4 + s.dishes.length;
	const total = sections.reduce((a, s) => a + weight(s), 0);
	const out = [[], [], []];
	let acc = 0;
	for (const s of sections) {
		const i = Math.min(2, Math.floor((acc + weight(s) / 2) / (total / 3)));
		out[i].push(s);
		acc += weight(s);
	}
	return out;
}

const dl = (secs, r) => secs.map((s) => `<h4>${esc(App.t(s.title))}</h4><dl>${s.dishes.map((d) => `
	<dt><button class="fm-dish${d.img || d.link ? ' has-more' : ''}" type="button" data-dish="${esc(r.id)}|${esc(s.id)}|${esc(d.id)}">${d.img || d.link ? EYE : ''}<span dir="auto">${esc(App.t(d.name))}</span>${d.fav ? '<i aria-hidden="true">♥</i>' : ''}${d.price ? `<b>${esc(price(d.price))}</b>` : ''}</button></dt>
	${d.desc ? `<dd dir="auto">${esc(App.t(d.desc))}</dd>` : '<dd></dd>'}`).join('')}</dl>`).join('');

function menuHTML(r) {
	const [a, b, c] = panels(r.sections || []);
	const color = r.color || COLORS[0];
	return `<div class="fm" id="fm" style="--fm:${esc(color)}">
		<div class="fm__wrap">
			<div class="fm__cover">
				<div class="fm__front"><div class="fm__in">
					<div class="fm__logo${r.img ? ' has-pic' : ''}" aria-hidden="true">${r.img ? `<img data-sketch="${esc(r.img)}" alt="">` : doodle(r.icon || 'dinner', 54)}</div>
					<h2 dir="auto">${esc(App.t(r.name))}</h2>
					${r.tagline ? `<h3 dir="auto">${esc(App.t(r.tagline))}</h3>` : ''}
					<button class="fm__open" type="button">${Y('افتح المنيو', 'افتحي المنيو', 'Open the menu')}</button>
					<p class="fm__info">${[App.t(r.cuisine), App.t(r.area)].filter(Boolean).map(esc).join('<br>')}</p>
					${actsHTML(r)}
				</div></div>
				<div class="fm__back"><div class="fm__in">${dl(a, r)}</div><div class="fm__shade"></div></div>
			</div>
			<div class="fm__middle"><div class="fm__in">${(r.sections || []).length ? dl(b, r) : `<p class="fm-soon">${doodle(r.icon || 'dinner', 40)}<b>${L('المنيو جاي قريب', 'The menu is coming soon')}</b><span>${L('لسه هنكتب اللي فيه، وإيه اللي بنطلبه دايماً', 'We’ll write what’s on it, and what we always order')}</span></p>`}</div><div class="fm__shade"></div></div>
			<div class="fm__right">
				<div class="fm__front"><div class="fm__in"></div></div>
				<div class="fm__back"><div class="fm__in">
					<button class="fm__close" type="button">${Y('اقفله', 'اقفليه', 'Close')}</button>
					${dl(c, r)}
					${r.order ? `<div class="fm__order"><h4>${L('طلبنا المعتاد', 'Our usual order')}</h4><p dir="auto">${esc(App.t(r.order))}</p></div>` : ''}
					${r.menuFrom === 'elmenus' ? `<p class="fm__src">${L('المنيو والأسعار من المنيوز', 'Menu and prices from elmenus')}${r.menuAt ? ` · ${esc(longDate(r.menuAt))}` : ''}</p>` : ''}
				</div><div class="fm__shade"></div></div>
			</div>
		</div>
	</div>`;
}

export default {
	title: { ar: 'أكلنا', en: 'Our food' },
	render(s) {
		const ok = live.canWrite();
		return `
		${pageHead(L('أكلنا', 'Our food'), L('المطاعم اللي بنحبها بالمنيو بتاعها، والأكل اللي بنطبخه سوا في البيت', 'The places we love with their menus, and what we cook together at home'), [{ href: 'food.html', ar: 'أكلنا', en: 'Our food' }], { band: `<div class="lp-band fm-band" id="fm-band"><div class="fm-board"><p class="fm-board__h">${L('أكلنا', 'Our food')}</p><p class="fm-board__wait">${L('بنكتب المنيو…', 'Chalking the menu…')}</p></div></div>` })}
		<div class="wrap"><div class="fd-switch" role="tablist" aria-label="${L('برا ولا في البيت', 'Out or at home')}">
			<button type="button" role="tab" class="fd-side is-on" data-side="out" aria-selected="true" aria-controls="fd-out">${doodle('dinner', 26)}<b>${L('برا', 'Eating out')}</b><small id="fd-n-out">${L('مطاعمنا والمنيو', 'Our places and their menus')}</small></button>
			<button type="button" role="tab" class="fd-side" data-side="home" aria-selected="false" aria-controls="recipes">${doodle('cake', 26)}<b>${L('في البيت', 'At home')}</b><small id="fd-n-home">${L('اللي بنطبخه سوا', 'What we cook together')}</small></button>
		</div></div>
		<section class="sec sec--top fd-out" id="fd-out" role="tabpanel"><div class="wrap">
			<div class="fd-today" id="fd-today" hidden></div>
			<div class="chips fd-cats" role="toolbar" aria-label="${L('نوع الأكل', 'Kind of food')}" id="fd-cats"></div>
			<div class="fd-grid">
				<aside class="fd-list" id="fd-list" aria-label="${L('مطاعمنا', 'Our places')}"></aside>
				<div class="fd-main">
					<div class="fm-stage" id="fm-stage"><p class="empty">${L('بنجيب المطاعم…', 'Fetching the restaurants…')}</p></div>
					<div class="fd-offers" id="fd-offers"></div>
					<p class="fm-mine" id="fm-mine" hidden></p>
				</div>
			</div>
			<section class="fd-favs" id="fd-favs" aria-labelledby="fd-favs-h"></section>

			${ok ? '' : `<div class="narrow" style="margin:28px auto 0">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:28px auto 0"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('dinner', 22)}</span> ${Y('ضيف مطعم', 'ضيفي مطعم', 'Add a restaurant')}</summary>
				<form id="fm-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('اسم المطعم', 'Restaurant')}</span><input name="name" dir="auto" maxlength="50" required></label>
						<label class="f f--grow"><span>${L('جملة تحت الاسم', 'A line under the name')}</span><input name="tagline" dir="auto" maxlength="70"></label>
					</div>
					<div class="f-row">
						<label class="f"><span>${L('أكل إيه؟', 'What kind of food?')}</span><input name="cuisine" dir="auto" maxlength="40" placeholder="${L('مشويات، إيطالي…', 'Grills, Italian…')}"></label>
						<label class="f"><span>${L('فين؟', 'Where?')}</span><input name="area" dir="auto" maxlength="60"></label>
						<label class="f"><span>${L('التليفون', 'Phone')}</span><input name="phone" type="tel" dir="ltr" maxlength="20"></label>
					</div>
					<fieldset class="f fd-catpick"><legend>${L('يتحط تحت أنهي نوع؟', 'Which kinds?')}</legend>${CATS.map((c) => `<label class="chip"><input type="checkbox" name="cats" value="${c.id}"> ${esc(L(c.ar, c.en))}</label>`).join('')}</fieldset>
					<label class="f"><span>${L('المنيو', 'The menu')}</span><textarea name="menu" dir="auto" rows="8" required placeholder="${L('# مشويات\nكفتة | 180 | كفتة على الفحم مع عيش وطحينة | إحنا الاتنين\nريش | 320 | ريش ضاني\n# حلو\nأم علي | 70 | بالمكسرات والقشطة | هي', '# Grills\nKofta | 180 | Charcoal kofta with bread and tahini | both\nLamb chops | 320\n# Dessert\nOm Ali | 70 | With nuts and cream | her')}"></textarea></label>
					<p class="fm-howto">${L('سطر يبدأ بـ # يبقى قسم. كل أكلة في سطر: الاسم | السعر | فيها إيه | مين بيحبها (هو / هي / إحنا الاتنين). الباقي اختياري.', 'A line starting with # is a section. One dish per line: name | price | what’s in it | who loves it (him / her / both). All but the name is optional.')}</p>
					<label class="f"><span>${L('طلبنا المعتاد (اختياري)', 'Our usual order (optional)')}</span><input name="order" dir="auto" maxlength="160"></label>
					<div class="f-row">
						<label class="f f--grow"><span>${L('صورة للمطعم أو اللوجو (اختياري)', 'A photo or logo of the place (optional)')}</span><input name="pic" type="file" accept="image/*"></label>
						<label class="f f--grow"><span>${L('موقعهم (اختياري)', 'Their website (optional)')}</span><input name="link" type="url" dir="ltr" placeholder="https://"></label>
						<label class="f f--grow"><span>${L('صفحتهم على المنيوز (اختياري)', 'Their elmenus page (optional)')}</span><input name="elmenus" type="url" dir="ltr" placeholder="https://www.elmenus.com/…"></label>
					</div>
					<p class="form-msg" id="fm-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('حط المنيو ♥', 'حطي المنيو ♥', 'Add the menu ♥')}</button></div>
				</form>
			</details>
		</div></section>
		<div id="recipes" class="fd-recipes" role="tabpanel" hidden><a class="lp-band lp-band--recipes fd-pot" id="lp-band" href="#recipes" aria-hidden="true" tabindex="-1"></a>${recipes.section(s, `<h2 class="sec__title reveal">${doodle('cake', 30)} ${L('نطبخ إيه', 'Our recipes')}</h2><p class="sec__sub fd-recipes__sub">${L('الأكلات اللي بنعملها سوا، ومين بيعملها أحسن — وكل مرة عملناها', 'What we cook together, who makes it best — and every time we made it')}</p>`)}</div>
		${related(['hosting', 'draw', 'places', 'cities'])}`;
	},

	async after(main, s) {
		// our recipes, under the restaurants: their own list, kept inside their section
		const cooking = recipes.after(main, s, $('#recipes', main));
		const stage = $('#fm-stage', main);
		let data = { items: [] };
		let cur = '';
		let cat = '';      // the kind tab picked over the list ('' = all)
		let fm = null;
		const ok = live.canWrite();
		const today = new Date().getDay();
		const save = (fn) => live.save('food', fn).then((v) => { data = v; show(cur); }).catch((err) => alert(live.why(err)));

		/* the kinds as tabs (only kinds that have a place), and the places of the one picked down the side, scrolling */
		const shown = () => all().filter((r) => !cat || catsOf(r).includes(cat));
		const favsOf = (r) => (r.sections || []).flatMap((sec) => sec.dishes.filter((d) => d.fav).map((d) => ({ d, sec })));
		const paintList = () => {
			const xs = all();
			const kinds = CATS.map((c) => ({ c, n: xs.filter((r) => catsOf(r).includes(c.id)).length })).filter((k) => k.n);
			$('#fd-cats', main).innerHTML = `<button class="chip${cat ? '' : ' is-on'}" type="button" data-cat="">${L('الكل', 'All')} <small>${num(xs.length)}</small></button>`
				+ kinds.map(({ c, n }) => `<button class="chip${cat === c.id ? ' is-on' : ''}" type="button" data-cat="${c.id}">${doodle(c.ic, 16)} ${esc(L(c.ar, c.en))} <small>${num(n)}</small></button>`).join('');
			$('#fd-list', main).innerHTML = `<p class="fd-list__h">${cat ? esc(L(...['ar', 'en'].map((k) => CATS.find((c) => c.id === cat)[k]))) : L('كل مطاعمنا', 'All our places')} <small>${num(shown().length)}</small></p>
				<ul>${shown().map((r) => `<li><button type="button" class="fd-place${r.id === cur ? ' is-on' : ''}" data-r="${esc(r.id)}" style="--c:${esc(r.color || COLORS[0])}">
					${badge(r, 'fd-place__logo')}
					<span class="fd-place__tx"><b dir="auto">${esc(App.t(r.name))}</b><small>${esc([App.t(r.cuisine), App.t(r.area)].filter(Boolean).join(' · '))}</small></span>
					<span class="fd-place__tags">${(r.offers || []).some((o) => +o.day === today) ? `<i class="fd-tag fd-tag--offer" title="${L('عرض النهارده', 'An offer today')}">🎁</i>` : ''}${favsOf(r).length ? `<i class="fd-tag" title="${L('أكلات بنحبها', 'Dishes we love')}">♥ ${num(favsOf(r).length)}</i>` : ''}${(r.sections || []).length ? '' : `<i class="fd-tag fd-tag--dim">${L('من غير منيو', 'no menu')}</i>`}</span>
				</button></li>`).join('')}</ul>
				<button type="button" class="fd-list__arrow fd-list__arrow--up" data-step="-1" aria-label="${L('لفوق', 'Up')}" hidden>▲</button>
				<button type="button" class="fd-list__arrow fd-list__arrow--down" data-step="1" aria-label="${L('لتحت', 'Down')}" hidden>▼</button>`;
			live.hydrateSketches($('#fd-list', main));
			// the chosen place in view inside the list (only the list scrolls, never the page)
			const ul = $('#fd-list ul', main), on = $('.fd-place.is-on', main);
			if (on) { const u = ul.getBoundingClientRect(), o = on.getBoundingClientRect(); if (o.top < u.top || o.bottom > u.bottom) ul.scrollTop += o.top - u.top - u.height / 2 + o.height / 2; }
			ul.onscroll = arrows;
			arrows();
		};
		/* the list's arrows: up when there's more above, down when there's more below; no scrollbar */
		const arrows = () => {
			const ul = $('#fd-list ul', main);
			if (!ul) return;
			const can = ul.scrollHeight - ul.clientHeight > 2, row = phone();
			const before = row ? Math.abs(ul.scrollLeft) > 2 : ul.scrollTop > 2;
			const after = row ? Math.abs(ul.scrollLeft) < ul.scrollWidth - ul.clientWidth - 2 : ul.scrollTop < ul.scrollHeight - ul.clientHeight - 2;
			$('.fd-list__arrow--up', main).hidden = !(row ? ul.scrollWidth > ul.clientWidth + 2 : can) || !before;
			$('.fd-list__arrow--down', main).hidden = !(row ? ul.scrollWidth > ul.clientWidth + 2 : can) || !after;
		};
		$('#fd-list', main).addEventListener('click', (e) => {
			const a = e.target.closest('[data-step]');
			if (!a) return;
			const ul = $('#fd-list ul', main), step = +a.dataset.step;
			if (phone()) ul.scrollBy({ left: step * ul.clientWidth * 0.8 * (document.dir === 'rtl' ? -1 : 1), behavior: REDUCE ? 'auto' : 'smooth' });
			else ul.scrollBy({ top: step * ul.clientHeight * 0.8, behavior: REDUCE ? 'auto' : 'smooth' });
		});
		addEventListener('resize', arrows);
		$('#fd-cats', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-cat]');
			if (!b) return;
			cat = b.dataset.cat;
			const xs = shown();
			show(xs.some((r) => r.id === cur) ? cur : xs[0]?.id);
		});
		$('#fd-list', main).addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { show(b.dataset.r); history.replaceState(history.state, '', '#' + b.dataset.r); if (phone()) stage.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); } });

		/* today's offers, over everything: every place with something on this day of the week */
		const paintToday = () => {
			const xs = all().flatMap((r) => (r.offers || []).filter((o) => +o.day === today).map((o) => ({ r, o })));
			const box = $('#fd-today', main);
			box.hidden = !xs.length;
			box.innerHTML = xs.length ? `<p class="fd-today__h">🎁 ${L(`عروض النهارده — ${dayName(today)}`, `Today’s offers — ${dayName(today)}`)}</p>
				<ul>${xs.map(({ r, o }) => `<li><button type="button" data-r="${esc(r.id)}"><b dir="auto">${esc(App.t(r.name))}</b> <span dir="auto">${esc(o.text)}</span></button></li>`).join('')}</ul>` : '';
		};
		$('#fd-today', main).addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { cat = ''; show(b.dataset.r); stage.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); } });

		/* a place's weekly offers (every Wednesday a second coffee free…), and adding one */
		const paintOffers = (r) => {
			const box = $('#fd-offers', main);
			const xs = (r.offers || []).slice().sort((a, b) => a.day - b.day);
			box.hidden = !xs.length && !ok;
			box.innerHTML = `<p class="fd-offers__h">🎁 ${L('عروضهم كل أسبوع', 'Their weekly offers')}</p>
				${xs.length ? `<ul>${xs.map((o) => `<li class="${+o.day === today ? 'is-today' : ''}"><b>${L('كل', 'Every')} ${esc(dayName(+o.day))}</b> <span dir="auto">${esc(o.text)}</span>${+o.day === today ? ` <i>${L('النهارده!', 'today!')}</i>` : ''}${ok ? ` <button type="button" class="link link--danger" data-offer-rm="${esc(o.id)}" aria-label="${L('شيل العرض', 'Remove the offer')}">✕</button>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${L('مفيش عروض متسجلة لسه', 'No offers written down yet')}</p>`}
				${ok ? `<form class="fd-offers__add" autocomplete="off"><select name="day" aria-label="${L('اليوم', 'Day')}">${DAYS.map((d, i) => `<option value="${i}"${i === today ? ' selected' : ''}>${L('كل', 'Every')} ${esc(L(...d))}</option>`).join('')}</select><input name="text" dir="auto" maxlength="90" required placeholder="${L('قهوة ببلاش مع التانية…', 'A second coffee free…')}"><button class="btn btn--sm" type="submit">${Y('ضيف', 'ضيفي', 'Add')}</button></form>` : ''}`;
		};
		$('#fd-offers', main).addEventListener('submit', (e) => {
			e.preventDefault();
			const f = e.target, text = f.text.value.trim();
			if (!text) return;
			save((d) => { const x = (d.items || []).find((y) => y.id === cur); if (x) (x.offers = x.offers || []).push({ id: live.newId(), day: +f.day.value, text, by: live.me() }); });
		});
		$('#fd-offers', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-offer-rm]');
			if (b && confirm(Y('تشيل العرض ده؟', 'تشيلي العرض ده؟', 'Remove this offer?'))) save((d) => { const x = (d.items || []).find((y) => y.id === cur); if (x) x.offers = (x.offers || []).filter((o) => o.id !== b.dataset.offerRm); });
		});

		/* أكلاتنا المفضلة: the dishes marked ♥ on every menu, and the ones we love from anywhere (data.favs) */
		const paintFavs = () => {
			const out = all().flatMap((r) => favsOf(r).map(({ d, sec }) => ({ r, d, sec })));
			const free = data.favs || [];
			const who = (w) => WHO.find((x) => x[0] === w)?.[1]() || '';
			$('#fd-favs', main).innerHTML = `<h2 class="sec__title" id="fd-favs-h">${L('أكلاتنا المفضلة', 'Our favourite dishes')}</h2>
				<p class="sec__sub">${L('اللي بنحبها من كل مطعم — اضغط على أي أكلة في المنيو وعلّمها ♥ — واللي بنحبها من أي حتة', 'The ones we love from each place — tap any dish on a menu and mark it ♥ — and the ones we love from anywhere')}</p>
				<ul class="fd-favs__list">
					${out.map(({ r, d, sec }) => `<li><button type="button" class="fd-fav" data-fav="${esc(r.id)}|${esc(sec.id)}|${esc(d.id)}" style="--c:${esc(r.color || COLORS[0])}"><b dir="auto">${esc(App.t(d.name))}</b><small dir="auto">${esc(App.t(r.name))}${d.price ? ` · ${esc(price(d.price))}` : ''}</small><i>♥ ${esc(who(d.fav))}</i></button></li>`).join('')}
					${free.map((x) => `<li><span class="fd-fav fd-fav--free"><b dir="auto">${esc(x.name)}</b><small dir="auto">${esc(x.where || L('من أي حتة', 'From anywhere'))}</small><i>♥ ${esc(who(x.who))}</i>${ok ? `<button type="button" class="link link--danger" data-fav-rm="${esc(x.id)}" aria-label="${L('شيل', 'Remove')}">✕</button>` : ''}</span></li>`).join('')}
				</ul>
				${!out.length && !free.length ? `<p class="empty">${L('لسه ما علّمناش أكلات — افتح منيو واضغط على أكلة', 'None marked yet — open a menu and tap a dish')}</p>` : ''}
				${ok ? `<form class="fd-favs__add" autocomplete="off"><input name="name" dir="auto" maxlength="60" required placeholder="${L('أكلة بنحبها…', 'A dish we love…')}"><input name="where" dir="auto" maxlength="60" placeholder="${L('من فين؟ (اختياري)', 'From where? (optional)')}"><select name="who">${WHO.map(([v, n]) => `<option value="${v}">${esc(n())}</option>`).join('')}</select><button class="btn btn--sm btn--coral" type="submit">♥ ${Y('ضيفها', 'ضيفيها', 'Add it')}</button></form>` : ''}`;
		};
		$('#fd-favs', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-fav]');
			if (b) {
				const [rid] = b.dataset.fav.split('|');
				show(rid);
				fm.classList.add('is-open', 'no-delay');
				stage.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
				setTimeout(() => dish(b.dataset.fav, $(`[data-dish="${CSS.escape(b.dataset.fav)}"]`, fm)), REDUCE ? 0 : 500);
				return;
			}
			const rm = e.target.closest('[data-fav-rm]');
			if (rm && confirm(Y('تشيلها من المفضلة؟', 'تشيليها من المفضلة؟', 'Remove it from the favourites?'))) save((d) => { d.favs = (d.favs || []).filter((x) => x.id !== rm.dataset.favRm); });
		});
		$('#fd-favs', main).addEventListener('submit', (e) => {
			e.preventDefault();
			const f = e.target, name = f.name.value.trim();
			if (!name) return;
			save((d) => { (d.favs = d.favs || []).push({ id: live.newId(), name, where: f.where.value.trim() || undefined, who: f.who.value, by: live.me(), at: Date.now() }); });
		});

		const all = () => (data.items || []).slice();
		const close = () => { fm?.classList.remove('is-open', 'is-in', 'no-delay'); $('.fm__card', fm || stage)?.remove(); };

		/* the band: a café chalkboard on an easel — «مطاعمنا» chalked at the top and every place a line of the menu, the
		   dots running out to the year we first went where the price would be; tap one and its menu opens below */
		const board = $('#fm-band', main);
		let dishes = [];   // what we cook, as the recipes list last painted it
		const drawBoard = () => {
			if (!board) return;
			const xs = all();
			const yr = (r) => String(r.date || '').slice(0, 4);
			const line = (r) => `<li><button type="button" data-r="${esc(r.id)}"${r.id === cur ? ' class="is-on"' : ''}>${badge(r, 'fm-board__logo')}<span dir="auto">${esc(App.t(r.name))}</span><i aria-hidden="true"></i><b>${yr(r) ? num(+yr(r)).replace(/[٬,]/g, '') : '♥'}</b></button></li>`;
			const cooked = (x) => `<li><button type="button" data-rc="${esc(x.id)}"><span dir="auto">${{ dish: '🍲', sweet: '🍰', drink: '🥤' }[x.kind || 'dish']} ${esc(x.name)}</span><i aria-hidden="true"></i><b>${x.made?.length ? `×${num(x.made.length)}` : '♥'}</b></button></li>`;
			board.innerHTML = `<div class="fm-board fm-board--two">
				<span class="fm-board__cup" aria-hidden="true">${doodle('coffee', 44)}</span>
				<div class="fm-board__cols">
					<section class="fm-board__col">
						<p class="fm-board__h">${L('مطاعمنا', 'Our places')}</p>
						${xs.length ? `<ol class="fm-board__list">${xs.map(line).join('')}</ol>` : `<p class="fm-board__wait">${L('لسه مفيش مطاعم', 'No places yet')}</p>`}
					</section>
					<section class="fm-board__col fm-board__col--home">
						<svg class="fm-board__pot" viewBox="0 0 120 92" aria-hidden="true"><path class="fm-board__steam" d="M44 26c-6-8 6-13 0-22M60 26c-6-8 6-13 0-22M76 26c-6-8 6-13 0-22"/><rect x="22" y="40" width="76" height="40" rx="9"/><rect x="14" y="34" width="92" height="8" rx="4"/><rect x="51" y="27" width="18" height="7" rx="3"/><path d="M22 52H8M98 52h14"/></svg>
						<p class="fm-board__h">${L('مطبخنا', 'Our kitchen')}</p>
						${dishes.length ? `<ol class="fm-board__list fm-board__list--home">${dishes.slice(0, 14).map(cooked).join('')}</ol>` : `<p class="fm-board__wait">${L('أول أكلة نطبخها تتكتب هنا', 'The first dish we cook goes here')}</p>`}
					</section>
				</div>
				<p class="fm-board__foot"><button type="button" class="fm-board__luck" id="fm-luck">${doodle('dice', 18)} ${L('نأكل إيه النهارده؟', 'What shall we eat today?')}</button><span>${L('والجاي أحلى ♥', 'More to come ♥')}</span></p>
			</div>`;
			live.hydrateSketches(board);
			$('#fd-n-out', main).textContent = L(`${num(xs.length)} مطعم بالمنيو`, `${xs.length} places, with menus`);
			$('#fd-n-home', main).textContent = dishes.length ? L(`${num(dishes.length)} أكلة بنعملها`, `${dishes.length} dish${dishes.length === 1 ? '' : 'es'} we make`) : L('اللي بنطبخه سوا', 'What we cook together');
		};

		/* برا / في البيت: the restaurants or the recipes under the board */
		const side = (which, scroll) => {
			$$('.fd-side', main).forEach((b) => { const on = b.dataset.side === which; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
			$('#fd-out', main).hidden = which !== 'out';
			$('#recipes', main).hidden = which !== 'home';
			if (scroll) (which === 'out' ? stage : $('#recipes', main)).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
		};
		$('.fd-switch', main).addEventListener('click', (e) => {
			const b = e.target.closest('[data-side]');
			if (!b) return;
			side(b.dataset.side);
			history.replaceState(history.state, '', b.dataset.side === 'home' ? '#recipes' : location.pathname);
		});
		main.addEventListener('rc-items', (e) => { dishes = e.detail || []; drawBoard(); });
		const openDish = (id) => {
			side('home');
			const card = $(`#rc-${CSS.escape(id)}`, main);
			card?.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
			card?.classList.remove('is-picked'); void card?.offsetWidth; card?.classList.add('is-picked');
		};
		const openPlace = (id) => {
			side('out');
			show(id);
			history.replaceState(history.state, '', '#' + id);
			stage.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
		};
		board?.addEventListener('click', (e) => {
			const r = e.target.closest('[data-r]');
			if (r) return openPlace(r.dataset.r);
			const d = e.target.closest('[data-rc]');
			if (d) return openDish(d.dataset.rc);
			/* نأكل إيه النهارده؟ — the chalk runs down both sides and stops on a place or a dish we cook */
			const luck = e.target.closest('#fm-luck');
			if (!luck) return;
			const lines = $$('.fm-board__list button', board);
			if (!lines.length) return;
			const goal = Math.floor(Math.random() * lines.length);
			const steps = lines.length * 2 + goal + 1;
			let n = 0;
			luck.disabled = true;
			const tick = () => {
				lines.forEach((b) => b.classList.remove('is-lit'));
				if (n >= steps) {
					luck.disabled = false;
					const b = lines[goal];
					setTimeout(() => (b.dataset.r ? openPlace(b.dataset.r) : openDish(b.dataset.rc)), 450);
					b.classList.add('is-lit');
					return;
				}
				lines[n % lines.length].classList.add('is-lit');
				n++;
				setTimeout(tick, REDUCE ? 0 : 35 + n * 3);
			};
			tick();
		});

		function show(id) {
			const r = all().find((x) => x.id === id) || all()[0];
			if (!r) { stage.innerHTML = `<p class="empty">${Y('لسه مفيش مطاعم… ضيف أول مطعم بنحبه ♥', 'لسه مفيش مطاعم… ضيفي أول مطعم بنحبه ♥', 'No restaurants yet… add the first place we love ♥')}</p>`; paintList(); paintFavs(); drawBoard(); return; }
			cur = r.id;
			// a place opened from outside the kind picked (the board, an offer, a favourite): back to all of them
			if (cat && !catsOf(r).includes(cat)) cat = '';
			stage.innerHTML = menuHTML(r);
			fm = $('#fm', stage);
			live.hydrateSketches(stage);
			paintList();
			paintToday();
			paintOffers(r);
			paintFavs();
			drawBoard();
			const mine = $('#fm-mine', main);
			const canDel = live.canWrite() && (r.by === live.me() || !r.by);
			// a place without its menu yet: a button that opens the form with its name in, so the menu lands on it
			const needsMenu = live.canWrite() && !(r.sections || []).length;
			mine.hidden = !canDel && !needsMenu && !live.canWrite();
			mine.innerHTML = [needsMenu ? `<button class="btn btn--sm btn--coral" type="button" data-menu="${esc(r.id)}">${doodle('pen', 16)} ${Y('حط المنيو بتاعه', 'حطي المنيو بتاعه', 'Add its menu')}</button>` : '',
				live.canWrite() ? `<label class="btn btn--sm fm-logo-btn">${doodle('camera', 16)} ${r.img ? Y('غيّر اللوجو', 'غيّري اللوجو', 'Change the logo') : Y('حط اللوجو', 'حطي اللوجو', 'Add the logo')}<input type="file" accept="image/*" data-logo="${esc(r.id)}" hidden></label>` : '',
				live.canWrite() ? `<details class="fd-kinds"><summary>${doodle('pen', 16)} ${L('النوع', 'Kinds')}: ${esc(catsOf(r).map((c) => { const k = CATS.find((x) => x.id === c); return k ? L(k.ar, k.en) : c; }).join('، '))}</summary>${CATS.map((c) => `<label class="chip"><input type="checkbox" data-kind="${c.id}"${catsOf(r).includes(c.id) ? ' checked' : ''}> ${esc(L(c.ar, c.en))}</label>`).join('')}</details>` : '',
				canDel ? `<button class="link link--danger" type="button" data-del="${esc(r.id)}">${r.by ? Y('شيل المطعم ده', 'شيلي المطعم ده', 'Remove this restaurant') : Y('شيل المثال ده', 'شيلي المثال ده', 'Remove this example')}</button>` : ''].filter(Boolean).join(' ');
		}

		function dish(key, btn) {
			const [rid, sid, did] = key.split('|');
			const r = all().find((x) => x.id === rid);
			const s = r?.sections.find((x) => x.id === sid);
			const d = s?.dishes.find((x) => x.id === did);
			if (!d) return;
			$('.fm__card', fm)?.remove();
			const card = document.createElement('div');
			card.className = 'fm__card';
			card.setAttribute('role', 'dialog');
			card.setAttribute("aria-label", App.t(d.name));
			const link = safeLink(d.link) || safeLink(r.elmenus) || safeLink(r.link);
			const ok = live.canWrite();
			card.innerHTML = `<button class="fm__x" type="button" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>
				<div class="fm__card-top">
					${d.img ? `<img class="fm__thumb zoom" data-sketch="${esc(d.img)}" alt="${esc(App.t(d.name))}">` : `<span class="fm__card-ic" aria-hidden="true">${doodle(r.icon || 'dinner', 40)}</span>`}
					<div class="fm__card-tx">
						<p class="fm__card-sec">${esc(App.t(s.title))}</p>
						<h5 dir="auto">${esc(App.t(d.name))}</h5>
						${d.desc ? `<p dir="auto">${esc(App.t(d.desc))}</p>` : ''}
					</div>
				</div>
				${d.price ? `<p class="fm__card-price">${esc(price(d.price))}</p>` : ''}
				${d.fav ? `<p class="fm__card-fav">♥ ${L('أكلة', 'A favourite of')} ${esc(FAV[d.fav]())}</p>` : ''}
				${ok ? `<p class="fm__card-love"><span>${L('بنحبها؟', 'Do we love it?')}</span>${WHO.map(([v, n]) => `<button type="button" class="chip${d.fav === v ? ' is-on' : ''}" data-love="${v}">♥ ${esc(n())}</button>`).join('')}${d.fav ? `<button type="button" class="link" data-love="">${L('مش مفضلة', 'Not a favourite')}</button>` : ''}</p>` : ''}
				<div class="fm__card-ft">
					${ok ? `<label class="link fm__pic">${d.img ? Y('غيّر الصورة', 'غيّري الصورة', 'Change the photo') : Y('حط صورة للأكلة', 'حطي صورة للأكلة', 'Add a photo of it')}<input type="file" accept="image/*" hidden></label>` : ''}
					${ok ? `<button class="link fm__lnk" type="button">${d.link ? Y('غيّر اللينك', 'غيّري اللينك', 'Change the link') : Y('حط لينك', 'حطي لينك', 'Add a link')}</button>` : ''}
					${link ? `<a class="fm__go" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${d.link ? Y('شوفها', 'شوفيها', 'See it') : Y('اطلبها', 'اطلبيها', 'Order it')}</a>` : ''}
				</div>`;
			fm.append(card);
			live.hydrateSketches(card);
			// on a phone the menu is three panels tall: bring the card up beside the dish, not in the middle of it all
			if (phone() && btn) {
				const top = btn.getBoundingClientRect().top - fm.getBoundingClientRect().top;
				card.style.top = `${Math.round(top + 20)}px`;
			}
			const edit = (fn) => live.save('food', (x) => {
				const dd = (x.items || []).find((y) => y.id === rid)?.sections?.find((y) => y.id === sid)?.dishes?.find((y) => y.id === did);
				if (dd) fn(dd);
			}).then((v) => {
				data = v;
				show(rid);
				// back open as it was, without folding it all again
				fm.classList.add('is-open', 'no-delay', 'no-anim');
				void fm.offsetWidth;
				fm.classList.remove('no-anim');
				dish(key, $(`[data-dish="${CSS.escape(key)}"]`, fm));
			}).catch((err) => alert(live.why(err)));
			const pic = $('.fm__pic input', card);
			if (pic) pic.onchange = async () => { const f = pic.files[0]; if (!f) return; try { const id = await live.putSketch(await shrinkPhoto(f, 1000)); edit((dd) => { dd.img = id; }); } catch (err) { alert(live.why(err)); } };
			$('.fm__card-love', card)?.addEventListener('click', (e) => { const b = e.target.closest('[data-love]'); if (b) edit((dd) => { dd.fav = b.dataset.love || undefined; }); });
			const lnk = $('.fm__lnk', card);
			if (lnk) lnk.onclick = () => { const u = prompt(L('لينك الأكلة (من الأبلكيشن أو الصفحة)', 'A link for the dish (the app or their page)'), d.link || 'https://'); if (u == null) return; edit((dd) => { dd.link = safeLink(u.trim()) || undefined; }); };
			const back = () => { fm.classList.remove('is-in'); setTimeout(() => card.remove(), REDUCE ? 0 : 600); btn?.focus({ preventScroll: true }); };
			$('.fm__x', card).onclick = back;
			card.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
			requestAnimationFrame(() => { fm.classList.add('is-in', 'no-delay'); $('.fm__x', card).focus({ preventScroll: true }); });
		}

		stage.addEventListener('click', (e) => {
			if (e.target.closest('.fm__open')) {
				fm.classList.add('is-open');
				$('.fm__close', fm)?.focus({ preventScroll: true });
				// on a phone the cover lifts up above where it was: follow it so the first panel is in view
				if (phone()) setTimeout(() => $('.fm__cover', fm).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }), REDUCE ? 0 : 450);
				return;
			}
			if (e.target.closest('.fm__close')) {
				close();
				$('.fm__open', fm)?.focus({ preventScroll: true });
				if (phone()) fm.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
				return;
			}
			const d = e.target.closest('[data-dish]');
			if (d) dish(d.dataset.dish, d);
		});
		$('#fm-mine', main).onclick = async (e) => {
			const m = e.target.closest('[data-menu]');
			if (m) {
				const r = all().find((x) => x.id === m.dataset.menu);
				const box = form.closest('details');
				box.open = true;
				form.name.value = App.t(r.name);
				if (!form.tagline.value) form.tagline.value = App.t(r.tagline || '');
				if (!form.cuisine.value) form.cuisine.value = App.t(r.cuisine || '');
				if (!form.area.value) form.area.value = App.t(r.area || '');
				box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
				setTimeout(() => form.menu.focus({ preventScroll: true }), REDUCE ? 0 : 400);
				return;
			}
			const b = e.target.closest('[data-del]');
			if (!b || !confirm(Y('تشيل المطعم ده بالمنيو بتاعه؟', 'تشيلي المطعم ده بالمنيو بتاعه؟', 'Remove this restaurant and its menu?'))) return;
			try { data = await live.save('food', (d) => { d.items = (d.items || []).filter((x) => x.id !== b.dataset.del); }); show(''); } catch (err) { alert(live.why(err)); }
		};

		$('#fm-mine', main).onchange = async (e) => {
			// a kind ticked or unticked for this place
			if (e.target.closest('[data-kind]')) {
				const picked = $$('[data-kind]:checked', main).map((c) => c.dataset.kind);
				if (picked.length) save((d) => { const x = (d.items || []).find((y) => y.id === cur); if (x) x.cats = picked; });
				return;
			}
			const inp = e.target.closest('[data-logo]');
			const file = inp?.files[0];
			if (!file) return;
			try {
				const id = await live.putSketch(await shrinkPhoto(file, 500));
				data = await live.save('food', (d) => { const x = (d.items || []).find((y) => y.id === inp.dataset.logo); if (x) x.img = id; });
				show(inp.dataset.logo);
			} catch (err) { alert(live.why(err)); }
		};

		const form = $('#fm-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#fm-msg', main);
			const sections = parseMenu(form.menu.value);
			if (!form.name.value.trim()) return;
			if (!sections.length) { msg.textContent = Y('اكتب أكلة واحدة على الأقل في المنيو', 'اكتبي أكلة واحدة على الأقل في المنيو', 'Write at least one dish in the menu'); return; }
			const r = {
				id: live.newId(), name: form.name.value.trim(), tagline: form.tagline.value.trim() || undefined, cuisine: form.cuisine.value.trim() || undefined,
				area: form.area.value.trim() || undefined, phone: form.phone.value.trim() || undefined, order: form.order.value.trim() || undefined,
				color: COLORS[all().length % COLORS.length], icon: 'dinner', sections, cats: [...form.querySelectorAll('[name=cats]:checked')].map((c) => c.value), by: live.me(), at: Date.now()
			};
			// a place already on the list without its menu (same name, in either language) gets the menu, not a twin
			const key = (v) => String(v || '').trim().toLowerCase();
			const named = (x) => [x.name?.ar, x.name?.en, App.t(x.name)].some((n) => key(n) && key(n) === key(r.name));
			const old = all().find((x) => named(x) && !(x.sections || []).length);
			try {
				r.link = safeLink(form.link.value.trim()) || undefined;
				r.elmenus = safeLink(form.elmenus.value.trim()) || undefined;
				if (form.pic.files[0]) r.img = await live.putSketch(await shrinkPhoto(form.pic.files[0], 500));
				if (old) {
					data = await live.save('food', (d) => {
						const x = (d.items || []).find((y) => y.id === old.id);
						if (!x) return;
						x.sections = sections;
						for (const k of ['tagline', 'cuisine', 'area', 'phone', 'order', 'link', 'elmenus', 'img']) if (r[k]) x[k] = r[k];
					});
					form.reset();
					msg.textContent = L('المنيو اتحط ♥', 'Menu added ♥');
					show(old.id);
					stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
					return;
				}
				data = await live.save('food', (d) => { (d.items = d.items || []).push(r); });
				form.reset();
				msg.textContent = L('المنيو اتحط ♥', 'Menu added ♥');
				show(r.id);
				stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} catch (err) { msg.textContent = live.why(err); }
		};

		data = await live.load('food');
		const hash = decodeURIComponent(location.hash.slice(1));
		const find = hash.startsWith('find=') ? hash.slice(5).trim().toLowerCase() : '';
		const place = find && all().find((x) => [x.name?.ar, x.name?.en, App.t(x.name)].some((n) => String(n || '').toLowerCase().includes(find)));
		show(place ? place.id : hash === 'recipes' || find ? '' : hash);
		// «#recipes», or a search result for one of the dishes we cook (not a restaurant): «في البيت», down to the recipes
		const home = hash === 'recipes' || (find && !place);
		if (home) side('home');
		await cooking;
		if (home) setTimeout(() => $('#recipes', main)?.scrollIntoView({ block: 'start' }), 350);
	}
};
