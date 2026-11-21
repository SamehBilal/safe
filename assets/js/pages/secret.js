import { L, Y, t, esc, App, $, $$, qs, longDate, REDUCE, getKey, pageHead } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { deriveKek, importMaster, open, fromB64 } from '../core.js';
import { figureSVG } from '../figure.js';

/* Our room: the page behind a PIN, in «ليالينا» (and a faint lock at the foot of Settings).
   Header band: a closed door with a «ممنوع الإزعاج» sign swinging on its handle, two candles flickering and petals falling.
   content/secret.bin is sealed with the site's key; inside, the list is sealed again with a key that only the PIN unwraps
   (tools/secret.mjs). The PIN is asked every time the page opens, and the page locks itself when the phone sleeps.
   What we mark (tried, want to try, favourite) and the nights we log go in the shared list «secret» as ids only.

   «الليلة»: anything — a position, a piece of the outfit, a game — can go in tonight's basket, picked by hand or by luck,
   and the basket is logged as one night with everything in it (and a date, for a night we forgot to log).
   The outfit is dressed by body part, like a vocabulary sheet: a woman drawn in line art (figure.js) with a label for
   each part, and what's on it tonight drawn on her — chosen by tapping the label, or all of them (or one) left to the dice.
   The games: ours (the boards and cards in the photos), and two to play right here — the dice, and truth or dare. */

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
const PAGE = Infinity; // every position shows at once (the images load as they scroll into view)

/* the parts of the outfit figure: where its label sits (side, height in %), and the point on the figure it points at
   (in the figure's 600×600 drawing). Each outfit piece names its part in secret.json (`part`); one without is «body». */
const PARTS = [
	{ id: 'head', ar: 'الراس والوش', en: 'Head & face', side: 'l', y: 8, at: [300, 72] },
	{ id: 'neck', ar: 'الرقبة', en: 'Neck', side: 'r', y: 17, at: [300, 130] },
	{ id: 'arm', ar: 'الدراع', en: 'Arm', side: 'l', y: 30, at: [228, 222] },
	{ id: 'body', ar: 'الطقم', en: 'The outfit', side: 'r', y: 33, at: [300, 250] },
	{ id: 'wrist', ar: 'الرسغ والوسط', en: 'Wrists & waist', side: 'l', y: 47, at: [230, 340] },
	{ id: 'hand', ar: 'الإيدين', en: 'Hands', side: 'r', y: 50, at: [358, 380] },
	{ id: 'under', ar: 'تحت', en: 'Underneath', side: 'l', y: 61, at: [300, 342] },
	{ id: 'leg', ar: 'الرجل', en: 'Legs', side: 'r', y: 72, at: [326, 440] },
	{ id: 'ankle', ar: 'الكاحل', en: 'Ankles', side: 'l', y: 88, at: [286, 552] },
	{ id: 'feet', ar: 'الرجلين', en: 'Feet', side: 'r', y: 93, at: [316, 586] }
];
const partOf = (x) => (PARTS.some((p) => p.id === x.part) ? x.part : 'body');

