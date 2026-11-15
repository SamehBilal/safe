/* Our family tree, on the family page. Two hand-drawn trees, his and hers, grow apart from the ground and lean back
   in at the top so the space between them makes a heart (after a hand-drawn «family tree with branches»
   illustration): the two of us hang inside it in oval portraits on strings, the boys hanging below us, and our
   parents, brothers and sisters are pink ribbons out on the branches among coral flowers and teal leaves. From the
   tenebrius «Family Tree» pen it keeps the rest: tap anyone for a card with their story; the tree keeps a spot for
   everyone in the family — his father and mother, two brothers and two sisters; her father and mother, brother and
   sister — shown as a dashed ribbon «waiting for a name» until it's filled from a phone (the shared list
   content/live/tree.bin, encrypted like the rest). The four of us come from story.json. */
import { L, Y, T, esc, img, App, $, $$, hydrate, age } from './shell.js';
import { doodle } from './doodles.js';
import * as live from './live.js';

const RELS = [
	{ id: 'father', ar: 'الأب', en: 'Father', of: ['أبو', 'father'], gone: 'الله يرحمه' },
	{ id: 'mother', ar: 'الأم', en: 'Mother', of: ['أم', 'mother'], gone: 'الله يرحمها' },
	{ id: 'brother', ar: 'أخ', en: 'Brother', of: ['أخو', 'brother'], gone: 'الله يرحمه' },
	{ id: 'sister', ar: 'أخت', en: 'Sister', of: ['أخت', 'sister'], gone: 'الله يرحمها' }
];
const rel = (id) => RELS.find((x) => x.id === id) || RELS[2];

/* the spots the tree keeps for each side, filled in this order */
const SLOTS = { him: { father: 1, mother: 1, brother: 2, sister: 2 }, her: { father: 1, mother: 1, brother: 1, sister: 1 } };

/** The four of us from story.json: the grown-ups (him, her) and the kids. */
function core(s) {
	const ms = s.family?.members || [];
	const grown = ms.filter((m) => !m.kid);
	return { him: grown[0], her: grown[1], kids: ms.filter((m) => m.kid) };
}

const colour = (side) => (side === 'her' ? '#c2185b' : '#0e6990');
const initials = (name) => [...String(name).trim()][0] || '♥';
/** "Sameh's father" / «أبو سامح» */
const relOf = (r, s, side) => { const x = rel(r); const n = App.t(side === 'her' ? s.her : s.him); return L(`${x.of[0]} ${n}`, `${n}’s ${x.of[1]}`); };

function face(p, member, size = 34) {
	if (p.photo) return img(p.photo, '', '');
	if (member) return `<span class="ft__face">${doodle(p.emoji || 'heart', size)}</span>`;
	return `<span class="ft__face"><span class="ft__init" aria-hidden="true">${esc(initials(p.name))}</span></span>`;
}

