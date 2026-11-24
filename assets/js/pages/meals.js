import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';

/* «منيو الأسبوع»: what we'll eat this week — for each day breakfast, lunch and dinner, the dish, who's cooking, a note.
   Above the title the fridge door with the week's planner held up by magnets, today's square circled. Under it the
   week, a card for each day (Saturday first, today marked) with its meals in it. Shared: content/live/meals.bin. */

export const DAYS = [['sat', 'السبت', 'Saturday'], ['sun', 'الحد', 'Sunday'], ['mon', 'الاتنين', 'Monday'], ['tue', 'التلات', 'Tuesday'], ['wed', 'الأربع', 'Wednesday'], ['thu', 'الخميس', 'Thursday'], ['fri', 'الجمعة', 'Friday']];
const MEALS = [['breakfast', 'coffee', 'فطار', 'Breakfast'], ['lunch', 'dinner', 'غدا', 'Lunch'], ['dinner', 'moon', 'عشا', 'Dinner']];
const todayKey = () => DAYS[(new Date().getDay() + 1) % 7][0];
const mealOf = (m) => MEALS.find((x) => x[0] === m) || MEALS[1];
const order = (x) => DAYS.findIndex((d) => d[0] === x.day) * 3 + MEALS.findIndex((m) => m[0] === x.meal);

export default listPage({
	id: 'meals', kind: 'meals', icon: 'dinner',
	title: ['منيو الأسبوع', 'This week’s menu'], sub: ['هناكل إيه كل يوم، ومين اللي هيطبخ ♥', 'What we’ll eat each day, and who’s cooking ♥'],
	add: ['ضيفوا أكلة', 'Add a meal'],
	fields: [
		{ n: 'day', t: 'sel', l: ['يوم إيه؟', 'Which day?'], opts: DAYS },
		{ n: 'meal', t: 'sel', l: ['فطار ولا غدا ولا عشا؟', 'Breakfast, lunch or dinner?'], opts: MEALS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'dish', t: 'text', l: ['الأكلة', 'The dish'], req: 1, grow: 1, ph: ['محشي، مكرونة بشاميل…', 'Stuffed vine leaves, pasta bake…'], ideas: [['ملوخية وفراخ'], ['مكرونة بشاميل'], ['محشي'], ['فول وطعمية'], ['كشري'], ['سمك ورز'], ['بطاطس بالفرن'], ['شوربة عدس'], ['بيتزا في البيت'], ['دليفري ♥']] },
		{ n: 'cook', t: 'sel', l: ['مين هيطبخ؟', 'Who’s cooking?'], opts: 'whoBoth' },
		{ n: 'note', t: 'text', l: ['ملاحظة (ناقصنا إيه؟)', 'A note (anything to buy?)'], grow: 1 }
	],
	prepare: (x) => { x.day = x.day || todayKey(); x.meal = x.meal || 'lunch'; },
	sort: (a, b) => order(a) - order(b),
	band: (items) => {
		const t = todayKey();
		return `<div class="ml-b">
			<div class="ml-fridge">
				<span class="ml-fridge__handle" aria-hidden="true"></span>
				<div class="ml-plan">
					<span class="ml-mag ml-mag--a" aria-hidden="true"></span><span class="ml-mag ml-mag--b" aria-hidden="true"></span>
					<p class="ml-plan__h">${L('منيو الأسبوع', 'This week')} ♥</p>
					<ul class="ml-plan__days">${DAYS.map(([k, ar, en]) => { const ms = items.filter((x) => x.day === k); return `<li class="${k === t ? 'is-today' : ''}"><b>${esc(L(ar, en.slice(0, 3)))}</b>${ms.slice(0, 2).map((x) => `<span dir="auto">${esc(shorten(x.dish, 11))}</span>`).join('') || '<span class="is-none">—</span>'}</li>`; }).join('')}</ul>
				</div>
			</div>
		</div>`;
	},
	/* the week, a card for each day, in the space above the (empty) list */
	top: (items, c) => {
		if (!items.length) return `<p class="empty">${L('لسه مفيش منيو — ضيفوا أكلة لكل يوم ♥', 'No menu yet — add a meal for each day ♥')}</p>`;
		const t = todayKey();
		return `<div class="ml-week">${DAYS.map(([k, ar, en]) => {
			const ms = items.filter((x) => x.day === k);
			return `<section class="ml-day${k === t ? ' is-today' : ''}${ms.length ? '' : ' is-empty'}">
				<h3>${esc(L(ar, en))}${k === t ? ` <small>${L('النهارده', 'Today')}</small>` : ''}</h3>
				${ms.length ? `<ul>${ms.map((x) => { const [, ic, mar, men] = mealOf(x.meal); return `<li class="ml-it">
					<span class="ml-it__k">${doodle(ic, 15)} ${esc(L(mar, men))}</span>
					<b dir="auto">${esc(x.dish)}</b>
					${x.cook ? `<small>${doodle('pen', 12)} ${esc(c.whoName(x.cook))}</small>` : ''}
					${x.note ? `<small class="ml-it__note" dir="auto">${esc(x.note)}</small>` : ''}
					${c.del(x)}
				</li>`; }).join('')}</ul>` : `<p class="ml-day__none">${L('لسه ما قررناش', 'Not decided yet')}</p>`}
			</section>`;
		}).join('')}</div>`;
	},
	card: () => '',
	empty: false,
	related: ['food', 'shopping', 'routine']
});

