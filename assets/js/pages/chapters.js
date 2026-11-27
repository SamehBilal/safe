import { L, T, esc, img, fmtDate, yearsAgo, pageHead, related, firstPhoto, App, num } from '../shell.js';
import { doodle } from '../doodles.js';

/* «أيام فارقة»: the days that changed our lives.
   The top is the road they lie on: each big day a round photo on a dotted line, placed by its date between the first
   and the last, its year and its name under it — beside how many big days and the years they span.
   Below, each day in a row of its own, zig-zag: its photo big in a frame, its number, the date on a tab, its name, the
   line about it, how long ago, and «اقرا اليوم ده». Its own page (chapter.html) shows its rows the same way. */
const yr = (d) => num(+String(d).slice(0, 4)).replace(/[٬,]/g, '');

/** One big day as a row (used here and at the foot of chapter.html). */
export function dayRow(c, k, total) {
	const cover = firstPhoto(c);
	return `<a class="bd-row reveal" href="chapter.html?id=${esc(c.id)}" style="--k:${k};--delay:${(k % 2) * 0.08}s">
		<span class="bd-row__ph">${cover ? `<span class="bd-row__frame" data-media-box>${img(cover, App.t(c.title))}</span>` : `<span class="bd-row__frame bd-row__frame--none">${doodle(c.icon, 64)}</span>`}<span class="bd-row__ic" aria-hidden="true">${doodle(c.icon, 26)}</span></span>
		<span class="bd-row__body">
			<span class="bd-row__n">${L(`اليوم ${num(k + 1)} من ${num(total)}`, `Day ${k + 1} of ${total}`)}</span>
			<time class="bd-row__date">${fmtDate(c.date)}</time>
			<b class="bd-row__t">${T(c.title)}</b>
			${c.sub ? `<span class="bd-row__sub">${T(c.sub)}</span>` : ''}
			<span class="bd-row__ago">${yearsAgo(c.date)}</span>
			<span class="bd-row__go">${L('اقرا اليوم ده', 'Read this day')} ${App.arrow}</span>
		</span>
	</a>`;
}

export default {
	title: { ar: 'أيام فارقة', en: 'Big days' },
	render(s) {
		const list = [...(s.chapters || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
		const t0 = list.length ? +new Date(list[0].date) : 0, t1 = list.length ? +new Date(list.at(-1).date) : 1;
		// by date along the road, but never closer than a stop's width to the one before (two days in the same year)
		const raw = list.map((c) => (list.length < 2 ? 50 : 6 + ((+new Date(c.date) - t0) / Math.max(1, t1 - t0)) * 88));
		const gap = Math.min(16, 88 / Math.max(1, list.length - 1));
		const pos = [];
		raw.forEach((v, i) => { pos.push(i ? Math.max(v, pos[i - 1] + gap) : v); });
		const over = (pos.at(-1) ?? 0) - 94;
		if (over > 0) for (let i = pos.length - 1; i >= 0; i--) { pos[i] -= over; if (i && pos[i] - pos[i - 1] >= gap) break; if (i) pos[i - 1] = Math.min(pos[i - 1], pos[i] - gap); }
		const at = (c) => pos[list.indexOf(c)];
		return `<section class="sec sec--top"><div class="wrap"><div class="bd-hero">
			<div class="bd-hero__body">
				<p class="gh-k">${doodle('star', 16)} ${L('أيام فارقة', 'Big days')}${list.length ? ` · ${yr(list[0].date)}–${yr(list.at(-1).date)}` : ''}</p>
				<p class="gh-count"><b>${num(list.length)}</b> <span>${L(list.length === 1 ? 'يوم غيّر حياتنا' : 'أيام غيّرت حياتنا', list.length === 1 ? 'day that changed our lives' : 'days that changed our lives')}</span></p>
			</div>
			${list.length ? `<ol class="bd-road" aria-label="${L('الأيام على الطريق', 'The days along the road')}">${list.map((c, k) => {
				const cover = firstPhoto(c);
				return `<li class="bd-stop" style="--at:${at(c).toFixed(1)}%;--k:${k}"><a href="chapter.html?id=${esc(c.id)}">
					<span class="bd-stop__ph">${cover ? `<span data-media-box>${img(cover, '')}</span>` : doodle(c.icon, 30)}</span>
					<span class="bd-stop__y">${yr(c.date)}</span>
					<span class="bd-stop__t">${T(c.title)}</span>
				</a></li>`;
			}).join('')}</ol>` : ''}
		</div></div></section>
		${pageHead(L('أيام فارقة', 'Big days'), L('الأيام اللي غيرت حياتنا', 'The days that changed our lives'), [{ href: 'chapters.html', ar: 'أيام فارقة', en: 'Big days' }], { band: '' })}
		<section class="sec"><div class="wrap">
			<div class="bd-rows">${list.map((c, k) => dayRow(c, k, list.length)).join('')}</div>
		</div></section>
		${related(['story', 'atlas', 'family'])}`;
	}
};
