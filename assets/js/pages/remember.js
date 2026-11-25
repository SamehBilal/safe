import { L, Y, T, t, esc, img, isVideo, hydrate, pageHead, related, fmtDate, App, $, $$, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «فاكر؟» — games made of our own story, four to pick from: ten questions drawn from what's already here (which year
   or month a photo is from, what a photo was, who wrote a love note or a guestbook wish, who's in a family photo, when a
   big day was, which of two moments came first, where a photo was taken); «صح ولا غلط», quick lines to call true or
   false; «رتّب الحكاية», five moments to tap in the order they happened; and «لعبة الكروت», our photos face down to
   turn over two at a time and find each pair.
   Each round's score is kept (the «remember» list) so we can see who remembers more.
   Band: three polaroids fanned out, the middle one face down with a big «؟» on its back, and a scorecard pinned
   beside them with each of us and our best round this year. */

const ROUND = 10;
const still = (p) => (typeof p === 'string' ? p : p?.photo) || '';
const photosOf = (x) => [x.photo, x.cover, ...(x.photos || [])].map(still).filter((p) => p && !isVideo(p));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// a year without the thousands mark («٢٠١٩», not «٢٬٠١٩»)
const yr = (y) => num(y).replace(/[٬,]/g, '');
const yearOf = (d) => +String(d || '').slice(0, 4) || 0;
const nameOf = (s, w) => App.t(w === 'her' ? s.her : s.him);

