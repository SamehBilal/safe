import { L, esc, longDate } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';

/* Our health book — all four of us: vaccinations, doctor visits, medicines and tests, with what's due next at the top,
   and the doctors we go to (where they are and how to reach them) gathered in «دكاترتنا».
   Band: a heartbeat line running across a monitor, with a syringe, a plaster and a thermometer floating by. */
const TYPES = [['vaccine', 'تطعيم', 'Vaccination'], ['visit', 'زيارة دكتور', 'Doctor visit'], ['medicine', 'دوا', 'Medicine'], ['test', 'تحليل', 'Test'], ['other', 'حاجة تانية', 'Other']];
const type = (id) => TYPES.find((x) => x[0] === id) || TYPES[4];
const ICON = { vaccine: 'syringe', visit: 'stethoscope', medicine: 'pill', test: 'flask', other: 'scroll' };
const icon = (t, size = 18) => doodle(ICON[t] || 'scroll', size);
const mapOf = (x) => x.map || (x.place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.place)}` : '');
const telOf = (p) => String(p || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d+]/g, '');
/* the doctor's corner of an entry: name, where, and buttons to find and call */
const doc = (x) => (x.doctor || x.place || x.phone ? `<div class="hl-doc">
	<span class="hl-doc__ic">${doodle('stethoscope', 18)}</span>
	<span class="hl-doc__tx">${x.doctor ? `<b dir="auto">${esc(x.doctor)}</b>` : ''}${x.place ? `<small dir="auto">${esc(x.place)}</small>` : ''}</span>
	<span class="hl-doc__acts">${mapOf(x) ? `<a class="btn btn--sm" href="${esc(mapOf(x))}" target="_blank" rel="noopener noreferrer">${doodle('pin', 15)} ${L('الموقع', 'Map')}</a>` : ''}${x.phone ? `<a class="btn btn--sm btn--coral" href="tel:${esc(telOf(x.phone))}">${doodle('phone', 15)} ${L('اتصل', 'Call')}</a>` : ''}</span>
</div>` : '');

export default listPage({
	id: 'health', kind: 'health', icon: 'stethoscope',
	title: ['دفتر صحتنا', 'Our health book'], sub: ['تطعيمات، زيارات دكتور، أدوية وتحاليل — لينا كلنا، ودكاترتنا وأرقامهم', 'Vaccinations, doctor visits, medicines and tests — for all of us, and our doctors and how to reach them'],
	add: ['ضيفوا حاجة', 'Add an entry'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'all' },
		{ n: 'type', t: 'sel', l: ['النوع', 'Type'], opts: TYPES },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'what', t: 'text', l: ['إيه بالظبط؟', 'What exactly?'], req: 1, grow: 1, full: 1, ph: ['مثلًا: تطعيم الحصبة، كشف أسنان…', 'e.g. MMR vaccine, a dental check-up…'] },
		{ n: 'doctor', t: 'text', l: ['الدكتور', 'The doctor'], ph: ['د. منى — أطفال', 'Dr Mona — paediatrics'] },
		{ n: 'phone', t: 'tel', l: ['رقمه', 'Phone'], ph: ['01xxxxxxxxx', '01xxxxxxxxx'] },
		{ n: 'next', t: 'date', l: ['الميعاد الجاي (لو فيه)', 'Next due (if any)'] },
		{ n: 'place', t: 'text', l: ['العيادة فين؟', 'Where is the clinic?'], grow: 1, ph: ['شارع البحر، طنطا', 'El Bahr St, Tanta'] },
		{ n: 'map', t: 'url', l: ['لينك الموقع (اختياري)', 'Map link (optional)'], ph: ['https://maps.app.goo.gl/…', 'https://maps.app.goo.gl/…'] },
		{ n: 'note', t: 'area', l: ['ملاحظات (الجرعة، رأي الدكتور…)', 'Notes (dose, what the doctor said…)'], rows: 2 },
		{ n: 'photo', t: 'photo', l: ['صورة الروشتة أو الكارت (اختياري)', 'Photo of the prescription or card (optional)'], full: 1 }
	],
	chips: { n: 'kid', opts: 'all' },
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: () => `<div class="hl-band"><svg class="hl-svg" viewBox="0 0 1000 160" preserveAspectRatio="none"><path class="hl-grid" d="${Array.from({ length: 21 }, (_, i) => `M${i * 50} 0V160`).join('')}${Array.from({ length: 5 }, (_, i) => `M0 ${i * 40}H1000`).join('')}"/><path class="hl-beat" d="M0 90 H180 l20 -10 l15 10 H330 l18 -70 l22 120 l18 -50 H560 l20 -12 l15 12 H720 l18 -70 l22 120 l18 -50 H1000"/></svg><span class="hl-ic hl-ic--1">${doodle('syringe', 34)}</span><span class="hl-ic hl-ic--2">${doodle('plaster', 34)}</span><span class="hl-ic hl-ic--3">${doodle('thermometer', 34)}</span></div>`,
	top: (items, c) => {
		const today = new Date().toISOString().slice(0, 10);
		const due = items.filter((x) => x.next && x.next >= today).sort((a, b) => a.next.localeCompare(b.next));
		// every doctor we've been to, once, with the latest place and number we wrote for them
		const docs = new Map();
		for (const x of [...items].reverse()) if (x.doctor) { const k = x.doctor.trim(); docs.set(k, { ...docs.get(k), doctor: k, ...(x.place ? { place: x.place } : {}), ...(x.map ? { map: x.map } : {}), ...(x.phone ? { phone: x.phone } : {}), who: new Set([...(docs.get(k)?.who || []), c.whoName(x.kid)]) }); }
		return `${due.length ? `<div class="lp-note hl-due"><h2>${doodle('calendar', 22)} ${L('الجاي', 'Coming up')}</h2>${due.map((x) => `<p><span class="hl-due__ic">${icon(x.type)}</span> <b>${esc(c.whoName(x.kid))}</b> — ${esc(x.what)} · ${esc(longDate(x.next))}</p>`).join('')}</div>` : ''}
			${docs.size ? `<section class="hl-docs"><h2 class="sec__title">${L('دكاترتنا', 'Our doctors')}</h2><div class="hl-docs__list">${[...docs.values()].map((d) => `<article class="hl-docs__card">${doc(d)}<p class="hl-docs__who">${[...d.who].filter(Boolean).map(esc).join(' · ')}</p></article>`).join('')}</div></section>` : ''}`;
	},
	card: (x, c) => `<article class="lp-card hl-card hl-card--${esc(x.type || 'other')}">
		<p class="lp-k hl-card__k"><span class="hl-card__ic">${icon(x.type, 20)}</span>${esc(L(type(x.type)[1], type(x.type)[2]))} · ${esc(c.whoName(x.kid))}</p>
		<h3 dir="auto">${esc(x.what)}</h3>
		<p class="lp-k">${c.date(x.date)}${x.next ? ` · ${L('الجاي:', 'Next:')} ${c.date(x.next)}` : ''}</p>
		${doc(x)}
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.photo(x)}
		${c.del(x)}
	</article>`,
	empty: ['لسه مفيش حاجة متسجلة — ربنا يخلينا لبعض ♥', 'Nothing logged yet — God keep us all well ♥'],
	related: ['family', 'firsts', 'growth']
});
