import { L, Y, esc, $, $$, num, store, REDUCE } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* Offline nights: phones in the basket, and a log of the nights we did it.
   Above the log: a timer that runs while the phones are away (it keeps going if the page is closed — the start is kept
   on this phone — and stopping it fills in the log), this month's goal of offline nights, a board of things to do
   with the phones gone (or one picked for us), and the question cards, now in four decks: deep, memories, laughs and
   dreams. The log also says what we do most and our longest night.
   Band: two phones sliding into a basket and going to sleep (zZz), a candle flickering beside them. */
const DECKS = {
	deep: { ar: 'عميقة', en: 'Deep', e: 'heart', q: [
		['إيه أكتر لحظة حسيت فيها إنك محظوظ بيا؟', 'When did you feel luckiest to have me?'],
		['إيه حاجة صغيرة بعملها وبتفرحك؟', 'What small thing I do makes you happy?'],
		['إيه حلم ليك لسه ماقولتهوليش؟', 'A dream of yours you haven’t told me?'],
		['إيه حاجة نفسك أعملها أكتر؟', 'What would you like me to do more often?'],
		['إيه أكتر صفة فيا عايز الولاد ياخدوها؟', 'Which of my traits do you want the boys to have?'],
		['احكيلي عن يوم كنت فيه فخور بيا', 'Tell me about a day you were proud of me'],
		['إيه حاجة بتخاف منها ومحتاجني فيها؟', 'Something you worry about and need me for?'],
		['إمتى حسيت إننا فريق واحد بجد؟', 'When did you really feel we were one team?'],
		['إيه حاجة اتغيرت فيك من ساعة ما اتجوزنا؟', 'What has changed in you since we married?'],
		['إيه اللي بيخليك تحس إنك متحب؟', 'What makes you feel loved?']
	] },
	memories: { ar: 'ذكريات', en: 'Memories', e: 'camera', q: [
		['لو رجعنا لـ ٢٠٠٩، إيه اللي هتقوله لنفسك؟', 'If we went back to 2009, what would you tell yourself?'],
		['إيه أحلى ذكرى ليك مع الولاد؟', 'Your favourite memory with the boys?'],
		['إيه أكتر حاجة فاكرها من يوم فرحنا؟', 'What do you remember most from our wedding day?'],
		['إيه أحلى هدية جاتلك مني؟', 'The best gift I ever gave you?'],
		['فاكر أول مرة شفتني فيها؟ كنت لابسة إيه؟', 'Remember the first time you saw me? What was I wearing?'],
		['إيه أحلى خروجة خرجناها في الخطوبة؟', 'Our best outing while engaged?'],
		['إيه أصعب يوم عدّى علينا وعدّيناه سوا؟', 'The hardest day we got through together?'],
		['إيه أول حاجة اشتريناها لبيتنا؟', 'The first thing we bought for our home?'],
		['إيه أكتر رسالة مني فاكرها؟', 'Which message of mine do you remember most?'],
		['إيه أحلى عيد ميلاد عدّى علينا؟', 'Our best birthday so far?']
	] },
	laughs: { ar: 'ضحك', en: 'Laughs', e: 'laugh', q: [
		['إمتى آخر مرة ضحكنا لحد ما عيطنا؟', 'When did we last laugh till we cried?'],
		['إيه أغرب حاجة أكلناها سوا؟', 'The strangest thing we ever ate together?'],
		['قلّدني وأنا بصحى من النوم', 'Do an impression of me waking up'],
		['إيه أكتر كلمة بقولها كتير؟', 'Which word do I say way too much?'],
		['لو كنا شخصيتين في فيلم كرتون، نبقى مين؟', 'If we were two cartoon characters, who would we be?'],
		['إيه أكتر موقف محرج حصلنا قدام الناس؟', 'Our most embarrassing moment in public?'],
		['لو فهد بقى مدير البيت يوم، يحصل إيه؟', 'If Fahd ran the house for a day, what happens?'],
		['إيه أوحش أكلة عملتها لك؟ وقلتلي حلوة؟', 'The worst dish I made that you said was good?'],
		['احكيلي نكتة… ولازم أضحك', 'Tell me a joke — I have to laugh'],
		['لو هنفتح مشروع سوا، يبقى إيه؟ واسمه إيه؟', 'If we opened a business together, what and what name?']
	] },
	dreams: { ar: 'أحلام', en: 'Dreams', e: 'sparkle', q: [
		['إيه أكتر رحلة نفسك نعملها؟ وليه؟', 'Which trip do you most want us to take? Why?'],
		['لو عندنا يوم كامل من غير أي التزامات، نعمل إيه؟', 'A whole day with nothing to do — what do we do?'],
		['إيه حاجة نفسك نتعلمها سوا؟', 'What would you like us to learn together?'],
		['إيه شكلنا بعد عشرين سنة؟', 'What do we look like in twenty years?'],
		['لو هنكتب جواب لنفسنا بعد ١٠ سنين، نقول إيه؟', 'A letter to us in ten years — what does it say?'],
		['بيت أحلامنا شكله إيه؟ وفين؟', 'Our dream home — what and where?'],
		['إيه اللي نفسنا الولاد يفتكروه عن طفولتهم؟', 'What do we want the boys to remember of their childhood?'],
		['لو كسبنا مليون، أول حاجة نعملها إيه؟', 'If we won a million, the first thing we do?'],
		['إيه عادة نفسك نبدأها سوا السنة دي؟', 'A habit you want us to start this year?'],
		['إيه حاجة نفسك تعملها قبل ما تكمل ٤٠؟', 'Something you want to do before you turn 40?']
	] }
};
/* things to do with the phones away: [ar, en, emoji] */
const IDEAS = [
	['قعدنا نتكلم', 'Just talk', 'chat'], ['لعبنا كوتشينة', 'Play cards', 'dice'], ['اتمشينا', 'Go for a walk', 'walk'], ['طبخنا حاجة جديدة', 'Cook something new', 'dinner'],
	['قرينا بصوت عالي', 'Read aloud to each other', 'book'], ['قلّبنا في الألبوم القديم', 'Leaf through the old album', 'camera'], ['كتبنا جوابات لبعض', 'Write each other letters', 'letter'], ['رسمنا بعض', 'Draw each other', 'pencil'],
	['عملنا بازل', 'Do a puzzle', 'star'], ['سمعنا أغانينا القديمة', 'Listen to our old songs', 'music'], ['رقصنا في الصالة', 'Dance in the living room', 'party'], ['مساج لبعض', 'Massages', 'heart'],
	['حكينا للولاد حكاية', 'Tell the boys a story', 'family'], ['شربنا شاي في البلكونة', 'Tea on the balcony', 'coffee'], ['خططنا لرحلة', 'Plan a trip', 'plane'], ['اتفرجنا على النجوم', 'Watch the stars', 'moon']
];
const GOAL = 4; // offline nights a month
const T0 = 'us.offline.start'; // when the phones went in the basket, on this phone
let deck = 'deep';
let tick = 0;

