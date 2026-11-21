import { L, Y, T, esc, pageHead, related, App, $, $$, num, longDate, mediaURL } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import * as calm from '../calm.js';

/* Our books: what we're reading now (with the page we're on), a wooden shelf with a spine for every book we've
   finished (a thicker spine for a longer book), and a pile of the ones we want to read next. Both phones add and move
   books; the list is shared in content/live/books.bin like the films. */

const SPINES = [['#0e6990', '#fdf6e3'], ['#c2185b', '#fff0f4'], ['#26706b', '#effaf7'], ['#e39b2d', '#2d2a26'], ['#6d4bb3', '#f4efff'], ['#d9534f', '#fff3f1'], ['#37353f', '#fdc830'], ['#5a9e6f', '#f4fbf4'], ['#8a5a2b', '#fbefe0'], ['#1f3b57', '#cfe9f5']];
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const spine = (b) => SPINES[hash(b.id || b.title) % SPINES.length];
const WHO = [
	{ id: 'both', ar: 'إحنا الاتنين', en: 'Both of us' },
	{ id: 'him', ar: '', en: '' },
	{ id: 'her', ar: '', en: '' }
];
const whoName = (w) => (w === 'him' ? App.t(App.story.him) : w === 'her' ? App.t(App.story.her) : L('إحنا الاتنين', 'Both of us'));
const hearts = (n) => (n ? '♥'.repeat(n) + '♡'.repeat(5 - n) : '');
const yr = (d) => (d ? +String(d).slice(0, 4) : 0);

function reading(b) {
	const [ink, paper] = spine(b);
	const p = +b.pages ? Math.min(1, (+b.page || 0) / +b.pages) : 0;
	const ok = live.canWrite();
	return `<article class="bk-now reveal" id="${esc(b.id)}" style="--bk:${ink};--bk-p:${paper};--p:${p.toFixed(3)}">
		${b.cover ? `<img class="bk-now__cover bk-now__img" data-cover="${esc(b.cover)}" alt="">` : `<span class="bk-now__cover" aria-hidden="true"><b dir="auto">${esc(b.title)}</b>${b.author ? `<small dir="auto">${esc(b.author)}</small>` : ''}</span>`}
		<div class="bk-now__tx">
			<h3 dir="auto">${esc(b.title)}</h3>
			${b.author ? `<p class="bk-now__au" dir="auto">${esc(b.author)}</p>` : ''}
			<p class="bk-now__who">${doodle('book', 16)} ${esc(whoName(b.who))}${b.started ? ` · ${L('من', 'since')} ${esc(longDate(b.started))}` : ''}</p>
			${+b.pages ? `<div class="bk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${+b.pages}" aria-valuenow="${+b.page || 0}" aria-label="${L('وصلنا لصفحة', 'Page we’re on')}"><i></i></div>
			<p class="bk-now__pg">${L(`صفحة ${num(+b.page || 0)} من ${num(+b.pages)}`, `Page ${+b.page || 0} of ${+b.pages}`)}</p>` : ''}
			${ok ? `<form class="bk-now__go" data-page="${esc(b.id)}"><label class="sr-only" for="pg-${esc(b.id)}">${L('وصلنا لصفحة كام؟', 'Which page are we on?')}</label><input id="pg-${esc(b.id)}" name="pg" type="number" inputmode="numeric" min="0" step="1" placeholder="${L('وصلنا لصفحة…', 'We’re on page…')}"><button class="btn btn--sm" type="submit">${L('حفظ', 'Save')}</button></form>
			<div class="bk-now__acts"><button class="btn btn--sm btn--coral" type="button" data-finish="${esc(b.id)}">${L('خلصناه ✓', 'Finished ✓')}</button>${b.by === live.me() ? `<button class="link link--danger" type="button" data-del="${esc(b.id)}">${L('مسح', 'Delete')}</button>` : ''}</div>` : ''}
		</div>
	</article>`;
}

