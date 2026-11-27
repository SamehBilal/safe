import { App, L, Y, T, esc, num, $, $$, store, hydrate, GROUPS, WIDGETS, WG_SIZES, WG_CELLS, WG_DEFAULT, wgLayout, setWgLayout, wgCells, boardHTML, fillWidgets, WG_MSIZE, WG_MCELLS, wgLayoutM, setWgLayoutM, wgCellsM, wgIsDefaultM } from '../shell.js';
import { doodle } from '../doodles.js';
import { IDEAS } from '../widgetideas.js';

/* The menus' widgets, for the big menu (on a computer) or the phone's menu: pick which, pick a chapter, see its menu's board as it is (four cells across, three down), move, take out
   or add any widget of any size from the shelf under it — the live ones and the ones still shown as their drawing —
   and put it back as it was. The big menu's board is four cells by three; the phone's is two across and up to four down,
   where a strip folds to a wide one and a board to a big one. Kept on this phone (us.widgets and us.widgets.m). */

const SIZE_OF = (w) => WG_SIZES[w.size];
const sizeName = (k) => esc(L(WG_SIZES[k][2], WG_SIZES[k][3]));
/* a live widget's name, or an idea's (those not built yet sit in the menu as their drawing) */
const nameOf = (w) => (w.sketch ? IDEAS[w.idea - 1]?.ar || '' : L(w.ar, w.en));

