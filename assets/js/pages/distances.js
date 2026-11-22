import { L, Y, esc, pageHead, related, App, $, $$, num, img, hydrate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { km, where, here } from '../tilemap.js';
import { P, paperSVG, frame, pct, EGYPT } from '../papermap.js';

/* How far apart the four of us are, drawn with a pen on paper — a shape map of Egypt and the lands around it
   (papermap.js), not a road map. On top two tabs: «الأقرب», where we are now (home, when the four of us are
   together), and «الأبعد», the farthest we have ever been — her in As Santah and him in Oman, summer 2016. Each phone
   says where it is with «I'm here now» (and can say the boys are with it); the spots go in the shared list
   content/live/where.bin, so the other phone sees them once what's new has been sent across. Only the last spot is
   kept. */

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

/* an arc that always bows upwards, like a flight */
const curve = (a, b) => {
	const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
	const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - len * 0.28 };
	return { d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, mid: { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 } };
};
const face = (p) => (p.photo ? img(p.photo, '', 'pm__img') : `<span class="pm__emoji">${doodle(p.emoji || 'heart', 26)}</span>`);
const pt = (spot) => P(spot.lat, spot.lng);
/* a fountain pen lying across the corner of the paper */
const PEN = `<svg class="pm__pen" viewBox="0 0 240 40" aria-hidden="true"><g transform="rotate(-24 120 20)"><rect x="40" y="12" width="150" height="16" rx="8" fill="#1f3a5f"/><rect x="150" y="10" width="44" height="20" rx="6" fill="#16304f"/><rect x="186" y="14" width="34" height="3" rx="1.5" fill="#d9a93c"/><path d="M40 13 L8 20 L40 27Z" fill="#d9a93c"/><path d="M8 20 L24 20" stroke="#6a4b10" stroke-width="1.2"/><circle cx="62" cy="20" r="2" fill="#d9a93c"/></g></svg>`;

/** A paper map's box: the drawing, the arcs, the pins, the pen and the reading. */
const paperBox = (id, f, read) => `<div class="pm" id="${id}" style="aspect-ratio:${(f.w / f.h).toFixed(3)};--r:${(f.w / f.h).toFixed(3)};direction:ltr">
	<div class="pm__paper">${paperSVG(f, { lang: App.lang, id })}</div>
	<svg class="pm__arcs" viewBox="${f.x.toFixed(0)} ${f.y.toFixed(0)} ${f.w.toFixed(0)} ${f.h.toFixed(0)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
	<div class="pm__marks"></div>
	${PEN}
	${read}
</div>`;
const arcSVG = (f, d, mid, label, on) => `<g class="pm__arc${on ? ' is-on' : ''}"><path class="pm__trail" d="${d}"/><path class="pm__dash" d="${d}"/>${on && !REDUCE ? `<g class="pm__plane"><path d="M0 -${(f.w / 70).toFixed(1)}L${(f.w / 160).toFixed(1)} 0 0 ${(f.w / 300).toFixed(1)} -${(f.w / 160).toFixed(1)} 0Z"/><animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto" path="${d}"/></g>` : ''}${label ? `<text x="${mid.x.toFixed(1)}" y="${(mid.y - f.w / 60).toFixed(1)}" text-anchor="middle" style="font-size:${(f.w / 30).toFixed(0)}px">${esc(label)}</text>` : ''}</g>`;

/* The farthest we have ever been from each other (story.json "farthest"): her at home and him at one or more spots far
   away, on the paper map from Egypt to Oman, a pen line to each, and the longest one in big numbers. */
