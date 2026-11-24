import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* «نشاطاتهم»: the kids' sports, courses and clubs — what, where, which days and when, the coach, what it costs a month,
   and the medals and certificates along the way. Above the title a wooden shelf of trophies, one for every medal we
   wrote, and a tag with what the activities cost a month. Each card is a membership card. Shared: content/live/clubs.bin. */

const ACTS = [['sport', 'trophy', 'رياضة', 'Sport'], ['art', 'palette', 'فن ورسم', 'Art'], ['music', 'music', 'موسيقى', 'Music'], ['study', 'book', 'كورس ولغات', 'Course & languages'], ['quran', 'mosque', 'قرآن', 'Quran'], ['other', 'star', 'حاجة تانية', 'Something else']];
const actOf = (k) => ACTS.find((a) => a[0] === k) || ACTS.at(-1);
const COLORS = ['#e39b2d', '#0e6990', '#d9534f', '#5a9e6f', '#8e5bd1'];
const medalsOf = (x) => String(x.medals || '').split(/\n|،|,/).map((m) => m.trim()).filter(Boolean);
const money = (n) => `${num(Math.round(+n || 0))} ${L('ج', 'EGP')}`;

export default listPage({
	id: 'clubs', kind: 'clubs', icon: 'star',
	title: ['نشاطاتهم', 'Their activities'], sub: ['التمرين والكورسات والنادي — وكل ميدالية خدوها ♥', 'Training, courses and clubs — and every medal they won ♥'],
	add: ['ضيفوا نشاط', 'Add an activity'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'act', t: 'text', l: ['النشاط', 'Activity'], req: 1, grow: 1, ph: ['سباحة، كاراتيه، بيانو…', 'Swimming, karate, piano…'], ideas: [['سباحة', 'Swimming'], ['كورة', 'Football'], ['كاراتيه', 'Karate'], ['جمباز', 'Gymnastics'], ['تنس', 'Tennis'], ['رسم', 'Drawing'], ['بيانو', 'Piano'], ['إنجليزي', 'English'], ['برمجة', 'Coding'], ['تحفيظ قرآن', 'Quran']] },
		{ n: 'kind', t: 'sel', l: ['نوعه', 'Kind'], opts: ACTS.map(([v, , ar, en]) => [v, ar, en]) },
		{ n: 'place', t: 'text', l: ['فين؟', 'Where?'], ph: ['النادي، الأكاديمية…', 'The club, the academy…'] },
		{ n: 'days', t: 'text', l: ['أيام إيه؟', 'Which days?'], ph: ['السبت والتلات', 'Sat & Tue'] },
		{ n: 'time', t: 'text', l: ['الساعة كام؟', 'What time?'], ph: ['٥ العصر', '5 pm'] },
		{ n: 'coach', t: 'text', l: ['الكابتن / المدرس', 'Coach / teacher'], ph: ['كابتن محمد', 'Coach Mohamed'] },
		{ n: 'cost', t: 'num', l: ['بكام في الشهر؟', 'Cost a month (EGP)'], ph: ['٦٠٠', '600'] },
		{ n: 'started', t: 'date', l: ['بدأ إمتى؟', 'Started on'] },
		{ n: 'medals', t: 'area', l: ['ميداليات وشهادات (كل واحدة في سطر)', 'Medals and certificates (one per line)'], rows: 2, ph: ['دهبية بطولة الشتا ٢٠٢٦', 'Gold, winter cup 2026'] },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'] },
		{ n: 'note', t: 'area', l: ['ملاحظات', 'Notes'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => !!a.stopped - !!b.stopped || String(a.kid || '').localeCompare(String(b.kid || '')) || String(a.act).localeCompare(String(b.act), 'ar'),
	toggle: { n: 'stopped', on: ['وقّفناه', 'Stopped'], off: ['لسه مكمّل', 'Still going'] },
	band: (items, c) => {
		const medals = items.flatMap((x) => medalsOf(x).map((m) => ({ m, x })));
		const cost = items.filter((x) => !x.stopped).reduce((a, x) => a + (+x.cost || 0), 0);
		const shown = medals.slice(-7);
		return `<div class="cb-b">
			<div class="cb-shelf">
				<div class="cb-shelf__row">${shown.length ? shown.map(({ m, x }, i) => `<span class="cb-cup${i % 3 === 1 ? ' is-medal' : ''}" style="--c:${COLORS[i % COLORS.length]};--i:${i}" title="${esc(m)}">
					${i % 3 === 1 ? `<i class="cb-cup__ribbon"></i><i class="cb-cup__disc">${doodle('star', 18)}</i>` : `${doodle('trophy', 44)}`}
					<small dir="auto">${esc(shorten(c.kidName(x.kid) || m, 10))}</small>
				</span>`).join('') : `<span class="cb-cup cb-cup--empty" style="--c:#c9c2b4">${doodle('trophy', 44)}<small>${L('أول كاس جاي ♥', 'First cup coming ♥')}</small></span>`}</div>
				<span class="cb-shelf__board" aria-hidden="true"></span>
			</div>
			<p class="cb-tag"><small>${L('في الشهر', 'A month')}</small><b>${money(cost)}</b><small>${L(`${num(items.filter((x) => !x.stopped).length)} نشاط`, `${items.filter((x) => !x.stopped).length} activities`)} · ${L(`${num(medals.length)} ميدالية`, `${medals.length} medals`)}</small></p>
		</div>`;
	},
	card: (x, c) => {
		const [, ic, ar, en] = actOf(x.kind), ms = medalsOf(x);
		return `<article class="lp-card cb-card${x.stopped ? ' is-off' : ''}" id="cb-${esc(x.id)}">
			<header class="cb-card__hd"><span>${doodle(ic, 18)} ${esc(L(ar, en))}</span>${x.kid ? `<b dir="auto">${esc(c.kidName(x.kid))}</b>` : ''}</header>
			<div class="cb-card__main">
				${x.photo ? `<span class="cb-card__pic">${c.photo(x)}</span>` : `<span class="cb-card__pic cb-card__pic--none">${doodle(ic, 34)}</span>`}
				<div><h3 dir="auto">${esc(x.act)}</h3>${x.place ? `<p class="cb-card__place" dir="auto">${esc(x.place)}</p>` : ''}</div>
			</div>
			<p class="cb-card__meta">
				${x.days || x.time ? `<span>${doodle('calendar', 14)} <span dir="auto">${esc([x.days, x.time].filter(Boolean).join(' · '))}</span></span>` : ''}
				${x.coach ? `<span>${doodle('handshake', 14)} <span dir="auto">${esc(x.coach)}</span></span>` : ''}
				${x.cost ? `<span>${doodle('coins', 14)} ${money(x.cost)} ${L('في الشهر', 'a month')}</span>` : ''}
				${x.started ? `<span>${doodle('clock', 14)} ${L('من', 'Since')} ${c.date(x.started)}</span>` : ''}
			</p>
			${ms.length ? `<ul class="cb-card__medals">${ms.map((m, i) => `<li style="--c:${COLORS[i % COLORS.length]}">${doodle('star', 13)} <span dir="auto">${esc(m)}</span></li>`).join('')}</ul>` : ''}
			${x.note ? `<p class="cb-card__note" dir="auto">${esc(x.note)}</p>` : ''}
			<div class="cb-card__act">
				${live.canWrite() ? `<button class="link" type="button" data-tog="${esc(x.id)}">${x.stopped ? L('رجع تاني', 'Back at it') : L('وقّفناه', 'We stopped it')}</button>` : ''}
				${c.del(x)}
			</div>
		</article>`;
	},
	empty: ['لسه مفيش نشاطات — ضيفوا التمرين أو الكورس ♥', 'No activities yet — add a sport or a course ♥'],
	related: ['school', 'routine', 'expenses']
});
