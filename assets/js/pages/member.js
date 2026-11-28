import { L, T, esc, img, age, longDate, parseDate, daysBetween, num, fmtDate, pageHead, related, qs, App, $, hydrate } from '../shell.js';
import { whoGame, canWho } from '../photogames.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import { relative } from '../tree.js';

/* One person's page — any of the four of us (from story.json), or anyone on the family tree (member.html?id=<their id
   on the tree>). Above the title a scene of their own: his desk with a steaming mug and a controller, her teacup with
   hearts rising and flowers, the big brother's toy car racing along a road under balloons, the baby's mobile turning
   over his cradle; for someone on the tree, a branch with their ribbon swinging from it.
   Under it: their picture and their numbers as cards, their words, their days in our story (the latest six, the rest
   behind «شوف الكل»), the photo a month or a year, their photos (twelve, the rest behind «شوف الكل»), and the family. */

const SHOW = 6, SHOW_PHOTOS = 12;
const kidAge = (m) => (m.born ? (Date.now() - parseDate(m.born)) / (365.25 * 864e5) : 99);

/* ---------- the scenes above the title ---------- */
function scene(m, who) {
	const c = esc(m.color || '#0e6990');
	if (who === 'him') return `<div class="mb-scene mb-desk" style="--c:${c}">
		<svg viewBox="0 0 420 170"><path class="mb-ink mb-table" d="M10 150h400"/>
			<g class="mb-steam"><path d="M150 52c-8-10 8-16 0-28M166 52c-8-10 8-16 0-28M182 52c-8-10 8-16 0-28"/></g>
			<path class="mb-ink" d="M136 62h58v66a10 10 0 0 1-10 10h-38a10 10 0 0 1-10-10Z" fill="${c}"/><path class="mb-ink" d="M194 78h10a12 12 0 0 1 0 24h-10" fill="none"/>
			<text class="mb-mug" x="165" y="108">${esc(L('بابا', 'DAD'))}</text>
			<g class="mb-pad"><path class="mb-ink" d="M250 112c4-22 22-28 44-28h22c22 0 40 6 44 28l6 22c2 10-10 16-18 8l-14-14h-58l-14 14c-8 8-20 2-18-8Z" fill="#37353f"/>
				<path d="M272 104v14M265 111h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="336" cy="104" r="3.5" fill="#f2726f"/><circle cx="345" cy="112" r="3.5" fill="#5a9e6f"/><circle cx="327" cy="112" r="3.5" fill="#fdc830"/><circle cx="336" cy="120" r="3.5" fill="#8fd1ef"/></g>
			<path class="mb-ink" d="M40 150v-38h64v38M48 112l24-30 24 30" fill="#fdf6e3"/><path class="mb-ink" d="M62 150v-20h20v20" fill="${c}"/>
		</svg></div>`;
	if (who === 'her') return `<div class="mb-scene mb-tea" style="--c:${c}">
		<svg viewBox="0 0 420 170"><path class="mb-ink mb-table" d="M10 150h400"/>
			<g class="mb-hearts">${[0, 1, 2].map((i) => `<path style="--i:${i}" d="M${168 + i * 18} 50l-7-7a4.5 4.5 0 0 1 7-5.5 4.5 4.5 0 0 1 7 5.5Z" fill="${c}"/>`).join('')}</g>
			<path class="mb-ink" d="M140 80h76v26a38 38 0 0 1-76 0Z" fill="#fff"/><path class="mb-ink" d="M216 88h10a12 12 0 0 1 0 24h-14" fill="none"/><path class="mb-ink" d="M126 146h104" />
			<path d="M150 96h56" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".5"/>
			<g class="mb-notes">${[[248, 44], [278, 22], [300, 54]].map(([x, y], i) => `<g style="--i:${i};color:${c}" transform="translate(${x} ${y})">${doodle('music', 22)}</g>`).join('')}</g>
			<path class="mb-ink" d="M330 150v-48h36v48Z" fill="#cfe9f5"/>${[[336, 70, '#f2726f'], [352, 58, '#fdc830'], [366, 72, '#c2185b']].map(([x, y, f]) => `<path class="mb-ink" d="M348 102 ${x} ${y + 14}" fill="none"/><circle class="mb-ink mb-flower" cx="${x}" cy="${y}" r="10" fill="${f}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff6b8"/>`).join('')}
		</svg></div>`;
	if (m.kid && kidAge(m) < 2) return `<div class="mb-scene mb-crib" style="--c:${c}">
		<svg viewBox="0 0 420 170"><path class="mb-ink" d="M210 4v24"/><g class="mb-mobile"><path class="mb-ink" d="M130 28h160" />
			${[[140, 70, 'moon'], [190, 86, 'star'], [240, 70, 'chick'], [280, 82, 'heart']].map(([x, y, ic], i) => `<g class="mb-hang" style="--i:${i}"><path class="mb-ink" d="M${x} 28V${y - 16}"/><g transform="translate(${x - 16} ${y - 16})" class="mb-toy"><circle cx="16" cy="16" r="17" fill="#fffdf6" stroke="#37353f" stroke-width="2"/><g transform="translate(4 4)" style="color:${c}">${doodle(ic, 24)}</g></g></g>`).join('')}</g>
			<path class="mb-ink" d="M110 160c0-28 30-40 100-40s100 12 100 40Z" fill="${c}" opacity=".85"/>${Array.from({ length: 9 }, (_, i) => `<path class="mb-ink" d="M${126 + i * 21} 160v-34"/>`).join('')}
		</svg></div>`;
	if (m.kid) return `<div class="mb-scene mb-road" style="--c:${c}">
		<svg viewBox="0 0 420 170"><g class="mb-balloons">${[[80, '#f2726f'], [110, '#fdc830'], [330, '#8fd1ef'], [360, '#5a9e6f']].map(([x, f], i) => `<g style="--i:${i}"><path class="mb-ink" d="M${x} 66c-4 12 4 22 0 40" fill="none"/><ellipse class="mb-ink" cx="${x}" cy="44" rx="16" ry="21" fill="${f}"/></g>`).join('')}</g>
			<path d="M0 146h420" stroke="#37353f" stroke-width="3"/><path d="M10 158h40M90 158h40M170 158h40M250 158h40M330 158h40" stroke="#fdc830" stroke-width="4" stroke-linecap="round"/>
			<g class="mb-car"><path class="mb-ink" d="M20 128v-14l14-16h44l16 16h12v14Z" fill="${c}"/><path class="mb-ink" d="M40 112l8-10h24l10 10Z" fill="#cfe9f5"/><circle class="mb-ink" cx="42" cy="132" r="9" fill="#37353f"/><circle class="mb-ink" cx="92" cy="132" r="9" fill="#37353f"/>
				<g transform="translate(46 86)" style="color:#37353f">${doodle(m.emoji || 'star', 22)}</g></g>
		</svg></div>`;
	return '';
}
const branch = (r) => `<div class="mb-scene mb-branch" style="--c:${r.colour}">
	<svg viewBox="0 0 420 170"><path class="mb-bark" d="M0 26C90 18 170 40 250 30S380 10 420 22"/>${[[60, 22], [130, 30], [300, 26], [370, 16]].map(([x, y], i) => `<ellipse class="mb-leaf" style="--i:${i}" cx="${x}" cy="${y - 10}" rx="12" ry="6" transform="rotate(${i % 2 ? 30 : -30} ${x} ${y - 10})"/>`).join('')}
		<path class="mb-ink" d="M210 31v26"/></svg>
	<span class="mb-ribbon"><span class="mb-ribbon__pic">${r.face(30)}</span><b dir="auto">${esc(r.name)}</b><small>${esc(r.relation)}</small></span>
</div>`;