/* every question we could ask from what's in the story, a few of each kind, shuffled together so a round mixes them */
function questions(s) {
	const moments = (s.timeline || []).filter((x) => !x.when && yearOf(x.date) && t(x.title));
	const shot = moments.filter((x) => photosOf(x).length);
	const years = [...new Set(moments.map((x) => yearOf(x.date)))].sort();
	const titled = [...new Map(moments.map((x) => [t(x.title), x])).values()];
	const link = (x) => `moment.html?id=${encodeURIComponent(x.id)}`;
	const seen = (x) => `<a href="${link(x)}">${T(x.title)}</a> · ${esc(fmtDate(x.date))}`;
	// the right year and three others near it (made up around it when we don't have enough years yet)
	const yearOpts = (y) => {
		const near = years.filter((v) => v !== y).sort((a, b) => Math.abs(a - y) - Math.abs(b - y)).slice(0, 5);
		const others = shuffle(near).slice(0, 3);
		for (let d = 1; others.length < 3; d++) [y - d, y + d].forEach((v) => { if (others.length < 3 && v !== y && !others.includes(v) && v <= new Date().getFullYear()) others.push(v); });
		return shuffle([y, ...others]).map((v) => ({ label: yr(v), ok: v === y }));
	};
	const titleOpts = (x, from) => shuffle([x, ...shuffle(from.filter((m) => t(m.title) !== t(x.title))).slice(0, 3)]).map((m) => ({ label: T(m.title), ok: m === x }));
	const kinds = [];

	kinds.push(shuffle(shot).slice(0, 6).map((x) => ({ photo: pick(photosOf(x)), q: L('الصورة دي من سنة كام؟', 'Which year is this photo from?'), opts: yearOpts(yearOf(x.date)), after: seen(x) })));
	if (titled.length >= 4) kinds.push(shuffle(shot).slice(0, 6).map((x) => ({ photo: pick(photosOf(x)), q: L('الصورة دي كانت إيه؟', 'What was this?'), opts: titleOpts(x, titled), after: seen(x) })));
	kinds.push(shuffle(moments.filter((x) => !photosOf(x).length)).slice(0, 4).map((x) => ({ big: x.icon, q: L(`«${t(x.title)}» كانت سنة كام؟`, `When was “${t(x.title)}”?`), opts: yearOpts(yearOf(x.date)), after: seen(x) })));
	kinds.push(shuffle((s.notes || []).filter((n) => t(n.text) && (n.by === 'him' || n.by === 'her'))).slice(0, 5).map((n) => ({
		quote: t(n.text), q: L('مين كتب الكلام ده؟', 'Who wrote this?'),
		opts: [{ label: esc(nameOf(s, 'him')), ok: n.by === 'him' }, { label: esc(nameOf(s, 'her')), ok: n.by === 'her' }],
		after: `${esc(nameOf(s, n.by))}${n.date ? ` · ${esc(fmtDate(n.date))}` : ''} — <a href="notes.html">${L('رسايل حب', 'Love notes')}</a>`
	})));
	const firsts = [];
	for (let k = 0; k < 6 && titled.length >= 2; k++) {
		const [a, b] = shuffle(titled);
		if (a.date !== b.date) firsts.push({ big: '⏳', q: L('أنهي حصلت الأول؟', 'Which came first?'), opts: shuffle([a, b]).map((m) => ({ label: T(m.title), ok: m === (a.date < b.date ? a : b) })), after: `${seen(a.date < b.date ? a : b)}${L('، وبعدها ', ', then ')}${seen(a.date < b.date ? b : a)}` });
	}
	kinds.push(firsts.slice(0, 4));
	const places = (s.places || []).filter((p) => t(p.title) && photosOf(p).length);
	if (places.length >= 3) kinds.push(shuffle(places).slice(0, 4).map((p) => ({
		photo: pick(photosOf(p)), q: L('الصورة دي فين؟', 'Where is this?'),
		opts: shuffle([p, ...shuffle(places.filter((o) => o !== p)).slice(0, 3)]).map((o) => ({ label: T(o.title), ok: o === p })),
		after: `${T(p.title)}${p.place ? ` — ${T(p.place)}` : ''} · <a href="places.html">${L('أماكننا', 'Our places')}</a>`
	})));
	// which month a photo is from
	const month = (m) => new Date(2024, m, 15).toLocaleDateString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long' });
	kinds.push(shuffle(shot.filter((x) => String(x.date).length >= 7)).slice(0, 4).map((x) => {
		const m = +String(x.date).slice(5, 7) - 1, others = shuffle([...Array(12).keys()].filter((v) => v !== m)).slice(0, 3);
		return { photo: pick(photosOf(x)), q: L('الصورة دي في أنهي شهر؟', 'Which month is this photo from?'), opts: shuffle([m, ...others]).map((v) => ({ label: esc(month(v)), ok: v === m })), after: seen(x) };
	}));
	// who wrote this wish in the guestbook
	const wishes = (s.guestbook?.entries || []).filter((e) => t(e.text) && t(e.name));
	const names = [...new Set(wishes.map((e) => t(e.name)))];
	if (names.length >= 3) kinds.push(shuffle(wishes).slice(0, 4).map((e) => ({
		quote: t(e.text), q: L('مين كتب التهنئة دي في دفتر المعازيم؟', 'Who wrote this in the guestbook?'),
		opts: shuffle([t(e.name), ...shuffle(names.filter((n) => n !== t(e.name))).slice(0, 3)]).map((n) => ({ label: esc(n), ok: n === t(e.name) })),
		after: `${esc(t(e.name))} — <a href="guestbook.html">${L('دفتر المعازيم', 'The guestbook')}</a>`
	})));
	// who's this
	const faces = (s.family?.members || []).filter((m) => still(m.photo) && t(m.name));
	if (faces.length >= 2) kinds.push(shuffle(faces).slice(0, 2).map((m) => ({
		photo: still(m.photo), q: L('مين ده؟', 'Who’s this?'),
		opts: shuffle(faces).slice(0, 4).map((o) => ({ label: T(o.name), ok: o === m })).concat(faces.slice(0, 4).includes(m) ? [] : []),
		after: `<a href="member.html?id=${encodeURIComponent(m.id)}">${T(m.name)}</a>`
	})).map((q) => (q.opts.some((o) => o.ok) ? q : null)).filter(Boolean));
	// when was the big day
	const big = (s.chapters || []).filter((c) => c.date && t(c.title));
	if (big.length >= 4) kinds.push(shuffle(big).slice(0, 3).map((c) => ({
		big: '♥', q: L(`يوم «${t(c.title)}» كان إمتى؟`, `When was “${t(c.title)}”?`),
		opts: shuffle([c, ...shuffle(big.filter((o) => o.date !== c.date)).slice(0, 3)]).map((o) => ({ label: esc(fmtDate(o.date)), ok: o === c })),
		after: `<a href="chapter.html?id=${encodeURIComponent(c.id)}">${T(c.title)}</a> · ${esc(fmtDate(c.date))}`
	})));
	// one of each kind in turn, so no round is all years
	const out = [], lists = kinds.filter((k) => k.length);
	while (out.length < ROUND && lists.some((k) => k.length)) for (const k of shuffle(lists)) if (k.length && out.length < ROUND) out.push(k.shift());
	return out;
}

