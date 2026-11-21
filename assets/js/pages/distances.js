import { L, Y, T, esc, pageHead, related, App, $, $$, num, img, hydrate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { fit, km, where, here } from '../tilemap.js';

/* How far apart the four of us are, on a night map: after Shaw's «Airport Distance Map» pen on CodePen, a dark map
   with an arc flying between two of us and the distance in big numbers. Each phone says where it is with «I'm here
   now» (and can say the boys are with it); the spots go in the shared list content/live/where.bin, so the other phone
   sees them once what's new has been sent across, like everything else we write. Only the last spot is kept. */

/** The four of us: the family members from story.json, the grown-ups first. */
function people(s) {
	const ms = s.family?.members || [];
	const grown = ms.filter((m) => !m.kid);
	return ms.map((m) => ({ ...m, who: m === grown[0] ? 'him' : m === grown[1] ? 'her' : '' }));
}
const meIn = (ps) => ps.find((p) => p.who && p.who === live.me());

function ago(t) {
	if (!t) return '';
	const m = Math.round((Date.now() - t) / 60000);
	if (m < 2) return L('دلوقتي', 'just now');
	if (m < 60) return L(`من ${num(m)} دقيقة`, `${m} min ago`);
	const h = Math.round(m / 60);
	if (h < 24) return L(`من ${num(h)} ساعة`, `${h} h ago`);
	const d = Math.round(h / 24);
	return L(`من ${num(d)} ${d === 1 ? 'يوم' : d === 2 ? 'يومين' : 'أيام'}`, `${d} day${d === 1 ? '' : 's'} ago`);
}
function dist(k) {
	if (k < 0.15) return L('جنب بعض', 'side by side');
	if (k < 1) return L(`${num(Math.round(k * 1000 / 10) * 10)} متر`, `${Math.round(k * 1000 / 10) * 10} m`);
	return L(`${num(k < 10 ? +k.toFixed(1) : Math.round(k))} كم`, `${k < 10 ? k.toFixed(1) : Math.round(k).toLocaleString('en')} km`);
}
/* a little sense of the number */
function feel(k) {
	if (k < 0.15) return L('مسافة حضن ♥', 'a hug away ♥');
	if (k < 2) return L(`حوالي ${num(Math.max(1, Math.round(k * 12)))} دقيقة مشي`, `about ${Math.max(1, Math.round(k * 12))} minutes’ walk`);
	if (k < 400) return L(`حوالي ${num(Math.max(5, Math.round((k / 45) * 60 / 5) * 5))} دقيقة بالعربية`, `about ${Math.max(5, Math.round((k / 45) * 60 / 5) * 5)} minutes by car`);
	return L(`حوالي ${num(Math.round(k / 800 * 10) / 10)} ساعة بالطيارة`, `about ${(Math.round(k / 800 * 10) / 10)} hours by plane`);
}

/* The farthest we have ever been from each other (story.json "farthest"): two of us on a fixed night map, one at home
   and the other at one or more spots far away, an arc to each, and the longest one in big numbers. */
/** The «farthest we have ever been» map, as HTML (distances.js and a moment page both show it). */
export function farthestMap(s) {
	if (!s.farthest) return '';
	return `<h2 class="sec-title" dir="auto">${esc(App.t(s.farthest.title))}</h2>
	<p class="dm-hint" dir="auto" style="margin:0 auto 18px;max-width:640px">${esc(App.t(s.farthest.text))}</p>
	<div class="dm dm--far" id="dm-far" style="direction:ltr">
		<div class="dm__map" aria-hidden="true"></div>
		<svg class="dm__arcs" aria-hidden="true"></svg>
		<div class="dm__marks"></div>
		<div class="dm__read">
			<p class="dm__pair" id="far-pair" dir="auto"></p>
			<p class="dm__km" id="far-km"></p>
			<p class="dm__feel" id="far-feel" dir="auto"></p>
		</div>
		<p class="dm__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>
	</div>`;
}

/** Draw it once it is on the page. */
export function drawFarthest(main, s) { farthest(main, s, people(s), curve); }

function farthest(main, s, ps, curve) {
	const f = s.farthest, box = $('#dm-far', main);
	if (!f || !box) return;
	const person = (w) => ps.find((p) => p.who === w) || { name: w === 'her' ? s.her : s.him, color: '#0e6990' };
	const home = { p: person(f.home.who), at: where(f.home), place: f.home.place };
	const away = f.away.map((a) => ({ p: person(a.who), at: where(a), place: a.place }));
	const far = away.map((a) => ({ ...a, k: km(home.at, a.at) })).sort((x, y) => y.k - x.k);
	const marks = $('.dm__marks', box), arcs = $('.dm__arcs', box);
	const mark = (m, small) => `<div class="dm__mark${small ? ' dm__mark--spot' : ''}" style="--c:${esc(m.p.color || '#0e6990')}">
		${small ? '<span class="dm__dot"></span>' : `<span class="dm__face">${face(m.p)}</span>`}<span class="dm__name"><b dir="auto">${esc(small ? App.t(m.place) : App.t(m.p.name))}</b>${small ? '' : `<small dir="auto">${esc(App.t(m.place))}</small>`}</span></div>`;
	marks.innerHTML = mark(home) + far.map((m, i) => mark(m, i > 0)).join('');
	hydrate(marks);
	$('#far-pair', main).textContent = `${App.t(home.p.name)} ↔ ${App.t(far[0].p.name)}`;
	$('#far-km', main).textContent = dist(far[0].k);
	$('#far-feel', main).textContent = App.t(f.when);
	const draw = () => {
		const view = fit($('.dm__map', box), [home.at, ...far.map((a) => a.at)], { pad: 80, padTop: 150, zoom: 5 });
		arcs.setAttribute('viewBox', `0 0 ${view.W} ${view.H}`);
		const els = $$('.dm__mark', marks), all = [home, ...far];
		all.forEach((m, i) => { const xy = view.at(m.at); els[i].style.left = `${xy.x}px`; els[i].style.top = `${xy.y}px`; });
		const A = view.at(home.at);
		arcs.innerHTML = far.map((m, i) => {
			const { d, mid } = curve(A, view.at(m.at));
			return `<g class="dm__arc${i ? '' : ' is-on'}"><path class="dm__trail" d="${d}"/><path class="dm__dash" d="${d}"/>${!i && !REDUCE ? `<circle class="dm__plane" r="5"><animateMotion dur="3.2s" repeatCount="indefinite" path="${d}"/></circle>` : ''}${i ? '' : `<text x="${mid.x.toFixed(1)}" y="${(mid.y - 8).toFixed(1)}" text-anchor="middle">${esc(dist(m.k))}</text>`}</g>`;
		}).join('');
	};
	draw();
	let w = box.clientWidth;
	new ResizeObserver(() => { if (box.isConnected && Math.abs(box.clientWidth - w) > 30) { w = box.clientWidth; draw(); } }).observe(box);
}

/* an arc that always bows upwards, like a flight */
const curve = (a, b) => {
	const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
	const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - Math.min(120, len * 0.3) };
	return { d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, mid: { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 } };
};

