import { App, L, Y, T, t, esc, img, isVideo, num, parseDate, yearsBetween, daysBetween, age, isToday, yearsAgo, fmtDate, icon, PAGES, occasions, DRAW_KINDS, hydrate, REDUCE, $ } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { GOVERNORATES } from '../egypt.js';
const GOV = Object.fromEntries(GOVERNORATES.map((g) => [g.id, g]));

/* Home: our life at a glance, top to bottom —
   the title with a handful of our photos scattered around it; today (on this day, the next occasion, quick ways to add);
   a memory pulled at random; the years of us, each with its photo; the newest moments; what either of us added lately
   and what's coming; the boys' corner; us in numbers; and the house, one card per menu. */
// Arabic verbs follow who did it: كتب (him) / كتبت (her)
const verb = (by, him, her, en) => L(by === 'her' ? her : him, en);
const ago = (ms) => {
	const d = Math.floor((Date.now() - ms) / 864e5);
	if (d <= 0) return L('النهارده', 'today');
	if (d === 1) return L('امبارح', 'yesterday');
	return L(`من ${num(d)} يوم`, `${d} days ago`);
};

const still = (p) => (typeof p === 'string' ? p : p?.photo) || '';
const photosOf = (x) => [x.photo, ...(x.photos || [])].map(still).filter((p) => p && !isVideo(p));
/* the photo for an «on this day» card: the moment's own, else the nearest moment in time that has one, so the card never goes without */
function otdPhoto(s, x) {
	const own = photosOf(x)[0];
	if (own) return own;
	const at = parseDate(x.date)?.getTime() || 0;
	const near = (s.timeline || []).filter((m) => photosOf(m).length).sort((a, b) => Math.abs((parseDate(a.date)?.getTime() || 0) - at) - Math.abs((parseDate(b.date)?.getTime() || 0) - at))[0];
	return near ? photosOf(near)[0] : (s.gallery || []).map((g) => g.photo).find((p) => p && !isVideo(p)) || '';
}
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const dateOf = (x) => (x.when ? App.t(x.when) : fmtDate(x.date));

/* «حكايتنا بالسنين» as a stage (after Noel Delgado's «Mobiltelefonens Evolution»): one big polaroid for the year, two
   more of that year's photos fanned behind it, and a ruler of years underneath that slides to keep the year in the
   middle, fading out at both ends. It plays through the years on its own and stops while you're looking (hover, touch,
   focus) or when it's off screen; ‹ ›, the arrow keys, a swipe or a tap on any year moves it by hand. */
