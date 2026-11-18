import { L, esc, age, App } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* «بيحب إيه دلوقتي» — every few months, what each boy loves right now: his food, cartoon, toy, song, the word he
   says all day and who he can't leave. Over the years it becomes who they were at every age.
   Top: an «All about me» board — each boy's badge in his colour with his age today, and his latest favourites pinned
   around it as crayon stickers. */

const THINGS = [
	['food', '🍕', ['أكلته', 'Food']], ['show', '📺', ['كرتونه', 'Cartoon']], ['toy', '🧸', ['لعبته', 'Toy']],
	['song', '🎵', ['أغنيته', 'Song']], ['word', '💬', ['كلمته', 'Word']], ['person', '🤗', ['متعلق بمين', 'Can’t leave']],
	['color', '🎨', ['لونه', 'Colour']], ['place', '📍', ['مكانه', 'Place']]
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
		return `<div class="fv-board">${kids.map((k, i) => {
			const last = items.find((x) => x.kid === k.id);
			const got = last ? THINGS.filter(([n]) => last[n]).slice(0, 5) : [];
			const stickers = got.length ? got.map(([n, e], j) => `<span class="fv-stick" style="--i:${j};--bg:${STICK[(j + i * 2) % STICK.length]}" dir="auto">${e} ${esc(shorten(last[n], 16))}</span>`).join('')
				: [['🍼', L('بيحب إيه؟', 'Loves…?')], ['🧸', '…'], ['🎵', '…']].map(([e, t], j) => `<span class="fv-stick is-empty" style="--i:${j};--bg:${STICK[(j + i * 2) % STICK.length]}">${e} ${esc(t)}</span>`).join('');
			return `<div class="fv-kid" style="--c:${esc(k.color || '#0e6990')};--r:${i % 2 ? 2 : -2}deg">
				<span class="fv-badge"><span class="fv-emoji">${esc(k.emoji || '⭐')}</span></span>
				<b class="fv-name">${esc(App.t(k.name))}</b>
				<small class="fv-age">${k.born ? esc(age(k.born)) : ''}</small>
				<span class="fv-sticks">${stickers}</span>
			</div>`;
		}).join('')}<p class="fv-title">${L('كل حاجة عني', 'All about me')} ✎</p></div>`;
	},
	card: (x, c) => `<article class="lp-card fv-card" style="--c:${esc(c.kidOf(x.kid)?.color || '#0e6990')}">
		<header class="fv-card-h"><span class="fv-card-e">${esc(c.kidOf(x.kid)?.emoji || '⭐')}</span><span><b>${esc(c.kidName(x.kid))}</b><small>${x.date ? c.date(x.date) : ''}${x.date && c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}</small></span></header>
		${c.photo(x)}
		<ul class="fv-list">${THINGS.filter(([n]) => x[n]).map(([n, e, l]) => `<li><span class="fv-li-e">${e}</span><span class="fv-li-k">${esc(L(...l))}</span><b dir="auto">${esc(x[n])}</b></li>`).join('')}</ul>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول صفحة «بيحب إيه» تتكتب هنا ♥', 'The first “what he loves” page goes here ♥'],
	related: ['family', 'growth', 'sayings']
});