function farData(s, ps) {
	const f = s.farthest;
	const person = (w) => ps.find((p) => p.who === w) || { name: w === 'her' ? s.her : s.him, color: '#0e6990' };
	const home = { p: person(f.home.who), at: where(f.home), place: f.home.place };
	const far = f.away.map((a) => ({ p: person(a.who), at: where(a), place: a.place })).map((a) => ({ ...a, k: km(home.at, a.at) })).sort((x, y) => y.k - x.k);
	return { home, far, frame: frame([home, ...far].map((m) => pt(m.at)), { pad: 0.2, ratio: [1.6, 2.4] }) };
}
/** The «farthest we have ever been» map, as HTML (distances.js and a moment page both show it). */
export function farthestMap(s) {
	if (!s.farthest) return '';
	const { frame: f } = farData(s, people(s));
	return `<h2 class="sec-title" dir="auto">${esc(App.t(s.farthest.title))}</h2>
	<p class="pm-hint" dir="auto">${esc(App.t(s.farthest.text))}</p>
	${paperBox('pm-far', f, `<div class="pm__read"><p class="pm__pair" id="far-pair" dir="auto"></p><p class="pm__km" id="far-km"></p><p class="pm__feel" id="far-feel" dir="auto"></p></div>`)}`;
}
/** Draw it once it is on the page. */
export function drawFarthest(main, s) {
	const box = $('#pm-far', main);
	if (!s.farthest || !box) return;
	const { home, far, frame: f } = farData(s, people(s));
	const mark = (m, small) => { const at = pct(f, pt(m.at)); return `<div class="pm__mark${small ? ' pm__mark--spot' : ''}" style="--c:${esc(m.p.color || '#0e6990')};left:${at.left};top:${at.top}">
		${small ? '<span class="pm__dot"></span>' : `<span class="pm__face">${face(m.p)}</span>`}<span class="pm__name"><b dir="auto">${esc(small ? App.t(m.place) : App.t(m.p.name))}</b>${small ? '' : `<small dir="auto">${esc(App.t(m.place))}</small>`}</span></div>`; };
	$('.pm__marks', box).innerHTML = mark(home) + far.map((m, i) => mark(m, i > 0)).join('');
	hydrate($('.pm__marks', box));
	const A = pt(home.at);
	$('.pm__arcs', box).innerHTML = far.map((m, i) => { const { d, mid } = curve(A, pt(m.at)); return arcSVG(f, d, mid, i ? '' : dist(m.k), !i); }).join('');
	$('#far-pair', main).textContent = `${App.t(home.p.name)} ↔ ${App.t(far[0].p.name)}`;
	$('#far-km', main).textContent = dist(far[0].k);
	$('#far-feel', main).textContent = App.t(s.farthest.when);
}

/* above the title: two tin-can phones, his and hers, with the string between them looping into a heart, and a paper
   plane flying along it from one to the other — however far apart, still on the line */
