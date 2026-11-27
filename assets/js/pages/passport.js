import { L, T, esc, num, fmtDate, $, $$, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import { GOVERNORATES } from '../egypt.js';

/* Our passport, the atlas's third tab: a little book we flip through. The first page is ours (our names, the day it was issued: the day we
   married); then every city we've been to is an entry stamp — the shape of its governorate, the city's name, the
   day we first went and how many places — in the order we first went; the empty pages wait for the governorates
   we haven't been to yet. The cities come from the atlas (assets/js/pages/atlas.js), so a new place shows up here too. */

const INKS = ['#1f4e9c', '#b3261e', '#2e6b3f', '#5b3a8c', '#8a4b12'];
const SHAPES = ['round', 'rect', 'oval'];
const PER_PAGE = 4;

const firstDate = (c) => [...c.places.map((p) => p.date), ...c.trips.map((y) => `${y}-09-10`)].filter((d) => /^\d{4}-\d\d/.test(String(d || ''))).sort()[0] || '';
const stampDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '');
const govPath = (id) => GOVERNORATES.find((g) => g.id === id)?.d || '';

function stamp(c, k) {
	const d = firstDate(c), shape = SHAPES[k % 3], ink = INKS[k % INKS.length];
	return `<figure class="pp-stamp pp-stamp--${shape}" style="--ink:${ink};--r:${((k * 37) % 17) - 8}deg;--k:${k}">
		<svg class="pp-stamp__gov" viewBox="0 0 1000 880" aria-hidden="true"><path d="${govPath(c.gov)}"/></svg>
		<figcaption>
			<small class="pp-stamp__in">${L('دخول', 'ENTRY')} · ARRIVAL</small>
			<b>${esc(c.en)}</b>
			<i dir="rtl">${esc(c.ar)}</i>
			${d ? `<small class="pp-stamp__d" dir="ltr">${esc(stampDate(d))}</small>` : ''}
			<span class="pp-stamp__n">${L(`${num(c.places.length)} ${c.places.length === 1 ? 'مكان' : c.places.length <= 10 ? 'أماكن' : 'مكان'}`, `${c.places.length} place${c.places.length === 1 ? '' : 's'}`)}</span>
		</figcaption>
	</figure>`;
}
const empty = (g) => `<figure class="pp-stamp pp-stamp--empty"><svg class="pp-stamp__gov" viewBox="0 0 1000 880" aria-hidden="true"><path d="${g.d}"/></svg><figcaption><i dir="rtl">${esc(g.ar)}</i><small>${L('لسه', 'Not yet')}</small></figcaption></figure>`;

/** the closed passport and the book it opens into */
export const passportHTML = (s) => `	<div class="pp" id="pp">
		<button class="pp-cover" type="button" id="pp-cover" aria-label="${L('افتح الجواز', 'Open the passport')}">
			<span class="pp-cover__k">${L('جمهورية حبنا', 'THE REPUBLIC OF US')}</span>
			<span class="pp-cover__seal" aria-hidden="true">${doodle('heart', 54)}</span>
			<span class="pp-cover__t">${L('جواز سفر', 'PASSPORT')}</span>
			<span class="pp-cover__n">${esc(T(s.him))} ♥ ${esc(T(s.her))}</span>
			<span class="pp-cover__chip" aria-hidden="true"></span>
			<span class="pp-cover__open">${L('دوس عشان تفتحه', 'Tap to open')}</span>
		</button>
		<div class="pp-book" id="pp-book" hidden>
			<div class="pp-spread" id="pp-spread"></div>
			<div class="pp-nav">
				<button class="btn btn--sm btn--ghost" type="button" id="pp-prev">${L('→ اللي قبلها', '← Back')}</button>
				<span id="pp-at"></span>
				<button class="btn btn--sm" type="button" id="pp-next">${L('اللي بعدها ←', 'Next →')}</button>
			</div>
			<p class="center"><button class="link" type="button" id="pp-close">${L('اقفل الجواز', 'Close the passport')}</button></p>
		</div>
	</div>
`;

