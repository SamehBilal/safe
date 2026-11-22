import { L, Y, esc, pageHead, related, App, $, $$, num, img, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { mark, markSVG } from '../checkfx.js';

/* «روتيننا»: the family's day — what the four of us do together, and each one's own routine (Sameh's, Esraa's, Fahd's,
   Abdulrahman's): at what time, on which days of the week, with a drawn icon. Above the title a 24-hour clock — the
   day on its top half, the night on the bottom, a dot for everything on today's routine in its owner's colour, and the
   hand on the time now — with what each of us is doing now and what comes next. Below, a day of the week to look at
   (today first), tabs for everyone / the family / each of us, and the day split into its parts (morning, noon,
   afternoon, evening, bedtime) with a «now» line through it. On today, each thing can be ticked with a pen
   checkmark (checkfx.js); the ticks are kept for two weeks. For each of the boys, a paper board like the ones on a
   fridge: his morning (or bedtime) as a row of cards with their drawings, a magnet over each, and a flap under each that
   folds up over the card when he's done it — the same tick as in the list. Shared like every list: content/live/routine.bin. */

const DAYS = [6, 0, 1, 2, 3, 4, 5]; // the week starts on Saturday
const DAY = { ar: ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const PARTS = [
	{ id: 'morning', from: 4 * 60, ar: 'الصبح', en: 'Morning', ic: 'sun' },
	{ id: 'noon', from: 12 * 60, ar: 'الضهر', en: 'Midday', ic: 'dinner' },
	{ id: 'after', from: 15 * 60, ar: 'العصر', en: 'Afternoon', ic: 'coffee' },
	{ id: 'evening', from: 18 * 60, ar: 'بالليل', en: 'Evening', ic: 'moon' },
	{ id: 'bed', from: 22 * 60, ar: 'قبل النوم', en: 'Bedtime', ic: 'sleepy' }
];
const ICONS = ['sun', 'coffee', 'dinner', 'baby', 'bottle', 'book', 'pen', 'walk', 'mosque', 'house', 'tv', 'dice', 'music', 'teddy', 'sleepy', 'moon', 'phone', 'scooter', 'gift', 'heart', 'star', 'clock', 'pill', 'tooth', 'sparkle', 'rain', 'grad', 'trophy'];
const FAMILY = { id: 'all', c: '#f2726f', ic: 'family' };

const mins = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
// the day runs from 4 in the morning to 4 the next morning, so midnight's things come after the evening's
const dayMins = (t) => { const m = mins(t); return m < 4 * 60 ? m + 1440 : m; };
const partOf = (t) => [...PARTS].reverse().find((p) => dayMins(t) >= p.from) || PARTS[0];
const fmtT = (t) => {
	let [h, m] = String(t).split(':').map(Number);
	const pm = h >= 12; h = h % 12 || 12;
	return App.lang === 'ar' ? `${num(h)}:${num(m).padStart(2, '٠')} ${pm ? 'م' : 'ص'}` : `${h}:${String(m).padStart(2, '0')} ${pm ? 'pm' : 'am'}`;
};
const pad = (n) => String(n).padStart(2, '0');
const nowT = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* a starting routine to edit: what a day with a four-year-old and a baby tends to look like */
const STARTER = [
	['all', '08:30', 'فطار سوا', 'Breakfast together', 'coffee', [5, 6]],
	['all', '15:30', 'الغدا سوا', 'Lunch together', 'dinner'],
	['all', '19:00', 'وقت لعب العيلة', 'Family play time', 'dice'],
	['all', '20:30', 'حدوتة قبل النوم', 'A bedtime story', 'book'],
	['sameh', '07:00', 'يصحى ويجهز', 'Up and ready', 'sun'],
	['sameh', '09:00', 'الشغل', 'Work', 'house', [0, 1, 2, 3, 4]],
	['sameh', '22:30', 'وقت لنفسه', 'Time for himself', 'tv'],
	['esraa', '07:00', 'تصحّي الولاد', 'Wakes the boys', 'sun'],
	['esraa', '13:00', 'تحضر الغدا', 'Makes lunch', 'dinner'],
	['esraa', '22:30', 'وقت لنفسها', 'Time for herself', 'coffee'],
	['fahd', '07:15', 'يغسل سنانه ويلبس', 'Brushes his teeth and dresses', 'tooth'],
	['fahd', '08:00', 'الحضانة', 'Nursery', 'grad', [0, 1, 2, 3, 4]],
	['fahd', '17:00', 'لعب برا', 'Playing outside', 'scooter'],
	['fahd', '20:00', 'حمام', 'Bath', 'rain'],
	['fahd', '21:00', 'ينام', 'Sleeps', 'sleepy'],
	['abdulrahman', '06:30', 'رضعة الصبح', 'Morning feed', 'bottle'],
	['abdulrahman', '10:00', 'نومة الصبح', 'Morning nap', 'sleepy'],
	['abdulrahman', '14:00', 'نومة العصر', 'Afternoon nap', 'sleepy'],
	['abdulrahman', '19:30', 'حمام دافي', 'A warm bath', 'rain'],
	['abdulrahman', '20:00', 'ينام', 'Sleeps', 'teddy']
];

export default {
	title: { ar: 'روتيننا', en: 'Our routine' },
	render(s) {
		const ok = live.canWrite();
		const members = s.family?.members || [];
		const today = new Date().getDay();
		return `
		${pageHead(L('روتيننا', 'Our routine'), L('يوم العيلة كلها، وروتين كل واحد فينا', 'The whole family’s day, and each of our own routines'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: 'routine.html', ar: 'روتيننا', en: 'Our routine' }], { band: '<div class="rt-band" id="rt-band" aria-hidden="true"></div>' })}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer narrow" id="rt-comp" style="margin:0 auto 28px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('clock', 22)}</span> <b id="rt-comp-h">${Y('ضيف للروتين', 'ضيفي للروتين', 'Add to the routine')}</b></summary>
				<form id="rt-form" autocomplete="off">
					<input type="hidden" name="rid">
					<div class="f-row">
						<label class="f"><span>${L('لمين؟', 'Whose?')}</span><select name="who"><option value="all">${L('العيلة كلها', 'The whole family')}</option>${members.map((m) => `<option value="${esc(m.id)}">${esc(App.t(m.name))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('الساعة كام؟', 'What time?')}</span><input name="time" type="time" required value="08:00"></label>
					</div>
					<label class="f"><span>${L('إيه هو؟', 'What is it?')}</span><input name="what" dir="auto" maxlength="60" required placeholder="${L('الفطار، الحضانة، حدوتة قبل النوم…', 'Breakfast, nursery, a bedtime story…')}"></label>
					<fieldset class="f rt-days"><legend>${L('أنهي أيام؟', 'Which days?')}</legend>
						<div class="chips rt-days__pre">
							<button class="chip is-on" type="button" data-pre="all">${L('كل يوم', 'Every day')}</button>
							<button class="chip" type="button" data-pre="work">${L('أيام الشغل', 'Work days')}</button>
							<button class="chip" type="button" data-pre="weekend">${L('الويكند', 'The weekend')}</button>
						</div>
						<div class="rt-days__all">${DAYS.map((d) => `<label class="rt-day"><input type="checkbox" name="d" value="${d}" checked><span>${DAY[App.lang === 'ar' ? 'ar' : 'en'][d]}</span></label>`).join('')}</div>
					</fieldset>
					<fieldset class="f rt-icons"><legend>${L('الرسمة', 'Its drawing')}</legend>
						<div class="rt-icons__all">${ICONS.map((ic, i) => `<label class="rt-ic"><input type="radio" name="icon" value="${ic}"${i ? '' : ' checked'}><span>${doodle(ic, 22)}</span></label>`).join('')}</div>
					</fieldset>
					<label class="f"><span>${L('ملاحظة (اختياري)', 'A note (optional)')}</span><input name="note" dir="auto" maxlength="120"></label>
					<p class="form-msg" id="rt-msg" role="status"></p>
					<div class="f-actions"><button type="button" class="btn btn--ghost" id="rt-cancel" hidden>${L('إلغاء', 'Cancel')}</button><button type="submit" class="btn btn--coral">${doodle('clock', 18)} <span id="rt-submit">${Y('ضيفه', 'ضيفيه', 'Add it')}</span></button></div>
				</form>
			</details>
			<div class="rt-week chips" id="rt-week" role="tablist" aria-label="${L('أنهي يوم؟', 'Which day?')}">${DAYS.map((d) => `<button class="chip${d === today ? ' is-on' : ''}" type="button" role="tab" data-day="${d}" aria-selected="${d === today}">${DAY[App.lang === 'ar' ? 'ar' : 'en'][d]}${d === today ? ` <small>${L('النهارده', 'today')}</small>` : ''}</button>`).join('')}</div>
			<div class="rt-tabs" id="rt-tabs" role="tablist" aria-label="${L('روتين مين؟', 'Whose routine?')}">
				<button class="rt-tab is-on" type="button" role="tab" data-who="" style="--c:#37353f">${doodle('clock', 22)}<span>${L('الكل', 'Everyone')}</span></button>
				<button class="rt-tab" type="button" role="tab" data-who="all" style="--c:${FAMILY.c}">${doodle('family', 22)}<span>${L('العيلة', 'Family')}</span></button>
				${members.map((m) => `<button class="rt-tab" type="button" role="tab" data-who="${esc(m.id)}" style="--c:${esc(m.color)}"><span class="rt-tab__av">${m.photo ? img(m.photo, '', '') : doodle(m.emoji, 20)}</span><span>${esc(App.t(m.name))}</span></button>`).join('')}
			</div>
			<div class="rb-wrap" id="rt-boards"></div>
			<p class="rt-progress" id="rt-progress"></p>
			<div class="rt-day-list" id="rt-list"><p class="empty">${L('بنجيب الروتين…', 'Fetching the routine…')}</p></div>
		</div></section>
		${related(['chores', 'calendar', 'family'])}`;
	},

	async after(main, s) {
		const ok = live.canWrite();
		const members = s.family?.members || [];
		const lang = () => (App.lang === 'ar' ? 'ar' : 'en');
		const person = (id) => (id === 'all' ? { ...FAMILY, name: L('العيلة', 'Family') } : (() => { const m = members.find((x) => x.id === id); return m ? { id, c: m.color, ic: m.emoji, photo: m.photo, name: App.t(m.name) } : { id, c: '#5b7282', ic: 'star', name: '' }; })());
		let data = await live.load('routine');
		let day = new Date().getDay(), who = '';
		let half = dayMins(nowT()) < 15 * 60 ? 'am' : 'pm';
		const items = () => data.items || [];
		const onDay = (x, d) => !x.days || !x.days.length || x.days.includes(d);
		const todayKey = live.today();
		const save = async (fn) => { try { data = await live.save('routine', fn); paint(); } catch (err) { alert(live.why(err)); } };

		/* the clock: 24 hours round, midnight at the bottom and noon at the top */
		const clock = () => {
			const d = new Date().getDay(), list = items().filter((x) => onDay(x, d));
			const at = (m, r) => { const a = (m / 1440) * 2 * Math.PI; return [120 - r * Math.sin(a), 120 + r * Math.cos(a)]; };
			const n = mins(nowT());
			const [hx, hy] = at(n, 78);
			const ticks = Array.from({ length: 24 }, (_, h) => { const [x1, y1] = at(h * 60, 100), [x2, y2] = at(h * 60, h % 3 ? 94 : 88); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="rt-c__tick${h % 3 ? '' : ' is-big'}"/>`; }).join('');
			const nums = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => { const [x, y] = at(h * 60, 75); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${App.lang === 'ar' ? num(h % 12 || 12) : h % 12 || 12}</text>`; }).join('');
			const dots = list.map((x, i) => { const [x1, y1] = at(mins(x.time), 108 + (i % 2) * 6); return `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="4.5" fill="${person(x.who).c}"/>`; }).join('');
			const nowOf = (id) => {
				const mine = list.filter((x) => x.who === id || (id !== 'all' && x.who === 'all')).sort((a, b) => dayMins(a.time) - dayMins(b.time));
				const nd = dayMins(nowT());
				const cur = [...mine].reverse().find((x) => dayMins(x.time) <= nd), next = mine.find((x) => dayMins(x.time) > nd);
				return { cur, next };
			};
			const card = (id) => { const p = person(id), { cur, next } = nowOf(id); return `<li style="--c:${p.c}"><span class="rt-now__av">${p.photo ? img(p.photo, '', '') : doodle(p.ic, 20)}</span><span class="rt-now__tx"><b>${esc(p.name)}</b>${cur ? `<span>${doodle(cur.icon || 'clock', 14)} ${esc(cur.what)}</span>` : `<span class="is-quiet">${L('لسه مفيش', 'Nothing yet')}</span>`}${next ? `<small>${L('الجاي', 'Next')}: ${esc(next.what)} · ${fmtT(next.time)}</small>` : ''}</span></li>`; };
			$('#rt-band', main).innerHTML = `<div class="rt-b">
				<svg class="rt-clock" viewBox="0 0 240 240">
					<defs><clipPath id="rt-top"><rect x="0" y="0" width="240" height="120"/></clipPath></defs>
					<circle cx="120" cy="120" r="116" class="rt-c__rim"/>
					<circle cx="120" cy="120" r="104" class="rt-c__night"/>
					<circle cx="120" cy="120" r="104" class="rt-c__day" clip-path="url(#rt-top)"/>
					<g class="rt-c__sun" transform="translate(108 58)">${doodle('sun', 24).replace(/<\/?svg[^>]*>/g, '')}</g>
					<g class="rt-c__moon" transform="translate(108 158)">${doodle('moon', 24).replace(/<\/?svg[^>]*>/g, '')}</g>
					${ticks}<g class="rt-c__nums">${nums}</g>${dots}
					<line x1="120" y1="120" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" class="rt-c__hand"/>
					<circle cx="120" cy="120" r="24" class="rt-c__mid"/>
					<text x="120" y="118" class="rt-c__now">${fmtT(nowT()).split(' ')[0]}</text>
					<text x="120" y="132" class="rt-c__ampm">${fmtT(nowT()).split(' ')[1]}</text>
				</svg>
				<div class="rt-now"><p class="rt-now__h">${L('دلوقتي في البيت', 'Right now at home')}</p><ul>${['all', ...members.map((m) => m.id)].map(card).join('')}</ul></div>
			</div>`;
			hydrate($('#rt-band', main));
		};

		const row = (x, isToday) => {
			const p = person(x.who), done = isToday && x.done?.[todayKey];
			return `<li class="rt-it${done ? ' is-done' : ''}" style="--c:${p.c}" data-id="${esc(x.id)}">
				<time>${fmtT(x.time)}</time>
				<span class="rt-it__dot"></span>
				<div class="rt-it__card">
					<span class="rt-it__ic">${doodle(x.icon || 'clock', 22)}</span>
					<span class="rt-it__tx"><b dir="auto">${esc(x.what)}</b>
						<small>${x.who === 'all' ? `${doodle('family', 13)} ${L('العيلة كلها', 'The whole family')}` : esc(p.name)}${x.days?.length && x.days.length < 7 ? ` · ${x.days.length === 5 && [0, 1, 2, 3, 4].every((d) => x.days.includes(d)) ? L('أيام الشغل', 'Work days') : x.days.length === 2 && x.days.includes(5) && x.days.includes(6) ? L('الويكند', 'Weekend') : DAYS.filter((d) => x.days.includes(d)).map((d) => DAY[lang()][d]).join('، ')}` : ''}</small>
						${x.note ? `<em dir="auto">${esc(x.note)}</em>` : ''}</span>
					${isToday ? `<label class="rt-it__tick" title="${L('اتعمل', 'Done')}"><input type="checkbox" data-tick="${esc(x.id)}"${done ? ' checked' : ''}${ok ? '' : ' disabled'}><span class="rt-it__box">${markSVG('checkmark')}</span></label>` : ''}
					${ok ? `<span class="rt-it__tools"><button class="link" type="button" data-edit="${esc(x.id)}">${L('تعديل', 'Edit')}</button><button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button></span>` : ''}
				</div>
			</li>`;
		};

		/* the boys' boards: today's cards for each boy, a flap under each that folds up over it once it's done */
		const CRAYON = ['#f39c4a', '#e8608a', '#4fb3d9', '#9b7fd1', '#6cc070', '#f2c230', '#ef6f5e'];
		const boards = () => {
			const box = $('#rt-boards', main);
			const kids = members.filter((m) => m.kid && (!who || who === m.id));
			if (day !== new Date().getDay() || !kids.length || !items().length) { box.innerHTML = ''; return; }
			const inHalf = (x) => (half === 'am' ? dayMins(x.time) < 15 * 60 : dayMins(x.time) >= 15 * 60);
			const one = (m) => {
				const list = items().filter((x) => x.who === m.id && onDay(x, day) && inHalf(x)).sort((a, b) => dayMins(a.time) - dayMins(b.time));
				const name = App.t(m.name), all = list.length && list.every((x) => x.done?.[todayKey]);
				return `<article class="rb${all ? ' is-all' : ''}" style="--c:${esc(m.color || '#2f7f94')}">
					<h3 class="rb__h">${half === 'am' ? L(`روتين ${name} الصبح`, `${name}’s morning routine`) : L(`روتين ${name} بالليل`, `${name}’s bedtime routine`)} ${doodle(half === 'am' ? 'sun' : 'moon', 44, 'rb__sun')}</h3>
					${list.length ? `<ol class="rb__row">${list.map((x, i) => { const done = !!x.done?.[todayKey]; return `<li class="rb-col${done ? ' is-done' : ''}" style="--k:${CRAYON[i % CRAYON.length]}; --i:${i}">
						<span class="rb-mag"></span>
						<button class="rb-slot" type="button" data-flip="${esc(x.id)}" aria-pressed="${done}"${ok ? '' : ' disabled'} aria-label="${esc(x.what)}">
							<span class="rb-card"><span class="rb-card__ic">${doodle(x.icon || 'clock', 46)}</span><b dir="auto">${esc(x.what)}</b><small>${fmtT(x.time)}</small></span>
						</button>
						<span class="rb-under"><span class="rb-flap"><span class="rb-face rb-face--front"><span class="rb-mag rb-mag--low"></span></span><span class="rb-face rb-face--back">${doodle('star', 34)}<b>${L('خلص!', 'Done!')}</b><span class="rb-mag rb-mag--top"></span></span></span></span>
					</li>`; }).join('')}</ol>`
					: `<p class="rb__empty">${L(`لسه مفيش حاجة في روتين ${name} ${half === 'am' ? 'الصبح' : 'بالليل'} — ضيفوها من «ضيف للروتين»`, `Nothing on ${name}’s ${half === 'am' ? 'morning' : 'bedtime'} routine yet — add it with «Add to the routine»`)}</p>`}
					<p class="rb__yay" aria-live="polite">${all ? `${doodle('trophy', 26)} ${L(`برافو يا ${name}! خلّصت كله`, `Well done, ${name}! All done`)} ${doodle('star', 22)}` : ''}</p>
				</article>`;
			};
			box.innerHTML = `<div class="rb-top"><h2 class="rt-part__h">${doodle('teddy', 24)} ${L('لوحة الولاد', 'The boys’ boards')}</h2>
				<div class="chips" role="tablist"><button class="chip${half === 'am' ? ' is-on' : ''}" type="button" data-half="am">${doodle('sun', 16)} ${L('الصبح', 'Morning')}</button><button class="chip${half === 'pm' ? ' is-on' : ''}" type="button" data-half="pm">${doodle('moon', 16)} ${L('بالليل', 'Bedtime')}</button></div>
				<p class="muted rb-top__tip">${L('خلّص حاجة؟ دوس على الكارت والغطا يتقفل عليه', 'Done one? Tap its card and the flap folds up over it')}</p></div>
				${kids.map(one).join('')}`;
		};

		const paint = () => {
			clock();
			boards();
			const isToday = day === new Date().getDay();
			const list = items().filter((x) => onDay(x, day) && (!who || x.who === who || (who !== 'all' && x.who === 'all'))).sort((a, b) => dayMins(a.time) - dayMins(b.time));
			const nd = dayMins(nowT());
			const box = $('#rt-list', main);
			if (!items().length) {
				box.innerHTML = `<div class="rt-empty"><p class="empty">${L('لسه مفيش روتين — ابدأوا بواحد مقترح وعدّلوا فيه، أو ضيفوا من الأول', 'No routine yet — start from a suggested one and change it, or add your own')}</p>${ok ? `<button class="btn btn--coral" type="button" id="rt-starter">${doodle('sparkle', 18)} ${L('ابدأ بروتين مقترح', 'Start from a suggested routine')}</button>` : ''}</div>`;
				$('#rt-progress', main).textContent = '';
				return;
			}
			let nowShown = !isToday;
			box.innerHTML = PARTS.map((part, i) => {
				const end = PARTS[i + 1]?.from ?? 28 * 60;
				const here = list.filter((x) => dayMins(x.time) >= part.from && dayMins(x.time) < end);
				if (!here.length) return '';
				return `<section class="rt-part"><h2 class="rt-part__h">${doodle(part.ic, 24)} ${esc(L(part.ar, part.en))}</h2><ol class="rt-line">${here.map((x) => {
					let line = '';
					if (!nowShown && dayMins(x.time) > nd) { nowShown = true; line = `<li class="rt-nowline" aria-label="${L('دلوقتي', 'Now')}"><span>${L('دلوقتي', 'Now')} · ${fmtT(nowT())}</span></li>`; }
					return line + row(x, isToday);
				}).join('')}</ol></section>`;
			}).join('') || `<p class="empty">${L('مفيش حاجة في اليوم ده', 'Nothing on this day')}</p>`;
			if (!nowShown && list.length) $$('.rt-line', box).at(-1)?.insertAdjacentHTML('beforeend', `<li class="rt-nowline"><span>${L('دلوقتي', 'Now')} · ${fmtT(nowT())}</span></li>`);
			hydrate(box);
			for (const svg of $$('.rt-it.is-done .rt-it__box svg', box)) mark(svg, 'checkmark', false);
			const doneN = isToday ? list.filter((x) => x.done?.[todayKey]).length : 0;
			$('#rt-progress', main).innerHTML = isToday && list.length ? `${doodle('pen', 16)} ${L(`النهارده اتعمل ${num(doneN)} من ${num(list.length)}`, `Today: ${doneN} of ${list.length} done`)} <span class="rt-progress__bar"><i style="width:${Math.round((doneN / list.length) * 100)}%"></i></span>` : '';
		};

		/* the day, the person */
		$('#rt-week', main).onclick = (e) => { const b = e.target.closest('[data-day]'); if (!b) return; day = +b.dataset.day; $$('#rt-week .chip', main).forEach((c) => { c.classList.toggle('is-on', c === b); c.setAttribute('aria-selected', c === b); }); paint(); };
		$('#rt-tabs', main).onclick = (e) => { const b = e.target.closest('[data-who]'); if (!b) return; who = b.dataset.who; $$('#rt-tabs .rt-tab', main).forEach((c) => c.classList.toggle('is-on', c === b)); paint(); };

		/* the boards: morning or bedtime; a tap folds the flap up (or back down) and ticks it in the list */
		$('#rt-boards', main).addEventListener('click', (e) => {
			const h = e.target.closest('[data-half]');
			if (h) { half = h.dataset.half; return boards(); }
			const f = e.target.closest('[data-flip]');
			if (!f || !ok) return;
			const col = f.closest('.rb-col'), on = !col.classList.contains('is-done');
			col.classList.toggle('is-done', on);
			f.setAttribute('aria-pressed', on);
			const cutoff = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
			setTimeout(() => save((d) => { const x = (d.items || []).find((i) => i.id === f.dataset.flip); if (!x) return; x.done = Object.fromEntries(Object.entries(x.done || {}).filter(([k]) => k >= cutoff)); if (on) x.done[todayKey] = live.me(); else delete x.done[todayKey]; }), 750);
		});

		/* ticking, editing, deleting, the starter */
		const list = $('#rt-list', main);
		list.addEventListener('change', (e) => {
			const t = e.target.closest('[data-tick]');
			if (!t) return;
			const svg = $('.rt-it__box svg', t.parentNode);
			if (t.checked) mark(svg, 'checkmark'); else svg.innerHTML = '';
			const cutoff = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
			setTimeout(() => save((d) => { const x = (d.items || []).find((i) => i.id === t.dataset.tick); if (!x) return; x.done = Object.fromEntries(Object.entries(x.done || {}).filter(([k]) => k >= cutoff)); if (t.checked) x.done[todayKey] = live.me(); else delete x.done[todayKey]; }), 450);
		});
		const form = $('#rt-form', main), comp = $('#rt-comp', main);
		const setDays = (ds) => { for (const c of $$('[name="d"]', form)) c.checked = ds.includes(+c.value); const all = ds.length === 7, work = ds.length === 5 && [0, 1, 2, 3, 4].every((d) => ds.includes(d)), we = ds.length === 2 && ds.includes(5) && ds.includes(6); $$('[data-pre]', form).forEach((b) => b.classList.toggle('is-on', (b.dataset.pre === 'all' && all) || (b.dataset.pre === 'work' && work) || (b.dataset.pre === 'weekend' && we))); };
		form.addEventListener('click', (e) => { const b = e.target.closest('[data-pre]'); if (b) setDays({ all: [0, 1, 2, 3, 4, 5, 6], work: [0, 1, 2, 3, 4], weekend: [5, 6] }[b.dataset.pre]); });
		form.addEventListener('change', (e) => { if (e.target.name === 'd') setDays($$('[name="d"]:checked', form).map((c) => +c.value)); });
		const editing = (x) => {
			form.elements.rid.value = x ? x.id : '';
			$('#rt-comp-h', main).textContent = x ? L('تعديل', 'Edit') : Y('ضيف للروتين', 'ضيفي للروتين', 'Add to the routine');
			$('#rt-submit', main).textContent = x ? L('احفظ التعديل', 'Save the change') : Y('ضيفه', 'ضيفيه', 'Add it');
			$('#rt-cancel', main).hidden = !x;
			if (!x) { form.reset(); setDays([0, 1, 2, 3, 4, 5, 6]); return; }
			form.who.value = x.who; form.time.value = x.time; form.what.value = x.what; form.note.value = x.note || '';
			const r = $(`[name="icon"][value="${x.icon}"]`, form); if (r) r.checked = true;
			setDays(x.days?.length ? x.days : [0, 1, 2, 3, 4, 5, 6]);
			comp.open = true;
			comp.scrollIntoView({ behavior: 'smooth', block: 'start' });
		};
		$('#rt-cancel', main).onclick = () => editing(null);
		list.addEventListener('click', async (e) => {
			const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
			if (ed) editing(items().find((x) => x.id === ed.dataset.edit));
			if (del && confirm(Y('تمسحها من الروتين؟', 'تمسحيها من الروتين؟', 'Remove it from the routine?'))) save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
			if (e.target.closest('#rt-starter')) save((d) => { d.items = d.items || []; for (const [w, time, ar, en, icon, days] of STARTER) if (members.some((m) => m.id === w) || w === 'all') d.items.push({ id: live.newId(), who: w, time, what: L(ar, en), icon, days, by: live.me(), at: Date.now() }); });
		});
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#rt-msg', main);
			const days = $$('[name="d"]:checked', form).map((c) => +c.value);
			if (!days.length) { msg.textContent = L('اختاروا يوم واحد على الأقل', 'Pick at least one day'); return; }
			const x = { who: form.who.value, time: form.time.value, what: form.what.value.trim(), icon: form.icon.value, days: days.length === 7 ? undefined : days, note: form.note.value.trim() || undefined };
			const id = form.elements.rid.value;
			msg.textContent = L('بنحفظ…', 'Saving…');
			await save((d) => { d.items = d.items || []; if (id) { const o = d.items.find((i) => i.id === id); if (o) Object.assign(o, x, { days: x.days, note: x.note }); } else d.items.push({ id: live.newId(), ...x, by: live.me(), at: Date.now() }); });
			msg.textContent = id ? L('اتعدّل ♥', 'Changed ♥') : L('اتضاف ♥', 'Added ♥');
			editing(null);
		};
		paint();
		// the clock and the «now» line move on by themselves
		const tick = setInterval(() => { if (!document.body.contains(list)) return clearInterval(tick); if (!list.contains(document.activeElement)) paint(); }, 60000);
	}
};
