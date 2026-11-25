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
/* The page is a book lying on the table: its cover is our family tree (tree.js), whole and alive — tap anyone on it.
   «افتح الجريدة» swings the cover open and «جريدة بيتنا» opens over the whole window, on a dark table, with nothing
   to scroll: every page is cut to fit the screen. On a wide screen it lies open two pages at a time like a real paper,
   on a phone one page at a time; the pages turn on their spine with the arrows, the page numbers, the arrow keys or a
   swipe, and ✕ or Esc folds it away again. The pages: the front page (the big news, and «النهارده من سنين» with its
   photo), the numbers and what's coming, a page for each of us, the quote of the day and the weather, the classifieds. */

/* everything the paper prints today, picked by the date so it stays the same all day */
async function paperData(s, f) {
	const members = f.members || [];
	const [firsts, sayings, goals] = await Promise.all(['firsts', 'sayings', 'goals'].map((k) => live.load(k).catch(() => ({ items: [] }))));
	const nameOf = (id) => App.t(members.find((m) => m.id === id)?.name || id);
	const md = todayMD();
	let head = T(f.headline), lead = T(f.lead), stamp = '';
	const bday = members.find((m) => m.born && mdOf(m.born) === md);
	const recent = (firsts.items || []).filter((x) => x.date && (Date.now() - parseDate(x.date)) / 864e5 <= 21).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
	if (bday) { head = L(`كل سنة و${App.t(bday.name)} ${bday.female ? 'طيبة' : 'طيب'}!`, `Happy birthday, ${App.t(bday.name)}!`); lead = L(`النهارده ${App.t(bday.name)} ${bday.female ? 'بتكمّل' : 'بيكمّل'} ${age(bday.born)} — والعيلة كلها بتحتفل`, `${App.t(bday.name)} turns ${age(bday.born)} today — the whole family is celebrating`); stamp = L('عيد ميلاد', 'Birthday'); }
	else if (s.married && mdOf(s.married) === md) { head = L(`${num(yearsBetween(parseDate(s.married)))} سنين جواز — ولسه في البداية`, `${yearsBetween(parseDate(s.married))} years married — and still just beginning`); lead = L('عيد جواز سعيد للعريس والعروسة ♥', 'Happy anniversary to the bride and groom ♥'); stamp = L('عيد جواز', 'Anniversary'); }
	else if (recent) { head = L(`عاجل: ${nameOf(recent.kid)} — ${recent.what}`, `Breaking: ${nameOf(recent.kid)} — ${recent.what}`); lead = recent.note || lead; stamp = L('عاجل', 'Breaking'); }
	const story = (s.timeline || []).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date || ''));
	const same = story.filter((t) => mdOf(t.date) === md);
	const old = pickOf(same.length ? same : story, 1);
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
	].filter(Boolean).sort((a, b) => a.d - b.d).slice(0, 4);
	const wants = (goals.items || []).filter((g) => !g.done);
	return {
		members, head, lead, stamp, old, same: same.length > 0, nums, coming, nameOf,
		yrs: old ? new Date().getFullYear() - +old.date.slice(0, 4) : 0,
		say: pickOf(sayings.items || [], 2),
		ads: [0, 1, 2, 3].map((i) => pickOf(wants, 3 + i * 7)).filter((g, i, a) => g && a.indexOf(g) === i)
	};
}

