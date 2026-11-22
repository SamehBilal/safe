import { L, Y, esc, pageHead, related, App, $, $$, num } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { mark, unmark, markSVG } from '../checkfx.js';

/* «طلبات البيت»: the shopping list we share. Things go in by aisle (guessed from the name, or picked), each on a line of
   a notepad; ticking one draws a pen checkmark in its box and two wavy lines through it (checkfx.js — Codrops'
   animated checkboxes), and it slides to the bottom of its aisle. «اشترينا» clears the ticked ones (they're remembered,
   so the things we always buy come back as quick chips), and the list can be sent to whoever is going to the shop.
   Above the title a long receipt with five lines, each ticked in turn. Kept in the shared list content/live/shopping.bin. */

const AISLES = [
	{ id: 'veg', ar: 'خضار وفاكهة', en: 'Fruit & veg', ic: 'sun', c: '#5a9e6f', k: ['طماطم', 'خيار', 'بطاطس', 'بصل', 'توم', 'جزر', 'فلفل', 'ليمون', 'موز', 'تفاح', 'برتقال', 'عنب', 'فراولة', 'بطيخ', 'كوسة', 'باذنجان', 'خس', 'بقدونس', 'كزبرة', 'شبت', 'نعناع', 'مانجا', 'خضار', 'فاكهة', 'tomato', 'potato', 'onion', 'banana', 'apple', 'fruit', 'veg'] },
	{ id: 'meat', ar: 'لحوم وفراخ وسمك', en: 'Meat, chicken & fish', ic: 'dinner', c: '#d9534f', k: ['لحمة', 'لحم', 'فراخ', 'فرخة', 'سمك', 'جمبري', 'كفتة', 'سجق', 'بانيه', 'كبدة', 'لانشون', 'بسطرمة', 'meat', 'chicken', 'fish', 'beef'] },
	{ id: 'dairy', ar: 'ألبان وبيض', en: 'Dairy & eggs', ic: 'bottle', c: '#0e6990', k: ['لبن', 'جبنة', 'زبادي', 'زبدة', 'بيض', 'قشطة', 'رايب', 'milk', 'cheese', 'yogurt', 'butter', 'eggs'] },
	{ id: 'bakery', ar: 'عيش ومخبوزات', en: 'Bread & bakery', ic: 'cake', c: '#e39b2d', k: ['عيش', 'توست', 'فينو', 'كرواسون', 'بقسماط', 'bread', 'toast'] },
	{ id: 'pantry', ar: 'بقالة', en: 'Pantry', ic: 'coffee', c: '#8a5a2b', k: ['رز', 'مكرونة', 'سكر', 'زيت', 'ملح', 'دقيق', 'شاي', 'قهوة', 'عدس', 'فول', 'صلصة', 'تونة', 'مربى', 'عسل', 'نسكافيه', 'شوربة', 'بهارات', 'كاتشب', 'مايونيز', 'rice', 'pasta', 'sugar', 'oil', 'tea', 'coffee'] },
	{ id: 'snacks', ar: 'حاجات حلوة وتسالي', en: 'Snacks & sweets', ic: 'popcorn', c: '#c2185b', k: ['شيبسي', 'شوكولاتة', 'بسكويت', 'عصير', 'بيبسي', 'كولا', 'مياه', 'آيس كريم', 'لب', 'سوداني', 'chips', 'chocolate', 'juice', 'water', 'soda'] },
	{ id: 'clean', ar: 'منظفات', en: 'Cleaning', ic: 'sparkle', c: '#26706b', k: ['صابون', 'كلور', 'مسحوق', 'منظف', 'مناديل', 'ورق تواليت', 'شامبو', 'معجون', 'فرشة', 'اسفنج', 'سائل', 'معطر', 'soap', 'detergent', 'tissue', 'shampoo'] },
	{ id: 'kids', ar: 'للولاد', en: 'For the boys', ic: 'baby', c: '#6d4bb3', k: ['بامبرز', 'حفاض', 'لبن أطفال', 'سيريلاك', 'مناديل مبللة', 'ببرونة', 'سكاتة', 'diaper', 'formula', 'wipes'] },
	{ id: 'other', ar: 'حاجات تانية', en: 'Everything else', ic: 'star', c: '#5b7282', k: [] }
];
const aisleOf = (id) => AISLES.find((a) => a.id === id) || AISLES.at(-1);
// the aisle whose word matches the longest (so «بامبرز» goes to the boys, not to «رز» in the pantry)
const guess = (name) => { const w = String(name).toLowerCase(); let best = AISLES.at(-1).id, len = 0; for (const a of AISLES) for (const k of a.k) if (k.length > len && w.includes(k)) { best = a.id; len = k.length; } return best; };

