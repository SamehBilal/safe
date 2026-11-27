import { L, Y, T, esc, num, longDate, App, $, $$ } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { GOVERNORATES } from '../egypt.js';
import { fit, CAPITALS } from '../tilemap.js';

/* «رحلتنا الجاية», a section of «رحلاتنا» (journeys.js puts section() where it wants it and calls after()).
   The trip we're going on next is a boarding pass: from home to there, the days, the nights, who's coming, a countdown
   that ticks, and a little map of where we're going on its stub. Under it the bag (a packing list we both tick, with a
   ring of how much is packed) and what we'll do there, each with its own «add». The other trips we're planning wait
   beside it as small tickets (tap one to bring it up), and the ones we've been on are stamped «رحناها».
   The form is a booking: where to, the governorate, the dates (it counts the nights), who's coming, and what to pack and
   do, with ideas to tap in. Its own shared list: content/live/nexttrip.bin. */

const KIND = 'nexttrip';
const DAY = 864e5;
const lines = (t) => String(t || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
const startOf = (d) => new Date(`${d}T00:00:00`);
const daysTo = (d) => Math.round((startOf(d) - startOf(live.today())) / DAY);
const nights = (a, b) => (a && b ? Math.max(0, Math.round((startOf(b) - startOf(a)) / DAY)) : 0);
const govOf = (id) => GOVERNORATES.find((g) => g.id === id);
// the pass's big letters: the airport of the governorate when it has one, else three letters of its name
const IATA = { 'EG.QH': 'CAI', 'EG.JZ': 'SPX', 'EG.IK': 'HBE', 'EG.UQ': 'LXR', 'EG.AN': 'ASW', 'EG.JS': 'SSH', 'EG.BA': 'HRG', 'EG.MT': 'MUH', 'EG.WJ': 'UVL', 'EG.SS': 'AAC' };
const codeOf = (x) => IATA[x.gov] || (String(govOf(x.gov)?.en || '').split(/\s+/).filter((w) => !/^(al|el|new|north|south|the)$/i.test(w))[0] || '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || (/^[A-Za-z]/.test(x.where || '') ? x.where.slice(0, 3).toUpperCase() : '♥');
const capital = (id) => (CAPITALS[id] ? { lat: CAPITALS[id][0], lng: CAPITALS[id][1] } : null);
const plural = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? few : many);
const daysWord = (n) => L(plural(n, 'يوم', 'يومين', 'أيام', 'يوم'), n === 1 ? 'day' : 'days');
const upcoming = (items) => items.filter((x) => !x.done && x.date && daysTo(x.until || x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
const been = (items) => items.filter((x) => x.done || (x.date && daysTo(x.until || x.date) < 0)).sort((a, b) => String(b.date).localeCompare(String(a.date)));

function people(s) { return (s.family?.members || []).map((m) => ({ id: m.id, name: App.t(m.name), kid: !!m.kid })); }
function suggestions(s) {
	const kids = people(s).filter((p) => p.kid);
	return {
		pack: [L('الشاحن', 'Chargers'), L('باور بانك', 'Power bank'), L('نضارة الشمس', 'Sunglasses'), L('كريم الشمس', 'Sunscreen'), L('المايوه', 'Swimsuits'), L('الشبشب', 'Flip-flops'), L('الأدوية', 'Medicine'), L('البطايق', 'IDs'), L('الكاميرا', 'Camera'), ...kids.map((k) => L(`هدوم ${k.name}`, `${k.name}’s clothes`)), L('أكل للطريق', 'Snacks for the road')],
		ideas: [L('نتمشى على البحر', 'A walk by the sea'), L('نجرب أكل المكان', 'Try the local food'), L('صورة عيلة', 'A family photo'), L('نتفرج على الغروب', 'Watch the sunset'), L('نزور مكان جديد', 'Somewhere new'), L('سهرة لينا', 'A night out, just us')]
	};
}

/* ---- the boarding pass of the trip on top ---- */
function pass(x, s) {
	const g = govOf(x.gov), n = daysTo(x.date), nn = nights(x.date, x.until);
	const who = people(s).filter((p) => (x.who || []).includes(p.id)).map((p) => p.name);
	return `<article class="nt-pass" data-id="${esc(x.id)}">
		<div class="nt-pass__main">
			<header class="nt-pass__top"><span class="nt-pass__brand">${doodle('plane', 18)} ${L('طيران حبنا', 'Air Us')}</span><span class="nt-pass__kind">${L('كارت صعود', 'Boarding pass')} · BOARDING PASS</span></header>
			<div class="nt-pass__route">
				<div class="nt-pass__end"><small>${L('من', 'From')}</small><b dir="ltr">HOME</b><i>${L('البيت', 'Home')}</i></div>
				<span class="nt-pass__fly" aria-hidden="true"><i></i>${doodle('plane', 26)}<i></i></span>
				<div class="nt-pass__end"><small>${L('إلى', 'To')}</small><b dir="ltr">${esc(codeOf(x))}</b><i dir="auto">${esc(x.where)}</i></div>
			</div>
			<dl class="nt-pass__info">
				<div><dt>${L('السفر', 'Leaving')}</dt><dd>${esc(longDate(x.date))}</dd></div>
				${x.until ? `<div><dt>${L('الرجوع', 'Back')}</dt><dd>${esc(longDate(x.until))}</dd></div>` : ''}
				${nn ? `<div><dt>${L('ليالي', 'Nights')}</dt><dd>${num(nn)}</dd></div>` : ''}
				${g ? `<div><dt>${L('المحافظة', 'Governorate')}</dt><dd>${esc(L(g.ar, g.en))}</dd></div>` : ''}
				${who.length ? `<div class="nt-pass__who"><dt>${L('المسافرين', 'Passengers')}</dt><dd>${who.map(esc).join(' · ')}</dd></div>` : ''}
			</dl>
			${n > 0 ? `<div class="nt-count" data-at="${esc(x.date)}" aria-live="off"><span><b data-u="d">${num(n)}</b><small>${daysWord(n)}</small></span><span><b data-u="h">–</b><small>${L('ساعة', 'hours')}</small></span><span><b data-u="m">–</b><small>${L('دقيقة', 'mins')}</small></span></div>`
				: `<p class="nt-now">${n === 0 ? L('النهارده! يلا بينا ✈', 'Today! Let’s go ✈') : L('إحنا هناك دلوقتي ♥', 'We’re there right now ♥')}</p>`}
			${x.note ? `<p class="nt-pass__note" dir="auto">${esc(x.note)}</p>` : ''}
		</div>
		<div class="nt-pass__stub">
			${capital(x.gov) ? `<div class="nt-pass__map" style="direction:ltr"><div class="nt-pass__tiles" aria-hidden="true"></div><i class="nt-pass__pin" aria-hidden="true"></i></div>` : `<div class="nt-pass__map nt-pass__map--none">${doodle('suitcase', 40)}</div>`}
			<p class="nt-pass__seat"><small>${L('الكرسي', 'Seat')}</small><b>1A ♥</b></p>
			<span class="nt-pass__code" aria-hidden="true"></span>
		</div>
	</article>`;
}

/* ---- the bag and the plans of that trip ---- */
function plan(x) {
	const bag = lines(x.pack), ideas = lines(x.ideas), done = new Set((x.packed || []).map(Number));
	const pct = bag.length ? Math.round((bag.filter((_, i) => done.has(i)).length / bag.length) * 100) : 0;
	const ok = live.canWrite();
	const adder = (n, ph) => (ok ? `<form class="nt-add" data-add="${n}"><input name="t" dir="auto" maxlength="80" placeholder="${esc(ph)}"><button class="btn btn--sm" type="submit">${L('ضيف', 'Add')}</button></form>` : '');
	return `<div class="nt-plan">
		<section class="nt-box nt-bag">
			<header><h3>${doodle('suitcase', 22)} ${L('الشنطة', 'The bag')}</h3><span class="nt-ring" style="--p:${pct}"><b>${num(pct)}٪</b></span></header>
			${bag.length ? `<ul class="nt-check">${bag.map((t, i) => `<li class="${done.has(i) ? 'is-on' : ''}"><label><input type="checkbox" data-pack="${i}"${done.has(i) ? ' checked' : ''}${ok ? '' : ' disabled'}><span dir="auto">${esc(t)}</span></label></li>`).join('')}</ul>` : `<p class="nt-empty">${L('الشنطة لسه فاضية', 'The bag is still empty')}</p>`}
			${adder('pack', L('حاجة نحطها في الشنطة', 'Something for the bag'))}
		</section>
		<section class="nt-box nt-todo">
			<header><h3>${doodle('star', 22)} ${L('هنعمل إيه هناك', 'What we’ll do there')}</h3></header>
			${ideas.length ? `<ol class="nt-ideas">${ideas.map((t) => `<li dir="auto">${esc(t)}</li>`).join('')}</ol>` : `<p class="nt-empty">${L('لسه مفيش خطة… ضيفوا فكرة', 'No plans yet… add an idea')}</p>`}
			${adder('ideas', L('فكرة نعملها', 'An idea'))}
		</section>
	</div>
	${ok ? `<div class="nt-acts"><button class="btn btn--sm" type="button" data-done="${esc(x.id)}">${doodle('heart', 16)} ${L('رحناها ✓', 'We went ✓')}</button>${x.by === live.me() ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح الرحلة', 'Delete the trip')}</button>` : ''}</div>` : ''}`;
}

export default {
	/* the section: its heading, the form, the board */
	section(s) {
		const ok = live.canWrite();
		const sug = suggestions(s);
		const govs = [...GOVERNORATES].sort((a, b) => L(a.ar, a.en).localeCompare(L(b.ar, b.en)));
		return `<section class="sec nt-sec" id="nt-sec"><div class="wrap">
			<header class="nt-head">
				<div>
					<p class="gh-k">${doodle('plane', 16)} ${L('اللي جاي', 'What’s next')}</p>
					<h2 class="nt-h">${L('رحلتنا الجاية', 'Our next trip')}</h2>
					<p class="muted">${L('رايحين فين، فاضل كام يوم، وناخد إيه معانا', 'Where we’re going, how many days left, and what to pack')}</p>
				</div>
			</header>
			${ok ? '' : `<div class="narrow" style="margin:0 auto 22px">${setupNote()}</div>`}
			<details class="composer reveal nt-book"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('plane', 22)}</span> ${Y('احجز رحلة', 'احجزي رحلة', 'Book a trip')}</summary>
				<form id="nt-form" class="nt-form" autocomplete="off">
					<p class="nt-form__k">${doodle('plane', 16)} ${L('حجز رحلة · طيران حبنا', 'Booking · Air Us')}</p>
					<div class="nt-form__route">
						<div class="nt-form__from"><small>${L('من', 'From')}</small><b>${L('البيت', 'Home')}</b></div>
						<span class="nt-form__fly" aria-hidden="true">${doodle('plane', 22)}</span>
						<label class="f nt-form__to"><span>${L('رايحين فين؟', 'Where to?')}</span><input name="where" dir="auto" maxlength="80" required placeholder="${L('دهب', 'Dahab')}"></label>
					</div>
					<div class="f-row">
						<label class="f"><span>${L('المحافظة', 'Governorate')}</span><select name="gov"><option value="">—</option>${govs.map((g) => `<option value="${g.id}">${esc(L(g.ar, g.en))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('هنسافر يوم', 'Leaving on')}</span><input name="date" type="date" required></label>
						<label class="f"><span>${L('راجعين يوم', 'Back on')}</span><input name="until" type="date"></label>
					</div>
					<p class="nt-form__nights" id="nt-nights" aria-live="polite"></p>
					<div class="f"><span>${L('مين جاي؟', 'Who’s coming?')}</span><div class="chips nt-who">${people(s).map((p) => `<label class="chip nt-chip"><input type="checkbox" name="who" value="${esc(p.id)}" checked> ${doodle(p.kid ? 'baby' : 'heart', 14)} ${esc(p.name)}</label>`).join('')}</div></div>
					<label class="f"><span>${L('الشنطة (كل حاجة في سطر)', 'The bag (one per line)')}</span><textarea name="pack" rows="3" dir="auto"></textarea></label>
					<div class="nt-sugg" data-for="pack">${sug.pack.map((t) => `<button class="chip" type="button">+ ${esc(t)}</button>`).join('')}</div>
					<label class="f"><span>${L('هنعمل إيه هناك؟ (كل فكرة في سطر)', 'What we’ll do there (one per line)')}</span><textarea name="ideas" rows="3" dir="auto"></textarea></label>
					<div class="nt-sugg" data-for="ideas">${sug.ideas.map((t) => `<button class="chip" type="button">+ ${esc(t)}</button>`).join('')}</div>
					<label class="f"><span>${L('كلمة عن الرحلة (اختياري)', 'A word about it (optional)')}</span><input name="note" dir="auto" maxlength="140"></label>
					<p class="form-msg" id="nt-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${doodle('plane', 18)} ${Y('احجزها', 'احجزيها', 'Book it')}</button></div>
				</form>
			</details>
			<div class="nt-board" id="nt-board"><p class="empty">${L('بنجهز الشنط…', 'Packing…')}</p></div>
		</div></section>`;
	},

	async after(main, s, root = main) {
		const board = $('#nt-board', root);
		let data = await live.load(KIND).catch(() => ({ items: [] }));
		let cur = null, timer = 0;
		const items = () => data.items || [];
		const save = async (fn) => { data = await live.save(KIND, fn); paint(); };
		const edit = (id, fn) => save((d) => { const x = (d.items || []).find((y) => y.id === id); if (x) fn(x); });

		const tick = () => {
			const el = $('.nt-count', board);
			if (!el || !el.isConnected) { clearInterval(timer); return; }
			const ms = Math.max(0, startOf(el.dataset.at) - Date.now());
			const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
			$('[data-u="d"]', el).textContent = num(d);
			$('[data-u="d"]', el).nextElementSibling.textContent = daysWord(d);
			$('[data-u="h"]', el).textContent = num(h);
			$('[data-u="m"]', el).textContent = num(m);
		};

		function paint() {
			const next = upcoming(items()), past = been(items());
			if (!next.some((x) => x.id === cur)) cur = next[0]?.id || null;
			const top = next.find((x) => x.id === cur);
			board.innerHTML = `${top ? pass(top, s) + plan(top) : `<div class="nt-none">${doodle('suitcase', 54)}<p>${L('لسه مفيش رحلة جاية… احجزوا واحدة ♥', 'No trip booked yet… book one ♥')}</p></div>`}
				${next.length > 1 ? `<p class="nt-k">${L('رحلات تانية بنخططلها', 'Other trips we’re planning')}</p><ol class="nt-tix">${next.map((x) => `<li><button class="nt-tix__one${x.id === cur ? ' is-on' : ''}" type="button" data-cur="${esc(x.id)}"><b dir="auto">${esc(x.where)}</b><small>${esc(longDate(x.date))}</small><em>${daysTo(x.date) > 0 ? L(`بعد ${num(daysTo(x.date))} ${daysWord(daysTo(x.date))}`, `in ${daysTo(x.date)} days`) : L('دلوقتي', 'now')}</em></button></li>`).join('')}</ol>` : ''}
				${past.length ? `<p class="nt-k">${L('رحلات خططناها ورحناها', 'Trips we planned and took')}</p><ol class="nt-tix nt-tix--past">${past.map((x) => `<li><div class="nt-tix__one"><b dir="auto">${esc(x.where)}</b><small>${esc(longDate(x.date))}</small><span class="nt-tix__stamp">${L('رحناها', 'Been')}</span>${x.gov ? `<a class="link" href="atlas.html#${esc(x.gov)}">${L('على أطلسنا', 'In our atlas')}</a>` : ''}${live.canWrite() ? `<button class="link" type="button" data-undone="${esc(x.id)}">${L('لسه', 'Not yet')}</button>` : ''}</div></li>`).join('')}</ol>` : ''}`;
			// the little map on the stub
			const tiles = $('.nt-pass__tiles', board);
			if (tiles && top) { const at = capital(top.gov); try { fit(tiles, [at], { zoom: 9, maxZ: 10, minZ: 6, center: at, pad: 10 }); } catch {} }
			clearInterval(timer);
			if ($('.nt-count', board)) { tick(); timer = setInterval(tick, 30e3); }
		}

		board.addEventListener('click', async (e) => {
			const t = e.target.closest('[data-cur]');
			if (t) { cur = t.dataset.cur; paint(); $('.nt-pass', board)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
			const done = e.target.closest('[data-done]'), undone = e.target.closest('[data-undone]'), del = e.target.closest('[data-del]');
			try {
				if (done) await edit(done.dataset.done, (x) => { x.done = live.today(); });
				if (undone) await edit(undone.dataset.undone, (x) => { x.done = undefined; });
				if (del && confirm(L('نمسح الرحلة دي؟', 'Delete this trip?'))) await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
			} catch (err) { alert(live.why(err)); }
		});
		// the bag, ticked by either of us
		board.addEventListener('change', async (e) => {
			const b = e.target.closest('[data-pack]');
			if (!b || !cur) return;
			b.closest('li')?.classList.toggle('is-on', b.checked);
			try { await edit(cur, (x) => { const set = new Set((x.packed || []).map(Number)); b.checked ? set.add(+b.dataset.pack) : set.delete(+b.dataset.pack); x.packed = [...set].sort((a, c) => a - c); }); } catch (err) { alert(live.why(err)); }
		});
		// one more thing for the bag, or one more idea
		board.addEventListener('submit', async (e) => {
			const f = e.target.closest('[data-add]');
			if (!f || !cur) return;
			e.preventDefault();
			const v = f.t.value.trim();
			if (!v) return;
			try { await edit(cur, (x) => { x[f.dataset.add] = [...lines(x[f.dataset.add]), v].join('\n'); }); } catch (err) { alert(live.why(err)); }
		});

		// the booking form
		const form = $('#nt-form', root);
		if (form) {
			const msg = $('#nt-msg', root), nightsEl = $('#nt-nights', root);
			const count = () => {
				const n = nights(form.date.value, form.until.value), d = form.date.value ? daysTo(form.date.value) : null;
				nightsEl.textContent = [d != null && d >= 0 ? L(`فاضل ${num(d)} ${daysWord(d)}`, `${d} days to go`) : '', n ? L(`${num(n)} ${plural(n, 'ليلة', 'ليلتين', 'ليالي', 'ليلة')}`, `${n} night${n === 1 ? '' : 's'}`) : ''].filter(Boolean).join(' · ');
			};
			form.addEventListener('input', (e) => { if (e.target.name === 'date' || e.target.name === 'until') count(); });
			// an idea tapped in goes on its own line
			for (const box of $$('.nt-sugg', root)) box.addEventListener('click', (e) => {
				const b = e.target.closest('button');
				if (!b) return;
				const ta = form[box.dataset.for], t = b.textContent.replace(/^\+\s*/, '');
				if (!lines(ta.value).includes(t)) ta.value = [...lines(ta.value), t].join('\n');
				b.classList.add('is-on');
			});
			form.onsubmit = async (e) => {
				e.preventDefault();
				if (form.until.value && form.until.value < form.date.value) { msg.textContent = L('يوم الرجوع لازم يبقى بعد يوم السفر', 'Back on must be after leaving'); return; }
				const x = { id: live.newId(), where: form.where.value.trim(), gov: form.gov.value || undefined, date: form.date.value, until: form.until.value || undefined, who: $$('[name="who"]:checked', form).map((c) => c.value), pack: form.pack.value.trim() || undefined, ideas: form.ideas.value.trim() || undefined, note: form.note.value.trim() || undefined, by: live.me(), at: Date.now() };
				if (!x.where || !x.date) return;
				try {
					await save((d) => { (d.items = d.items || []).push(x); });
					cur = x.id;
					paint();
					form.reset();
					$$('.nt-sugg .is-on', root).forEach((b) => b.classList.remove('is-on'));
					count();
					msg.textContent = L('اتحجزت ✈', 'Booked ✈');
					form.closest('dialog')?.close?.();
					board.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} catch (err) { msg.textContent = live.why(err); }
			};
		}
		paint();
		return { repaint: paint };
	}
};
