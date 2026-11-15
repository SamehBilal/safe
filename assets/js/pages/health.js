import { L, esc, longDate } from '../shell.js';
import { listPage } from '../listpage.js';

/* The boys' health book: vaccinations, doctor visits and medicines, with what's due next at the top.
   Band: a heartbeat line running across a monitor, with a syringe, a plaster and a thermometer floating by. */
const TYPES = [['vaccine', 'تطعيم', 'Vaccination'], ['visit', 'زيارة دكتور', 'Doctor visit'], ['medicine', 'دوا', 'Medicine'], ['test', 'تحليل', 'Test'], ['other', 'حاجة تانية', 'Other']];
const type = (id) => TYPES.find((x) => x[0] === id) || TYPES[4];
const ICON = { vaccine: '💉', visit: '🩺', medicine: '💊', test: '🧪', other: '📋' };
export default listPage({
	id: 'health', kind: 'health', icon: 'sick',
	title: ['دفتر صحة الولاد', 'The boys’ health book'], sub: ['تطعيمات، زيارات دكتور، وأدوية — وإيه الجاي', 'Vaccinations, doctor visits and medicines — and what’s due next'],
	add: ['ضيفوا حاجة', 'Add an entry'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'type', t: 'sel', l: ['النوع', 'Type'], opts: TYPES },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'what', t: 'text', l: ['إيه بالظبط؟', 'What exactly?'], req: 1, grow: 1, ph: ['مثلًا: تطعيم الحصبة، دكتور الأطفال…', 'e.g. MMR vaccine, the paediatrician…'] },
		{ n: 'next', t: 'date', l: ['الميعاد الجاي (لو فيه)', 'Next due (if any)'] },
		{ n: 'note', t: 'area', l: ['ملاحظات (الجرعة، رأي الدكتور…)', 'Notes (dose, what the doctor said…)'], rows: 2 },
		{ n: 'photo', t: 'photo', l: ['صورة الروشتة أو الكارت (اختياري)', 'Photo of the prescription or card (optional)'], full: 1 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: () => `<div class="hl-band"><svg class="hl-svg" viewBox="0 0 1000 160" preserveAspectRatio="none"><path class="hl-grid" d="${Array.from({ length: 21 }, (_, i) => `M${i * 50} 0V160`).join('')}${Array.from({ length: 5 }, (_, i) => `M0 ${i * 40}H1000`).join('')}"/><path class="hl-beat" d="M0 90 H180 l20 -10 l15 10 H330 l18 -70 l22 120 l18 -50 H560 l20 -12 l15 12 H720 l18 -70 l22 120 l18 -50 H1000"/></svg><span class="hl-ic hl-ic--1">💉</span><span class="hl-ic hl-ic--2">🩹</span><span class="hl-ic hl-ic--3">🌡️</span></div>`,
	top: (items, c) => {
		const today = new Date().toISOString().slice(0, 10);
		const due = items.filter((x) => x.next && x.next >= today).sort((a, b) => a.next.localeCompare(b.next));
		return due.length ? `<div class="lp-note"><h2>${L('الجاي', 'Coming up')}</h2>${due.map((x) => `<p>${ICON[x.type] || '📋'} <b>${esc(c.kidName(x.kid))}</b> — ${esc(x.what)} · ${esc(longDate(x.next))}</p>`).join('')}</div>` : '';
	},
	card: (x, c) => `<article class="lp-card hl-card">
		<p class="lp-k">${ICON[x.type] || '📋'} ${esc(L(type(x.type)[1], type(x.type)[2]))} · ${esc(c.kidName(x.kid))}</p>
		<h3 dir="auto">${esc(x.what)}</h3>
		<p class="lp-k">${c.date(x.date)}${x.next ? ` · ${L('الجاي:', 'Next:')} ${c.date(x.next)}` : ''}</p>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.photo(x)}
		${c.del(x)}
	</article>`,
	empty: ['لسه مفيش حاجة متسجلة — ربنا يخليهم ♥', 'Nothing logged yet — God keep them well ♥'],
	related: ['family', 'firsts', 'growth']
});
