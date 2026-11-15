import { L, Y, t, esc, App, $, $$, qs, longDate, REDUCE, getKey } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { deriveKek, importMaster, open, fromB64 } from '../core.js';

/* Our room: the page behind a PIN. Not in any menu — Settings has the door.
   content/secret.bin is sealed with the site's key; inside, the list is sealed again with a key that only the PIN unwraps
   (tools/secret.mjs). The PIN is asked every time the page opens, and the page locks itself when the phone sleeps.
   What we mark (tried, want to try, favourite) and the nights we log go in the shared list «secret» as ids only. */

const COLORS = ['#c2185b', '#8e1f4f', '#f2726f', '#e39b2d', '#8e5bd1', '#13789f', '#5a9e6f', '#f59a7b'];
const LEVEL = { 1: ['سهل', 'Easy', '#5a9e6f'], 2: ['محتاج تركيز', 'Careful', '#e39b2d'], 3: ['صعب', 'Hard', '#c2185b'] };
const TAGS = {
	'woman on top': ['هي فوق', 'Her on top'], 'man on top': ['هو فوق', 'Him on top'], 'from behind': ['من ورا', 'From behind'],
	'rear entry': ['من ورا', 'Rear entry'], 'face to face': ['وش لوش', 'Face to face'], standing: ['واقفين', 'Standing'],
	sitting: ['قاعدين', 'Sitting'], kneeling: ['على الركب', 'Kneeling'], 'lying down': ['نايمين', 'Lying down'],
	'oral sex': ['بالبُق', 'Oral'], cunnilingus: ['ليها هي', 'For her (oral)'], blowjob: ['ليه هو', 'For him (oral)'],
	'69 sex position': ['٦٩', '69'], 'doggy style': ['دوجي', 'Doggy'], cowgirl: ['كاوجيرل', 'Cowgirl'], reverse: ['بالعكس', 'Reverse'],
	sideways: ['على الجنب', 'Sideways'], spooning: ['في حضن بعض', 'Spooning'], 'criss cross': ['متقاطعين', 'Criss-cross'],
	'right angle': ['زاوية قايمة', 'Right angle'], 'anal sex': ['من الخلف (آنال)', 'Anal']
};
const FILTERS = ['woman on top', 'man on top', 'face to face', 'from behind', 'standing', 'sitting', 'lying down', 'oral sex', 'cowgirl', 'doggy style', 'spooning', 'anal sex'];
const LISTS = [
	{ id: 'outfit', emoji: 'dress', color: '#c2185b', ar: 'لبس الليلة', en: 'Tonight’s outfit' },
	{ id: 'games', emoji: 'dice', color: '#8e1f4f', ar: 'لعبة الليلة', en: 'Tonight’s game' }
];
const PAGE = 60;

let skey = null; // the secret key, only while the page is open and unlocked
const urls = new Map();
const photo = (id) => {
	if (!urls.has(id)) urls.set(id, (async () => {
		const r = await fetch(`content/secret/s/${id}.bin`);
		if (!r.ok) throw new Error('missing');
		return URL.createObjectURL(new Blob([await open(skey, fromB64((await r.text()).trim()))], { type: 'image/jpeg' }));
	})());
	return urls.get(id);
};
const hydrate = (root) => $$('img[data-secret]:not([src])', root).forEach((el) => photo(el.dataset.secret).then((u) => { el.src = u; }).catch(() => el.remove()));

