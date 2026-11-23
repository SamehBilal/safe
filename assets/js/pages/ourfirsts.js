import { L, esc, num, longDate } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';

/* Our firsts as a couple: first meeting, first «I love you», first gift, first trip, first fight…
   Band: a string of fairy lights, one bulb lit for each first we've written down, its number on it. Under the string
   one first at a time is read out in full — what, when and where — moving along the lit bulbs by itself; point at a
   bulb to read its first, tap it to go to its card.
   Cards: each hangs from its own lit bulb with the same number, oldest first — the date on a tab, the first in big
   letters, where it was, how it happened in handwriting, and its photo as a polaroid. */
const IDEAS = [['أول مقابلة', 'First meeting'], ['أول «بحبك»', 'First “I love you”'], ['أول هدية', 'First gift'], ['أول خروجة لوحدنا', 'First date alone'], ['أول رحلة', 'First trip'], ['أول خناقة', 'First fight'], ['أول صلح', 'First making up'], ['أول صورة سوا', 'First photo together'], ['أول أكلة طبختهالك', 'First meal I cooked for you'], ['أول ليلة في بيتنا', 'First night in our home']];
const n0 = (i) => num(i).replace(/[٬,]/g, '');
let timer = 0;

export default listPage({
	id: 'ourfirsts', kind: 'ourfirsts', icon: 'heart',
	title: ['أول مرة لينا', 'Our firsts'], sub: ['كل أول مرة عشناها إحنا الاتنين', 'Every first the two of us lived'],
	add: ['ضيفوا أول مرة', 'Add a first'],
	fields: [
		{ n: 'what', t: 'text', l: ['أول مرة إيه؟', 'First what?'], req: 1, ideas: IDEAS, grow: 1 },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'where', t: 'text', l: ['فين؟', 'Where?'] },
		{ n: 'note', t: 'area', l: ['حصل إزاي؟', 'How did it happen?'] },
		{ n: 'photo', t: 'photo', l: ['صورة (اختياري)', 'A photo (optional)'], full: 1 }
	],
	sort: (a, b) => String(a.date || '9').localeCompare(String(b.date || '9')),
	band: (items) => {
		const n = Math.max(12, items.length + 3);
		// in Arabic the string reads from the right: the first bulb on the right
		const rtl = document.documentElement.dir === 'rtl';
		return `<div class="of-band">
			<svg class="of-svg" viewBox="0 0 1000 150" role="img" aria-label="${esc(L(`${num(items.length)} أول مرة`, `${items.length} firsts`))}"><path class="of-wire" d="${rtl ? 'M1000 40 Q 750 130 500 60 T 0 50' : 'M0 40 Q 250 130 500 60 T 1000 50'}"/>
			${Array.from({ length: n }, (_, i) => {
				const t = (i + 0.5) / n, x = rtl ? 1000 - t * 1000 : t * 1000, y = 40 + Math.sin(t * Math.PI * 2) * 36 + 30 * t, x0 = items[i];
				return `<g class="of-bulb${x0 ? ' is-on' : ''}" style="--i:${i}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"${x0 ? ` data-i="${i}" tabindex="0" role="button" aria-label="${esc(x0.what)}"` : ''}><rect x="-4" y="-2" width="8" height="8" rx="2"/><path d="M0 6c-10 0-13 11-13 17a13 13 0 0 0 26 0c0-6-3-17-13-17Z"/>${x0 ? `<text y="28" text-anchor="middle">${n0(i + 1)}</text>` : ''}</g>`;
			}).join('')}</svg>
			${items.length ? `<p class="of-now" id="of-now" aria-live="polite"></p>` : ''}
		</div>`;
	},
	painted: (root, items) => {
		clearInterval(timer);
		const now = root.ownerDocument.getElementById('of-now');
		const svg = root.ownerDocument.querySelector('.of-svg');
		if (!now || !svg || !items.length) return;
		let at = 0, held = false;
		const show = (i) => {
			at = i;
			const x = items[i];
			for (const b of svg.querySelectorAll('.of-bulb.is-now')) b.classList.remove('is-now');
			svg.querySelector(`.of-bulb[data-i="${i}"]`)?.classList.add('is-now');
			now.innerHTML = `<span class="of-now__n">${n0(i + 1)}</span><span class="of-now__t"><b dir="auto">${esc(x.what)}</b><small>${[x.date ? esc(longDate(x.date)) : '', x.where ? esc(x.where) : ''].filter(Boolean).join(' · ')}</small></span>`;
		};
		show(0);
		if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => {
			if (!svg.isConnected) return clearInterval(timer);
			if (!held) show((at + 1) % items.length);
		}, 3200);
		const pick = (e) => { const b = e.target.closest('.of-bulb[data-i]'); if (b) { held = true; show(+b.dataset.i); } };
		svg.addEventListener('pointerover', pick);
		svg.addEventListener('focusin', pick);
		svg.addEventListener('pointerleave', () => { held = false; });
		svg.addEventListener('focusout', () => { held = false; });
		const go = (e) => {
			const b = e.target.closest('.of-bulb[data-i]');
			if (!b || (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ')) return;
			e.preventDefault();
			root.ownerDocument.getElementById(`of-${items[+b.dataset.i].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		};
		svg.addEventListener('click', go);
		svg.addEventListener('keydown', go);
	},
	card: (x, c) => `<article class="lp-card of-card" id="of-${esc(x.id)}">
		<span class="of-card__bulb" aria-hidden="true"></span>
		${x.date ? `<p class="of-card__date">${c.date(x.date)}</p>` : ''}
		<h3 dir="auto">${esc(x.what)}</h3>
		${x.where ? `<p class="of-card__where" dir="auto">${doodle('pin', 16)} ${esc(x.where)}</p>` : ''}
		${x.note ? `<p class="of-card__note" dir="auto">${esc(x.note)}</p>` : ''}
		${x.photo ? `<div class="of-card__ph">${c.photo(x)}</div>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول «أول مرة» لينا هتتكتب هنا ♥', 'Our first “first” goes here ♥'],
	related: ['story', 'chapters', 'journal']
});
