import { App, L, Y, T, esc, num, pageHead, $, store, hydrate, GROUPS, WIDGETS, WG_SIZES, WG_CELLS, WG_DEFAULT, wgLayout, setWgLayout, wgCells, boardHTML, fillWidgets } from '../shell.js';
import { doodle } from '../doodles.js';
import { IDEAS } from '../widgetideas.js';

/* The menus' widgets: pick a chapter, see its menu's board as it is (four cells across, three down), move, take out
   or add widgets of every size from the ones that are ready, and put it back as it was. Under that, the wall of a
   hundred ideas — small, wide, tall and big, each a little drawing — to mark the ones we want made next.
   The choice is kept on this phone (us.widgets); the ideas we want, too (us.wideas). */

const SIZE_OF = (w) => WG_SIZES[w.size];
const sizeName = (k) => esc(L(WG_SIZES[k][2], WG_SIZES[k][3]));
const WANT = 'us.wideas';
const wanted = () => { try { return new Set(JSON.parse(store.get(WANT) || '[]')); } catch { return new Set(); } };
const readyFor = (n) => WIDGETS.find((w) => w.idea === n);
/* a live widget's name, or an idea's (those not built yet sit in the menu as their drawing) */
const nameOf = (w) => (w.sketch ? IDEAS[w.idea - 1]?.ar || '' : L(w.ar, w.en));

