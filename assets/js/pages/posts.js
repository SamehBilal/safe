import { L, Y, T, esc, img, num, pageHead, related, App, $, $$, longDate, fmtDate, hydrate } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { setupNote } from './journal.js';
import { shrinkPhoto } from './trips.js';

/* The posts we wrote about each other on social media, kept here so they don't get lost in a feed: the words, a
   screenshot or photo, the day, and a link back to the original. Each of us can heart the other's. Shared from the
   phones (content/live/posts.bin; screenshots travel like the sketches). */

export const NETS = [
	{ id: 'facebook', ar: 'فيسبوك', en: 'Facebook', c: '#1f5fbf' },
	{ id: 'instagram', ar: 'إنستجرام', en: 'Instagram', c: '#c2185b' },
	{ id: 'x', ar: 'إكس', en: 'X', c: '#37353f' },
	{ id: 'tiktok', ar: 'تيك توك', en: 'TikTok', c: '#26706b' },
	{ id: 'whatsapp', ar: 'حالة واتساب', en: 'WhatsApp status', c: '#2e9e6a' },
	{ id: 'other', ar: 'حتة تانية', en: 'Elsewhere', c: '#8a5a2b' }
];
const net = (id) => NETS.find((n) => n.id === id) || NETS[NETS.length - 1];
const safeLink = (u) => (/^https?:\/\//i.test(u || '') ? u : '');

/** Which family member wrote it: the grown-ups from story.json (him first). */
function author(s, by) {
	const grown = (s.family?.members || []).filter((m) => !m.kid);
	return (by === 'her' ? grown[1] : grown[0]) || null;
}

function post(s, p, k) {
	const n = net(p.net);
	const a = author(s, p.by);
	const name = App.t(p.by === 'her' ? s.her : s.him);
	const likes = p.likes || {};
	const me = live.me();
	const ok = live.canWrite();
	const link = safeLink(p.link);
	return `<article class="post reveal" id="${esc(p.id)}" style="--c:${n.c};--delay:${(k % 3) * 0.06}s">
		<header class="post__hd">
			<span class="post__av">${a?.photo ? img(a.photo, '', 'post__av-img') : `<span class="post__av-e">${doodle(a?.emoji || 'heart', 26)}</span>`}</span>
			<span class="post__who"><b>${esc(name)}</b><small>${p.date ? esc(longDate(p.date)) : ''}</small></span>
			<span class="post__net">${esc(L(n.ar, n.en))}</span>
		</header>
		${p.text ? `<p class="post__tx" dir="auto">${esc(p.text)}</p>` : ''}
		${p.img ? `<img class="post__img zoom" data-sketch="${esc(p.img)}" alt="${esc(p.text ? p.text.slice(0, 80) : L('صورة البوست', 'The post’s picture'))}" loading="lazy">` : ''}
		<footer class="post__ft">
			<button class="post__heart${likes[me] ? ' is-on' : ''}" type="button" data-like="${esc(p.id)}"${ok ? '' : ' disabled'} aria-pressed="${!!likes[me]}" aria-label="${L('قلب', 'Heart')}">
				<span aria-hidden="true">${likes.him && likes.her ? '♥♥' : likes.him || likes.her ? '♥' : '♡'}</span>
				<small>${likes.him && likes.her ? L('إحنا الاتنين', 'both of us') : likes.him ? T(s.him) : likes.her ? T(s.her) : ''}</small>
			</button>
			${link ? `<a class="link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">↗ ${L('البوست الأصلي', 'The original')}</a>` : ''}
			${ok && p.by === me ? `<button class="link link--danger" type="button" data-del="${esc(p.id)}">${L('مسح', 'Delete')}</button>` : ''}
		</footer>
	</article>`;
}

/* the top: our profile on a phone — the two of us, how many posts, hearts and places we posted, a highlight circle for
   every network, and the latest posts as a grid; beside it the newest hearts pop up as notifications */
function profile(s, items) {
	const him = author(s, 'him'), her = author(s, 'her');
	const av = (a, cls) => `<span class="${cls}">${a?.photo ? img(a.photo, '', '') : doodle(a?.emoji || 'heart', 22)}</span>`;
	const hearts = items.reduce((n, p) => n + Object.keys(p.likes || {}).length, 0);
	const used = NETS.filter((n) => items.some((p) => p.net === n.id));
	const sorted = items.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
	const tiles = sorted.slice(0, 3);
	const liked = sorted.filter((p) => p.likes && Object.keys(p.likes).length).slice(0, 2);
	return `<div class="pp-phone">
		<span class="pp-notch"></span>
		<div class="pp-head">
			<span class="pp-avs">${av(him, 'pp-av')}${av(her, 'pp-av')}</span>
			<span class="pp-name"><b>${T(s.him)} <i>♥</i> ${T(s.her)}</b><small dir="ltr">@us.since.2009</small></span>
		</div>
		<ul class="pp-stats">
			<li><b>${num(items.length)}</b><small>${L('بوست', 'posts')}</small></li>
			<li><b>${num(hearts)}</b><small>${L('قلب', 'hearts')}</small></li>
			<li><b>${num(used.length)}</b><small>${L('مكان', 'places')}</small></li>
		</ul>
		${used.length ? `<ul class="pp-hl">${used.map((n) => `<li style="--c:${n.c}"><span>${doodle(n.id === 'whatsapp' ? 'chat' : n.id === 'other' ? 'pin' : 'phone', 20)}</span><small>${esc(L(n.ar, n.en))}</small></li>`).join('')}</ul>` : ''}
		<ul class="pp-grid">${tiles.length ? tiles.map((p) => `<li style="--c:${net(p.net).c}"><a href="#${esc(p.id)}" tabindex="-1"><span dir="auto">${esc([...(p.text || '')].slice(0, 40).join(''))}</span>${p.img ? `<img data-sketch="${esc(p.img)}" alt="">` : ''}</a></li>`).join('') : Array.from({ length: 3 }, () => '<li class="is-empty"></li>').join('')}</ul>
	</div>
	${liked.map((p, i) => { const who = Object.keys(p.likes); return `<span class="pp-ping pp-ping--${i}">${doodle('heart', 18)}<span><b>${who.length > 1 ? L('إحنا الاتنين', 'Both of us') : T(who[0] === 'her' ? s.her : s.him)}</b> ${L('حط قلب', 'hearted')}${p.date ? ` · ${esc(fmtDate(p.date))}` : ''}</span></span>`; }).join('')}`;
}

export default {
	title: { ar: 'بوستاتنا', en: 'Our posts' },
	render() {
		const ok = live.canWrite();
		return `
		${pageHead(L('بوستاتنا', 'Our posts'), L('كل حاجة كتبناها لبعض على السوشيال ميديا — في مكان واحد ميضيعش', 'Everything we posted about each other — kept in one place, never lost in a feed'), [{ href: 'posts.html', ar: 'بوستاتنا', en: 'Our posts' }], { band: '<div class="pp-band" id="pp-band" aria-hidden="true"></div>' })}
		<section class="sec sec--top"><div class="wrap">
			${ok ? '' : `<div class="narrow" style="margin:0 auto 24px">${setupNote()}</div>`}
			<details class="composer reveal narrow" style="margin:0 auto 28px"${ok ? '' : ' hidden'}>
				<summary><span>${doodle('phone', 22)}</span> ${Y('ضيف بوست', 'ضيفي بوست', 'Add a post')}</summary>
				<form id="po-form" autocomplete="off">
					<div class="f-row">
						<label class="f"><span>${L('اتنشر فين؟', 'Where was it posted?')}</span><select name="net">${NETS.map((n) => `<option value="${n.id}">${esc(L(n.ar, n.en))}</option>`).join('')}</select></label>
						<label class="f"><span>${L('يوم إيه؟', 'On what day?')}</span><input name="date" type="date"></label>
					</div>
					<label class="f"><span>${L('الكلام اللي في البوست', 'What the post said')}</span><textarea name="text" dir="auto" rows="4" maxlength="2000"></textarea></label>
					<label class="f"><span>${L('صورة أو سكرين شوت (اختياري)', 'A photo or screenshot (optional)')}</span><input name="pic" type="file" accept="image/*"></label>
					<label class="f"><span>${L('لينك البوست (اختياري)', 'Link to the post (optional)')}</span><input name="link" type="url" dir="ltr" placeholder="https://"></label>
					<p class="form-msg" id="po-msg" role="status"></p>
					<div class="f-actions"><button type="submit" class="btn btn--coral">${Y('احفظه ♥', 'احفظيه ♥', 'Keep it ♥')}</button></div>
				</form>
			</details>
			<div class="chips" role="toolbar" aria-label="${L('فين', 'Where')}" id="po-chips"></div>
			<div class="posts" id="po-list"><p class="empty">${L('بنجيب بوستاتنا…', 'Fetching our posts…')}</p></div>
		</div></section>
		${related(['notes', 'letters', 'gallery'])}`;
	},

	async after(main, s) {
		const list = $('#po-list', main), chips = $('#po-chips', main), sec = $('.sec', main);
		let data = { items: [] };
		let only = '';
		const all = () => (data.items || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.at || 0) - (a.at || 0));

		const paint = () => {
			const l = all().filter((p) => !only || p.net === only);
			list.innerHTML = l.length ? l.map((p, k) => post(s, p, k)).join('')
				: `<p class="empty">${all().length ? L('مفيش بوستات من هنا', 'No posts from here') : Y('لسه مفيش بوستات… ضيف أول بوست كتبناه لبعض ♥', 'لسه مفيش بوستات… ضيفي أول بوست كتبناه لبعض ♥', 'No posts yet… add the first one we wrote for each other ♥')}</p>`;
			live.hydrateSketches(list);
			hydrate(list);
			const band = $('#pp-band');
			if (band) { band.innerHTML = profile(s, data.items || []); live.hydrateSketches(band); hydrate(band); }
			for (const el of $$('.reveal', list)) el.classList.add('is-in');
			const used = NETS.filter((n) => all().some((p) => p.net === n.id));
			chips.hidden = used.length < 2;
			chips.innerHTML = `<button class="chip${only ? '' : ' is-on'}" type="button" data-net="">${L('الكل', 'All')}</button>${used.map((n) => `<button class="chip${only === n.id ? ' is-on' : ''}" type="button" data-net="${n.id}">${esc(L(n.ar, n.en))}</button>`).join('')}`;
		};
		const save = async (fn) => { try { data = await live.save('posts', fn); paint(); } catch (err) { alert(live.why(err)); } };

		chips.onclick = (e) => { const c = e.target.closest('[data-net]'); if (c) { only = c.dataset.net; paint(); } };
		sec.addEventListener('click', (e) => {
			const like = e.target.closest('[data-like]');
			const del = e.target.closest('[data-del]');
			if (like) save((d) => { const p = (d.items || []).find((x) => x.id === like.dataset.like); if (p) { p.likes = p.likes || {}; if (p.likes[live.me()]) delete p.likes[live.me()]; else p.likes[live.me()] = true; } });
			if (del && confirm(Y('تمسح البوست ده من هنا؟', 'تمسحي البوست ده من هنا؟', 'Remove this post from here?'))) save((d) => { d.items = (d.items || []).filter((x) => x.id !== del.dataset.del); });
		});

		const form = $('#po-form', main);
		form.onsubmit = async (e) => {
			e.preventDefault();
			const msg = $('#po-msg', main);
			const file = form.pic.files[0];
			const text = form.text.value.trim();
			if (!text && !file) { msg.textContent = Y('اكتب الكلام أو حط صورة', 'اكتبي الكلام أو حطي صورة', 'Add the words or a picture'); return; }
			msg.textContent = L('بنحفظ…', 'Saving…');
			try {
				const pic = file ? await live.putSketch(await shrinkPhoto(file, 1400)) : undefined;
				const p = { id: live.newId(), net: form.net.value, date: form.date.value || live.today(), text: text || undefined, img: pic, link: safeLink(form.link.value.trim()) || undefined, by: live.me(), at: Date.now() };
				data = await live.save('posts', (d) => { (d.items = d.items || []).push(p); });
				form.reset();
				msg.textContent = L('اتحفظ ♥', 'Kept ♥');
				only = '';
				paint();
			} catch (err) { msg.textContent = live.why(err); }
		};

		data = await live.load('posts');
		paint();
	}
};
