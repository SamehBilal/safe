import { L, Y, T, esc, img, num, age, longDate, parseDate, yearsBetween, pageHead, related, App } from '../shell.js';
import { doodle } from '../doodles.js';
import { treeHTML, wireTree } from '../tree.js';

/* Our family, and our family tree, on one page (the tree had a page of its own, familytree.html, which now sends you
   here). Band: the tree growing — the trunk draws itself, branches reach out, leaves and little hearts pop on them —
   and the four of us hanging on its branches; under it the four of us as cards, the whole family tree (filled from
   the shared list «tree»), our portrait, and the family newspaper. */
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

			${f.portrait ? `<figure class="portrait reveal" data-media-box>
				${img(f.portrait.photo, App.t(f.portrait.caption), 'zoom')}
				<figcaption>${f.portrait.title ? `<b>${T(f.portrait.title)}</b>` : ''}${f.portrait.text ? `<span>${T(f.portrait.text)}</span>` : ''}</figcaption>
			</figure>` : ''}
			<article class="paper reveal">
				<h2 class="paper__name">${T(f.paper) || L('جريدة بيتنا', 'The Daily Us')}</h2>
				<div class="paper__bar"><div><span>${L('العدد', 'Issue')} #${num(yearsBetween(parseDate(s.met)))}</span><span>${today.toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span>${L('التمن: حضن', 'Price: one hug')}</span></div></div>
				${f.headline ? `<h3 class="paper__headline">${T(f.headline)}</h3>` : ''}
				${f.lead ? `<p class="paper__lead">${T(f.lead)}</p>` : ''}
				<div class="paper__cols">${members.map((m) => `
					<section class="article" tabindex="0">
						${m.photo ? `<div data-media-box>${img(m.photo, App.t(m.name), 'zoom')}</div>` : ''}
						<h4>${T(m.name)}</h4>
						<em>${T(m.role)}${m.born ? ` · ${L('مواليد', 'born')} ${longDate(m.born)}` : ''}</em>
						${m.text ? `<p>${T(m.text)}</p>` : ''}
					</section>`).join('')}
				</div>
			</article>
		</div></section>
		${related(['distances', 'nokta', 'growth', 'sayings'])}`;
	},
	after(main, s) { return wireTree(main, s); }
};