/* ---------- the drawing: two trees in a 1000 × 700 box ---------- */
const BARK = { him: '#5b3418', her: '#b8724f' };
/* where the ribbons sit on the left-hand tree (x, y, tilt); the right-hand tree is its mirror. Parents take the top two. */
const SPOTS_AT = [[205, 92, -7], [100, 168, 6], [238, 262, -4], [92, 330, 5], [252, 440, 4], [86, 512, -6], [226, 618, 3]];
const MED = { x: 420, y: 240 };          // where the left portrait hangs (top middle); the right one mirrors it
/* one tree, drawn as for the left side: trunk, branches, bark marks, leaves and flowers */
function oneTree(col) {
	const trunk = [
		['M462 702C468 640 360 570 350 470', 30],
		['M350 470C340 400 336 340 332 290', 24],
		['M332 290C322 210 350 150 400 136C450 122 486 150 478 226', 16]
	];
	const branches = [
		['M334 300C290 230 250 160 204 112', 11], ['M282 210C240 178 160 166 102 176', 7],
		['M336 380C300 330 270 292 240 270', 10], ['M296 330C222 334 152 342 94 336', 6],
		['M346 462C318 458 288 452 252 446', 10], ['M320 458C222 480 142 510 86 514', 6],
		['M412 600C362 614 282 626 222 626', 9], ['M346 200C330 176 322 150 326 122', 5]
	];
	const tips = [[204, 112], [102, 176], [240, 270], [94, 336], [252, 446], [86, 514], [222, 626], [326, 122], [478, 226]];
	// every piece of wood gets the journal's ink outline: a slightly wider ink stroke underneath
	const all = [...trunk, ...branches];
	return all.map(([d, w]) => `<path class="ftr-ink" d="${d}" stroke-width="${w + 3.5}"/>`).join('')
		+ all.map(([d, w]) => `<path class="ftr-wood" d="${d}" stroke="${col}" stroke-width="${w}"/>`).join('')
		+ trunk.map(([d]) => `<path class="ftr-bark" d="${d}"/>`).join('')
		+ tips.map(([x, y], i) => (i % 2 ? flower(x, y, i * 37) : leaves(x, y, i * 53))).join('')
		// and more along the branches, as the illustration has them
		+ [[300, 196, 'f'], [176, 166, 'l'], [292, 316, 'l'], [168, 338, 'f'], [298, 456, 'f'], [172, 494, 'l'], [300, 620, 'l'], [258, 616, 'f'], [372, 142, 'l'], [452, 132, 'f']]
			.map(([x, y, k], i) => (k === 'f' ? flower(x, y, i * 41) : leaves(x, y, 200 + i * 47))).join('');
}
const leaves = (x, y, r) => `<g class="ftr-leaf" transform="translate(${x} ${y}) rotate(${r % 360})"><path d="M0 0C-6-10-4-22 0-30C4-22 6-10 0 0Z"/><path d="M0 0C-12-4-20-14-22-22C-12-20-4-12 0 0Z"/><path d="M0 0C12-4 20-14 22-22C12-20 4-12 0 0Z"/></g>`;
const flower = (x, y, r) => `<g class="ftr-flower" transform="translate(${x} ${y}) rotate(${(r % 60) - 30}) scale(1.3)"><path class="ftr-leaf" d="M0 4C-10 0-16-6-18-12C-8-10-2-4 0 4ZM0 4C10 0 16-6 18-12C8-10 2-4 0 4Z"/><path d="M-12-6C-14-22-6-32 0-34C6-32 14-22 12-6C8 2-8 2-12-6Z"/><path class="ftr-petal" d="M-4-8C-6-20-2-28 0-30C2-28 6-20 4-8"/></g>`;
function art(left, right) {
	const mirror = 'matrix(-1 0 0 1 1000 0)';
	const string = (x1, y1, x2, y2) => `<path class="ftr-string" d="M${x1} ${y1}L${x2} ${y2}"/><path class="ftr-bow" d="M${x2} ${y2 - 4}l-6-5v10ZM${x2} ${y2 - 4}l6-5v10Z"/>`;
	return `<svg class="ftr__art" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
		<path class="ftr-ground" d="M300 700C420 690 580 690 700 700"/>
		<g>${oneTree(BARK[left])}</g><g transform="${mirror}">${oneTree(BARK[right])}</g>
		${string(MED.x, 131, MED.x, 236)}${string(1000 - MED.x, 131, 1000 - MED.x, 236)}
	</svg>`;
}

/** A relative's ribbon on a branch. */
function ribbon(s, p, side, [x, y, r]) {
	return `<button type="button" class="ftr-rib${p.gone ? ' is-gone' : ''}" data-open="${esc(p.id)}" data-side="${side}" style="--x:${x / 10}%;--y:${y / 7}%;--r:${r}deg">
		<b dir="auto">${esc(p.name)}${p.gone ? ' ♡' : ''}</b><small dir="auto">${esc(relOf(p.rel, s, side))}</small></button>`;
}
/** A ribbon still waiting for a name: tap it to fill it in. */
function emptyRibbon(s, side, r, [x, y, rot]) {
	const ok = live.canWrite();
	return `<button type="button" class="ftr-rib is-empty" data-slot="${side}|${r}" data-side="${side}" style="--x:${x / 10}%;--y:${y / 7}%;--r:${rot}deg"${ok ? '' : ' disabled'}>
		<b>${esc(relOf(r, s, side))}</b><small>${ok ? Y('دوس واكتب الاسم', 'دوسي واكتبي الاسم', 'Tap to add the name') : L('لسه من غير اسم', 'No name yet')}</small></button>`;
}
/** One of us (or the boys) in an oval portrait hanging from the tree. */
function medallion(m, side, cls, x, y) {
	return `<button type="button" class="ftr-med ${cls}" data-open="${esc(m.id)}" data-side="${side}" style="--x:${x / 10}%;--y:${y / 7}%;--c:${esc(m.color || colour(side))}">
		<b dir="auto">${esc(App.t(m.name))}</b><span class="ftr-med__pic">${face(m, true, cls === 'ftr-med--kid' ? 30 : 44)}</span>
		${m.kid && m.born ? `<small>${esc(age(m.born))}</small>` : ''}</button>`;
}