export default {
	title: { ar: 'ويدجتس القوايم', en: 'Menu widgets' },

	render() {
		return `
		${pageHead(L('ويدجتس القوايم', 'Menu widgets'), Y('اختار إيه اللي يظهر جنب صفحات كل فصل في القايمة الكبيرة، بأي مقاس: صغيرة، عريضة، طويلة أو كبيرة', 'اختاري إيه اللي يظهر جنب صفحات كل فصل في القايمة الكبيرة، بأي مقاس: صغيرة، عريضة، طويلة أو كبيرة', 'Choose what sits beside each chapter’s pages in the big menu, in any size: small, wide, tall or big'))}
		<section class="sec sec--top"><div class="wrap">
			<div class="wgp-tabs" id="wgp-tabs" role="tablist" aria-label="${L('الفصول', 'Chapters')}">${GROUPS.map((g, i) => `<button class="wgp-tab" type="button" role="tab" data-g="${g.id}" style="--tab:${g.tab};--gc:${g.c}"><i>${num(0)}${num(i + 1)}</i>${esc(L(...g.nav))}</button>`).join('')}</div>

			<div class="wgp-edit" id="wgp-edit"></div>

			<div class="wgp-sec">
				<h2 class="wgp-h">${L('الويدجتس الجاهزة', 'Ready to use')}</h2>
				<p class="muted">${Y('دوس «حطها» عشان تظهر في القايمة. كل ويدجت ليها مقاسها، والقايمة فيها ١٢ خانة.', 'دوسي «حطيها» عشان تظهر في القايمة. كل ويدجت ليها مقاسها، والقايمة فيها ١٢ خانة.', 'Tap «Add» to put it in the menu. Each widget has its size; a menu holds 12 cells.')}</p>
				<div class="wgp-shelf" id="wgp-shelf"></div>
			</div>

			<div class="wgp-sec">
				<h2 class="wgp-h">${L('المية فكرة', 'The hundred ideas')}</h2>
				<p class="muted">${Y('كل فكرة تقدر تحطها في القايمة بمقاسها. «حية» يعني بتقرا من بياناتنا، و«رسمة» يعني لسه بتظهر برسمتها وبتوديك لصفحتها لحد ما تتعمل.', 'كل فكرة تقدري تحطيها في القايمة بمقاسها. «حية» يعني بتقرا من بياناتنا، و«رسمة» يعني لسه بتظهر برسمتها وبتوديك لصفحتها لحد ما تتعمل.', 'Every idea can go in a menu at its size. «Live» reads our data; «Drawing» shows its drawing and opens its page until it is built.')}</p>
				<div class="wk" id="wk"></div>
				<div class="wk-bar" id="wk-bar" hidden><span id="wk-n"></span><button class="btn btn--sm btn--coral" type="button" id="wk-copy">${doodle('letter', 16)} ${Y('انسخ اللي عايزه', 'انسخي اللي عايزاه', 'Copy my picks')}</button><span class="muted" id="wk-msg" role="status"></span></div>
			</div>
		</div></section>`;
	},

	after(main, s) {
		let g = GROUPS.some((x) => x.id === location.hash.slice(1)) ? location.hash.slice(1) : GROUPS[0].id;
		const want = wanted();
		const grp = () => GROUPS.find((x) => x.id === g);

		/* the menu in the header, redrawn as soon as its widgets change */
		const refreshMenu = () => {
			const side = document.querySelector(`#site-header #mega-${g} .mx-side`);
			if (side) { side.innerHTML = boardHTML(g, s); hydrate(side); fillWidgets(side); }
		};
		const save = (ids) => { setWgLayout(g, ids); refreshMenu(); paint(); };

		const paintEdit = () => {
			const ids = wgLayout(g), used = wgCells(ids), G = grp();
			const isDefault = JSON.stringify(ids) === JSON.stringify(WG_DEFAULT[g]);
			$('#wgp-edit', main).innerHTML = `
				<div class="wgp-panel" style="--tab:${G.tab};--gc:${G.c}">
					<div class="wgp-panel__h">
						<h2>${L('قايمة', 'The')} <b>${esc(L(G.ar, G.en))}</b>${L('', ' menu')}</h2>
						<span class="wgp-cells${used > WG_CELLS ? ' is-over' : ''}"><span class="wgp-meter" aria-hidden="true">${Array.from({ length: WG_CELLS }, (_, i) => `<i class="${i < used ? 'on' : ''}"></i>`).join('')}</span>${L(`${num(used)} من ${num(WG_CELLS)} خانة`, `${used} of ${WG_CELLS} cells`)}</span>
						<button class="btn btn--sm btn--ghost" type="button" id="wgp-reset"${isDefault ? ' disabled' : ''}>${doodle('refresh', 16)} ${L('رجّعها زي ما كانت', 'Back to how it was')}</button>
					</div>
					<div class="wgp-stage mega-${g}" aria-hidden="true">${boardHTML(g, s)}</div>
					<ol class="wgp-order">${ids.map((id, i) => {
						const w = WIDGETS.find((x) => x.id === id);
						return `<li style="--i:${i}"><span class="wgp-sz wgp-sz--${w.size}" title="${sizeName(w.size)}"><i style="--c:${SIZE_OF(w)[0]};--r:${SIZE_OF(w)[1]}"></i></span><b>${esc(nameOf(w))}</b><small>${sizeName(w.size)}</small>
							<span class="wgp-btns"><button type="button" data-up="${i}"${i ? '' : ' disabled'} aria-label="${L('لقدام', 'Earlier')}">${doodle('back', 16)}</button><button type="button" data-down="${i}"${i < ids.length - 1 ? '' : ' disabled'} aria-label="${L('لورا', 'Later')}">${doodle('forward', 16)}</button><button type="button" data-out="${i}" aria-label="${L('شيلها', 'Remove')}">${doodle('trash', 16)}</button></span></li>`;
					}).join('') || `<li class="wgp-none">${L('القايمة فاضية — ضيف من الجاهزة تحت', 'Empty — add from the ready ones below')}</li>`}</ol>
				</div>`;
			hydrate($('#wgp-edit', main)); fillWidgets($('#wgp-edit', main));
			$('#wgp-reset', main).onclick = () => save(null);
			$('#wgp-edit', main).querySelector('.wgp-order').onclick = (e) => {
				const b = e.target.closest('button'); if (!b) return;
				const ids2 = wgLayout(g);
				if (b.dataset.up) { const i = +b.dataset.up; [ids2[i - 1], ids2[i]] = [ids2[i], ids2[i - 1]]; }
				else if (b.dataset.down) { const i = +b.dataset.down; [ids2[i + 1], ids2[i]] = [ids2[i], ids2[i + 1]]; }
				else if (b.dataset.out) ids2.splice(+b.dataset.out, 1);
				save(ids2);
			};
		};

		const paintShelf = () => {
			const ids = wgLayout(g), free = WG_CELLS - wgCells(ids);
			const list = WIDGETS.filter((w) => w.g === g && !w.sketch);
			$('#wgp-shelf', main).innerHTML = `<div class="wgp-grid mega-${g}" style="--tab:${grp().tab};--gc:${grp().c}">${list.map((w, i) => {
				const [c, r] = SIZE_OF(w), on = ids.includes(w.id), fits = c * r <= free;
				let h = ''; try { h = w.html(s, '') || ''; } catch { h = ''; }
				return `<article class="wgp-card wg--${w.size}${on ? ' is-on' : ''}" style="--c:${c};--r:${r};--i:${i}" data-wg="${w.id}">
					<div class="wgp-live wg wgx-${w.id}">${h || `<span class="wgp-nodata">${L('محتاجة بيانات لسه مش موجودة', 'Needs data we don’t have yet')}</span>`}</div>
					<div class="wgp-alt"><b>${esc(nameOf(w))}</b><small>${esc(L(w.dar, w.den))}</small></div>
					<div class="wgp-cap"><span class="wgp-sz wgp-sz--${w.size}"><i style="--c:${c};--r:${r}"></i></span><b>${esc(nameOf(w))}</b>
						<button class="wgp-add" type="button" data-add="${w.id}"${on || !fits ? ' disabled' : ''}>${on ? `${doodle('heart', 14)} ${L('موجودة', 'Added')}` : fits ? `+ ${Y('حطها', 'حطيها', 'Add')}` : L('مفيش مكان', 'No room')}</button></div>
				</article>`;
			}).join('')}</div>`;
			hydrate($('#wgp-shelf', main)); fillWidgets($('#wgp-shelf', main));
		};

		/* the hundred ideas, each a drawing scaled to fit its cell */
		const fit = new ResizeObserver((es) => { for (const e of es) { const r = e.contentRect; e.target.style.setProperty('--k', Math.min(r.width / 270, r.height / 168, 1.35).toFixed(3)); } });
		const paintIdeas = () => {
			fit.disconnect();
			const G = grp(), list = IDEAS.filter((x) => x.g === g);
			$('#wk', main).innerHTML = list.map((x, i) => {
				const ready = readyFor(x.n);
				return `<article class="wk-c wk-c--${x.size}${want.has(x.n) ? ' is-want' : ''}" style="--tt:${G.tab};--tc:${G.c};--i:${i}" data-n="${x.n}">
					<span class="wk-n">${num(x.n)}</span>
					<div class="wk-draw" aria-hidden="true"><div class="wk-in">${x.html}</div></div>
					<div class="wk-tx"><b>${esc(x.ar)}</b><small>${esc(x.d)}</small>
						<span class="wk-tags"><span class="wk-tag">${esc(x.page)}</span><span class="wk-tag wk-tag--sz">${sizeName(x.size)}</span>${ready ? (ready.sketch ? `<span class="wk-tag wk-tag--sz">${L('رسمة', 'Drawing')}</span>` : `<span class="wk-tag wk-tag--ok">${L('حية', 'Live')}</span>`) : ''}</span>
						${ready ? `<button class="wk-act" type="button" data-add="${ready.id}">${wgLayout(g).includes(ready.id) ? L('في القايمة', 'In the menu') : `+ ${Y('حطها في القايمة', 'حطيها في القايمة', 'Add to the menu')}`}</button>` : `<button class="wk-act wk-want" type="button" data-want="${x.n}" aria-pressed="${want.has(x.n)}">${doodle('heart', 14)} ${Y('عايزها', 'عايزاها', 'Want it')}</button>`}
					</div>
				</article>`;
			}).join('');
			$('#wk', main).querySelectorAll('.wk-draw').forEach((d) => fit.observe(d));
			paintBar();
		};
		const paintBar = () => {
			const n = want.size;
			$('#wk-bar', main).hidden = !n;
			$('#wk-n', main).innerHTML = L(`علّمت على <b>${num(n)}</b> فكرة`, `<b>${n}</b> ideas marked`);
		};

		const paint = () => {
			main.querySelectorAll('.wgp-tab').forEach((b) => { const on = b.dataset.g === g; b.setAttribute('aria-selected', String(on)); b.classList.toggle('is-on', on); });
			paintEdit(); paintShelf(); paintIdeas();
		};

		$('#wgp-tabs', main).onclick = (e) => {
			const b = e.target.closest('[data-g]'); if (!b || b.dataset.g === g) return;
			g = b.dataset.g; history.replaceState(history.state, '', `#${g}`); paint();
		};
		main.addEventListener('click', (e) => {
			const add = e.target.closest('[data-add]');
			if (add && !add.disabled) {
				const ids = wgLayout(g), w = WIDGETS.find((x) => x.id === add.dataset.add);
				if (ids.includes(w.id)) return;
				if (wgCells(ids) + SIZE_OF(w)[0] * SIZE_OF(w)[1] > WG_CELLS) { add.textContent = L('مفيش مكان — شيل حاجة الأول', 'No room — take one out first'); return; }
				save([...ids, w.id]);
				$('#wgp-edit', main).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
				return;
			}
			const wb = e.target.closest('[data-want]');
			if (wb) {
				const n = +wb.dataset.want;
				want.has(n) ? want.delete(n) : want.add(n);
				store.set(WANT, JSON.stringify([...want]));
				wb.setAttribute('aria-pressed', String(want.has(n)));
				wb.closest('.wk-c').classList.toggle('is-want', want.has(n));
				paintBar();
			}
		});
		$('#wk-copy', main).onclick = async () => {
			const list = [...want].sort((a, b) => a - b).map((n) => `${n} (${IDEAS[n - 1].ar})`);
			const text = L(`عايز الويدجتس دي: ${list.join('، ')}`, `Widgets we want: ${list.join(', ')}`);
			try { await navigator.clipboard.writeText(text); $('#wk-msg', main).textContent = L('اتنسخ', 'Copied'); }
			catch { $('#wk-msg', main).textContent = text; }
		};
		paint();
	}
};
