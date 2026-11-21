import { L, Y, esc, $, num, longDate } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { shrinkPhoto } from './trips.js';

/* Our recipes: what we cook together — ingredients, steps, a photo, and who makes it best — and every time we made it:
   the day, who cooked, for what (just us, the boys, guests…), how it turned out, and photos of us making it and eating
   it. Each card says how many times we've made it and when last, with the photos of those times as a little strip; the
   top of the page says how often we've cooked this month, what we make most, and what we haven't made in a while.
   Band: a pot on the stove with steam curling up, the latest dishes' names drifting off in the steam. */

const FOR = [['us', 'إحنا الاتنين', 'Just us'], ['family', 'إحنا والولاد', 'With the boys'], ['guests', 'عزومة', 'Guests'], ['occasion', 'مناسبة', 'An occasion']];
const forName = (k) => { const f = FOR.find((x) => x[0] === k); return f ? L(f[1], f[2]) : ''; };
/* what it is: something to eat, something sweet, or something to drink */
const KIND = [['dish', 'أكلة', 'A dish'], ['sweet', 'حلو', 'Something sweet'], ['drink', 'مشروب', 'A drink']];
const kindIcon = { dish: 'dinner', sweet: 'cake', drink: 'coffee' };
const madeOf = (x) => [...(x.made || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);

export default listPage({
	id: 'recipes', kind: 'recipes', icon: 'dinner',
	title: ['نطبخ إيه', 'Our recipes'], sub: ['الأكل والحلو والمشروبات اللي بنعملها سوا، ومين بيعملها أحسن — وكل مرة عملناها', 'The dishes, sweets and drinks we make together, who makes them best — and every time we made them'],
	add: ['ضيفوا أكلة', 'Add a recipe'],
	fields: [
		{ n: 'name', t: 'text', l: ['اسم الأكلة', 'Dish'], req: 1, grow: 1 },
		{ n: 'kind', t: 'sel', l: ['أكلة، حلو، ولا مشروب؟', 'A dish, a sweet or a drink?'], opts: KIND },
		{ n: 'best', t: 'sel', l: ['مين بيعملها أحسن؟', 'Who makes it best?'], opts: 'whoBoth' },
		{ n: 'time', t: 'text', l: ['بتاخد قد إيه؟', 'How long?'], ph: ['ساعة', 'An hour'] },
		{ n: 'ingredients', t: 'area', l: ['المكونات (كل حاجة في سطر)', 'Ingredients (one per line)'], rows: 4 },
		{ n: 'steps', t: 'area', l: ['الطريقة (كل خطوة في سطر)', 'Method (one step per line)'], rows: 5 },
		{ n: 'photo', t: 'photo', l: ['صورة الأكلة', 'A photo of it'], full: 1 }
	],
	// a dish, a sweet or a drink (the ones saved before there was a kind are dishes)
	chips: { n: 'kind', opts: KIND, def: 'dish' },
	// the ones we make most first, then by name
	sort: (a, b) => (b.made?.length || 0) - (a.made?.length || 0) || String(a.name).localeCompare(String(b.name), 'ar'),
	band: (items) => {
		const names = (items.length ? items.slice(-3).map((x) => x.name) : [L('محشي', 'Mahshi'), L('مكرونة بشاميل', 'Béchamel'), L('ملوخية', 'Molokhia')]);
		return `<div class="rc-band"><div class="rc-steam">${names.map((n, i) => `<span style="--i:${i}" dir="auto">${esc(shorten(n, 16))}</span>`).join('')}</div>
			<svg class="rc-pot" viewBox="0 0 220 150"><path class="rc-steamline" d="M80 40c-10-14 10-22 0-36M110 40c-10-14 10-22 0-36M140 40c-10-14 10-22 0-36"/><rect x="40" y="52" width="140" height="70" rx="14"/><rect x="28" y="46" width="164" height="12" rx="6"/><rect x="96" y="34" width="28" height="12" rx="6"/><path class="rc-handle" d="M40 70H18M180 70h22"/><path class="rc-fire" d="M70 140c-6-10 8-14 0-26 14 8 12 18 6 26ZM110 142c-8-12 10-18 0-32 18 10 14 22 8 32ZM150 140c-6-10 8-14 0-26 14 8 12 18 6 26Z"/></svg></div>`;
	},
	/* how we've been cooking: this month, all along, what we make most, and one we haven't made in a while */
	top: (items) => {
		const all = items.flatMap((x) => (x.made || []).map((m) => ({ ...m, dish: x })));
		if (!items.length) return '';
		const ym = new Date().toISOString().slice(0, 7);
		const month = all.filter((m) => String(m.date).startsWith(ym)).length;
		const most = [...items].sort((a, b) => (b.made?.length || 0) - (a.made?.length || 0))[0];
		const missed = items.filter((x) => x.made?.length).map((x) => ({ x, d: daysSince(madeOf(x)[0].date) })).sort((a, b) => b.d - a.d)[0];
		const last = all.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
		return `<div class="rc-stats">
			<span><b>${num(month)}</b>${L('مرة طبخنا الشهر ده', 'times cooked this month')}</span>
			<span><b>${num(all.length)}</b>${L('مرة طبخنا من الأول', 'times cooked in all')}</span>
			${most?.made?.length ? `<span><b class="rc-name" dir="auto">${esc(shorten(most.name, 22))}</b>${L(`أكتر أكلة بنعملها · ${num(most.made.length)} مرة`, `What we make most · ${most.made.length} times`)}</span>` : ''}
			${last ? `<span><b class="rc-name" dir="auto">${esc(shorten(last.dish.name, 22))}</b>${L(`آخر حاجة طبخناها · ${longDate(last.date)}`, `Last cooked · ${longDate(last.date)}`)}</span>` : ''}
			${missed && missed.d > 45 ? `<span class="is-miss"><b class="rc-name" dir="auto">${esc(shorten(missed.x.name, 22))}</b>${L(`وحشتنا — بقالنا ${num(missed.d)} يوم ما عملناهاش`, `Missed — ${missed.d} days since we made it`)}</span>` : ''}
		</div>`;
	},
	card: (x, c) => {
		const lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean);
		const made = madeOf(x);
		const pics = made.flatMap((m) => (m.photos || []).map((p) => ({ p, m })));
		return `<article class="lp-card rc-card" id="rc-${esc(x.id)}">
		${c.photo(x)}
		<p class="lp-k">${x.best ? `${L('أحسن واحد بيعملها:', 'Best made by:')} ${esc(c.whoName(x.best))}` : ''}${x.time ? ` · ${doodle('clock', 14)} ${esc(x.time)}` : ''}</p>
		<h3 dir="auto"><span class="rc-kind" aria-hidden="true">${doodle(kindIcon[x.kind || 'dish'], 20)}</span> ${esc(x.name)}</h3>
		<p class="rc-made">${made.length ? `${doodle('dinner', 16)} ${L(`عملناها ${num(made.length)} مرة · آخر مرة ${longDate(made[0].date)}`, `Made ${made.length} time${made.length === 1 ? '' : 's'} · last on ${longDate(made[0].date)}`)}` : L('لسه ما عملناهاش هنا', 'Not made here yet')}</p>
		${pics.length ? `<div class="rc-pics">${pics.slice(0, 6).map(({ p, m }, i) => `<img class="zoom" data-sketch="${esc(p)}" alt="${esc(longDate(m.date))}" loading="lazy" style="--r:${[-4, 3, -2, 4, -3, 2][i]}deg">`).join('')}${pics.length > 6 ? `<span>+${num(pics.length - 6)}</span>` : ''}</div>` : ''}
		${live.canWrite() ? `<button class="btn btn--sm btn--coral" type="button" data-rc-made="${esc(x.id)}">${doodle('dinner', 16)} ${Y('عملناها ♥ سجّل مرة', 'عملناها ♥ سجّلي مرة', 'We made it ♥ Log it')}</button>` : ''}
		${made.length ? `<details class="rc-times"><summary>${L('المرات اللي عملناها', 'The times we made it')} (${num(made.length)})</summary><ul>${made.map((m) => `<li>
			<b>${esc(longDate(m.date))}</b>${m.cook ? ` · ${L('طبخ', 'by')} ${esc(c.whoName(m.cook))}` : ''}${m.for ? ` · ${esc(forName(m.for))}` : ''}${m.hearts ? ` · <span class="rc-h">${'♥'.repeat(m.hearts)}</span>` : ''}
			${m.note ? `<p dir="auto">${esc(m.note)}</p>` : ''}
			${(m.photos || []).length ? `<span class="rc-tpics">${m.photos.map((p) => `<img class="zoom" data-sketch="${esc(p)}" alt="" loading="lazy">`).join('')}</span>` : ''}
			${live.canWrite() && m.by === live.me() ? `<button class="link link--danger" type="button" data-rc-unmade="${esc(x.id)}" data-m="${esc(m.id)}">${L('مسح', 'Delete')}</button>` : ''}
		</li>`).join('')}</ul></details>` : ''}
		${x.ingredients || x.steps ? `<details><summary>${L('المكونات والطريقة', 'Ingredients & method')}</summary>
			${lines(x.ingredients).length ? `<ul dir="auto">${lines(x.ingredients).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
			${lines(x.steps).length ? `<ol dir="auto">${lines(x.steps).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : ''}
		</details>` : ''}
		${c.del(x)}
	</article>`;
	},
	/* «we made it»: a window for the day, who cooked, for whom, how it turned out, and the photos */
	ready: (main, c) => {
		if (!live.canWrite()) return;
		const dlg = document.createElement('dialog');
		dlg.className = 'cmodal rc-modal';
		dlg.innerHTML = `<div class="cmodal__in"><header class="cmodal__hd"><h2>${doodle('dinner', 22)} <span id="rc-dish"></span></h2><button type="button" class="cmodal__x" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button></header>
			<form id="rc-form" autocomplete="off">
				<div class="f-row">
					<label class="f"><span>${L('إمتى؟', 'When?')}</span><input name="date" type="date" required></label>
					<label class="f"><span>${L('مين طبخ؟', 'Who cooked?')}</span><select name="cook"><option value="both">${L('إحنا الاتنين', 'Both of us')}</option><option value="him">${esc(c.whoName('him'))}</option><option value="her">${esc(c.whoName('her'))}</option></select></label>
					<label class="f"><span>${L('لمين؟', 'For whom?')}</span><select name="for">${FOR.map(([v, ar, en]) => `<option value="${v}">${esc(L(ar, en))}</option>`).join('')}</select></label>
				</div>
				<fieldset class="rate"><legend>${L('طلعت إزاي؟', 'How did it turn out?')}</legend>${[5, 4, 3, 2, 1].map((h) => `<input type="radio" name="hearts" id="rch${h}" value="${h}"><label for="rch${h}">♥</label>`).join('')}</fieldset>
				<label class="f"><span>${L('حاجة نفتكرها (اختياري)', 'Something to remember (optional)')}</span><textarea name="note" dir="auto" rows="2" maxlength="300" placeholder="${L('زودنا الشطة، فهد خلّص طبقه…', 'More chilli this time, Fahd cleared his plate…')}"></textarea></label>
				<label class="f"><span>${L('صور وإحنا بنعملها أو بناكلها (اختياري)', 'Photos of us making or eating it (optional)')}</span><input name="photos" type="file" accept="image/*" multiple></label>
				<p class="form-msg" id="rc-msg" role="status"></p>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('سجّلها ♥', 'سجّليها ♥', 'Log it ♥')}</button></div>
			</form></div>`;
		$('#lp-list', main).before(dlg);
		dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.cmodal__x')) dlg.close(); });
		const f = $('#rc-form', dlg);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#rc-msg', dlg);
			try {
				const id = dlg.dataset.id;
				const photos = [];
				const files = [...f.photos.files];
				for (const [n, file] of files.entries()) {
					msg.textContent = L(`بنحفظ الصورة ${num(n + 1)} من ${num(files.length)}…`, `Saving photo ${n + 1} of ${files.length}…`);
					photos.push(await live.putSketch(await shrinkPhoto(file, 1200)));
				}
				msg.textContent = L('بنحفظ…', 'Saving…');
				const m = { id: live.newId(), date: f.date.value || live.today(), cook: f.cook.value, for: f.for.value, by: live.me(), at: Date.now() };
				if (+f.hearts.value) m.hearts = +f.hearts.value;
				if (f.note.value.trim()) m.note = f.note.value.trim();
				if (photos.length) m.photos = photos;
				await c.save((d) => { const x = (d.items || []).find((y) => y.id === id); if (x) (x.made = x.made || []).push(m); });
				f.reset(); msg.textContent = '';
				dlg.close();
			} catch (err) { msg.textContent = live.why(err); }
		};
	},
	click: async (e, c) => {
		const b = e.target.closest('[data-rc-made]');
		if (b) {
			const x = (c.data().items || []).find((y) => y.id === b.dataset.rcMade);
			const dlg = $('.rc-modal');
			if (!x || !dlg) return;
			dlg.dataset.id = x.id;
			$('#rc-dish', dlg).textContent = x.name;
			const f = $('#rc-form', dlg);
			f.reset();
			f.date.value = live.today();
			f.date.max = live.today();
			if (live.me()) f.cook.value = live.me();
			dlg.showModal();
			return;
		}
		const un = e.target.closest('[data-rc-unmade]');
		if (un && confirm(Y('تمسح المرة دي؟', 'تمسحي المرة دي؟', 'Delete this time?'))) {
			try { await c.save((d) => { const x = (d.items || []).find((y) => y.id === un.dataset.rcUnmade); if (x) x.made = (x.made || []).filter((m) => m.id !== un.dataset.m); }); } catch (err) { alert(live.why(err)); }
		}
	},
	// the page around it (أكلنا) hears about the dishes each time they change, to chalk them on its board
	painted: (root, items) => root.dispatchEvent(new CustomEvent('rc-items', { detail: items, bubbles: true })),
	empty: ['أول أكلة تتكتب هنا ♥', 'The first recipe goes here ♥'],
	related: ['food', 'draw', 'hosting']
});