const cans = (s) => {
	const STR = 'M112 96C190 132 250 134 300 128C262 104 252 66 300 82C348 66 338 104 300 128C350 134 410 132 488 96';
	const can = (x, c, flip) => `<g transform="translate(${x} 96)${flip ? ' scale(-1 1)' : ''}"><path class="dt-can" d="M-46 -30 4 -20 4 20 -46 30Z" fill="${c}"/><ellipse class="dt-can" cx="4" cy="0" rx="7" ry="20" fill="#fbf6ea"/><path class="dt-can__band" d="M-32 -27v54M-18 -24.5v49"/></g>`;
	return `<div class="dt-band" aria-hidden="true"><svg viewBox="0 0 600 180" class="dt-band__svg">
		<path class="dt-string" id="dt-string" d="${STR}"/>
		${can(104, '#f2726f', true)}${can(496, '#0e6990', false)}
		${REDUCE ? '' : `<g class="dt-plane"><path d="M-11 -6 12 0-11 6-6 0Z"/><animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#dt-string"/></animateMotion></g>`}
		<text class="dt-band__name" x="76" y="158">${esc(App.t(s.him))}</text><text class="dt-band__name" x="524" y="158">${esc(App.t(s.her))}</text>
	</svg></div>`;
};

/* the house drawn on the «nearest» tab */
const HOUSE = '<svg class="dt-house" viewBox="0 0 48 44" aria-hidden="true"><path d="M5 22 24 5l19 17"/><path d="M10 18v22h28V18"/><path d="M20 40V28h8v12"/><path class="dt-house__heart" d="M24 24l-4-4a2.4 2.4 0 0 1 4-2.6 2.4 2.4 0 0 1 4 2.6z"/></svg>';

export default {
	title: { ar: 'المسافات', en: 'Miles apart' },
	render(s) {
		const ps = people(s);
		const ok = live.canWrite();
		const far = s.farthest ? farData(s, ps) : null;
		const tabs = `<div class="dt-tabs" role="tablist" aria-label="${L('أقرب وأبعد', 'Nearest and farthest')}">
			<button class="dt-tab dt-tab--near is-on" type="button" role="tab" data-tab="near" aria-selected="true" aria-controls="dt-near">
				${HOUSE}<small>${L('الأقرب', 'The nearest')}</small><b id="dt-near-km">♥</b><span id="dt-near-sub">${L('البيت — وإحنا الأربعة', 'Home — and the four of us')}</span>
			</button>
			${far ? `<button class="dt-tab dt-tab--far" type="button" role="tab" data-tab="far" aria-selected="false" aria-controls="dt-far">
				${doodle('plane', 40)}<small>${L('الأبعد', 'The farthest')}</small><b>${esc(dist(far.far[0].k))}</b><span dir="auto">${esc(App.t(far.far[0].place))} ↔ ${esc(App.t(far.home.place))} · ${esc(App.t(s.farthest.when).split('—')[0].trim())}</span>
			</button>` : ''}
		</div>`;
		return `
		${pageHead(L('المسافات', 'Miles apart'), L('إحنا الأربعة بعاد عن بعض قد إيه — وأقرب ما يكون في القلب', 'How far apart the four of us are — and as close as ever at heart'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: 'distances.html', ar: 'المسافات', en: 'Miles apart' }], { band: cans(s) })}
		<div class="wrap">${tabs}</div>
		<section class="sec sec--top dt-panel" id="dt-near" role="tabpanel"><div class="wrap">
			<div id="dm-box"></div>
			<p class="pm-hint">${Y('دوس على اتنين مننا عشان تشوف المسافة بينهم', 'دوسي على اتنين مننا عشان تشوفي المسافة بينهم', 'Tap two of us to see how far apart they are')}</p>
			${ok ? `<div class="dm-tools">
				<button class="btn btn--coral" type="button" id="dm-here">${doodle('pin', 20)} ${L('أنا هنا دلوقتي', 'I’m here now')}</button>
				${ps.filter((p) => !p.who).map((p) => `<button class="btn btn--sm btn--ghost" type="button" data-with="${esc(p.id)}">${esc(App.t(p.name))} ${L('معايا', 'is with me')}</button>`).join('')}
			</div>
			<p class="form-msg dm-msg" id="dm-msg" role="status"></p>` : `<div class="narrow" style="margin:16px auto 0">${setupNote()}</div>`}
			<ul class="dm-list" id="dm-list"></ul>
			<p class="dm-note">${doodle('lock', 18)} ${Y('مكانك بيفضل على الموبايل ده بس، لحد ما تبعت الجديد من الإعدادات — ساعتها الموبايل التاني يشوفه. بنحفظ آخر مكان بس.', 'مكانك بيفضل على الموبايل ده بس، لحد ما تبعتي الجديد من الإعدادات — ساعتها الموبايل التاني يشوفه. بنحفظ آخر مكان بس.', 'Your spot stays on this phone until you send what’s new from Settings — then the other phone sees it. Only the last spot is kept.')}</p>
		</div></section>
		${far ? `<section class="sec sec--top dt-panel" id="dt-far" role="tabpanel" hidden><div class="wrap">${farthestMap(s)}</div></section>` : ''}
		${related(['family', 'anniversaries', 'places'])}`;
	},

	async after(main, s) {
		const ps = people(s);
		let data = { people: {} };
		let pick = [];
		let f = EGYPT;

		/* الأقرب / الأبعد */
		const tab = (which) => {
			$$('.dt-tab', main).forEach((b) => { const on = b.dataset.tab === which; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
			$$('.dt-panel', main).forEach((p) => { p.hidden = p.id !== `dt-${which}`; });
			history.replaceState(history.state, '', which === 'far' ? '#far' : location.pathname + location.search);
		};
		$('.dt-tabs', main)?.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });
		if (location.hash === '#far' && $('#dt-far', main)) tab('far');
		drawFarthest(main, s);

		const spot = (p) => where(data.people?.[p.id]);
		const placed = () => ps.filter(spot);
		const pairs = () => { const l = placed(), out = []; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) out.push([l[i], l[j], km(spot(l[i]), spot(l[j]))]); return out; };

		/* the paper map of where we are now: Egypt when nobody has said yet, else drawn around the four of us */
		function layout() {
			const l = placed();
			f = l.length ? frame(l.map((p) => pt(spot(p))), { pad: 0.35, minW: 300, ratio: [1.2, 1.9] }) : EGYPT;
			$('#dm-box', main).innerHTML = paperBox('dm', f, `<div class="pm__read" aria-live="polite"><p class="pm__pair" id="dm-pair" dir="auto"></p><p class="pm__km" id="dm-km"></p><p class="pm__feel" id="dm-feel" dir="auto"></p></div>`);
			const marks = $('#dm .pm__marks', main);
			// people at the same spot stand side by side instead of on top of one another
			const at = new Map();
			marks.innerHTML = l.map((p) => {
				const xy = pct(f, pt(spot(p)));
				const k = `${xy.left}|${xy.top}`, n = at.get(k) || 0;
				at.set(k, n + 1);
				return `<button class="pm__mark" type="button" data-p="${esc(p.id)}" style="--c:${esc(p.color || '#0e6990')};--n:${n};left:${xy.left};top:${xy.top}">
					<span class="pm__face">${face(p)}</span><span class="pm__name"><b>${esc(App.t(p.name))}</b><small>${esc(ago(data.people[p.id].t))}</small></span></button>`;
			}).join('');
			hydrate(marks);
			marks.onclick = (e) => {
				const m = e.target.closest('[data-p]');
				if (!m) return;
				const id = m.dataset.p;
				pick = pick.includes(id) ? pick.filter((x) => x !== id) : [...pick.slice(-1), id];
				paint();
			};
			paint();
		}

		function paint() {
			const all = pairs();
			const chosen = pick.length === 2 ? all.find(([a, b]) => pick.includes(a.id) && pick.includes(b.id)) : null;
			const shown = chosen || all.slice().sort((x, y) => y[2] - x[2])[0];
			$('#dm .pm__arcs', main).innerHTML = all.map(([a, b, k]) => {
				const A = pt(spot(a)), B = pt(spot(b));
				if (Math.hypot(A.x - B.x, A.y - B.y) < f.w / 120) return '';
				const { d, mid } = curve(A, B);
				const on = shown && a === shown[0] && b === shown[1];
				return arcSVG(f, d, mid, dist(k), on);
			}).join('');
			for (const el of $$('#dm .pm__mark', main)) el.classList.toggle('is-picked', pick.includes(el.dataset.p));
			const pair = $('#dm-pair', main), kmEl = $('#dm-km', main), fl = $('#dm-feel', main);
			const nearKm = $('#dt-near-km', main), nearSub = $('#dt-near-sub', main);
			const together = all.length && all.every(([, , k]) => k < 0.15) && placed().length === ps.length;
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
				pair.textContent = together ? L('إحنا الأربعة', 'All four of us') : `${App.t(shown[0].name)} ↔ ${App.t(shown[1].name)}`;
				kmEl.textContent = together ? L('في البيت', 'at home') : dist(shown[2]);
				fl.textContent = together ? L('مع بعض ♥', 'together ♥') : feel(shown[2]);
			}
			// the «nearest» tab up top: home when we're all together, else the closest two of us right now
			const near = all.slice().sort((x, y) => x[2] - y[2])[0];
			nearKm.textContent = together ? L('في البيت', 'At home') : near ? dist(near[2]) : '♥';
			nearSub.textContent = together ? L('إحنا الأربعة مع بعض ♥', 'All four of us together ♥') : near ? `${App.t(near[0].name)} ↔ ${App.t(near[1].name)}` : L('البيت — وإحنا الأربعة', 'Home — and the four of us');
			$('#dm-list', main).innerHTML = all.length ? all.sort((x, y) => x[2] - y[2]).map(([a, b, k]) => `<li><button type="button" data-pair="${esc(a.id)}|${esc(b.id)}"${shown && a === shown[0] && b === shown[1] ? ' class="is-on"' : ''}><b>${esc(App.t(a.name))} ↔ ${esc(App.t(b.name))}</b><span>${esc(dist(k))}</span><small>${esc(feel(k))}</small></button></li>`).join('') : '';
		}

		$('#dm-list', main).onclick = (e) => { const b = e.target.closest('[data-pair]'); if (b) { pick = b.dataset.pair.split('|'); paint(); $('#dm', main).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } };

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

		layout();
		data = await live.load('where');
		data.people ||= {};
		layout();
	}
};