function yearStage(main, years) {
	const box = $('#hm-yrs', main);
	if (!box || !years.length) return;
	const stage = $('#hm-yrs-stage', box), cap = $('#hm-yrs-cap', box), track = $('#hm-ruler', box);
	const yr = (y) => new Intl.NumberFormat(App.lang === 'ar' ? 'ar-EG' : 'en', { useGrouping: false }).format(+y);
	const marks = [...track.querySelectorAll('.hm-ruler__y')];
	let i = 0, timer = 0, hold = false, seen = false, dir = 1;
	const show = (n, by) => {
		i = (n + years.length) % years.length;
		const Yr = years[i];
		dir = by || 1;
		const tilt = ((i * 37) % 7) - 3;
		stage.innerHTML = Yr.best
			? `${Yr.behind.map((p, k) => `<span class="hm-yrs__back" style="--k:${k}" data-media-box>${img(p, '', 'hm-yrs__img')}</span>`).join('')}
				<a class="hm-yrs__front" href="moment.html?id=${esc(Yr.best.id)}" style="--t:${tilt}deg;--d:${dir}" data-media-box>${img(Yr.best.photo, Yr.best.title, 'hm-yrs__img')}<span class="hm-yrs__yr">${yr(Yr.y)}</span></a>`
			: `<a class="hm-yrs__front hm-yrs__front--note" href="story.html#y-${Yr.y}" style="--t:${tilt}deg;--d:${dir}">
				<span class="hm-yrs__note">${Yr.notes.map((x) => `<span>${doodle(x.icon, 20)} <b dir="auto">${esc(x.title)}</b></span>`).join('')}</span>
				<span class="hm-yrs__yr">${yr(Yr.y)}</span></a>`;
		cap.innerHTML = `<b class="hm-yrs__big">${yr(Yr.y)}</b>
			<span>${L(`${num(Yr.count)} ذكرى`, `${Yr.count} moment${Yr.count === 1 ? '' : 's'}`)}${Yr.photos ? ` · ${L(`${num(Yr.photos)} صورة`, `${Yr.photos} photos`)}` : ''}</span>
			<a href="story.html#y-${Yr.y}">${Yr.best ? esc(Yr.best.title) : L('السنة دي في حكايتنا', 'This year in our story')} ${App.arrow}</a>`;
		marks.forEach((m, k) => { m.classList.toggle('is-on', k === i); m.setAttribute('aria-current', k === i ? 'true' : 'false'); });
		// slide the ruler so this year sits in the middle
		const ruler = track.parentElement, m = marks[i];
		track.style.transform = `translateX(${ruler.clientWidth / 2 - (m.offsetLeft + m.offsetWidth / 2)}px)`;
		hydrate(stage);
	};
	const play = () => { clearInterval(timer); if (!REDUCE && !hold && seen) timer = setInterval(() => show(i + 1, 1), 2400); };
	box.addEventListener('click', (e) => {
		const b = e.target.closest('[data-step]'); if (b) { show(i + +b.dataset.step, +b.dataset.step); play(); return; }
		const y = e.target.closest('.hm-ruler__y'); if (y) { const n = +y.dataset.i; show(n, n > i ? 1 : -1); play(); }
	});
	box.addEventListener('keydown', (e) => {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault(); const s = e.key === 'ArrowRight' ? 1 : -1; show(i + s, s); play();
	});
	let x0 = null;
	box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; hold = true; clearInterval(timer); }, { passive: true });
	box.addEventListener('touchend', (e) => { if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); } x0 = null; hold = false; play(); });
	for (const [ev, h] of [['mouseenter', true], ['mouseleave', false], ['focusin', true], ['focusout', false]]) box.addEventListener(ev, () => { hold = h; h ? clearInterval(timer) : play(); });
	if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { seen = en.isIntersecting; seen ? play() : clearInterval(timer); }, { threshold: 0.35 }).observe(box);
	else { seen = true; play(); }
	addEventListener('resize', () => show(i, dir));
	show(0, 1);
}

/* the house, one card per menu: its first pages, and how many more */
const GROUPS = [
	{ id: 'story', ar: 'حكايتنا', en: 'Our story', ic: 'book', top: ['story', 'chapters', 'atlas', 'minute'] },
	{ id: 'memories', ar: 'ذكرياتنا', en: 'Memories', ic: 'image', top: ['gallery', 'onthisday', 'notes', 'letters'] },
	{ id: 'nights', ar: 'ليالينا', en: 'Our nights', ic: 'moon', top: ['draw', 'music', 'movies', 'adventures'] },
	{ id: 'kids', ar: 'ولادنا', en: 'Our kids', ic: 'baby', top: ['firsts', 'growth', 'sayings', 'school'] },
	{ id: 'home', ar: 'بيتنا', en: 'Our home', ic: 'home', top: ['routine', 'meals', 'shopping', 'expenses'] },
	{ id: 'people', ar: 'عيلتنا وناسنا', en: 'Family & people', ic: 'family', top: ['family', 'people', 'calendar', 'birthday'] }
];

/* the house itself, filling the row beside the last card: a drawn house with a window for every room
   (each opens that room's first page), a door that opens a page at random, and the newest corners pinned beside it */