/** fills the book from the atlas's cities (citiesOf in atlas.js) */
export function passportAfter(main, s, cities) {
		const list = [...cities].sort((a, b) => (firstDate(a) || '9').localeCompare(firstDate(b) || '9'));
		const been = new Set(list.map((c) => c.gov));
		const notYet = GOVERNORATES.filter((g) => !been.has(g.id));

		// the pages: ours first, then the stamps four to a page, then the governorates still waiting
		const mine = `<div class="pp-page pp-page--id">
			<p class="pp-page__k">${L('بيانات الحامل', 'HOLDERS')}</p>
			<div class="pp-id">
				<span class="pp-id__ph" aria-hidden="true">${doodle('heart', 40)}</span>
				<dl>
					<dt>${L('الاسم', 'Names')}</dt><dd>${esc(T(s.him))} ♥ ${esc(T(s.her))}</dd>
					<dt>${L('تاريخ الإصدار', 'Issued')}</dt><dd>${s.married ? esc(fmtDate(s.married)) : '—'}</dd>
					<dt>${L('أول سلام', 'First hello')}</dt><dd>${s.met ? esc(fmtDate(s.met)) : '—'}</dd>
					<dt>${L('المدن', 'Cities')}</dt><dd>${num(list.length)} · ${L(`${num(been.size)} من ٢٧ محافظة`, `${been.size} of 27 governorates`)}</dd>
				</dl>
			</div>
			<p class="pp-mrz" dir="ltr" aria-hidden="true">P&lt;EGY${esc(String(s.him?.en || '').toUpperCase().replace(/\W+/g, '<'))}&lt;&lt;${esc(String(s.her?.en || '').toUpperCase().replace(/\W+/g, '<'))}&lt;&lt;&lt;&lt;&lt;&lt;</p>
		</div>`;
		const cells = [...list.map((c, k) => stamp(c, k)), ...notYet.map(empty)];
		const pages = [mine];
		for (let i = 0; i < cells.length; i += PER_PAGE) pages.push(`<div class="pp-page"><p class="pp-page__k">${L('تأشيرات', 'VISAS')}</p><div class="pp-grid">${cells.slice(i, i + PER_PAGE).join('')}</div></div>`);
		const spreads = [];
		for (let i = 0; i < pages.length; i += 2) spreads.push([pages[i], pages[i + 1] || '<div class="pp-page pp-page--blank"></div>']);

		const book = $('#pp-book', main), cover = $('#pp-cover', main), spread = $('#pp-spread', main);
		let at = 0;
		const paint = () => {
			spread.classList.remove('is-turn');
			void spread.offsetWidth;
			spread.innerHTML = spreads[at].map((p, i) => p.replace('class="pp-page', `data-n="${num(at * 2 + i + 1)}" class="pp-page`)).join('');
			if (!REDUCE) spread.classList.add('is-turn');
			// every governorate cut to its own shape
			for (const svg of $$('.pp-stamp__gov', spread)) { try { const b = svg.querySelector('path').getBBox(); const p = Math.max(b.width, b.height) * 0.08; svg.setAttribute('viewBox', `${b.x - p} ${b.y - p} ${b.width + 2 * p} ${b.height + 2 * p}`); } catch {} }
			$('#pp-at', main).textContent = L(`${num(at + 1)} من ${num(spreads.length)}`, `${at + 1} of ${spreads.length}`);
			$('#pp-prev', main).disabled = at === 0;
			$('#pp-next', main).disabled = at === spreads.length - 1;
		};
		cover.addEventListener('click', () => { cover.hidden = true; book.hidden = false; at = 0; paint(); });
		$('#pp-close', main).addEventListener('click', () => { book.hidden = true; cover.hidden = false; });
		$('#pp-prev', main).addEventListener('click', () => { if (at > 0) { at--; paint(); } });
		$('#pp-next', main).addEventListener('click', () => { if (at < spreads.length - 1) { at++; paint(); } });
		book.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') $(document.dir === 'rtl' ? '#pp-next' : '#pp-prev', main).click(); if (e.key === 'ArrowRight') $(document.dir === 'rtl' ? '#pp-prev' : '#pp-next', main).click(); });
}
