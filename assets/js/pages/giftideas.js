import { L, Y, esc, T } from '../shell.js';
import { listPage } from '../listpage.js';
import * as live from '../live.js';
import { shrinkPhoto } from './trips.js';

/* Gift ideas: each of us keeps a list of ideas for the other through the year. This phone only shows the ideas its
   owner wrote, so the other one doesn't stumble on them (the list still travels between phones like the others).
   Each idea has its photo beside it, taped on like a polaroid (a wrapped box until one's added — tap it to add one).
   Band: wrapped boxes with question marks, their lids hopping, and a bow on top. */
export default listPage({
	id: 'giftideas', kind: 'giftideas', icon: 'gift',
	title: ['أفكار هدايا', 'Gift ideas'], sub: ['قايمة سرية لكل واحد فينا — أفكار للتاني طول السنة', 'A secret list each — ideas for the other, all year'],
	add: ['ضيف فكرة', 'Add an idea'],
	fields: [
		{ n: 'for', t: 'sel', l: ['لمين؟', 'For whom?'], opts: (s) => [['other', 'للتاني', 'For my other half'], ...(s.family?.members || []).filter((m) => m.kid).map((k) => [k.id, k.name?.ar || k.id, k.name?.en || k.id])] },
		{ n: 'idea', t: 'text', l: ['الفكرة', 'The idea'], req: 1, grow: 1 },
		{ n: 'photo', t: 'photo', l: ['صورتها (اختياري)', 'A photo of it (optional)'], full: 1 },
		{ n: 'occ', t: 'sel', l: ['لمناسبة إيه؟', 'For what?'], opts: [['any', 'أي وقت', 'Any time'], ['birthday', 'عيد الميلاد', 'Birthday'], ['anniversary', 'عيد الجواز', 'Anniversary'], ['eid', 'العيد', 'Eid'], ['valentine', 'عيد الحب', 'Valentine’s']] },
		{ n: 'price', t: 'num', l: ['سعرها تقريبًا', 'Rough price'] },
		{ n: 'link', t: 'url', l: ['لينك (اختياري)', 'Link (optional)'], full: 1 },
		{ n: 'note', t: 'text', l: ['ملاحظة (المقاس، اللون…)', 'Note (size, colour…)'], full: 1 }
	],
	note: ['الأفكار دي بتبان على موبايلك إنت بس ♥', 'These only show on your own phone ♥'],
	keep: (x) => x.by === live.me(),
	toggle: { n: 'given' },
	sort: (a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0) || (b.at || 0) - (a.at || 0),
	band: (items) => `<div class="gi-band">${[0, 1, 2, 3].map((i) => `<span class="gi-box" style="--i:${i}"><i class="gi-lid"></i><b>?</b></span>`).join('')}<p class="gi-n"><span>${L(`${items.filter((x) => !x.given).length} فكرة مستنية`, `${items.filter((x) => !x.given).length} ideas waiting`)}</span></p></div>`,
	card: (x, c) => `<article class="lp-card gi-card${x.given ? ' is-done' : ''}">
		${x.photo
			? `<figure class="gi-pic"><img class="zoom" data-sketch="${esc(x.photo)}" alt="${esc(x.idea)}" loading="lazy"></figure>`
			: `<button class="gi-pic gi-pic--empty" type="button" data-gi-photo="${esc(x.id)}"${live.canWrite() ? '' : ' disabled'} aria-label="${L('ضيف صورة للفكرة', 'Add a photo of it')}"><span class="gi-box" aria-hidden="true"><i class="gi-lid"></i><b>?</b></span><small>${live.canWrite() ? Y('ضيف صورة', 'ضيفي صورة', 'Add a photo') : ''}</small></button>`}
		<div class="gi-tx">
		<p class="lp-k">${x.for === 'other' || !x.for ? L('للتاني', 'For my other half') : esc(c.kidName(x.for))}${x.occ && x.occ !== 'any' ? ` · ${esc({ birthday: L('عيد الميلاد', 'Birthday'), anniversary: L('عيد الجواز', 'Anniversary'), eid: L('العيد', 'Eid'), valentine: L('عيد الحب', 'Valentine’s') }[x.occ] || '')}` : ''}${x.price ? ` · ${esc(x.price)} ${L('ج', 'EGP')}` : ''}</p>
		<h3 dir="auto">${esc(x.idea)}</h3>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${x.link ? `<a class="link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${L('اللينك', 'Link')} ↗</a>` : ''}
		<button class="btn btn--sm ${x.given ? 'btn--ghost' : 'btn--coral'}" type="button" data-tog="${esc(x.id)}">${x.given ? `✓ ${L('اتجابت', 'Given')} · ${c.date(x.given)}` : Y('جبتها ✓', 'جبتها ✓', 'Given ✓')}</button>
		${c.del(x)}
		</div>
	</article>`,
	/* a photo for an idea that's already on the list */
	click: (e, c) => {
		const b = e.target.closest('[data-gi-photo]');
		if (!b || !live.canWrite()) return;
		const pick = document.createElement('input');
		pick.type = 'file'; pick.accept = 'image/*';
		pick.onchange = async () => {
			const file = pick.files[0];
			if (!file) return;
			b.disabled = true; b.classList.add('is-busy');
			try {
				const photo = await live.putSketch(await shrinkPhoto(file, 1200));
				await c.save((d) => { const x = (d.items || []).find((y) => y.id === b.dataset.giPhoto); if (x) x.photo = photo; });
			} catch (err) { alert(live.why(err)); b.disabled = false; b.classList.remove('is-busy'); }
		};
		pick.click();
	},
	empty: ['اكتب أول فكرة — محدش هيشوفها غيرك ♥', 'Write the first idea — only you will see it ♥'],
	related: ['gifts', 'birthday', 'wishes']
});