export default {
	title: { ar: 'أوضتنا', en: 'Our room' },
	render() {
		return `<section class="sx" id="sx">
			<div class="sx-lock" id="sx-lock">
				<span class="sx-lock__e" aria-hidden="true">${doodle('lock', 56)}</span>
				<h1>${L('أوضتنا', 'Our room')}</h1>
				<p>${L('لينا إحنا الاتنين بس — اكتبوا الرقم السري', 'Just for the two of us — enter the PIN')}</p>
				<form id="sx-form" autocomplete="off">
					<input id="sx-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" aria-label="${L('الرقم السري', 'PIN')}" dir="ltr" required>
					<button class="btn btn--coral" type="submit">${L('افتح', 'Open')}</button>
				</form>
				<p class="form-msg" id="sx-msg" role="status"></p>
				<a class="link" href="settings.html">${L('رجوع', 'Back')}</a>
			</div>
			<div id="sx-room" hidden></div>
		</section>`;
	},

	async after(main, s) {
		skey = null;
		const msg = $('#sx-msg', main);
		let env = null;
		try {
			const r = await fetch('content/secret.bin', { cache: 'no-store' });
			if (!r.ok) throw new Error();
			env = JSON.parse(new TextDecoder().decode(await open(getKey(), fromB64((await r.text()).trim()))));
		} catch { msg.textContent = L('الأوضة مش موجودة لسه على الموقع', 'The room isn’t on the site yet'); return; }

		const lock = () => {
			skey = null;
			urls.forEach((p) => p.then((u) => URL.revokeObjectURL(u)).catch(() => {}));
			urls.clear();
			$('#sx-room', main).innerHTML = '';
			$('#sx-room', main).hidden = true;
			$('#sx-lock', main).hidden = false;
			$('#sx-pin', main).value = '';
			document.body.classList.remove('is-sx');
		};
		document.addEventListener('visibilitychange', () => { if (document.hidden && skey) lock(); });

		$('#sx-form', main).onsubmit = async (e) => {
			e.preventDefault();
			const pin = $('#sx-pin', main).value.trim();
			msg.textContent = L('بنفتح…', 'Opening…');
			try {
				const kek = await deriveKek([pin], fromB64(env.salt), env.iter);
				skey = await importMaster(await open(kek, fromB64(env.wrapped)));
				const data = JSON.parse(new TextDecoder().decode(await open(skey, fromB64(env.data))));
				msg.textContent = '';
				$('#sx-lock', main).hidden = true;
				document.body.classList.add('is-sx');
				await room(main, s, data, lock);
			} catch {
				skey = null;
				msg.textContent = L('الرقم غلط', 'Wrong PIN');
				navigator.vibrate?.(120);
				$('#sx-pin', main).select();
			}
		};
		$('#sx-pin', main).focus();
	}
};

