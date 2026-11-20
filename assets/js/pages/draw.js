import { L, Y, T, t, esc, pageHead, related, App, $, $$, qs, longDate, DRAW_KINDS, REDUCE, parseDate, daysBetween, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { openSketch } from '../sketch.js';
import { setupNote } from './journal.js';
import { initOf } from '../defaults.js';
import { shrinkPhoto } from './trips.js';

/* Tonight's draw, all on one page: a tab for every kind of night (outfit, dinner out, delivery, a film, a game, something
   sweet, a day out, something with the boys). The tab picks the wheel, our list for it and the nights we've logged; the
   address keeps ?k= so a link (or the menu) still opens straight on a tab. */

const init = () => initOf('draw');
const COLORS = ['#0e6990', '#f2726f', '#e39b2d', '#5a9e6f', '#8e5bd1', '#c2185b', '#13789f', '#f59a7b'];

export default {
	title: { ar: 'قرعة الليلة', en: 'Tonight’s draw' },
	render() {
		const k = DRAW_KINDS.find((x) => x.id === qs('k')) || DRAW_KINDS[0];
		const ok = live.canWrite();
		return `
			${pageHead(L('قرعة الليلة', 'Tonight’s draw'), Y('مش عارفين نعمل إيه الليلة؟ اختار نوع السهرة وسيبها للعجلة', 'مش عارفين نعمل إيه الليلة؟ اختاري نوع السهرة وسيبيها للعجلة', 'Can’t decide what to do tonight? Pick the kind of night and let the wheel choose'), [{ href: 'draw.html', ar: 'قرعة الليلة', en: 'Tonight’s draw' }], [['dice', 'نصيبنا', 'Luck'], ['heart', 'الليلة', 'Tonight'], ['popcorn', 'سهرة', 'A night in'], ['sparkle', 'سوا', 'Together']])}
			<div class="wrap">
				<div class="dr-tabs" role="tablist" aria-label="${L('نوع السهرة', 'Kind of night')}">${DRAW_KINDS.map((x) => `
					<button class="dr-tab${x === k ? ' is-on' : ''}" type="button" role="tab" id="dr-tab-${x.id}" aria-controls="dr-panel" aria-selected="${x === k}" tabindex="${x === k ? 0 : -1}" data-k="${x.id}" style="--c:${x.color}">
						<span class="dr-tab__e" aria-hidden="true">${doodle(x.emoji, 30)}</span><b>${esc(L(x.ar, x.en))}</b><small data-count="${x.id}"></small>
					</button>`).join('')}
				</div>
			</div>
			<section class="sec sec--top dr-panel" id="dr-panel" role="tabpanel" aria-labelledby="dr-tab-${k.id}" style="--c:${k.color}"><div class="wrap">
				<header class="dr-head">
					<span class="dr-head__e" id="dr-emoji" aria-hidden="true">${doodle(k.emoji, 44)}</span>
					<div><h2 id="dr-title">${esc(L(k.ar, k.en))}</h2><p id="dr-sub">${esc(L(k.dar, k.den))}</p></div>
				</header>
				<div class="draw">
					<div class="wheel-box">
						<div class="wheel" id="wheel"><span class="wheel__pin" aria-hidden="true"></span><div class="wheel__disc" id="wheel-disc"></div><button class="wheel__hub" type="button" id="spin">${Y('لف', 'لفّي', 'Spin')}</button></div>
						<label class="check"><input type="checkbox" id="fresh" checked> ${L('من غير اللي عملناه آخر أسبوعين', 'Skip what we did in the last two weeks')}</label>
					</div>
					<div class="result" id="result" hidden aria-live="polite"></div>
				</div>
				${ok ? '' : `<div class="narrow" style="margin:24px auto 0">${setupNote()}</div>`}
				<div class="draw-cols">
					<section class="panel">
						<h2>${L('القايمة بتاعتنا', 'Our list')} <small class="dr-n" id="dr-n"></small></h2>
						<ul class="pool" id="pool"></ul>
						<form class="add" id="add" autocomplete="off"${ok ? '' : ' hidden'}>
							<input name="item" dir="auto" maxlength="80" placeholder="${Y('ضيف اختيار…', 'ضيفي اختيار…', 'Add an option…')}" required>
							<button class="btn btn--sm" type="submit">${Y('ضيف', 'ضيفي', 'Add')}</button>
						</form>
						<label class="btn btn--sm btn--ghost pool-photos"${ok ? '' : ' hidden'}>${doodle('camera', 18)} ${Y('ضيف بالصور', 'ضيفي بالصور', 'Add with photos')}<input type="file" id="add-photos" accept="image/*" multiple hidden></label>
						<p class="form-msg" id="add-msg" role="status"></p>
					</section>
					<section class="panel">
						<h2>${L('عملناها قبل كده', 'We’ve done these')}</h2>
						<div class="nights nights--col" id="dr-history"></div>
					</section>
				</div>
			</div></section>
			${related(['movies', 'food', 'games'])}`;
	},

	async after(main, s) {
		let k = DRAW_KINDS.find((x) => x.id === qs('k')) || DRAW_KINDS[0];
		let data = await live.load('draw', init);
		const fill = () => { data.lists = { ...init().lists, ...(data.lists || {}) }; data.history = data.history || []; };
		fill();
		const name = (w) => T(w === 'him' ? s.him : s.her);
		const label = (x) => t(x.text);
		const panel = $('#dr-panel', main);

		const night = (h) => {
			const kk = DRAW_KINDS.find((x) => x.id === h.kind) || DRAW_KINDS[0];
			return `<article class="night" style="--c:${kk.color}">
				<span class="night__e" aria-hidden="true">${doodle(kk.emoji, 30)}</span>
				<div><b dir="auto">${esc(h.text)}</b><small>${longDate(h.date)} · ${esc(L(kk.ar, kk.en))}${h.by ? ` · ${name(h.by)}` : ''}</small>
				${h.hearts ? `<span class="hearts-row" aria-label="${h.hearts}/5">${'♥'.repeat(h.hearts)}<i>${'♥'.repeat(5 - h.hearts)}</i></span>` : ''}
				${h.note ? `<p dir="auto">${esc(h.note)}</p>` : ''}</div>
				${h.sketch ? `<img class="zoom" data-sketch="${esc(h.sketch)}" alt="${esc(h.text)}">` : live.canWrite() ? `<button type="button" class="link" data-sketch-for="${esc(h.id)}">${doodle('pencil', 16)} ${Y('ارسمها', 'ارسميها', 'Sketch it')}</button>` : ''}
			</article>`;
		};
		const paintHistory = () => {
			const box = $('#dr-history', main);
			const list = data.history.filter((h) => h.kind === k.id).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.at - a.at);
			box.innerHTML = list.length ? list.map(night).join('') : `<p class="empty">${Y('لسه مفيش ليالي متسجلة هنا — لف العجلة وسجّل أول ليلة ♥', 'لسه مفيش ليالي متسجلة هنا — لفّي العجلة وسجّلي أول ليلة ♥', 'No nights logged here yet — spin the wheel and log the first ♥')}</p>`;
			live.hydrateSketches(box);
			$$('[data-count]', main).forEach((el) => {
				const n = data.history.filter((h) => h.kind === el.dataset.count).length, o = (data.lists[el.dataset.count] || []).length;
				el.textContent = n ? L(`${num(n)} ليلة`, `${n} night${n === 1 ? '' : 's'}`) : L(`${num(o)} اختيار`, `${o} option${o === 1 ? '' : 's'}`);
			});
		};

		/* sketch an old night */
		main.addEventListener('click', async (e) => {
			const b = e.target.closest('[data-sketch-for]');
			if (!b) return;
			const h = data.history.find((x) => x.id === b.dataset.sketchFor);
			const kk = DRAW_KINDS.find((x) => x.id === h?.kind);
			const blob = await openSketch({ title: h?.text, hint: kk ? t(kk.sketch) : '' });
			if (!blob) return;
			b.disabled = true;
			try {
				const id = await live.putSketch(blob);
				data = await live.save('draw', (d) => { const x = (d.history || []).find((y) => y.id === h.id); if (x) x.sketch = id; }, init);
				fill();
				paintHistory();
			} catch (err) { alert(live.why(err)); b.disabled = false; }
		});

		/* the list */
		const pool = $('#pool', main);
		const paintPool = () => {
			const items = data.lists[k.id] || [];
			$('#dr-n', main).textContent = items.length ? `(${num(items.length)})` : '';
			pool.innerHTML = items.length ? items.map((x) => `<li${x.img ? ' class="has-img"' : ''}>${x.img ? `<img class="pool__img zoom" data-sketch="${esc(x.img)}" alt="${esc(label(x))}">` : ''}<span dir="auto">${esc(label(x))}</span>${live.canWrite() ? `<button type="button" aria-label="${Y('شيل', 'شيلي', 'Remove')} ${esc(label(x))}" data-rm="${esc(x.id)}">✕</button>` : ''}</li>`).join('') : `<li class="empty">${Y('القايمة فاضية — ضيف اختيارات', 'القايمة فاضية — ضيفي اختيارات', 'The list is empty — add some options')}</li>`;
			live.hydrateSketches(pool);
			paintWheel();
		};
		pool.onclick = async (e) => {
			const b = e.target.closest('[data-rm]');
			if (!b) return;
			try { data = await live.save('draw', (d) => { d.lists = d.lists || init().lists; d.lists[k.id] = (d.lists[k.id] || init().lists[k.id] || []).filter((x) => x.id !== b.dataset.rm); }, init); fill(); paintPool(); paintHistory(); }
			catch (err) { alert(live.why(err)); }
		};
		$('#add', main).onsubmit = async (e) => {
			e.preventDefault();
			const text = e.target.item.value.trim();
			if (!text) return;
			try {
				data = await live.save('draw', (d) => { d.lists = d.lists || init().lists; (d.lists[k.id] = d.lists[k.id] || init().lists[k.id] || []).push({ id: live.newId(), text, by: live.me(), at: Date.now() }); }, init);
				fill();
				e.target.reset();
				paintPool(); paintHistory();
			} catch (err) { alert(live.why(err)); }
		};

		/* several photos at once: each becomes an option of its own, its picture encrypted on the phone like every photo here */
		$('#add-photos', main).onchange = async (e) => {
			const files = [...e.target.files];
			if (!files.length) return;
			const msg = $('#add-msg', main);
			const typed = $('#add', main).item.value.trim();
			try {
				const have = (data.lists[k.id] || []).filter((x) => x.img).length;
				const added = [];
				for (const [n, file] of files.entries()) {
					msg.textContent = L(`بنحفظ ${n + 1} من ${files.length}…`, `Saving ${n + 1} of ${files.length}…`);
					const img = await live.putSketch(await shrinkPhoto(file, 1200));
					const text = files.length === 1 && typed ? typed : `${k.id === 'outfit' ? L('طقم', 'Outfit') : L('اختيار', 'Option')} ${have + n + 1}`;
					added.push({ id: live.newId(), text, img, by: live.me(), at: Date.now() });
				}
				data = await live.save('draw', (d) => { d.lists = d.lists || init().lists; (d.lists[k.id] = d.lists[k.id] || init().lists[k.id] || []).push(...added); }, init);
				fill();
				e.target.value = '';
				$('#add', main).reset();
				msg.textContent = L(`اتضاف ${added.length} ♥`, `Added ${added.length} ♥`);
				paintPool(); paintHistory();
			} catch (err) { msg.textContent = live.why(err); }
		};

		/* the wheel: what's on it is the list, minus what we did lately (if that leaves anything) */
		const fresh = $('#fresh', main);
		const disc = $('#wheel-disc', main);
		let onWheel = [];
		let rot = 0;
		const candidates = () => {
			const all = data.lists[k.id] || [];
			if (!fresh.checked) return all;
			const recent = new Set(data.history.filter((h) => h.kind === k.id && daysBetween(parseDate(h.date)) < 14).map((h) => h.text));
			const left = all.filter((x) => !recent.has(label(x)));
			return left.length ? left : all;
		};
		function paintWheel() {
			onWheel = candidates();
			const n = onWheel.length;
			if (!n) { disc.innerHTML = ''; return; }
			const seg = 360 / n;
			const R = 150;
			const pt = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [R + r * Math.cos(a), R + r * Math.sin(a)]; };
			const max = n > 14 ? 13 : 16;
			const short = (s) => ([...s].length > max ? [...s].slice(0, max - 1).join('') + '…' : s);
			disc.innerHTML = `<svg viewBox="0 0 300 300" aria-hidden="true" style="direction:ltr">${onWheel.map((x, i) => {
				const a0 = i * seg, a1 = (i + 1) * seg;
				const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
				const path = n === 1 ? `<circle cx="${R}" cy="${R}" r="${R}" fill="${COLORS[0]}"/>` : `<path d="M${R} ${R}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${COLORS[i % COLORS.length]}"/>`;
				const mid = a0 + seg / 2;
				return `${path}<g transform="rotate(${(mid - 90).toFixed(2)} ${R} ${R})"><text x="${R + R - 14}" y="${R}" text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="${n > 16 ? 8.5 : n > 10 ? 10 : 13}" font-weight="700">${esc(short(label(x)))}</text></g>`;
			}).join('')}<circle cx="${R}" cy="${R}" r="${R - 2}" fill="none" stroke="#fff" stroke-width="4"/></svg>`;
		}
		fresh.onchange = paintWheel;

		/* the tabs: switch the wheel, the list and the nights without leaving the page */
		const tabs = $$('.dr-tab', main);
		// the chosen tab in the middle of the strip (only the strip scrolls, never the page)
		const strip = $('.dr-tabs', main);
		const centre = (smooth) => { const on = $('.dr-tab.is-on', strip); if (!on) return; const d = on.getBoundingClientRect().left + on.offsetWidth / 2 - (strip.getBoundingClientRect().left + strip.clientWidth / 2); strip.scrollBy({ left: d, behavior: smooth && !REDUCE ? 'smooth' : 'auto' }); };
		const pick = (id, focus) => {
			const nk = DRAW_KINDS.find((x) => x.id === id);
			if (!nk) return;
			k = nk;
			for (const b of tabs) { const on = b.dataset.k === k.id; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); }
			panel.style.setProperty('--c', k.color);
			panel.setAttribute('aria-labelledby', `dr-tab-${k.id}`);
			$('#dr-emoji', main).innerHTML = doodle(k.emoji, 44);
			$('#dr-title', main).textContent = L(k.ar, k.en);
			$('#dr-sub', main).textContent = L(k.dar, k.den);
			$('#result', main).hidden = true;
			$('#spin', main).disabled = false;
			disc.style.transition = 'none';
			rot = 0;
			disc.style.transform = '';
			panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
			history.replaceState(history.state, '', `draw.html?k=${k.id}`);
			centre(true);
			paintPool();
			paintHistory();
		};
		$('.dr-tabs', main).addEventListener('click', (e) => { const b = e.target.closest('.dr-tab'); if (b) pick(b.dataset.k); });
		$('.dr-tabs', main).addEventListener('keydown', (e) => {
			const i = tabs.findIndex((b) => b.dataset.k === k.id), rtl = document.dir === 'rtl';
			const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
			if (step) { e.preventDefault(); pick(tabs[(i + step + tabs.length) % tabs.length].dataset.k, true); }
			else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); pick(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.k, true); }
		});
		paintPool();
		paintHistory();
		centre(false);

		const result = $('#result', main);
		let pendingSketch = null;
		$('#spin', main).onclick = () => {
			if (!onWheel.length) return;
			const n = onWheel.length;
			const i = Math.floor(Math.random() * n);
			const seg = 360 / n;
			// land the middle of segment i (with a little wobble) under the pin at the top
			const target = -((i + 0.5) * seg + (Math.random() - 0.5) * seg * 0.6);
			rot += 360 * 6 + ((((target - rot) % 360) + 360) % 360);
			$('#spin', main).disabled = true;
			result.hidden = true;
			const was = k.id;
			disc.style.transition = REDUCE ? 'none' : 'transform 4.2s cubic-bezier(.15,.9,.2,1)';
			disc.style.transform = `rotate(${rot}deg)`;
			setTimeout(() => { if (k.id === was) show(onWheel[i]); }, REDUCE ? 50 : 4300);
		};

		function show(x) {
			$('#spin', main).disabled = false;
			navigator.vibrate?.([30, 60, 30]);
			pendingSketch = null;
			const ok = live.canWrite();
			const kk = k;
			result.innerHTML = `
				<small>${L('الليلة دي', 'Tonight it’s')}</small>
				<b class="result__pick" dir="auto">${doodle(kk.emoji, 40)} ${esc(label(x))}</b>
				${x.img ? `<img class="result__img zoom" data-sketch="${esc(x.img)}" alt="${esc(label(x))}">` : ''}
				<div class="result__sketch" id="res-sketch"></div>
				${ok ? `<form id="log" class="result__log">
					<label class="f"><span>${L('حاجة عايزين نفتكرها؟', 'Anything to remember?')}</span><input name="note" dir="auto" maxlength="200"></label>
					<fieldset class="rate"><legend>${Y('قيّم الليلة', 'قيّمي الليلة', 'Rate the night')}</legend>${[5, 4, 3, 2, 1].map((h) => `<input type="radio" name="hearts" id="h${h}" value="${h}"><label for="h${h}" title="${h}">♥</label>`).join('')}</fieldset>
					<p class="form-msg" id="log-msg" role="status"></p>
				</form>` : ''}
				<div class="result__acts">
					<button type="button" class="btn btn--ghost" id="again">${doodle('refresh', 18)} ${Y('لف تاني', 'لفّي تاني', 'Spin again')}</button>
					<button type="button" class="btn btn--ghost" id="res-draw">${doodle('pencil', 18)} ${esc(t(kk.sketch))}</button>
					${ok ? `<button type="button" class="btn btn--coral" id="res-log">${Y('عملناها ♥ سجّلها', 'عملناها ♥ سجّليها', 'We did it ♥ Log it')}</button>` : ''}
				</div>`;
			live.hydrateSketches(result);
			result.hidden = false;
			result.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
			$('#again', result).onclick = () => $('#spin', main).click();
			$('#res-draw', result).onclick = async () => {
				const blob = await openSketch({ title: label(x), hint: t(kk.sketch) });
				if (blob) { pendingSketch = blob; $('#res-sketch', result).innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`; }
			};
			const logBtn = $('#res-log', result);
			if (logBtn) logBtn.onclick = async () => {
				const form = $('#log', result);
				const msg = $('#log-msg', result);
				logBtn.disabled = true;
				msg.textContent = L('بنسجل…', 'Logging…');
				try {
					const sketch = pendingSketch ? await live.putSketch(pendingSketch) : undefined;
					const entry = { id: live.newId(), kind: kk.id, text: label(x), date: live.today(), by: live.me(), note: form.note.value.trim() || undefined, hearts: +(form.hearts.value || 0) || undefined, sketch, at: Date.now() };
					data = await live.save('draw', (d) => { (d.history = d.history || []).push(entry); }, init);
					fill();
					msg.textContent = L('اتسجلت في ليالينا ♥', 'Logged in our nights ♥');
					paintHistory();
					paintWheel();
				} catch (err) { msg.textContent = live.why(err); logBtn.disabled = false; }
			};
		}
	}
};
