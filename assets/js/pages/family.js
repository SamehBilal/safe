import { L, Y, T, esc, img, num, age, longDate, parseDate, yearsBetween, pageHead, related, App, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import { treeHTML, wireTree } from '../tree.js';
import * as live from '../live.js';

/* Our family, and our family tree, on one page (the tree had a page of its own, familytree.html, which now sends you
   here). Band: the tree growing — the trunk draws itself, branches reach out, leaves and little hearts pop on them —
   and the four of us hanging on its branches; under it «جريدة بيتنا», folded, with the family tree (the shared list
   «tree») and the four of us on its inside pages. */
const leaf = (x, y, i, heart) => heart
	? `<path class="fx-leaf fx-heart" style="--i:${i}" transform="translate(${x} ${y})" d="M0 6-7-1a4 4 0 0 1 7-5 4 4 0 0 1 7 5Z"/>`
	: `<ellipse class="fx-leaf" style="--i:${i}" cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${(i * 47) % 180 - 90} ${x} ${y})"/>`;
const LEAVES = [[420, 70], [380, 95], [450, 50], [560, 60], [600, 85], [520, 40], [330, 120], [670, 115], [480, 30], [620, 50], [360, 70], [700, 90], [300, 95], [540, 90], [400, 40], [650, 30]];
/* where the four of us hang: the grown-ups on the two long branches, the boys on the two higher ones */
const HANG = [[310, 120], [690, 115], [430, 45], [600, 45]];

function band(members) {
	return `<div class="lp-band lp-band--familytree fam-band" aria-hidden="true">
		<svg class="fx-svg" viewBox="0 0 1000 220">
			<path class="fx-ground" d="M300 212 Q500 196 700 212"/>
			<path class="fx-trunk" d="M500 212 C 498 170, 506 140, 500 110"/>
			<path class="fx-branch" style="--i:1" d="M500 130 C 460 110, 420 100, 360 90"/>
			<path class="fx-branch" style="--i:2" d="M500 120 C 540 100, 590 92, 650 80"/>
			<path class="fx-branch" style="--i:3" d="M500 110 C 490 80, 470 60, 430 45"/>
			<path class="fx-branch" style="--i:4" d="M500 110 C 520 80, 560 60, 600 45"/>
			<path class="fx-branch" style="--i:5" d="M500 150 C 440 140, 380 130, 310 120"/>
			<path class="fx-branch" style="--i:6" d="M500 145 C 560 135, 620 125, 690 115"/>
			${LEAVES.map(([x, y], i) => leaf(x, y, i, i % 5 === 2)).join('')}
			${members.slice(0, 4).map((m, i) => `<path class="fam-band__string" style="--i:${i}" d="M${HANG[i][0]} ${HANG[i][1]}v14"/>`).join('')}
		</svg>
		${members.slice(0, 4).map((m, i) => `<span class="fam-band__one" style="--x:${HANG[i][0] / 10}%;--y:${((HANG[i][1] + 14) / 220) * 100}%;--c:${esc(m.color || '#0e6990')};--i:${i}">
			<span class="fam-band__pic">${m.photo ? img(m.photo, '') : doodle(m.emoji, 30)}</span><b>${T(m.name)}</b></span>`).join('')}
	</div>`;
}

/* ---------- «جريدة بيتنا»: a real paper, new every day, written from what we have — the big news (a birthday or our
   anniversary today, or the latest «first» of the boys), «النهارده من سنين» from our story, a saying of the boys, the
   numbers of the day, what's coming up, and classified ads for the things on our goals sheet. Which story, saying and
   ads it prints is picked by the date, so the paper changes at midnight and stays the same all day. ---------- */
const DAY = Math.floor(Date.now() / 864e5);
const pickOf = (arr, salt = 0) => (arr.length ? arr[(DAY * 31 + salt * 17) % arr.length] : null);
const mdOf = (iso) => String(iso || '').slice(5, 10);
const todayMD = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function nextOf(iso) { const d = parseDate(iso), now = new Date(); now.setHours(0, 0, 0, 0); const n = new Date(now.getFullYear(), d.getMonth(), d.getDate()); if (n < now) n.setFullYear(n.getFullYear() + 1); return Math.round((n - now) / 864e5); }
/* The paper is the page: it comes first, folded in half the way it lands on the doorstep — the masthead and the front
   page's top showing, «افتح الجريدة» to open it — and inside it has pages, turned with the arrows or the page numbers:
   ١ the family tree (tree.js), ٢ the front page, ٣ family news (the four of us), ٤ odds and ends (the quote of the day
   and the classifieds). */
const PAGES = [['شجرة العيلتين', 'The family tree'], ['الصفحة الأولى', 'Front page'], ['أخبار العيلة', 'Family news'], ['منوعات', 'Odds & ends']];
function paperHTML(s, f, members) {
	const today = new Date();
	return `<article class="np2 is-folded reveal" id="np" style="--n:${PAGES.length}">
		<header class="np2-mast">
			<p class="np2-mast__ear"><span>${L('أول جريدة عائلية', 'A family newspaper')}</span><span>${L('بتصدر كل يوم', 'Out every day')}</span></p>
			<h2 class="np2-name">${T(f.paper) || L('جريدة بيتنا', 'The Daily Us')}</h2>
			<div class="np2-bar"><span>${L('العدد', 'Issue')} ${num(s.married ? Math.floor((Date.now() - parseDate(s.married)) / 864e5) : yearsBetween(parseDate(s.met)))}</span><span>${today.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span>${L('التمن: حضن', 'Price: one hug')}</span></div>
		</header>
		<div class="np2-sheet" id="np-sheet">
			<section class="np2-page is-on" data-p="0" id="tree"><h3 class="np2-sec">${L(...PAGES[0])}</h3><div class="fam-tree">${treeHTML(s)}</div></section>
			<section class="np2-page" data-p="1"><div id="np-front"><p class="np__wait">${L('المطبعة شغالة…', 'The presses are rolling…')}</p></div></section>
			<section class="np2-page" data-p="2"><h3 class="np2-sec">${L(...PAGES[2])}</h3>
				<div class="np2-news">${members.map((m) => `<article class="np2-story">
					${m.photo ? `<div class="np2-story__pic" data-media-box>${img(m.photo, App.t(m.name), 'zoom')}</div>` : `<span class="np2-story__ic">${doodle(m.emoji, 44)}</span>`}
					<h4>${T(m.name)}</h4>
					<em>${T(m.role)}${m.born ? ` · ${m.kid ? esc(age(m.born)) : `${L('مواليد', 'born')} ${esc(longDate(m.born))}`}` : ''}</em>
					${m.text ? `<p dir="auto">${T(m.text)}</p>` : ''}
					<a class="np2-more" href="member.html?id=${esc(m.id)}">${L('التفاصيل في صفحته', 'More on the inside page')} ${App.arrow || '←'}</a>
				</article>`).join('')}</div>
			</section>
			<section class="np2-page" data-p="3"><h3 class="np2-sec">${L(...PAGES[3])}</h3><div id="np-misc"></div></section>
		</div>
		<div class="np2-fold"><button class="btn btn--coral" type="button" id="np-open">${doodle('scroll', 18)} ${L('افتح الجريدة', 'Open the paper')}</button></div>
		<nav class="np2-pager" aria-label="${L('صفحات الجريدة', 'The paper’s pages')}">
			<button class="np2-turn" type="button" data-go="-1" aria-label="${L('الصفحة اللي قبلها', 'Previous page')}">${doodle(L('forward', 'back'), 18)}</button>
			<span class="np2-tabs">${PAGES.map((p, i) => `<button type="button" class="np2-tab${i ? '' : ' is-on'}" data-p="${i}"><b>${num(i + 1)}</b><small>${esc(L(...p))}</small></button>`).join('')}</span>
			<button class="np2-turn" type="button" data-go="1" aria-label="${L('الصفحة اللي بعدها', 'Next page')}">${doodle(L('back', 'forward'), 18)}</button>
		</nav>
	</article>`;
}
/* fold, unfold and turn */
function wirePaper(main) {
	const np = main.querySelector('#np');
	if (!np) return;
	let at = 0;
	const pages = [...np.querySelectorAll('.np2-page')];
	const go = (i, scroll) => {
		i = Math.max(0, Math.min(pages.length - 1, i));
		np.classList.remove('is-folded');
		if (i !== at) {
			const dir = i > at ? 'next' : 'prev';
			pages.forEach((p, k) => { p.classList.toggle('is-on', k === i); p.classList.remove('turn-next', 'turn-prev'); });
			void pages[i].offsetWidth;
			pages[i].classList.add(`turn-${dir}`);
			at = i;
		}
		np.querySelectorAll('.np2-tab').forEach((t) => t.classList.toggle('is-on', +t.dataset.p === at));
		np.querySelectorAll('[data-go]').forEach((b) => { b.disabled = (+b.dataset.go < 0 && at === 0) || (+b.dataset.go > 0 && at === pages.length - 1); });
		if (scroll) np.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
	};
	np.addEventListener('click', (e) => {
		if (e.target.closest('#np-open')) return go(0);
		const t = e.target.closest('.np2-tab, [data-goto]'), b = e.target.closest('[data-go]');
		if (t) go(+(t.dataset.p ?? t.dataset.goto), true);
		if (b) go(at + +b.dataset.go, true);
	});
	np.querySelectorAll('[data-go]').forEach((b) => { b.disabled = +b.dataset.go < 0; });
	// a link to the tree (family.html#tree, or the old familytree.html) opens the paper at the tree
	if (location.hash === '#tree') setTimeout(() => go(0, true), 300);
}
async function fillPaper(main, s, f) {
	const box = main.querySelector('#np-front'), misc = main.querySelector('#np-misc');
	if (!box) return;
	const members = f.members || [];
	const [firsts, sayings, goals] = await Promise.all(['firsts', 'sayings', 'goals'].map((k) => live.load(k).catch(() => ({ items: [] }))));
	const nameOf = (id) => App.t(members.find((m) => m.id === id)?.name || id);
	const md = todayMD();

	/* the big news */
	let head = T(f.headline), lead = T(f.lead), stamp = '';
	const bday = members.find((m) => m.born && mdOf(m.born) === md);
	const recent = (firsts.items || []).filter((x) => x.date && (Date.now() - parseDate(x.date)) / 864e5 <= 21).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
	if (bday) { head = L(`كل سنة و${App.t(bday.name)} ${bday.female ? 'طيبة' : 'طيب'}!`, `Happy birthday, ${App.t(bday.name)}!`); lead = L(`النهارده ${App.t(bday.name)} ${bday.female ? 'بتكمّل' : 'بيكمّل'} ${age(bday.born)} — والعيلة كلها بتحتفل`, `${App.t(bday.name)} turns ${age(bday.born)} today — the whole family is celebrating`); stamp = L('عيد ميلاد', 'Birthday'); }
	else if (s.married && mdOf(s.married) === md) { head = L(`${num(yearsBetween(parseDate(s.married)))} سنين جواز — ولسه في البداية`, `${yearsBetween(parseDate(s.married))} years married — and still just beginning`); lead = L('عيد جواز سعيد للعريس والعروسة ♥', 'Happy anniversary to the bride and groom ♥'); stamp = L('عيد جواز', 'Anniversary'); }
	else if (recent) { head = L(`عاجل: ${nameOf(recent.kid)} — ${recent.what}`, `Breaking: ${nameOf(recent.kid)} — ${recent.what}`); lead = recent.note || lead; stamp = L('عاجل', 'Breaking'); }

	/* on this day, years ago — or a page from the archive */
	const story = (s.timeline || []).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date || ''));
	const same = story.filter((t) => mdOf(t.date) === md);
	const old = pickOf(same.length ? same : story, 1);
	const oldPhoto = old && (old.photo || old.photos?.[0]);
	const yrs = old ? new Date().getFullYear() - +old.date.slice(0, 4) : 0;

	/* a saying of the boys, the numbers of the day, what's coming, the ads */
	const say = pickOf(sayings.items || [], 2);
	const kids = members.filter((m) => m.kid && m.born);
	const nums = [
		s.met && [num(Math.floor((Date.now() - parseDate(s.met)) / 864e5)), L('يوم من أول سلام', 'days since the first hello')],
		s.married && [num(Math.floor((Date.now() - parseDate(s.married)) / 864e5)), L('يوم جواز', 'days married')],
		...kids.map((k) => [age(k.born), L(`عمر ${App.t(k.name)}`, `${App.t(k.name)}’s age`)])
	].filter(Boolean);
	const coming = [
		...members.filter((m) => m.born).map((m) => ({ t: L(`عيد ميلاد ${App.t(m.name)}`, `${App.t(m.name)}’s birthday`), d: nextOf(m.born) })),
		s.married && { t: L('عيد جوازنا', 'Our anniversary'), d: nextOf(s.married) },
		s.met && { t: L('ذكرى أول سلام', 'The day we met'), d: nextOf(s.met) }
	].filter(Boolean).sort((a, b) => a.d - b.d).slice(0, 3);
	const wants = (goals.items || []).filter((g) => !g.done);
	const ads = [0, 1, 2, 3].map((i) => pickOf(wants, 3 + i * 7)).filter((g, i, a) => g && a.indexOf(g) === i);
	const when = (d) => (d === 0 ? L('النهارده!', 'today!') : d === 1 ? L('بكرة', 'tomorrow') : L(`بعد ${num(d)} يوم`, `in ${d} days`));

	box.innerHTML = `
		${stamp ? `<span class="np__stamp">${esc(stamp)}</span>` : ''}
		<h3 class="np2-head" dir="auto">${esc(head || '')}</h3>
		${lead ? `<p class="np2-lead" dir="auto">${esc(lead)}</p>` : ''}
		<div class="np2-front">
			${old ? `<a class="np2-main" href="moment.html?id=${encodeURIComponent(old.id)}">
				<p class="np2-kick">${same.length ? L(`النهارده من ${num(yrs)} ${yrs === 1 ? 'سنة' : yrs === 2 ? 'سنتين' : 'سنين'}`, `On this day, ${yrs} year${yrs === 1 ? '' : 's'} ago`) : L('من أرشيف الجريدة', 'From the archive')}</p>
				${oldPhoto ? `<span class="np2-pic">${img(oldPhoto, App.t(old.title))}</span>` : ''}
				<h4 dir="auto">${T(old.title)}</h4>
				<em>${esc(longDate(old.date))}</em>
				${old.text ? `<p dir="auto">${T(old.text)}</p>` : ''}
			</a>` : ''}
			<aside class="np2-side">
				<section><p class="np2-kick">${L('أرقام النهارده', 'Today’s numbers')}</p>
					<ul class="np2-nums">${nums.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ul></section>
				<section><p class="np2-kick">${L('قريب', 'Coming up')}</p>
					<ul class="np2-soon">${coming.map((c) => `<li><span>${esc(c.t)}</span><b>${esc(when(c.d))}</b></li>`).join('')}</ul></section>
				<section class="np2-index"><p class="np2-kick">${L('في العدد ده', 'In this issue')}</p>
					<ul>${PAGES.map((p, i) => (i === 1 ? '' : `<li><button type="button" data-goto="${i}"><span>${esc(L(...p))}</span><b>${L('ص', 'p.')} ${num(i + 1)}</b></button></li>`)).join('')}</ul></section>
			</aside>
		</div>`;
	if (misc) misc.innerHTML = `<div class="np2-misc">
		${say ? `<a class="np2-quote" href="sayings.html"><p class="np2-kick">${L('كلمة اليوم', 'Quote of the day')}</p>
			<blockquote dir="auto">«${esc(say.said)}»</blockquote><cite>— ${esc(nameOf(say.kid))}${say.means ? ` · ${L('يقصد', 'meaning')} «${esc(say.means)}»` : ''}</cite></a>` : ''}
		${ads.length ? `<a class="np2-ads" href="goals.html"><p class="np2-kick">${L('إعلانات مبوبة', 'Classifieds')}</p>
			${ads.map((g) => `<p class="np2-ad">${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="">` : ''}<span><b>${L('مطلوب:', 'Wanted:')}</b> <span dir="auto">${esc(L(g.title, g.en || g.title))}</span><small>${L('للتواصل: البيت', 'Contact: home')}</small></span></p>`).join('')}</a>` : ''}
		<div class="np2-weather"><p class="np2-kick">${L('حالة الجو في البيت', 'Weather at home')}</p><p>${doodle('sun', 30)} <b>${L('دافي ومليان حب', 'Warm, with plenty of love')}</b></p><small>${L('فرصة حضن: ١٠٠٪', 'Chance of hugs: 100%')}</small></div>
	</div>
	<p class="np__foot">${L('اتطبعت بحب في بيتنا — العدد الجاي بكرة الصبح', 'Printed with love at home — next issue tomorrow morning')}</p>`;
	hydrate(box); hydrate(misc || box);
	live.hydrateSketches(main.querySelector('#np'));
}

export default {
	title: { ar: 'عيلتنا', en: 'Our family' },
	render(s) {
		const f = s.family || {};
		const members = f.members || [];
		const today = new Date();
		return `
		${pageHead(L('عيلتنا', 'Our family'), Y('خبر عاجل! اقرا كل حاجة عننا — وشجرة العيلتين اللي بقوا عيلة واحدة', 'خبر عاجل! اقري كل حاجة عننا — وشجرة العيلتين اللي بقوا عيلة واحدة', 'Extra! Extra! Read all about us — and the tree of two families that became one'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }], { band: band(members) })}
		<section class="sec sec--top"><div class="wrap">
			${paperHTML(s, f, members)}
		</div></section>
		${related(['shopping', 'distances', 'nokta', 'growth'])}`;
	},
	after(main, s) { wirePaper(main); fillPaper(main, s, s.family || {}); return wireTree(main, s); }
};