/* the games we play right here */
const DICE = {
	act: [['بوسة', 'A kiss'], ['حضن', 'A hug'], ['مساج', 'A massage'], ['همسة', 'A whisper'], ['لمسة', 'A touch'], ['إنت تختار', 'Your choice']],
	where: [['الرقبة', 'Neck'], ['الإيد', 'Hand'], ['الودن', 'Ear'], ['الضهر', 'Back'], ['الرجل', 'Leg'], ['الشفايف', 'Lips']]
};
const TRUTH = [
	['إيه أول حاجة لفتت نظرك فيا؟', 'What was the first thing you noticed about me?'],
	['إيه أحلى ليلة فاكرها لينا؟', 'Which night of ours do you remember best?'],
	['إمتى حسيت إنك بتحبني أكتر من أي وقت؟', 'When did you feel you loved me most?'],
	['إيه حاجة نفسك نجربها سوا ولسه ما قلتهاش؟', 'What would you love us to try that you haven’t said yet?'],
	['إيه اللبس اللي نفسك تشوفني فيه؟', 'What would you love to see me wear?'],
	['إيه أكتر لمسة بتحبها مني؟', 'Which touch of mine do you love most?'],
	['إيه الحاجة اللي بتحبها في شكلي ومش بتقولها؟', 'What do you love about how I look but never say?'],
	['لو هنسافر بكرة لوحدنا، نروح فين؟', 'If we flew off alone tomorrow, where to?'],
	['إيه أغنية بتفكرك بيا؟', 'Which song makes you think of me?'],
	['إيه أكتر حاجة بتوحشك فيا وإحنا بعيد؟', 'What do you miss most about me when we’re apart?']
];
const DARE = [
	['ارقص معايا على أغنيتنا', 'Dance with me to our song'],
	['بوسة دقيقة كاملة من غير ما تبعد', 'A kiss that lasts a whole minute'],
	['مساج للكتاف ٥ دقايق', 'A five-minute shoulder massage'],
	['قول ٣ حاجات بتحبها فيا وإنت باصص في عيني', 'Say three things you love about me, looking me in the eye'],
	['اختار حتة من لبس الليلة وخليني ألبسها', 'Pick a piece of tonight’s outfit for me to put on'],
	['حضن من ورا لحد ما تخلص الأغنية', 'Hold me from behind until the song ends'],
	['اكتب كلمة حب بصباعك على ضهري وأنا أخمنها', 'Write a love word on my back with your finger — I guess it'],
	['غمض عينيك وخمن أنا بلمسك فين', 'Close your eyes and guess where I’m touching'],
	['همسلي في ودني باللي نفسك فيه الليلة', 'Whisper what you want tonight'],
	['اختار وضع من الأوضاع للّيلة', 'Choose a position for tonight']
];
const PLAY = [
	{ id: 'dice', emoji: 'dice', ar: 'زهر الحب', en: 'Love dice', dar: 'زهرة بتقول تعمل إيه، والتانية فين', den: 'One die says what, the other says where' },
	{ id: 'truth', emoji: 'chat', ar: 'صراحة ولا جرأة', en: 'Truth or dare', dar: 'سؤال بصراحة، أو حاجة تتعمل', den: 'An honest answer, or something to do' }
];

