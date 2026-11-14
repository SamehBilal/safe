import { App, L, Y, T, t, esc, img, isVideo, num, parseDate, yearsBetween, daysBetween, age, isToday, yearsAgo, fmtDate, icon, PAGES, occasions, DRAW_KINDS } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { GOVERNORATES } from '../egypt.js';
const GOV = Object.fromEntries(GOVERNORATES.map((g) => [g.id, g]));

/* Home: our life at a glance — today's occasion (or the next one), what either of us added lately,
   what's coming up, quick ways to add to it, then us in numbers and the rest of the house. */
// Arabic verbs follow who did it: كتب (him) / كتبت (her)
const verb = (by, him, her, en) => L(by === 'her' ? her : him, en);
const ago = (ms) => {
	const d = Math.floor((Date.now() - ms) / 864e5);
	if (d <= 0) return L('النهارده', 'today');
	if (d === 1) return L('امبارح', 'yesterday');
	return L(`من ${num(d)} يوم`, `${d} days ago`);
};

/* the photo for an «on this day» card: the moment's own, else the nearest moment in time that has one, so the card never goes without */
const still = (p) => (typeof p === 'string' ? p : p?.photo) || '';
const photosOf = (x) => [x.photo, ...(x.photos || [])].map(still).filter((p) => p && !isVideo(p));
function otdPhoto(s, x) {
	const own = photosOf(x)[0];
	if (own) return own;
	const at = parseDate(x.date)?.getTime() || 0;
	const near = (s.timeline || []).filter((m) => photosOf(m).length).sort((a, b) => Math.abs((parseDate(a.date)?.getTime() || 0) - at) - Math.abs((parseDate(b.date)?.getTime() || 0) - at))[0];
	return near ? photosOf(near)[0] : (s.gallery || []).map((g) => g.photo).find((p) => p && !isVideo(p)) || '';
}

