import { L, Y, esc, $ } from '../shell.js';
import { doodle } from '../doodles.js';
import { listPage } from '../listpage.js';
import * as live from '../live.js';
import { shrinkPhoto } from './trips.js';

/* Gift ideas, two lists in one page.
   «نفسي في» — the wish list: what each of us would love to get, written by the one who wants it. Whoever writes a wish
   picks who sees it: everyone, only the other one, or just them (a note to self for now). The others can quietly say
   «أنا هجيبها 🤫» — the one who wished never sees who's getting it, so it stays a surprise — and the wisher ticks
   «وصلتني ♥» once it arrives.
   «أفكاري السرية» — each of us keeps ideas for the other through the year. This phone only shows the ideas its owner
   wrote, so the other one doesn't stumble on them. Each idea or wish has its photo beside it, taped on like a polaroid
   (a wrapped box until one's added — tap it to add one).
   Both travel between the phones in the same list (wishes are the entries with type 'wish').
   Band: wrapped boxes with question marks, their lids hopping, and a bow on top. */

const isWish = (x) => x.type === 'wish';
const other = (w) => (w === 'him' ? 'her' : 'him');
const SEE = { all: ['الكل يشوفها', 'Everyone sees it'], other: ['', ''], me: ['أنا بس (لسه)', 'Just me (for now)'] };
const seeLabel = (see, by, c) => (see === 'other' ? L(`${c.whoName(other(by))} بس`, `Only ${c.whoName(other(by))}`) : L(...(SEE[see] || SEE.all)));
const OCC = () => ({ birthday: L('عيد الميلاد', 'Birthday'), anniversary: L('عيد الجواز', 'Anniversary'), eid: L('العيد', 'Eid'), valentine: L('عيد الحب', 'Valentine’s') });

/* the photo beside a card: the picture, or a wrapped box to tap and add one (only for whoever wrote it) */
const pic = (x, label) => x.photo
	? `<figure class="gi-pic"><img class="zoom" data-sketch="${esc(x.photo)}" alt="${esc(label)}" loading="lazy"></figure>`
	: `<button class="gi-pic gi-pic--empty" type="button" data-gi-photo="${esc(x.id)}"${live.canWrite() && x.by === live.me() ? '' : ' disabled'} aria-label="${L('ضيف صورة', 'Add a photo')}"><span class="gi-box" aria-hidden="true"><i class="gi-lid"></i><b>?</b></span><small>${live.canWrite() && x.by === live.me() ? Y('ضيف صورة', 'ضيفي صورة', 'Add a photo') : ''}</small></button>`;

function wishCard(x, c) {
	const me = live.me(), mine = x.by === me;
	const meta = [mine ? seeLabel(x.see, x.by, c) : L(`نفس ${c.whoName(x.by)}`, `${c.whoName(x.by)} wishes`), x.occ && x.occ !== 'any' ? OCC()[x.occ] : '', x.price ? `${x.price} ${L('ج', 'EGP')}` : ''].filter(Boolean).join(' · ');
	// the one who wished never sees who's getting it
	let act = '';
	if (x.got) act = `<p class="gw-got">✓ ${L('وصلت', 'It arrived')} · ${c.date(x.got)}</p>`;
	else if (mine) act = live.canWrite() ? `<button class="btn btn--sm btn--coral" type="button" data-gw-got="${esc(x.id)}">${Y('وصلتني ♥', 'وصلتني ♥', 'I got it ♥')}</button>` : '';
	else if (x.claim === me) act = `<p class="gw-claim">🤫 ${L('إنت هتجيبها — سر', 'You’re getting it — shh')}</p>${live.canWrite() ? `<button class="link" type="button" data-gw-claim="${esc(x.id)}">${L('مش هقدر أجيبها', 'I can’t get it after all')}</button>` : ''}`;
	else if (x.claim) act = `<p class="gw-claim">🎁 ${L(`${c.whoName(x.claim)} هيجيبها`, `${c.whoName(x.claim)} is getting it`)}</p>`;
	else if (live.canWrite()) act = `<button class="btn btn--sm" type="button" data-gw-claim="${esc(x.id)}">${L('أنا هجيبها 🤫', 'I’ll get it 🤫')}</button>`;
	return `<article class="lp-card gi-card gw-card${x.got ? ' is-done' : ''}${mine ? ' is-mine' : ''}" style="--w:${x.by === 'him' ? 'var(--blue)' : 'var(--coral, #f2726f)'}">
		${pic(x, x.what)}
		<div class="gi-tx">
			<p class="lp-k">${esc(meta)}</p>
			<h3 dir="auto">${esc(x.what)}</h3>
			${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
			${x.link ? `<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${L('اللينك', 'Link')} ↗</a>` : ''}
			${act}
			${c.del(x)}
		</div>
	</article>`;
}