export function treeHTML(s) {
	const ok = live.canWrite();
	const { him, her } = core(s);
	return `<section class="ftree reveal" aria-labelledby="ft-h">
		<h2 class="sec__title" id="ft-h">${L('شجرة عيلتنا', 'Our family tree')}</h2>
		<div class="ft__scroll"><div class="ftr" id="ft"><div class="ftr__art-box" id="ft-art"></div><div class="ftr__layer" id="ft-rows"></div></div></div>
		<div class="ftr-more" id="ft-more" hidden></div>
		${ok && him && her ? `<details class="composer narrow ft__add" id="ft-add">
			<summary><span>${doodle('family', 22)}</span> ${Y('ضيف حد للشجرة', 'ضيفي حد للشجرة', 'Add someone to the tree')}</summary>
			<form id="ft-form" autocomplete="off">
				<div class="f-row">
					<label class="f f--grow"><span>${L('الاسم', 'Name')}</span><input name="name" dir="auto" maxlength="40" required></label>
					<label class="f"><span>${L('يبقى إيه؟', 'Who are they?')}</span><select name="rel">${RELS.map((r) => `<option value="${r.id}">${esc(L(r.ar, r.en))}</option>`).join('')}</select></label>
				</div>
				<div class="f-row">
					<label class="f"><span>${L('من ناحية مين؟', 'On whose side?')}</span><select name="side"><option value="him">${T(him.name)}</option><option value="her">${T(her.name)}</option></select></label>
					<label class="f"><span>${L('سنة الميلاد (اختياري)', 'Year born (optional)')}</span><input name="born" type="number" inputmode="numeric" min="1900" max="2100"></label>
				</div>
				<label class="f"><span>${L('كلمة عنه أو عنها (اختياري)', 'A line about them (optional)')}</span><input name="note" dir="auto" maxlength="200"></label>
				<label class="check"><input type="checkbox" name="gone"> ${L('الله يرحمه / يرحمها', 'In loving memory')}</label>
				<p class="form-msg" id="ft-msg" role="status"></p>
				<div class="f-actions"><button type="submit" class="btn btn--coral">${L('على الشجرة ♥', 'Onto the tree ♥')}</button></div>
			</form>
		</details>` : ''}
		<div class="ft-card" id="ft-card" hidden></div>
	</section>`;
}

