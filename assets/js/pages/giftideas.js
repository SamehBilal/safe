import { L, Y, esc, $, App } from '../shell.js';
import { doodle } from '../doodles.js';
import { ctxOf } from '../listpage.js';
import * as live from '../live.js';
import { shrinkPhoto } from './trips.js';

/* Gift ideas — a section of «هدايانا» (gifts.js) now, two lists in it.
   «نفسي في» — the wish list: what each of us would love to get, written by the one who wants it. Whoever writes a wish
   picks who sees it: everyone, only the other one, or just them (a note to self for now). The others can quietly say
   «أنا هجيبها 🤫» — the one who wished never sees who's getting it, so it stays a surprise — and the wisher ticks
   «وصلتني ♥» once it arrives.
   «أفكاري السرية» — each of us keeps ideas for the other through the year. This phone only shows the ideas its owner
   wrote, so the other one doesn't stumble on them. Each idea or wish has its photo beside it, taped on like a polaroid
   (a wrapped box until one's added — tap it to add one).
   Both travel between the phones in the same list (wishes are the entries with type 'wish').
   (giftideas.html, the page it used to be, sends you to gifts.html#gi.) */

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

const KIDS_OPTS = (s) => [['other', L('للتاني', 'For my other half')], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, App.t(k.name)])];
const OCC_OPTS = () => [['any', L('أي وقت', 'Any time')], ...Object.entries(OCC())];

function ideaCard(x, c) {
	return `<article class="lp-card gi-card${x.given ? ' is-done' : ''}">
		${pic(x, x.idea)}
		<div class="gi-tx">
		<p class="lp-k">${x.for === 'other' || !x.for ? L('للتاني', 'For my other half') : esc(c.kidName(x.for))}${x.occ && x.occ !== 'any' ? ` · ${esc(OCC()[x.occ] || '')}` : ''}${x.price ? ` · ${esc(x.price)} ${L('ج', 'EGP')}` : ''}</p>
		<h3 dir="auto">${esc(x.idea)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.link ? `<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${L('اللينك', 'Link')} ↗</a>` : ''}
		${live.canWrite() ? `<button class="btn btn--sm ${x.given ? 'btn--ghost' : 'btn--coral'}" type="button" data-gi-given="${esc(x.id)}">${x.given ? `✓ ${L('اتجابت', 'Given')} · ${c.date(x.given)}` : Y('جبتها ✓', 'جبتها ✓', 'Given ✓')}</button>` : ''}
		${c.del(x)}
		</div>
	</article>`;
}

/** The wishes and the secret ideas, as a section of «هدايانا» (gifts.js). */
export function ideasSection(s) {
	const ok = live.canWrite();
	const opt = (list) => list.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
	return `<div id="gi">
		<div id="gi-top"></div>
		<details class="composer" id="gi-add"${ok ? '' : ' hidden'}>
			<summary><span>${doodle('gift', 22)}</span> ${Y('ضيف فكرة سرية', 'ضيفي فكرة سرية', 'Add a secret idea')}</summary>
			<form id="gi-form" autocomplete="off">
				<div class="f-row">
					<label class="f"><span>${L('لمين؟', 'For whom?')}</span><select name="for">${opt(KIDS_OPTS(s))}</select></label>
					<label class="f f--grow"><span>${L('الفكرة', 'The idea')}</span><input name="idea" dir="auto" maxlength="140" required></label>
				</div>
				<div class="f-row">
					<label class="f"><span>${L('لمناسبة إيه؟', 'For what?')}</span><select name="occ">${opt(OCC_OPTS())}</select></label>
					<label class="f"><span>${L('سعرها تقريبًا', 'Rough price')}</span><input name="price" type="number" min="0" step="any" inputmode="decimal"></label>
				</div>
				<label class="f"><span>${L('ملاحظة (المقاس، اللون…)', 'Note (size, colour…)')}</span><input name="note" dir="auto" maxlength="200"></label>
				<label class="f"><span>${L('لينك (اختياري)', 'Link (optional)')}</span><input name="link" type="url" dir="ltr"></label>
				<label class="f"><span>${L('صورتها (اختياري)', 'A photo of it (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
				<p class="muted">${L('الأفكار دي بتبان على موبايلك إنت بس ♥', 'These only show on your own phone ♥')}</p>
				<p class="form-msg" id="gi-msg" role="status"></p>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
			</form>
		</details>
		<div class="lp-list lp-list--giftideas" id="gi-list"></div>
	</div>`;
}

/** Its workings: the list «giftideas» — my own ideas, and the wishes I wrote or may see. `shared` are the old shared ideas
    kept on the gifts list itself (entries with `idea`), shown with mine. */