const NEWEST = ['school', 'meals', 'papers'];
const house = (page) => {
	const rooms = GROUPS.map((g) => ({ g, p: page(g.top[0]) })).filter((r) => r.p);
	const door = PAGES[Math.floor(Math.random() * PAGES.length)];
	const win = ({ g, p }, k) => `<a class="hm-house__win" href="${p.href}" style="--k:${k}"><span class="hm-house__glass">${icon(g.ic, 20)}</span><small>${esc(L(g.ar, g.en))}</small></a>`;
	const fresh = NEWEST.map(page).filter(Boolean);
	return `<div class="hm-house reveal">
		<div class="hm-house__home">
			<span class="hm-house__smoke" aria-hidden="true">${icon('heart', 15)}${icon('heart', 12)}${icon('heart', 9)}</span>
			<svg class="hm-house__roof" viewBox="0 0 300 96" preserveAspectRatio="none" aria-hidden="true"><path class="hm-house__chim" d="M214 47 V12 h24 v49" /><path d="M4 94 L150 6 L296 94" /><path class="hm-house__tiles" d="M64 68 h172 M104 44 h92 M134 26 h32" /></svg>
			<div class="hm-house__body">
				${rooms.slice(0, 3).map(win).join('')}
				${rooms[3] ? win(rooms[3], 3) : '<i></i>'}
				<a class="hm-house__door" href="${door.href}" title="${esc(L(door.ar, door.en))}"><span>${L('افتح الباب', 'Open the door')}</span><small>${L('صفحة مفاجأة', 'a surprise page')}</small></a>
				${rooms[4] ? win(rooms[4], 4) : '<i></i>'}
			</div>
			<p class="hm-house__mat">${L(`${num(GROUPS.length)} أوض · ${num(PAGES.length)} ركن`, `${GROUPS.length} rooms · ${PAGES.length} corners`)}</p>
		</div>
		${fresh.length ? `<div class="hm-house__new">
			<h3>${icon('star', 20)} ${L('جديد في البيت', 'New in the house')}</h3>
			${fresh.map((p, k) => `<a class="hm-house__note" href="${p.href}" style="--k:${k}">${icon(p.ic, 18)}<span><b>${esc(L(p.ar, p.en))}</b><small>${esc(L(p.dar, p.den))}</small></span></a>`).join('')}
		</div>` : ''}
	</div>`;
};

/* one moment as a polaroid: photo, date on the white strip, title in hand */
const snap = (x, p, cls = '') => `<a class="hm-snap ${cls}" href="moment.html?id=${esc(x.id)}">${img(p, '', 'hm-snap__img')}<span class="hm-snap__cap"><small>${esc(dateOf(x))}</small><b dir="auto">${T(x.title)}</b></span></a>`;

