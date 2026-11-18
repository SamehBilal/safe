import { L, Y, T, t, esc, img, isVideo, hydrate, pageHead, related, fmtDate, App, $, $$, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «فاكر؟» — a game made of our own story: a round of ten questions drawn from what's already here — which year a
   photo is from, what a photo was, who wrote a love note, which of two moments came first, where a photo was taken.
   Each round's score is kept (the «remember» list) so we can see who remembers more.
   Band: three polaroids fanned out, the middle one face down with a big «؟» on its back, and a scorecard pinned
   beside them with each of us and our best round this year. */

const ROUND = 10;
const still = (p) => (typeof p === 'string' ? p : p?.photo) || '';
const photosOf = (x) => [x.photo, x.cover, ...(x.photos || [])].map(still).filter((p) => p && !isVideo(p));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
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
		return shuffle([y, ...others]).map((v) => ({ label: num(v), ok: v === y }));
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
	// one of each kind in turn, so no round is all years
	const out = [], lists = kinds.filter((k) => k.length);
	while (out.length < ROUND && lists.some((k) => k.length)) for (const k of shuffle(lists)) if (k.length && out.length < ROUND) out.push(k.shift());
	return out;
}

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
			<small>${L(`أحسن جولة في ${num(new Date().getFullYear())}`, `Best round of ${new Date().getFullYear()}`)}</small>
		</div>
	</div>`;
}

export default {
	title: { ar: 'فاكر؟', en: 'Do you remember?' },
	render(s) {
		return `${pageHead(L('فاكر؟', 'Do you remember?'), L('لعبة من صورنا وحكايتنا: عشر أسئلة، ومين فاكر أكتر', 'A game made of our own photos and story: ten questions, and who remembers more'), [{ href: 'remember.html', ar: 'فاكر؟', en: 'Do you remember?' }], { band: `<div class="lp-band lp-band--remember" id="fk-band" aria-hidden="true">${bandHTML(s, [])}</div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="fk-game" id="fk-game" aria-live="polite"></div>
			<div class="fk-log" id="fk-log"></div>
		</div></section>
		${related(['gallery', 'onthisday', 'games'])}`;
	},
	async after(main, s) {
		let data = await live.load('remember').catch(() => ({ items: [] }));
		const game = $('#fk-game', main);
		let player = live.me() || '', qs = [], i = 0, score = 0, marks = [];

		const paintBand = () => { $('#fk-band', main).innerHTML = bandHTML(s, data.items || []); hydrate(main); };
		const paintLog = () => {
			const items = [...(data.items || [])].sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date))).slice(0, 8);
			$('#fk-log', main).innerHTML = items.length ? `<h2 class="fk-log__h">${L('آخر الجولات', 'Last rounds')}</h2><ol class="fk-log__list">${items.map((r) => `<li><span>${esc(nameOf(s, r.by))}</span><small>${esc(fmtDate(r.date))}</small><b>${num(r.score)}/${num(r.of)}</b></li>`).join('')}</ol>` : '';
		};
		const who = () => `<div class="fk-who" role="group" aria-label="${L('مين بيلعب؟', 'Who’s playing?')}">${['him', 'her'].map((w) => `<button class="fk-who__b${player === w ? ' is-on' : ''}" type="button" data-who="${w}" aria-pressed="${player === w}">${esc(nameOf(s, w))}</button>`).join('')}</div>`;

		const start = () => {
			const pool = questions(s);
			if (pool.length < 3) {
				game.innerHTML = `<div class="fk-card fk-card--start"><p class="empty">${L('لسه الحكاية محتاجة لحظات وصور أكتر عشان نلعب ♥', 'The story needs a few more moments and photos before we can play ♥')}</p></div>`;
				return;
			}
			game.innerHTML = `<div class="fk-card fk-card--start">
				<span class="fk-card__tab">${L('جولة جديدة', 'New round')}</span>
				<p class="fk-start__h">${L(`${num(pool.length)} أسئلة من حكايتنا`, `${pool.length} questions from our story`)}</p>
				<p class="fk-start__p">${L('صور، سنين، رسايل، وأماكن. مين بيلعب؟', 'Photos, years, notes and places. Who’s playing?')}</p>
				${who()}
				<button class="btn" type="button" id="fk-go">${Y('يلا نلعب', 'يلا نلعب', 'Let’s play')} ${App.arrow}</button>
			</div>`;
			qs = pool;
		};

		const ask = () => {
			const q = qs[i];
			game.innerHTML = `<div class="fk-card">
				<span class="fk-card__tab">${num(i + 1)} / ${num(qs.length)}</span>
				<ol class="fk-dots" aria-hidden="true">${qs.map((_, k) => `<li class="${marks[k] === true ? 'is-ok' : marks[k] === false ? 'is-bad' : k === i ? 'is-now' : ''}"></li>`).join('')}</ol>
				<div class="fk-card__in${q.photo || q.quote ? '' : ' is-plain'}">
					${q.photo ? `<span class="fk-pic">${img(q.photo, '', 'fk-pic__img')}</span>` : q.quote ? `<blockquote class="fk-quote" dir="auto">${esc(q.quote)}</blockquote>` : `<span class="fk-pic fk-pic--icon" aria-hidden="true">${esc(q.big || '؟')}</span>`}
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

		const answer = (k) => {
			const q = qs[i];
			if (marks[i] !== undefined) return;
			const ok = !!q.opts[k].ok;
			marks[i] = ok;
			if (ok) score++;
			$$('.fk-opt', game).forEach((b, n) => { b.disabled = true; if (q.opts[n].ok) b.classList.add('is-ok'); else if (n === k) b.classList.add('is-bad'); });
			const after = $('#fk-after', game);
			after.innerHTML = `<b>${ok ? L('صح! ', 'Yes! ') : L('لأ… ', 'Not quite… ')}</b>${q.after}`;
			after.hidden = false;
			$('.fk-score', game).textContent = `♥ ${num(score)}`;
			const dot = $$('.fk-dots li', game)[i]; if (dot) dot.className = ok ? 'is-ok' : 'is-bad';
			const next = $('#fk-next', game); next.hidden = false; next.focus({ preventScroll: true });
		};

		const finish = async () => {
			let saved = '';
			if (player && live.canWrite()) {
				try {
					data = await live.save('remember', (d) => { d.items = [...(d.items || []), { id: live.newId(), by: player, score, of: qs.length, date: new Date().toISOString().slice(0, 10), at: new Date().toISOString() }]; });
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
			if (e.target.closest('#fk-go')) { i = 0; score = 0; marks = []; return ask(); }
			const o = e.target.closest('.fk-opt'); if (o) return answer(+o.dataset.k);
			if (e.target.closest('#fk-next')) { i++; return i < qs.length ? ask() : finish(); }
			if (e.target.closest('#fk-again')) return start();
		});

		paintBand(); paintLog(); start();
	}
};
