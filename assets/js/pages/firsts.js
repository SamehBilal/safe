import { L, Y, esc, pageHead, related, App, $, $$, num, longDate, age } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* The boys' firsts: the first step, first word, first tooth, first day at school… each with its date, a line and a
   photo. Above the title little footprints walk along a dotted path, a flag going up for each first; below, a card for
   each boy (his age, how many firsts so far, the latest), the timeline split by year, and beside it a sticker sheet of
   the firsts every little one has — stuck on, with whose and when, once it happens; a dashed outline while it's still
   to come (tap one to write it down). */

/* [ar, en, emoji, words that mean the same first when it's written another way] */
const IDEAS = [
	['أول ضحكة', 'First laugh', '😄', ['ضحك', 'laugh']],
	['أول سنة', 'First tooth', '🦷', ['سنان', 'tooth']],
	['أول مرة يقعد', 'First time sitting up', '🪑', ['يقعد', 'sitting']],
	['أول حبو', 'First crawl', '🐢', ['حبو', 'crawl']],
	['أول خطوة', 'First step', '👣', ['خطوة', 'step']],
	['أول كلمة', 'First word', '💬', ['كلمة', 'word']],
	['قال بابا', 'Said “Baba”', '👨', ['بابا', 'baba']],
	['قال ماما', 'Said “Mama”', '👩', ['ماما', 'mama']],
	['أول يوم حضانة', 'First day at nursery', '🎒', ['حضانة', 'nursery']],
	['أول يوم مدرسة', 'First day at school', '🏫', ['مدرسة', 'school']],
	['أول عجلة', 'First bike ride', '🚲', ['عجلة', 'bike']],
	['أول مرة في البحر', 'First time at the sea', '🌊', ['بحر', 'sea']],
	['أول صلاة', 'First prayer', '🕌', ['صلاة', 'pray']],
	['أول مرة يصوم', 'First fast', '🌙', ['يصوم', 'صيام', 'fast']],
	['أول جايزة', 'First prize', '🏆', ['جايزة', 'prize']]
];
/* emojis for firsts that aren't on the sheet already */
const EMO = [[['سينما', 'cinema', 'movie'], '🎬'], [['مترو', 'metro'], '🚇'], [['ماتش', 'استاد', 'match', 'stadium'], '🏟️'], [['طيارة', 'plane', 'flight'], '✈️'], [['عيد', 'eid'], '🎉'], [['حلاق', 'شعر', 'haircut'], '💇'], [['سفر', 'رحلة', 'trip'], '🧳'], [['ملاهي', 'park'], '🎡'], [['عيد ميلاد', 'birthday'], '🎂']];
const ideaOf = (what) => { const w = String(what || '').trim().toLowerCase(); return IDEAS.findIndex(([ar, en, , keys]) => w === ar || w === en.toLowerCase() || keys.some((k) => w.includes(k))); };
const emojiOf = (what) => { const i = ideaOf(what); if (i >= 0) return IDEAS[i][2]; const w = String(what || '').toLowerCase(); return EMO.find(([ks]) => ks.some((k) => w.includes(k)))?.[1] || '⭐'; };
const KID_C = ['#e39b2d', '#5a9e6f', '#0e6990', '#c2185b'];
const tilt = (k) => ((k * 37) % 13) - 6;

