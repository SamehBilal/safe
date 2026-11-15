import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* Our soundtrack: one song for every year of us, with what it meant that year.
   Band: an equaliser — one bar per year since 2009, the years that have their song standing tall and labelled. */
const FROM = 2009;
export default listPage({
	id: 'soundtrack', kind: 'soundtrack', icon: 'music',
	title: ['أغنية كل سنة', 'Our soundtrack'], sub: ['أغنية لكل سنة عشناها سوا', 'A song for every year we’ve lived together'],
	add: ['ضيفوا أغنية سنة', 'Add a year’s song'],
	fields: [
		{ n: 'year', t: 'num', l: ['السنة', 'Year'], req: 1, min: FROM, step: 1 },
		{ n: 'song', t: 'text', l: ['الأغنية', 'Song'], req: 1, grow: 1 },
		{ n: 'artist', t: 'text', l: ['مين بيغنيها؟', 'Who sings it?'] },
		{ n: 'link', t: 'url', l: ['لينك (يوتيوب/سبوتيفاي)', 'Link (YouTube/Spotify)'], full: 1 },
		{ n: 'note', t: 'area', l: ['كانت بتفكرنا بإيه السنة دي؟', 'What did it mean that year?'], rows: 2 }
	],
	sort: (a, b) => (a.year || 0) - (b.year || 0),
	band: (items) => {
		const now = new Date().getFullYear();
		const ys = Array.from({ length: now - FROM + 1 }, (_, i) => FROM + i);
		return `<div class="st-eq">${ys.map((y, i) => { const x = items.find((s) => s.year === y); return `<span class="st-bar${x ? ' is-on' : ''}" style="--i:${i};--h:${28 + ((i * 37) % 52)}px"><i></i><b>${y}</b>${x ? `<em dir="auto">${esc(shorten(x.song, 18))}</em>` : ''}</span>`; }).join('')}</div>`;
	},
	card: (x, c) => `<article class="lp-card st-card">
		<span class="st-year">${esc(x.year)}</span>
		<h3 dir="auto">${esc(x.song)}</h3>
		${x.artist ? `<p class="lp-k" dir="auto">${esc(x.artist)}</p>` : ''}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.link ? `<a class="btn btn--sm btn--ghost" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">▶ ${L('اسمعوها', 'Listen')}</a>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أغنية ٢٠٠٩ تبدأ الحكاية ♥', 'The 2009 song starts it all ♥'],
	related: ['music', 'story', 'numbers']
});
