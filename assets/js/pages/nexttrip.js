import { L, esc, num, longDate } from '../shell.js';
import { listPage } from '../listpage.js';
import { GOVERNORATES } from '../egypt.js';
import * as live from '../live.js';

/* Our next trip: where we're going next, a countdown to it, what to pack (ticked off on this phone) and ideas for what
   to do there. When we've been, «رحناها» marks it and it waits at the bottom as a trip we took.
   Band: a suitcase with a luggage tag counting down the days to the nearest trip. */

const DAY = 864e5;
const daysTo = (d) => Math.ceil((new Date(`${d}T00:00:00`) - new Date(new Date().toDateString())) / DAY);
const lines = (t) => String(t || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
const soonest = (items) => items.filter((x) => !x.done && x.date && daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
const PACK = 'us.local.pack.';
const packed = (id) => { try { return new Set(JSON.parse(localStorage.getItem(PACK + id) || '[]')); } catch { return new Set(); } };

// ticking the packing list off is this phone's own, kept in localStorage
if (typeof document !== 'undefined') document.addEventListener('change', (e) => {
	const b = e.target.closest?.('[data-pack]');
	if (!b) return;
	const [id, i] = b.dataset.pack.split(':');
	const set = packed(id);
	b.checked ? set.add(i) : set.delete(i);
	try { localStorage.setItem(PACK + id, JSON.stringify([...set])); } catch {}
	b.closest('li')?.classList.toggle('is-on', b.checked);
});

export default listPage({
	id: 'nexttrip', kind: 'nexttrip', icon: 'suitcase',
	title: ['رحلتنا الجاية', 'Our next trip'], sub: ['رايحين فين، فاضل كام يوم، وناخد إيه معانا', 'Where we’re going, how many days left, and what to pack'],
	add: ['خططوا رحلة', 'Plan a trip'],
	fields: [
		{ n: 'where', t: 'text', l: ['رايحين فين؟', 'Where to?'], req: 1, grow: 1, ph: L('دهب', 'Dahab') },
		{ n: 'gov', t: 'sel', l: ['المحافظة', 'Governorate'], opts: () => [['', '—', '—'], ...GOVERNORATES.map((g) => [g.id, g.ar, g.en])] },
		{ n: 'date', t: 'date', l: ['هنسافر يوم', 'Leaving on'], req: 1 },
		{ n: 'until', t: 'date', l: ['راجعين يوم', 'Back on'] },
		{ n: 'pack', t: 'area', l: ['ناخد إيه معانا؟ (كل حاجة في سطر)', 'What to pack (one per line)'], rows: 4 },
		{ n: 'ideas', t: 'area', l: ['هنعمل إيه هناك؟ (كل فكرة في سطر)', 'What we’ll do there (one per line)'], rows: 3 }
	],
	toggle: { n: 'done', on: ['رحناها', 'We went'], off: ['لسه', 'Not yet'] },
	sort: (a, b) => (!!a.done - !!b.done) || String(a.date || '').localeCompare(String(b.date || '')),
	band: (items) => {
		const t = soonest(items);
		const n = t ? daysTo(t.date) : null;
		return `<div class="nt-band"><div class="nt-case"><span class="nt-handle" aria-hidden="true"></span><span class="nt-stripe" aria-hidden="true"></span>
			<div class="nt-tag"><small>${t ? L('رايحين', 'Going to') : L('الرحلة الجاية', 'The next trip')}</small><b dir="auto">${t ? esc(t.where) : L('لسه هنختار', 'Still choosing')}</b>
			${t ? `<span class="nt-n"><b>${n === 0 ? L('النهارده!', 'Today!') : num(n)}</b>${n ? L(n === 1 ? 'يوم' : n <= 10 ? 'أيام' : 'يوم', n === 1 ? 'day' : 'days') : ''}</span>` : ''}</div></div></div>`;
	},
	card: (x, c) => {
		const n = x.date ? daysTo(x.date) : null;
		const have = packed(x.id);
		const pack = lines(x.pack), ideas = lines(x.ideas);
		return `<article class="lp-card nt-card${x.done ? ' is-done' : ''}">
		<p class="lp-k">${c.date(x.date)}${x.until ? ` – ${esc(longDate(x.until))}` : ''}${!x.done && n != null && n >= 0 ? ` · <b class="nt-left">${n === 0 ? L('النهارده', 'today') : L(`فاضل ${num(n)} ${n === 1 ? 'يوم' : n <= 10 ? 'أيام' : 'يوم'}`, `${n} day${n === 1 ? '' : 's'} to go`)}</b>` : ''}</p>
		<h3 dir="auto">${esc(x.where)}</h3>
		${pack.length ? `<p class="nt-k">${L('الشنطة', 'The bag')} <small>(${num(pack.filter((_, i) => have.has(String(i))).length)}/${num(pack.length)})</small></p><ul class="nt-pack">${pack.map((p, i) => `<li class="${have.has(String(i)) ? 'is-on' : ''}"><label><input type="checkbox" data-pack="${esc(x.id)}:${i}"${have.has(String(i)) ? ' checked' : ''}> <span dir="auto">${esc(p)}</span></label></li>`).join('')}</ul>` : ''}
		${ideas.length ? `<p class="nt-k">${L('هنعمل إيه', 'Ideas')}</p><ul class="nt-ideas">${ideas.map((p) => `<li dir="auto">${esc(p)}</li>`).join('')}</ul>` : ''}
		<div class="nt-btns">${live.canWrite() ? `<button class="btn btn--sm${x.done ? ' btn--ghost' : ''}" type="button" data-tog="${esc(x.id)}">${x.done ? L('لسه مرحناهاش', 'Not been yet') : L('رحناها ✓', 'We went ✓')}</button>` : ''}${x.done ? `<a class="btn btn--sm btn--ghost" href="atlas.html${x.gov ? `#${esc(x.gov)}` : ''}">${L('على أطلسنا', 'In our atlas')}</a>` : ''}</div>
		${c.del(x)}
	</article>`;
	},
	empty: ['أول رحلة جاية تتخطط هنا ♥', 'The first trip we plan goes here ♥'],
	related: ['atlas', 'anniversaries', 'adventures']
});