export default {
	title: { ar: 'الرئيسية', en: 'Home' },
	async load() {
		const [journal, draw, trips, music, movies] = await Promise.all(['journal', 'draw', 'trips', 'music', 'movies'].map((k) => live.load(k).catch(() => ({ items: [] }))));
		this.feed = [
			...(journal.items || []).map((x) => ({ at: x.at, by: x.by, e: x.mood || 'pen', what: verb(x.by, 'كتب صفحة في الدفتر', 'كتبت صفحة في الدفتر', 'wrote in the journal'), text: x.title || x.text, href: `journal.html#${x.id}` })),
			...(draw.history || []).map((x) => { const k = DRAW_KINDS.find((d) => d.id === x.kind) || DRAW_KINDS[0]; return { at: x.at, by: x.by, e: k.emoji, what: L(k.ar, k.en), text: x.text, href: `draw.html?k=${k.id}` }; }),
			...(trips.items || []).filter((x) => x.gov).map((x) => ({ at: x.at, by: x.by, e: 'suitcase', what: verb(x.by, 'سجّل رحلة', 'سجّلت رحلة', 'logged a trip'), text: `${x.year} · ${GOV[x.gov] ? L(GOV[x.gov].ar, GOV[x.gov].en) : ''}`, href: `trip.html?id=${x.id}` })),
			...(trips.items || []).flatMap((x) => (x.memories || []).map((m) => ({ at: m.at, by: m.by, e: 'camera', what: verb(m.by, 'ضاف ذكرى لرحلة', 'ضافت ذكرى لرحلة', 'added a trip memory'), text: m.text || (GOV[x.gov] ? L(GOV[x.gov].ar, GOV[x.gov].en) : ''), href: `trip.html?id=${x.id}` }))),
			...(music.items || []).map((x) => ({ at: x.at, by: x.by, e: 'music', what: verb(x.by, 'ضاف أغنية', 'ضافت أغنية', 'added a song'), text: [x.title, x.artist].filter(Boolean).join(' — '), href: `music.html#${x.id}` })),
			...(movies.items || []).map((x) => ({ at: x.at, by: x.by, e: 'popcorn', what: L('اتفرجنا على', 'we watched'), text: x.title, href: `movies.html#${x.id}` }))
		].filter((x) => x.at).sort((a, b) => b.at - a.at).slice(0, 8);
	},
	render(s) {
		const met = parseDate(s.met);
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const today = (s.timeline || []).filter((x) => isToday(x.date));
		const latest = (s.timeline || []).slice(-3).reverse();
		const occ = occasions(s);
		const next = occ[0];
		const occHref = (o) => (o.kind === 'birthday' ? `birthday.html?id=${o.id}` : o.kind === 'anniversary' ? 'trips.html' : 'story.html');
		const name = (w) => T(w === 'him' ? s.him : s.her);
		const stats = [
			[num(daysBetween(met)), L('يوم من أول سلام', 'days since hello')],
			[num(yearsBetween(met)), L('سنة مع بعض', 'years of us')],
			s.married && [num(daysBetween(parseDate(s.married))), L('يوم جواز', 'days married')],
			[num(2 + kids.length), L('أفراد في العيلة', 'of us now')],
			...kids.map((k) => [age(k.born), L(`عمر ${App.t(k.name)}`, `${App.t(k.name)}’s age`)])
		].filter(Boolean);
		const features = PAGES.filter((p) => p.id !== 'home' && p.group !== 'app');
		const quick = [['journal.html', 'pen', L('صفحة في الدفتر', 'A journal page')], ['music.html', 'music', L('أغنية', 'A song')], ['draw.html', 'dice', L('سهرة الليلة', 'Tonight’s plan')], ['trips.html', 'suitcase', L('رحلة', 'A trip')], ['movies.html', 'popcorn', L('فيلم اتفرجنا عليه', 'A film we watched')]];
		const feed = this.feed || [];

		return `
		<section class="hero">
			${next ? `<a class="hero__bday" href="${occHref(next)}">${doodle(next.emoji, 18)} ${next.days === 0 ? `${L('النهارده', 'Today')}: ${esc(next.title)}` : `${esc(next.title)} ${L(`بعد ${num(next.days)} يوم`, `in ${next.days} days`)}`}</a>` : ''}
			<h1 class="hero__title">${L('حكاية حبنا', 'Our Love Story')}</h1>
			<div class="ribbon"><span>${T(s.him)}</span><span class="heart">♥</span><span>${T(s.her)}</span></div>
			<a class="scroll-cue" href="#now" aria-label="${Y('انزل', 'انزلي', 'Scroll down')}">⌄</a>
		</section>

		<section class="sec sec--tight" id="now"><div class="wrap">
			${today.map((x) => `<a class="otd otd--photo reveal" href="moment.html?id=${esc(x.id)}"><span class="otd__ph">${img(otdPhoto(s, x), '', 'otd__img')}<span class="otd__ic">${doodle(x.icon, 22)}</span></span><span><small>${L('النهارده', 'On this day')} · ${yearsAgo(x.date)}</small><b>${T(x.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>`).join('')}
			<h2 class="sec__title reveal" style="margin-top:24px">${Y('ضيف للنهارده', 'ضيفي للنهارده', 'Add to today')}</h2>
			<div class="quick">${quick.map(([href, e, label]) => `<a class="quick__btn reveal" href="${href}"><span aria-hidden="true">${doodle(e, 22)}</span>${esc(label)}</a>`).join('')}</div>
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

		<section class="sec" id="numbers">
			<div class="wrap">
				<h2 class="sec__title reveal">${L('إحنا بالأرقام', 'Us in numbers')}</h2>
				<div class="counters">${stats.map(([n, l], k) => `<div class="counter reveal" style="--delay:${k * 0.06}s"><b>${n}</b><span>${esc(l)}</span></div>`).join('')}</div>
				<p class="center"><a class="btn" href="numbers.html">${L('كل الأرقام', 'All the numbers')} ${App.arrow}</a></p>
			</div>
		</section>

		<section class="sec">
			<div class="wrap">
				<h2 class="sec__title reveal">${L('جوه البيت ده', 'Inside this home')}</h2>
				<p class="sec__sub reveal">${L('كل ركن هنا فيه حتة من حكايتنا', 'Every corner here holds a piece of our story')}</p>
				<div class="tiles">${features.map((p, k) => `
					<a class="tile reveal" href="${p.href}" style="--delay:${(k % 4) * 0.06}s">${icon(p.ic, 28)}<b>${esc(L(p.ar, p.en))}</b><small>${esc(L(p.dar, p.den))}</small></a>`).join('')}
				</div>
			</div>
		</section>

		<section class="sec">
			<div class="wrap">
				<h2 class="sec__title reveal">${L('آخر الحكاية', 'Latest in our story')}</h2>
				<div class="cards3">${latest.map((x) => `
					<a class="mini reveal" href="moment.html?id=${esc(x.id)}">
						<span class="mini__ic">${doodle(x.icon, 30)}</span>
						<time>${fmtDate(x.date)}</time>
						<b>${T(x.title)}</b>
						<p>${T(x.text)}</p>
					</a>`).join('')}
				</div>
				<p class="center"><a class="btn" href="story.html">${L('الحكاية كاملة', 'The whole story')} ${App.arrow}</a></p>
			</div>
		</section>

		${s.poster ? `
		<section class="sec">
			<div class="wrap">
				<figure class="poster reveal" data-media-box>${img(s.poster, L('حكايتنا في صفحة', 'Our story on one page'), 'zoom')}</figure>
			</div>
		</section>` : ''}`;
	}
};
