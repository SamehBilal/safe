import { App, L, Y, T, t, esc, img, isVideo, num, parseDate, yearsBetween, daysBetween, age, isToday, yearsAgo, fmtDate, icon, PAGES, occasions, DRAW_KINDS, hydrate, $ } from '../shell.js';
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

/* the house, one card per menu: its first pages, and how many more */
const GROUPS = [
	{ id: 'story', ar: 'حكايتنا', en: 'Our story', ic: 'book', top: ['story', 'chapters', 'places', 'minute'] },
	{ id: 'memories', ar: 'ذكرياتنا', en: 'Memories', ic: 'image', top: ['gallery', 'onthisday', 'notes', 'letters'] },
	{ id: 'family', ar: 'عيلتنا', en: 'Our family', ic: 'family', top: ['family', 'growth', 'sayings', 'familytree'] },
	{ id: 'nights', ar: 'ليالينا', en: 'Our nights', ic: 'moon', top: ['draw', 'music', 'movies', 'bucket'] },
	{ id: 'you', ar: 'مناسباتنا', en: 'Occasions', ic: 'cake', top: ['birthday', 'calendar', 'firsts', 'gifts'] }
];

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
		].filter((x) => x.at).sort((a, b) => b.at - a.at).slice(0, 6);
	},
	render(s) {
		const met = parseDate(s.met);
		const tl = s.timeline || [];
		const now = new Date().toISOString().slice(0, 10);
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const withPhoto = tl.filter((x) => photosOf(x).length);
		const today = tl.filter((x) => !x.when && isToday(x.date));
		const latest = tl.filter((x) => String(x.date) <= now).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
		const occ = occasions(s);
		const next = occ[0];
		const occHref = (o) => (o.kind === 'birthday' ? `birthday.html?id=${o.id}` : o.kind === 'anniversary' ? 'trips.html' : 'story.html');
		const name = (w) => T(w === 'him' ? s.him : s.her);
		const feed = this.feed || [];

		// the hero's scattered photos: five moments from five different years when we can
		const byYear = new Map();
		for (const x of shuffle(withPhoto)) { const y = String(x.date).slice(0, 4); if (!byYear.has(y)) byYear.set(y, x); }
		const heroSnaps = [...byYear.values(), ...shuffle(withPhoto)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
		this.withPhoto = withPhoto;

		// the years of us: each year's photo is its most-photographed moment
		const years = [...new Set(tl.map((x) => String(x.date).slice(0, 4)).filter((y) => /^\d{4}$/.test(y) && y <= now.slice(0, 4)))].sort();
		const yearCard = (y) => {
			const xs = tl.filter((x) => String(x.date).startsWith(y));
			const best = xs.filter((x) => photosOf(x).length).sort((a, b) => photosOf(b).length - photosOf(a).length)[0];
			const ph = xs.reduce((n, x) => n + photosOf(x).length, 0);
			return `<a class="hm-year" href="story.html#y-${y}">${best ? img(photosOf(best)[0], '', 'hm-year__img') : `<span class="hm-year__img hm-year__img--none">${doodle('heart', 34)}</span>`}<b>${num(+y)}</b><small>${L(`${num(xs.length)} ذكرى`, `${xs.length} moment${xs.length === 1 ? '' : 's'}`)}${ph ? ` · ${L(`${num(ph)} صورة`, `${ph} photos`)}` : ''}</small></a>`;
		};

		const stats = [
			[num(daysBetween(met)), L('يوم من أول سلام', 'days since hello')],
			[num(yearsBetween(met)), L('سنة مع بعض', 'years of us')],
			s.married && [num(daysBetween(parseDate(s.married))), L('يوم جواز', 'days married')],
			[num(tl.length), L('ذكرى على حكايتنا', 'moments in our story')],
			[num((s.gallery || []).length + tl.reduce((n, x) => n + photosOf(x).length, 0)), L('صورة', 'photos')]
		].filter(Boolean);
		const quick = [['journal.html', 'pen', L('صفحة في الدفتر', 'A journal page')], ['music.html', 'music', L('أغنية', 'A song')], ['draw.html', 'dice', L('سهرة الليلة', 'Tonight’s plan')], ['trips.html', 'suitcase', L('رحلة', 'A trip')], ['firsts.html', 'baby', L('أول مرة للولاد', 'A first for the boys')]];
		const page = (id) => PAGES.find((p) => p.id === id);
		const firsts = (this.firsts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));

		return `
		<section class="hero hm-hero">
			<div class="hm-hero__snaps" aria-hidden="true">${heroSnaps.map((x, k) => snap(x, photosOf(x)[0], `hm-snap--${k}`)).join('')}</div>
			${next ? `<a class="hero__bday" href="${occHref(next)}">${doodle(next.emoji, 18)} ${next.days === 0 ? `${L('النهارده', 'Today')}: ${esc(next.title)}` : `${esc(next.title)} ${L(`بعد ${num(next.days)} يوم`, `in ${next.days} days`)}`}</a>` : ''}
			<h1 class="hero__title">${L('حكاية حبنا', 'Our Love Story')}</h1>
			<div class="ribbon"><span>${T(s.him)}</span><span class="heart">♥</span><span>${T(s.her)}</span></div>
			<p class="hm-hero__since">${L(`من ${fmtDate(s.met)} — ${num(yearsBetween(met))} سنة ولسه مكملين`, `Since ${fmtDate(s.met)} — ${yearsBetween(met)} years and counting`)}</p>
			<a class="scroll-cue" href="#now" aria-label="${Y('انزل', 'انزلي', 'Scroll down')}">⌄</a>
		</section>

		<section class="sec sec--tight" id="now"><div class="wrap">
			<div class="hm-today">
				${today.length ? today.map((x) => `<a class="otd otd--photo reveal" href="moment.html?id=${esc(x.id)}"><span class="otd__ph">${img(otdPhoto(s, x), '', 'otd__img')}<span class="otd__ic">${doodle(x.icon, 22)}</span></span><span><small>${L('النهارده', 'On this day')} · ${yearsAgo(x.date)}</small><b>${T(x.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>`).join('')
					: `<a class="otd reveal" href="onthisday.html"><span class="otd__ic">${doodle('calendar', 28)}</span><span><small>${L('في اليوم ده', 'On this day')}</small><b>${L('مفيش ذكرى في تاريخ النهارده — شوف الأيام اللي جنبه', 'Nothing on today’s date — look at the days around it')}</b></span><span aria-hidden="true">${App.arrow}</span></a>`}
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
			<div class="hm-years">${years.map(yearCard).join('')}</div>
		</div></section>

		<section class="sec"><div class="wrap">
			<h2 class="sec__title reveal">${L('آخر الحكاية', 'Latest in our story')}</h2>
			<div class="cards3 hm-latest">${latest.map((x) => `
				<a class="mini reveal" href="moment.html?id=${esc(x.id)}">
					${photosOf(x).length ? img(photosOf(x)[0], '', 'hm-latest__img') : ''}
					<span class="mini__ic">${doodle(x.icon, 30)}</span>
					<time>${esc(dateOf(x))}</time>
					<b>${T(x.title)}</b>
					<p>${T(x.text)}</p>
				</a>`).join('')}
			</div>
			<p class="center"><a class="btn" href="story.html">${L('الحكاية كاملة', 'The whole story')} ${App.arrow}</a> <a class="btn btn--ghost" href="minute.html">${doodle('clapper', 18)} ${L('الحكاية في دقيقة', 'Our story in a minute')}</a></p>
		</div></section>

		<section class="sec"><div class="wrap home-cols">
			<div>
				<h2 class="sec__title reveal">${L('آخر أخبارنا', 'What’s new with us')}</h2>
				${feed.length ? `<ol class="feed">${feed.map((x) => `
					<li class="reveal"><a href="${esc(x.href)}"><span class="feed__e" aria-hidden="true">${doodle(x.e, 26)}</span>
						<span><span><b>${x.by ? name(x.by) : ''}</b> ${esc(x.what)}${x.text ? `: <q dir="auto">${esc(t(x.text).slice(0, 90))}</q>` : ''}</span><small>${ago(x.at)}</small></span></a></li>`).join('')}</ol>`
					: `<p class="empty">${Y('لسه محدش كتب حاجة — ابدأ بصفحة في الدفتر ♥', 'لسه محدش كتب حاجة — ابدئي بصفحة في الدفتر ♥', 'Nothing added yet — start with a journal page ♥')}</p>`}
			</div>
			<div>
				<h2 class="sec__title reveal">${L('جاي قريب', 'Coming up')}</h2>
				<ul class="coming">${occ.slice(0, 5).map((o) => `
					<li class="reveal"><a href="${occHref(o)}"><span class="feed__e" aria-hidden="true">${doodle(o.emoji, 26)}</span><span><b>${esc(o.title)}</b><small>${fmtDate(o.date).slice(0, 5)} · ${esc(o.sub)}</small></span>
						<em>${o.days === 0 ? L('النهارده', 'today') : L(`${num(o.days)} يوم`, `${o.days} days`)}</em></a></li>`).join('')}</ul>
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
					<a class="hm-kid__top" href="member.html?id=${esc(k.id)}">${ph ? img(ph, '', 'hm-kid__img') : `<span class="hm-kid__img hm-kid__img--none">${doodle(k.emoji || 'baby', 44)}</span>`}
						<span><b>${T(k.name)}</b><small>${esc(age(k.born))}</small></span></a>
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
			}).join('')}</div>
		</div></section>

		${s.poster ? `
		<section class="sec"><div class="wrap">
			<figure class="poster reveal" data-media-box>${img(s.poster, L('حكايتنا في صفحة', 'Our story on one page'), 'zoom')}</figure>
		</div></section>` : ''}`;
	},
	after(main) {
		live.hydrateSketches(main);
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
