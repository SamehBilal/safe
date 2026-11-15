import { L, esc, num, longDate } from '../shell.js';
import { listPage } from '../listpage.js';
import * as live from '../live.js';

/* Growth chart: the boys' height and weight over time, a line each. Heights marked on the door on «أول مرة» count too.
   Band: a tall ruler with each boy's latest height marked on it, a little figure standing at his mark. */
const C = ['#e39b2d', '#5a9e6f', '#0e6990', '#c2185b'];
let doorHeights = [];

const color = (ctx, id) => ctx.kidOf(id)?.color || C[Math.max(0, ctx.kids.findIndex((k) => k.id === id)) % C.length];
const all = (items) => [...items, ...doorHeights].sort((a, b) => String(a.date).localeCompare(String(b.date)));

function chart(items, ctx, key, unit) {
	const pts = all(items).filter((x) => +x[key] > 0);
	if (pts.length < 1) return '';
	const ds = pts.map((x) => +new Date(x.date)), vs = pts.map((x) => +x[key]);
	const d0 = Math.min(...ds), d1 = Math.max(...ds, d0 + 864e5 * 30), v0 = Math.floor(Math.min(...vs) * 0.9), v1 = Math.ceil(Math.max(...vs) * 1.05);
	const X = (d) => 40 + ((d - d0) / (d1 - d0)) * 640, Y = (v) => 200 - ((v - v0) / Math.max(1, v1 - v0)) * 180;
	const lines = ctx.kids.map((k) => {
		const p = pts.filter((x) => x.kid === k.id);
		if (!p.length) return '';
		const c = color(ctx, k.id);
		return `<polyline fill="none" stroke="${c}" stroke-width="3" points="${p.map((x) => `${X(+new Date(x.date)).toFixed(1)},${Y(+x[key]).toFixed(1)}`).join(' ')}"/>${p.map((x) => `<circle cx="${X(+new Date(x.date)).toFixed(1)}" cy="${Y(+x[key]).toFixed(1)}" r="4" fill="${c}"><title>${esc(ctx.kidName(k.id))} · ${num(+x[key])} ${unit} · ${esc(longDate(x.date))}</title></circle>`).join('')}`;
	}).join('');
	const ticks = Array.from({ length: 5 }, (_, i) => v0 + ((v1 - v0) * i) / 4);
	return `<figure class="gr-chart"><figcaption>${key === 'cm' ? L('الطول (سم)', 'Height (cm)') : L('الوزن (كجم)', 'Weight (kg)')}</figcaption><svg viewBox="0 0 700 220" style="direction:ltr">
		${ticks.map((v) => `<line x1="40" x2="680" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gr-grid"/><text x="34" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${num(Math.round(v))}</text>`).join('')}
		<text x="40" y="216">${new Date(d0).getFullYear()}</text><text x="680" y="216" text-anchor="end">${new Date(d1).getFullYear()}</text>${lines}</svg>
		<p class="gr-key">${ctx.kids.map((k) => `<span style="--c:${color(ctx, k.id)}">${esc(ctx.kidName(k.id))}</span>`).join('')}</p></figure>`;
}

export default listPage({
	id: 'growth', kind: 'growth', icon: 'baby',
	title: ['طول الولاد', 'Growth chart'], sub: ['طولهم ووزنهم، سنة ورا سنة', 'Their height and weight, year after year'],
	add: ['سجّلوا قياس', 'Log a measurement'],
	fields: [
		{ n: 'kid', t: 'sel', l: ['مين؟', 'Who?'], opts: 'kids' },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'], req: 1 },
		{ n: 'cm', t: 'num', l: ['الطول (سم)', 'Height (cm)'], step: 0.5 },
		{ n: 'kg', t: 'num', l: ['الوزن (كجم)', 'Weight (kg)'], step: 0.1 }
	],
	note: ['الأطوال اللي اتعلّمت على الباب في «أول مرة» بتبان هنا كمان', 'Heights marked on the door in «Firsts» show here too'],
	chips: { n: 'kid', opts: 'kids' },
	sort: (a, b) => String(b.date).localeCompare(String(a.date)),
	ready: async () => { const f = await live.load('firsts').catch(() => ({ items: [] })); doorHeights = (f.items || []).filter((x) => x.type === 'height').map((x) => ({ ...x, door: 1 })); },
	band: (items, ctx) => {
		const latest = ctx.kids.map((k) => all(items).filter((x) => x.kid === k.id && +x.cm > 0).pop()).filter(Boolean);
		const lo = 40, hi = Math.max(150, ...latest.map((x) => +x.cm + 10));
		const pos = (cm) => ((cm - lo) / (hi - lo)) * 100;
		let ticks = '';
		for (let c = lo; c <= hi; c += 10) ticks += `<span class="gr-tick" style="bottom:${pos(c)}%"><i>${num(c)}</i></span>`;
		return `<div class="gr-band"><div class="gr-ruler">${ticks}${latest.map((x, i) => `<span class="gr-kid" style="bottom:${pos(+x.cm)}%;--c:${color(ctx, x.kid)};--i:${i}"><b>${esc(ctx.kidName(x.kid))}</b> ${num(+x.cm)}</span>`).join('')}</div></div>`;
	},
	top: (items, ctx) => `<div class="gr-charts">${chart(items, ctx, 'cm', L('سم', 'cm'))}${chart(items, ctx, 'kg', L('كجم', 'kg'))}</div>`,
	card: (x, c) => `<article class="lp-card gr-card" style="--c:${color(c, x.kid)}">
		<p class="lp-k">${esc(c.kidName(x.kid))} · ${c.date(x.date)}${c.kidAge(x.kid, x.date) ? ` · ${esc(c.kidAge(x.kid, x.date))}` : ''}</p>
		<h3>${x.cm ? `${num(x.cm)} ${L('سم', 'cm')}` : ''}${x.cm && x.kg ? ' · ' : ''}${x.kg ? `${num(x.kg)} ${L('كجم', 'kg')}` : ''}</h3>
		${c.del(x)}
	</article>`,
	empty: ['أول قياس يتسجل هنا ♥', 'The first measurement goes here ♥'],
	related: ['firsts', 'family', 'health']
});
