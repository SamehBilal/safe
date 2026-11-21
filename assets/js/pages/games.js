import { L, Y, esc, pageHead, related, App, $, $$, num, longDate, mediaURL } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* Our games: every game night — cards, dominoes, backgammon, PlayStation — who won, the score that matters (who's ahead
   this year), and photos of the night; and the video games we played together, each with its box and photos of us
   playing it. Above the title a hand of cards fans out and is dealt while a die tumbles, a gamepad's buttons light up
   beside a few of our games' boxes, and the year's score between the two of us sits in the middle. We play on the PC and
   the Nintendo Switch: the band has both (the Switch with its red and blue Joy-Cons, the PC's screen with a game on it),
   each video game says which it's on, and the list can show one at a time. */

const IDEAS = [['كوتشينة', 'Cards'], ['دومينو', 'Dominoes'], ['طاولة', 'Backgammon'], ['شطرنج', 'Chess'], ['أونو', 'UNO'], ['بنك الحظ', 'Monopoly'], ['سكرابل', 'Scrabble'], ['بلايستيشن', 'PlayStation'], ['فيفا', 'FIFA'], ['بازل', 'Puzzle'], ['كلمات متقاطعة', 'Crossword']];
/* what we play video games on */
const PLATFORMS = { pc: ['الكمبيوتر', 'PC', '#0e6990'], switch: ['نينتندو سويتش', 'Nintendo Switch', '#e60012'], ps: ['بلايستيشن', 'PlayStation', '#2e3f9e'] };
const CARDS = [['A', '♥'], ['K', '♠'], ['Q', '♦'], ['J', '♣'], ['10', '♥']];
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

export default {
	title: { ar: 'ألعابنا', en: 'Our games' },
	render(s) {
		const ok = live.canWrite();
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const players = [['him', App.t(s.him)], ['her', App.t(s.her)], ...kids.map((k) => [k.id, App.t(k.name)])];
		return `
		${pageHead(L('ألعابنا', 'Our games'), L('كل سهرة لعب، ومين كسب… ومين بيقول «الدور الجاي هكسب»', 'Every game night, who won… and who keeps saying “next time”'), [{ href: 'games.html', ar: 'ألعابنا', en: 'Our games' }], {
			band: `<div class="gm-band" id="gm-band">
				<div class="gm-hand" aria-hidden="true">${CARDS.map(([r, s2], i) => `<span class="gm-card${'♥♦'.includes(s2) ? ' is-red' : ''}" style="--i:${i - 2}"><b>${r}</b><i>${s2}</i><b class="gm-card__b">${r}</b></span>`).join('')}</div>
				<div class="gm-score" id="gm-score"></div>
				<span class="gm-die" id="gm-die" aria-hidden="true"></span>
				<div class="gm-video" aria-hidden="true">
					<div class="gm-boxes" id="gm-boxes"></div>
					<div class="gm-consoles">
						<svg class="gm-switch" viewBox="0 0 200 90"><rect class="gm-jc gm-jc--l" x="2" y="6" width="34" height="78" rx="16"/><rect class="gm-jc gm-jc--r" x="164" y="6" width="34" height="78" rx="16"/>
							<rect class="gm-tab" x="34" y="6" width="132" height="78" rx="4"/><rect class="gm-scr" x="44" y="14" width="112" height="62" rx="2"/>
							<circle class="gm-stick" cx="19" cy="28" r="7"/><path class="gm-dbtn" d="M15 56h8M19 52v8"/><circle class="gm-stick" cx="181" cy="58" r="7"/>
							<circle class="gm-abxy" cx="181" cy="22" r="3"/><circle class="gm-abxy" cx="188" cy="29" r="3"/><circle class="gm-abxy" cx="174" cy="29" r="3"/><circle class="gm-abxy" cx="181" cy="36" r="3"/>
							<g class="gm-scr__play"><circle cx="78" cy="54" r="6" fill="#e60012"/><circle cx="122" cy="40" r="6" fill="#0ab9e6"/><path d="M58 66h84" stroke="#9fd36b" stroke-width="4"/></g></svg>
						<svg class="gm-pc" viewBox="0 0 120 100"><rect class="gm-mon" x="4" y="4" width="112" height="70" rx="6"/><rect class="gm-scr" x="12" y="12" width="96" height="54" rx="2"/>
							<path class="gm-stand" d="M50 74h20l4 14H46Z"/><rect class="gm-stand" x="34" y="88" width="52" height="7" rx="3"/>
							<g class="gm-scr__play"><path d="M20 58l14-16 10 10 16-20 14 14 12-8" fill="none" stroke="#fdc830" stroke-width="3"/><circle cx="34" cy="42" r="4" fill="#f2726f"/></g></svg>
					</div>
				</div>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('dice', 22)}</span> ${Y('سجّل دور', 'سجّلي دور', 'Log a game')}</summary>
				<form id="gm-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('اللعبة', 'Game')}</span><input name="game" dir="auto" maxlength="40" required list="gm-ideas"></label>
						<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date"></label>
					</div>
					<datalist id="gm-ideas">${IDEAS.map(([ar, en]) => `<option value="${esc(L(ar, en))}">`).join('')}</datalist>
					<fieldset class="gm-who"><legend>${L('مين كسب؟', 'Who won?')}</legend>${players.map(([id, n], i) => `<label><input type="radio" name="winner" value="${esc(id)}"${i === 0 ? ' checked' : ''}><span>${esc(n)}</span></label>`).join('')}<label><input type="radio" name="winner" value="draw"><span>${L('تعادل', 'A draw')}</span></label></fieldset>
					<div class="f-row">
						<label class="f"><span>${L('النتيجة (اختياري)', 'Score (optional)')}</span><input name="score" dir="ltr" maxlength="20" placeholder="51 – 38"></label>
						<label class="f f--grow"><span>${L('حصل إيه؟ (اختياري)', 'What happened? (optional)')}</span><input name="note" dir="auto" maxlength="120"></label>
					</div>
					<label class="f"><span>${L('صور من السهرة (اختياري)', 'Photos of the night (optional)')}</span><input name="photos" type="file" accept="image/*" multiple></label>
					<p class="form-msg" id="gm-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${L('سجّل ♥', 'Log it ♥')}</button></div>
				</form>
			</details>
			<div class="chips" id="gm-years" role="toolbar" aria-label="${L('السنة', 'Year')}"></div>
			<div class="counters gm-board" id="gm-board"></div>
			<h2 class="sec__title">${L('كل لعبة', 'Each game')}</h2>
			<div class="gm-games" id="gm-games"></div>
			<h2 class="sec__title">${L('آخر السهرات', 'Latest game nights')}</h2>
			<ul class="gm-log" id="gm-log"></ul>
			<div class="games" id="gm-played" hidden>
				<h2 class="sec__title">${L('لعبنا سوا', 'Games we played together')}</h2>
				<p class="sec__sub">${L('مش كل السهرات أفلام — ساعات كانت دراع في إيد كل واحد فينا، على الكمبيوتر أو السويتش', 'Not every night was a film — sometimes it was a controller each, on the PC or the Switch')}</p>
				<div class="chips" id="gm-plat" role="toolbar" aria-label="${L('بنلعب على إيه', 'Played on')}"></div>
				<div class="games__grid" id="gm-played-grid"></div>
			</div>
		</div></section>
		${related(['draw', 'movies', 'chores'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const nameOf = (id) => (id === 'him' ? App.t(s.him) : id === 'her' ? App.t(s.her) : id === 'draw' ? L('تعادل', 'Draw') : App.t(kids.find((k) => k.id === id)?.name || ''));
		const players = ['him', 'her', ...kids.map((k) => k.id)];
		// the video and PC games we played together (kept with the films, movies.json → games), with their box art
		let mv = { games: [] };
		let plat = '';
		const paintPlayed = () => {
			const every = (mv.games || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
			const list = every.filter((g) => !plat || g.platform === plat);
			const on = Object.keys(PLATFORMS).filter((k) => every.some((g) => g.platform === k));
			$('#gm-plat', main).innerHTML = on.length > 1 ? [['', L('الكل', 'All'), every.length], ...on.map((k) => [k, L(PLATFORMS[k][0], PLATFORMS[k][1]), every.filter((g) => g.platform === k).length])].map(([k, t, n]) => `<button class="chip${k === plat ? ' is-on' : ''}" type="button" data-plat="${k}" style="--c:${PLATFORMS[k]?.[2] || 'var(--coral)'}">${esc(t)} <small>${num(n)}</small></button>`).join('') : '';
			// the games we play on screens are games to log too
			const ideas = $('#gm-ideas', main);
			for (const g of every) if (![...ideas.options].some((o) => o.value === g.title)) ideas.insertAdjacentHTML('beforeend', `<option value="${esc(g.title)}">`);
			$('#gm-played', main).hidden = !every.length;
			$('#gm-played-grid', main).innerHTML = list.map((g) => `
				<article class="game">
					${g.cover ? `<img class="game__cover" data-cover="${esc(g.cover)}" alt="" decoding="async">` : '<span class="game__pad" aria-hidden="true">🎮</span>'}
					<h3 dir="auto">${esc(g.title)}</h3>
					${g.platform && PLATFORMS[g.platform] ? `<span class="gm-on" style="--c:${PLATFORMS[g.platform][2]}">${esc(L(PLATFORMS[g.platform][0], PLATFORMS[g.platform][1]))}</span>` : ''}
					${g.year ? `<p class="game__year">${num(g.year).replace(/[٬,]/g, '')}</p>` : ''}
					${g.note ? `<p class="game__note" dir="auto">${esc(g.note)}</p>` : ''}
					${(g.photos || []).length ? `<span class="gm-pics">${g.photos.map((ph) => `<img class="zoom" data-sketch="${esc(ph)}" alt="" loading="lazy">`).join('')}</span>` : ''}
					${live.canWrite() ? `<button class="btn btn--sm btn--ghost" type="button" data-game-pics="${esc(g.id)}">${doodle('camera', 16)} ${L('صور وإحنا بنلعبها', 'Photos of us playing')}</button>` : ''}
				</article>`).join('');
			for (const im of $$('#gm-played-grid img[data-cover]', main)) mediaURL(im.dataset.cover).then((u) => { im.src = u; }).catch(() => im.remove());
			live.hydrateSketches($('#gm-played-grid', main));
			// the band: three of our games' boxes, fanned out beside the gamepad
			const boxes = every.filter((g) => g.cover).slice(0, 3);
			$('#gm-boxes', main).innerHTML = boxes.map((g, i) => `<img data-cover="${esc(g.cover)}" alt="" style="--i:${i - 1}">`).join('');
			for (const im of $$('#gm-boxes img', main)) mediaURL(im.dataset.cover).then((u) => { im.src = u; }).catch(() => im.remove());
		};
		live.load('movies').then((m) => { mv = m; paintPlayed(); }).catch(() => {});
		$('#gm-plat', main).addEventListener('click', (e) => { const c = e.target.closest('[data-plat]'); if (c) { plat = c.dataset.plat; paintPlayed(); } });
		$('#gm-played-grid', main).addEventListener('click', async (e) => {
			const b = e.target.closest('[data-game-pics]');
			if (!b) return;
			const files = await (new Promise((done) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => done([...i.files]); i.click(); }));
			if (!files.length) return;
			b.disabled = true;
			try {
				const ids = []; for (const f2 of files) ids.push(await live.putSketch(await shrinkPhoto(f2, 1200)));
				mv = await live.save('movies', (d) => { const g = (d.games || []).find((x) => x.id === b.dataset.gamePics); if (g) g.photos = [...(g.photos || []), ...ids]; });
				paintPlayed();
			} catch (err) { alert(live.why(err)); b.disabled = false; }
		});
		let data = await live.load('games');
		const thisYear = new Date().getFullYear();
		let year = thisYear;
		const yearOf = (g) => +String(g.date || '').slice(0, 4) || thisYear;
		const yt = (y) => (App.lang === 'ar' ? num(y).replace(/[٬,]/g, '') : String(y));

		/* the die: a new face every roll */
		const die = $('#gm-die', main);
		const face = (n) => { die.innerHTML = Array.from({ length: 9 }, (_, i) => `<i${PIPS[n].includes(i + 1) ? ' class="on"' : ''}></i>`).join(''); };
		face(6);
		const roll = setInterval(() => { if (!document.hidden) face(1 + Math.floor(Math.random() * 6)); }, 2400);
		this.leave = () => clearInterval(roll);

		const paint = () => {
			const all = (data.items || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.at || 0) - (a.at || 0));
			const years = [...new Set([thisYear, ...all.map(yearOf)])].sort((a, b) => b - a);
			$('#gm-years', main).innerHTML = [...years.map((y) => `<button class="chip${y === year ? ' is-on' : ''}" type="button" data-year="${y}">${yt(y)}</button>`), `<button class="chip${year === 0 ? ' is-on' : ''}" type="button" data-year="0">${L('من الأول', 'All time')}</button>`].join('');
			const inYear = all.filter((g) => !year || yearOf(g) === year);
			const wins = (id, list = inYear) => list.filter((g) => g.winner === id).length;

			/* the band's scoreboard: the two of us, this year */
			const yh = all.filter((g) => yearOf(g) === thisYear);
			$('#gm-score', main).innerHTML = `<span class="gm-score__p"><b>${num(wins('him', yh))}</b><small>${esc(App.t(s.him))}</small></span><i>—</i><span class="gm-score__p"><b>${num(wins('her', yh))}</b><small>${esc(App.t(s.her))}</small></span><em>${L(`سنة ${yt(thisYear)}`, String(thisYear))}</em>`;

			/* who's ahead */
			const lead = Math.max(0, ...players.map((p) => wins(p)));
			$('#gm-board', main).innerHTML = players.map((p) => `<div class="counter${lead && wins(p) === lead ? ' is-lead' : ''}">${lead && wins(p) === lead ? `<i class="gm-crown" aria-hidden="true">♛</i>` : ''}<b>${num(wins(p))}</b><span>${esc(nameOf(p))}</span></div>`).join('') + `<div class="counter"><b>${num(inYear.length)}</b><span>${L('دور', inYear.length === 1 ? 'game' : 'games')}</span></div>`;

			/* each game */
			const games = [...new Set(inYear.map((g) => g.game))];
			$('#gm-games', main).innerHTML = games.map((name, i) => {
				const list = inYear.filter((g) => g.game === name);
				return `<article class="gm-game" style="--r:${[-1.5, 1, -0.8, 1.6][i % 4]}deg">
					<h3 dir="auto">${esc(name)}</h3>
					<p class="gm-game__n">${num(list.length)} ${L(list.length === 1 ? 'مرة' : 'مرات', list.length === 1 ? 'time' : 'times')} · ${L('آخر مرة', 'last')} ${esc(longDate(list[0].date || ''))}</p>
					<ul>${players.filter((p) => wins(p, list)).sort((a, b) => wins(b, list) - wins(a, list)).map((p) => `<li><span>${esc(nameOf(p))}</span><b>${'●'.repeat(Math.min(10, wins(p, list)))}${wins(p, list) > 10 ? '+' : ''}</b><em>${num(wins(p, list))}</em></li>`).join('')}</ul>
				</article>`;
			}).join('') || `<p class="empty">${L('لسه ماسجلناش ولا دور', 'No games logged yet')}</p>`;

			/* the latest nights */
			$('#gm-log', main).innerHTML = inYear.slice(0, 30).map((g) => `
				<li><span class="gm-log__d">${esc(longDate(g.date || ''))}</span><b dir="auto">${esc(g.game)}</b>
					<span class="gm-log__w">${g.winner === 'draw' ? L('تعادل', 'A draw') : `${doodle('star', 14)} ${esc(nameOf(g.winner))}`}</span>
					${g.score ? `<span class="gm-log__s" dir="ltr">${esc(g.score)}</span>` : ''}${g.note ? `<small dir="auto">${esc(g.note)}</small>` : ''}
					${(g.photos || []).length ? `<span class="gm-pics">${g.photos.map((ph) => `<img class="zoom" data-sketch="${esc(ph)}" alt="" loading="lazy">`).join('')}</span>` : ''}
					${live.canWrite() ? `<button class="link gm-addpics" type="button" data-pics="${esc(g.id)}" title="${L('ضيف صور', 'Add photos')}">${doodle('camera', 15)}</button>` : ''}
					${g.by === live.me() && live.canWrite() ? `<button class="link link--danger" type="button" data-del="${esc(g.id)}">✕</button>` : ''}</li>`).join('') || `<li class="empty">${L('السهرة الجاية هتتسجل هنا', 'The next game night goes here')}</li>`;
			live.hydrateSketches($('#gm-log', main));
		};

		$('#gm-years', main).addEventListener('click', (e) => { const c = e.target.closest('[data-year]'); if (c) { year = +c.dataset.year; paint(); } });
		const pickPhotos = () => new Promise((done) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => done([...i.files]); i.click(); });
		const putAll = async (files) => { const out = []; for (const f2 of files) out.push(await live.putSketch(await shrinkPhoto(f2, 1200))); return out; };
		$('#gm-log', main).addEventListener('click', async (e) => {
			const pics = e.target.closest('[data-pics]');
			if (pics) {
				const files = await pickPhotos();
				if (!files.length) return;
				pics.disabled = true;
				try { const ids = await putAll(files); data = await live.save('games', (d) => { const g = (d.items || []).find((x) => x.id === pics.dataset.pics); if (g) g.photos = [...(g.photos || []), ...ids]; }); paint(); } catch (err) { alert(live.why(err)); pics.disabled = false; }
				return;
			}
			const del = e.target.closest('[data-del]');
			if (!del || !confirm(Y('تمسح الدور ده؟', 'تمسحي الدور ده؟', 'Delete this game?'))) return;
			try { data = await live.save('games', (d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); paint(); } catch (err) { alert(live.why(err)); }
		});
		const f = $('#gm-form', main);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gm-msg', main);
			const g = { id: live.newId(), game: f.game.value.trim(), date: f.date.value || live.today(), winner: f.winner.value, score: f.score.value.trim() || undefined, note: f.note.value.trim() || undefined, by: live.me(), at: Date.now() };
			if (!g.game) return;
			try {
				if (f.photos.files.length) { msg.textContent = L('بنحفظ الصور…', 'Saving the photos…'); g.photos = await putAll([...f.photos.files]); }
				data = await live.save('games', (d) => { (d.items = d.items || []).push(g); }); year = yearOf(g); f.reset(); msg.textContent = L('اتسجل ♥', 'Logged ♥'); paint(); } catch (err) { msg.textContent = live.why(err); }
		};
		paint();
	}
};
