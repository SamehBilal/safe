import { L, Y, esc, $, num } from '../shell.js';
import { listPage } from '../listpage.js';
import * as live from '../live.js';

/* Offline nights: phones in the basket, a deck of question cards to draw from, and a log of the nights we did it.
   Band: two phones sliding into a basket and going to sleep (zZz), a candle flickering beside them. */
const DECK = [
	['إيه أكتر لحظة حسيت فيها إنك محظوظ بيا؟', 'When did you feel luckiest to have me?'],
	['لو رجعنا لـ ٢٠٠٩، إيه اللي هتقوله لنفسك؟', 'If we went back to 2009, what would you tell yourself?'],
	['إيه حاجة صغيرة بعملها وبتفرحك؟', 'What small thing I do makes you happy?'],
	['إيه أكتر رحلة نفسك نعملها؟ وليه؟', 'Which trip do you most want us to take? Why?'],
	['إيه أحلى ذكرى ليك مع الولاد؟', 'Your favourite memory with the boys?'],
	['لو عندنا يوم كامل من غير أي التزامات، نعمل إيه؟', 'A whole day with nothing to do — what do we do?'],
	['إيه حاجة نفسك نتعلمها سوا؟', 'What would you like us to learn together?'],
	['إيه أكتر حاجة فاكرها من يوم فرحنا؟', 'What do you remember most from our wedding day?'],
	['إمتى آخر مرة ضحكنا لحد ما عيطنا؟', 'When did we last laugh till we cried?'],
	['إيه الأغنية اللي بتفكرك بيا؟', 'Which song reminds you of me?'],
	['إيه حلم ليك لسه ماقولتهوليش؟', 'A dream of yours you haven’t told me?'],
	['إيه حاجة نفسك أعملها أكتر؟', 'What would you like me to do more often?'],
	['إيه شكلنا بعد عشرين سنة؟', 'What do we look like in twenty years?'],
	['إيه أكتر صفة فيا عايز الولاد ياخدوها؟', 'Which of my traits do you want the boys to have?'],
	['احكيلي عن يوم كنت فيه فخور بيا', 'Tell me about a day you were proud of me'],
	['إيه أحلى هدية جاتلك مني؟', 'The best gift I ever gave you?'],
	['لو هنكتب جواب لنفسنا بعد ١٠ سنين، نقول إيه؟', 'A letter to us in ten years — what does it say?'],
	['إيه حاجة بتخاف منها ومحتاجني فيها؟', 'Something you worry about and need me for?']
];

export default listPage({
	id: 'offline', kind: 'offline', icon: 'moon',
	title: ['سهرة من غير موبايل', 'Offline nights'], sub: ['الموبايلات في السلة، وإحنا لبعض', 'Phones in the basket, us for each other'],
	add: ['سجّلوا سهرة', 'Log a night'],
	fields: [
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'hours', t: 'num', l: ['كام ساعة؟', 'How many hours?'], step: 0.5 },
		{ n: 'did', t: 'text', l: ['عملنا إيه؟', 'What did we do?'], grow: 1, ideas: [['قعدنا نتكلم', 'Talked'], ['لعبنا كوتشينة', 'Played cards'], ['اتمشينا', 'Went for a walk'], ['طبخنا سوا', 'Cooked together'], ['قرينا', 'Read']] },
		{ n: 'note', t: 'area', l: ['أحلى حاجة اتقالت', 'The best thing said'], rows: 2 }
	],
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items) => `<div class="ol-band"><div class="ol-basket"><span class="ol-phone ol-phone--1"></span><span class="ol-phone ol-phone--2"></span><span class="ol-zz">z<i>z</i><b>Z</b></span></div>
		<span class="ol-candle"><i></i></span>
		<p class="ol-count"><b>${num(items.length)}</b><small>${L('سهرة', 'nights')}</small><b>${num(items.reduce((a, x) => a + (+x.hours || 0), 0))}</b><small>${L('ساعة لبعض', 'hours together')}</small></p></div>`,
	top: () => `<div class="ol-deck"><button type="button" class="ol-card" id="ol-card"><small>${L('اسحبوا كارت', 'Draw a card')}</small><b id="ol-q">?</b></button><p class="muted">${L('كل واحد يجاوب، وبعدين التاني ♥', 'Each of us answers, then the other ♥')}</p></div>`,
	click: (e) => {
		const card = e.target.closest('#ol-card');
		if (!card) return;
		let i = +card.dataset.i;
		let n;
		do { n = Math.floor(Math.random() * DECK.length); } while (n === i && DECK.length > 1);
		card.dataset.i = n;
		card.classList.remove('is-flip'); void card.offsetWidth; card.classList.add('is-flip');
		$('#ol-q', card).textContent = L(...DECK[n]);
	},
	card: (x, c) => `<article class="lp-card ol-log">
		<p class="lp-k">${c.date(x.date)}${x.hours ? ` · ${num(x.hours)} ${L('ساعة', 'h')}` : ''}</p>
		${x.did ? `<h3 dir="auto">${esc(x.did)}</h3>` : ''}
		${x.note ? `<p dir="auto">«${esc(x.note)}»</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول سهرة من غير موبايل تتسجل هنا ♥', 'The first offline night goes here ♥'],
	related: ['questions', 'draw', 'games']
});