function onShelf(b) {
	const [ink, paper] = spine(b);
	const pages = +b.pages || 250;
	const w = Math.round(Math.max(30, Math.min(64, 24 + pages / 18)));
	const h = 150 + (hash(b.title) % 5) * 9;
	return `<button class="bk-spine" type="button" data-book="${esc(b.id)}" style="--bk:${ink};--bk-p:${paper};--w:${w}px;--h:${h}px" aria-label="${esc(b.title)}${b.author ? ' — ' + esc(b.author) : ''}">
		<b dir="auto">${esc(b.title)}</b>${b.hearts ? `<i aria-hidden="true">${'♥'.repeat(Math.min(3, b.hearts))}</i>` : ''}
	</button>`;
}

function details(b) {
	const ok = live.canWrite();
	return `<div class="bk-card" style="--bk:${spine(b)[0]}">
		<button class="bk-card__x" type="button" data-close aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>
		${b.cover ? `<img class="bk-card__cover zoom" data-cover="${esc(b.cover)}" alt="">` : ''}
		<h3 dir="auto">${esc(b.title)}</h3>
		${b.author ? `<p class="bk-card__au" dir="auto">${esc(b.author)}</p>` : ''}
		<p class="bk-card__meta">${[whoName(b.who), +b.pages ? L(`${num(+b.pages)} صفحة`, `${+b.pages} pages`) : '', b.finished ? `${L('خلصناه', 'Finished')} ${longDate(b.finished)}` : ''].filter(Boolean).map(esc).join(' · ')}</p>
		${b.genre || b.publisher || b.year ? `<p class="bk-card__pub" dir="auto">${[b.genre, b.publisher, b.year ? num(+b.year).replace(/[٬,]/g, '') : ''].filter(Boolean).map(esc).join(' · ')}</p>` : ''}
		${b.about ? `<p class="bk-card__about" dir="auto">${esc(b.about)}</p>` : ''}
		${b.link ? `<a class="link" href="${esc(b.link)}" target="_blank" rel="noopener noreferrer">${L('صفحة الكتاب', 'The book’s page')} ↗</a>` : ''}
		${b.hearts ? `<p class="bk-card__hearts" aria-label="${L(`${b.hearts} من ٥`, `${b.hearts} of 5`)}">${hearts(b.hearts)}</p>` : ''}
		${b.note ? `<p class="bk-card__note" dir="auto">«${esc(b.note)}»</p>` : ''}
		${ok ? `<div class="bk-card__acts">${b.status === 'want' ? `<button class="btn btn--sm btn--coral" type="button" data-start="${esc(b.id)}">${L('هنبدأ فيه', 'Start reading')}</button>` : ''}${b.by === live.me() ? `<button class="link link--danger" type="button" data-del="${esc(b.id)}">${L('مسح', 'Delete')}</button>` : ''}</div>` : ''}
	</div>`;
}

