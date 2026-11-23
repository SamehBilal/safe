import { L, Y, esc, $, $$, num, store, REDUCE } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* Offline nights: phones in the basket, and a log of the nights we did it.
   Above the log: a timer that runs while the phones are away (it keeps going if the page is closed — the start is kept
   on this phone — and stopping it fills in the log), this month's goal of offline nights, a board of things to do
   with the phones gone (or one picked for us), and the question cards, now in five decks: deep, memories, laughs, «would you rather» and
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
		['إيه اللي بيخليك تحس إنك متحب؟', 'What makes you feel loved?'],
		['إيه حاجة نفسك أفهمها عنك أكتر؟', 'What do you wish I understood better about you?'],
		['إمتى آخر مرة حسيت إنك وحيد، حتى وأنا جنبك؟', 'When did you last feel alone, even with me there?'],
		['إيه الكلمة اللي بتستناها مني ومش بقولها كفاية؟', 'What word do you wait to hear from me that I don’t say enough?'],
		['إيه أكتر حاجة اتعلمتها من جوازنا؟', 'What has our marriage taught you most?'],
		['لو عندك يوم واحد تقضيه معايا لوحدنا، تحب يبقى إزاي؟', 'One whole day alone with me — how would you spend it?'],
		['إيه حاجة كانت صعبة عليك السنة دي ومحكتهاش؟', 'Something hard this year you never told me about?'],
		['إيه اللي بتحبه فيا ومش بتقوله؟', 'What do you love about me but never say?'],
		['إيه أكتر لحظة حسيت فيها إنك أب أو أم بجد؟', 'When did you first truly feel like a parent?'],
		['إيه وعد نفسك نوعده لبعض النهارده؟', 'A promise you’d like us to make each other tonight?'],
		['إيه حاجة بتعملها عشاني ومش باخد بالي منها؟', 'Something you do for me that I don’t notice?'],
		['إيه اللي بيطمنك لما الدنيا تبقى صعبة؟', 'What comforts you when things get hard?'],
		['لو تقدر تغير حاجة واحدة في يومنا العادي، تغير إيه؟', 'If you could change one thing in our ordinary day, what?'],
		['إيه أكتر حاجة بتفتخر بيها في عيلتنا؟', 'What are you proudest of in our family?'],
		['إمتى حسيت إني فهمتك من غير ما تتكلم؟', 'When did I understand you without a word?'],
		['إيه اللي عايزنا نفضل عليه مهما كبرنا؟', 'What do you want us never to lose, however old we get?']
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
		['إيه أحلى عيد ميلاد عدّى علينا؟', 'Our best birthday so far?'],
		['فاكر أول مكالمة طويلة بينا؟ قعدنا قد إيه؟', 'Remember our first long phone call? How long did it last?'],
		['إيه أول أغنية تفكرك بيا؟', 'The first song that made you think of me?'],
		['إيه أحلى سفرية عملناها لحد دلوقتي؟', 'Our best trip so far?'],
		['فاكر لما فهد اتولد؟ إيه أول حاجة حسيتها؟', 'Remember when Fahd was born? What did you feel first?'],
		['وأول ما شفت عبد الرحمن؟', 'And the first time you saw Abdulrahman?'],
		['إيه أول خناقة بينا؟ وصالحنا إزاي؟', 'Our first fight — and how did we make up?'],
		['إيه أكلة لما تاكلها بتفتكرني؟', 'A dish that always reminds you of me?'],
		['إيه أحلى رمضان عدّى علينا سوا؟', 'Our best Ramadan together?'],
		['إيه مكان لما بنعدي عليه بتفتكر حاجة بينا؟', 'A place that brings back something of ours whenever we pass it?'],
		['إيه أكتر صورة لينا بتحبها؟ وليه؟', 'Your favourite photo of us — and why?'],
		['إيه أول حاجة لاحظتها فيا؟', 'The first thing you noticed about me?'],
		['فاكر يوم كتب الكتاب؟ إيه اللي كان في دماغك؟', 'Remember our katb el-ketab? What was on your mind?'],
		['إيه أحلى مفاجأة عملتهالك؟', 'The best surprise I ever gave you?'],
		['إيه أول كلمة قالها فهد وفاكرها؟', 'Fahd’s first word you remember?'],
		['إيه يوم عادي خالص بقى من أحلى أيامنا؟', 'An ordinary day that turned into one of our best?']
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
		['لو هنفتح مشروع سوا، يبقى إيه؟ واسمه إيه؟', 'If we opened a business together, what and what name?'],
		['قلّدني وأنا بتكلم في التليفون', 'Do an impression of me on the phone'],
		['إيه أكتر حاجة بعملها وبتجننك… بس بتحبها؟', 'What do I do that drives you mad — but you love it?'],
		['لو عبد الرحمن اتكلم دلوقتي، أول جملة هيقولها إيه؟', 'If Abdulrahman could talk now, what would he say first?'],
		['لو هنتبادل الأدوار يوم، أول حاجة هتعملها إيه؟', 'If we swapped places for a day, what would you do first?'],
		['إيه أسوأ هدية جبتهالك؟ قول الحقيقة', 'The worst gift I ever got you? Be honest'],
		['لو حياتنا فيلم، اسمه إيه؟ ومين يمثلنا؟', 'If our life were a film — its title, and who plays us?'],
		['غنّي أغنية بس بدل الكلام قول «مواء»', 'Sing a song, but every word is “meow”'],
		['إيه أغرب حلم حلمته بيا؟', 'The strangest dream you’ve had about me?'],
		['لو فهد كتب لنا رسالة شكوى، هيشتكي من إيه؟', 'If Fahd wrote us a complaint letter, what would it say?'],
		['ارسمني في ١٠ ثواني من غير ما تبص', 'Draw me in ten seconds without looking'],
		['لو بقينا مشهورين على السوشيال، هنبقى مشهورين بإيه؟', 'If we went viral, what would it be for?'],
		['إيه أكتر حاجة بنتخانق عليها وهي تافهة خالص؟', 'The silliest thing we always argue about?'],
		['لو لينا أغنية دخول زي المصارعين، تبقى إيه؟', 'If we had wrestler entrance music, what would it be?'],
		['قول جملة بصوت شخصية كرتون، وأنا أخمن مين', 'Say a line in a cartoon voice — I’ll guess who'],
		['إيه أطول مدة قعدناها ندور على حاجة كانت في إيدنا؟', 'The longest we spent hunting for something already in our hand?']
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
		['إيه حاجة نفسك تعملها قبل ما تكمل ٤٠؟', 'Something you want to do before you turn 40?'],
		['لو نقدر نعيش في أي بلد سنة، نختار فين؟', 'If we could live anywhere for a year, where?'],
		['إيه شكل يوم الجمعة المثالي بعد ٥ سنين؟', 'Our perfect Friday five years from now?'],
		['نفسك الولاد يطلعوا بيحبوا إيه؟', 'What do you hope the boys grow up loving?'],
		['إيه حاجة نفسك نجربها سوا لأول مرة؟', 'Something you’d love us to try together for the first time?'],
		['لو عملنا حفلة لعيد جوازنا العشرين، تبقى إزاي؟', 'Our 20th anniversary party — what is it like?'],
		['إيه المهارة اللي نفسك تتقنها السنة الجاية؟', 'A skill you want to master next year?'],
		['لو نقدر نطلع رحلة مع الولاد بكرة، نروح فين؟', 'If we could take the boys on a trip tomorrow, where?'],
		['إيه أوضة نفسك تبقى في بيتنا ومش موجودة؟', 'A room you wish our home had?'],
		['إيه الحاجة اللي نفسنا نحوش لها أولاً؟', 'What should we save for first?'],
		['لو هنكتب كتاب سوا، يبقى عن إيه؟', 'If we wrote a book together, what would it be about?'],
		['إيه تقليد نفسك نعمله كل سنة في نفس اليوم؟', 'A tradition you’d like us to keep on the same day every year?'],
		['نفسك نبقى عاملين إزاي لما نبقى جدو وتيتا؟', 'What do you want us to be like as grandparents?'],
		['إيه بلد نفسك نشوف فيها التلج؟', 'Where would you like us to see snow?'],
		['إيه حاجة نفسك تقولها للولاد يوم فرحهم؟', 'What do you want to tell the boys on their wedding days?'],
		['لو عندنا شهر إجازة، نقسمه إزاي؟', 'If we had a month off, how would we spend it?']
	] },
	rather: { ar: 'تختار إيه؟', en: 'Would you rather', e: 'dice', q: [
		['بحر ولا جبل؟', 'The sea or the mountains?'],
		['سفرية طويلة بعيد ولا خروجات كتير قريبة؟', 'One long trip far away, or lots of little outings close by?'],
		['فطار في السرير ولا عشا برة؟', 'Breakfast in bed or dinner out?'],
		['تعرف أفكاري ساعة ولا أعرف أفكارك ساعة؟', 'Read my mind for an hour, or I read yours?'],
		['نرجع لأيام الخطوبة يوم ولا نشوف نفسنا بعد ٢٠ سنة يوم؟', 'A day back in our engagement, or a day twenty years ahead?'],
		['شتا ولا صيف؟', 'Winter or summer?'],
		['فيلم في البيت ولا سينما؟', 'A film at home or at the cinema?'],
		['تطبخ إنت كل يوم ولا تغسل المواعين كل يوم؟', 'Cook every day, or do the dishes every day?'],
		['بيت صغير على البحر ولا شقة كبيرة في المدينة؟', 'A small house by the sea or a big flat in the city?'],
		['من غير قهوة أسبوع ولا من غير موبايل أسبوع؟', 'A week without coffee or a week without your phone?'],
		['رحلة بالعربية ولا بالطيارة؟', 'A road trip or a flight?'],
		['تسمع أغانينا القديمة بس ولا الجديدة بس؟', 'Only our old songs, or only new ones?'],
		['حفلة كبيرة ولا قعدة صغيرة مع الحبايب؟', 'A big party or a small night with our closest?'],
		['نصحى بدري ولا نسهر؟', 'Early mornings or late nights?'],
		['تتكلم كل اللغات ولا تعزف كل الآلات؟', 'Speak every language or play every instrument?'],
		['كشري ولا فول وطعمية؟', 'Koshary or ful and ta‘meya?'],
		['تسافر للماضي ولا للمستقبل؟', 'Travel to the past or the future?'],
		['ننام في خيمة في الصحرا ولا كوخ في الجبل؟', 'A tent in the desert or a cabin in the mountains?'],
		['نفضل نضحك على نفس النكتة طول العمر ولا كل يوم نكتة جديدة؟', 'Laugh at the same joke forever, or a new joke every day?'],
		['جواب بخط الإيد ولا رسالة صوتية طويلة؟', 'A handwritten letter or a long voice note?']
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
	related: ['remember', 'draw', 'games']
});
