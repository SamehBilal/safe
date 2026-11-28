import { L, esc, num } from '../shell.js';
import { listPage, shorten } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { fly } from '../airmsg.js';

/* What the boys said, as «قاموس الولاد» — the boys' own dictionary: every word they made up or got wrong is an entry,
   in alphabetical order under its letter like a real dictionary — the word in big, whose it is and how old he was,
   «يعني» with what he meant, and the story as the example. Above the title the dictionary lies open: the cover page
   with its name and how many words it has, and on the other page one entry after another, turning every few seconds,
   a magnifying glass over it. Each word can keep his voice saying it (recorded in the form, or a sound file), played
   from the entry like a dictionary's pronunciation — on the open page above the title too. */
const COLORS = ['#e39b2d', '#5a9e6f', '#8e5bd1', '#0e6990'];
const colorOf = (c, id) => c.kidOf(id)?.color || COLORS[Math.max(0, c.kids.findIndex((k) => k.id === id)) % COLORS.length];
// the letter a word files under: its first letter, with أ إ آ under ا
const letterOf = (w) => { const ch = [...String(w || '').replace(/^[«"'\s]+/, '')][0] || '؟'; return /[أإآ]/.test(ch) ? 'ا' : ch.toUpperCase(); };
let turn = 0;
/* the pronunciation button: his voice, with a speaker that sounds while it plays */
const say = (x, cls = '') => `<span class="sy-say ${cls}" data-voice-box><button class="sy-say__btn" type="button" data-say aria-label="${L('اسمعه وهو بيقولها', 'Hear him say it')}">${doodle('speaker', 18)}<span>${L('اسمعه', 'Listen')}</span><i class="sy-say__waves" aria-hidden="true"><b></b><b></b><b></b></i></button><audio data-voice="${esc(x.voice)}" data-type="${esc(x.voiceType || '')}" preload="none"></audio></span>`;
let playing = null;
const flown = new WeakSet();

export default listPage({
	id: 'sayings', kind: 'sayings', icon: 'book',
	title: ['كلام الولاد', 'What the boys said'], sub: ['قاموس الولاد: كل كلمة قالوها بطريقتهم، وكانوا يقصدوا إيه', 'The boys’ dictionary: every word they said their own way, and what they meant'],
	add: ['ضيفوا كلمة للقاموس', 'Add a word to the dictionary'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'said', t: 'text', l: ['قال إيه؟', 'What did he say?'], req: 1, grow: 1, full: 1, ph: ['سماكا', 'pasghetti'] },
		{ n: 'means', t: 'text', l: ['يقصد إيه؟', 'What did he mean?'], full: 1, ph: ['سمكة', 'spaghetti'] },
		{ n: 'voice', t: 'voice', l: ['صوته وهو بيقولها (اختياري)', 'His voice saying it (optional)'] },
		{ n: 'note', t: 'area', l: ['الحكاية (قالها إمتى وإزاي)', 'The story (when and how he said it)'], rows: 2 }
	],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(a.said || '').localeCompare(String(b.said || ''), 'ar'),
	band: (items, c) => `<div class="sy-dict">
		<div class="sy-book">
			<div class="sy-book__page sy-book__cover">
				<span class="sy-book__ic">${doodle('book', 40)}</span>
				<b class="sy-book__name">${L('قاموس الولاد', 'The Boys’ Dictionary')}</b>
				<small>${c.kids.map((k) => esc(c.kidName(k.id))).join(L(' و', ' & '))}</small>
				<p class="sy-book__n"><b>${num(items.length)}</b> ${L('كلمة', items.length === 1 ? 'word' : 'words')}</p>
				<p class="sy-book__abc" aria-hidden="true">${[...new Set(items.map((x) => letterOf(x.said)))].slice(0, 14).map((l) => `<i>${esc(l)}</i>`).join('')}</p>
			</div>
			<div class="sy-book__page sy-book__entry" id="sy-turn" aria-live="polite"></div>
			<span class="sy-glass" aria-hidden="true"><svg viewBox="0 0 60 60"><circle cx="24" cy="24" r="16"/><path d="M36 36 54 54"/></svg></span>
		</div>
	</div>`,
	card: (x, c) => `<article class="lp-card sy-entry" style="--c:${esc(colorOf(c, x.kid))}" data-letter="${esc(letterOf(x.said))}">
		<h3 class="sy-entry__word" dir="auto">${esc(x.said)}</h3>
		${x.voice ? say(x) : ''}
		<p class="sy-entry__pos"><span class="sy-entry__face">${doodle(c.kidOf(x.kid)?.emoji || 'laugh', 18)}</span>${L('كلمة', 'a word of')} ${esc(c.kidName(x.kid))}${x.date && c.kidAge(x.kid, x.date) ? ` · ${L('وعنده', 'at')} ${esc(c.kidAge(x.kid, x.date))}` : ''}</p>
		${x.means ? `<p class="sy-entry__def" dir="auto"><b>${L('يعني:', 'means:')}</b> ${esc(x.means)}</p>` : ''}
		${x.note ? `<p class="sy-entry__ex" dir="auto"><b>${L('مثال:', 'e.g.')}</b> ${esc(x.note)}</p>` : ''}
		<footer>${x.date ? `<small>${c.date(x.date)}</small>` : '<small></small>'}${c.del(x)}</footer>
	</article>`,
	/* the first word under each letter gets the letter as a tab, like a dictionary's thumb index; and the open page above the title turning */
	painted: (root, items, c) => {
		const list = root.querySelector('#lp-list');
		let last = '';
		for (const el of [...list.querySelectorAll('.sy-entry')]) {
			const l = el.dataset.letter;
			el.classList.toggle('is-first', l !== last); last = l;
		}
		clearInterval(turn);
		const page = document.getElementById('sy-turn');
		if (!page) return;
		const pool = items.length ? items : [{ said: L('أول كلمة…', 'The first word…'), means: L('هتتكتب هنا', 'goes here') }];
		let k = Math.floor(Math.random() * pool.length);
		const show = () => {
			if (!page.isConnected) return clearInterval(turn);
			const x = pool[k++ % pool.length];
			page.classList.remove('is-in'); void page.offsetWidth;
			page.innerHTML = `<p class="sy-turn__letter">${esc(letterOf(x.said))}</p>
				<p class="sy-turn__word" dir="auto">${esc(shorten(x.said, 28))}</p>
				${x.kid ? `<p class="sy-turn__pos" style="--c:${esc(colorOf(c, x.kid))}">${L('كلمة', 'a word of')} ${esc(c.kidName(x.kid))}</p>` : ''}
				${x.means ? `<p class="sy-turn__def" dir="auto"><b>${L('يعني:', 'means:')}</b> ${esc(shorten(x.means, 40))}</p>` : ''}
				${x.voice ? say(x, 'sy-say--sm') : ''}`;
			live.hydrateSketches(page);
			page.classList.add('is-in');
		};
		show();
		/* once a visit, a little plane crosses the top towing one of their words and what it meant (airmsg.js) */
		const head = root.closest('main')?.querySelector('.ph') || document.querySelector('.ph');
		const said = items.filter((x) => x.said && x.means);
		if (head && said.length && !flown.has(head)) {
			flown.add(head);
			const x = said[Math.floor(Math.random() * said.length)];
			fly(head, `${x.kid ? `${c.kidName(x.kid)}: ` : ''}«${shorten(x.said, 22)}» ${L('يعني', 'means')} ${shorten(x.means, 22)}`, { ic: 'laugh', delay: 1800, top: 4, c: colorOf(c, x.kid) });
		}
		if (pool.length > 1) turn = setInterval(() => { if (!document.hidden) show(); }, 5000);
	},
	click: (e) => {
		const b = e.target.closest('[data-say]');
		if (!b) return;
		const box = b.closest('.sy-say'), a = box.querySelector('audio');
		if (playing && playing !== a) { playing.pause(); playing.currentTime = 0; }
		if (!a.paused) { a.pause(); a.currentTime = 0; return; }
		playing = a;
		a.onplay = () => box.classList.add('is-on');
		a.onpause = a.onended = () => box.classList.remove('is-on');
		a.play().catch(() => box.classList.remove('is-on'));
	},
	empty: ['أول كلمة في القاموس تتكتب هنا ♥', 'The first word in the dictionary goes here ♥'],
	related: ['family', 'firsts', 'capsule']
});