export default {
	title: { ar: 'طلبات البيت', en: 'Shopping list' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('طلبات البيت', 'Shopping list'), L('اللي ناقص في البيت، نكتبه هنا ونشطبه واحنا بنشتري', 'What the house needs — written here, ticked off as we shop'), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: 'shopping.html', ar: 'طلبات البيت', en: 'Shopping list' }], {
			band: `<div class="sh-band" aria-hidden="true"><div class="sh-receipt">
				<b class="sh-receipt__h">${L('طلبات البيت', 'To buy')}</b>
				<ul class="sh-receipt__list" id="sh-receipt"></ul>
				<span class="sh-receipt__tear"></span>
			</div><span class="sh-bag">${doodle('gift', 70)}</span></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<form class="sh-add narrow${ok ? '' : ' is-off'}" id="sh-form" autocomplete="off"${ok ? '' : ' hidden'}>
				<div class="chips sh-mode" role="tablist" aria-label="${L('إزاي نكتب؟', 'How to write it?')}">
					<button class="chip is-on" type="button" data-mode="one" aria-pressed="true">${doodle('pen', 16)} ${L('حاجة واحدة', 'One thing')}</button>
					<button class="chip" type="button" data-mode="list" aria-pressed="false">${doodle('scroll', 16)} ${L('كذا حاجة في نقط', 'A list of points')}</button>
				</div>
				<label class="f sh-points" hidden><span>${L('كل حاجة في سطر — والكمية بعد شرطة لو عايز', 'One thing per line — and the amount after a dash if you like')}</span><textarea name="points" dir="auto" rows="5" maxlength="2000" placeholder="${L('• لبن - ٢ علبة\n• طماطم - ٢ كيلو\n• عيش\n• بامبرز', '• Milk - 2 cartons\n• Tomatoes - 2 kg\n• Bread\n• Nappies')}"></textarea></label>
				<div class="f-row sh-one">
					<label class="f f--grow"><span>${L('ناقص إيه؟', 'What do we need?')}</span><input name="name" dir="auto" maxlength="60" required placeholder="${L('لبن، طماطم، بامبرز…', 'Milk, tomatoes, nappies…')}"></label>
					<label class="f sh-add__qty"><span>${L('كام؟', 'How much?')}</span><input name="qty" dir="auto" maxlength="20" placeholder="${L('٢ كيلو', '2 kg')}"></label>
					<label class="f"><span>${L('من أنهي قسم؟', 'Which aisle?')}</span><select name="aisle"><option value="">${L('خمّن لوحدك', 'Guess it')}</option>${AISLES.map((a) => `<option value="${a.id}">${esc(L(a.ar, a.en))}</option>`).join('')}</select></label>
				</div>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${doodle('pen', 18)} ${L('ضيفها للطلبات', 'Add it')}</button></div>
				<p class="form-msg" id="sh-msg" role="status"></p>
				<div class="chips sh-again" id="sh-again" aria-label="${L('بنشتريهم كتير', 'We buy these a lot')}"></div>
			</form>
			<div class="sh-bar" id="sh-bar"></div>
			<div class="sh-aisles" id="sh-list"><p class="empty">${L('بنجيب الطلبات…', 'Fetching the list…')}</p></div>
		</div></section>
		${related(['food', 'goals', 'family'])}`;
	},

	async after(main) {
		let data = await live.load('shopping');
		const ok = live.canWrite();
		const list = $('#sh-list', main), form = $('#sh-form', main);
		const items = () => data.items || [];
		const save = async (fn) => { try { data = await live.save('shopping', fn); paint(); } catch (err) { alert(live.why(err)); } };

		const line = (x) => `<li class="sh-it${x.done ? ' is-done' : ''}" data-id="${esc(x.id)}">
			<label class="sh-it__lab">
				<input type="checkbox" data-tick="${esc(x.id)}"${x.done ? ' checked' : ''}${ok ? '' : ' disabled'}>
				<span class="sh-it__box">${markSVG('checkmark')}</span>
				<span class="sh-it__name" dir="auto">${esc(x.name)}${x.qty ? ` <small dir="auto">${esc(x.qty)}</small>` : ''}${markSVG('list', 'sh-it__strike')}</span>
			</label>
			${ok ? `<button class="sh-it__del" type="button" data-del="${esc(x.id)}" aria-label="${L('شيلها', 'Remove')}">${doodle('trash', 16)}</button>` : ''}
		</li>`;

		const paint = () => {
			const live_ = items().filter((x) => !x.gone);
			const left = live_.filter((x) => !x.done).length, got = live_.length - left;
			$('#sh-bar', main).innerHTML = live_.length ? `
				<p class="sh-bar__n">${left ? L(`فاضل <b>${num(left)}</b> ${left === 1 ? 'حاجة' : left === 2 ? 'حاجتين' : left <= 10 ? 'حاجات' : 'حاجة'}`, `<b>${left}</b> to buy`) : L('اشترينا كل حاجة ♥', 'Everything’s bought ♥')}</p>
				<div class="sh-bar__acts">
					<button class="btn btn--sm" type="button" id="sh-send">${doodle('letter', 16)} ${L('ابعت الطلبات', 'Send the list')}</button>
					${ok && got ? `<button class="btn btn--sm btn--coral" type="button" id="sh-clear">${doodle('trash', 16)} ${L(`شيل اللي اشتريناه (${num(got)})`, `Clear what’s bought (${got})`)}</button>` : ''}
				</div>` : '';
			const used = AISLES.filter((a) => live_.some((x) => (x.aisle || 'other') === a.id));
			list.innerHTML = used.map((a) => {
				const xs = live_.filter((x) => (x.aisle || 'other') === a.id).sort((p, q) => (p.done ? 1 : 0) - (q.done ? 1 : 0) || (p.at || 0) - (q.at || 0));
				return `<section class="sh-aisle" style="--c:${a.c}">
					<h3><span class="sh-aisle__ic">${doodle(a.ic, 20)}</span>${esc(L(a.ar, a.en))}<small>${num(xs.filter((x) => !x.done).length)}</small></h3>
					<ul class="sh-lines">${xs.map(line).join('')}</ul>
				</section>`;
			}).join('') || `<p class="empty">${L('مفيش حاجة ناقصة… أول ما حاجة تخلص اكتبوها فوق ♥', 'Nothing missing… write it above as soon as something runs out ♥')}</p>`;
			// the ticks already there are drawn at once
			for (const li of $$('.sh-it.is-done', list)) { mark($('.sh-it__box svg', li), 'checkmark', false); mark($('.sh-it__strike', li), 'list', false); }
			/* what we buy most, to put back on with one tap */
			const count = new Map();
			for (const x of items()) { const k = x.name.trim(); count.set(k, (count.get(k) || 0) + 1); }
			const on = new Set(live_.filter((x) => !x.done).map((x) => x.name.trim()));
			const again = [...count.entries()].filter(([n]) => !on.has(n)).sort((p, q) => q[1] - p[1]).slice(0, 10);
			const box = $('#sh-again', main);
			if (box) box.innerHTML = again.length ? `<span class="sh-again__h">${L('تاني؟', 'Again?')}</span>` + again.map(([n]) => `<button class="chip" type="button" data-again="${esc(n)}">+ ${esc(n)}</button>`).join('') : '';
			receipt();
		};

		/* the receipt above the title: five lines, ticked one after another, again and again */
		let rt = 0;
		this.leave = () => clearInterval(rt);
		const receipt = () => {
			const ul = $('#sh-receipt', main);
			if (!ul) return;
			const pool = items().filter((x) => !x.gone).slice(-5);
			const lines = pool.length ? pool.map((x) => x.name) : [L('لبن', 'Milk'), L('عيش', 'Bread'), L('طماطم', 'Tomatoes'), L('بيض', 'Eggs'), L('بامبرز', 'Nappies')];
			ul.innerHTML = lines.map((n) => `<li><span class="sh-it__box">${markSVG('checkmark')}</span><span dir="auto">${esc(n)}</span></li>`).join('');
			clearInterval(rt);
			let k = 0;
			rt = setInterval(() => {
				if (document.hidden) return;
				const lis = $$('li', ul);
				if (k >= lis.length) { lis.forEach((li) => unmark($('svg', li))); k = 0; return; }
				mark($('svg', lis[k]), 'checkmark');
				k++;
			}, 900);
		};

		list.addEventListener('change', (e) => {
			const cb = e.target.closest('[data-tick]');
			if (!cb) return;
			const li = cb.closest('.sh-it');
			// the pen first, then the list moves
			if (cb.checked) { mark($('.sh-it__box svg', li), 'checkmark'); mark($('.sh-it__strike', li), 'list'); li.classList.add('is-done'); }
			else { unmark($('.sh-it__box svg', li)); unmark($('.sh-it__strike', li)); li.classList.remove('is-done'); }
			setTimeout(() => save((d) => { const x = (d.items || []).find((y) => y.id === cb.dataset.tick); if (x) { if (cb.checked) { x.done = live.today(); x.doneBy = live.me(); } else { delete x.done; delete x.doneBy; } } }), 750);
		});
		list.addEventListener('click', (e) => {
			const del = e.target.closest('[data-del]');
			if (del) save((d) => { d.items = (d.items || []).filter((y) => y.id !== del.dataset.del); });
		});
		main.addEventListener('click', async (e) => {
			if (e.target.closest('#sh-clear')) save((d) => { for (const x of d.items || []) if (x.done) x.gone = true; });
			if (e.target.closest('#sh-send')) {
				const left = items().filter((x) => !x.gone && !x.done);
				const text = `${L('طلبات البيت', 'Shopping list')} ♥\n` + AISLES.map((a) => { const xs = left.filter((x) => (x.aisle || 'other') === a.id); return xs.length ? `\n${L(a.ar, a.en)}:\n${xs.map((x) => `• ${x.name}${x.qty ? ` (${x.qty})` : ''}`).join('\n')}` : ''; }).join('');
				try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); $('#sh-msg', main).textContent = L('اتنسخت — الزقها في الشات', 'Copied — paste it in the chat'); } } catch { /* cancelled */ }
			}
			const ag = e.target.closest('[data-again]');
			if (ag) addItem(ag.dataset.again, '', '');
		});

		const addItem = async (name, qty, aisle) => {
			if (!name) return;
			const x = { id: live.newId(), name, qty: qty || undefined, aisle: aisle || guess(name), by: live.me(), at: Date.now() };
			await save((d) => { (d.items = d.items || []).push(x); });
		};
		/* one thing, or a list of points: each line one thing, «• لبن - ٢ علبة», its aisle guessed */
		let mode = 'one';
		const setMode = (m) => {
			mode = m;
			$$('[data-mode]', form).forEach((b) => { const on = b.dataset.mode === m; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
			$('.sh-points', form).hidden = m !== 'list';
			$('.sh-one', form).hidden = m === 'list';
			form.name.required = m === 'one';
			(m === 'list' ? form.points : form.name).focus();
		};
		form?.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
		const parse = (line) => {
			const t = line.replace(/^\s*(?:[•\-–—*·▪◦]|\d+[.)-]|[٠-٩]+[.)-])\s*/, '').trim();
			if (!t) return null;
			const m = t.match(/^(.+?)\s+[-–—:]\s+(.+)$/) || t.match(/^(.+?)\s*\((.+)\)$/);
			return m ? { name: m[1].trim(), qty: m[2].trim() } : { name: t, qty: '' };
		};
		if (form) form.onsubmit = async (e) => {
			e.preventDefault();
			if (mode === 'list') {
				const xs = form.points.value.split(/\n|،(?=\s*\S)/).map(parse).filter(Boolean).slice(0, 60);
				if (!xs.length) return;
				const at = Date.now();
				await save((d) => { (d.items = d.items || []).push(...xs.map((x, i) => ({ id: live.newId() + i, name: x.name, qty: x.qty || undefined, aisle: guess(x.name), by: live.me(), at: at + i }))); });
				form.points.value = '';
				$('#sh-msg', main).textContent = L(`اتضاف ${num(xs.length)} ${xs.length === 1 ? 'حاجة' : xs.length === 2 ? 'حاجتين' : xs.length <= 10 ? 'حاجات' : 'حاجة'} ♥`, `${xs.length} added ♥`);
				return;
			}
			await addItem(form.name.value.trim(), form.qty.value.trim(), form.aisle.value);
			form.name.value = ''; form.qty.value = ''; form.aisle.value = '';
			form.name.focus();
		};
		paint();
	}
};