function wishesHTML(items, c) {
	const me = live.me();
	const all = items.filter(isWish).sort((a, b) => (a.got ? 1 : 0) - (b.got ? 1 : 0) || (b.at || 0) - (a.at || 0));
	const mine = all.filter((x) => x.by === me), theirs = all.filter((x) => x.by !== me);
	const col = (title, list, empty) => `<div class="gw-col"><h3 class="gw-h">${title}</h3>${list.length ? `<div class="gw-list">${list.map((x) => wishCard(x, c)).join('')}</div>` : `<p class="empty">${empty}</p>`}</div>`;
	return `<section class="gw" aria-labelledby="gw-title">
		<header class="gw-head">
			<h2 class="sec__title" id="gw-title">${L('نفسي في…', 'I’d love…')}</h2>
			<p class="muted">${L('اكتب الحاجة اللي نفسك تتجابلك، واختار مين يشوفها. اللي هيجيبها بيقول «أنا هجيبها» من غير ما تعرف ♥', 'Write what you’d love to be given and choose who sees it. Whoever gets it says so — without you knowing ♥')}</p>
			${live.canWrite() ? `<button class="btn btn--coral" type="button" data-gw-add>${doodle('gift', 20)} ${Y('ضيف حاجة نفسك فيها', 'ضيفي حاجة نفسك فيها', 'Add a wish')}</button>` : ''}
		</header>
		<div class="gw-cols">
			${col(`${doodle('heart', 20)} ${L('اللي نفسي فيه', 'My wishes')}`, mine, L('لسه مكتبتش حاجة نفسك فيها', 'You haven’t written a wish yet'))}
			${col(`${doodle('gift', 20)} ${L(`نفس ${c.whoName(other(me))} في`, `${c.whoName(other(me))} would love`)}`, theirs, L('لسه مفيش أمنيات تقدر تشوفها', 'No wishes you can see yet'))}
		</div>
	</section>
	<h2 class="sec__title gi-secret-h">${L('أفكاري السرية', 'My secret ideas')}</h2>
	<p class="muted gi-secret-sub">${L('أفكار هدايا للتاني وللولاد — بتبان على موبايلك إنت بس', 'Gift ideas for the other one and the boys — only on your phone')}</p>`;
}

