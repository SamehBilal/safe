import { L, esc, age, App } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';

/* «بيحب إيه دلوقتي» — every few months, what each boy loves right now: his food, cartoon, toy, song, the word he
   says all day and who he can't leave. Over the years it becomes who they were at every age.
   Top: an «All about me» worksheet for each boy, the kind they bring home from nursery — his drawing in a frame, «اسمي»
   and «عندي» filled in, and a line for each favourite with its drawn icon, the answers written in crayon in his colour.
   A pencil lies across the corner. */

/* [field, drawn icon, [label], [label in his own words, for the worksheet]] */
const THINGS = [
	['food', 'dinner', ['أكلته', 'Food'], ['أكلتي المفضلة', 'My favourite food']], ['show', 'tv', ['كرتونه', 'Cartoon'], ['كرتوني', 'My cartoon']],
	['toy', 'teddy', ['لعبته', 'Toy'], ['لعبتي', 'My toy']], ['song', 'music', ['أغنيته', 'Song'], ['أغنيتي', 'My song']],
	['word', 'chat', ['كلمته', 'Word'], ['كلمتي', 'My word']], ['person', 'love', ['متعلق بمين', 'Can’t leave'], ['متعلق بـ', 'I can’t leave']],
	['color', 'palette', ['لونه', 'Colour'], ['لوني', 'My colour']], ['place', 'pin', ['مكانه', 'Place'], ['مكاني', 'My place']]
];
const STICK = ['#fdc830', '#fdd5d8', '#e6efb4', '#cfe9f5', '#f9d3b4', '#e2d6f5'];

export default listPage({
	id: 'favorites', kind: 'favorites', icon: 'star',
	title: ['بيحب إيه دلوقتي', 'What they love now'], sub: ['كل كام شهر، الولاد بيحبوا إيه — عشان نفتكر كانوا مين في كل سن', 'Every few months, what the boys love — so we remember who they were at every age'],
	add: ['ضيفوا صفحة جديدة', 'Add a new page'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'food', t: 'text', l: ['أكلته المفضلة', 'Favourite food'], ph: ['بطاطس محمرة', 'chips'] },
		{ n: 'show', t: 'text', l: ['كرتونه', 'Cartoon or show'], ph: ['بيبي شارك', 'Baby Shark'] },
		{ n: 'toy', t: 'text', l: ['لعبته', 'Toy'], ph: ['العربية الحمرا', 'the red car'] },
		{ n: 'song', t: 'text', l: ['أغنيته', 'Song'] },
		{ n: 'word', t: 'text', l: ['الكلمة اللي بيقولها طول اليوم', 'The word he says all day'] },
		{ n: 'person', t: 'text', l: ['متعلق بمين', 'Who he can’t leave'] },
		{ n: 'color', t: 'text', l: ['لونه', 'Colour'] },
		{ n: 'place', t: 'text', l: ['مكانه المفضل', 'Favourite place'] },
		{ n: 'photo', t: 'photo', l: ['صورة', 'Photo'] },
		{ n: 'note', t: 'area', l: ['حاجة كمان', 'Anything else'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items, c) => {
		const kids = c.kids.filter((k) => !k.born || new Date(k.born) <= new Date());
		const sheet = (k, i) => {
			const last = items.find((x) => x.kid === k.id);
			const lines = (last ? THINGS.filter(([n]) => last[n]) : []).slice(0, 5);
			const rows = (lines.length ? lines : THINGS.slice(0, 4)).map(([n, ic, , mine], j) => `<li style="--i:${j}"><span class="fvb-ic">${doodle(ic, 18)}</span><span class="fvb-k">${esc(L(...mine))}:</span><b dir="auto">${last?.[n] ? esc(shorten(last[n], 18)) : '…'}</b></li>`).join('');
			return `<div class="fvb-sheet" style="--c:${esc(k.color || '#0e6990')};--r:${i % 2 ? 2 : -2}deg">
				<p class="fvb-h">${L('كل حاجة عني', 'All about me')}</p>
				<div class="fvb-me"><span class="fvb-face">${doodle(k.emoji || 'star', 38)}</span>
					<div><p>${L('اسمي', 'My name')}: <b>${esc(App.t(k.name))}</b></p><p>${L('عندي', 'I am')}: <b>${k.born ? esc(age(k.born)) : '…'}</b></p></div></div>
				<ul class="fvb-lines">${rows}</ul>
			</div>`;
		};
		return `<div class="fvb">${kids.map(sheet).join('')}
			<svg class="fvb-pencil" viewBox="0 -40 220 120" aria-hidden="true"><g transform="rotate(-20 110 20)"><rect x="40" y="10" width="140" height="20" fill="#fdc830" stroke="#37353f" stroke-width="2"/><path d="M40 10h140M40 17h140M40 23h140" stroke="#e39b2d" stroke-width="1.2"/><rect x="180" y="10" width="22" height="20" fill="#f9a3a8" stroke="#37353f" stroke-width="2"/><path d="M40 10 12 20l28 10Z" fill="#f3d9b1" stroke="#37353f" stroke-width="2" stroke-linejoin="round"/><path d="M12 20l9-3v6Z" fill="#37353f"/></g></svg>
		</div>`;
	},
	/* each page across the whole row: a coloured header with the boy, the day and how old he was; his photo on one side
	   and a tile for every favourite on the other, its drawing, what it is and the answer in big; the note as a quote */
	card: (x, c) => {
		const got = THINGS.filter(([n]) => x[n]);
		return `<article class="lp-card fv-card fv-page" style="--c:${esc(c.kidOf(x.kid)?.color || '#0e6990')}">
		<header class="fv-page__h"><span class="fv-card-e">${doodle(c.kidOf(x.kid)?.emoji || 'star', 28)}</span>
			<span><b>${esc(c.kidName(x.kid))}</b><small>${x.date && c.kidAge(x.kid, x.date) ? `${L('وعنده', 'at')} ${esc(c.kidAge(x.kid, x.date))}` : ''}</small></span>
			<span class="fv-page__date">${x.date ? c.date(x.date) : ''}</span></header>
		<div class="fv-page__body${x.photo ? ' has-photo' : ''}">
			${x.photo ? `<div class="fv-page__photo">${c.photo(x)}</div>` : ''}
			<ul class="fv-tiles">${got.map(([n, ic, l], j) => `<li style="--i:${j}"><span class="fv-tile__ic">${doodle(ic, 22)}</span><small>${esc(L(...l))}</small><b dir="auto">${esc(x[n])}</b></li>`).join('')}</ul>
		</div>
		${x.note ? `<p class="fv-page__note" dir="auto">«${esc(x.note)}»</p>` : ''}
		${c.del(x)}
	</article>`;
	},
	empty: ['أول صفحة «بيحب إيه» تتكتب هنا ♥', 'The first “what he loves” page goes here ♥'],
	related: ['family', 'growth', 'sayings']
});