const face = (p) => (p.photo ? img(p.photo, '', 'dm__img') : `<span class="dm__emoji">${doodle(p.emoji || 'heart', 30)}</span>`);

export default {
	title: { ar: 'المسافات', en: 'Miles apart' },
	render(s) {
		const ps = people(s);
		const ok = live.canWrite();
		return `
		${pageHead(L('المسافات', 'Miles apart'), L('إحنا الأربعة بعاد عن بعض قد إيه — وأقرب ما يكون في القلب', 'How far apart the four of us are — and as close as ever at heart'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: 'distances.html', ar: 'المسافات', en: 'Miles apart' }], [['pin', 'إنت فين؟', 'Where are you?'], ['plane', 'بعيد', 'Far'], ['heart', 'قريب', 'Close'], ['family', 'إحنا الأربعة', 'The four of us']])}
		<section class="sec sec--top"><div class="wrap">
			<div class="dm" id="dm" style="direction:ltr">
				<div class="dm__map" aria-hidden="true"></div>
				<svg class="dm__arcs" aria-hidden="true"></svg>
				<div class="dm__marks"></div>
				<div class="dm__read" aria-live="polite">
					<p class="dm__pair" id="dm-pair" dir="auto"></p>
					<p class="dm__km" id="dm-km"></p>
					<p class="dm__feel" id="dm-feel" dir="auto"></p>
				</div>
				<p class="dm__credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>
			</div>
			<p class="dm-hint">${Y('دوس على اتنين مننا عشان تشوف المسافة بينهم', 'دوسي على اتنين مننا عشان تشوفي المسافة بينهم', 'Tap two of us to see how far apart they are')}</p>
			${ok ? `<div class="dm-tools">
				<button class="btn btn--coral" type="button" id="dm-here">${doodle('pin', 20)} ${L('أنا هنا دلوقتي', 'I’m here now')}</button>
				${ps.filter((p) => !p.who).map((p) => `<button class="btn btn--sm btn--ghost" type="button" data-with="${esc(p.id)}">${esc(App.t(p.name))} ${L('معايا', 'is with me')}</button>`).join('')}
			</div>
			<p class="form-msg dm-msg" id="dm-msg" role="status"></p>` : `<div class="narrow" style="margin:16px auto 0">${setupNote()}</div>`}
			<ul class="dm-list" id="dm-list"></ul>
			<p class="dm-note">${doodle('lock', 18)} ${Y('مكانك بيفضل على الموبايل ده بس، لحد ما تبعت الجديد من الإعدادات — ساعتها الموبايل التاني يشوفه. بنحفظ آخر مكان بس.', 'مكانك بيفضل على الموبايل ده بس، لحد ما تبعتي الجديد من الإعدادات — ساعتها الموبايل التاني يشوفه. بنحفظ آخر مكان بس.', 'Your spot stays on this phone until you send what’s new from Settings — then the other phone sees it. Only the last spot is kept.')}</p>
		</div></section>
		${s.farthest ? `<section class="sec"><div class="wrap">${farthestMap(s)}</div></section>` : ''}
		${related(['family', 'anniversaries', 'places'])}`;
	},

	async after(main, s) {
		const ps = people(s);
		const box = $('#dm', main), mapEl = $('.dm__map', box), arcs = $('.dm__arcs', box), marks = $('.dm__marks', box);
		let data = { people: {} };
		let pick = [];
		let view = null;

		const spot = (p) => where(data.people?.[p.id]);
		const placed = () => ps.filter(spot);
		const pairs = () => { const l = placed(), out = []; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) out.push([l[i], l[j], km(spot(l[i]), spot(l[j]))]); return out; };

		marks.innerHTML = ps.map((p) => `<button class="dm__mark" type="button" data-p="${esc(p.id)}" style="--c:${esc(p.color || '#0e6990')}" hidden>
			<span class="dm__face">${face(p)}</span><span class="dm__name"><b>${esc(App.t(p.name))}</b><small></small></span></button>`).join('');
		hydrate(marks);



		function layout() {
			const l = placed();
			view = fit(mapEl, l.map(spot), { pad: 70, padTop: 120, zoom: l.length === 1 ? 13 : 6, center: { lat: 30.0444, lng: 31.2357 } });
			arcs.setAttribute('viewBox', `0 0 ${view.W} ${view.H}`);
			// people at the same spot stand side by side instead of on top of one another
			const at = new Map();
			for (const p of ps) {
				const el = $(`[data-p="${CSS.escape(p.id)}"]`, marks);
				const sp = spot(p);
				el.hidden = !sp;
				if (!sp) continue;
				const xy = view.at(sp);
				const key = `${Math.round(xy.x / 30)}:${Math.round(xy.y / 30)}`;
				const n = at.get(key) || 0;
				at.set(key, n + 1);
				el.style.left = `${xy.x + n * 46}px`;
				el.style.top = `${xy.y}px`;
				el.dataset.x = xy.x; el.dataset.y = xy.y;
				$('small', el).textContent = ago(data.people[p.id].t);
			}
			paint();
		}

		function paint() {
			const all = pairs();
			const chosen = pick.length === 2 ? all.find(([a, b]) => pick.includes(a.id) && pick.includes(b.id)) : null;
			const shown = chosen || all.slice().sort((x, y) => y[2] - x[2])[0];
			arcs.innerHTML = view ? all.map(([a, b, k]) => {
				const A = view.at(spot(a)), B = view.at(spot(b));
				if (Math.hypot(A.x - B.x, A.y - B.y) < 8) return '';
				const { d, mid } = curve(A, B);
				const on = shown && a === shown[0] && b === shown[1];
				return `<g class="dm__arc${on ? ' is-on' : ''}"><path class="dm__trail" d="${d}"/><path class="dm__dash" d="${d}"/>${on && !REDUCE ? `<circle class="dm__plane" r="5"><animateMotion dur="2.6s" repeatCount="indefinite" path="${d}"/></circle>` : ''}<text x="${mid.x.toFixed(1)}" y="${(mid.y - 8).toFixed(1)}" text-anchor="middle">${esc(dist(k))}</text></g>`;
			}).join('') : '';
			for (const el of $$('.dm__mark', marks)) el.classList.toggle('is-picked', pick.includes(el.dataset.p));
			const pair = $('#dm-pair', main), kmEl = $('#dm-km', main), fl = $('#dm-feel', main);
			if (!placed().length) {
				pair.textContent = L('لسه محدش قال هو فين', 'Nobody has said where they are yet');
				kmEl.textContent = '?';
				fl.textContent = live.canWrite() ? Y('دوس «أنا هنا دلوقتي» تحت', 'دوسي «أنا هنا دلوقتي» تحت', 'Tap “I’m here now” below') : '';
			} else if (!shown) {
				const p = placed()[0];
				pair.textContent = `${App.t(p.name)} ${L('بس اللي على الخريطة', 'is the only one on the map')}`;
				kmEl.textContent = '♥';
				fl.textContent = L('مستنيين الباقيين', 'waiting for the others');
			} else {
				const together = all.every(([, , k]) => k < 0.15) && placed().length === ps.length;
				pair.textContent = together ? L('إحنا الأربعة', 'All four of us') : `${App.t(shown[0].name)} ↔ ${App.t(shown[1].name)}`;
				kmEl.textContent = together ? L('في البيت', 'at home') : dist(shown[2]);
				fl.textContent = together ? L('مع بعض ♥', 'together ♥') : feel(shown[2]);
			}
			$('#dm-list', main).innerHTML = all.length ? all.sort((x, y) => x[2] - y[2]).map(([a, b, k]) => `<li><button type="button" data-pair="${esc(a.id)}|${esc(b.id)}"${shown && a === shown[0] && b === shown[1] ? ' class="is-on"' : ''}><b>${esc(App.t(a.name))} ↔ ${esc(App.t(b.name))}</b><span>${esc(dist(k))}</span><small>${esc(feel(k))}</small></button></li>`).join('') : '';
		}

		marks.onclick = (e) => {
			const m = e.target.closest('[data-p]');
			if (!m) return;
			const id = m.dataset.p;
			pick = pick.includes(id) ? pick.filter((x) => x !== id) : [...pick.slice(-1), id];
			paint();
		};
		$('#dm-list', main).onclick = (e) => { const b = e.target.closest('[data-pair]'); if (b) { pick = b.dataset.pair.split('|'); paint(); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } };

		const msg = $('#dm-msg', main);
		const put = async (ids, label) => {
			if (!ids.length) { msg.textContent = Y('اختار مين ماسك الموبايل من الإعدادات الأول', 'اختاري مين ماسك الموبايل من الإعدادات الأول', 'Choose whose phone this is in Settings first'); return; }
			msg.textContent = Y('بندور عليك…', 'بندور عليكي…', 'Finding you…');
			try {
				const at = await here();
				data = await live.save('where', (d) => { d.people = d.people || {}; for (const id of ids) d.people[id] = { at: `${at.lat}, ${at.lng}`, acc: at.acc, t: Date.now(), by: live.me() }; });
				msg.textContent = label;
				pick = [];
				layout();
			} catch (err) {
				msg.textContent = err.message === 'denied' ? Y('الموبايل رفض يقول المكان — اسمح للموقع بالـ Location من إعدادات المتصفح', 'الموبايل رفض يقول المكان — اسمحي للموقع بالـ Location من إعدادات المتصفح', 'The phone wouldn’t share its location — allow Location for this site in the browser settings')
					: err.code ? live.why(err) : Y('معرفناش نلاقي المكان، جرّب تاني برا البيت أو مع GPS', 'معرفناش نلاقي المكان، جرّبي تاني برا البيت أو مع GPS', 'Couldn’t find the spot — try again with GPS on');
			}
		};
		const meBtn = $('#dm-here', main);
		if (meBtn) meBtn.onclick = () => { const me = meIn(ps); put(me ? [me.id] : [], L('اتحط مكانك على الخريطة ♥', 'You’re on the map ♥')); };
		for (const b of $$('[data-with]', main)) b.onclick = () => {
			const me = meIn(ps), kid = ps.find((p) => p.id === b.dataset.with);
			put(me ? [me.id, kid.id] : [], L(`${App.t(kid.name)} معاك على الخريطة ♥`, `${App.t(kid.name)} is with you on the map ♥`));
		};

		farthest(main, s, ps, curve);

		data = await live.load('where');
		data.people ||= {};
		layout();
		let w = box.clientWidth;
		new ResizeObserver(() => { if (box.isConnected && Math.abs(box.clientWidth - w) > 30) { w = box.clientWidth; layout(); } }).observe(box);
	}
};
