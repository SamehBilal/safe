import { L, Y, esc, T } from '../shell.js';
import { listPage } from '../listpage.js';
import * as live from '../live.js';

/* Gift ideas: each of us keeps a list of ideas for the other through the year. This phone only shows the ideas its
   owner wrote, so the other one doesn't stumble on them (the list still travels between phones like the others).
   Band: wrapped boxes with question marks, their lids hopping, and a bow on top. */
export default listPage({
	id: 'giftideas', kind: 'giftideas', icon: 'gift',
	title: ['أفكار هدايا', 'Gift ideas'], sub: ['قايمة سرية لكل واحد فينا — أفكار للتاني طول السنة', 'A secret list each — ideas for the other, all year'],
	add: ['ضيف فكرة', 'Add an idea'],
	fields: [
		{ n: 'for', t: 'sel', l: ['لمين؟', 'For whom?'], opts: (s) => [['other', 'للتاني', 'For my other half'], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, k.name?.ar || k.id, k.name?.en || k.id])] },
		{ n: 'idea', t: 'text', l: ['الفكرة', 'The idea'], req: 1, grow: 1 },
		{ n: 'occ', t: 'sel', l: ['لمناسبة إيه؟', 'For what?'], opts: [['any', 'أي وقت', 'Any time'], ['birthday', 'عيد الميلاد', 'Birthday'], ['anniversary', 'عيد الجواز', 'Anniversary'], ['eid', 'العيد', 'Eid'], ['valentine', 'عيد الحب', 'Valentine’s']] },
		{ n: 'price', t: 'num', l: ['سعرها تقريبًا', 'Rough price'] },
		{ n: 'link', t: 'url', l: ['لينك (اختياري)', 'Link (optional)'], full: 1 },
		{ n: 'note', t: 'text', l: ['ملاحظة (المقاس، اللون…)', 'Note (size, colour…)'], full: 1 }
	],
	note: ['الأفكار دي بتبان على موبايلك إنت بس ♥', 'These only show on your own phone ♥'],
	keep: (x) => x.by === live.me(),
	toggle: { n: 'given' },
	sort: (a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0) || (b.at || 0) - (a.at || 0),
	band: (items) => `<div class="gi-band">${[0, 1, 2, 3].map((i) => `<span class="gi-box" style="--i:${i}"><i class="gi-lid"></i><b>?</b></span>`).join('')}<p class="gi-n">${L(`${items.filter((x) => !x.given).length} فكرة مستنية`, `${items.filter((x) => !x.given).length} ideas waiting`)}</p></div>`,
	card: (x, c) => `<article class="lp-card gi-card${x.given ? ' is-done' : ''}">
		<p class="lp-k">${x.for === 'other' || !x.for ? L('للتاني', 'For my other half') : esc(c.kidName(x.for))}${x.occ && x.occ !== 'any' ? ` · ${esc({ birthday: L('عيد الميلاد', 'Birthday'), anniversary: L('عيد الجواز', 'Anniversary'), eid: L('العيد', 'Eid'), valentine: L('عيد الحب', 'Valentine’s') }[x.occ] || '')}` : ''}${x.price ? ` · ${esc(x.price)} ${L('ج', 'EGP')}` : ''}</p>
		<h3 dir="auto">${esc(x.idea)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.link ? `<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${L('اللينك', 'Link')} ↗</a>` : ''}
		<button class="btn btn--sm ${x.given ? 'btn--ghost' : 'btn--coral'}" type="button" data-tog="${esc(x.id)}">${x.given ? `✓ ${L('اتجابت', 'Given')} · ${c.date(x.given)}` : Y('جبتها ✓', 'جبتها ✓', 'Given ✓')}</button>
		${c.del(x)}
	</article>`,
	empty: ['اكتب أول فكرة — محدش هيشوفها غيرك ♥', 'Write the first idea — only you will see it ♥'],
	related: ['gifts', 'birthday', 'wishes']
});
