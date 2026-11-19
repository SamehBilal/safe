import { L, Y, esc, pageHead, related, App, $, $$, num, longDate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';
import { today, daysTo, holyDays, ramadanDay, hijri, inDays } from '../occ.js';

/* Ramadan and the two Eids: above the title, fanoos lanterns swing on their strings under a crescent moon, with how
   long until the next one (or which day of Ramadan it is). Then the countdowns, this year's traditions to tick off,
   who we had iftar with, the boys' Eid money, and an Eid photo for every year. Everything sits in one shared list
   (content/live/ramadan.bin), each entry with its type. */

const TRADITIONS = [
	['fanoos', 'نعلّق الفانوس', 'Hang the fanoos'], ['decor', 'نزيّن البيت', 'Decorate the house'], ['suhoor', 'أول سحور سوا', 'Our first suhoor together'],
	['iftar', 'نعزم العيلة على فطار', 'Have the family over for iftar'], ['kahk', 'نعمل كحك العيد', 'Bake the Eid kahk'], ['prayer', 'صلاة العيد', 'Eid prayer'],
	['eidia', 'العيدية للولاد', 'Eid money for the boys'], ['visit', 'نزور العيلة', 'Visit the family'], ['outing', 'فسحة العيد', 'An Eid outing']
];
const LANTERNS = [['#f2726f', 0.9, 22], ['#ffc94a', 1.15, 58], ['#8fd1ef', 0.8, 35], ['#b9e08a', 1.05, 72], ['#c779d0', 0.95, 15]];
const OCC = [['ramadan', 'رمضان', 'Ramadan'], ['fitr', 'عيد الفطر', 'Eid al-Fitr'], ['adha', 'عيد الأضحى', 'Eid al-Adha']];

/* a fanoos: cap, ring, a body of coloured glass panes, and a point at the bottom, all in ink */
const fanoos = (c) => `<svg viewBox="0 0 60 120" class="rm-fanoos__svg">
	<path class="rm-ink" d="M30 2v10" fill="none"/><circle class="rm-ink" cx="30" cy="14" r="4" fill="none"/>
	<path class="rm-ink" d="M18 30 30 18l12 12Z" fill="#e7b74a"/>
	<path class="rm-ink" d="M14 30h32l4 8H10Z" fill="#f4d27a"/>
	<path class="rm-glow" d="M12 38h36l-4 42H16Z" fill="${c}"/>
	<path class="rm-ink" d="M12 38h36l-4 42H16Z" fill="none"/>
	<path class="rm-ink" d="M24 38l-2 42M36 38l2 42M13 52h34M14.5 66h31" fill="none" opacity=".55"/>
	<path class="rm-ink" d="M16 80h28l-6 10H22Z" fill="#f4d27a"/>
	<path class="rm-ink" d="M22 90h16l-8 14Z" fill="#e7b74a"/><path class="rm-ink" d="M30 104v8" fill="none"/>
</svg>`;

export default {
	title: { ar: 'رمضان والعيد', en: 'Ramadan & Eid' },
	render(s) {
		const ok = live.canWrite();
		const kids = (s.family?.members || []).filter((m) => m.kid);
		return `
		${pageHead(L('رمضان والعيد', 'Ramadan & Eid'), L('العد التنازلي، وعاداتنا كل سنة، والعيدية، وصور العيد', 'The countdowns, our traditions every year, the Eid money and the Eid photos'), [{ href: 'ramadan.html', ar: 'رمضان والعيد', en: 'Ramadan & Eid' }], {
			band: `<div class="rm-band" id="rm-band">
				<svg class="rm-sky" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8Q500 40 1000 8"/></svg>
				<div class="rm-lanterns">${LANTERNS.map(([c, sc, len], i) => `<span class="rm-fanoos" style="--len:${len}px;--sc:${sc};--d:${i * -0.7}s;--c:${c}"><i class="rm-fanoos__cord"></i>${fanoos(c)}</span>`).join('')}</div>
				<span class="rm-moon" aria-hidden="true"><svg viewBox="0 0 60 60"><path d="M42 8a24 24 0 1 0 10 34A20 20 0 1 1 42 8Z"/></svg></span>
				${Array.from({ length: 9 }, (_, i) => `<span class="rm-star" style="--x:${[8, 18, 30, 44, 56, 66, 78, 88, 95][i]}%;--y:${[30, 62, 18, 70, 24, 58, 14, 66, 34][i]}%;--t:${1.4 + (i % 4) * 0.5}s" aria-hidden="true">✦</span>`).join('')}
				<p class="rm-count" id="rm-count"></p>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			<div class="rm-cds" id="rm-cds"></div>
			${ok ? '' : `<div class="narrow" style="margin:24px auto 0">${setupNote()}</div>`}

			<h2 class="sec__title reveal">${L('عاداتنا السنة دي', 'Our traditions this year')}</h2>
			<p class="sec__sub reveal">${Y('علّم على اللي عملناه', 'علّمي على اللي عملناه', 'Tick off what we’ve done')}</p>
			<ul class="rm-trad" id="rm-trad"></ul>

			<div class="rm-cols">
				<section class="rm-col">
					<h2 class="sec__title">${L('فطرنا مع مين', 'Iftar with')}</h2>
					<details class="composer"${ok ? '' : ' hidden'}><summary><span>${doodle('dinner', 22)}</span> ${Y('ضيف فطار', 'ضيفي فطار', 'Add an iftar')}</summary>
					<form class="rm-form" id="rm-iftar" autocomplete="off">
						<input name="who" dir="auto" maxlength="60" required placeholder="${L('عند ماما، مع صحابنا…', 'At Mum’s, with friends…')}" aria-label="${L('مع مين', 'With whom')}">
						<input name="date" type="date" aria-label="${L('إمتى', 'When')}">
						<button class="btn btn--sm btn--coral" type="submit">${L('ضيف', 'Add')}</button>
					</form></details>
					<ul class="rm-log" id="rm-iftars"></ul>
				</section>
				<section class="rm-col">
					<h2 class="sec__title">${L('العيدية', 'Eid money')}</h2>
					<details class="composer"${ok ? '' : ' hidden'}><summary><span>${doodle('gift', 22)}</span> ${Y('ضيف عيدية', 'ضيفي عيدية', 'Add Eid money')}</summary>
					<form class="rm-form" id="rm-eidia" autocomplete="off">
						<select name="kid" aria-label="${L('لمين', 'For whom')}">${kids.map((k) => `<option value="${esc(k.id)}">${esc(App.t(k.name))}</option>`).join('')}<option value="other">${L('حد تاني', 'Someone else')}</option></select>
						<input name="amount" type="number" min="1" inputmode="numeric" required placeholder="${L('كام؟', 'How much?')}" aria-label="${L('المبلغ', 'Amount')}">
						<input name="from" dir="auto" maxlength="40" placeholder="${L('من مين؟', 'From whom?')}" aria-label="${L('من مين', 'From whom')}">
						<button class="btn btn--sm btn--coral" type="submit">${L('ضيف', 'Add')}</button>
					</form></details>
					<div id="rm-eidias"></div>
				</section>
			</div>

			<h2 class="sec__title">${L('صور العيد', 'Eid photos')}</h2>
			<details class="composer"${ok ? '' : ' hidden'}><summary><span>${doodle('camera', 22)}</span> ${Y('ضيف صورة العيد', 'ضيفي صورة العيد', 'Add an Eid photo')}</summary>
			<form class="rm-form rm-form--photo" id="rm-photo" autocomplete="off">
				<select name="occ" aria-label="${L('أنهي مناسبة', 'Which occasion')}">${OCC.map(([id, ar, en]) => `<option value="${id}">${esc(L(ar, en))}</option>`).join('')}</select>
				<input name="photo" type="file" accept="image/*" required aria-label="${L('الصورة', 'Photo')}">
				<input name="note" dir="auto" maxlength="80" placeholder="${L('كلمتين (اختياري)', 'A few words (optional)')}" aria-label="${L('كلمتين', 'A few words')}">
				<button class="btn btn--sm btn--coral" type="submit">${L('ضيف الصورة', 'Add the photo')}</button>
			</form></details>
			<p class="form-msg" id="rm-msg" role="status"></p>
			<div class="rm-photos" id="rm-photos"></div>
		</div></section>
		${related(['calendar', 'gifts', 'birthday'])}`;
	},

	async after(main, s) {
		const kids = (s.family?.members || []).filter((m) => m.kid);
		const kidName = (id) => (id === 'other' ? L('حد تاني', 'Someone else') : App.t(kids.find((k) => k.id === id)?.name || ''));
		const year = hijri(today()).y;           // traditions and Eid money go by the Hijri year
		let data = await live.load('ramadan');
		const items = () => data.items || [];
		const save = async (fn) => { try { data = await live.save('ramadan', fn); paint(); } catch (err) { $('#rm-msg', main).textContent = live.why(err); } };
		const mine = (x) => x.by === live.me() && live.canWrite();
		const yearTxt = (y) => (App.lang === 'ar' ? num(y).replace(/[٬,]/g, '') : String(y));

		const paint = () => {
			/* countdowns */
			const holy = holyDays().filter((h) => ['ramadan', 'fitr', 'adha'].includes(h.id)).sort((a, b) => a.date - b.date);
			const rday = ramadanDay();
			$('#rm-count', main).innerHTML = rday
				? `<b>${L('رمضان كريم', 'Ramadan Kareem')}</b><span>${L(`النهارده ${num(rday)} رمضان`, `Today is day ${rday} of Ramadan`)}</span>`
				: holy[0] ? `<b>${esc(L(OCC.find((o) => o[0] === holy[0].id)[1], OCC.find((o) => o[0] === holy[0].id)[2]))}</b><span>${esc(inDays(daysTo(holy[0].date)))}</span>` : '';
			$('#rm-cds', main).innerHTML = holy.map((h) => {
				const o = OCC.find((x) => x[0] === h.id), dd = daysTo(h.date);
				return `<article class="rm-cd reveal is-in"><span aria-hidden="true">${doodle(h.icon, 28)}</span><b>${dd === 0 ? '♥' : num(dd)}</b><small>${dd === 0 ? L('النهارده!', 'Today!') : L('يوم', dd === 1 ? 'day' : 'days')}</small><h3>${esc(L(o[1], o[2]))}</h3><p>${esc(longDate(`${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`))}</p></article>`;
			}).join('');

			/* this year's traditions */
			const done = new Set(items().filter((x) => x.type === 'done' && x.year === year).map((x) => x.trad));
			const custom = items().filter((x) => x.type === 'tradition').map((x) => [x.id, x.title, x.title]);
			$('#rm-trad', main).innerHTML = [...TRADITIONS, ...custom].map(([id, ar, en]) => `
				<li><label class="rm-check${done.has(id) ? ' is-done' : ''}"><input type="checkbox" data-trad="${esc(id)}"${done.has(id) ? ' checked' : ''}${live.canWrite() ? '' : ' disabled'}><span>${esc(L(ar, en))}</span></label></li>`).join('')
				+ (live.canWrite() ? `<li class="rm-trad__add"><form id="rm-newtrad"><input name="t" dir="auto" maxlength="50" placeholder="${Y('ضيف عادة بتاعتنا…', 'ضيفي عادة بتاعتنا…', 'Add a tradition of ours…')}" aria-label="${L('عادة جديدة', 'New tradition')}"><button class="btn btn--sm" type="submit">+</button></form></li>` : '');
			const nt = $('#rm-newtrad', main);
			if (nt) nt.onsubmit = (e) => { e.preventDefault(); const t = nt.t.value.trim(); if (t) save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'tradition', title: t, by: live.me(), at: Date.now() }); }); };

			/* iftars */
			const ift = items().filter((x) => x.type === 'iftar').sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
			$('#rm-iftars', main).innerHTML = ift.map((x) => `<li><span aria-hidden="true">${doodle('dinner', 18)}</span><b dir="auto">${esc(x.who)}</b>${x.date ? `<small>${esc(longDate(x.date))}</small>` : ''}${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">✕</button>` : ''}</li>`).join('') || `<li class="empty">${L('لسه مفيش', 'None yet')}</li>`;

			/* Eid money: a little ledger per year, totals per child */
			const eid = items().filter((x) => x.type === 'eidia');
			const years = [...new Set(eid.map((x) => x.year))].sort((a, b) => b - a);
			$('#rm-eidias', main).innerHTML = years.map((y) => {
				const rows = eid.filter((x) => x.year === y);
				const tot = {};
				rows.forEach((x) => { tot[x.kid] = (tot[x.kid] || 0) + (+x.amount || 0); });
				return `<div class="rm-ledger"><h3>${L(`سنة ${yearTxt(y)} هـ`, `${y} AH`)}</h3>
					<p class="rm-ledger__tot">${Object.entries(tot).map(([k, v]) => `<span><b>${esc(kidName(k))}</b> ${num(v)}</span>`).join('')}</p>
					<ul>${rows.map((x) => `<li><span>${esc(kidName(x.kid))}</span><b>${num(+x.amount)}</b>${x.from ? `<small dir="auto">${L('من', 'from')} ${esc(x.from)}</small>` : ''}${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">✕</button>` : ''}</li>`).join('')}</ul></div>`;
			}).join('') || `<p class="empty">${L('العيدية الجاية هتتكتب هنا', 'The next Eid money goes here')}</p>`;

			/* Eid photos, newest first */
			const ph = items().filter((x) => x.type === 'photo').sort((a, b) => (b.at || 0) - (a.at || 0));
			$('#rm-photos', main).innerHTML = ph.map((x, i) => `<figure class="rm-photo" style="--r:${[-2, 1.5, -1, 2][i % 4]}deg"><img data-sketch="${esc(x.photo)}" alt=""><figcaption><b>${esc(L(...OCC.find((o) => o[0] === x.occ).slice(1)))} ${yearTxt(x.year)}</b>${x.note ? ` · <span dir="auto">${esc(x.note)}</span>` : ''}</figcaption>${mine(x) ? `<button class="link link--danger" type="button" data-del="${esc(x.id)}">${L('مسح', 'Delete')}</button>` : ''}</figure>`).join('') || `<p class="empty">${L('صورة العيد الجاي هتبقى أول واحدة', 'The next Eid photo will be the first')}</p>`;
			live.hydrateSketches($('#rm-photos', main));
		};

		const sec = $('.sec', main);
		sec.addEventListener('change', (e) => {
			const c = e.target.closest('[data-trad]');
			if (!c) return;
			const id = c.dataset.trad, key = `done-${year}-${id}`;
			save((d) => { d.items = d.items || []; if (c.checked) d.items.push({ id: key, type: 'done', year, trad: id, by: live.me(), at: Date.now() }); else d.items = d.items.filter((x) => x.id !== key); });
		});
		sec.addEventListener('click', (e) => {
			const del = e.target.closest('[data-del]');
			if (del && confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
		});
		const fi = $('#rm-iftar', main);
		fi.onsubmit = (e) => { e.preventDefault(); const who = fi.who.value.trim(); if (!who) return; save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'iftar', who, date: fi.date.value || live.today(), by: live.me(), at: Date.now() }); }).then(() => fi.reset()); };
		const fe = $('#rm-eidia', main);
		fe.onsubmit = (e) => { e.preventDefault(); const amount = Math.round(+fe.amount.value); if (!amount) return; save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'eidia', kid: fe.kid.value, amount, from: fe.from.value.trim() || undefined, year, by: live.me(), at: Date.now() }); }).then(() => { fe.reset(); }); };
		const fp = $('#rm-photo', main);
		fp.onsubmit = async (e) => {
			e.preventDefault();
			const file = fp.photo.files[0];
			if (!file) return;
			$('#rm-msg', main).textContent = L('بنحفظ…', 'Saving…');
			try {
				const photo = await live.putSketch(await shrinkPhoto(file, 1200));
				await save((d) => { (d.items = d.items || []).push({ id: live.newId(), type: 'photo', occ: fp.occ.value, photo, note: fp.note.value.trim() || undefined, year: new Date().getFullYear(), by: live.me(), at: Date.now() }); });
				fp.reset(); $('#rm-msg', main).textContent = L('اتحطت ♥', 'Added ♥');
			} catch (err) { $('#rm-msg', main).textContent = live.why(err); }
		};
		paint();
	}
};