const BAND = `<div class="sx-band" aria-hidden="true">
	${Array.from({ length: 10 }, (_, i) => `<span class="sx-petal" style="--i:${i};--x:${(i * 97) % 100}%"></span>`).join('')}
	<span class="sx-candle sx-candle--1"><i></i></span>
	<div class="sx-door"><span class="sx-knob"></span><span class="sx-hanger"><b>ممنوع الإزعاج</b><small>Do not disturb</small></span></div>
	<span class="sx-candle sx-candle--2"><i></i></span>
</div>`;

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
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default {
	title: { ar: 'أوضتنا', en: 'Our room' },
	render() {
		return `${pageHead(L('أوضتنا', 'Our room'), L('لينا إحنا الاتنين بس', 'Just for the two of us'), [{ href: 'secret.html', ar: 'أوضتنا', en: 'Our room' }], { band: BAND })}
		<section class="sec sec--top sx" id="sx"><div class="wrap">
			<div class="panel sx-lock" id="sx-lock">
				<span class="sx-lock__e" aria-hidden="true">${doodle('lock', 44)}</span>
				<h2>${L('اكتبوا الرقم السري', 'Enter the PIN')}</h2>
				<form id="sx-form" class="sx-pinform" autocomplete="off">
					<input id="sx-pin" class="sx-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" aria-label="${L('الرقم السري', 'PIN')}" dir="ltr" required>
					<button class="btn btn--coral" type="submit">${L('افتح ♥', 'Open ♥')}</button>
				</form>
				<p class="form-msg" id="sx-msg" role="status"></p>
				<a class="link" href="settings.html">${L('رجوع', 'Back')}</a>
			</div>
			<div id="sx-room" hidden></div>
		</div>
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
	const outfit = lists.outfit || [];
	const games = lists.games || [];
	const basket = []; // tonight: refs, in the order they were added (only while the room is open)
	const dressed = {}; // the outfit on the figure: part → item id

	const tab = qs('t') || 'pos';
	box.innerHTML = `
		<div class="sx-head"><span class="sx-head__t">${doodle('love', 26)} ${L('جوه أوضتنا', 'Inside our room')}</span><button type="button" class="btn btn--sm btn--ghost" id="sx-close">${doodle('lock', 16)} ${L('اقفل', 'Lock')}</button></div>
		<nav class="chips kinds-tabs sx-tabs" role="tablist">
			<button type="button" class="chip" data-tab="pos">${doodle('heart', 18)} ${L('الأوضاع', 'Positions')} <small>${P.length}</small></button>
			<button type="button" class="chip" data-tab="outfit">${doodle('dress', 18)} ${L('لبس الليلة', 'Tonight’s outfit')} <small>${outfit.length}</small></button>
			<button type="button" class="chip" data-tab="games">${doodle('dice', 18)} ${L('لعبة الليلة', 'Tonight’s game')} <small>${games.length + PLAY.length}</small></button>
			<button type="button" class="chip" data-tab="nights">${doodle('moon', 18)} ${L('ليالينا', 'Our nights')} <small id="sx-nn"></small></button>
		</nav>
		<aside class="sx-basket" id="sx-basket" aria-live="polite" hidden></aside>
		<button type="button" class="sx-jump" id="sx-jump" hidden>${doodle('moon', 18)} ${L('الليلة', 'Tonight')} <b id="sx-jn"></b></button>
		<div class="sx-pane" id="sx-pane"></div>`;
	$('#sx-close', box).onclick = lock;
	box.hidden = false;

	const panes = { pos: positions, outfit: dress, games: gamesPane, nights };
	const show = (id) => {
		$$('[data-tab]', box).forEach((b) => b.classList.toggle('is-on', b.dataset.tab === id));
		panes[id]();
	};
	$$('[data-tab]', box).forEach((b) => { b.onclick = () => show(b.dataset.tab); });
	const countNights = () => { $('#sx-nn', box).textContent = mine.nights.length || ''; };
	countNights();

	async function setMark(id, key, on) {
		mine = await live.save('secret', (d) => {
			d.items = d.items || [];
			let x = d.items.find((y) => y.id === id);
			if (!x) d.items.push((x = { id }));
			x[key] = on === undefined ? (x[key] ? 0 : 1) : on ? 1 : 0;
			if (!x.tried && !x.want && !x.fav) d.items = d.items.filter((y) => y.id !== id);
		}, init);
	}
	const refName = (ref) => {
		const [kind, id] = ref.split(':');
		if (kind === 'p') { const p = P.find((x) => String(x.n) === id); return p ? `${p.n}. ${p.name}` : ref; }
		if (kind === 'play') { const g = PLAY.find((x) => x.id === id); return g ? L(g.ar, g.en) : ref; }
		const x = (lists[kind] || []).find((y) => y.id === id);
		return x ? t(x.text) : ref;
	};
	const refEmoji = (ref) => (ref.startsWith('p:') ? 'heart' : ref.startsWith('games:') || ref.startsWith('play:') ? 'dice' : 'dress');
	const refsOf = (n) => n.refs || (n.ref ? [n.ref] : []);

	/* ---- tonight's basket: everything we picked, logged as one night ---- */
	const add = (refs) => {
		for (const r of [].concat(refs)) if (r && !basket.includes(r)) basket.push(r);
		paintBasket();
		$$('[data-add]', box).forEach((b) => b.classList.toggle('is-in', basket.includes(b.dataset.add)));
	};
	function paintBasket() {
		const el = $('#sx-basket', box);
		el.hidden = !basket.length;
		jumpPaint();
		if (!basket.length) { el.innerHTML = ''; return; }
		el.innerHTML = `<div class="sx-basket__h"><b>${doodle('moon', 20)} ${L('الليلة', 'Tonight')}</b><small>${L(`${basket.length} حاجة`, `${basket.length} thing${basket.length === 1 ? '' : 's'}`)}</small></div>
			<ul class="sx-basket__list">${basket.map((r) => `<li><span aria-hidden="true">${doodle(refEmoji(r), 16)}</span><span dir="auto">${esc(refName(r))}</span><button type="button" data-unbasket="${esc(r)}" aria-label="${L('شيل', 'Remove')}">✕</button></li>`).join('')}</ul>
			${ok ? `<div class="sx-basket__log">
				<fieldset class="rate"><legend>${Y('قيّم الليلة', 'قيّمي الليلة', 'Rate the night')}</legend>${[5, 4, 3, 2, 1].map((h) => `<input type="radio" name="sxh" id="sxh${h}" value="${h}"><label for="sxh${h}">♥</label>`).join('')}</fieldset>
				<label class="sx-basket__date"><span>${L('يوم', 'On')}</span><input type="date" id="sx-date" value="${live.today()}" max="${live.today()}"></label>
				<button type="button" class="btn btn--coral" id="sx-log">${Y('عملناها ♥ سجّل الليلة', 'عملناها ♥ سجّلي الليلة', 'We did it ♥ Log the night')}</button>
				<button type="button" class="link" id="sx-clear">${L('فضّي', 'Clear')}</button>
			</div><p class="form-msg" id="sx-lmsg" role="status"></p>` : ''}`;
		$$('[data-unbasket]', el).forEach((b) => { b.onclick = () => { basket.splice(basket.indexOf(b.dataset.unbasket), 1); add([]); }; });
		const clear = $('#sx-clear', el);
		if (clear) clear.onclick = () => { basket.length = 0; add([]); };
		const log = $('#sx-log', el);
		if (log) log.onclick = async () => {
			log.disabled = true;
			try {
				const refs = [...basket];
				const hearts = +($('input[name="sxh"]:checked', el)?.value || 0);
				const date = $('#sx-date', el).value || live.today();
				mine = await live.save('secret', (d) => { (d.nights = d.nights || []).push({ id: live.newId(), ref: refs[0], refs, date, by: live.me(), hearts: hearts || undefined, at: Date.now() }); }, init);
				for (const r of refs) if (r.startsWith('p:') && !mark('p' + r.slice(2)).tried) await setMark('p' + r.slice(2), 'tried', true);
				countNights();
				basket.length = 0;
				add([]);
				const pane = $('#sx-pane', box);
				const note = document.createElement('p');
				note.className = 'sx-logged';
				note.textContent = L('اتسجلت الليلة في ليالينا ♥', 'Logged in our nights ♥');
				pane.prepend(note);
				setTimeout(() => note.remove(), 4000);
			} catch (err) { $('#sx-lmsg', el).textContent = live.why(err); log.disabled = false; }
		};
	}
	/* a little button that stays on screen while tonight has something in it and its box is out of sight */
	const seen = new IntersectionObserver(([e]) => { inView = e.isIntersecting; jumpPaint(); });
	let inView = true;
	function jumpPaint() { const j = $('#sx-jump', box); if (!j) return; j.hidden = !basket.length || inView; $('#sx-jn', j).textContent = basket.length; }
	seen.observe($('#sx-basket', box));
	$('#sx-jump', box).onclick = () => $('#sx-basket', box).scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
	const addBtn = (ref, label = L('لليلة', 'Tonight')) => `<button type="button" class="sx-add${basket.includes(ref) ? ' is-in' : ''}" data-add="${esc(ref)}" title="${L('ضيفها لليلة', 'Add to tonight')}"><span class="sx-add__plus">+</span><span class="sx-add__ok">✓</span> ${label}</button>`;
	box.addEventListener('click', (e) => {
		const b = e.target.closest('[data-add]');
		if (!b) return;
		const r = b.dataset.add;
		if (basket.includes(r)) basket.splice(basket.indexOf(r), 1);
		else basket.push(r);
		add([]);
	});

	show(panes[tab] ? tab : 'pos');

	/* a pick by luck: shown big, with «add to tonight» */
	function result(el, html, refs) {
		const list = [].concat(refs);
		el.innerHTML = `${html}<div class="result__acts"><button type="button" class="btn btn--coral" data-take="1">${doodle('moon', 18)} ${L('ضيفها لليلة', 'Add to tonight')}</button></div>`;
		el.hidden = false;
		hydrate(el);
		el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
		$('[data-take]', el).onclick = (e) => { add(list); e.currentTarget.disabled = true; e.currentTarget.textContent = L('اتضافت ✓', 'Added ✓'); };
	}

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
			<div class="sx-pick"><button type="button" class="btn btn--coral" id="sx-rand">${doodle('dice', 20)} ${L('اختارولنا واحد من اللي ظاهرين', 'Pick one of these for us')}</button><span class="muted">${L('أو دوسوا «لليلة» على أي وضع', 'or tap «Tonight» on any of them')}</span></div>
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
					${lv ? `<span class="sx-lvl sx-lvl--${p.level}">${esc(L(lv[0], lv[1]))}</span>` : ''}
					<small>${p.tags.filter((g) => TAGS[g]).slice(0, 4).map((g) => esc(L(...TAGS[g]))).join(' · ')}</small>
					<div class="sx-marks">
						<button type="button" data-mk="want" class="${m.want ? 'is-on' : ''}" title="${L('عايزين نجربها', 'Want to try')}">🔖</button>
						<button type="button" data-mk="tried" class="${m.tried ? 'is-on' : ''}" title="${L('جربناها', 'Tried it')}">✓</button>
						<button type="button" data-mk="fav" class="${m.fav ? 'is-on' : ''}" title="${L('المفضلة', 'Favourite')}">♥</button>
					</div>
					${addBtn('p:' + p.n)}
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
			const p = pick(list);
			result($('#sx-res', pane), `<div class="sx-grid sx-grid--one">${card(p)}</div>`, 'p:' + p.n);
		};
		paint();
	}

	/* ---- the outfit, part by part ---- */
	function dress() {
		const pane = $('#sx-pane', box);
		const parts = PARTS.filter((p) => outfit.some((x) => partOf(x) === p.id));
		const item = (id) => outfit.find((x) => x.id === id);
		pane.innerHTML = `
			<div class="sx-pick">
				<button type="button" class="btn btn--coral" id="sx-dice-all">${doodle('dice', 20)} ${L('لبّسوني بالحظ', 'Dress me by luck')}</button>
				<button type="button" class="btn btn--ghost" id="sx-undress">${L('من الأول', 'Start over')}</button>
				<span class="muted">${L('أو دوسوا على أي حتة واختاروا', 'or tap any part and choose')}</span>
			</div>
			<div class="sx-fig" id="sx-fig"><div class="sx-fig__art"></div><svg class="sx-fig__lines" viewBox="0 0 600 600" aria-hidden="true" preserveAspectRatio="none"></svg><div class="sx-fig__tags"></div></div>
			<div class="sx-choose" id="sx-choose" hidden></div>
			<div class="sx-fig__acts"><button type="button" class="btn btn--coral" id="sx-take-outfit" disabled>${doodle('moon', 18)} ${L('ضيف اللبس ده لليلة', 'Add this outfit to tonight')}</button></div>`;
		const fig = $('#sx-fig', pane);
		let open = '';
		const paint = () => {
			$('.sx-fig__art', fig).innerHTML = figureSVG(parts.map((p) => item(dressed[p.id])?.look).filter(Boolean));
			$('.sx-fig__lines', fig).innerHTML = parts.map((p) => {
				const x = p.side === 'l' ? 170 : 430, y = (p.y / 100) * 600;
				return `<path class="${dressed[p.id] ? 'is-on' : ''}" d="M${x} ${y} L${p.at[0]} ${p.at[1]}"/><circle class="${dressed[p.id] ? 'is-on' : ''}" cx="${p.at[0]}" cy="${p.at[1]}" r="7"/>`;
			}).join('');
			$('.sx-fig__tags', fig).innerHTML = parts.map((p) => {
				const x = item(dressed[p.id]);
				return `<button type="button" class="sx-tag sx-tag--${p.side}${x ? ' is-on' : ''}${open === p.id ? ' is-open' : ''}" data-part="${p.id}" style="top:${p.y}%">
					${x?.img ? `<img data-secret="${esc(x.img)}" alt="">` : '<i aria-hidden="true">?</i>'}
					<span><small>${esc(L(p.ar, p.en))}</small><b dir="auto">${x ? esc(t(x.text)) : L('ولا حاجة', 'Nothing')}</b></span>
				</button>`;
			}).join('');
			hydrate(fig);
			$('#sx-take-outfit', pane).disabled = !Object.values(dressed).some(Boolean);
		};
		const choose = (pid) => {
			open = open === pid ? '' : pid;
			const el = $('#sx-choose', pane);
			const p = PARTS.find((x) => x.id === pid);
			if (!open) { el.hidden = true; paint(); return; }
			const list = outfit.filter((x) => partOf(x) === pid);
			el.innerHTML = `<div class="sx-choose__h"><b>${esc(L(p.ar, p.en))}</b><button type="button" class="btn btn--sm btn--ghost" data-roll="${pid}">${doodle('dice', 16)} ${L('بالحظ', 'By luck')}</button></div>
				<ul class="pool sx-pool">${list.map((x) => `<li class="has-img${dressed[pid] === x.id ? ' is-on' : ''}"><button type="button" data-wear="${esc(x.id)}">${x.img ? `<img class="pool__img" data-secret="${esc(x.img)}" alt="">` : ''}<span dir="auto">${esc(t(x.text))}</span></button></li>`).join('')}
				<li class="sx-none${dressed[pid] ? '' : ' is-on'}"><button type="button" data-wear="">✕<span>${L('ولا حاجة', 'Nothing')}</span></button></li></ul>`;
			el.hidden = false;
			hydrate(el);
			paint();
			el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest' });
		};
		const roll = (pid, keepEmpty) => {
			const list = outfit.filter((x) => partOf(x) === pid);
			// the outfit itself always comes; the extras three times out of four
			dressed[pid] = list.length && (pid === 'body' || !keepEmpty || Math.random() < 0.75) ? pick(list).id : '';
		};
		pane.onclick = (e) => {
			const tag = e.target.closest('[data-part]'), wear = e.target.closest('[data-wear]'), r = e.target.closest('[data-roll]');
			if (tag) return choose(tag.dataset.part);
			if (r) { roll(r.dataset.roll); open = ''; choose(r.dataset.roll); return; }
			if (wear) { dressed[open] = wear.dataset.wear; open = ''; $('#sx-choose', pane).hidden = true; paint(); }
		};
		$('#sx-dice-all', pane).onclick = () => { for (const p of parts) roll(p.id, true); open = ''; $('#sx-choose', pane).hidden = true; fig.classList.remove('is-shuffle'); void fig.offsetWidth; fig.classList.add('is-shuffle'); paint(); };
		$('#sx-undress', pane).onclick = () => { for (const k of Object.keys(dressed)) delete dressed[k]; open = ''; $('#sx-choose', pane).hidden = true; paint(); };
		$('#sx-take-outfit', pane).onclick = () => add(parts.filter((p) => dressed[p.id]).map((p) => `outfit:${dressed[p.id]}`));
		paint();
	}

	/* ---- the games: ours to choose from or leave to the wheel, and two to play right here ---- */
	function gamesPane() {
		const pane = $('#sx-pane', box);
		const all = [...games.map((x) => ({ ref: `games:${x.id}`, text: t(x.text), img: x.img })), ...PLAY.map((g) => ({ ref: `play:${g.id}`, text: L(g.ar, g.en) }))];
		pane.innerHTML = `
			<div class="draw" style="--c:#8e1f4f">
				<div class="wheel-box"><div class="wheel"><span class="wheel__pin" aria-hidden="true"></span><div class="wheel__disc" id="sx-disc"></div><button class="wheel__hub" type="button" id="sx-spin">${Y('لف', 'لفّي', 'Spin')}</button></div></div>
				<div class="sx-result result" id="sx-res" hidden aria-live="polite"></div>
			</div>
			<h3 class="sx-sub">${L('ألعابنا', 'Our games')}</h3>
			<ul class="pool sx-pool sx-pool--games">${games.map((x) => `<li class="has-img">${x.img ? `<img class="pool__img zoom" data-secret="${esc(x.img)}" alt="${esc(t(x.text))}">` : ''}<span dir="auto">${esc(t(x.text))}</span>${addBtn(`games:${x.id}`)}</li>`).join('')}</ul>
			<h3 class="sx-sub">${L('نلعب هنا', 'Play here')}</h3>
			<div class="sx-plays">${PLAY.map((g) => `<article class="sx-play" data-play="${g.id}">
				<header><span aria-hidden="true">${doodle(g.emoji, 30)}</span><div><b>${esc(L(g.ar, g.en))}</b><small>${esc(L(g.dar, g.den))}</small></div>${addBtn(`play:${g.id}`)}</header>
				<div class="sx-play__board" id="sx-${g.id}"></div>
			</article>`).join('')}</div>`;
		hydrate(pane);

		/* the wheel */
		const disc = $('#sx-disc', pane);
		const n = all.length, seg = 360 / Math.max(1, n), R = 150;
		const pt = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [R + r * Math.cos(a), R + r * Math.sin(a)]; };
		const short = (x) => ([...x].length > 16 ? [...x].slice(0, 15).join('') + '…' : x);
		disc.innerHTML = n ? `<svg viewBox="0 0 300 300" aria-hidden="true" style="direction:ltr">${all.map((x, i) => {
			const [x0, y0] = pt(i * seg, R), [x1, y1] = pt((i + 1) * seg, R), mid = i * seg + seg / 2;
			const path = n === 1 ? `<circle cx="${R}" cy="${R}" r="${R}" fill="${COLORS[0]}"/>` : `<path d="M${R} ${R}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${COLORS[i % COLORS.length]}"/>`;
			return `${path}<g transform="rotate(${(mid - 90).toFixed(2)} ${R} ${R})"><text x="${R + R - 14}" y="${R}" text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="${n > 10 ? 10 : 13}" font-weight="700">${esc(short(x.text))}</text></g>`;
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
				const x = all[i];
				result($('#sx-res', pane), `<small>${L('الليلة دي', 'Tonight it’s')}</small><b class="result__pick" dir="auto">${doodle('dice', 40)} ${esc(x.text)}</b>${x.img ? `<img class="result__img zoom" data-secret="${esc(x.img)}" alt="">` : ''}${x.ref.startsWith('play:') ? `<a class="link" href="#sx-${x.ref.slice(5)}">${L('يلا نلعبها تحت ↓', 'Play it below ↓')}</a>` : ''}`, x.ref);
			}, REDUCE ? 50 : 4300);
		};

		/* زهر الحب: two dice, and whose turn it is */
		let turn = 'him';
		const diceBoard = $('#sx-dice', pane);
		const face = (list, i) => `<span class="sx-die"><b dir="auto">${esc(L(...list[i]))}</b></span>`;
		diceBoard.innerHTML = `<p class="sx-turn" id="sx-turn"></p><div class="sx-dice">${face(DICE.act, 0)}<span class="sx-dice__on">${L('على', 'on the')}</span>${face(DICE.where, 0)}</div><button type="button" class="btn btn--coral" id="sx-roll">${doodle('dice', 18)} ${L('ارمي الزهر', 'Roll')}</button>`;
		const turnLine = () => { $('#sx-turn', diceBoard).textContent = L(`دور ${name(turn)}`, `${name(turn)}’s turn`); };
		turnLine();
		$('#sx-roll', diceBoard).onclick = async (e) => {
			const b = e.currentTarget;
			b.disabled = true;
			const dice = $$('.sx-die', diceBoard);
			const steps = REDUCE ? 1 : 10;
			let a = 0, w = 0;
			for (let k = 0; k < steps; k++) {
				a = Math.floor(Math.random() * 6); w = Math.floor(Math.random() * 6);
				dice[0].innerHTML = `<b dir="auto">${esc(L(...DICE.act[a]))}</b>`;
				dice[1].innerHTML = `<b dir="auto">${esc(L(...DICE.where[w]))}</b>`;
				dice.forEach((d) => { d.style.rotate = `${(Math.random() - 0.5) * 30}deg`; });
				await new Promise((r) => setTimeout(r, 70 + k * 12));
			}
			dice.forEach((d) => { d.style.rotate = ''; });
			navigator.vibrate?.(40);
			turn = turn === 'him' ? 'her' : 'him';
			turnLine();
			b.disabled = false;
		};

		/* صراحة ولا جرأة: a card from either deck, never the same one twice until the deck runs out */
		const truthBoard = $('#sx-truth', pane);
		const decks = { truth: [], dare: [] };
		const draw = (k) => { if (!decks[k].length) decks[k] = (k === 'truth' ? TRUTH : DARE).map((_, i) => i).sort(() => Math.random() - 0.5); return (k === 'truth' ? TRUTH : DARE)[decks[k].pop()]; };
		truthBoard.innerHTML = `<div class="sx-card2" id="sx-tcard"><small>${L('اختاروا', 'Choose')}</small><b>${L('صراحة ولا جرأة؟', 'Truth or dare?')}</b></div>
			<div class="sx-tbtns"><button type="button" class="btn" data-deck="truth">💬 ${L('صراحة', 'Truth')}</button><button type="button" class="btn btn--coral" data-deck="dare">🔥 ${L('جرأة', 'Dare')}</button></div>`;
		truthBoard.onclick = (e) => {
			const d = e.target.closest('[data-deck]');
			if (!d) return;
			const [ar, en] = draw(d.dataset.deck);
			const c = $('#sx-tcard', truthBoard);
			c.className = `sx-card2 is-${d.dataset.deck}`;
			c.innerHTML = `<small>${d.dataset.deck === 'truth' ? L('صراحة', 'Truth') : L('جرأة', 'Dare')}</small><b dir="auto">${esc(L(ar, en))}</b>`;
			c.animate?.([{ transform: 'rotateY(90deg)' }, { transform: 'none' }], { duration: REDUCE ? 1 : 350, easing: 'ease-out' });
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
			<div class="nights nights--col">${list.map((h) => { const refs = refsOf(h); return `<article class="night" style="--c:#c2185b">
				<span class="night__e" aria-hidden="true">${doodle(refEmoji(refs[0] || ''), 30)}</span>
				<div>${refs.length > 1 ? `<ul class="sx-night-refs">${refs.map((r) => `<li><span aria-hidden="true">${doodle(refEmoji(r), 14)}</span><span dir="auto">${esc(refName(r))}</span></li>`).join('')}</ul>` : `<b dir="auto">${esc(refName(refs[0] || ''))}</b>`}
				<small>${longDate(h.date)}${h.by ? ` · ${esc(name(h.by))}` : ''}</small>
				${h.hearts ? `<span class="hearts-row">${'♥'.repeat(h.hearts)}<i>${'♥'.repeat(5 - h.hearts)}</i></span>` : ''}</div>
			</article>`; }).join('') || `<p class="empty">${L('لسه مفيش ليالي متسجلة ♥', 'No nights logged yet ♥')}</p>`}</div>`;
	}
}