export async function wireTree(main, s) {
	const ft = $('#ft', main);
	if (!ft) return;
	const rows = $('#ft-rows', main), card = $('#ft-card', main), more = $('#ft-more', main);
	const { him, her, kids } = core(s);
	if (!him || !her) { ft.closest('.ftree').hidden = true; return; }
	let data = { items: [] };

	const draw = () => {
		const items = data.items || [];
		// his tree on the side we start reading from, hers on the other
		const rtl = document.documentElement.dir === 'rtl';
		const leftSide = rtl ? 'her' : 'him', rightSide = rtl ? 'him' : 'her';
		$('#ft-art', main).innerHTML = art(leftSide, rightSide);
		const at = (side, i) => { const [x, y, r] = SPOTS_AT[i]; return side === leftSide ? [x, y, r] : [1000 - x, y, -r]; };
		const out = [], extra = [];
		for (const side of ['him', 'her']) {
			// parents first (they take the top branches), then brothers and sisters, eldest first; empty spots after
			const list = [];
			for (const r of ['father', 'mother', 'brother', 'sister']) {
				const got = items.filter((p) => p.side === side && p.rel === r).sort((a, b) => (+a.born || 9999) - (+b.born || 9999));
				got.forEach((p) => list.push({ p, r }));
				for (let k = got.length; k < (SLOTS[side][r] || 0); k++) list.push({ r });
			}
			list.forEach((x, i) => {
				if (i < SPOTS_AT.length) out.push(x.p ? ribbon(s, x.p, side, at(side, i)) : emptyRibbon(s, side, x.r, at(side, i)));
				else if (x.p) extra.push(x);
			});
		}
		// the two of us hang inside the heart, the boys below us
		const medX = (side) => (side === leftSide ? MED.x : 1000 - MED.x);
		out.push(medallion(him, 'him', 'ftr-med--us', medX('him'), MED.y), medallion(her, 'her', 'ftr-med--us', medX('her'), MED.y));
		out.push(`<span class="ftr-heart" aria-hidden="true">♥</span>`);
		const n = kids.length;
		kids.forEach((k, i) => out.push(medallion(k, '', 'ftr-med--kid', 500 + (i - (n - 1) / 2) * Math.min(92, 230 / Math.max(n, 1)), 450)));
		if (n) out.push(`<svg class="ftr__kidstrings" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${kids.map((k, i) => { const x = 500 + (i - (n - 1) / 2) * Math.min(92, 230 / Math.max(n, 1)); return `<path class="ftr-string" d="M500 372Q${(500 + x) / 2} 400 ${x.toFixed(1)} 446"/>`; }).join('')}</svg>`);
		rows.innerHTML = out.join('');
		// anyone beyond the tree's spots gets a ribbon underneath
		more.hidden = !extra.length;
		more.innerHTML = extra.map(({ p }) => `<button type="button" class="ftr-rib ftr-rib--flat${p.gone ? ' is-gone' : ''}" data-open="${esc(p.id)}"><b dir="auto">${esc(p.name)}</b><small dir="auto">${esc(relOf(p.rel, s, p.side))}</small></button>`).join('');
		hydrate(rows);
	};

	/* the person's card, like the pen's modal: a big arch portrait, the name, who they are, and a line about them */
	let back = null;
	const closeCard = () => { card.hidden = true; card.innerHTML = ''; back?.focus({ preventScroll: true }); };
	function openCard(id, from) {
		const member = [him, her, ...kids].find((m) => m.id === id);
		const p = member || (data.items || []).find((x) => x.id === id);
		if (!p) return;
		back = from;
		const side = member ? (p === her ? 'her' : p === him ? 'him' : '') : p.side;
		const name = member ? App.t(p.name) : p.name;
		const who = member ? (p.kid && p.born ? age(p.born) : App.t(p.role)) : relOf(p.rel, s, side);
		const born = p.born ? String(p.born).slice(0, 4) : '';
		const mine = !member && live.canWrite() && (p.by === live.me() || !p.by);
		card.style.setProperty('--c', p.color || colour(side));
		card.innerHTML = `<div class="ft-card__box" role="dialog" aria-modal="true" aria-labelledby="ft-card-h">
			<button class="ft-card__x" type="button" aria-label="${Y('اقفل', 'اقفلي', 'Close')}">✕</button>
			<div class="ft-card__pic"><span class="ft__pic">${face(p, !!member, 60)}</span></div>
			<h3 id="ft-card-h" dir="auto">${esc(name)}</h3>
			<p class="ft-card__rel" dir="auto">${esc([who, born && !p.kid ? L(`مواليد ${born}`, `born ${born}`) : ''].filter(Boolean).join(' · '))}</p>
			${p.gone ? `<p class="ft-card__rel">♡ ${member ? L('الله يرحمه', 'In loving memory') : L(rel(p.rel).gone, 'In loving memory')}</p>` : ''}
			${p.note ? `<p class="ft-card__note" dir="auto">${esc(p.note)}</p>` : ''}
			<div class="ft-card__acts">
				${member ? `<a class="btn btn--sm btn--coral" href="member.html?id=${esc(p.id)}">${L('صفحته', 'Their page')} ${App.arrow}</a>` : ''}
				${mine ? `<button class="link link--danger" type="button" data-untree="${esc(p.id)}">${Y('شيله من الشجرة', 'شيليه من الشجرة', 'Take off the tree')}</button>` : ''}
			</div>
		</div>`;
		hydrate(card);
		card.hidden = false;
		$('.ft-card__x', card).focus({ preventScroll: true });
	}
	card.addEventListener('click', async (e) => {
		if (e.target === card || e.target.closest('.ft-card__x')) return closeCard();
		const b = e.target.closest('[data-untree]');
		if (!b || !confirm(Y('تشيله من الشجرة؟', 'تشيليه من الشجرة؟', 'Take them off the tree?'))) return;
		try { data = await live.save('tree', (d) => { d.items = (d.items || []).filter((p) => p.id !== b.dataset.untree); }); closeCard(); draw(); } catch (err) { alert(live.why(err)); }
	});
	card.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });

	const form = $('#ft-form', main);
	more.addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) openCard(o.dataset.open, o); });
	rows.addEventListener('click', (e) => {
		const open = e.target.closest('[data-open]');
		if (open) return openCard(open.dataset.open, open);
		const slot = e.target.closest('[data-slot]');
		if (slot && form) {
			// an empty spot: the form opens already knowing who it's for, waiting for the name
			const [side, r] = slot.dataset.slot.split('|');
			$('#ft-add', main).open = true;
			form.side.value = side;
			form.rel.value = r;
			form.scrollIntoView({ behavior: 'smooth', block: 'center' });
			setTimeout(() => form.name.focus({ preventScroll: true }), 350);
		}
	});
	if (form) form.onsubmit = async (e) => {
		e.preventDefault();
		const msg = $('#ft-msg', main);
		const p = { id: live.newId(), name: form.name.value.trim(), rel: form.rel.value, side: form.side.value, born: +form.born.value || undefined, note: form.note.value.trim() || undefined, gone: form.gone.checked || undefined, by: live.me(), at: Date.now() };
		if (!p.name) return;
		try { data = await live.save('tree', (d) => { (d.items = d.items || []).push(p); }); form.reset(); msg.textContent = L('اتضاف للشجرة ♥', 'On the tree ♥'); draw(); }
		catch (err) { msg.textContent = live.why(err); }
	};

	draw();
	data = await live.load('tree').catch(() => ({ items: [] }));
	draw();
}