export default {
	title: { ar: 'أول مرة', en: 'Firsts' },
	render(s) {
		const ok = live.canWrite();
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const opts = kids.map((k) => `<option value="${esc(k.id)}">${esc(App.t(k.name))}</option>`).join('');
		return `
		${pageHead(L('أول مرة', 'Firsts'), L('كل أول مرة للولاد، قبل ما ننساها', 'Every one of the boys’ firsts, before we forget'), [{ href: 'firsts.html', ar: 'أول مرة', en: 'Firsts' }], {
			band: `<div class="ft1-band" id="ft1-band"></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<div class="ft1-forms"${ok ? '' : ' hidden'}>
				<details class="composer reveal" id="ft1-add">
					<summary><span>${doodle('baby', 22)}</span> ${Y('ضيف أول مرة', 'ضيفي أول مرة', 'Add a first')}</summary>
					<form id="ft1-form" autocomplete="off">
						<div class="f-row">
							<label class="f"><span>${L('مين؟', 'Who?')}</span><select name="kid">${opts}</select></label>
							<label class="f f--grow"><span>${L('أول مرة إيه؟', 'First what?')}</span><input name="what" dir="auto" maxlength="60" required list="ft1-ideas"></label>
						</div>
						<datalist id="ft1-ideas">${IDEAS.map(([ar, en]) => `<option value="${esc(L(ar, en))}">`).join('')}</datalist>
						<div class="f-row">
							<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date" required></label>
							<label class="f f--grow"><span>${L('صورة (اختياري)', 'A photo (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
						</div>
						<label class="f"><span>${L('حصل إزاي؟', 'How did it happen?')}</span><textarea name="note" dir="auto" rows="2" maxlength="280"></textarea></label>
						<p class="form-msg" id="ft1-msg" role="status"></p>
						<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('افتكرها ♥', 'افتكريها ♥', 'Remember it ♥')}</button></div>
					</form>
				</details>
			</div>
			<div class="ft1-kids" id="ft1-kids" role="toolbar" aria-label="${L('مين', 'Who')}"></div>
			<div class="ft1-layout">
				<ol class="ft1-line" id="ft1-line"></ol>
				<aside class="ft1-sheet" id="ft1-sheet" aria-label="${L('لوحة الاستيكرات', 'The sticker sheet')}"></aside>
			</div>
		</div></section>
		${related(['family', 'growth', 'capsule'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const kidOf = (id) => kids.find((k) => k.id === id);
		const color = (id) => kidOf(id)?.color || KID_C[Math.max(0, kids.findIndex((k) => k.id === id)) % KID_C.length];
		const nameOf = (id) => App.t(kidOf(id)?.name || '');
		let data = await live.load('firsts');
		let who = '';
		const mine = (x) => x.by === live.me() && live.canWrite();
		const save = async (fn) => { data = await live.save('firsts', fn); paint(); };

		const paint = () => {
			const every = (data.items || []).filter((x) => x.type !== 'height');
			const firsts = every.filter((x) => !who || x.kid === who).sort((a, b) => String(b.date).localeCompare(String(a.date)));
			/* the band: footprints along a dotted path, a flag for each of the latest firsts */
			const flags = (firsts.length ? firsts.slice(0, 5).map((x) => x.what) : IDEAS.slice(4, 9).map(([ar, en]) => L(ar, en))).reverse();
			const steps = 16;
			const at = (i) => { const t = i / (steps - 1); return [60 + t * 880, 120 + Math.sin(t * Math.PI * 2) * 34]; };
			const mirror = App.lang === 'ar';
			$('#ft1-band', main).innerHTML = `<svg class="ft1-svg" viewBox="0 0 1000 220" aria-hidden="true"${mirror ? ' style="transform:scaleX(-1)"' : ''}>
				<path class="ft1-path" d="M40 120${Array.from({ length: 40 }, (_, i) => { const t = (i + 1) / 40; return ` L${(40 + t * 920).toFixed(1)} ${(120 + Math.sin(t * Math.PI * 2) * 34).toFixed(1)}`; }).join('')}"/>
				${Array.from({ length: steps }, (_, i) => {
					const [x, y] = at(i), [x2, y2] = at(Math.min(steps - 1, i + 1)), ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 90, side = i % 2 ? 9 : -9;
					return `<g class="ft1-foot" style="--i:${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)}) translate(${side} 0)">
						<ellipse rx="7" ry="11"/><circle cx="-5" cy="-14" r="2.2"/><circle cx="-1.5" cy="-16" r="2.4"/><circle cx="2.5" cy="-15.5" r="2.2"/><circle cx="5.5" cy="-13" r="1.9"/></g>`;
				}).join('')}
				${flags.map((f, j) => { const i = Math.round(((j + 1) / (flags.length + 1)) * (steps - 1)); const [x, y] = at(i); return `<g class="ft1-flag" style="--i:${i}" transform="translate(${x.toFixed(1)} ${(y - 26).toFixed(1)})"><path class="ft1-flag__pole" d="M0 0V-56"/><g transform="translate(0 -56)${mirror ? ' scale(-1 1)' : ''}"><rect class="ft1-flag__bg" x="2" y="-2" width="${Math.max(54, [...f].length * 9)}" height="24" rx="3"/><text x="${2 + Math.max(54, [...f].length * 9) / 2}" y="15" text-anchor="middle">${esc(f)}</text></g></g>`; }).join('')}
			</svg>`;

			/* a card for each boy, which is also the filter */
			const of = (id) => every.filter((x) => x.kid === id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
			$('#ft1-kids', main).innerHTML = `<button class="ft1-kid ft1-kid--all${who ? '' : ' is-on'}" type="button" data-kid="" aria-pressed="${!who}">
					<span class="ft1-kid__em">👣</span><b>${L('الكل', 'All')}</b>
					<span class="ft1-kid__n"><i>${num(every.length)}</i> ${L('أول مرة', every.length === 1 ? 'first' : 'firsts')}</span>
				</button>` + kids.map((k) => {
				const fs = of(k.id), last = fs[0];
				return `<button class="ft1-kid${who === k.id ? ' is-on' : ''}" type="button" data-kid="${esc(k.id)}" aria-pressed="${who === k.id}" style="--c:${color(k.id)}">
					<span class="ft1-kid__em">${esc(k.emoji || '🧸')}</span>
					<b>${esc(App.t(k.name))}</b>${k.born ? `<small>${esc(age(k.born))}</small>` : ''}
					<span class="ft1-kid__n"><i>${num(fs.length)}</i> ${L('أول مرة', fs.length === 1 ? 'first' : 'firsts')}</span>
					<span class="ft1-kid__last" dir="auto">${last ? `${L('آخرها:', 'Latest:')} ${esc(last.what)}` : L('مستنيين أول «أول مرة» ليه ♥', 'Waiting for his first “first” ♥')}</span>
				</button>`;
			}).join('');

			/* the timeline, a ribbon for each year */
			let yr = '';
			$('#ft1-line', main).innerHTML = firsts.map((x) => {
				const y = String(x.date).slice(0, 4), rib = y !== yr ? `<li class="ft1-year" aria-hidden="true"><span>${num(+y)}</span></li>` : '';
				yr = y;
				const k = kidOf(x.kid);
				return `${rib}
				<li class="ft1-item reveal is-in" data-id="${esc(x.id)}" style="--c:${color(x.kid)}">
					<span class="ft1-item__dot" aria-hidden="true">${emojiOf(x.what)}</span>
					<article class="ft1-card">
						${(x.photos?.length ? x.photos : x.photo ? [x.photo] : []).map((p, i) => `<img class="zoom${i ? ' ft1-more' : ''}" data-sketch="${esc(p)}" alt="" loading="lazy">`).join('')}
						<p class="ft1-card__k">${esc(nameOf(x.kid))}${k?.born ? ` <span class="ft1-card__age">${L('وعنده', 'at')} ${esc(age(k.born, new Date(x.date)))}</span>` : ''}</p>
						<h3 dir="auto">${esc(x.what)}</h3>
						<p class="ft1-card__d">${esc(longDate(x.date))}</p>
						${x.note ? `<p class="ft1-card__note" dir="auto">${esc(x.note)}</p>` : ''}
						${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}
					</article>
				</li>`;
			}).join('') || `<li class="empty">${L('أول «أول مرة» هتتكتب هنا ♥', 'The first “first” goes here ♥')}</li>`;
			live.hydrateSketches($('#ft1-line', main));

			/* the sticker sheet: each first once, stuck on when it happens (with whose and the year) */
			const done = new Map();
			for (const x of [...firsts].reverse()) { const i = ideaOf(x.what), key = i >= 0 ? `i${i}` : `w${x.what}`; if (!done.has(key)) done.set(key, []); done.get(key).push(x); }
			const extra = [...done.entries()].filter(([key]) => key[0] === 'w').map(([, xs]) => xs);
			const total = IDEAS.length + extra.length, got = IDEAS.filter((_, i) => done.has(`i${i}`)).length + extra.length;
			const stick = (label, em, xs, k) => {
				const x = xs?.[0];
				if (x) {
					const names = [...new Set(xs.map((y) => nameOf(y.kid)))].join(' · ');
					return `<button class="ft1-stk is-done" type="button" data-go="${esc(x.id)}" style="--c:${color(x.kid)};--r:${tilt(k)}deg" title="${esc(longDate(x.date))}"><span class="ft1-stk__em">${em}</span><b dir="auto">${esc(label)}</b><small>${esc(names)} · ${num(+String(x.date).slice(0, 4))}</small></button>`;
				}
				return `<button class="ft1-stk" type="button" data-idea="${esc(label)}" style="--r:${tilt(k)}deg"${live.canWrite() ? '' : ' disabled'}><span class="ft1-stk__em">${em}</span><b dir="auto">${esc(label)}</b><small>${L('لسه جاية', 'still to come')}</small></button>`;
			};
			$('#ft1-sheet', main).innerHTML = `<div class="ft1-sheet__in">
				<h3>${L('لوحة الاستيكرات', 'The sticker sheet')}</h3>
				<p class="ft1-sheet__sub">${L(`${num(got)} من ${num(total)} اتلزقوا`, `${got} of ${total} stuck on`)}</p>
				<div class="ft1-sheet__bar" aria-hidden="true"><i style="width:${Math.round((got / total) * 100)}%"></i></div>
				<div class="ft1-stks">${[...extra.map((xs, k) => stick(xs[0].what, emojiOf(xs[0].what), xs, k)), ...IDEAS.map(([ar, en, em], i) => stick(L(ar, en), em, done.get(`i${i}`), i + extra.length))].join('')}</div>
				${live.canWrite() ? `<p class="ft1-sheet__hint">${Y('دوس على استيكر لسه متلزقش علشان تكتبه', 'دوسي على استيكر لسه متلزقش علشان تكتبيه', 'Tap a sticker that isn’t on yet to write it down')}</p>` : ''}
			</div>`;
		};

		$('#ft1-kids', main).addEventListener('click', (e) => { const c = e.target.closest('[data-kid]'); if (!c) return; who = c.dataset.kid; paint(); });
		$('#ft1-sheet', main).addEventListener('click', (e) => {
			const go = e.target.closest('[data-go]'), add = e.target.closest('[data-idea]');
			if (go) {
				const card = $(`#ft1-line [data-id="${CSS.escape(go.dataset.go)}"]`, main);
				if (!card) return;
				card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
				card.classList.remove('is-flash'); void card.offsetWidth; card.classList.add('is-flash');
			} else if (add && live.canWrite()) {
				$('#ft1-add', main).open = true;
				const f = $('#ft1-form', main);
				f.what.value = add.dataset.idea;
				if (who) f.kid.value = who;
			}
		});
		$('.sec', main).addEventListener('click', async (e) => {
			const del = e.target.closest('[data-del]');
			if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) try { await save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); }); } catch (err) { alert(live.why(err)); }
		});
		const f = $('#ft1-form', main);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#ft1-msg', main);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const photo = f.photo.files[0] ? await live.putSketch(await shrinkPhoto(f.photo.files[0], 1000)) : undefined;
				await save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'first', kid: f.kid.value, what: f.what.value.trim(), date: f.date.value, note: f.note.value.trim() || undefined, photo, by: live.me(), at: Date.now() }); });
				f.reset(); msg.textContent = L('اتحفظت ♥', 'Saved ♥');
			} catch (err) { msg.textContent = live.why(err); }
		};
		paint();
	}
};
