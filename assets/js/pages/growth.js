import { L, esc, num, longDate, age } from '../shell.js';
import { listPage } from '../listpage.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';

/* Growth: the boys' height and weight over time. (Old door marks from «أول مرة», if any, still count.)
   Band: the door frame we measure them against — a pencil mark for every time each boy stood there, his latest with
   a little flag and his name — and beside it a bathroom scale for each boy, the needle swinging round to his weight.
   Under the title a card for each boy (his height and weight now, and how much he's grown since the last time), the
   two charts on graph paper, and every measurement as a tag. */
const C = ['#e39b2d', '#5a9e6f', '#0e6990', '#c2185b'];
let doorHeights = [];

const color = (ctx, id) => ctx.kidOf(id)?.color || C[Math.max(0, ctx.kids.findIndex((k) => k.id === id)) % C.length];
const all = (items) => [...items, ...doorHeights].sort((a, b) => String(a.date).localeCompare(String(b.date)));
const kids = (ctx) => ctx.kids.filter((k) => !k.born || new Date(k.born) <= new Date());
const fmt = (n) => num(Math.round(n * 10) / 10);
const since = (a, b) => { const m = Math.round((new Date(b) - new Date(a)) / (30.44 * 864e5)); return m < 1 ? L('من كام يوم', 'in a few days') : L(`في ${num(m)} ${m === 1 ? 'شهر' : m === 2 ? 'شهرين' : m <= 10 ? 'شهور' : 'شهر'}`, `in ${m} month${m === 1 ? '' : 's'}`); };