export default {
	title: { ar: 'الرئيسية', en: 'Home' },
	async load() {
		const [journal, draw, trips, music, movies, firsts] = await Promise.all(['journal', 'draw', 'trips', 'music', 'movies', 'firsts'].map((k) => live.load(k).catch(() => ({ items: [] }))));
		this.firsts = (firsts.items || []).filter((x) => x.kid);
		this.feed = [
			...(journal.items || []).map((x) => ({ at: x.at, by: x.by, e: x.mood || 'pen', what: verb(x.by, 'كتب صفحة في الدفتر', 'كتبت صفحة في الدفتر', 'wrote in the journal'), text: x.title || x.text, href: `journal.html#${x.id}` })),
			...(draw.history || []).map((x) => { const k = DRAW_KINDS.find((d) => d.id === x.kind) || DRAW_KINDS[0]; return { at: x.at, by: x.by, e: k.emoji, what: L(k.ar, k.en), text: x.text, href: `draw.html?k=${k.id}` }; }),
			...(trips.items || []).filter((x) => x.gov).map((x) => ({ at: x.at, by: x.by, e: 'suitcase', what: verb(x.by, 'سجّل رحلة', 'سجّلت رحلة', 'logged a trip'), text: `${x.year} · ${GOV[x.gov] ? L(GOV[x.gov].ar, GOV[x.gov].en) : ''}`, href: `trip.html?id=${x.id}` })),
			...(trips.items || []).flatMap((x) => (x.memories || []).map((m) => ({ at: m.at, by: m.by, e: 'camera', what: verb(m.by, 'ضاف ذكرى لرحلة', 'ضافت ذكرى لرحلة', 'added a trip memory'), text: m.text || (GOV[x.gov] ? L(GOV[x.gov].ar, GOV[x.gov].en) : ''), href: `trip.html?id=${x.id}` }))),
			...(music.items || []).map((x) => ({ at: x.at, by: x.by, e: 'music', what: verb(x.by, 'ضاف أغنية', 'ضافت أغنية', 'added a song'), text: [x.title, x.artist].filter(Boolean).join(' — '), href: `music.html#${x.id}` })),
			...(movies.items || []).map((x) => ({ at: x.at, by: x.by, e: 'popcorn', what: L('اتفرجنا على', 'we watched'), text: x.title, href: `movies.html#${x.id}` })),
			...this.firsts.map((x) => ({ at: x.at, by: x.by, e: 'star', what: verb(x.by, 'سجّل أول مرة', 'سجّلت أول مرة', 'logged a first'), text: x.what, href: 'firsts.html' }))
		].filter((x) => x.at).sort((a, b) => b.at - a.at).slice(0, 60)
			// the same thing done by the same one on the same day folds into one line: «ضاف ٦ أغاني: …»
			.reduce((out, x) => {
				const p = out.at(-1), day = (ms) => new Date(ms).toDateString();
				if (p && p.by === x.by && p.what === x.what && day(p.at) === day(x.at)) { p.more.push(x); if (x.text) p.texts.push(x.text); }
				else out.push({ ...x, more: [], texts: x.text ? [x.text] : [] });
				return out;
			}, []).slice(0, 6);
	},
	render(s) {
		const met = parseDate(s.met);
		const tl = s.timeline || [];
		const now = new Date().toISOString().slice(0, 10);
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const withPhoto = tl.filter((x) => photosOf(x).length);
		const today = tl.filter((x) => !x.when && isToday(x.date));
		const latest = tl.filter((x) => String(x.date) <= now).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
		const occ = occasions(s);
		const next = occ[0];
		const occHref = (o) => (o.kind === 'birthday' ? `birthday.html?id=${o.id}` : o.kind === 'anniversary' ? 'anniversaries.html' : 'story.html');
		const name = (w) => T(w === 'him' ? s.him : s.her);
		const feed = this.feed || [];

		// the hero's scattered photos: five moments from five different years when we can
		const byYear = new Map();
		for (const x of shuffle(withPhoto)) { const y = String(x.date).slice(0, 4); if (!byYear.has(y)) byYear.set(y, x); }
		const heroSnaps = [...byYear.values(), ...shuffle(withPhoto)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
		this.withPhoto = withPhoto;

		// the years of us: each year's photo is its most-photographed moment
		const years = [...new Set(tl.map((x) => String(x.date).slice(0, 4)).filter((y) => /^\d{4}$/.test(y) && y <= now.slice(0, 4)))].sort();
		// for the year stage: each year's best moment (the most photographed), two more photos from other moments to
		// fan out behind it, and for a year without photos, its moments as a handwritten list
		this.years = years.map((y) => {
			const xs = tl.filter((x) => String(x.date).startsWith(y));
			const shot = xs.filter((x) => photosOf(x).length).sort((a, b) => photosOf(b).length - photosOf(a).length);
			const best = shot[0];
			return {
				y, count: xs.length, photos: xs.reduce((n, x) => n + photosOf(x).length, 0),
				best: best ? { id: best.id, title: t(best.title), photo: photosOf(best)[0] } : null,
				behind: shot.slice(1).map((x) => photosOf(x)[0]).concat(best ? photosOf(best).slice(1) : []).slice(0, 2),
				notes: xs.slice(0, 4).map((x) => ({ id: x.id, icon: x.icon, title: t(x.title) }))
			};
		});

		// «كنا فين الأسبوع ده»: what was happening this same week (three days either side of today) in every past year
		const md = (d) => { const p = parseDate(d); return p ? Date.UTC(2000, p.getMonth(), p.getDate()) : NaN; };
		const todayMd = md(now);
		const span = (d) => { const k = Math.abs(md(d) - todayMd) / 864e5; return Math.min(k, 366 - k); };
		const thisWeek = new Map();
		for (const x of tl) {
			const y = String(x.date).slice(0, 4);
			if (x.when || !/^\d{4}-\d{2}-\d{2}/.test(x.date) || y >= now.slice(0, 4) || span(x.date) > 3) continue;
			if (!thisWeek.has(y)) thisWeek.set(y, []);
			thisWeek.get(y).push(x);
		}
		const weekYears = [...thisWeek.keys()].sort((a, b) => b.localeCompare(a));
		const yr = (y) => new Intl.NumberFormat(App.lang === 'ar' ? 'ar-EG' : 'en', { useGrouping: false }).format(+y);
		const dayMonth = (d) => new Intl.DateTimeFormat(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long' }).format(parseDate(d));

		const stats = [
			[num(daysBetween(met)), L('يوم من أول سلام', 'days since hello')],
			[num(yearsBetween(met)), L('سنة مع بعض', 'years of us')],
			s.married && [num(daysBetween(parseDate(s.married))), L('يوم جواز', 'days married')],
			[num(tl.length), L('ذكرى على حكايتنا', 'moments in our story')],
			[num((s.gallery || []).length + tl.reduce((n, x) => n + photosOf(x).length, 0)), L('صورة', 'photos')]
		].filter(Boolean);
		const quick = [['journal.html', 'pen', L('صفحة في الدفتر', 'A journal page')], ['music.html', 'music', L('أغنية', 'A song')], ['draw.html', 'dice', L('سهرة الليلة', 'Tonight’s plan')], ['anniversaries.html', 'suitcase', L('رحلة', 'A trip')], ['firsts.html', 'baby', L('أول مرة للولاد', 'A first for the boys')]];
		const page = (id) => PAGES.find((p) => p.id === id);
		const firsts = (this.firsts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));

		return `
		<section class="hero hm-hero">
			<div class="hm-hero__snaps" aria-hidden="true">${heroSnaps.map((x, k) => snap(x, photosOf(x)[0], `hm-snap--${k}`)).join('')}</div>
			${next ? `<a class="hero__bday" href="${occHref(next)}">${doodle(next.emoji, 18)} ${next.days === 0 ? `${L('النهارده', 'Today')}: ${esc(next.title)}` : `${esc(next.title)} ${L(`بعد ${num(next.days)} يوم`, `in ${next.days} days`)}`}</a>` : ''}
			<h1 class="hero__title">${L('حكاية حبنا', 'Our Love Story')}</h1>
			<div class="ribbon"><span>${T(s.him)}</span><span class="heart">♥</span><span>${T(s.her)}</span></div>
			<p class="hm-hero__since" aria-label="${esc(L(`من ${fmtDate(s.met)} — ${num(yearsBetween(met))} سنة ولسه مكملين`, `Since ${fmtDate(s.met)} — ${yearsBetween(met)} years and counting`))}"><span class="hm-since__from"><small>${L("من", "since")}</small><b>${fmtDate(s.met)}</b></span><span class="hm-since__stamp"><b>${num(yearsBetween(met))}</b><small>${L("سنة", "years")}</small></span><span class="hm-since__go">${L("ولسه مكملين…", "and counting…")}</span></p>
			<a class="scroll-cue" href="#now" aria-label="${Y('انزل', 'انزلي', 'Scroll down')}">⌄</a>
		</section>

		<section class="sec sec--tight" id="now"><div class="wrap">
			<div class="hm-today">
				${today.length ? today.map((x) => `<a class="otd otd--photo reveal" href="moment.html?id=${esc(x.id)}"><span class="otd__ph">${img(otdPhoto(s, x), '', 'otd__img')}<span class="otd__ic">${doodle(x.icon, 22)}</span></span><span><small>${L('النهارده', 'On this day')} · ${yearsAgo(x.date)}</small><b>${T(x.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>`).join('')
					: `<a class="otd reveal" href="onthisday.html"><span class="otd__ic">${doodle('calendar', 28)}</span><span><small>${L('في اليوم ده', 'On this day')}</small><b>${L('مفيش ذكرى في تاريخ النهارده — شوف السنة كلها يوم يوم', 'Nothing on today’s date — see the whole year, day by day')}</b></span><span aria-hidden="true">${App.arrow}</span></a>`}
			</div>
			<h2 class="sec__title reveal" style="margin-top:24px">${Y('ضيف للنهارده', 'ضيفي للنهارده', 'Add to today')}</h2>
			<div class="quick">${quick.map(([href, e, label]) => `<a class="quick__btn reveal" href="${href}"><span aria-hidden="true">${doodle(e, 22)}</span>${esc(label)}</a>`).join('')}</div>
		</div></section>

		${withPhoto.length ? `
		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('ذكرى من الدرج', 'A memory from the drawer')}</h2>
			<p class="sec__sub reveal">${L('كل ما تفتح الصفحة، ذكرى غير اللي قبلها', 'A different one every time you open the page')}</p>
			<div class="hm-rand reveal" id="hm-rand"></div>
		</div></section>` : ''}

		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('حكايتنا بالسنين', 'Our story, year by year')}</h2>
			<p class="sec__sub reveal">${L(`${num(years.length)} سنة، كل سنة بصورتها`, `${years.length} years, each with its photo`)}</p>
			<div class="hm-yrs reveal" id="hm-yrs" tabindex="0" role="region" aria-roledescription="${L('سنين', 'years')}" aria-label="${L('حكايتنا بالسنين', 'Our story, year by year')}">
				<div class="hm-yrs__stage" id="hm-yrs-stage"></div>
				<div class="hm-yrs__cap" id="hm-yrs-cap" aria-live="polite"></div>
				<div class="hm-yrs__nav" dir="ltr">
					<button class="hm-yrs__btn" type="button" data-step="-1" aria-label="${L('السنة اللي قبلها', 'Previous year')}">‹</button>
					<div class="hm-ruler"><div class="hm-ruler__track" id="hm-ruler">${years.map((y, i) => `<button class="hm-ruler__y" type="button" data-i="${i}" aria-label="${yr(y)}"><i aria-hidden="true"></i><b>${yr(y)}</b></button>${i < years.length - 1 ? '<span class="hm-ruler__m" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' : ''}`).join('')}</div></div>
					<button class="hm-yrs__btn" type="button" data-step="1" aria-label="${L('السنة اللي بعدها', 'Next year')}">›</button>
				</div>
			</div>
		</div></section>

		${weekYears.length ? `<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('كنا فين الأسبوع ده', 'This week in our story')}</h2>
			<p class="sec__sub reveal">${L(`الأسبوع ده (حوالين ${dayMonth(now)}) في السنين اللي فاتت`, `This same week (around ${dayMonth(now)}) in the years before`)}</p>
			<div class="hm-week">${weekYears.map((y, i) => `
				<div class="hm-week__yr reveal" style="--i:${i}">
					<span class="hm-week__pin" aria-hidden="true"></span>
					<span class="hm-week__tab"><b>${yr(y)}</b><small>${esc(yearsAgo(`${y}-${now.slice(5, 10)}`))}</small></span>
					${thisWeek.get(y).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((x) => `
					<a class="hm-week__m" href="moment.html?id=${esc(x.id)}">
						<span class="hm-week__pic">${photosOf(x).length ? img(photosOf(x)[0], '', 'hm-week__img') : doodle(x.icon, 26)}</span>
						<span class="hm-week__tx"><small>${esc(dayMonth(x.date))}</small><b dir="auto">${T(x.title)}</b></span>
					</a>`).join('')}
				</div>`).join('')}
			</div>
		</div></section>` : ''}

		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('آخر الحكاية', 'Latest in our story')}</h2>
			${latest.length ? (() => {
				// the newest page of the diary, open — its photo taped on, the text in full — and the pages before it
				// strung on a thread beside it, newest first
				const [top, ...rest] = latest, ph = photosOf(top)[0];
				return `<div class="hm-diary">
				<a class="hm-page reveal" href="moment.html?id=${esc(top.id)}">
					<span class="hm-page__holes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
					<span class="hm-page__tab">${L("آخر صفحة", "Latest page")}</span>
					<span class="hm-page__pic${ph ? "" : " is-empty"}">${ph ? img(ph, "", "hm-page__img") : doodle(top.icon, 64)}</span>
					<span class="hm-page__tx">
						<time>${esc(dateOf(top))}</time>
						<b>${T(top.title)}</b>
						${top.text ? `<p>${T(top.text)}</p>` : ""}
						<span class="hm-page__go">${L("افتح الصفحة", "Open the page")} ${App.arrow}</span>
					</span>
				</a>
				${rest.length ? `<div class="hm-thread reveal">
					<p class="hm-thread__h">${L("واللي قبلها", "And before that")}</p>
					<ol>${rest.map((x, k) => { const p = photosOf(x)[0]; return `<li style="--k:${k}"><a href="moment.html?id=${esc(x.id)}">
						<span class="hm-thread__pic">${p ? img(p, "", "hm-thread__img") : doodle(x.icon, 26)}</span>
						<span class="hm-thread__tx"><time>${esc(dateOf(x))}</time><b>${T(x.title)}</b></span>
					</a></li>`; }).join("")}</ol>
				</div>` : ""}
			</div>`;
			})() : ""}
			<p class="center"><a class="btn" href="story.html">${L('الحكاية كاملة', 'The whole story')} ${App.arrow}</a> <a class="btn btn--ghost" href="minute.html">${doodle('clapper', 18)} ${L('الحكاية في دقيقة', 'Our story in a minute')}</a></p>
		</div></section>

		<section class="sec"><div class="wrap home-cols">
			<div>
				<h2 class="sec__title reveal">${L('آخر أخبارنا', 'What’s new with us')}</h2>
				${feed.length ? (() => {
					// a notepad clipped to the page: the days as stamped headings, each thing done as a line on it
					let last = "";
					return `<div class="hm-pad reveal"><span class="hm-pad__clip" aria-hidden="true"></span><ol class="hm-pad__list">${feed.map((x) => {
						const d = ago(x.at), head = d !== last ? `<li class="hm-pad__day"><span>${d}</span></li>` : "";
						last = d;
						const n = x.more.length;
						return `${head}<li class="hm-pad__ln"><a href="${esc(x.href)}"><span class="hm-pad__e" aria-hidden="true">${doodle(x.e, 22)}</span>
							<span class="hm-pad__tx"><span><b>${x.by ? name(x.by) : ""}</b> ${esc(x.what)}${n ? ` <em class="hm-pad__n">×${num(n + 1)}</em>` : ""}</span>
							${x.texts.length ? `<q dir="auto">${x.texts.slice(0, 3).map((q) => esc(t(q).slice(0, 48))).join(" · ")}</q>${x.texts.length > 3 ? `<small class="hm-pad__more">${L(`و${num(x.texts.length - 3)} كمان`, `and ${x.texts.length - 3} more`)}</small>` : ""}` : ""}</span></a></li>`;
					}).join("")}</ol></div>`;
				})()
					: `<p class="empty">${Y("لسه محدش كتب حاجة — ابدأ بصفحة في الدفتر ♥", "لسه محدش كتب حاجة — ابدئي بصفحة في الدفتر ♥", "Nothing added yet — start with a journal page ♥")}</p>`}
			</div>
			<div>
				<h2 class="sec__title reveal">${L("جاي قريب", "Coming up")}</h2>
				${occ.length ? (() => {
					// the nearest one as a big countdown, the rest as torn calendar leaves on a string
					const leaf = (o) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o.days); return d; };
					const mon = (d) => new Intl.DateTimeFormat(App.lang === "ar" ? "ar-EG" : "en-GB", { month: "short" }).format(d);
					const [o, ...rest] = occ.slice(0, 5), d0 = leaf(o);
					return `<a class="hm-count reveal" href="${occHref(o)}">
						<span class="hm-count__e" aria-hidden="true">${doodle(o.emoji, 30)}</span>
						<span class="hm-count__tx"><small>${L("اللي جاي", "Next up")}</small><b>${esc(o.title)}</b><small>${num(d0.getDate())} ${esc(mon(d0))} · ${esc(o.sub)}</small></span>
						<span class="hm-count__n">${o.days === 0 ? `<b>♥</b><small>${L("النهارده", "today")}</small>` : `<b>${num(o.days)}</b><small>${L("يوم", o.days === 1 ? "day" : "days")}</small>`}</span>
					</a>
					<ul class="hm-leaves">${rest.map((x, k) => { const d = leaf(x); return `<li class="reveal" style="--k:${k}"><a href="${occHref(x)}">
						<span class="hm-leaf" aria-hidden="true"><small>${esc(mon(d))}</small><b>${num(d.getDate())}</b></span>
						<span class="hm-leaves__tx"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span>
						<em>${L(`بعد ${num(x.days)} يوم`, `in ${x.days} days`)}</em>
					</a></li>`; }).join("")}</ul>`;
				})() : ""}
			</div>
		</div></section>

		${kids.length ? `
		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('ركن الولاد', 'The boys’ corner')}</h2>
			<div class="hm-kids">${kids.map((k) => {
				const f = firsts.find((x) => x.kid === k.id);
				const mine = tl.filter((x) => (x.who || []).includes(k.id) && photosOf(x).length).sort((a, b) => String(b.date).localeCompare(String(a.date)));
				const ph = k.photo || (mine[0] && photosOf(mine[0])[0]);
				return `<div class="hm-kid reveal">
					<span class="hm-kid__tape" aria-hidden="true"></span>
					<a class="hm-kid__top" href="member.html?id=${esc(k.id)}">
						<span class="hm-kid__pic">${ph ? img(ph, '', 'hm-kid__img') : `<span class="hm-kid__img hm-kid__img--none">${doodle(k.emoji || 'baby', 44)}</span>`}</span>
						<span class="hm-kid__tx"><b>${T(k.name)}</b><small>${esc(age(k.born))}</small><span class="hm-kid__go">${L('صفحته', 'His page')} ${App.arrow}</span></span>
					</a>
					${f ? `<a class="hm-kid__first" href="firsts.html">${f.photo ? `<img data-sketch="${esc(f.photo)}" alt="" loading="lazy">` : ''}<span><small>${L('آخر أول مرة', 'Latest first')} · ${fmtDate(f.date)}</small><b dir="auto">${esc(f.what)}</b></span></a>`
						: `<a class="hm-kid__first hm-kid__first--empty" href="firsts.html"><span><small>${L('أول مرة', 'Firsts')}</small><b>${Y('سجّل أول حاجة عملها', 'سجّلي أول حاجة عملها', 'Log his first first')} +</b></span></a>`}
				</div>`;
			}).join('')}</div>
		</div></section>` : ''}

		<section class="sec" id="numbers"><div class="wrap">
			<h2 class="sec__title reveal">${L('إحنا بالأرقام', 'Us in numbers')}</h2>
			<div class="counters hm-counters">${stats.map(([n, l], k) => `<div class="counter reveal" style="--delay:${k * 0.06}s"><b>${n}</b><span>${esc(l)}</span></div>`).join('')}</div>
			<p class="center"><a class="btn" href="numbers.html">${L('كل الأرقام', 'All the numbers')} ${App.arrow}</a></p>
		</div></section>

		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('جوه البيت ده', 'Inside this home')}</h2>
			<p class="sec__sub reveal">${L('كل ركن هنا فيه حتة من حكايتنا', 'Every corner here holds a piece of our story')}</p>
			<div class="hm-rooms">${GROUPS.map((g) => {
				const all = PAGES.filter((p) => p.group === g.id);
				const top = g.top.map(page).filter(Boolean);
				return `<div class="hm-room reveal">
					<h3>${icon(g.ic, 22)} ${esc(L(g.ar, g.en))}</h3>
					<ul>${top.map((p) => `<li><a href="${p.href}">${icon(p.ic, 18)}<span><b>${esc(L(p.ar, p.en))}</b><small>${esc(L(p.dar, p.den))}</small></span></a></li>`).join('')}</ul>
					${all.length > top.length ? `<p class="hm-room__more">${L(`و${num(all.length - top.length)} صفحات تانية في القايمة فوق`, `and ${all.length - top.length} more in the menu above`)}</p>` : ''}
				</div>`;
			}).join('')}${house(page)}</div>
		</div></section>

		${s.poster ? `
		<section class="sec"><div class="wrap">
			<figure class="poster reveal" data-media-box>${img(s.poster, L('حكايتنا في صفحة', 'Our story on one page'), 'zoom')}</figure>
		</div></section>` : ''}`;
	},
	after(main) {
		live.hydrateSketches(main);
		yearStage(main, this.years || []);
		const box = $('#hm-rand', main);
		const pool = this.withPhoto || [];
		if (!box || !pool.length) return;
		let last = null;
		const draw = () => {
			let x = pick(pool);
			if (x === last && pool.length > 1) x = pool[(pool.indexOf(x) + 1) % pool.length];
			last = x;
			const p = pick(photosOf(x));
			box.innerHTML = `${snap(x, p, 'hm-snap--big')}
				<div class="hm-rand__tx">
					<span class="hm-rand__ic">${doodle(x.icon, 34)}</span>
					<small>${esc(dateOf(x))}${x.when ? '' : ` · ${esc(yearsAgo(x.date))}`}</small>
					<b dir="auto">${T(x.title)}</b>
					${x.text ? `<p dir="auto">${T(x.text)}</p>` : ''}
					<div class="hm-rand__acts">
						<button class="btn btn--coral" type="button" id="hm-again">${doodle('dice', 18)} ${L('واحدة كمان', 'Another one')}</button>
						<a class="btn btn--ghost" href="moment.html?id=${esc(x.id)}">${L(`كل صور اليوم ده (${num(photosOf(x).length)})`, `All ${photosOf(x).length} photos`)} ${App.arrow}</a>
					</div>
				</div>`;
			hydrate(box);
			$('#hm-again', box).onclick = draw;
		};
		draw();
	}
};