export default {
	title: { ar: 'كتبنا', en: 'Our books' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('كتبنا', 'Our books'), L('اللي بنقراه، واللي خلصناه، واللي مستنينا على الرف', 'What we’re reading, what we’ve finished, and what’s waiting on the shelf'), [{ href: 'books.html', ar: 'كتبنا', en: 'Our books' }], { band: `<div class="bkb" id="bk-band" aria-hidden="true">
			<div class="bkb__stack" id="bkb-stack"></div>
			<div class="bkb__book">
				<span class="bkb__page bkb__page--l"><i></i><i></i><i></i><i></i><i></i></span>
				<span class="bkb__page bkb__page--r"><i></i><i></i><i></i><i></i><i></i></span>
				<span class="bkb__flip"></span><span class="bkb__flip bkb__flip--2"></span>
				<span class="bkb__ribbon"></span>
			</div>
			<div class="bkb__side">
				<span class="bkb__mug"><i></i><i></i><i></i></span>
				<p class="bkb__n" id="bkb-n"></p>
			</div>
		</div>` })}
		<section class="sec sec--top"><div class="wrap">
			<div class="counters" id="bk-totals"></div>
			<section class="bk-calm" aria-label="${L('صوت هادي للقراية', 'Calm sounds for reading')}">
				<h3>${doodle('music', 20)} ${L('صوت هادي للقراية', 'Calm sounds for reading')}</h3>
				<p class="muted">${L('شغّلوا واحد أو أكتر سوا — بيتعمل هنا على الموبايل، من غير نت', 'Play one or more together — made right here, no internet needed')}</p>
				<div class="bk-calm__btns">
					<button type="button" class="bk-calm__b" data-calm="piano" aria-pressed="false"><span>🎹</span>${L('بيانو هادي', 'Soft piano')}</button>
					<button type="button" class="bk-calm__b" data-calm="lofi" aria-pressed="false"><span>🎧</span>${L('لو-فاي', 'Lo-fi beat')}</button>
					<button type="button" class="bk-calm__b" data-calm="musicbox" aria-pressed="false"><span>🎠</span>${L('علبة موسيقى', 'Music box')}</button>
					<button type="button" class="bk-calm__b" data-calm="rain" aria-pressed="false"><span>🌧️</span>${L('مطر على الشباك', 'Rain on the window')}</button>
					<button type="button" class="bk-calm__b" data-calm="waves" aria-pressed="false"><span>🌊</span>${L('موج البحر', 'Sea waves')}</button>
					<button type="button" class="bk-calm__b" data-calm="stream" aria-pressed="false"><span>💧</span>${L('مية بتجري', 'A stream')}</button>
					<button type="button" class="bk-calm__b" data-calm="wind" aria-pressed="false"><span>🍃</span>${L('هوا برا', 'Wind outside')}</button>
					<button type="button" class="bk-calm__b" data-calm="fire" aria-pressed="false"><span>🔥</span>${L('نار في الدفاية', 'A crackling fire')}</button>
					<button type="button" class="bk-calm__b" data-calm="birds" aria-pressed="false"><span>🐦</span>${L('عصافير الصبح', 'Morning birds')}</button>
					<button type="button" class="bk-calm__b" data-calm="crickets" aria-pressed="false"><span>🌙</span>${L('صراصير الليل', 'Night crickets')}</button>
					<button type="button" class="bk-calm__b" data-calm="clock" aria-pressed="false"><span>🕰️</span>${L('تكة الساعة', 'A ticking clock')}</button>
				</div>
				<div class="bk-calm__row">
					<label>${L('الصوت', 'Volume')} <input type="range" id="bk-vol" min="0" max="1" step="0.05" value="0.6"></label>
					<label>${L('يقف لوحده بعد', 'Stop after')} <select id="bk-sleep"><option value="0">${L('لأ', 'Never')}</option><option value="20">${L('٢٠ دقيقة', '20 minutes')}</option><option value="45">${L('٤٥ دقيقة', '45 minutes')}</option><option value="90">${L('ساعة ونص', '90 minutes')}</option></select></label>
				</div>
			</section>
			${ok ? '' : `<div class="narrow" style="margin:24px auto 0">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:24px auto 0"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('book', 22)}</span> ${Y('ضيف كتاب', 'ضيفي كتاب', 'Add a book')}</summary>
				<form id="bk-form" autocomplete="off">
					<div class="f-row">
						<label class="f f--grow"><span>${L('اسم الكتاب', 'Title')}</span><input name="title" dir="auto" maxlength="100" required></label>
						<label class="f f--grow"><span>${L('الكاتب', 'Author')}</span><input name="author" dir="auto" maxlength="80"></label>
					</div>
					<div class="f-row">
						<label class="f"><span>${L('فين؟', 'Where is it?')}</span><select name="status"><option value="reading">${L('بنقراه دلوقتي', 'Reading now')}</option><option value="read">${L('خلصناه', 'Finished')}</option><option value="want">${L('نفسنا نقراه', 'Want to read')}</option></select></label>
						<label class="f"><span>${L('مين بيقراه؟', 'Who’s reading?')}</span><select name="who">${WHO.map((w) => `<option value="${w.id}">${esc(whoName(w.id))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('عدد الصفحات', 'Pages')}</span><input name="pages" type="number" inputmode="numeric" min="1" step="1"></label>
					</div>
					<div class="f-row">
						<label class="f"><span>${L('عجبنا قد إيه؟', 'How much did we love it?')}</span><select name="hearts"><option value="">—</option>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${hearts(n)}</option>`).join('')}</select></label>
						<label class="f"><span>${L('خلصناه إمتى؟', 'Finished on')}</span><input name="finished" type="date"></label>
					</div>
					<label class="f"><span>${L('جملة فضلت معانا (اختياري)', 'A line that stayed with us (optional)')}</span><textarea name="note" dir="auto" rows="2" maxlength="300"></textarea></label>
					<p class="form-msg" id="bk-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('حطه على الرف ♥', 'حطيه على الرف ♥', 'Put it on the shelf ♥')}</button></div>
				</form>
			</details>

			<h2 class="sec__title">${L('بنقرا دلوقتي', 'Reading now')}</h2>
			<div class="bk-reading" id="bk-reading"></div>

			<h2 class="sec__title">${L('على الرف', 'On the shelf')}</h2>
			<div class="bk-shelf" id="bk-shelf"></div>
			<div class="bk-detail" id="bk-detail" hidden></div>

			<h2 class="sec__title">${L('مستنيين دورهم', 'Up next')}</h2>
			<ul class="bk-pile" id="bk-pile"></ul>
		</div></section>
		${related(['movies', 'journal', 'goals'])}`;
	},

	async after(main) {
		/* the calm sounds: they stop when we leave the page, and after a while if we ask */
		let sleep = 0;
		const calmPaint = () => $$('[data-calm]', main).forEach((b) => { const on = calm.playing(b.dataset.calm); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
		$('.bk-calm', main).addEventListener('click', (e) => { const b = e.target.closest('[data-calm]'); if (!b) return; calm.toggle(b.dataset.calm); calmPaint(); });
		$('#bk-vol', main).oninput = (e) => calm.volume(+e.target.value);
		$('#bk-sleep', main).onchange = (e) => { clearTimeout(sleep); const m = +e.target.value; if (m) sleep = setTimeout(() => { calm.stopAll(); calmPaint(); e.target.value = '0'; }, m * 60000); };
		this.leave = () => { clearTimeout(sleep); calm.stopAll(); };
		calmPaint();
		const sec = $('.sec', main), detail = $('#bk-detail', main);
		let data = { items: [] };
		const all = () => (data.items || []).slice();
		const find = (d, id) => (d.items || []).find((b) => b.id === id);
		let open = '';

		const paint = () => {
			const now = all().filter((b) => b.status === 'reading').sort((a, b) => (b.at || 0) - (a.at || 0));
			const read = all().filter((b) => b.status === 'read').sort((a, b) => String(a.finished || a.at).localeCompare(String(b.finished || b.at)));
			const want = all().filter((b) => b.status === 'want').sort((a, b) => (a.at || 0) - (b.at || 0));
			$('#bk-reading', main).innerHTML = now.length ? now.map(reading).join('') : `<p class="empty">${L('مفيش كتاب مفتوح دلوقتي… ', 'No book open right now… ')}${want.length ? Y('اختار واحد من اللي مستنيين تحت', 'اختاري واحد من اللي مستنيين تحت', 'pick one from the pile below') : Y('ضيف اللي هتبدأ فيه', 'ضيفي اللي هتبدأي فيه', 'add the one you’re starting')}</p>`;
			// the shelf breaks into rows of about a metre of books
			const per = Math.max(6, Math.floor((sec.clientWidth || 900) / 52));
			const rows = [];
			for (let i = 0; i < read.length; i += per) rows.push(read.slice(i, i + per));
			$('#bk-shelf', main).innerHTML = read.length ? rows.map((r) => `<div class="bk-row">${r.map(onShelf).join('')}</div>`).join('') : `<p class="empty">${L('الرف لسه فاضي — أول كتاب نخلصه هيتحط هنا', 'The shelf is still empty — the first book we finish goes here')}</p>`;
			$('#bk-pile', main).innerHTML = want.length ? want.map((b) => { const [ink, paper] = spine(b); return `<li><button class="bk-pile__b" type="button" data-book="${esc(b.id)}" style="--bk:${ink};--bk-p:${paper}"><b dir="auto">${esc(b.title)}</b>${b.author ? `<small dir="auto">${esc(b.author)}</small>` : ''}</button></li>`; }).join('') : `<li class="empty">${L('مفيش حاجة في الطابور', 'Nothing in the queue')}</li>`;
			for (const el of $$('.reveal', main)) el.classList.add('is-in');
			const year = new Date().getFullYear();
			const pages = read.reduce((a, b) => a + (+b.pages || 0), 0) + now.reduce((a, b) => a + (+b.page || 0), 0);
			$('#bk-totals', main).innerHTML = [
				[num(read.length), L('كتاب خلصناه', read.length === 1 ? 'book finished' : 'books finished')],
				[num(read.filter((b) => yr(b.finished) === year).length), L(`السنة دي`, 'this year')],
				[num(pages), L('صفحة قريناها', 'pages read')],
				[num(want.length), L('مستنيين', 'waiting')]
			].map(([b, s]) => `<div class="counter"><b>${b}</b><span>${s}</span></div>`).join('');
			const pile = [...read.slice(-3), ...now.slice(0, 1), ...want.slice(0, 1)].slice(-4);
			$('#bkb-stack', main).innerHTML = [...Array.from({ length: Math.max(0, 3 - pile.length) }, (_, k) => ({ title: '', id: 'blank' + k })), ...pile]
				.map((b, i) => { const [ink, paper] = spine(b); return `<span class="bkb__spine" style="--bk:${ink};--bk-p:${paper};--i:${i}"><b dir="auto">${esc(b.title)}</b></span>`; }).join('');
			$('#bkb-n', main).innerHTML = `<b>${num(read.length)}</b> ${L('كتاب خلصناهم', read.length === 1 ? 'book finished' : 'books finished')}<br><b>${num(pages)}</b> ${L('صفحة', 'pages')}`;
			for (const im of $$('#bk-reading img[data-cover]', main)) mediaURL(im.dataset.cover).then((u) => { im.src = u; }).catch(() => im.remove());
			if (open) showBook(open);
		};

		const showBook = (id) => {
			const b = all().find((x) => x.id === id);
			open = b ? id : '';
			detail.hidden = !b;
			if (!b) return;
			detail.innerHTML = details(b);
			for (const im of $$('img[data-cover]', detail)) mediaURL(im.dataset.cover).then((u) => { im.src = u; }).catch(() => im.remove());
			for (const el of $$('[data-book]', main)) el.classList.toggle('is-on', el.dataset.book === id);
		};

		const save = async (fn) => {
			try { data = await live.save('books', fn); paint(); }
			catch (err) { alert(live.why(err)); }
		};

		sec.addEventListener('click', (e) => {
			const t = e.target.closest('[data-book], [data-close], [data-finish], [data-start], [data-del]');
			if (!t) return;
			if (t.dataset.book) { showBook(open === t.dataset.book ? '' : t.dataset.book); if (open) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
			if ('close' in t.dataset) showBook('');
			if (t.dataset.finish) save((d) => { const b = find(d, t.dataset.finish); if (b) { b.status = 'read'; b.finished = live.today(); if (+b.pages) b.page = +b.pages; } });
			if (t.dataset.start) { open = ''; save((d) => { const b = find(d, t.dataset.start); if (b) { b.status = 'reading'; b.started = live.today(); b.at = Date.now(); } }); }
			if (t.dataset.del && confirm(Y('تشيل الكتاب ده؟', 'تشيلي الكتاب ده؟', 'Remove this book?'))) { open = ''; save((d) => { d.items = (d.items || []).filter((b) => b.id !== t.dataset.del); }); }
		});
		sec.addEventListener('submit', (e) => {
			const f = e.target;
			if (!f.dataset.page) return;
			e.preventDefault();
			const pg = Math.max(0, Math.round(+f.pg.value));
			if (f.pg.value !== '') save((d) => { const b = find(d, f.dataset.page); if (b) b.page = +b.pages ? Math.min(pg, +b.pages) : pg; });
		});

		const form = $('#bk-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#bk-msg', main);
			const st = form.status.value;
			const b = {
				id: live.newId(), title: form.title.value.trim(), author: form.author.value.trim() || undefined, status: st, who: form.who.value,
				pages: Math.round(+form.pages.value) || undefined, hearts: +form.hearts.value || undefined, note: form.note.value.trim() || undefined,
				finished: st === 'read' ? form.finished.value || live.today() : undefined, started: st === 'reading' ? live.today() : undefined,
				by: live.me(), at: Date.now()
			};
			if (!b.title) return;
			try {
				data = await live.save('books', (d) => { (d.items = d.items || []).push(b); });
				form.reset();
				msg.textContent = L('اتحط ♥', 'Shelved ♥');
				paint();
			} catch (err) { msg.textContent = live.why(err); }
		};

		data = await live.load('books');
		paint();
	}
};