function chart(items, ctx, key, unit) {
	const pts = all(items).filter((x) => +x[key] > 0);
	const title = key === 'cm' ? L('الطول', 'Height') : L('الوزن', 'Weight');
	if (!pts.length) return `<figure class="gr-chart is-empty"><figcaption>${doodle(key === 'cm' ? 'ruler' : 'scale', 20)} ${title}</figcaption><p>${key === 'cm' ? L('أول طول يتسجل يظهر هنا', 'The first height shows here') : L('سجّلوا الوزن مع الطول وهيظهر هنا', 'Log the weight with the height and it shows here')}</p></figure>`;
	const ds = pts.map((x) => +new Date(x.date)), vs = pts.map((x) => +x[key]);
	const d0 = Math.min(...ds), d1 = Math.max(...ds, d0 + 864e5 * 30), v0 = Math.floor(Math.min(...vs) * 0.85), v1 = Math.ceil(Math.max(...vs) * 1.08);
	const X = (d) => 46 + ((d - d0) / (d1 - d0)) * 630, Y = (v) => 196 - ((v - v0) / Math.max(1, v1 - v0)) * 176;
	const lines = kids(ctx).map((k) => {
		const p = pts.filter((x) => x.kid === k.id);
		if (!p.length) return '';
		const c = color(ctx, k.id), last = p.at(-1);
		return `<polyline class="gr-line" style="--c:${c}" points="${p.map((x) => `${X(+new Date(x.date)).toFixed(1)},${Y(+x[key]).toFixed(1)}`).join(' ')}"/>${p.map((x) => `<circle class="gr-dot" style="--c:${c}" cx="${X(+new Date(x.date)).toFixed(1)}" cy="${Y(+x[key]).toFixed(1)}" r="5"><title>${esc(ctx.kidName(k.id))} · ${fmt(+x[key])} ${unit} · ${esc(longDate(x.date))}</title></circle>`).join('')}
			<text class="gr-last" style="--c:${c}" x="${X(+new Date(last.date)).toFixed(1)}" y="${(Y(+last[key]) - 11).toFixed(1)}" text-anchor="middle">${fmt(+last[key])}</text>`;
	}).join('');
	const ticks = Array.from({ length: 5 }, (_, i) => v0 + ((v1 - v0) * i) / 4);
	return `<figure class="gr-chart"><figcaption>${doodle(key === 'cm' ? 'ruler' : 'scale', 20)} ${title} <small>(${unit})</small></figcaption><svg viewBox="0 0 700 220" style="direction:ltr">
		${ticks.map((v) => `<line x1="46" x2="680" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gr-grid"/><text x="38" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${num(Math.round(v))}</text>`).join('')}
		<text x="46" y="216">${new Date(d0).getFullYear()}</text><text x="680" y="216" text-anchor="end">${new Date(d1).getFullYear()}</text>${lines}</svg>
		<p class="gr-key">${kids(ctx).map((k) => `<span style="--c:${color(ctx, k.id)}">${esc(ctx.kidName(k.id))}</span>`).join('')}</p></figure>`;
}

export default listPage({
	id: 'growth', kind: 'growth', icon: 'ruler',
	title: ['طول الولاد ووزنهم', 'Growth chart'], sub: ['طولهم ووزنهم، مرة ورا مرة — وكبروا قد إيه', 'Their height and weight, time after time — and how much they’ve grown'],
	add: ['سجّلوا قياس جديد', 'Log a measurement'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'cm', t: 'num', l: ['الطول (سم)', 'Height (cm)'], step: 0.5, ph: ['١١٠', '110'] },
		{ n: 'kg', t: 'num', l: ['الوزن (كجم)', 'Weight (kg)'], step: 0.1, ph: ['١٨٫٥', '18.5'] }
	],
	note: ['اكتبوا الطول أو الوزن أو الاتنين', 'Write the height, the weight or both'],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date).localeCompare(String(a.date)),
	ready: async () => { const f = await live.load('firsts').catch(() => ({ items: [] })); doorHeights = (f.items || []).filter((x) => x.type === 'height').map((x) => ({ ...x, door: 1 })); },
	band: (items, ctx) => {
		const ks = kids(ctx);
		const hs = all(items).filter((x) => +x.cm > 0);
		const lo = 40, hi = Math.max(130, ...hs.map((x) => +x.cm + 12));
		const pos = (cm) => ((cm - lo) / (hi - lo)) * 100;
		let ticks = '';
		for (let c = lo; c <= hi; c += 10) ticks += `<span class="grb-tick" style="bottom:${pos(c)}%"><i>${num(c)}</i></span>`;
		const marks = hs.map((x) => { const last = hs.filter((y) => y.kid === x.kid).at(-1) === x; return `<span class="grb-mark${last ? ' is-last' : ''}" style="bottom:${pos(+x.cm)}%;--c:${color(ctx, x.kid)}">${last ? `<b>${esc(ctx.kidName(x.kid))} · ${fmt(+x.cm)}</b>` : `<small>${esc(String(x.date).slice(0, 7))}</small>`}</span>`; }).join('');
		/* a scale for each boy: the needle at his weight, out of a dial that fits him */
		const scale = (k, i) => {
			const w = all(items).filter((x) => x.kid === k.id && +x.kg > 0).at(-1);
			const max = w ? Math.max(10, Math.ceil(+w.kg / 10) * 10 + 10) : 20;
			const deg = w ? -120 + (+w.kg / max) * 240 : -120;
			return `<figure class="grb-scale" style="--c:${color(ctx, k.id)};--deg:${deg.toFixed(1)}deg;--i:${i}">
				<svg viewBox="0 0 120 110"><rect class="grb-scale__body" x="6" y="6" width="108" height="98" rx="18"/><circle class="grb-scale__dial" cx="60" cy="52" r="34"/>
					${Array.from({ length: 9 }, (_, j) => { const a = (-120 + j * 30) * Math.PI / 180; return `<line class="grb-scale__tick" x1="${(60 + Math.sin(a) * 28).toFixed(1)}" y1="${(52 - Math.cos(a) * 28).toFixed(1)}" x2="${(60 + Math.sin(a) * 33).toFixed(1)}" y2="${(52 - Math.cos(a) * 33).toFixed(1)}"/>`; }).join('')}
					<g class="grb-needle"><path d="M60 52V24"/><circle cx="60" cy="52" r="4"/></g>
					<rect class="grb-scale__win" x="38" y="82" width="44" height="16" rx="4"/><text x="60" y="94" text-anchor="middle">${w ? fmt(+w.kg) : '—'}</text></svg>
				<figcaption>${esc(ctx.kidName(k.id))} <small>${L('كجم', 'kg')}</small></figcaption>
			</figure>`;
		};
		return `<div class="grb">
			<div class="grb-door"><span class="grb-door__frame"></span><div class="grb-ruler">${ticks}${marks}</div><span class="grb-pencil" aria-hidden="true"></span></div>
			<div class="grb-scales">${ks.map(scale).join('')}</div>
		</div>`;
	},
	top: (items, ctx) => {
		/* a card for each boy: now, and since last time */
		const card = (k) => {
			const p = all(items).filter((x) => x.kid === k.id);
			const h = p.filter((x) => +x.cm > 0), w = p.filter((x) => +x.kg > 0);
			const grew = (list, key, unit) => list.length > 1 ? `<small class="gr-now__d"><bdi dir="ltr">${+list.at(-1)[key] >= +list.at(-2)[key] ? '+' : ''}${fmt(+list.at(-1)[key] - +list.at(-2)[key])}</bdi> ${unit} ${since(list.at(-2).date, list.at(-1).date)}</small>` : '';
			return `<article class="gr-now" style="--c:${color(ctx, k.id)}">
				<header><span class="gr-now__face">${doodle(k.emoji || 'baby', 26)}</span><span><b>${esc(ctx.kidName(k.id))}</b><small>${k.born ? esc(age(k.born)) : ''}</small></span></header>
				<div class="gr-now__row"><span class="gr-now__ic">${doodle('ruler', 18)}</span><span><b>${h.length ? `${fmt(+h.at(-1).cm)} ${L('سم', 'cm')}` : '—'}</b>${grew(h, 'cm', L('سم', 'cm'))}</span></div>
				<div class="gr-now__row"><span class="gr-now__ic">${doodle('scale', 18)}</span><span><b>${w.length ? `${fmt(+w.at(-1).kg)} ${L('كجم', 'kg')}` : L('لسه متوزنش', 'not weighed yet')}</b>${grew(w, 'kg', L('كجم', 'kg'))}</span></div>
			</article>`;
		};
		return `<div class="gr-nows">${kids(ctx).map(card).join('')}</div><div class="gr-charts">${chart(items, ctx, 'cm', L('سم', 'cm'))}${chart(items, ctx, 'kg', L('كجم', 'kg'))}</div><h2 class="sec__title gr-log-h">${L('كل القياسات', 'Every measurement')}</h2>`;
	},
	card: (x, c) => `<article class="lp-card gr-card" style="--c:${color(c, x.kid)}">
		<p class="lp-k">${esc(c.kidName(x.kid))} · ${c.date(x.date)}${c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}</p>
		<p class="gr-card__vals">${x.cm ? `<span>${doodle('ruler', 16)} <b>${fmt(+x.cm)}</b> ${L('سم', 'cm')}</span>` : ''}${x.kg ? `<span>${doodle('scale', 16)} <b>${fmt(+x.kg)}</b> ${L('كجم', 'kg')}</span>` : ''}</p>
		${c.del(x)}
	</article>`,
	empty: ['أول قياس يتسجل هنا ♥', 'The first measurement goes here ♥'],
	related: ['firsts', 'family', 'health']
});