/* ---------- pieces ---------- */
const fact = (ic, label, value) => `<div class="mb-fact"><span class="mb-fact__ic">${doodle(ic, 20)}</span><small>${label}</small><b>${value}</b></div>`;
const more = (n, id) => `<button class="btn btn--sm mb-more" type="button" data-more="${id}">${L(`شوف الكل (${num(n)})`, `See all (${n})`)}</button>`;
function nextBirthday(iso) {
	const b = parseDate(iso);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	let n = new Date(today.getFullYear(), b.getMonth(), b.getDate());
	if (n < today) n = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
	return Math.round((n - today) / 864e5);
}
const familyRow = (members, here) => `<section class="sec"><div class="wrap">
	<h2 class="sec__title">${L('عيلتنا', 'Our family')}</h2>
	<div class="mb-fam">${members.map((x) => `<a class="mb-fam__one${x.id === here ? ' is-here' : ''}" href="member.html?id=${esc(x.id)}" style="--c:${esc(x.color || '#0e6990')}"><span class="mb-fam__pic">${x.photo ? `<span data-media-box>${img(x.photo, App.t(x.name))}</span>` : doodle(x.emoji, 34)}</span><b>${T(x.name)}</b></a>`).join('')}
		<a class="mb-fam__one mb-fam__tree" href="family.html#tree"><span class="mb-fam__pic">${doodle('family', 30)}</span><b>${L('وباقي العيلة في الشجرة', 'And the rest, on the tree')}</b></a></div>
</div></section>`;