const fmt = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
const started = () => +(store.get(T0) || 0);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function openLog(fill) {
	const d = $('details.composer');
	if (!d || d.hidden) return;
	d.open = true;
	const f = $('#lp-form');
	if (!f) return;
	for (const [k, v] of Object.entries(fill)) if (f.elements[k] && v !== undefined) f.elements[k].value = v;
}

export default listPage({
	id: 'offline', kind: 'offline', icon: 'moon',
	title: ['سهرة من غير موبايل', 'Offline nights'], sub: ['الموبايلات في السلة، وإحنا لبعض', 'Phones in the basket, us for each other'],
	add: ['سجّلوا سهرة', 'Log a night'],
	fields: [
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'hours', t: 'num', l: ['كام ساعة؟', 'How many hours?'], step: 0.5 },
		{ n: 'did', t: 'text', l: ['عملنا إيه؟', 'What did we do?'], grow: 1, ideas: IDEAS.map(([ar, en]) => [ar, en]) },
		{ n: 'note', t: 'area', l: ['أحلى حاجة اتقالت', 'The best thing said'], rows: 2 }
	],
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items) => `<div class="ol-band"><div class="ol-basket"><span class="ol-phone ol-phone--1"></span><span class="ol-phone ol-phone--2"></span><span class="ol-zz">z<i>z</i><b>Z</b></span></div>
		<span class="ol-candle"><i></i></span>
		<p class="ol-count"><b>${num(items.length)}</b><small>${L('سهرة', 'nights')}</small><b>${num(items.reduce((a, x) => a + (+x.hours || 0), 0))}</b><small>${L('ساعة لبعض', 'hours together')}</small></p></div>`,
	top: (items) => {
		const t0 = started();
		const month = items.filter((x) => String(x.date || '').startsWith(monthKey())).length;
		const pct = Math.min(100, Math.round((month / GOAL) * 100));
		// what we do most, and the longest night
		const count = new Map();
		for (const x of items) if (x.did) count.set(x.did.trim(), (count.get(x.did.trim()) || 0) + 1);
		const fav = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
		const longest = items.reduce((m, x) => ((+x.hours || 0) > (+m?.hours || 0) ? x : m), null);
		const d = DECKS[deck];
		return `<div class="ol-tools">
			<section class="ol-timer${t0 ? ' is-on' : ''}" aria-live="polite">
				<h3>${doodle('moon', 20)} ${L('الموبايلات في السلة', 'Phones in the basket')}</h3>
				<p class="ol-timer__t" id="ol-t">${t0 ? fmt(Date.now() - t0) : '0:00:00'}</p>
				<p class="muted">${t0 ? L('بقالنا من غير موبايل… كملوا ♥', 'Offline for… keep going ♥') : L('دوسوا وحطوا الموبايلات بعيد', 'Tap, and put the phones away')}</p>
				<button type="button" class="btn ${t0 ? '' : 'btn--coral'}" id="ol-go">${t0 ? L('خلصنا ✓ سجّلها', 'We’re done ✓ log it') : L('يلا نبدأ', 'Start')}</button>
				${t0 ? `<button type="button" class="link" id="ol-cancel">${L('إلغاء', 'Cancel')}</button>` : ''}
			</section>
			<section class="ol-goal">
				<h3>${doodle('star', 20)} ${L('هدف الشهر', 'This month’s goal')}</h3>
				<p class="ol-goal__n"><b>${num(month)}</b> / ${num(GOAL)} ${L('سهرات', 'nights')}</p>
				<div class="ol-goal__bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
				<p class="muted">${month >= GOAL ? L('عملناها الشهر ده ♥', 'Done this month ♥') : L(`فاضل ${num(GOAL - month)}`, `${GOAL - month} to go`)}</p>
				${fav || longest ? `<ul class="ol-facts">${fav ? `<li>${L('أكتر حاجة بنعملها:', 'What we do most:')} <b dir="auto">${esc(fav[0])}</b></li>` : ''}${longest?.hours ? `<li>${L('أطول سهرة:', 'Longest night:')} <b>${num(+longest.hours)} ${L('ساعة', 'h')}</b></li>` : ''}</ul>` : ''}
			</section>
		</div>
		<h2 class="sec__title">${L('نعمل إيه من غير موبايل؟', 'What shall we do, phones away?')}</h2>
		<div class="ol-ideas">${IDEAS.map(([ar, en, e], i) => `<button type="button" class="ol-idea" data-idea="${i}" style="--r:${((i * 37) % 9) - 4}deg">${doodle(e, 26)}<span dir="auto">${esc(L(ar, en))}</span></button>`).join('')}</div>
		<p class="ol-pick"><button type="button" class="btn btn--ghost" id="ol-rand">${doodle('dice', 18)} ${L('اختارولنا حاجة', 'Pick one for us')}</button></p>
		<h2 class="sec__title">${L('كروت الأسئلة', 'Question cards')}</h2>
		<div class="chips ol-decks" role="tablist">${Object.entries(DECKS).map(([k, v]) => `<button type="button" class="chip${k === deck ? ' is-on' : ''}" data-deck="${k}">${doodle(v.e, 16)} ${esc(L(v.ar, v.en))} <small>${num(v.q.length)}</small></button>`).join('')}</div>
		<div class="ol-deck"><button type="button" class="ol-card ol-card--${deck}" id="ol-card"><small>${esc(L(d.ar, d.en))} · ${L('اسحبوا كارت', 'Draw a card')}</small><b id="ol-q">?</b></button><p class="muted">${L('كل واحد يجاوب، وبعدين التاني ♥', 'Each of us answers, then the other ♥')}</p></div>
		<h2 class="sec__title">${L('سهراتنا', 'Our nights')}</h2>`;
	},
	painted: (main) => {
		clearInterval(tick);
		if (started()) tick = setInterval(() => { const el = $('#ol-t', main); if (!el) return clearInterval(tick); el.textContent = fmt(Date.now() - started()); }, 1000);
	},
	click: (e, c) => {
		const card = e.target.closest('#ol-card');
		if (card) {
			const q = DECKS[deck].q;
			let i = +card.dataset.i, n;
			do { n = Math.floor(Math.random() * q.length); } while (n === i && q.length > 1);
			card.dataset.i = n;
			card.classList.remove('is-flip'); void card.offsetWidth; card.classList.add('is-flip');
			$('#ol-q', card).textContent = L(...q[n]);
			return;
		}
		const dk = e.target.closest('[data-deck]');
		if (dk) { deck = dk.dataset.deck; return c.repaint(); }
		const idea = e.target.closest('[data-idea]');
		if (idea) return openLog({ date: live.today(), did: L(IDEAS[+idea.dataset.idea][0], IDEAS[+idea.dataset.idea][1]) });
		if (e.target.closest('#ol-rand')) {
			const all = $$('.ol-idea');
			all.forEach((b) => b.classList.remove('is-picked'));
			const steps = REDUCE ? 1 : 12;
			let k = 0, last;
			const hop = () => {
				last?.classList.remove('is-picked');
				last = all[Math.floor(Math.random() * all.length)];
				last.classList.add('is-picked');
				if (++k < steps) setTimeout(hop, 70 + k * 14);
			};
			hop();
			return;
		}
		if (e.target.closest('#ol-go')) {
			const t0 = started();
			if (!t0) { store.set(T0, String(Date.now())); return c.repaint(); }
			const hours = Math.max(0.5, Math.round(((Date.now() - t0) / 36e5) * 2) / 2);
			store.del(T0);
			c.repaint();
			return openLog({ date: live.today(), hours });
		}
		if (e.target.closest('#ol-cancel')) { store.del(T0); c.repaint(); }
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
