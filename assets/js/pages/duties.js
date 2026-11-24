import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «واجباتنا»: the visits and occasions we owe our people — a wedding, an engagement, a new baby, a condolence, someone
   in hospital, a goodbye before travel: whom, what, when, where, what we brought; ticked once we went. Above the title
   a stack of invitation cards, the next one on top with its date. Shared: content/live/duties.bin. */

const KINDS = [['wedding', 'ring', 'فرح', 'Wedding', '#d9534f'], ['engage', 'heart', 'خطوبة', 'Engagement', '#e07a9a'], ['baby', 'baby', 'مولود جديد', 'New baby', '#0e6990'], ['condole', 'moon', 'عزا', 'Condolence', '#5b5866'], ['sick', 'pill', 'زيارة مريض', 'Visiting someone ill', '#5a9e6f'], ['travel', 'plane', 'سفر أو رجوع', 'Travel / homecoming', '#e39b2d'], ['other', 'handshake', 'واجب تاني', 'Another visit', '#8e5bd1']];
const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS.at(-1);
const daysTo = (iso) => Math.round((new Date(iso + 'T00:00') - new Date(live.today() + 'T00:00')) / 864e5);
const when = (d) => (d === 0 ? L('النهارده', 'Today') : d === 1 ? L('بكرة', 'Tomorrow') : d > 0 ? L(`بعد ${num(d)} يوم`, `in ${d} days`) : L(`من ${num(-d)} يوم`, `${-d} days ago`));

export default listPage({
	id: 'duties', kind: 'duties', icon: 'handshake',
	title: ['واجباتنا', 'Our visits & duties'], sub: ['فرح، مولود، عزا، زيارة — مانساش حد من حبايبنا ♥', 'Weddings, babies, condolences, visits — never forgetting our people ♥'],
	add: ['ضيفوا واجب', 'Add a visit'],
	fields: [
		{ n: 'dkind', t: 'sel', l: ['إيه المناسبة؟', 'What’s the occasion?'], opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'whom', t: 'text', l: ['لمين؟', 'For whom?'], req: 1, grow: 1, ph: ['فرح بنت خالتي، مولود أحمد…', 'My cousin’s wedding, Ahmed’s baby…'] },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'place', t: 'text', l: ['فين؟', 'Where?'], ph: ['قاعة…، البيت', 'The hall…, their home'] },
		{ n: 'brought', t: 'text', l: ['جبنا / هنجيب إيه؟', 'What we brought / will bring'], grow: 1, ph: ['نقطة، هدية، بوكيه ورد…', 'Money gift, a present, flowers…'] },
		{ n: 'note', t: 'area', l: ['ملاحظات', 'Notes'], rows: 2 }
	],
	prepare: (x) => { x.dkind = x.dkind || 'other'; },
	chips: { n: 'dkind', opts: KINDS.map(([v, , ar, en]) => [v, ar, en]) },
	toggle: { n: 'doneOn', on: ['روحنا ✓', 'We went ✓'], off: ['لسه', 'Not yet'] },
	sort: (a, b) => !!a.doneOn - !!b.doneOn || (a.doneOn ? String(b.date || '').localeCompare(String(a.date || '')) : String(a.date || '9999').localeCompare(String(b.date || '9999'))),
	band: (items, c) => {
		const open = items.filter((x) => !x.doneOn).sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')));
		const top = open[0];
		const back = open.slice(1, 3);
		const [, ic, ar, en, col] = top ? kindOf(top.dkind) : KINDS[0];
		return `<div class="du-b">
			<div class="du-stack">
				${back.map((x, i) => `<span class="du-inv du-inv--back" style="--i:${i + 1};--c:${kindOf(x.dkind)[4]}" aria-hidden="true"></span>`).join('')}
				<div class="du-inv" style="--c:${col}">
					<span class="du-inv__seal">${doodle(top ? ic : 'heart', 22)}</span>
					${top ? `<small>${esc(L(ar, en))}</small><b dir="auto">${esc(shorten(top.whom, 26))}</b>${top.date ? `<span class="du-inv__date">${c.date(top.date)} · ${when(daysTo(top.date))}</span>` : ''}${top.place ? `<span class="du-inv__place" dir="auto">${esc(shorten(top.place, 28))}</span>` : ''}`
						: `<small>${L('واجباتنا', 'Our visits')}</small><b>${L('مفيش حاجة علينا دلوقتي ♥', 'Nothing owed right now ♥')}</b>`}
				</div>
			</div>
			<p class="du-count"><b>${num(open.length)}</b> ${L('واجب جاي', 'coming up')} · <b>${num(items.length - open.length)}</b> ${L('عملناه', 'done')}</p>
		</div>`;
	},
	card: (x, c) => {
		const [, ic, ar, en, col] = kindOf(x.dkind), d = x.date ? daysTo(x.date) : null;
		return `<article class="lp-card du-card${x.doneOn ? ' is-done' : ''}" id="du-${esc(x.id)}" style="--c:${col}">
			<header class="du-card__hd">${doodle(ic, 18)} ${esc(L(ar, en))}${d !== null && !x.doneOn ? `<span class="${d < 0 ? 'is-late' : d <= 3 ? 'is-near' : ''}">${when(d)}</span>` : ''}</header>
			<h3 dir="auto">${esc(x.whom)}</h3>
			<p class="du-card__meta">
				${x.date ? `<span>${doodle('calendar', 14)} ${c.date(x.date)}</span>` : ''}
				${x.place ? `<span>${doodle('pin', 14)} <span dir="auto">${esc(x.place)}</span></span>` : ''}
				${x.brought ? `<span>${doodle('gift', 14)} <span dir="auto">${esc(x.brought)}</span></span>` : ''}
			</p>
			${x.note ? `<p class="du-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			${x.doneOn ? `<p class="du-card__done">${doodle('heart', 14)} ${L('روحنا', 'We went')} ${c.date(x.doneOn)}</p>` : ''}
			${live.canWrite() ? `<div class="du-card__act">
				<button class="btn btn--sm ${x.doneOn ? 'btn--ghost' : 'btn--coral'}" type="button" data-tog="${esc(x.id)}">${x.doneOn ? L('لسه ماروحناش', 'Not yet') : `${doodle('heart', 15)} ${L('روحنا', 'We went')}`}</button>
				${c.del(x)}
			</div>` : ''}
		</article>`;
	},
	empty: ['مفيش واجبات متسجلة — ضيفوا الفرح أو الزيارة الجاية ♥', 'No visits yet — add the next wedding or visit ♥'],
	related: ['people', 'nokta', 'calendar']
});