/* the pages, each one a whole page that fits the screen */
function paperPages(s, f, d) {
	const when = (n) => (n === 0 ? L('النهارده!', 'today!') : n === 1 ? L('بكرة', 'tomorrow') : L(`بعد ${num(n)} يوم`, `in ${n} days`));
	const oldPhoto = d.old && (d.old.photo || d.old.photos?.[0]);
	const pages = [];
	pages.push({ name: L('الصفحة الأولى', 'Front page'), html: `
		<div class="dp-front">
			${d.stamp ? `<span class="dp-stamp">${esc(d.stamp)}</span>` : ''}
			<h3 class="dp-head" dir="auto">${esc(d.head || L('يوم جديد في بيتنا', 'A new day at home'))}</h3>
			${d.lead ? `<p class="dp-lead" dir="auto">${esc(d.lead)}</p>` : ''}
			${d.old ? `<a class="dp-story" href="moment.html?id=${encodeURIComponent(d.old.id)}">
				<p class="dp-kick">${d.same ? L(`النهارده من ${num(d.yrs)} ${d.yrs === 1 ? 'سنة' : d.yrs === 2 ? 'سنتين' : 'سنين'}`, `On this day, ${d.yrs} year${d.yrs === 1 ? '' : 's'} ago`) : L('من أرشيف الجريدة', 'From the archive')}</p>
				${oldPhoto ? `<span class="dp-pic" data-media-box>${img(oldPhoto, App.t(d.old.title))}</span>` : ''}
				<b dir="auto">${T(d.old.title)}</b><em>${esc(longDate(d.old.date))}</em>
				${d.old.text ? `<p dir="auto">${T(d.old.text)}</p>` : ''}
			</a>` : ''}
		</div>` });
	pages.push({ name: L('أرقام وأخبار', 'Numbers & news'), html: `
		<div class="dp-cols">
			<section><p class="dp-kick">${L('أرقام النهارده', 'Today’s numbers')}</p>
				<ul class="dp-nums">${d.nums.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ul></section>
			<section><p class="dp-kick">${L('قريب', 'Coming up')}</p>
				<ul class="dp-soon">${d.coming.map((c) => `<li><span>${esc(c.t)}</span><b>${esc(when(c.d))}</b></li>`).join('')}</ul></section>
			<section class="dp-index"><p class="dp-kick">${L('في العدد ده', 'In this issue')}</p><ol id="dp-index"></ol></section>
		</div>` });
	for (const m of d.members) pages.push({ name: T(m.name), html: `
		<article class="dp-one" style="--c:${esc(m.color || '#0e6990')}">
			<p class="dp-kick">${L('أخبار العيلة', 'Family news')}</p>
			${m.photo ? `<span class="dp-pic" data-media-box>${img(m.photo, App.t(m.name))}</span>` : `<span class="dp-pic dp-pic--ic">${doodle(m.emoji || 'heart', 70)}</span>`}
			<h3 class="dp-name">${T(m.name)}</h3>
			<em>${T(m.role)}${m.born ? ` · ${m.kid ? esc(age(m.born)) : `${L('مواليد', 'born')} ${esc(longDate(m.born))}`}` : ''}</em>
			${m.text ? `<p dir="auto">${T(m.text)}</p>` : ''}
			<a class="dp-more" href="member.html?id=${esc(m.id)}">${L('التفاصيل في صفحته', 'More on the inside page')} ${App.arrow || '←'}</a>
		</article>` });
	pages.push({ name: L('منوعات', 'Odds & ends'), html: `
		<div class="dp-misc">
			${d.say ? `<a class="dp-quote" href="sayings.html"><p class="dp-kick">${L('كلمة اليوم', 'Quote of the day')}</p>
				<blockquote dir="auto">«${esc(d.say.said)}»</blockquote><cite>— ${esc(d.nameOf(d.say.kid))}${d.say.means ? ` · ${L('يقصد', 'meaning')} «${esc(d.say.means)}»` : ''}</cite></a>` : ''}
			<div class="dp-weather"><p class="dp-kick">${L('حالة الجو في البيت', 'Weather at home')}</p><span>${doodle('sun', 54)}</span><b>${L('دافي ومليان حب', 'Warm, with plenty of love')}</b><small>${L('فرصة حضن: ١٠٠٪', 'Chance of hugs: 100%')}</small></div>
		</div>` });
	pages.push({ name: L('إعلانات مبوبة', 'Classifieds'), html: `
		<div class="dp-ads">
			<p class="dp-kick">${L('إعلانات مبوبة', 'Classifieds')}</p>
			${d.ads.length ? `<a href="goals.html" class="dp-ads__list">${d.ads.map((g) => `<p class="dp-ad">${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="">` : ''}<span><b>${L('مطلوب:', 'Wanted:')}</b> <span dir="auto">${esc(L(g.title, g.en || g.title))}</span><small>${L('للتواصل: البيت', 'Contact: home')}</small></span></p>`).join('')}</a>` : `<p class="dp-none">${L('مفيش إعلانات النهارده — كل اللي عايزينه عندنا ♥', 'No ads today — we have all we want ♥')}</p>`}
			<p class="dp-foot">${L('اتطبعت بحب في بيتنا — العدد الجاي بكرة الصبح', 'Printed with love at home — next issue tomorrow morning')}</p>
		</div>` });
	return pages;
}

/* the paper over the whole window: built when it opens, taken away when it closes */
function wirePaper(main, s, f) {
	const fb = main.querySelector('#fb');
	if (!fb) return () => {};
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const wide = matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)');
	let box = null, pages = [], at = 0, busy = false, y0 = 0, lastFocus = null, data = null;
	const per = () => (wide.matches ? 2 : 1);
	const title = esc(T(f.paper) || L('جريدة بيتنا', 'The Daily Us'));
	const issue = num(s.married ? Math.floor((Date.now() - parseDate(s.married)) / 864e5) : yearsBetween(parseDate(s.met)));
	const dateLine = new Date().toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

	const pageHTML = (k) => {
		const p = pages[k];
		return p ? `<section class="dp-page" data-k="${k}"><div class="dp-page__in">${p.html}</div><span class="dp-folio">${num(k + 1)}</span></section>` : `<section class="dp-page dp-page--blank"></section>`;
	};
	const paint = () => {
		const n = per(), spread = box.querySelector('.dp-spread');
		spread.style.setProperty('--per', n);
		spread.innerHTML = Array.from({ length: n }, (_, i) => pageHTML(at + i)).join('');
		const idx = spread.querySelector('#dp-index');
		if (idx) idx.innerHTML = pages.map((p, k) => (k < 2 ? '' : `<li><button type="button" data-to="${k}"><span>${esc(p.name)}</span><b>${L('ص', 'p.')} ${num(k + 1)}</b></button></li>`)).join('');
		hydrate(spread); live.hydrateSketches(spread);
		box.querySelectorAll('.dp-tab').forEach((t) => { const k = +t.dataset.to, on = k >= at && k < at + n; t.classList.toggle('is-on', on); t.setAttribute('aria-current', on ? 'page' : 'false'); });
		box.querySelector('[data-step="-1"]').disabled = at === 0;
		box.querySelector('[data-step="1"]').disabled = at + n >= pages.length;
		box.querySelector('.dp-count').textContent = n === 2 && pages[at + 1] ? `${num(at + 1)}–${num(at + 2)} / ${num(pages.length)}` : `${num(at + 1)} / ${num(pages.length)}`;
	};
	/* turn: the spread folds away on its spine and the next one unfolds — never two turns at once */
	// a click that comes while a page is turning waits for it; each half of a turn ends on time even if the browser
	// holds the animation back (a hidden tab), so a turn can never get stuck
	let queued = null, dest = 0;
	const play = (el, frames, ms, ease) => { const a = el.animate(frames, { duration: ms, easing: ease }); return Promise.race([a.finished, new Promise((r) => setTimeout(r, ms + 80))]).then(() => a.cancel(), () => {}); };
	const go = async (k) => {
		if (!box) return;
		const n = per();
		k = Math.max(0, Math.min(pages.length - 1, k));
		k -= k % n;
		dest = k;
		if (busy) { queued = k; return; }
		if (k === at) return;
		const fwd = k > at, rtl = document.documentElement.dir === 'rtl';
		const sign = (fwd ? -1 : 1) * (rtl ? -1 : 1);
		const spread = box.querySelector('.dp-spread');
		if (reduce) { at = k; return paint(); }
		busy = true;
		await play(spread, [{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: `rotateY(${sign * 80}deg)`, opacity: 0.2 }], 240, 'cubic-bezier(.5, 0, .9, .5)');
		if (!box) { busy = false; return; }
		at = k; paint();
		await play(spread, [{ transform: `rotateY(${-sign * 80}deg)`, opacity: 0.2 }, { transform: 'rotateY(0deg)', opacity: 1 }], 300, 'cubic-bezier(.1, .5, .5, 1)');
		busy = false;
		if (queued !== null) { const q = queued; queued = null; go(q); }
	};

	const open = async () => {
		if (box) return;
		lastFocus = document.activeElement; y0 = scrollY;
		fb.classList.add('is-open');
		data = data || await paperData(s, f);
		pages = paperPages(s, f, data); at = 0; dest = 0;
		box = document.createElement('div');
		box.className = 'dp';
		box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T(f.paper) || L('جريدة بيتنا', 'The Daily Us'));
		box.innerHTML = `<div class="dp-paper">
			<header class="dp-mast">
				<span class="dp-mast__ear">${L('أول جريدة عائلية', 'A family newspaper')}</span>
				<h2 class="dp-mast__name">${title}</h2>
				<span class="dp-mast__ear">${L('بتصدر كل يوم', 'Out every day')}</span>
				<p class="dp-mast__bar"><span>${L('العدد', 'Issue')} ${issue}</span><span>${esc(dateLine)}</span><span>${L('التمن: حضن', 'Price: one hug')}</span></p>
			</header>
			<div class="dp-stage"><div class="dp-spread"></div></div>
			<nav class="dp-pager" aria-label="${L('صفحات الجريدة', 'The paper’s pages')}">
				<button class="dp-turn" type="button" data-step="-1" aria-label="${L('الصفحة اللي قبلها', 'Previous page')}">${doodle(L('forward', 'back'), 20)}</button>
				<span class="dp-tabs">${pages.map((p, k) => `<button class="dp-tab" type="button" data-to="${k}" title="${esc(p.name)}">${num(k + 1)}</button>`).join('')}</span>
				<span class="dp-count"></span>
				<button class="dp-turn" type="button" data-step="1" aria-label="${L('الصفحة اللي بعدها', 'Next page')}">${doodle(L('back', 'forward'), 20)}</button>
			</nav>
		</div>
		<button class="dp-x" type="button" aria-label="${Y('اقفل الجريدة', 'اقفلي الجريدة', 'Close the paper')}">✕</button>`;
		document.body.append(box);
		document.documentElement.classList.add('dp-lock');
		paint();
		requestAnimationFrame(() => box?.classList.add('is-on'));
		box.querySelector('.dp-x').focus({ preventScroll: true });
		box.addEventListener('click', (e) => {
			if (e.target.closest('.dp-x')) return close();
			const to = e.target.closest('[data-to]'); if (to) return go(+to.dataset.to);
			const st = e.target.closest('[data-step]'); if (st && !st.disabled) return go(dest + +st.dataset.step * per());
		});
		/* a swipe across the page turns it */
		let sx = 0, sy = 0;
		box.querySelector('.dp-stage').addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
		box.querySelector('.dp-stage').addEventListener('pointerup', (e) => {
			const dx = e.clientX - sx, dy = e.clientY - sy;
			if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
			const rtl = document.documentElement.dir === 'rtl';
			go(dest + ((dx < 0) !== rtl ? 1 : -1) * per());
		});
	};
	const close = () => {
		if (!box) return;
		const b = box; box = null; busy = false; queued = null;
		b.classList.remove('is-on');
		document.documentElement.classList.remove('dp-lock');
		scrollTo({ top: y0, behavior: 'instant' });
		setTimeout(() => b.remove(), reduce ? 0 : 300);
		fb.classList.remove('is-open');
		(lastFocus?.isConnected ? lastFocus : main.querySelector('#np-open'))?.focus({ preventScroll: true });
	};
	const onKey = (e) => {
		if (!box) return;
		if (e.key === 'Escape') { e.preventDefault(); return close(); }
		const rtl = document.documentElement.dir === 'rtl';
		if (e.key === 'ArrowLeft') { e.preventDefault(); go(dest + (rtl ? 1 : -1) * per()); }
		if (e.key === 'ArrowRight') { e.preventDefault(); go(dest + (rtl ? -1 : 1) * per()); }
		// keep the keyboard inside the paper
		if (e.key === 'Tab') {
			const f2 = [...box.querySelectorAll('a[href], button:not(:disabled)')];
			if (!f2.length) return;
			if (e.shiftKey && document.activeElement === f2[0]) { e.preventDefault(); f2.at(-1).focus(); }
			else if (!e.shiftKey && document.activeElement === f2.at(-1)) { e.preventDefault(); f2[0].focus(); }
		}
	};
	// one page or two when the window changes, keeping the page that was showing
	const onWide = () => { if (box) { at -= at % per(); dest = at; paint(); } };
	fb.addEventListener('click', (e) => { if (e.target.closest('#np-open')) open(); });
	addEventListener('keydown', onKey);
	wide.addEventListener('change', onWide);
	if (location.hash === '#tree') setTimeout(() => fb.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 300);
	return () => { removeEventListener('keydown', onKey); wide.removeEventListener('change', onWide); box?.remove(); box = null; document.documentElement.classList.remove('dp-lock'); };
}

/* the book: the tree on its cover, the paper's masthead on the first page under it */
function bookHTML(s, f) {
	return `<div class="fb" id="fb">
		<div class="fb__persp"><div class="fb__book">
			<div class="fb__page" aria-hidden="true"><p class="fb__page-ear">${L('أول جريدة عائلية', 'A family newspaper')}</p><b>${T(f.paper) || L('جريدة بيتنا', 'The Daily Us')}</b><span>${L('بتصدر كل يوم', 'Out every day')}</span></div>
			<div class="fb__cover" id="tree">
				<div class="fb__front">
					<p class="fb__title">${L('شجرة العيلتين', 'The family tree')}<small>${L('اللي بقوا عيلة واحدة', 'two families that became one')}</small></p>
					<div class="fam-tree">${treeHTML(s)}</div>
				</div>
				<div class="fb__back" aria-hidden="true"></div>
			</div>
		</div></div>
		<div class="fb__open"><button class="btn btn--coral" type="button" id="np-open" aria-haspopup="dialog">${doodle('scroll', 18)} ${L('افتح الجريدة', 'Open the paper')}</button></div>
	</div>`;
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
			${bookHTML(s, f)}
		</div></section>
		${related(['people', 'routine', 'expenses', 'debts'])}`;
	},
	leave() { this.bye?.(); this.bye = null; },
	after(main, s) {
		this.bye?.();
		const unwire = wirePaper(main, s, s.family || {});
		/* the tree shows whole on the cover: on a narrow screen it is scaled down to the cover's width instead of scrolling */
		const ft = main.querySelector('.fb__front #ft'), box = ft?.parentElement;
		const fitTree = () => {
			if (!ft || !box) return;
			ft.style.zoom = '';
			const natural = ft.scrollWidth, room = box.clientWidth;
			if (natural > room + 1) ft.style.zoom = (room / natural).toFixed(3);
		};
		const ro = box ? new ResizeObserver(() => fitTree()) : null;
		ro?.observe(box);
		this.bye = () => { unwire(); ro?.disconnect(); };
		return Promise.resolve(wireTree(main, s)).then((r) => { fitTree(); setTimeout(fitTree, 400); return r; });
	}
};