async function room(main, s, data, lock) {
	const box = $('#sx-room', main);
	const init = () => ({ items: [], nights: [] });
	let mine = await live.load('secret', init);
	mine.items = mine.items || [];
	mine.nights = mine.nights || [];
	const ok = live.canWrite();
	const name = (w) => App.t(w === 'him' ? s.him : s.her);
	const mark = (id) => mine.items.find((x) => x.id === id) || {};
	const P = data.positions || [];
	const lists = data.lists || {};

	const tab = qs('t') || 'pos';
	box.innerHTML = `
		<header class="sx-head">
			<h1>${doodle('love', 34)} ${L('أوضتنا', 'Our room')}</h1>
			<button type="button" class="btn btn--sm btn--ghost" id="sx-close">${doodle('lock', 18)} ${L('اقفل', 'Lock')}</button>
		</header>
		<nav class="chips kinds-tabs sx-tabs" role="tablist">
			<button type="button" class="chip" data-tab="pos" style="--c:#c2185b">${doodle('heart', 18)} ${L('الأوضاع', 'Positions')} <small>${P.length}</small></button>
			${LISTS.map((k) => `<button type="button" class="chip" data-tab="${k.id}" style="--c:${k.color}">${doodle(k.emoji, 18)} ${esc(L(k.ar, k.en))} <small>${(lists[k.id] || []).length}</small></button>`).join('')}
			<button type="button" class="chip" data-tab="nights" style="--c:#8e5bd1">${doodle('moon', 18)} ${L('ليالينا', 'Our nights')} <small id="sx-nn"></small></button>
		</nav>
		<div class="sx-pane" id="sx-pane"></div>`;
	$('#sx-close', box).onclick = lock;
	box.hidden = false;

	const panes = {
		pos: positions,
		outfit: () => wheel(LISTS[0]),
		games: () => wheel(LISTS[1]),
		nights
	};
	const show = (id) => {
		$$('[data-tab]', box).forEach((b) => b.classList.toggle('is-on', b.dataset.tab === id));
		panes[id]();
	};
	$$('[data-tab]', box).forEach((b) => { b.onclick = () => show(b.dataset.tab); });
	const countNights = () => { $('#sx-nn', box).textContent = mine.nights.length || ''; };
	countNights();
	show(panes[tab] ? tab : 'pos');

	async function setMark(id, key) {
		mine = await live.save('secret', (d) => {
			d.items = d.items || [];
			let x = d.items.find((y) => y.id === id);
			if (!x) d.items.push((x = { id }));
			x[key] = x[key] ? 0 : 1;
			if (!x.tried && !x.want && !x.fav) d.items = d.items.filter((y) => y.id !== id);
		}, init);
	}
	async function logNight(ref, hearts) {
		mine = await live.save('secret', (d) => { (d.nights = d.nights || []).push({ id: live.newId(), ref, date: live.today(), by: live.me(), hearts: hearts || undefined, at: Date.now() }); }, init);
		countNights();
	}
	const refName = (ref) => {
		const [kind, id] = ref.split(':');
		if (kind === 'p') { const p = P.find((x) => String(x.n) === id); return p ? `${p.n}. ${p.name}` : ref; }
		const x = (lists[kind] || []).find((y) => y.id === id);
		return x ? t(x.text) : ref;
	};

	/* ---- positions ---- */
	function positions() {
		const pane = $('#sx-pane', box);
		let shown = PAGE;
		pane.innerHTML = `
			<div class="sx-tools">
				<input type="search" id="sx-q" dir="auto" placeholder="${L('دوّر بالاسم أو الرقم…', 'Search by name or number…')}">
				<select id="sx-lvl" aria-label="${L('الصعوبة', 'Difficulty')}"><option value="">${L('أي صعوبة', 'Any difficulty')}</option>${Object.entries(LEVEL).map(([k, v]) => `<option value="${k}">${esc(L(v[0], v[1]))}</option>`).join('')}</select>
				<select id="sx-mk" aria-label="${L('علاماتنا', 'Our marks')}">
					<option value="">${L('الكل', 'All')}</option><option value="want">${L('عايزين نجربها', 'Want to try')}</option><option value="tried">${L('جربناها', 'Tried')}</option><option value="fav">${L('المفضلة', 'Favourites')}</option><option value="new">${L('لسه ما جربناهاش', 'Not tried yet')}</option>
				</select>
			</div>
			<div class="chips sx-tags">${FILTERS.map((f) => `<button type="button" class="chip" data-f="${esc(f)}">${esc(L(...TAGS[f]))}</button>`).join('')}</div>
			<div class="sx-pick"><button type="button" class="btn btn--coral" id="sx-rand">${doodle('dice', 20)} ${L('اختارولنا واحد من اللي ظاهرين', 'Pick one of these for us')}</button></div>
			<div class="sx-result" id="sx-res" hidden aria-live="polite"></div>
			<p class="muted sx-count" id="sx-count"></p>
			<div class="sx-grid" id="sx-grid"></div>
			<div class="sx-more"><button type="button" class="btn btn--ghost" id="sx-more">${L('كمان', 'More')}</button></div>
			<p class="muted sx-src">${L('الصور والشرح من', 'Pictures and how-to from')} <a href="${esc(data.source || '#')}" target="_blank" rel="noopener noreferrer">sexpositions.club</a></p>`;
		const on = new Set();
		const filtered = () => {
			const q = $('#sx-q', pane).value.trim().toLowerCase();
			const lvl = $('#sx-lvl', pane).value, mk = $('#sx-mk', pane).value;
			return P.filter((p) => {
				if (q && !(`${p.n}` === q || p.name.toLowerCase().includes(q) || p.tags.some((g) => g.includes(q) || L(...(TAGS[g] || [g, g])).includes(q)))) return false;
				if (lvl && String(p.level) !== lvl) return false;
				for (const f of on) if (!p.tags.includes(f) && !(f === 'from behind' && p.tags.includes('rear entry'))) return false;
				const m = mark('p' + p.n);
				if (mk === 'new') return !m.tried;
				if (mk && !m[mk]) return false;
				return true;
			});
		};
		const card = (p) => {
			const m = mark('p' + p.n), lv = LEVEL[p.level];
			return `<article class="sx-card" data-n="${p.n}">
				<a class="sx-card__img" href="https://sexpositions.club/positions/${p.n}.html" target="_blank" rel="noopener noreferrer"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer"></a>
				<div class="sx-card__b">
					<b dir="ltr">${p.n}. ${esc(p.name)}</b>
					${lv ? `<span class="sx-lvl" style="--c:${lv[2]}">${esc(L(lv[0], lv[1]))}</span>` : ''}
					<small>${p.tags.filter((g) => TAGS[g]).slice(0, 4).map((g) => esc(L(...TAGS[g]))).join(' · ')}</small>
					<div class="sx-marks">
						<button type="button" data-mk="want" class="${m.want ? 'is-on' : ''}" title="${L('عايزين نجربها', 'Want to try')}">🔖</button>
						<button type="button" data-mk="tried" class="${m.tried ? 'is-on' : ''}" title="${L('جربناها', 'Tried it')}">✓</button>
						<button type="button" data-mk="fav" class="${m.fav ? 'is-on' : ''}" title="${L('المفضلة', 'Favourite')}">♥</button>
					</div>
				</div>
			</article>`;
		};
		const paint = () => {
			const list = filtered();
			$('#sx-count', pane).textContent = L(`${list.length} وضع`, `${list.length} positions`);
			$('#sx-grid', pane).innerHTML = list.slice(0, shown).map(card).join('') || `<p class="empty">${L('مفيش حاجة بالشكل ده', 'Nothing like that')}</p>`;
			$('#sx-more', pane).hidden = list.length <= shown;
		};
		const again = () => { shown = PAGE; paint(); };
		$('#sx-q', pane).oninput = again;
		$('#sx-lvl', pane).onchange = again;
		$('#sx-mk', pane).onchange = again;
		$$('[data-f]', pane).forEach((b) => { b.onclick = () => { b.classList.toggle('is-on'); on.has(b.dataset.f) ? on.delete(b.dataset.f) : on.add(b.dataset.f); again(); }; });
		$('#sx-more', pane).onclick = () => { shown += PAGE; paint(); };
		pane.onclick = async (e) => {
			const b = e.target.closest('[data-mk]');
			if (!b) return;
			if (!ok) return alert(live.why({ code: 'setup' }));
			const n = b.closest('[data-n]').dataset.n;
			try { await setMark('p' + n, b.dataset.mk); b.classList.toggle('is-on', !!mark('p' + n)[b.dataset.mk]); }
			catch (err) { alert(live.why(err)); }
		};
		$('#sx-rand', pane).onclick = () => {
			const list = filtered();
			if (!list.length) return;
			const p = list[Math.floor(Math.random() * list.length)];
			result($('#sx-res', pane), `<div class="sx-grid sx-grid--one">${card(p)}</div>`, 'p:' + p.n);
		};
		paint();
	}

	/* ---- the outfit and game wheels (moved here from the draw) ---- */
	function wheel(k) {
		const pane = $('#sx-pane', box);
		const items = lists[k.id] || [];
		pane.innerHTML = `
			<div class="draw" style="--c:${k.color}">
				<div class="wheel-box"><div class="wheel"><span class="wheel__pin" aria-hidden="true"></span><div class="wheel__disc" id="sx-disc"></div><button class="wheel__hub" type="button" id="sx-spin">${Y('لف', 'لفّي', 'Spin')}</button></div></div>
				<div class="sx-result result" id="sx-res" hidden aria-live="polite"></div>
			</div>
			<ul class="pool sx-pool">${items.map((x) => `<li class="has-img">${x.img ? `<img class="pool__img zoom" data-secret="${esc(x.img)}" alt="${esc(t(x.text))}">` : ''}<span dir="auto">${esc(t(x.text))}</span></li>`).join('')}</ul>`;
		hydrate(pane);
		const disc = $('#sx-disc', pane);
		const n = items.length, seg = 360 / Math.max(1, n), R = 150;
		const pt = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [R + r * Math.cos(a), R + r * Math.sin(a)]; };
		const short = (x) => (x.length > 16 ? x.slice(0, 15) + '…' : x);
		disc.innerHTML = n ? `<svg viewBox="0 0 300 300" aria-hidden="true" style="direction:ltr">${items.map((x, i) => {
			const [x0, y0] = pt(i * seg, R), [x1, y1] = pt((i + 1) * seg, R), mid = i * seg + seg / 2;
			const path = n === 1 ? `<circle cx="${R}" cy="${R}" r="${R}" fill="${COLORS[0]}"/>` : `<path d="M${R} ${R}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${COLORS[i % COLORS.length]}"/>`;
			return `${path}<g transform="rotate(${(mid - 90).toFixed(2)} ${R} ${R})"><text x="${R + R - 14}" y="${R}" text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="${n > 10 ? 10 : 13}" font-weight="700">${esc(short(t(x.text)))}</text></g>`;
		}).join('')}<circle cx="${R}" cy="${R}" r="${R - 2}" fill="none" stroke="#fff" stroke-width="4"/></svg>` : '';
		let rot = 0;
		$('#sx-spin', pane).onclick = () => {
			if (!n) return;
			const i = Math.floor(Math.random() * n);
			rot += 360 * 6 + ((((-((i + 0.5) * seg + (Math.random() - 0.5) * seg * 0.6) - rot) % 360) + 360) % 360);
			$('#sx-spin', pane).disabled = true;
			disc.style.transition = REDUCE ? 'none' : 'transform 4.2s cubic-bezier(.15,.9,.2,1)';
			disc.style.transform = `rotate(${rot}deg)`;
			setTimeout(() => {
				$('#sx-spin', pane).disabled = false;
				const x = items[i];
				result($('#sx-res', pane), `<small>${L('الليلة دي', 'Tonight it’s')}</small><b class="result__pick" dir="auto">${doodle(k.emoji, 40)} ${esc(t(x.text))}</b>${x.img ? `<img class="result__img zoom" data-secret="${esc(x.img)}" alt="">` : ''}`, `${k.id}:${x.id}`);
			}, REDUCE ? 50 : 4300);
		};
	}

	/* a pick, with «we did it» */
	function result(el, html, ref) {
		el.innerHTML = `${html}
			<div class="result__acts">
				${ok ? `<fieldset class="rate"><legend>${Y('قيّم', 'قيّمي', 'Rate it')}</legend>${[5, 4, 3, 2, 1].map((h) => `<input type="radio" name="sxh" id="sxh${h}" value="${h}"><label for="sxh${h}">♥</label>`).join('')}</fieldset>
				<button type="button" class="btn btn--coral" id="sx-log">${Y('عملناها ♥ سجّلها', 'عملناها ♥ سجّليها', 'We did it ♥ Log it')}</button>` : ''}
			</div><p class="form-msg" id="sx-lmsg" role="status"></p>`;
		el.hidden = false;
		hydrate(el);
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		const b = $('#sx-log', el);
		if (b) b.onclick = async () => {
			b.disabled = true;
			try {
				const h = +($('input[name="sxh"]:checked', el)?.value || 0);
				await logNight(ref, h);
				if (ref.startsWith('p:')) { const id = 'p' + ref.slice(2); if (!mark(id).tried) await setMark(id, 'tried'); }
				$('#sx-lmsg', el).textContent = L('اتسجلت ♥', 'Logged ♥');
			} catch (err) { $('#sx-lmsg', el).textContent = live.why(err); b.disabled = false; }
		};
	}

	/* ---- the nights we logged ---- */
	function nights() {
		const pane = $('#sx-pane', box);
		const list = [...mine.nights].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.at - a.at);
		const tried = mine.items.filter((x) => x.tried && x.id.startsWith('p')).length;
		const favs = mine.items.filter((x) => x.fav);
		pane.innerHTML = `
			<div class="sx-stats"><span><b>${list.length}</b>${L('ليلة متسجلة', 'nights logged')}</span><span><b>${tried}</b>${L('وضع جربناه', 'positions tried')}</span><span><b>${favs.length}</b>${L('مفضلة', 'favourites')}</span></div>
			<div class="nights nights--col">${list.map((h) => `<article class="night" style="--c:#c2185b">
				<span class="night__e" aria-hidden="true">${doodle(h.ref.startsWith('p:') ? 'heart' : h.ref.startsWith('games:') ? 'dice' : 'dress', 30)}</span>
				<div><b dir="auto">${esc(refName(h.ref))}</b><small>${longDate(h.date)}${h.by ? ` · ${esc(name(h.by))}` : ''}</small>
				${h.hearts ? `<span class="hearts-row">${'♥'.repeat(h.hearts)}<i>${'♥'.repeat(5 - h.hearts)}</i></span>` : ''}</div>
			</article>`).join('') || `<p class="empty">${L('لسه مفيش ليالي متسجلة ♥', 'No nights logged yet ♥')}</p>`}</div>`;
	}
}