/* «صح ولا غلط»: a moment and a year, the right one or one a year or two off */
function trueFalse(s, n = ROUND) {
	const moments = (s.timeline || []).filter((x) => !x.when && yearOf(x.date) && t(x.title));
	return shuffle(moments).slice(0, n).map((x) => {
		const real = yearOf(x.date), lie = Math.random() < 0.5, y = lie ? real + pick([-2, -1, 1, 2]) : real;
		return { big: '؟', q: L(`«${t(x.title)}» كانت سنة ${yr(y)}`, `“${t(x.title)}” was in ${y}`), opts: [{ label: L('صح', 'True'), ok: !lie }, { label: L('غلط', 'False'), ok: lie }], after: `<a href="moment.html?id=${encodeURIComponent(x.id)}">${T(x.title)}</a> · ${esc(fmtDate(x.date))}` };
	});
}
/* «رتّب الحكاية»: five moments on different days, photos first */
function toOrder(s) {
	const all = shuffle((s.timeline || []).filter((x) => !x.when && x.date && t(x.title)));
	const withPics = all.filter((x) => photosOf(x).length), pool = [...withPics, ...all.filter((x) => !photosOf(x).length)];
	const out = [];
	for (const x of pool) if (out.length < 5 && !out.some((o) => o.date === x.date)) out.push(x);
	return out;
}
/* «لعبة الكروت»: six of our photos, each twice */
function toMatch(s) {
	const pics = [...new Set([...(s.gallery || []).flatMap(photosOf), ...(s.timeline || []).flatMap(photosOf)])];
	return shuffle(pics).slice(0, 6);
}
const momentLink = (x) => `<a href="moment.html?id=${encodeURIComponent(x.id)}">${T(x.title)}</a> · ${esc(fmtDate(x.date))}`;
/* «زووم»: a corner of a photo, close up — which moment was it? (the whole photo shows once it's answered) */
function zoomed(s) {
	const moments = (s.timeline || []).filter((x) => !x.when && t(x.title));
	const titled = [...new Map(moments.map((x) => [t(x.title), x])).values()];
	if (titled.length < 4) return [];
	return shuffle(moments.filter((x) => photosOf(x).length)).slice(0, ROUND).map((x) => ({
		photo: pick(photosOf(x)), zoom: `${pick([18, 30, 50, 70, 82])}% ${pick([20, 35, 50, 65, 80])}%`,
		q: L('دي حتة من صورة… كانت إيه؟', 'A corner of a photo… what was it?'),
		opts: shuffle([x, ...shuffle(titled.filter((m) => t(m.title) !== t(x.title))).slice(0, 3)]).map((m) => ({ label: T(m.title), ok: m === x })),
		after: momentLink(x)
	}));
}
const AR = /[؀-ۿ]/;
/* «كمّل الجملة»: a love note or a guestbook wish with its last words gone — which ending is its own? */
function finishLine(s) {
	const lines = [
		...(s.notes || []).filter((n) => t(n.text)).map((n) => ({ text: t(n.text), from: `${esc(nameOf(s, n.by))} — <a href="notes.html">${L('رسايل حب', 'Love notes')}</a>` })),
		...(s.guestbook?.entries || []).filter((e) => t(e.text)).map((e) => ({ text: t(e.text), from: `${esc(t(e.name) || '')} — <a href="guestbook.html">${L('دفتر المعازيم', 'The guestbook')}</a>` }))
	].map((x) => {
		const w = x.text.trim().split(/\s+/);
		if (w.length < 6) return null;
		const k = Math.min(4, Math.max(2, Math.round(w.length / 4)));
		return { ...x, head: w.slice(0, -k).join(' '), tail: w.slice(-k).join(' ') };
	}).filter(Boolean);
	if (lines.length < 4) return [];
	return shuffle(lines).slice(0, ROUND).map((p) => ({
		quote: `${p.head} …`, q: L('كمّل الجملة', 'Finish the line'),
		// the wrong endings in the same language as the line, so the script doesn't give it away
		opts: shuffle([p, ...shuffle(lines.filter((o) => o.tail !== p.tail)).sort((a, b) => (AR.test(b.tail) === AR.test(p.tail)) - (AR.test(a.tail) === AR.test(p.tail))).slice(0, 3)]).map((o) => ({ label: esc(o.tail), ok: o === p })),
		after: `«${esc(p.text)}» — ${p.from}`
	}));
}
/* «رحلاتنا»: a photo from one of our trips — which trip, and which stop on it */
function tripsQuiz(s) {
	const js = s.journeys || [];
	const stopName = (st) => { const p = st.place ? (s.places || []).find((x) => x.id === st.place) : null; return st.title ? t(st.title) : p ? t(p.title) : t(st.head); };
	const shots = js.flatMap((j) => j.stops.filter((st) => (st.photos || []).length).map((st) => ({ j, st })));
	const link = (j, st) => `${esc(stopName(st))} — <a href="journey.html?id=${encodeURIComponent(j.id)}">${T(j.title)}</a> · ${esc(fmtDate(j.date))}`;
	const out = [];
	if (js.length >= 2) shuffle(shots).slice(0, 5).forEach(({ j, st }) => out.push({
		photo: pick(st.photos), q: L('الصورة دي من أنهي رحلة؟', 'Which trip is this photo from?'),
		opts: shuffle([j, ...shuffle(js.filter((o) => o !== j)).slice(0, 3)]).map((o) => ({ label: T(o.title), ok: o === j })), after: link(j, st)
	}));
	shuffle(shots).slice(0, 6).forEach(({ j, st }) => {
		const others = [...new Map(j.stops.filter((o) => o.place !== 'our-home' && stopName(o) && stopName(o) !== stopName(st)).map((o) => [stopName(o), o])).values()];
		if (others.length < 2) return;
		out.push({ photo: pick(st.photos), q: L(`في «${t(j.title)}»… دي كانت فين؟`, `On “${t(j.title)}”… where was this?`), opts: shuffle([st, ...shuffle(others).slice(0, 3)]).map((o) => ({ label: esc(stopName(o)), ok: o === st })), after: link(j, st) });
	});
	return shuffle(out).slice(0, ROUND);
}
/* «سباق الدقيقة»: quick true-or-false lines and «which came first», as many as we can answer in a minute */
function againstClock(s) {
	const titled = [...new Map((s.timeline || []).filter((x) => !x.when && x.date && t(x.title)).map((x) => [t(x.title), x])).values()];
	const firsts = [];
	for (let k = 0; k < 30 && titled.length >= 2; k++) {
		const [a, b] = shuffle(titled);
		if (a.date !== b.date) { const old = a.date < b.date ? a : b; firsts.push({ big: '؟', q: L('أنهي حصلت الأول؟', 'Which came first?'), opts: shuffle([a, b]).map((m) => ({ label: T(m.title), ok: m === old })), after: '' }); }
	}
	return shuffle([...trueFalse(s, 40), ...firsts]).map((q) => ({ ...q, after: '' }));
}
const CLOCK = 60;
const GAMES = [
	['quiz', 'chat', 'عشر أسئلة', 'Ten questions', 'صور وسنين ورسايل وأماكن ووشوش', 'Photos, years, notes, places, faces'],
	['tf', 'sparkle', 'صح ولا غلط', 'True or false', 'جمل سريعة عن حكايتنا', 'Quick lines about us'],
	['order', 'shuffle', 'رتّب الحكاية', 'Put it in order', 'خمس لحظات، رتبها من الأقدم', 'Five moments, oldest first'],
	['match', 'camera', 'لعبة الكروت', 'Pairs', 'اقلب الكروت ولاقي كل صورتين زي بعض', 'Flip the cards, find each pair'],
	['zoom', 'eyes', 'زووم', 'Zoom', 'حتة صغيرة من صورة… كانت إيه؟', 'A corner of a photo… what was it?'],
	['finish', 'letter', 'كمّل الجملة', 'Finish the line', 'رسالة أو تهنئة ناقصة آخرها', 'A note or a wish missing its end'],
	['trips', 'suitcase', 'رحلاتنا', 'Our trips', 'أنهي رحلة، وأنهي محطة', 'Which trip, and which stop'],
	['clock', 'clock', 'سباق الدقيقة', 'Beat the clock', 'أكتر إجابات صح في دقيقة', 'Most right answers in a minute']
];