export default listPage({
	id: 'giftideas', kind: 'giftideas', icon: 'gift',
	title: ['أفكار هدايا', 'Gift ideas'], sub: ['اللي نفس كل واحد فينا فيه، وقايمة سرية لكل واحد — أفكار للتاني طول السنة', 'What each of us would love, and a secret list each — ideas for the other, all year'],
	add: ['ضيف فكرة سرية', 'Add a secret idea'],
	fields: [
		{ n: 'for', t: 'sel', l: ['لمين؟', 'For whom?'], opts: (s) => [['other', 'للتاني', 'For my other half'], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, k.name?.ar || k.id, k.name?.en || k.id])] },
		{ n: 'idea', t: 'text', l: ['الفكرة', 'The idea'], req: 1, grow: 1 },
		{ n: 'photo', t: 'photo', l: ['صورتها (اختياري)', 'A photo of it (optional)'], full: 1 },
		{ n: 'occ', t: 'sel', l: ['لمناسبة إيه؟', 'For what?'], opts: [['any', 'أي وقت', 'Any time'], ['birthday', 'عيد الميلاد', 'Birthday'], ['anniversary', 'عيد الجواز', 'Anniversary'], ['eid', 'العيد', 'Eid'], ['valentine', 'عيد الحب', 'Valentine’s']] },
		{ n: 'price', t: 'num', l: ['سعرها تقريبًا', 'Rough price'] },
		{ n: 'link', t: 'url', l: ['لينك (اختياري)', 'Link (optional)'], full: 1 },
		{ n: 'note', t: 'text', l: ['ملاحظة (المقاس، اللون…)', 'Note (size, colour…)'], full: 1 }
	],
	note: ['الأفكار دي بتبان على موبايلك إنت بس ♥', 'These only show on your own phone ♥'],
	// my own ideas; and the wishes I wrote, or that their writer lets me see
	keep: (x) => (isWish(x) ? x.by === live.me() || (x.see || 'all') !== 'me' : x.by === live.me()),
	toggle: { n: 'given' },
	sort: (a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0) || (b.at || 0) - (a.at || 0),
	band: (items) => { const n = items.filter((x) => !isWish(x) && !x.given).length, w = items.filter((x) => isWish(x) && !x.got).length; return `<div class="gi-band">${[0, 1, 2, 3].map((i) => `<span class="gi-box" style="--i:${i}"><i class="gi-lid"></i><b>?</b></span>`).join('')}<p class="gi-n"><span>${L(`${w} أمنية · ${n} فكرة مستنية`, `${w} wishes · ${n} ideas waiting`)}</span></p></div>`; },
	top: (items, c) => wishesHTML(items, c),
	card: (x, c) => (isWish(x) ? '' : `<article class="lp-card gi-card${x.given ? ' is-done' : ''}">
		${pic(x, x.idea)}
		<div class="gi-tx">
		<p class="lp-k">${x.for === 'other' || !x.for ? L('للتاني', 'For my other half') : esc(c.kidName(x.for))}${x.occ && x.occ !== 'any' ? ` · ${esc(OCC()[x.occ] || '')}` : ''}${x.price ? ` · ${esc(x.price)} ${L('ج', 'EGP')}` : ''}</p>
		<h3 dir="auto">${esc(x.idea)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.link ? `<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${L('اللينك', 'Link')} ↗</a>` : ''}
		<button class="btn btn--sm ${x.given ? 'btn--ghost' : 'btn--coral'}" type="button" data-tog="${esc(x.id)}">${x.given ? `✓ ${L('اتجابت', 'Given')} · ${c.date(x.given)}` : Y('جبتها ✓', 'جبتها ✓', 'Given ✓')}</button>
		${c.del(x)}
		</div>
	</article>`),
	/* the wish form: a window of its own, made once */
	ready: (main, c) => {
		// the «add a secret idea» button (and its window) go under the wish list, with the secret ideas
		const det = $('details.composer', main);
		if (det) { const btn = det.nextElementSibling?.classList.contains('composer-btn') ? det.nextElementSibling : null; $('#lp-top', main).after(...[det, btn, $('dialog.cmodal', main)].filter(Boolean)); }
		if (!live.canWrite()) return;
		const me = live.me();
		const dlg = document.createElement('dialog');
		dlg.className = 'cmodal gw-modal';
		dlg.setAttribute('aria-label', L('حاجة نفسي فيها', 'A wish'));
		dlg.innerHTML = `<div class="cmodal__in"><header class="cmodal__hd"><h2>${doodle('gift', 22)} ${Y('ضيف حاجة نفسك فيها', 'ضيفي حاجة نفسك فيها', 'Add a wish')}</h2><button type="button" class="cmodal__x" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button></header>
			<form id="gw-form" autocomplete="off">
				<label class="f"><span>${L('نفسك في إيه؟', 'What would you love?')}</span><input name="what" dir="auto" maxlength="140" required></label>
				<fieldset class="gw-see"><legend>${L('مين يشوفها؟', 'Who sees it?')}</legend>
					<label><input type="radio" name="see" value="all" checked><span>👀 ${L('الكل', 'Everyone')}</span></label>
					<label><input type="radio" name="see" value="other"><span>💌 ${esc(L(`${c.whoName(other(me))} بس`, `Only ${c.whoName(other(me))}`))}</span></label>
					<label><input type="radio" name="see" value="me"><span>🔒 ${L('أنا بس (لسه)', 'Just me (for now)')}</span></label>
				</fieldset>
				<div class="f-row">
					<label class="f"><span>${L('لمناسبة إيه؟', 'For what?')}</span><select name="occ"><option value="any">${L('أي وقت', 'Any time')}</option>${Object.entries(OCC()).map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>
					<label class="f"><span>${L('سعرها تقريبًا', 'Rough price')}</span><input name="price" type="number" min="0" step="any" inputmode="decimal"></label>
				</div>
				<label class="f"><span>${L('ملاحظة (المقاس، اللون، المكان…)', 'Note (size, colour, where to find it…)')}</span><input name="note" dir="auto" maxlength="200"></label>
				<label class="f"><span>${L('لينك (اختياري)', 'Link (optional)')}</span><input name="link" type="url" dir="ltr"></label>
				<label class="f"><span>${L('صورتها (اختياري)', 'A photo of it (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
				<p class="form-msg" id="gw-msg" role="status"></p>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
			</form></div>`;
		$('#lp-top', main).before(dlg);
		dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.cmodal__x')) dlg.close(); });
		const f = $('#gw-form', dlg);
		f.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gw-msg', dlg);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const x = { id: live.newId(), type: 'wish', what: f.what.value.trim(), see: f.see.value, by: me, at: Date.now() };
				if (!x.what) return;
				if (f.occ.value !== 'any') x.occ = f.occ.value;
				if (f.price.value !== '') x.price = +f.price.value;
				for (const k of ['note', 'link']) if (f[k].value.trim()) x[k] = f[k].value.trim();
				if (f.photo.files[0]) x.photo = await live.putSketch(await shrinkPhoto(f.photo.files[0], 1200));
				await c.save((d) => { (d.items = d.items || []).push(x); });
				f.reset(); msg.textContent = '';
				dlg.close();
			} catch (err) { msg.textContent = live.why(err); }
		};
	},
	click: (e, c) => {
		if (e.target.closest('[data-gw-add]')) { const d = $('.gw-modal'); d?.showModal(); if (matchMedia('(hover: hover)').matches) d?.querySelector('input')?.focus(); return; }
		const got = e.target.closest('[data-gw-got]'), claim = e.target.closest('[data-gw-claim]');
		if (got) return c.save((d) => { const x = (d.items || []).find((y) => y.id === got.dataset.gwGot); if (x) x.got = live.today(); }).catch((err) => alert(live.why(err)));
		if (claim) return c.save((d) => { const x = (d.items || []).find((y) => y.id === claim.dataset.gwClaim); if (x) x.claim = x.claim === live.me() ? undefined : x.claim || live.me(); }).catch((err) => alert(live.why(err)));
		/* a photo for an idea or a wish that's already on the list */
		const b = e.target.closest('[data-gi-photo]');
		if (!b || !live.canWrite()) return;
		const pick = document.createElement('input');
		pick.type = 'file'; pick.accept = 'image/*';
		pick.onchange = async () => {
			const file = pick.files[0];
			if (!file) return;
			b.disabled = true; b.classList.add('is-busy');
			try {
				const photo = await live.putSketch(await shrinkPhoto(file, 1200));
				await c.save((d) => { const x = (d.items || []).find((y) => y.id === b.dataset.giPhoto); if (x) x.photo = photo; });
			} catch (err) { alert(live.why(err)); b.disabled = false; b.classList.remove('is-busy'); }
		};
		pick.click();
	},
	empty: ['اكتب أول فكرة — محدش هيشوفها غيرك ♥', 'Write the first idea — only you will see it ♥'],
	related: ['gifts', 'birthday', 'wishes']
});
