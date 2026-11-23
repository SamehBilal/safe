import { L, Y, esc, pageHead, related, App, $, $$, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* «النقطة»: the notebook every Egyptian home keeps — who came to our wedding, to Fahd's and Abdulrahman's births, and
   what they gave us; then, when they have something of their own (a wedding, a new baby, a graduation…), what we gave
   back. Every person has a page of their own in it: what came in, what went out, and a stamp — «اتردّت ♥» once we've
   returned it, or how much is still on us. Above the title the notebook lies open and the newest line writes itself in.
   A line can keep photos of the envelope it came in and the card inside (up to four), and the message written on it. */

/* our occasions (money came to us) and theirs (we gave) */
const OCCS = [
	{ id: 'wedding', ours: true, ar: 'فرحنا', en: 'Our wedding', ic: 'ring' },
	{ id: 'fahd', ours: true, ar: 'ولادة فهد', en: 'Fahd’s birth', ic: 'lion' },
	{ id: 'abdo', ours: true, ar: 'ولادة عبد الرحمن', en: 'Abdulrahman’s birth', ic: 'chick' },
	{ id: 'ours', ours: true, ar: 'مناسبة تانية لينا', en: 'Another of ours', ic: 'party' },
	{ id: 'their-wedding', ar: 'فرح أو كتب كتاب', en: 'A wedding', ic: 'bride' },
	{ id: 'their-baby', ar: 'ولادة أو سبوع', en: 'A new baby', ic: 'baby' },
	{ id: 'grad', ar: 'نجاح أو تخرّج', en: 'Passing or graduating', ic: 'grad' },
	{ id: 'hajj', ar: 'حج أو عمرة', en: 'Hajj or Umrah', ic: 'moon' },
	{ id: 'home', ar: 'بيت جديد', en: 'A new home', ic: 'house' },
	{ id: 'sick', ar: 'زيارة عيان', en: 'Visiting the sick', ic: 'heart' },
	{ id: 'theirs', ar: 'مناسبة تانية', en: 'Something else', ic: 'gift' }
];
const occOf = (id) => OCCS.find((o) => o.id === id) || OCCS.at(-1);
const INK = ['#f9a3a8', '#ffd66b', '#b9e08a', '#8fd1ef', '#d6b4f0'];
const key = (n) => String(n || '').trim().replace(/\s+/g, ' ').replace(/[أإآ]/g, 'ا').replace(/ة$/g, 'ه').toLowerCase();
/* «بيت واحد، بيتين، ٣ بيوت، ١١ بيت» */
const count = (n, [one, two, few, many], en) => L(n === 1 ? one : n === 2 ? two : `${num(n)} ${n <= 10 ? few : many}`, `${n} ${en}${n === 1 ? '' : 's'}`);
const money = (n) => L(`${num(n)} ج`, `EGP ${num(n)}`);

export default {
	title: { ar: 'النقطة', en: 'The nokta' },
	render(s) {
		const ok = live.canWrite();
		const opts = (ours) => OCCS.filter((o) => !!o.ours === ours).map((o) => `<option value="${o.id}">${esc(L(o.ar, o.en))}</option>`).join('');
		return `
		${pageHead(L('النقطة', 'The nokta'), L('مين جه فرحنا وولادة فهد وعبد الرحمن ونقّطنا بكام — وردّيناها إمتى في مناسباتهم', 'Who came to our wedding and the boys’ births and what they gave — and when we gave it back at theirs'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: 'nokta.html', ar: 'النقطة', en: 'The nokta' }], {
			band: `<div class="nk-band" aria-hidden="true">
				<div class="nk-book">
					<div class="nk-page nk-page--a"><b class="nk-page__head">${L('دفتر النقطة', 'The nokta book')}</b><ol class="nk-lines" id="nk-lines"></ol></div>
					<div class="nk-page nk-page--b"><span class="nk-env">${doodle('letter', 64)}</span><span class="nk-coins">${doodle('coins', 46)}</span><span class="nk-pen">${doodle('pen', 54)}</span></div>
				</div>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<div class="nk-sums" id="nk-sums"></div>
			<details class="composer reveal narrow" id="nk-add" style="margin:0 auto 30px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('pen', 22)}</span> ${Y('اكتب في الدفتر', 'اكتبي في الدفتر', 'Write it in the book')}</summary>
				<form id="nk-form" autocomplete="off">
					<div class="chips nk-dir" role="radiogroup" aria-label="${L('جالنا ولا ادّينا؟', 'In or out?')}">
						<button class="chip is-on" type="button" data-dir="in" role="radio" aria-checked="true">${L('نقّطونا في مناسبتنا', 'They gave at ours')}</button>
						<button class="chip" type="button" data-dir="out" role="radio" aria-checked="false">${L('ردّيناها في مناسبتهم', 'We gave at theirs')}</button>
					</div>
					<div class="f-row">
						<label class="f f--grow"><span>${L('مين؟', 'Who?')}</span><input name="name" dir="auto" maxlength="60" list="nk-names" required placeholder="${L('عمو محمد وطنط هالة', 'Uncle Mohamed & Aunt Hala')}"></label>
						<label class="f"><span>${L('المناسبة', 'Occasion')}</span><select name="occ" data-in="${esc(opts(true))}" data-out="${esc(opts(false))}">${opts(true)}</select></label>
					</div>
					<datalist id="nk-names"></datalist>
					<div class="f-row">
						<label class="f"><span>${L('كام؟ (بالجنيه)', 'How much? (EGP)')}</span><input name="amount" type="number" min="0" step="any" inputmode="decimal"></label>
						<label class="f f--grow"><span>${L('أو حاجة تانية (دهب، هدية…)', 'Or something else (gold, a gift…)')}</span><input name="what" dir="auto" maxlength="60"></label>
						<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date"></label>
					</div>
					<label class="f"><span>${L('كلمة (اختياري)', 'A note (optional)')}</span><input name="note" dir="auto" maxlength="140" placeholder="${L('مين في العيلة، فرح مين…', 'Which of them, whose wedding…')}"></label>
					<div class="f lp-pic nk-pics-f"><span>${L('صورة الظرف أو الكارت اللي معاه (اختياري)', 'A photo of the envelope or the card inside (optional)')}</span>
						<div class="lp-pic__opts nk-pics-f__opts">
							<label class="lp-pic__opt">${doodle('letter', 30)}<b>${L('صوّر الظرف', 'Photograph the envelope')}</b><small>${L('صورة أو أكتر — الظرف والرسالة اللي جواه', 'one or more — the envelope and the card inside')}</small><input name="pics" type="file" accept="image/*" multiple></label>
						</div>
						<div class="nk-pics-f__show" id="nk-pics-show" hidden></div>
					</div>
					<label class="f"><span>${L('الرسالة اللي كانت مكتوبة (اختياري)', 'The message written on it (optional)')}</span><textarea name="msg" dir="auto" rows="2" maxlength="600" placeholder="${L('ألف مبروك يا حبايبنا…', 'Congratulations, dear ones…')}"></textarea></label>
					<p class="form-msg" id="nk-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${L('اكتبها ♥', 'Write it ♥')}</button></div>
				</form>
			</details>
			<div class="toolbar">
				<div class="chips" id="nk-view" role="toolbar" aria-label="${L('نشوف إيه', 'Show')}">
					<button class="chip is-on" type="button" data-view="owe">${L('لسه علينا', 'Still to return')}</button>
					<button class="chip" type="button" data-view="all">${L('كل الناس', 'Everyone')}</button>
					<button class="chip" type="button" data-view="book">${L('الدفتر', 'The book')}</button>
				</div>
				<input class="search" id="nk-q" type="search" dir="auto" placeholder="${L('دوّر على اسم…', 'Find a name…')}" aria-label="${L('دوّر على اسم', 'Find a name')}">
			</div>
			<div class="chips nk-occ" id="nk-occ" role="toolbar" aria-label="${L('مناسبتنا', 'Our occasion')}"></div>
			<div id="nk-list"></div>
		</div></section>
		${related(['family', 'gifts', 'guestbook'])}`;
	},

	async after(main, s) {
		let data = await live.load('nokta');
		let view = 'owe', occ = '', q = '', dir = 'in', timer = 0;
		this.leave = () => clearInterval(timer);
		const mine = (x) => x.by === live.me() && live.canWrite();
		const save = async (fn) => { data = await live.save('nokta', fn); paint(); };
		const f = $('#nk-form', main);
		// when our own occasions happened, for a line without a date
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const ourDay = { wedding: s.married, fahd: kids[0]?.born, abdo: kids[1]?.born };

		const people = () => {
			const by = new Map();
			for (const x of data.items || []) {
				const k = key(x.name);
				if (!k) continue;
				if (!by.has(k)) by.set(k, { name: x.name.trim(), lines: [], got: 0, gave: 0, things: 0 });
				const p = by.get(k);
				p.lines.push(x);
				if (x.dir === 'out') p.gave += +x.amount || 0; else { p.got += +x.amount || 0; if (!x.amount && x.what) p.things++; }
			}
			for (const p of by.values()) {
				p.lines.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
				p.left = Math.max(0, p.got - p.gave);
				const outs = p.lines.filter((x) => x.dir === 'out').length, ins = p.lines.length - outs;
				p.owe = p.left > 0 || (p.things > 0 && outs === 0);
				p.done = ins > 0 && !p.owe;
			}
			return [...by.values()];
		};

		const dateOf = (x) => x.date || ourDay[x.occ] || '';
		const lineHTML = (x) => {
			const o = occOf(x.occ), out = x.dir === 'out';
			const d = dateOf(x);
			return `<li class="nk-line nk-line--${out ? 'out' : 'in'}">
				<span class="nk-line__ic">${doodle(o.ic, 20)}</span>
				<span class="nk-line__top"><b>${out ? L('ردّيناها في', 'We gave at') : L('نقّطونا في', 'Gave at')} ${esc(L(o.ar, o.en))}</b>${x.amount ? `<span class="nk-line__amt">${money(x.amount)}</span>` : ''}</span>
				<span class="nk-line__meta">${d ? `<small>${esc(longDate(d))}</small>` : ''}${x.what ? `<small class="nk-line__gift" dir="auto">${doodle('gift', 14)} ${esc(x.what)}</small>` : ''}${x.note ? `<small dir="auto">${esc(x.note)}</small>` : ''}</span>
				${x.photos?.length || x.msg ? `<span class="nk-line__env">${(x.photos || []).map((p, i) => `<span class="nk-pic" style="--i:${i}"><img class="zoom" data-sketch="${esc(p)}" alt="${L('الظرف', 'The envelope')}" loading="lazy"></span>`).join('')}${x.msg ? `<q class="nk-line__msg" dir="auto">${esc(x.msg)}</q>` : ''}</span>` : ''}
				${mine(x) ? `<button class="link link--danger nk-line__del" type="button" data-del="${esc(x.id)}" aria-label="${L('امسح السطر ده', 'Delete this line')}">${doodle('trash', 16)}</button>` : ''}
			</li>`;
		};
		const stamp = (p) => p.owe
			? `<span class="nk-stamp nk-stamp--owe">${p.left ? L(`علينا ${money(p.left)}`, `${money(p.left)} to return`) : L('لسه هنردّها', 'Still to return')}</span>`
			: p.done ? `<span class="nk-stamp nk-stamp--done">${L('اتردّت ♥', 'Returned ♥')}</span>`
				: `<span class="nk-stamp nk-stamp--gave">${L('ادّيناهم', 'We gave')}</span>`;
		const card = (p, i) => `<article class="nk-card reveal is-in" style="--c:${INK[i % INK.length]};--r:${[-1.2, .8, -.5, 1.1][i % 4]}deg">
			<header><h3 dir="auto">${esc(p.name)}</h3>${stamp(p)}</header>
			<ol class="nk-card__lines">${p.lines.map(lineHTML).join('')}</ol>
			<footer>
				<span>${L('جالنا', 'In')} <b>${money(p.got)}</b></span><span>${L('ردّينا', 'Out')} <b>${money(p.gave)}</b></span>
				${live.canWrite() ? `<button class="btn btn--sm${p.owe ? ' btn--coral' : ''}" type="button" data-back="${esc(p.name)}">${p.owe ? L('ردّيناها ♥', 'We gave it back ♥') : L('سطر جديد', 'New line')}</button>` : ''}
			</footer>
		</article>`;

		const paint = () => {
			const all = (data.items || []);
			const ps = people();
			const ins = all.filter((x) => x.dir !== 'out'), outs = all.filter((x) => x.dir === 'out');
			const sum = (xs) => xs.reduce((n, x) => n + (+x.amount || 0), 0);
			const oweN = ps.filter((p) => p.owe).length;
			$('#nk-sums', main).innerHTML = `
				<div class="nk-sum" style="--c:#f2726f;--r:-1.2deg"><span class="nk-sum__ic">${doodle('coins', 26)}</span><small>${L('نقّطونا', 'Came in')}</small><b>${money(sum(ins))}</b><span>${L('من', 'from')} ${count(new Set(ins.map((x) => key(x.name))).size, ['بيت واحد', 'بيتين', 'بيوت', 'بيت'], 'home')}</span></div>
				<div class="nk-sum" style="--c:#5a9e6f;--r:1deg"><span class="nk-sum__ic">${doodle('gift', 26)}</span><small>${L('ردّينا', 'Given back')}</small><b>${money(sum(outs))}</b><span>${L('في', 'at')} ${count(outs.length, ['مناسبة واحدة', 'مناسبتين', 'مناسبات', 'مناسبة'], 'occasion')}</span></div>
				<div class="nk-sum" style="--c:#e39b2d;--r:-.6deg"><span class="nk-sum__ic">${doodle('pen', 26)}</span><small>${L('لسه علينا', 'Still to return')}</small><b>${num(oweN)}</b><span>${oweN > 2 && oweN <= 10 ? L('بيوت', 'homes') : L('بيت', oweN === 1 ? 'home' : 'homes')}</span></div>`;
			$('#nk-names', main).innerHTML = ps.map((p) => `<option value="${esc(p.name)}">`).join('');

			/* the open notebook: the last lines written, the newest writing itself in */
			const recent = [...all].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 5).reverse();
			const lines = recent.length ? recent : [{ name: L('أول اسم', 'The first name'), amount: 0, occ: 'wedding' }];
			$('#nk-lines', main).innerHTML = lines.map((x, i) => `<li style="--i:${i}"${i === lines.length - 1 ? ' class="is-new"' : ''}><span dir="auto">${esc(x.name)}</span><b>${x.amount ? money(x.amount) : esc(x.what || '…')}</b></li>`).join('');

			/* the occasions of ours that have names in the book */
			const used = OCCS.filter((o) => o.ours && ins.some((x) => x.occ === o.id));
			$('#nk-occ', main).hidden = view === 'book' || used.length < 2;
			$('#nk-occ', main).innerHTML = `<button class="chip${occ ? '' : ' is-on'}" type="button" data-occ="">${L('كل مناسباتنا', 'All of ours')}</button>` + used.map((o) => `<button class="chip${occ === o.id ? ' is-on' : ''}" type="button" data-occ="${o.id}">${doodle(o.ic, 16)} ${esc(L(o.ar, o.en))}</button>`).join('');

			const match = (p) => (!q || key(p.name).includes(key(q))) && (!occ || p.lines.some((x) => x.occ === occ));
			const list = $('#nk-list', main);
			if (view === 'book') {
				// every line, newest occasion first, under the name of the occasion
				const rows = all.filter((x) => !q || key(x.name).includes(key(q))).sort((a, b) => String(dateOf(b)).localeCompare(String(dateOf(a))));
				const groups = new Map();
				for (const x of rows) { const g = `${x.occ}|${x.dir === 'out' ? dateOf(x) : ''}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(x); }
				list.innerHTML = [...groups.values()].map((xs) => {
					const o = occOf(xs[0].occ), d = dateOf(xs[0]), out = xs[0].dir === 'out', total = xs.reduce((n, x) => n + (+x.amount || 0), 0);
					return `<section class="nk-ledger${out ? ' nk-ledger--out' : ''} reveal is-in">
						<h3>${doodle(o.ic, 24)} ${out ? L('ردّيناها في', 'We gave at') + ' ' : ''}${esc(L(o.ar, o.en))}${d ? ` <small>${esc(longDate(d))}</small>` : ''}${total ? `<b>${money(total)}</b>` : ''}</h3>
						<ol>${xs.map((x) => `<li><span dir="auto">${esc(x.name)}${x.photos?.length || x.msg ? ` <span class="nk-has-env" title="${L('معاها ظرف ورسالة', 'Came with an envelope')}">${doodle('letter', 14)}</span>` : ''}</span><i></i><b>${x.amount ? money(x.amount) : ''}${x.what ? ` <em dir="auto">${esc(x.what)}</em>` : ''}</b></li>`).join('')}</ol>
					</section>`;
				}).join('') || `<p class="empty">${L('الدفتر لسه فاضي — أول اسم هيتكتب هنا ♥', 'The book is still empty — the first name goes here ♥')}</p>`;
			} else {
				const shown = ps.filter((p) => (view === 'all' || p.owe) && match(p)).sort((a, b) => (b.left - a.left) || a.name.localeCompare(b.name, 'ar'));
				list.innerHTML = shown.length ? `<div class="nk-cards">${shown.map(card).join('')}</div>`
					: `<p class="empty">${!ps.length ? L('الدفتر لسه فاضي — اكتبوا أول اسم من «اكتب في الدفتر» ♥', 'The book is still empty — write the first name above ♥')
						: view === 'owe' && !q && !occ ? L('مفيش حاجة علينا — كله اتردّ ♥', 'Nothing left to return — all given back ♥') : L('مفيش حد بالشكل ده', 'No one like that')}</p>`;
			}
			live.hydrateSketches(list);
		};

		/* the photos chosen for the next line, shown small before it's written */
		const picsBox = $('#nk-pics-show', main);
		const showPics = () => {
			const files = [...f.pics.files].slice(0, 4);
			picsBox.hidden = !files.length;
			picsBox.innerHTML = files.map((fl) => `<img src="${URL.createObjectURL(fl)}" alt="">`).join('') + (files.length ? `<button class="link link--danger" type="button" id="nk-pics-clear">${L('شيلهم', 'Remove')}</button>` : '');
			$('.nk-pics-f__opts', f).hidden = !!files.length;
		};
		f.pics.addEventListener('change', showPics);
		picsBox.addEventListener('click', (e) => { if (e.target.closest('#nk-pics-clear')) { f.pics.value = ''; showPics(); } });

		/* the form: in (our occasion) or out (theirs) */
		const setDir = (d) => {
			dir = d;
			$$('.nk-dir .chip', f).forEach((c) => { const on = c.dataset.dir === d; c.classList.toggle('is-on', on); c.setAttribute('aria-checked', on); });
			f.occ.innerHTML = f.occ.dataset[d];
		};
		$('.nk-dir', f).addEventListener('click', (e) => { const c = e.target.closest('[data-dir]'); if (c) setDir(c.dataset.dir); });
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#nk-msg', main);
			const amount = +f.amount.value || 0, what = f.what.value.trim();
			if (!amount && !what) { msg.textContent = L('اكتب المبلغ أو الحاجة اللي جت', 'Write the amount or what it was'); f.amount.focus(); return; }
			try {
				msg.textContent = L('بنكتب…', 'Writing…');
				const photos = [];
				for (const fl of [...f.pics.files].slice(0, 4)) photos.push(await live.putSketch(await shrinkPhoto(fl, 1400)));
				await save((d) => { (d.items = d.items || []).push({ id: live.newId(), name: f.name.value.trim(), dir, occ: f.occ.value, amount: amount || undefined, what: what || undefined, date: f.date.value || undefined, note: f.note.value.trim() || undefined, msg: f.msg.value.trim() || undefined, photos: photos.length ? photos : undefined, by: live.me(), at: Date.now() }); });
				f.reset(); showPics(); setDir(dir); msg.textContent = L('اتكتبت في الدفتر ♥', 'Written in the book ♥');
			} catch (err) { msg.textContent = live.why(err); }
		};

		$('#nk-view', main).addEventListener('click', (e) => { const c = e.target.closest('[data-view]'); if (!c) return; view = c.dataset.view; $$('#nk-view .chip', main).forEach((x) => x.classList.toggle('is-on', x === c)); paint(); });
		$('#nk-occ', main).addEventListener('click', (e) => { const c = e.target.closest('[data-occ]'); if (!c) return; occ = c.dataset.occ; paint(); });
		$('#nk-q', main).addEventListener('input', (e) => { q = e.target.value; paint(); });
		$('#nk-list', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]'), back = e.target.closest('[data-back]');
			if (del && confirm(L('تمسح السطر ده من الدفتر؟', 'Delete this line from the book?'))) {
				try { await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); } catch (err) { alert(live.why(err)); }
			}
			if (back) {
				const box = $('#nk-add', main);
				box.open = true; setDir('out'); f.name.value = back.dataset.back;
				box.scrollIntoView({ behavior: 'smooth', block: 'center' });
				f.occ.focus({ preventScroll: true });
			}
		});

		/* the notebook's newest line writes itself in, again and again */
		const write = () => {
			timer = setInterval(() => {
				const li = $('#nk-lines li.is-new', main);
				if (!li || document.hidden) return;
				li.classList.remove('is-new'); void li.offsetWidth; li.classList.add('is-new');
			}, 5200);
		};
		paint();
		write();
	}
};