export default {
	title: { ar: 'عيلتنا', en: 'Our family' },
	render(s) {
		const members = s.family?.members || [];
		const id = qs('id');
		const m = members.find((x) => x.id === id) || (id ? null : members[0]);
		/* someone on the tree: drawn once the tree is loaded */
		if (!m) return `${pageHead(L('من عيلتنا', 'Family'), '', [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }], { band: '<div class="mb-band" id="mb-band"></div>' })}
			<section class="sec sec--top"><div class="wrap" id="mb-rel"><p class="empty">${L('بنفتح الشجرة…', 'Opening the tree…')}</p></div></section>
			${familyRow(members, '')}${related(['family', 'gallery', 'chapters'])}`;
		this.title = m.name;
		const grown = members.filter((x) => !x.kid);
		const who = m === grown[0] ? 'him' : m === grown[1] ? 'her' : '';
		const name = App.t(m.name);
		const she = !!m.female;
		const days = (s.timeline || []).filter((x) => x.id === m.id || x.chapter === m.id || (x.who || []).includes(m.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
		const chapter = (s.chapters || []).find((c) => c.id === m.id);
		const list = days.filter((d) => !chapter || d.chapter !== chapter.id);
		const photos = [...(m.photos || []), ...(s.gallery || []).filter((g) => (g.who || []).includes(m.id))].map((p) => (typeof p === 'string' ? { photo: p } : p));
		const next = m.born ? nextBirthday(m.born) : null;
		const day = (d, k) => `<a class="mb-day${k >= SHOW ? ' is-more' : ''}" href="moment.html?id=${esc(d.id)}" data-group="days"><span class="mb-day__ic">${doodle(d.icon, 22)}</span><span><small>${fmtDate(d.date)}</small><b dir="auto">${T(d.title)}</b></span></a>`;
		return `
		${pageHead(name, App.t(m.role), [{ href: 'family.html', ar: 'عيلتنا', en: 'Our family' }, { href: '#', label: m.name }], { band: scene(m, who) || undefined, photos: [m.photo].filter(Boolean) })}
		<section class="sec sec--top"><div class="wrap">
			<div class="mb-card reveal" style="--c:${esc(m.color || '#0e6990')}">
				<div class="mb-card__pic">${m.photo ? `<span data-media-box>${img(m.photo, name, 'zoom')}</span>` : `<span class="mb-card__doodle">${doodle(m.emoji, 70)}</span>`}<b>${esc(name)}</b></div>
				<div class="mb-card__facts">
					${m.born ? fact('cake', she ? L('اتولدت', 'Born') : L('اتولد', 'Born'), esc(longDate(m.born))) : ''}
					${m.born ? fact('star', she ? L('عندها', 'Age') : L('عنده', 'Age'), esc(age(m.born))) : ''}
					${m.born ? fact('sun', L('يوم في الدنيا', 'Days in the world'), num(daysBetween(parseDate(m.born)))) : ''}
					${next !== null ? fact('calendar', she ? L('عيد ميلادها الجاي', 'Next birthday') : L('عيد ميلاده الجاي', 'Next birthday'), next === 0 ? L('النهارده!', 'Today!') : L(`بعد ${num(next)} يوم`, `in ${next} days`)) : ''}
					${fact('book', L('أيام في حكايتنا', 'Days in our story'), num(days.length))}
					${fact('camera', L('صورة', 'Photos'), num(photos.length))}
				</div>
			</div>
			${m.text ? `<p class="lede reveal">${T(m.text)}</p>` : ''}
			${App.t(m.story || '').split(/\n{2,}/).filter(Boolean).map((p) => `<p class="prose reveal">${esc(p)}</p>`).join('')}
			${chapter ? `<a class="otd reveal" href="chapter.html?id=${esc(chapter.id)}"><span class="otd__ic">${doodle(chapter.icon, 28)}</span><span><small>${L('حكاية اليوم ده', 'The story of that day')}</small><b>${T(chapter.title)}</b></span><span aria-hidden="true">${App.arrow}</span></a>` : ''}
			${m.kid && m === members.find((x) => x.kid) && canWho(s) ? `<button class="otd reveal mb-play" type="button" id="mb-who"><span class="otd__ic">${doodle('lion', 28)}</span><span><small>${L('لعبته', 'His game')}</small><b>${L('صور مين؟ — العب', 'Who’s in the photo? — play')}</b></span><span aria-hidden="true">${App.arrow}</span></button>` : ''}
			${list.length ? `<h2 class="sec__title mb-h">${she ? L('أيامها في حكايتنا', 'Her days in our story') : L('أيامه في حكايتنا', 'His days in our story')}</h2>
				<div class="mb-days" id="mb-days">${list.map(day).join('')}</div>${list.length > SHOW ? `<p class="mb-more-wrap">${more(list.length, 'days')}</p>` : ''}` : ''}
		</div>
		${m.growth && m.born ? growth(m) : ''}
		${photos.length ? `<div class="wrap"><h2 class="sec__title mb-h">${she ? L('صورها', 'Her photos') : L('صوره', 'His photos')}</h2>
			<div class="gallery mb-photos">${photos.map((p, k) => `<figure class="shot${k >= SHOW_PHOTOS ? ' is-more' : ''}" data-group="photos" data-media-box>${img(p.photo, App.t(p.caption), 'zoom')}${p.caption ? `<figcaption>${T(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div>
			${photos.length > SHOW_PHOTOS ? `<p class="mb-more-wrap">${more(photos.length, 'photos')}</p>` : ''}</div>` : ''}
		</section>
		${familyRow(members, m.id)}
		${related(['family', 'gallery', 'chapters'])}`;
	},

	async after(main, s) {
		$('#mb-who', main)?.addEventListener('click', () => whoGame(s));
		/* «شوف الكل»: the rest of the days or the photos */
		main.addEventListener('click', (e) => {
			const b = e.target.closest('[data-more]');
			if (!b) return;
			for (const el of main.querySelectorAll(`[data-group="${b.dataset.more}"].is-more`)) el.classList.remove('is-more');
			b.closest('.mb-more-wrap')?.remove();
		});
		const box = $('#mb-rel', main);
		if (!box) return;
		/* someone on the tree */
		const tree = await live.load('tree').catch(() => ({ items: [] }));
		const fam = await live.load('famdays').catch(() => ({ items: [] }));
		const r = relative(qs('id'), tree.items || [], s);
		if (!r) { box.innerHTML = `<p class="empty">${L('مش لاقيين الشخص ده في الشجرة', 'We couldn’t find them on the tree')} — <a href="family.html#tree">${L('الشجرة', 'The tree')}</a></p>`; return; }
		const { p } = r;
		document.title = `${r.name} — ${document.title.split(' — ').pop()}`;
		const h1 = main.querySelector('.ph h1, .ph__title');
		if (h1) h1.textContent = r.name;
		let sub = main.querySelector('.ph__sub');
		if (!sub && h1) { sub = document.createElement('p'); sub.className = 'ph__sub'; h1.after(sub); }
		if (sub) sub.textContent = r.relation;
		$('#mb-band', main).innerHTML = branch(r);
		const born = p.born ? String(p.born) : '';
		const full = /^\d{4}-\d{2}-\d{2}$/.test(born);
		const bday = full ? born : ((fam.items || []).find((d) => d.type === 'birthday' && d.date && String(d.name || '').includes(p.name))?.date || '');
		const next = bday && !p.gone ? nextBirthday(bday) : null;
		const chip = (x) => `<a class="mb-rel__chip" href="member.html?id=${esc(x.id)}" style="--c:${r.colour}"><span>${r.faceOf(x, 22)}</span><b dir="auto">${esc(r.nameOf(x))}</b><small>${esc(r.relationOf(x))}</small></a>`;
		box.innerHTML = `
			<div class="mb-card mb-card--rel reveal is-in" style="--c:${r.colour}">
				<div class="mb-card__pic${p.gone ? ' is-gone' : ''}"><span class="mb-card__doodle mb-card__face">${r.face(70)}</span><b dir="auto">${esc(r.name)}</b></div>
				<div class="mb-card__facts">
					${fact('family', L('يبقى', 'Who they are'), esc(r.relation))}
					${born ? fact('cake', r.woman ? L('اتولدت', 'Born') : L('اتولد', 'Born'), esc(full ? longDate(born) : num(+born).replace(/[٬,]/g, ''))) : ''}
					${born && !p.gone ? fact('star', r.woman ? L('عندها', 'Age') : L('عنده', 'Age'), esc(full ? age(born) : L(`حوالي ${num(new Date().getFullYear() - +born)} سنة`, `about ${new Date().getFullYear() - +born}`))) : ''}
					${next !== null ? fact('calendar', L('عيد الميلاد الجاي', 'Next birthday'), next === 0 ? L('النهارده!', 'Today!') : L(`بعد ${num(next)} يوم`, `in ${next} days`)) : ''}
					${p.gone ? fact('heart', '♡', esc(r.gone)) : ''}
				</div>
			</div>
			${r.note ? `<p class="lede reveal is-in" dir="auto">${esc(r.note)}</p>` : ''}
			${r.parent ? `<h2 class="sec__title mb-h">${r.woman ? L('بنت', 'Daughter of') : L('ابن', 'Son of')}</h2><div class="mb-rel__chips">${chip(r.parent)}</div>` : ''}
			${r.kids.length ? `<h2 class="sec__title mb-h">${r.woman ? L('ولادها', 'Her children') : L('ولاده', 'His children')}</h2><div class="mb-rel__chips">${r.kids.map(chip).join('')}</div>` : ''}
			${r.sibs.length ? `<h2 class="sec__title mb-h">${r.woman ? L('إخواتها', 'Her brothers and sisters') : L('إخواته', 'His brothers and sisters')}</h2><div class="mb-rel__chips">${r.sibs.map(chip).join('')}</div>` : ''}
			<p class="mb-more-wrap"><a class="btn btn--coral" href="family.html#tree">${doodle('family', 18)} ${L('في شجرة العيلة', 'On the family tree')}</a></p>`;
		hydrate(box);
		live.hydrateSketches(main);
	}
};

/* One photo a month or one a year, from the folders images/family/<id>/months|years/<n>.jpg:
   a photo shows as a polaroid, a month or year still to fill as an empty frame with its date. */
function growth(m) {
	const b = parseDate(m.born);
	const now = new Date();
	const monthly = m.growth.every === 'month';
	const at = (n) => (monthly ? new Date(b.getFullYear(), b.getMonth() + n, b.getDate()) : new Date(b.getFullYear() + n, b.getMonth(), b.getDate()));
	let done = 0;
	while (at(done + 1) <= now) done++;
	const pics = m.growth.photos || {};
	const last = Math.max(done + 1, monthly ? 12 : 1, ...Object.keys(pics).map(Number));
	const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const born = m.female ? L('يوم ما اتولدت', 'The day she was born') : L('يوم ما اتولد', 'The day he was born');
	const label = (n) => (n === 0 ? born : monthly
		? L(n === 1 ? 'الشهر الأول' : `شهر ${num(n)}`, n === 1 ? 'One month' : `${n} months`)
		: L(n === 1 ? 'سنة' : n === 2 ? 'سنتين' : `${num(n)} ${n <= 10 ? 'سنين' : 'سنة'}`, n === 1 ? 'One year old' : `${n} years old`));
	const tiles = [];
	for (let n = monthly && !pics[0] ? 1 : 0; n <= last; n++) {
		const d = at(n), p = pics[n], soon = n > done;
		tiles.push(`<figure class="grow__tile${p ? '' : ' grow__tile--empty'}${soon ? ' grow__tile--soon' : ''}"${p ? ' data-media-box' : ''}>
			${p ? img(p, label(n), 'zoom') : `<span class="grow__blank" aria-hidden="true">${doodle(soon ? 'sparkle' : 'camera', 34)}</span>`}
			<figcaption><b>${label(n)}</b><small>${fmtDate(iso(d))}</small></figcaption>
		</figure>`);
	}
	const name = T(m.name);
	const title = monthly ? L(`${name} شهر بشهر`, `${name}, month by month`) : L(`${name} سنة بسنة`, `${name}, year by year`);
	const sub = monthly
		? L('صورة كل شهر — بنشوفه بيكبر قدام عينينا', 'A photo every month — watching him grow before our eyes')
		: L('صورة في كل عيد ميلاد — من أول يوم لحد النهارده', 'A photo every birthday — from day one to today');
	return `<div class="wrap"><div class="grow reveal" style="--c:${esc(m.color || '#0e6990')}">
		<h2 class="sec__title">${title}</h2><p class="sec__sub">${sub}</p>
		<div class="grow__grid">${tiles.join('')}</div>
	</div></div>`;
}
