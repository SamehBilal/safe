import { L, Y, esc, pageHead, related, App, $, $$, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';
import { ideasSection, ideasAfter } from './giftideas.js';

/* Our gifts: every gift given, to each other and to the boys and the family, for which occasion, with a photo; then
   what's next — «نفسي في…», the wishes each of us writes (and picks who sees), and each phone's secret gift ideas
   (giftideas.js, the page that used to be «أفكار هدايا»). Above the title a gift box keeps popping its lid open, a tag with one of our gifts
   floating up out of it each time. */

const OCCS = [['birthday', 'عيد ميلاد', 'Birthday', 'cake'], ['anniversary', 'عيد جواز', 'Anniversary', 'ring'], ['eid', 'رمضان والعيد', 'Ramadan & Eid', 'moon'], ['valentine', 'عيد الحب', 'Valentine’s', 'heart'], ['mother', 'عيد الأم', 'Mother’s Day', 'love'], ['none', 'من غير مناسبة', 'Just because', 'gift']];
const occOf = (id) => OCCS.find((o) => o[0] === id) || OCCS[5];
const TAGS = ['#f9a3a8', '#ffd66b', '#b9e08a', '#8fd1ef', '#d6b4f0'];

export default {
	title: { ar: 'هدايانا', en: 'Our gifts' },
	render(s) {
		const ok = live.canWrite();
		const names = [App.t(s.him), App.t(s.her), ...(s.family?.members || []).filter((m) => m.kid).map((m) => App.t(m.name))];
		return `
		${pageHead(L('هدايانا', 'Our gifts'), L('كل هدية جبناها، لمين، وفي أنهي مناسبة — واللي نفسنا فيه، وأفكار سرية للجاية', 'Every gift we gave, to whom, and for what — what we’d love, and secret ideas for the next'), [{ href: 'gifts.html', ar: 'هدايانا', en: 'Our gifts' }], {
			band: `<div class="gf-band" id="gf-band">
				<div class="gf-box" aria-hidden="true">
					<svg viewBox="0 0 200 200" class="gf-svg">
						<path class="gf-ink gf-shadow" d="M38 96h132v92H38Z"/>
						<path class="gf-ink" d="M32 90h136v92H32Z" fill="#f2726f"/>
						<path class="gf-ink" d="M90 90h20v92H90Z" fill="#ffd66b"/>
						<g class="gf-lid"><path class="gf-ink" d="M24 66h152v28H24Z" fill="#f48f8c"/><path class="gf-ink" d="M88 66h24v28H88Z" fill="#ffd66b"/>
							<path class="gf-ink" d="M100 66c-14-26-46-26-40-6 4 12 26 8 40 6Zm0 0c14-26 46-26 40-6-4 12-26 8-40 6Z" fill="#ffd66b"/></g>
					</svg>
					<span class="gf-tag" id="gf-tag"><i></i><b></b></span>
					${Array.from({ length: 10 }, (_, i) => `<span class="gf-bit" style="--a:${-150 + i * 13}deg;--c:${TAGS[i % TAGS.length]};--d:${0.05 * i}s"></span>`).join('')}
				</div>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:0 auto 30px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('gift', 22)}</span> ${Y('ضيف هدية', 'ضيفي هدية', 'Add a gift')}</summary>
				<form id="gf-form" autocomplete="off">
					<label class="f"><span>${L('الهدية', 'The gift')}</span><input name="what" dir="auto" maxlength="80" required></label>
					<div class="f-row">
						<label class="f f--grow"><span>${L('من مين؟', 'From whom?')}</span><input name="from" dir="auto" maxlength="40" list="gf-names" value="${esc(live.me() === 'her' ? App.t(s.her) : live.me() === 'him' ? App.t(s.him) : '')}"></label>
						<label class="f f--grow"><span>${L('لمين؟', 'For whom?')}</span><input name="to" dir="auto" maxlength="40" list="gf-names" required></label>
					</div>
					<datalist id="gf-names">${names.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
					<div class="f-row">
						<label class="f"><span>${L('المناسبة', 'Occasion')}</span><select name="occ">${OCCS.map(([id, ar, en]) => `<option value="${id}">${esc(L(ar, en))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date"></label>
						<label class="f f--grow"><span>${L('صورة (اختياري)', 'A photo (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
					</div>
					<label class="f"><span>${L('كلمة عنها (اختياري)', 'A word about it (optional)')}</span><input name="note" dir="auto" maxlength="140"></label>
					<p class="form-msg" id="gf-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظها ♥', 'احفظيها ♥', 'Keep it ♥')}</button></div>
				</form>
			</details>
			<div class="toolbar">
				<div class="chips" id="gf-occ" role="toolbar" aria-label="${L('المناسبة', 'Occasion')}"><button class="chip is-on" type="button" data-occ="">${L('الكل', 'All')}</button>${OCCS.map(([id, ar, en]) => `<button class="chip" type="button" data-occ="${id}">${esc(L(ar, en))}</button>`).join('')}</div>
				<select class="search" id="gf-to" aria-label="${L('لمين', 'For whom')}"><option value="">${L('لكل الناس', 'For everyone')}</option></select>
			</div>
			<div class="gf-tags" id="gf-list"></div>
			${ideasSection(s)}
		</div></section>
		${related(['birthday', 'calendar', 'nokta', 'wishes'])}`;
	},

	async after(main, s) {
		let data = await live.load('gifts');
		let occ = '', to = '', sharedIdeas = [], gi = null;
		const mine = (x) => x.by === live.me() && live.canWrite();
		const save = async (fn) => { data = await live.save('gifts', fn); paint(); };
		let timer = 0, k = 0;
		this.leave = () => clearInterval(timer);

		const paint = () => {
			const gifts = (data.items || []).filter((x) => !x.idea).sort((a, b) => String(b.date || b.at).localeCompare(String(a.date || a.at)));
			const ideas = (data.items || []).filter((x) => x.idea);
			/* the box: a tag with one of our gifts floats up each time it pops open */
			clearInterval(timer);
			const lines = gifts.length ? gifts.slice(0, 8).map((g) => [g.what, g.to]) : [[L('هدية', 'A gift'), L('لحد بنحبه', 'for someone we love')]];
			const box = $('.gf-box', main), tag = $('#gf-tag', main);
			const pop = () => {
				if (document.hidden) return;
				const [what, who] = lines[k++ % lines.length];
				tag.querySelector('b').textContent = what;
				tag.querySelector('i').textContent = who ? L(`لـ${who}`, `for ${who}`) : '';
				tag.style.setProperty('--c', TAGS[k % TAGS.length]);
				box.classList.remove('is-open'); void box.offsetWidth; box.classList.add('is-open');
			};
			pop();
			timer = setInterval(pop, 4200);

			/* who has had gifts */
			const sel = $('#gf-to', main), keep = sel.value;
			sel.innerHTML = `<option value="">${L('لكل الناس', 'For everyone')}</option>` + [...new Set(gifts.map((g) => g.to).filter(Boolean))].map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
			sel.value = keep;
			const shown = gifts.filter((g) => (!occ || g.occ === occ) && (!to || g.to === to));
			$('#gf-list', main).innerHTML = shown.map((g, i) => {
				const o = occOf(g.occ);
				return `<article class="gf-card reveal is-in" style="--c:${TAGS[i % TAGS.length]};--r:${[-2.5, 1.5, -1, 2.2][i % 4]}deg">
					<span class="gf-card__hole" aria-hidden="true"></span>
					${g.photo ? `<img data-sketch="${esc(g.photo)}" alt="" loading="lazy">` : `<span class="gf-card__ic" aria-hidden="true">${doodle(o[3], 30)}</span>`}
					<h3 dir="auto">${esc(g.what)}</h3>
					<p class="gf-card__who">${g.from ? `${esc(g.from)} ← ` : ''}<b>${esc(g.to || '')}</b></p>
					<p class="gf-card__occ">${esc(L(o[1], o[2]))}${g.date ? ` · ${esc(longDate(g.date))}` : ''}</p>
					${g.note ? `<p class="gf-card__note" dir="auto">${esc(g.note)}</p>` : ''}
					${mine(g) ? `<button class="link link--danger" type="button" data-del="${esc(g.id)}">${L('مسح', 'Delete')}</button>` : ''}
				</article>`;
			}).join('') || `<p class="empty">${gifts.length ? L('مفيش هدايا بالشكل ده', 'No gifts like that') : L('أول هدية هتتعلق هنا ♥', 'The first gift will hang here ♥')}</p>`;
			live.hydrateSketches($('#gf-list', main));
			// the old shared ideas (from before the secret ones) show among the ideas below
			sharedIdeas = ideas;
			gi?.repaint();
		};

		$('#gf-occ', main).addEventListener('click', (e) => { const c = e.target.closest('[data-occ]'); if (!c) return; occ = c.dataset.occ; $$('#gf-occ .chip', main).forEach((x) => x.classList.toggle('is-on', x === c)); paint(); });
		$('#gf-to', main).onchange = (e) => { to = e.target.value; paint(); };
		$('.sec', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]'), given = e.target.closest('[data-given]');
			try {
				if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
				if (given) await save((d) => { const g = (d.items || []).find((x) => x.id === given.dataset.given); if (g) { delete g.idea; g.date = live.today(); } });
			} catch (err) { alert(live.why(err)); }
		});
		const f = $('#gf-form', main);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gf-msg', main);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const photo = f.photo.files[0] ? await live.putSketch(await shrinkPhoto(f.photo.files[0], 1000)) : undefined;
				await save((d) => { (d.items = d.items || []).push({ id: live.newId(), what: f.what.value.trim(), from: f.from.value.trim() || undefined, to: f.to.value.trim(), occ: f.occ.value, date: f.date.value || live.today(), photo, note: f.note.value.trim() || undefined, by: live.me(), at: Date.now() }); });
				const fromV = f.from.value; f.reset(); f.from.value = fromV; msg.textContent = L('اتحفظت ♥', 'Kept ♥');
			} catch (err) { msg.textContent = live.why(err); }
		};
		paint();
		gi = await ideasAfter(main, s, () => sharedIdeas);
		if (location.hash === '#gi') $('#gi', main)?.scrollIntoView();
	}
};