const tier = (n, of) => (n === of ? L('ذاكرة حديد ♥', 'A memory of steel ♥') : n >= of * 0.7 ? L('فاكرين كل حاجة تقريبًا', 'You remember nearly everything') : n >= of * 0.4 ? L('مش وحش… الحكاية محتاجة تتقري تاني', 'Not bad… time to reread the story') : L('يلا نفتح الألبوم سوا', 'Let’s open the album together'));

/* the best round each of us had this year, and how many rounds we've played */
function board(s, items) {
	const y = String(new Date().getFullYear());
	return ['him', 'her'].map((w) => {
		const mine = items.filter((r) => r.by === w), year = mine.filter((r) => String(r.date || '').startsWith(y));
		const best = year.reduce((b, r) => (!b || r.score / r.of > b.score / b.of ? r : b), null);
		return { w, name: nameOf(s, w), best, rounds: mine.length };
	});
}
const bestText = (b) => (b.best ? `${num(b.best.score)}/${num(b.best.of)}` : '—');

function bandHTML(s, items) {
	const shots = shuffle((s.timeline || []).filter((x) => photosOf(x).length)).slice(0, 2).map((x) => photosOf(x)[0]);
	const rows = board(s, items);
	const top = rows[0].best && rows[1].best ? (rows[0].best.score / rows[0].best.of === rows[1].best.score / rows[1].best.of ? '' : rows[0].best.score / rows[0].best.of > rows[1].best.score / rows[1].best.of ? 'him' : 'her') : rows.find((r) => r.best)?.w || '';
	const pol = (ref, k) => `<span class="fk-pol fk-pol--${k}">${ref ? img(ref, '', 'fk-pol__img') : `<span class="fk-pol__img fk-pol__img--none">${doodle('heart', 40)}</span>`}<i>${k === 1 ? L('إمتى؟', 'When?') : L('فين؟', 'Where?')}</i></span>`;
	return `<div class="fk-band">
		<div class="fk-fan">
			${pol(shots[0], 1)}
			<span class="fk-pol fk-pol--back"><b>${L('؟', '?')}</b><i>${L('فاكر؟', 'Remember?')}</i></span>
			${pol(shots[1], 2)}
		</div>
		<div class="fk-sheet">
			<span class="fk-sheet__pin" aria-hidden="true"></span>
			<p class="fk-sheet__h">${L('مين فاكر أكتر؟', 'Who remembers more?')}</p>
			${rows.map((r) => `<p class="fk-sheet__row${top === r.w ? ' is-top' : ''}"><span>${top === r.w ? '♛ ' : ''}${esc(r.name)}</span><b>${bestText(r)}</b></p>`).join('')}
			<small>${L(`أحسن جولة في ${yr(new Date().getFullYear())}`, `Best round of ${new Date().getFullYear()}`)}</small>
		</div>
	</div>`;
}

