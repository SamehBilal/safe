import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «مدرستهم»: the kids' school — each line a subject in a term: the grade out of how much, the teacher, the next exam,
   a photo of the paper or the report card. Above the title a blackboard in chalk: each kid's average this term and
   the next exam coming. The cards are rows of a report card, a ring with the grade and its word (ممتاز، جيد جدًا…).
   Shared: content/live/school.bin. */

const daysTo = (iso) => Math.round((new Date(iso + 'T00:00') - new Date(live.today() + 'T00:00')) / 864e5);
const pctOf = (x) => (+x.score >= 0 && +x.max > 0 ? Math.round((+x.score / +x.max) * 100) : null);
const WORDS = [[90, 'ممتاز', 'Excellent', '#5a9e6f'], [80, 'جيد جدًا', 'Very good', '#0e6990'], [65, 'جيد', 'Good', '#e39b2d'], [50, 'مقبول', 'Pass', '#c77d2e'], [0, 'محتاج مذاكرة', 'Needs work', '#d9534f']];
const wordOf = (p) => WORDS.find((w) => p >= w[0]) || WORDS.at(-1);
const nextExam = (items) => items.filter((x) => x.exam && daysTo(x.exam) >= 0).sort((a, b) => a.exam.localeCompare(b.exam))[0];

export default listPage({
	id: 'school', kind: 'school', icon: 'book',
	title: ['مدرستهم', 'Their school'], sub: ['الدرجات والمدرسين والامتحانات — ترم بترم ♥', 'Grades, teachers and exams — term by term ♥'],
	add: ['ضيفوا مادة أو درجة', 'Add a subject or a grade'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'term', t: 'text', l: ['السنة والترم', 'Year and term'], ph: ['تالتة ابتدائي — الترم الأول', 'Year 3 — first term'], ideas: [['الترم الأول', 'First term'], ['الترم التاني', 'Second term'], ['آخر السنة', 'End of year']] },
		{ n: 'subject', t: 'text', l: ['المادة', 'Subject'], req: 1, ph: ['عربي، ماث، إنجليزي…', 'Arabic, maths, English…'], ideas: [['عربي', 'Arabic'], ['إنجليزي', 'English'], ['ماث', 'Maths'], ['ساينس', 'Science'], ['دراسات', 'Social studies'], ['دين', 'Religion'], ['فرنساوي', 'French'], ['كمبيوتر', 'Computer'], ['رسم', 'Art']] },
		{ n: 'score', t: 'num', l: ['الدرجة', 'Score'], ph: ['٤٥', '45'] },
		{ n: 'max', t: 'num', l: ['من كام؟', 'Out of?'], ph: ['٥٠', '50'] },
		{ n: 'teacher', t: 'text', l: ['المدرس / المدرسة', 'Teacher'], ph: ['مس سارة', 'Ms Sara'] },
		{ n: 'exam', t: 'date', l: ['الامتحان الجاي (اختياري)', 'Next exam (optional)'] },
		{ n: 'school', t: 'text', l: ['المدرسة والفصل', 'School and class'], ph: ['مدرسة النور — ٣/ب', 'Al Nour school — 3B'] },
		{ n: 'photo', t: 'photo', l: ['صورة الورقة أو الشهادة (اختياري)', 'A photo of the paper or report card (optional)'] },
		{ n: 'note', t: 'area', l: ['ملاحظات', 'Notes'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.term || '').localeCompare(String(a.term || '')) || String(a.exam || '9999').localeCompare(String(b.exam || '9999')) || String(a.subject).localeCompare(String(b.subject), 'ar'),
	band: (items, c) => {
		const kids = c.kids.filter((k) => items.some((x) => x.kid === k.id));
		const avg = (list) => { const ps = list.map(pctOf).filter((p) => p !== null); return ps.length ? Math.round(ps.reduce((a, p) => a + p, 0) / ps.length) : null; };
		const ex = nextExam(items);
		const rows = (kids.length ? kids.map((k) => [c.kidName(k.id), avg(items.filter((x) => x.kid === k.id))]) : [[L('المتوسط', 'Average'), avg(items)]]).slice(0, 4);
		return `<div class="sc-b">
			<div class="sc-board">
				<p class="sc-board__date">${c.date(live.today())}</p>
				<p class="sc-board__h">${L('شطّار ♥', 'Well done ♥')}</p>
				<ul class="sc-board__rows">${rows.map(([n, p]) => `<li><span dir="auto">${esc(n)}</span><i></i><b>${p === null ? '—' : `${num(p)}٪`}</b></li>`).join('')}</ul>
				${ex ? `<p class="sc-board__ex">${doodle('clock', 18)} ${L('الامتحان الجاي:', 'Next exam:')} <b dir="auto">${esc(ex.subject)}</b> — ${daysTo(ex.exam) === 0 ? L('النهارده!', 'today!') : L(`بعد ${num(daysTo(ex.exam))} يوم`, `in ${daysTo(ex.exam)} days`)}</p>` : `<p class="sc-board__ex">${L('مفيش امتحانات قريبة ♥', 'No exams soon ♥')}</p>`}
				<span class="sc-board__chalk" aria-hidden="true"></span><span class="sc-board__eraser" aria-hidden="true"></span>
			</div>
			<span class="sc-apple" aria-hidden="true">${doodle('book', 46)}</span>
		</div>`;
	},
	card: (x, c) => {
		const p = pctOf(x), w = p === null ? null : wordOf(p), d = x.exam ? daysTo(x.exam) : null;
		return `<article class="lp-card sc-card" id="sc-${esc(x.id)}" style="--c:${w ? w[3] : '#8a8494'}">
			<div class="sc-card__ring" style="--p:${p ?? 0}%"><b>${p === null ? '—' : num(p)}</b><small>${p === null ? '' : '٪'}</small></div>
			<div class="sc-card__body">
				<p class="sc-card__k">${x.kid ? esc(c.kidName(x.kid)) : ''}${x.term ? ` · <span dir="auto">${esc(x.term)}</span>` : ''}</p>
				<h3 dir="auto">${esc(x.subject)}</h3>
				${p !== null ? `<p class="sc-card__grade"><b>${num(+x.score)}</b> ${L('من', 'of')} ${num(+x.max)} — <em>${esc(L(w[1], w[2]))}</em></p>` : ''}
				<p class="sc-card__meta">
					${x.teacher ? `<span>${doodle('pen', 14)} <span dir="auto">${esc(x.teacher)}</span></span>` : ''}
					${x.school ? `<span>${doodle('house', 14)} <span dir="auto">${esc(shorten(x.school, 30))}</span></span>` : ''}
					${x.exam ? `<span class="${d !== null && d >= 0 && d <= 7 ? 'is-near' : ''}">${doodle('clock', 14)} ${L('امتحان', 'Exam')} ${c.date(x.exam)}${d !== null && d >= 0 ? ` (${d === 0 ? L('النهارده', 'today') : L(`بعد ${num(d)} يوم`, `in ${d} days`)})` : ''}</span>` : ''}
				</p>
				${x.note ? `<p class="sc-card__note" dir="auto">${esc(x.note)}</p>` : ''}
				${x.photo ? `<span class="sc-card__pic">${c.photo(x)}</span>` : ''}
				${c.del(x) ? `<div class="sc-card__act">${c.del(x)}</div>` : ''}
			</div>
		</article>`;
	},
	empty: ['لسه مفيش درجات — ضيفوا أول مادة ♥', 'No grades yet — add the first subject ♥'],
	related: ['clubs', 'firsts', 'growth']
});