export default {
	title: { ar: 'ويدجتس القوايم', en: 'Menu widgets' },

	render() {
		const live = WIDGETS.filter((w) => !w.sketch).length;
		/* the top: a workbench page — the title in handwriting under a highlighter, what's on the bench in numbers,
		   and the six menus as little boards drawn cell by cell (each one is how that menu is laid out right now);
		   pick one to work on it */
		return `
		<header class="wgp-hero">
			<span class="wgp-hero__tape" aria-hidden="true"></span>
			<div class="wrap wgp-hero__in">
				<div class="wgp-hero__tx">
					<nav class="crumbs" aria-label="${L('أنت هنا', 'You are here')}"><a href="index.html">${L('الرئيسية', 'Home')}</a><span aria-hidden="true">/</span><a href="widgets.html">${L('ويدجتس القوايم', 'Menu widgets')}</a></nav>
					<p class="wgp-hero__k">${doodle('pencil', 16)} ${L('ورشة القوايم', 'The menus’ workbench')}</p>
					<h1 class="wgp-hero__t">${L('ويدجتس القوايم', 'Menu widgets')}</h1>
					<p class="wgp-hero__sub">${Y('اختار إيه اللي يظهر جنب صفحات كل فصل — في قايمة الكمبيوتر وفي قايمة الموبايل — بأي مقاس، وبأي ترتيب', 'اختاري إيه اللي يظهر جنب صفحات كل فصل — في قايمة الكمبيوتر وفي قايمة الموبايل — بأي مقاس، وبأي ترتيب', 'Choose what sits beside each chapter’s pages — in the big menu and in the phone menu — in any size and any order')}</p>
					<ul class="wgp-hero__facts">
						<li style="--k:0"><b>${num(WIDGETS.length)}</b>${L('ويدجت', 'widgets')}</li>
						<li style="--k:1"><b>${num(live)}</b>${L('حية', 'live')}</li>
						<li style="--k:2"><b>${num(Object.keys(WG_SIZES).length)}</b>${L('مقاسات', 'sizes')}</li>
						<li style="--k:3"><b>${num(WG_CELLS)}</b>${L('خانة في كل قايمة', 'cells a menu')}</li>
					</ul>
				</div>
				<div class="wgp-side">
					<div class="wgp-mode" id="wgp-mode" role="tablist" aria-label="${L('أنهي قايمة', 'Which menu')}">
						<button type="button" role="tab" data-mode="d">${doodle('tv', 16)} ${L('قايمة الكمبيوتر', 'The big menu')}</button>
						<button type="button" role="tab" data-mode="m">${doodle('phone', 16)} ${L('قايمة الموبايل', 'The phone menu')}</button>
					</div>
				<div class="wgp-boards" id="wgp-tabs" role="tablist" aria-label="${L('القوايم', 'The menus')}"></div>
				</div>
			</div>
		</header>
		<section class="sec sec--top wgp-main"><div class="wrap">

			<div class="wgp-edit" id="wgp-edit"></div>

			<div class="wgp-sec">
				<h2 class="wgp-h">${L('الويدجتس الجاهزة', 'Ready to use')}</h2>
				<p class="muted">${Y('كل الويدجتس، كل واحدة بمقاسها. دوس «حطها» عشان تظهر في القايمة، والقايمة فيها ١٢ خانة. اللي عليها «رسمة» لسه بتظهر برسمتها وبتوديك لصفحتها.', 'كل الويدجتس، كل واحدة بمقاسها. دوسي «حطيها» عشان تظهر في القايمة، والقايمة فيها ١٢ خانة. اللي عليها «رسمة» لسه بتظهر برسمتها وبتوديك لصفحتها.', 'Every widget, each at its size. Tap «Add» to put it in the menu; a menu holds 12 cells. Those marked «Drawing» show their drawing and open their page for now.')}</p>
				<div class="wgp-shelf" id="wgp-shelf"></div>
			</div>

		</div></section>`;
	},

	after(main, s) {
		// #story is the big menu's chapter, #m-story the phone's
		const h0 = location.hash.slice(1);
		let mode = h0.startsWith('m-') ? 'm' : 'd';
		let g = GROUPS.some((x) => x.id === h0.replace(/^m-/, '')) ? h0.replace(/^m-/, '') : GROUPS[0].id;
		const grp = () => GROUPS.find((x) => x.id === g);
		const phone = () => mode === 'm';
		const lay = (id = g) => (phone() ? wgLayoutM(id) : wgLayout(id));
		const CELLS = () => (phone() ? WG_MCELLS : WG_CELLS);
		const used = (ids) => (phone() ? wgCellsM(ids) : wgCells(ids));
		const size = (w) => (phone() ? WG_MSIZE[w.size] : SIZE_OF(w));
		const isDefault = () => (phone() ? wgIsDefaultM(g) : JSON.stringify(wgLayout(g)) === JSON.stringify(WG_DEFAULT[g]));
		const hash = () => history.replaceState(history.state, '', `#${phone() ? 'm-' : ''}${g}`);

		/* the menu in the header, redrawn as soon as its widgets change */
		const refreshMenu = () => {
			const side = phone() ? document.querySelector(`#site-nav .pn-wg[data-feature="${g}"]`) : document.querySelector(`#site-header #mega-${g} .mx-side`);
			if (side) { side.innerHTML = phone() ? boardHTML(g, s, undefined, wgLayoutM(g), true) : boardHTML(g, s); hydrate(side); fillWidgets(side); }
		};
		const save = (ids) => { (phone() ? setWgLayoutM : setWgLayout)(g, ids); refreshMenu(); paint(); };

		const paintEdit = () => {
			const ids = lay(), n = used(ids), G = grp(), N = CELLS();
			$('#wgp-edit', main).innerHTML = `
				<div class="wgp-panel${phone() ? ' wgp-panel--m' : ''}" style="--tab:${G.tab};--gc:${G.c}">
					<div class="wgp-panel__h">
						<h2>${phone() ? L('قايمة الموبايل:', 'The phone menu:') : L('قايمة', 'The')} <b>${esc(L(G.ar, G.en))}</b>${phone() ? '' : L('', ' menu')}</h2>
						<span class="wgp-cells${n > N ? ' is-over' : ''}"><span class="wgp-meter" aria-hidden="true">${Array.from({ length: N }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>${L(`${num(n)} من ${num(N)} خانة`, `${n} of ${N} cells`)}</span>
						<button class="btn btn--sm btn--ghost" type="button" id="wgp-reset"${isDefault() ? ' disabled' : ''}>${doodle('refresh', 16)} ${L('رجّعها زي ما كانت', 'Back to how it was')}</button>
					</div>
					${phone()
						? `<div class="wgp-stage wgp-stage--m" aria-hidden="true"><div class="wgp-phone"><span class="wgp-phone__bar"></span><p class="wgp-phone__ch" style="--tab:${G.tab}">${esc(L(G.ar, G.en))}</p><div class="pn-card pn-wg mega-${g}">${boardHTML(g, s, undefined, ids, true)}</div></div></div>`
						: `<div class="wgp-stage mega-${g}" aria-hidden="true">${boardHTML(g, s)}</div>`}
					<ol class="wgp-order">${ids.map((id, i) => {
						const w = WIDGETS.find((x) => x.id === id), [cc, rr] = size(w);
						return `<li style="--i:${i}"><span class="wgp-sz wgp-sz--${w.size}" title="${sizeName(w.size)}"><i style="--c:${cc};--r:${rr}"></i></span><b>${esc(nameOf(w))}</b><small>${sizeName(w.size)}</small>
							<span class="wgp-btns"><button type="button" data-up="${i}"${i ? '' : ' disabled'} aria-label="${L('لقدام', 'Earlier')}">${doodle('back', 16)}</button><button type="button" data-down="${i}"${i < ids.length - 1 ? '' : ' disabled'} aria-label="${L('لورا', 'Later')}">${doodle('forward', 16)}</button><button type="button" data-out="${i}" aria-label="${L('شيلها', 'Remove')}">${doodle('trash', 16)}</button></span></li>`;
					}).join('') || `<li class="wgp-none">${L('القايمة فاضية — ضيف من الجاهزة تحت', 'Empty — add from the ready ones below')}</li>`}</ol>
				</div>`;
			hydrate($('#wgp-edit', main)); fillWidgets($('#wgp-edit', main));
			$('#wgp-reset', main).onclick = () => save(null);
			$('#wgp-edit', main).querySelector('.wgp-order').onclick = (e) => {
				const b = e.target.closest('button'); if (!b) return;
				const ids2 = lay();
				if (b.dataset.up) { const i = +b.dataset.up; [ids2[i - 1], ids2[i]] = [ids2[i], ids2[i - 1]]; }
				else if (b.dataset.down) { const i = +b.dataset.down; [ids2[i + 1], ids2[i]] = [ids2[i], ids2[i + 1]]; }
				else if (b.dataset.out) ids2.splice(+b.dataset.out, 1);
				save(ids2);
			};
		};

		const paintShelf = () => {
			const ids = lay(), free = CELLS() - used(ids);
			const list = WIDGETS.filter((w) => w.g === g);
			$('#wgp-shelf', main).innerHTML = `<div class="wgp-grid mega-${g}" style="--tab:${grp().tab};--gc:${grp().c}">${list.map((w, i) => {
				const [c0, r0] = SIZE_OF(w), [cc, rr] = size(w), on = ids.includes(w.id), fits = cc * rr <= free;
				let h = ''; try { h = w.html(s, '') || ''; } catch { h = ''; }
				return `<article class="wgp-card wg--${w.size}${on ? ' is-on' : ''}" style="--c:${c0};--r:${r0};--i:${i}" data-wg="${w.id}">
					<div class="wgp-live wg wgx-${w.id}">${h || `<span class="wgp-nodata">${L('محتاجة بيانات لسه مش موجودة', 'Needs data we don’t have yet')}</span>`}</div>
					<div class="wgp-alt"><b>${esc(nameOf(w))}</b><small>${esc(w.sketch ? IDEAS[w.idea - 1]?.d || '' : L(w.dar, w.den))}</small></div>
					<div class="wgp-cap"><span class="wgp-sz wgp-sz--${w.size}"><i style="--c:${cc};--r:${rr}"></i></span><b>${esc(nameOf(w))}</b>${w.sketch ? `<span class="wgp-tag">${L('رسمة', 'Drawing')}</span>` : ''}
						<button class="wgp-add" type="button" data-add="${w.id}"${on || !fits ? ' disabled' : ''}>${on ? `${doodle('heart', 14)} ${L('موجودة', 'Added')}` : fits ? `+ ${Y('حطها', 'حطيها', 'Add')}` : L('مفيش مكان', 'No room')}</button></div>
				</article>`;
			}).join('')}</div>`;
			hydrate($('#wgp-shelf', main)); fillWidgets($('#wgp-shelf', main));
		};

		const paint = () => {
			$$('#wgp-mode [data-mode]', main).forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
			/* the six little boards: each menu's widgets as blocks of their size, in the chapter's colour */
			$('#wgp-tabs', main).innerHTML = GROUPS.map((G, i) => {
				const ids = lay(G.id), n = used(ids);
				return `<button class="wgp-mb${G.id === g ? ' is-on' : ''}${phone() ? ' wgp-mb--m' : ''}" type="button" role="tab" aria-selected="${G.id === g}" data-g="${G.id}" style="--tab:${G.tab};--gc:${G.c};--n:${i}">
					<span class="wgp-mb__g" aria-hidden="true">${ids.map((id, k) => { const w = WIDGETS.find((x) => x.id === id); if (!w) return ''; const [cc, rr] = size(w); return `<i class="${w.sketch ? 'is-sk' : ''}" style="--c:${cc};--r:${rr};--k:${k}"></i>`; }).join('')}</span>
					<span class="wgp-mb__t"><i>${num(0)}${num(i + 1)}</i><b>${esc(L(...G.nav))}</b><small>${L(`${num(n)}/${num(CELLS())}`, `${n}/${CELLS()}`)}</small></span>
				</button>`;
			}).join('');
			paintEdit(); paintShelf();
		};

		$('#wgp-mode', main).onclick = (e) => {
			const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === mode) return;
			mode = b.dataset.mode; hash(); paint();
		};
		$('#wgp-tabs', main).onclick = (e) => {
			const b = e.target.closest('[data-g]'); if (!b || b.dataset.g === g) return;
			g = b.dataset.g; hash(); paint();
		};
		main.addEventListener('click', (e) => {
			const add = e.target.closest('[data-add]');
			if (add && !add.disabled) {
				const ids = lay(), w = WIDGETS.find((x) => x.id === add.dataset.add);
				if (ids.includes(w.id)) return;
				const [cc, rr] = size(w);
				if (used(ids) + cc * rr > CELLS()) { add.textContent = L('مفيش مكان — شيل حاجة الأول', 'No room — take one out first'); return; }
				save([...ids, w.id]);
				$('#wgp-edit', main).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
			}
		});
		paint();
	}
};
