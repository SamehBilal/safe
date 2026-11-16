import { L, Y, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* Our bucket list: things to do together someday — ticked off with a date when we do them.
   Band: a checklist on a clipboard, its boxes ticking themselves one by one, and how many are done. */
export default listPage({
	id: 'bucket', kind: 'bucket', icon: 'star',
	title: ['قايمة الأحلام', 'Our bucket list'], sub: ['حاجات نفسنا نعملها سوا في يوم من الأيام', 'Things we want to do together, someday'],
	add: ['ضيفوا حلم', 'Add a dream'],
	fields: [
		{ n: 'what', t: 'text', l: ['نفسنا نعمل إيه؟', 'What do we want to do?'], req: 1, grow: 1, full: 1, ideas: [['نشوف الشفق القطبي', 'See the northern lights'], ['نعمل عمرة سوا', 'Do Umrah together'], ['نطلع بالون في الأقصر', 'Hot-air balloon in Luxor'], ['نتعلم غطس', 'Learn to dive'], ['نسافر برا مصر', 'Travel abroad'], ['نبات في الصحرا تحت النجوم', 'Sleep under the stars in the desert']] },
		{ n: 'note', t: 'area', l: ['ليه؟', 'Why?'], rows: 2 },
		{ n: 'photo', t: 'photo', l: ['صورة لما نعملها (اختياري)', 'A photo once we do it (optional)'], full: 1 }
	],
	toggle: { n: 'done' },
	sort: (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.at || 0) - (a.at || 0),
	band: (items) => {
		const rows = items.length ? items.slice(0, 5) : [{ what: L('نشوف البحر من فوق', 'See the sea from above') }, { what: L('نتعلم حاجة سوا', 'Learn something together'), done: 1 }, { what: L('رحلة لوحدنا', 'A trip, just us') }];
		const done = items.filter((x) => x.done).length;
		return `<div class="bk-band"><div class="bk-board"><span class="bk-clip"></span>${rows.map((x, i) => `<p class="bk-row${x.done ? ' is-done' : ''}" style="--i:${i}"><i></i><span dir="auto">${esc(shorten(x.what, 30))}</span></p>`).join('')}</div>
			<p class="bk-count"><b>${num(done)}</b>/${num(items.length)}<small>${L('اتحققت', 'done')}</small></p></div>`;
	},
	card: (x, c) => `<article class="lp-card bk-card${x.done ? ' is-done' : ''}">
		${c.photo(x)}
		<h3 dir="auto">${esc(x.what)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.done ? `<p class="lp-k">✓ ${L('عملناها', 'Done')} · ${c.date(x.done)}</p>` : ''}
		<button class="btn btn--sm ${x.done ? 'btn--ghost' : 'btn--coral'}" type="button" data-tog="${esc(x.id)}">${x.done ? L('لسه ماعملناهاش', 'Not done yet') : Y('عملناها ✓', 'عملناها ✓', 'We did it ✓')}</button>
		${c.del(x)}
	</article>`,
	empty: ['أول حلم يتكتب هنا ♥', 'The first dream goes here ♥'],
	related: ['adventures', 'wishes', 'goals']
});
