import { L, Y, T, esc, img, num, age, longDate, parseDate, yearsBetween, pageHead, related, App, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import { treeHTML, wireTree } from '../tree.js';
import * as live from '../live.js';

/* Our family, and our family tree, on one page (the tree had a page of its own, familytree.html, which now sends you
   here). Band: the tree growing — the trunk draws itself, branches reach out, leaves and little hearts pop on them —
   and the four of us hanging on its branches; under it the four of us as cards, the whole family tree (filled from
   the shared list «tree»), and the family newspaper. */
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
function paperHTML(s, f) {
	const today = new Date();
	return `<article class="paper np reveal" id="np">
		<h2 class="paper__name">${T(f.paper) || L('جريدة بيتنا', 'The Daily Us')}</h2>
		<div class="paper__bar"><div><span>${L('العدد', 'Issue')} #${num(s.married ? Math.floor((Date.now() - parseDate(s.married)) / 864e5) : yearsBetween(parseDate(s.met)))}</span><span>${today.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span>${L('التمن: حضن', 'Price: one hug')}</span></div></div>
		<div id="np-body"><p class="np__wait">${L('المطبعة شغالة…', 'The presses are rolling…')}</p></div>
	</article>`;
}
async function fillPaper(main, s, f) {
	const box = main.querySelector('#np-body');
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
	const ads = [0, 1, 2].map((i) => pickOf(wants, 3 + i * 7)).filter((g, i, a) => g && a.indexOf(g) === i);
	const when = (d) => (d === 0 ? L('النهارده!', 'today!') : d === 1 ? L('بكرة', 'tomorrow') : L(`بعد ${num(d)} يوم`, `in ${d} days`));

	box.innerHTML = `
		${stamp ? `<span class="np__stamp">${esc(stamp)}</span>` : ''}
		<h3 class="paper__headline" dir="auto">${esc(head || '')}</h3>
		${lead ? `<p class="paper__lead" dir="auto">${esc(lead)}</p>` : ''}
		<div class="np__grid">
			${old ? `<a class="np__story" href="moment.html?id=${encodeURIComponent(old.id)}">
				<p class="np__kicker">${same.length ? L(`النهارده من ${num(yrs)} ${yrs === 1 ? 'سنة' : yrs === 2 ? 'سنتين' : 'سنين'}`, `On this day, ${yrs} year${yrs === 1 ? '' : 's'} ago`) : L('من أرشيف الجريدة', 'From the archive')}</p>
				${oldPhoto ? `<span class="np__pic">${img(oldPhoto, App.t(old.title))}</span>` : ''}
				<h4 dir="auto">${T(old.title)}</h4>
				<em>${esc(longDate(old.date))}</em>
				${old.text ? `<p dir="auto">${T(old.text)}</p>` : ''}
			</a>` : ''}
			<aside class="np__side">
				<section class="np__box"><p class="np__kicker">${L('أرقام النهارده', 'Today’s numbers')}</p>
					<ul class="np__nums">${nums.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ul></section>
				<section class="np__box"><p class="np__kicker">${L('قريب', 'Coming up')}</p>
					<ul class="np__soon">${coming.map((c) => `<li><span>${esc(c.t)}</span><b>${esc(when(c.d))}</b></li>`).join('')}</ul></section>
			</aside>
			${say ? `<a class="np__quote" href="sayings.html"><p class="np__kicker">${L('كلمة اليوم', 'Quote of the day')}</p>
				<blockquote dir="auto">«${esc(say.said)}»</blockquote><cite>— ${esc(nameOf(say.kid))}${say.means ? ` · ${L('يقصد', 'meaning')} «${esc(say.means)}»` : ''}</cite></a>` : ''}
			${ads.length ? `<a class="np__ads" href="goals.html"><p class="np__kicker">${L('إعلانات مبوبة', 'Classifieds')}</p>
				${ads.map((g) => `<p class="np__ad">${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="">` : ''}<span><b>${L('مطلوب:', 'Wanted:')}</b> <span dir="auto">${esc(L(g.title, g.en || g.title))}</span><small>${L('للتواصل: البيت', 'Contact: home')}</small></span></p>`).join('')}</a>` : ''}
			<section class="np__family"><p class="np__kicker">${L('أخبار العيلة', 'Family notes')}</p>
				<div class="np__cols">${members.map((m) => `<div><h4>${T(m.name)}</h4><em>${m.kid && m.born ? `${esc(age(m.born))} · ` : ''}${T(m.role)}</em>${m.text ? `<p>${T(m.text)}</p>` : ''}</div>`).join('')}</div>
			</section>
		</div>
		<p class="np__foot">${L('اتطبعت بحب في بيتنا — العدد الجاي بكرة الصبح', 'Printed with love at home — next issue tomorrow morning')}</p>`;
	hydrate(box);
	live.hydrateSketches(box);
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
			<div class="fam-row">${members.map((m, k) => `
				<a class="fam reveal" href="member.html?id=${esc(m.id)}" style="--c:${esc(m.color || '#0e6990')};--delay:${k * 0.08}s">
					<span class="fam__pic">${m.photo ? `<span data-media-box>${img(m.photo, App.t(m.name))}</span>` : `<span class="fam__emoji">${doodle(m.emoji, 52)}</span>`}</span>
					<b>${T(m.name)}</b>
					<small>${m.kid && m.born ? `${age(m.born)} · ${T(m.role)}` : T(m.role)}</small>
				</a>`).join('')}
			</div>

			<div id="tree" class="fam-tree">${treeHTML(s)}</div>

			${paperHTML(s, f)}
		</div></section>
		${related(['distances', 'nokta', 'growth', 'sayings'])}`;
	},
	after(main, s) { fillPaper(main, s, s.family || {}); return wireTree(main, s); }
};
