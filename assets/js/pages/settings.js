import { L, Y, T, esc, pageHead, App, $ } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* Whose phone this is, and passing what each of you added to the other phone and to the site, as a file. No accounts, no tokens. */
const NAMES = {
	journal: ['الدفتر', 'Journal'], music: ['الأغاني', 'Songs'], draw: ['القرعة', 'Draws'],
	trips: ['الرحلات', 'Trips'], movies: ['الأفلام', 'Films'], wishes: ['الأمنيات', 'Wishes'],
	goals: ['الأهداف', 'Goals'], where: ['أماكننا دلوقتي', 'Where we are'], spots: ['أماكن المدن', 'City spots'], books: ['الكتب', 'Books'], posts: ['البوستات', 'Posts'], tree: ['شجرة العيلة', 'Family tree'], food: ['المطاعم', 'Restaurants']
};

export default {
	title: { ar: 'الإعدادات', en: 'Settings' },
	render(s) {
		const me = live.me();
		return `
		${pageHead(L('الإعدادات', 'Settings'), Y('مين ماسك الموبايل، وإزاي اللي بتكتبه يوصل للتاني وللموقع', 'مين ماسك الموبايل، وإزاي اللي بتكتبيه يوصل للتاني وللموقع', 'Whose phone this is, and how what you write reaches the other phone and the site'), [{ href: 'settings.html', ar: 'الإعدادات', en: 'Settings' }])}
		<section class="sec sec--top"><div class="wrap narrow">
			<form class="panel settings" id="st-form" autocomplete="off">
				<fieldset class="who">
					<legend>${L('مين ماسك الموبايل ده؟', 'Whose phone is this?')}</legend>
					<label><input type="radio" name="me" value="him"${me === 'him' ? ' checked' : ''}><span>${doodle('groom', 28)} ${T(s.him)}</span></label>
					<label><input type="radio" name="me" value="her"${me === 'her' ? ' checked' : ''}><span>${doodle('princess', 28)} ${T(s.her)}</span></label>
				</fieldset>
				<p class="form-msg" id="st-who" role="status"></p>
			</form>

			<div class="panel settings" style="margin-top:20px">
				<h2>${L('اللي جديد على الموبايل ده', 'What’s new on this phone')}</h2>
				<p class="muted">${Y('اللي بتكتبه بيتحفظ على الموبايل على طول ويبان هنا. عشان يوصل للتاني أو للموقع، ابعته في ملف — الملف متشفّر بمفتاح موقعنا، محدش يقدر يفتحه غيرنا.', 'اللي بتكتبيه بيتحفظ على الموبايل على طول ويبان هنا. عشان يوصل للتاني أو للموقع، ابعتيه في ملف — الملف متشفّر بمفتاح موقعنا، محدش يقدر يفتحه غيرنا.', 'What you write is saved on the phone straight away and shows here. To get it to the other phone or onto the site, send it as a file — it’s encrypted with our site’s key, so nobody else can open it.')}</p>
				<div id="st-pending" class="muted">${L('بنعد…', 'Counting…')}</div>
				<p class="form-msg" id="st-msg" role="status"></p>
				<div class="f-actions">
					<label class="btn btn--ghost" for="st-file">${doodle('letter', 18)} ${Y('ضيف ملف من التاني', 'ضيفي ملف من التاني', 'Add a file from the other phone')}</label>
					<input type="file" id="st-file" accept=".json,application/json" hidden>
					<button type="button" class="btn btn--coral" id="st-send">${doodle('phone', 18)} ${Y('ابعت اللي جديد', 'ابعتي اللي جديد', 'Send what’s new')}</button>
				</div>
				<details class="howto"><summary>${L('بيوصل للموقع إزاي؟', 'How does it get onto the site?')}</summary><ol>
					<li>${Y('ابعت الملف لنفسك أو للتاني (واتساب، إيميل…). على الموبايل التاني: «ضيف ملف من التاني» وهيشوف كل حاجة على طول.', 'ابعتي الملف لنفسك أو للتاني (واتساب، إيميل…). على الموبايل التاني: «ضيفي ملف من التاني» وهيشوف كل حاجة على طول.', 'Send the file to yourself or the other phone (WhatsApp, email…). On the other phone, “Add a file from the other phone” and it sees everything straight away.')}</li>
					<li>${Y('على كمبيوتر سامح: حط الملف في أي مكان وشغّل', 'على كمبيوتر سامح: حطي الملف في أي مكان وشغّلي', 'On Sameh’s PC: save the file anywhere and run')} <code dir="ltr">node tools/import.mjs us-….json</code></li>
					<li>${L('وبعدين', 'then')} <code dir="ltr">node tools/build.mjs</code> ${Y('وانشر. لما الموقع يتحدث، الموبايلات بتمسح نسختها لوحدها.', 'وانشري. لما الموقع يتحدث، الموبايلات بتمسح نسختها لوحدها.', 'and publish. Once the site has it, the phones drop their own copy by themselves.')}</li>
				</ol></details>
			</div>
			<p style="text-align:center;margin-top:28px"><a class="link muted" href="secret.html" aria-label="${L('أوضتنا', 'Our room')}" style="opacity:.55">${doodle('lock', 18)}</a></p>
		</div></section>`;
	},
	after(main) {
		const form = $('#st-form', main);
		const who = $('#st-who', main);
		const msg = $('#st-msg', main);
		const box = $('#st-pending', main);
		form.onchange = () => {
			if (form.me.value) live.setMe(form.me.value);
			who.textContent = Y('اتحفظ ✓ — تقدر تكتب من الموبايل ده', 'اتحفظ ✓ — تقدري تكتبي من الموبايل ده', 'Saved ✓ — you can write from this phone');
		};

		const count = async () => {
			const p = await live.pending();
			const rows = Object.entries(p.lists).map(([k, n]) => `<li>${esc(L(...NAMES[k]))}: <b>${n}</b></li>`);
			if (p.sketches) rows.push(`<li>${L('رسومات وصور', 'Sketches and photos')}: <b>${p.sketches}</b></li>`);
			box.innerHTML = p.total ? `<ul class="st-list">${rows.join('')}</ul>` : `<p>${L('مفيش حاجة جديدة — كل اللي هنا موجود على الموقع ♥', 'Nothing new — everything here is already on the site ♥')}</p>`;
			return p;
		};
		count();

		$('#st-send', main).onclick = async () => {
			msg.textContent = '';
			try {
				const file = await live.exportFile();
				if (navigator.canShare?.({ files: [file] })) {
					try { await navigator.share({ files: [file], title: file.name }); return; } catch (e) { if (e.name === 'AbortError') return; }
				}
				const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: file.name });
				document.body.append(a); a.click(); a.remove();
				setTimeout(() => URL.revokeObjectURL(a.href), 4000);
				msg.textContent = L('الملف اتنزل: ', 'Downloaded: ') + file.name;
			} catch (err) { msg.textContent = live.why(err); }
		};

		$('#st-file', main).onchange = async (e) => {
			const f = e.target.files?.[0];
			e.target.value = '';
			if (!f) return;
			msg.textContent = L('بنضيف…', 'Adding…');
			try {
				const n = await live.importFile(f);
				msg.textContent = n ? L(`اتضاف ✓ (${n} حاجة)`, `Added ✓ (${n} thing${n === 1 ? '' : 's'})`) : L('اتضاف ✓ — مكانش فيه حاجة جديدة', 'Added ✓ — nothing new in it');
				count();
			} catch (err) { msg.textContent = live.why(err); }
		};
	}
};
