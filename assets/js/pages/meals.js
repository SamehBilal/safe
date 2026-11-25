import { L, esc } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';

/* «منيو الأسبوع»: what we'll eat this week — for each day breakfast, lunch and dinner, the dish, who's cooking, a note,
   a photo. Above the title a café chalkboard on its easel with today's three meals chalked up, and the week as plates. Under it the
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
		{ n: 'note', t: 'text', l: ['ملاحظة (ناقصنا إيه؟)', 'A note (anything to buy?)'], grow: 1 },
		{ n: 'photo', t: 'photo', l: ['صورة الأكلة (اختياري)', 'A photo of the dish (optional)'], full: 1 }
	],
	prepare: (x) => { x.day = x.day || todayKey(); x.meal = x.meal || 'lunch'; },
	sort: (a, b) => order(a) - order(b),
	band: (items, c) => {
		const t = todayKey(), today = items.filter((x) => x.day === t);
		const tday = DAYS.find((d) => d[0] === t);
		return `<div class="mlb">
			<div class="mlb-board">
				<span class="mlb-board__top" aria-hidden="true">${doodle('dinner', 26)}</span>
				<p class="mlb-board__h">${L('منيو النهارده', 'Today’s menu')}</p>
				<p class="mlb-board__d">${esc(L(tday[1], tday[2]))}</p>
				<ul class="mlb-board__menu">${MEALS.map(([m, ic, ar, en]) => { const x = today.find((y) => y.meal === m); return `<li class="${x ? '' : 'is-none'}"><span class="mlb-board__k">${doodle(ic, 16)} ${esc(L(ar, en))}</span><i aria-hidden="true"></i><b dir="auto">${x ? esc(shorten(x.dish, 22)) : L('لسه', 'not yet')}</b>${x?.cook ? `<small>${esc(c.whoName(x.cook))}</small>` : ''}</li>`; }).join('')}</ul>
				<span class="mlb-board__chalk" aria-hidden="true"></span>
			</div>
			<span class="mlb-easel" aria-hidden="true"><i></i><i></i><i></i></span>
			<ol class="mlb-week">${DAYS.map(([k, ar, en]) => { const n = items.filter((x) => x.day === k).length; return `<li class="${k === t ? 'is-today' : ''}"><span class="mlb-plate">${'<i></i>'.repeat(Math.min(3, n))}</span><small>${esc(L(ar, en.slice(0, 3)))}</small></li>`; }).join('')}</ol>
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
					${x.photo ? `<span class="ml-it__ph">${c.photo(x)}</span>` : ''}
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