export async function ideasAfter(main, s, shared = () => []) {
	const c = ctxOf(s);
	let data = await live.load('giftideas').catch(() => ({ items: [] }));
	const me = live.me();
	const keep = (x) => (isWish(x) ? x.by === me || (x.see || 'all') !== 'me' : x.by === me);
	const paint = () => {
		const items = (data.items || []).filter(keep);
		$('#gi-top', main).innerHTML = wishesHTML(items, c);
		const ideas = items.filter((x) => !isWish(x)).sort((a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0) || (b.at || 0) - (a.at || 0));
		const old = shared();
		$('#gi-list', main).innerHTML = ideas.map((x) => ideaCard(x, c)).join('') + old.map((g) => `<article class="lp-card gi-card"><span class="gi-pic gi-pic--empty"><span class="gi-box" aria-hidden="true"><i class="gi-lid"></i><b>?</b></span><small>${L('فكرة مشتركة', 'A shared idea')}</small></span><div class="gi-tx"><p class="lp-k">${g.to ? `${L('لـ', 'For ')}${esc(g.to)}` : L('فكرة مشتركة', 'A shared idea')}</p><h3 dir="auto">${esc(g.what)}</h3>${live.canWrite() ? `<button class="btn btn--sm btn--coral" type="button" data-given="${esc(g.id)}">${L('اتجابت ✓', 'Given ✓')}</button>` : ''}</div></article>`).join('')
			|| `<p class="empty">${L('اكتب أول فكرة — محدش هيشوفها غيرك ♥', 'Write the first idea — only you will see it ♥')}</p>`;
		live.hydrateSketches($('#gi', main));
	};
	c.save = async (fn) => { data = await live.save('giftideas', fn); paint(); };
	c.repaint = paint;
	paint();

	/* the wish form: a window of its own */
	if (live.canWrite()) {
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
					<label class="f"><span>${L('لمناسبة إيه؟', 'For what?')}</span><select name="occ">${OCC_OPTS().map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>
					<label class="f"><span>${L('سعرها تقريبًا', 'Rough price')}</span><input name="price" type="number" min="0" step="any" inputmode="decimal"></label>
				</div>
				<label class="f"><span>${L('ملاحظة (المقاس، اللون، المكان…)', 'Note (size, colour, where to find it…)')}</span><input name="note" dir="auto" maxlength="200"></label>
				<label class="f"><span>${L('لينك (اختياري)', 'Link (optional)')}</span><input name="link" type="url" dir="ltr"></label>
				<label class="f"><span>${L('صورتها (اختياري)', 'A photo of it (optional)')}</span><input name="photo" type="file" accept="image/*"></label>
				<p class="form-msg" id="gw-msg" role="status"></p>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظ ♥', 'احفظي ♥', 'Save ♥')}</button></div>
			</form></div>`;
		$('#gi', main).append(dlg);
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
		const gf = $('#gi-form', main);
		gf.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#gi-msg', main);
			try {
				msg.textContent = L('بنحفظ…', 'Saving…');
				const x = { id: live.newId(), for: gf.for.value, idea: gf.idea.value.trim(), by: me, at: Date.now() };
				if (!x.idea) return;
				if (gf.occ.value !== 'any') x.occ = gf.occ.value;
				if (gf.price.value !== '') x.price = +gf.price.value;
				for (const k of ['note', 'link']) if (gf[k].value.trim()) x[k] = gf[k].value.trim();
				if (gf.photo.files[0]) x.photo = await live.putSketch(await shrinkPhoto(gf.photo.files[0], 1200));
				await c.save((d) => { (d.items = d.items || []).push(x); });
				gf.reset(); msg.textContent = L('اتحفظت ♥', 'Saved ♥');
			} catch (err) { msg.textContent = live.why(err); }
		};
	}

	$('#gi', main).addEventListener('click', async (e) => {
		if (e.target.closest('[data-gw-add]')) { const d = $('.gw-modal', main); d?.showModal(); if (matchMedia('(hover: hover)').matches) d?.querySelector('input')?.focus(); return; }
		const got = e.target.closest('[data-gw-got]'), claim = e.target.closest('[data-gw-claim]'), given = e.target.closest('[data-gi-given]'), del = e.target.closest('[data-del]');
		try {
			if (got) return await c.save((d) => { const x = (d.items || []).find((y) => y.id === got.dataset.gwGot); if (x) x.got = live.today(); });
			if (claim) return await c.save((d) => { const x = (d.items || []).find((y) => y.id === claim.dataset.gwClaim); if (x) x.claim = x.claim === me ? undefined : x.claim || me; });
			if (given) return await c.save((d) => { const x = (d.items || []).find((y) => y.id === given.dataset.giGiven); if (x) x.given = x.given ? undefined : live.today(); });
			if (del && (data.items || []).some((x) => x.id === del.dataset.del)) {
				e.stopPropagation();
				if (confirm(Y('تمسحها؟', 'تمسحيها؟', 'Delete it?'))) await c.save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
				return;
			}
		} catch (err) { alert(live.why(err)); }
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
	}, true);
	return { repaint: paint };
}
