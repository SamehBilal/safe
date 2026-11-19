import { L, pageHead, related } from '../shell.js';
import { treeHTML, wireTree } from '../tree.js';

/* The family tree on a page of its own (the same tree as on «عيلتنا», filled from the shared list «tree»).
   Band: a tree growing — the trunk draws itself, branches reach out, and leaves (and little hearts) pop on them. */
const leaf = (x, y, i, heart) => heart
	? `<path class="fx-leaf fx-heart" style="--i:${i}" transform="translate(${x} ${y})" d="M0 6-7-1a4 4 0 0 1 7-5 4 4 0 0 1 7 5Z"/>`
	: `<ellipse class="fx-leaf" style="--i:${i}" cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${(i * 47) % 180 - 90} ${x} ${y})"/>`;
const LEAVES = [[420, 70], [380, 95], [450, 50], [560, 60], [600, 85], [520, 40], [330, 120], [670, 115], [480, 30], [620, 50], [360, 70], [700, 90], [300, 95], [540, 90], [400, 40], [650, 30]];

export default {
	title: { ar: 'شجرة العيلة', en: 'Family tree' },
	render(s) {
		return `${pageHead(L('شجرة العيلة', 'Family tree'), L('العيلتين اللي بقوا عيلة واحدة', 'Two families that became one'), [{ href: 'familytree.html', ar: 'شجرة العيلة', en: 'Family tree' }], {
			band: `<div class="lp-band lp-band--familytree" aria-hidden="true"><svg class="fx-svg" viewBox="0 0 1000 220">
				<path class="fx-ground" d="M300 212 Q500 196 700 212"/>
				<path class="fx-trunk" d="M500 212 C 498 170, 506 140, 500 110"/>
				<path class="fx-branch" style="--i:1" d="M500 130 C 460 110, 420 100, 360 90"/>
				<path class="fx-branch" style="--i:2" d="M500 120 C 540 100, 590 92, 650 80"/>
				<path class="fx-branch" style="--i:3" d="M500 110 C 490 80, 470 60, 430 45"/>
				<path class="fx-branch" style="--i:4" d="M500 110 C 520 80, 560 60, 600 45"/>
				<path class="fx-branch" style="--i:5" d="M500 150 C 440 140, 380 130, 310 120"/>
				<path class="fx-branch" style="--i:6" d="M500 145 C 560 135, 620 125, 690 115"/>
				${LEAVES.map(([x, y], i) => leaf(x, y, i, i % 5 === 2)).join('')}
			</svg></div>`
		})}
		<section class="sec sec--top"><div class="wrap">${treeHTML(s)}</div></section>
		${related(['family', 'calendar', 'distances'])}`;
	},
	after(main, s) { return wireTree(main, s); }
};