export default {
	title: { ar: 'فاكر؟', en: 'Do you remember?' },
	render(s) {
		return `${pageHead(L('فاكر؟', 'Do you remember?'), L('تمن ألعاب من صورنا وحكايتنا: أسئلة، صح ولا غلط، رتّب الحكاية، الكروت، زووم، كمّل الجملة، رحلاتنا، وسباق الدقيقة — ومين فاكر أكتر', 'Eight games made of our own photos and story: questions, true or false, put it in order, pairs, zoom, finish the line, our trips and beat the clock — and who remembers more'), [{ href: 'remember.html', ar: 'فاكر؟', en: 'Do you remember?' }], { band: `<div class="lp-band lp-band--remember" id="fk-band" aria-hidden="true">${bandHTML(s, [])}</div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="fk-game" id="fk-game" aria-live="polite"></div>
			<div class="fk-log" id="fk-log"></div>
		</div></section>
		${related(['gallery', 'onthisday', 'games'])}`;
	},
	async after(main, s) {
		let data = await live.load('remember').catch(() => ({ items: [] }));
		const game = $('#fk-game', main);
		let player = live.me() || '', qs = [], i = 0, score = 0, marks = [], mode = 'quiz', seq = [], flips = [], moves = 0, tick = 0, ends = 0;
		const stopClock = () => { clearInterval(tick); tick = 0; };
		const clockLeft = () => Math.max(0, Math.ceil((ends - Date.now()) / 1000));

		const paintBand = () => { $('#fk-band', main).innerHTML = bandHTML(s, data.items || []); hydrate(main); };
		const paintLog = () => {
			const items = [...(data.items || [])].sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date))).slice(0, 8);
			$('#fk-log', main).innerHTML = items.length ? `<h2 class="fk-log__h">${L('آخر الجولات', 'Last rounds')}</h2><ol class="fk-log__list">${items.map((r) => `<li><span>${esc(nameOf(s, r.by))}</span><small>${esc(fmtDate(r.date))}</small><b>${num(r.score)}/${num(r.of)}</b></li>`).join('')}</ol>` : '';
		};
		const who = () => `<div class="fk-who" role="group" aria-label="${L('مين بيلعب؟', 'Who’s playing?')}">${['him', 'her'].map((w) => `<button class="fk-who__b${player === w ? ' is-on' : ''}" type="button" data-who="${w}" aria-pressed="${player === w}">${esc(nameOf(s, w))}</button>`).join('')}</div>`;

		const start = () => {
			stopClock();
			const pool = questions(s);
			if (pool.length < 3 && toOrder(s).length < 5) {
				game.innerHTML = `<div class="fk-card fk-card--start"><p class="empty">${L('لسه الحكاية محتاجة لحظات وصور أكتر عشان نلعب ♥', 'The story needs a few more moments and photos before we can play ♥')}</p></div>`;
				return;
			}
			game.innerHTML = `<div class="fk-card fk-card--start">
				<span class="fk-card__tab">${L('جولة جديدة', 'New round')}</span>
				<p class="fk-start__h">${L('نلعب إيه؟', 'What shall we play?')}</p>
				<div class="fk-games" role="radiogroup" aria-label="${L('اللعبة', 'The game')}">${GAMES.map(([id, ic, ar, en, dar, den], k) => `<button class="fk-gm${mode === id ? ' is-on' : ''}" type="button" role="radio" aria-checked="${mode === id}" data-game="${id}" style="--k:${k}"><span class="fk-gm__ic">${doodle(ic, 26)}</span><b>${esc(L(ar, en))}</b><small>${esc(L(dar, den))}</small></button>`).join('')}</div>
				<p class="fk-start__p">${L('مين بيلعب؟', 'Who’s playing?')}</p>
				${who()}
				<button class="btn" type="button" id="fk-go">${Y('يلا نلعب', 'يلا نلعب', 'Let’s play')} ${App.arrow}</button>
			</div>`;
			qs = pool;
		};

		const ask = () => {
			const q = qs[i];
			game.innerHTML = `<div class="fk-card">
				${mode === 'clock' ? `<span class="fk-card__tab">${doodle('clock', 16)} <b id="fk-left">${num(clockLeft())}</b></span><span class="fk-clock" aria-hidden="true"><i id="fk-bar" style="--left:${(ends - Date.now()) / (CLOCK * 1000)}"></i></span>` : `<span class="fk-card__tab">${num(i + 1)} / ${num(qs.length)}</span>`}
				<ol class="fk-dots" aria-hidden="true"${mode === 'clock' ? ' hidden' : ''}>${qs.map((_, k) => `<li class="${marks[k] === true ? 'is-ok' : marks[k] === false ? 'is-bad' : k === i ? 'is-now' : ''}"></li>`).join('')}</ol>
				<div class="fk-card__in${q.photo || q.quote ? '' : ' is-plain'}">
					${q.photo ? `<span class="fk-pic${q.zoom ? ' fk-pic--zoom' : ''}"${q.zoom ? ` style="--at:${q.zoom}"` : ''}>${q.zoom ? `<span class="fk-pic__crop">${img(q.photo, '', 'fk-pic__img')}</span>` : img(q.photo, '', 'fk-pic__img')}</span>` : q.quote ? `<blockquote class="fk-quote" dir="auto">${esc(q.quote)}</blockquote>` : `<span class="fk-pic fk-pic--icon" aria-hidden="true">${esc(q.big || '؟')}</span>`}
					<div class="fk-body">
						<p class="fk-q" dir="auto">${esc(q.q)}</p>
						<div class="fk-opts">${q.opts.map((o, k) => `<button class="fk-opt" type="button" data-k="${k}" dir="auto">${o.label}</button>`).join('')}</div>
						<p class="fk-after" id="fk-after" hidden></p>
					</div>
				</div>
				<div class="fk-foot"><span class="fk-score">♥ ${num(score)}</span><button class="btn btn--sm" type="button" id="fk-next" hidden>${i + 1 < qs.length ? `${L('اللي بعده', 'Next')} ${App.arrow}` : L('النتيجة', 'See the score')}</button></div>
			</div>`;
			hydrate(main);
			$('.fk-opt', game)?.focus({ preventScroll: true });
		};

		/* tap the moments in the order they happened; tap a numbered one to take it (and those after it) back */
		const order = () => {
			const mom = toOrder(s);
			qs = mom; seq = []; score = 0; marks = [];
			const paint = () => {
				game.innerHTML = `<div class="fk-card fk-card--order">
					<span class="fk-card__tab">${L('رتّب الحكاية', 'Put it in order')}</span>
					<p class="fk-q">${L('دوس على اللحظات بالترتيب: الأقدم الأول', 'Tap the moments in order, oldest first')}</p>
					<ol class="fk-order">${mom.map((x, k) => { const n = seq.indexOf(k); const ph = photosOf(x)[0]; return `<li><button class="fk-ord${n >= 0 ? ' is-on' : ''}" type="button" data-ord="${k}">${ph ? `<span class="fk-ord__pic">${img(ph, '', 'fk-ord__img')}</span>` : `<span class="fk-ord__pic fk-ord__pic--none">${doodle(x.icon || 'heart', 30)}</span>`}<b dir="auto">${T(x.title)}</b><i class="fk-ord__n">${n >= 0 ? num(n + 1) : ''}</i></button></li>`; }).join('')}</ol>
					<div class="fk-foot"><span class="fk-score">${L(`${num(seq.length)} من ${num(mom.length)}`, `${seq.length} of ${mom.length}`)}</span><button class="btn btn--sm" type="button" id="fk-check"${seq.length === mom.length ? '' : ' disabled'}>${L('شوف الترتيب', 'Check the order')} ${App.arrow}</button></div>
				</div>`;
				hydrate(main);
			};
			order.paint = paint;
			paint();
		};
		const checkOrder = () => {
			const right = qs.map((x, k) => k).sort((a, b) => String(qs[a].date).localeCompare(String(qs[b].date)));
			marks = seq.map((k, pos) => right[pos] === k);
			score = marks.filter(Boolean).length;
			$$('.fk-ord', game).forEach((b) => { const k = +b.dataset.ord, pos = seq.indexOf(k); b.classList.add(right[pos] === k ? 'is-ok' : 'is-bad'); b.disabled = true; b.querySelector('.fk-ord__n').innerHTML = `${num(pos + 1)}<small>${esc(fmtDate(qs[k].date))}</small>`; });
			const btn = $('#fk-check', game); btn.textContent = L('النتيجة', 'See the score'); btn.id = 'fk-done'; btn.disabled = false;
			$('.fk-score', game).textContent = `♥ ${num(score)}`;
		};
		/* six photos face down, twice each: turn two, keep them if they match */
		const match = () => {
			const pics = toMatch(s);
			qs = pics; flips = []; moves = 0; score = 0; marks = [];
			const deck = shuffle([...pics.keys(), ...pics.keys()]);
			game.innerHTML = `<div class="fk-card fk-card--match">
				<span class="fk-card__tab">${L('لعبة الكروت', 'Pairs')}</span>
				<p class="fk-q">${L('اقلب كارتين، ولو نفس الصورة يفضلوا مفتوحين', 'Turn two cards; the same photo stays face up')}</p>
				<div class="fk-match">${deck.map((p, k) => `<button class="fk-mc" type="button" data-mc="${k}" data-pair="${p}" aria-label="${L('كارت', 'A card')} ${num(k + 1)}"><span class="fk-mc__in"><span class="fk-mc__back">${doodle('heart', 26)}</span><span class="fk-mc__face">${img(pics[p], '', 'fk-mc__img')}</span></span></button>`).join('')}</div>
				<div class="fk-foot"><span class="fk-score">${L('محاولات: ', 'Tries: ')}<b id="fk-moves">${num(0)}</b></span><span class="fk-score">${L('أزواج: ', 'Pairs: ')}<b id="fk-pairs">${num(0)}</b> / ${num(pics.length)}</span></div>
			</div>`;
			hydrate(main);
		};
		const flip = (b) => {
			if (b.classList.contains('is-up') || flips.length === 2) return;
			b.classList.add('is-up'); flips.push(b);
			if (flips.length < 2) return;
			moves++; $('#fk-moves', game).textContent = num(moves);
			const [a, c] = flips;
			if (a.dataset.pair === c.dataset.pair) {
				a.classList.add('is-done'); c.classList.add('is-done'); flips = []; score++;
				$('#fk-pairs', game).textContent = num(score);
				if (score === qs.length) {
					// six tries is perfect; every extra two tries costs a heart
					const pairs = qs.length; score = Math.max(1, pairs - Math.floor(Math.max(0, moves - pairs) / 2)); marks = Array.from({ length: pairs }, (_, k) => k < score);
					setTimeout(finish, 700);
				}
			} else setTimeout(() => { a.classList.remove('is-up'); c.classList.remove('is-up'); flips = []; }, 850);
		};

		const answer = (k) => {
			const q = qs[i];
			if (marks[i] !== undefined) return;
			const ok = !!q.opts[k].ok;
			marks[i] = ok;
			if (ok) score++;
			$$('.fk-opt', game).forEach((b, n) => { b.disabled = true; if (q.opts[n].ok) b.classList.add('is-ok'); else if (n === k) b.classList.add('is-bad'); });
			$('.fk-pic--zoom', game)?.classList.add('is-out');
			if (mode === 'clock') { $('.fk-score', game).textContent = `♥ ${num(score)}`; setTimeout(() => { if (!tick) return; i++; i < qs.length ? ask() : endClock(); }, ok ? 350 : 750); return; }
			const after = $('#fk-after', game);
			after.innerHTML = `<b>${ok ? L('صح! ', 'Yes! ') : L('لأ… ', 'Not quite… ')}</b>${q.after}`;
			after.hidden = false;
			$('.fk-score', game).textContent = `♥ ${num(score)}`;
			const dot = $$('.fk-dots li', game)[i]; if (dot) dot.className = ok ? 'is-ok' : 'is-bad';
			const next = $('#fk-next', game); next.hidden = false; next.focus({ preventScroll: true });
		};

		/* the minute is up: the round is the questions answered */
		const endClock = () => { stopClock(); qs = qs.slice(0, Math.max(1, marks.filter((m) => m !== undefined).length)); if (!marks.length) marks = [false]; finish(); };
		const finish = async () => {
			stopClock();
			let saved = '';
			if (player && live.canWrite()) {
				try {
					data = await live.save('remember', (d) => { d.items = [...(d.items || []), { id: live.newId(), by: player, game: mode, score, of: qs.length, date: new Date().toISOString().slice(0, 10), at: new Date().toISOString() }]; });
					saved = L('اتسجلت في اللوحة ♥', 'Saved to the scorecard ♥');
				} catch (err) { saved = live.why ? live.why(err) : ''; }
			} else if (!live.canWrite()) saved = L('النتيجة دي مش هتتحفظ: الموبايل ده لسه مش متظبط إنه يكتب', 'This score won’t be kept: this phone isn’t set up to write yet');
			game.innerHTML = `<div class="fk-card fk-card--end">
				<span class="fk-card__tab">${L('النتيجة', 'The score')}</span>
				<span class="fk-stamp">${num(score)}<small>/${num(qs.length)}</small></span>
				<p class="fk-start__h">${esc(tier(score, qs.length))}</p>
				${player ? `<p class="fk-start__p">${esc(nameOf(s, player))}${saved ? ` · ${esc(saved)}` : ''}</p>` : saved ? `<p class="fk-start__p">${esc(saved)}</p>` : ''}
				<ol class="fk-dots fk-dots--end" aria-hidden="true">${marks.map((m) => `<li class="${m ? 'is-ok' : 'is-bad'}"></li>`).join('')}</ol>
				<button class="btn" type="button" id="fk-again">${L('جولة كمان', 'Another round')} ${App.arrow}</button>
			</div>`;
			paintBand(); paintLog();
			$('#fk-again', game).focus({ preventScroll: true });
		};

		game.addEventListener('click', (e) => {
			const w = e.target.closest('[data-who]');
			if (w) { player = w.dataset.who; $$('[data-who]', game).forEach((b) => { b.classList.toggle('is-on', b === w); b.setAttribute('aria-pressed', String(b === w)); }); return; }
			const gm = e.target.closest('[data-game]');
			if (gm) { mode = gm.dataset.game; $$('[data-game]', game).forEach((b) => { b.classList.toggle('is-on', b === gm); b.setAttribute('aria-checked', String(b === gm)); }); return; }
			if (e.target.closest('#fk-go')) {
				i = 0; score = 0; marks = [];
				if (mode === 'order') return toOrder(s).length >= 3 ? order() : start();
				if (mode === 'match') return toMatch(s).length >= 3 ? match() : start();
				qs = mode === 'tf' ? trueFalse(s) : mode === 'zoom' ? zoomed(s) : mode === 'finish' ? finishLine(s) : mode === 'trips' ? tripsQuiz(s) : mode === 'clock' ? againstClock(s) : questions(s);
				if (!qs.length) { game.querySelector('.fk-start__h').textContent = L('اللعبة دي محتاجة حاجات أكتر في الحكاية — جرّب واحدة تانية', 'This one needs more in the story — try another'); return; }
				if (mode === 'clock') {
					ends = Date.now() + CLOCK * 1000;
					tick = setInterval(() => {
						const left = clockLeft(), el = $('#fk-left', game), bar = $('#fk-bar', game);
						if (el) el.textContent = num(left);
						if (bar) bar.style.setProperty('--left', Math.max(0, (ends - Date.now()) / (CLOCK * 1000)));
						if (!left) endClock();
					}, 200);
				}
				return ask();
			}
			const od = e.target.closest('[data-ord]');
			if (od && !od.disabled) { const k = +od.dataset.ord, at = seq.indexOf(k); if (at >= 0) seq = seq.slice(0, at); else seq.push(k); return order.paint(); }
			if (e.target.closest('#fk-check')) return checkOrder();
			if (e.target.closest('#fk-done')) return finish();
			const mc = e.target.closest('[data-mc]'); if (mc) return flip(mc);
			const o = e.target.closest('.fk-opt'); if (o) return answer(+o.dataset.k);
			if (e.target.closest('#fk-next')) { i++; return i < qs.length ? ask() : finish(); }
			if (e.target.closest('#fk-again')) return start();
		});

		paintBand(); paintLog(); start();
		this.leave = stopClock;
	}
};
