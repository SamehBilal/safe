import { L, Y, esc, pageHead, related, App, $, t, img, hydrate, num, longDate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';

/* Our story in a minute: every moment on «حكايتنا» that has a photo, full screen, one after another, oldest first —
   the date and title over each, a progress bar along the top. Press play; tap to pause, swipe or use the arrows.
   Band: a strip of film running past with the years printed on its frames. */
const STEP = 3200;

export default {
	title: { ar: 'الحكاية في دقيقة', en: 'Our story in a minute' },
	render(s) {
		const list = (s.timeline || []).filter((x) => x.photo).sort((a, b) => String(a.date).localeCompare(String(b.date)));
		const years = [...new Set((s.timeline || []).map((x) => String(x.date).slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))].sort();
		return `${pageHead(L('الحكاية في دقيقة', 'Our story in a minute'), L(`${num(list.length)} ذكرى، صورة ورا صورة`, `${list.length} memories, one photo after another`), [{ href: 'minute.html', ar: 'الحكاية في دقيقة', en: 'Our story in a minute' }], {
			band: `<div class="lp-band lp-band--minute" aria-hidden="true"><div class="mn-film">${[...years, ...years].map((y) => `<span class="mn-frame"><b>${esc(y)}</b></span>`).join('')}</div></div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			<div class="mn-stage" id="mn-stage" tabindex="0">
				<div class="mn-bar"><i id="mn-bar"></i></div>
				<div class="mn-slide" id="mn-slide"></div>
				<div class="mn-ctl">
					<button class="btn btn--sm btn--ghost" type="button" id="mn-prev" aria-label="${L('اللي قبلها', 'Previous')}">‹</button>
					<button class="btn btn--coral" type="button" id="mn-play">${doodle('heart', 18)} ${Y('شغّل', 'شغّلي', 'Play')}</button>
					<button class="btn btn--sm btn--ghost" type="button" id="mn-next" aria-label="${L('اللي بعدها', 'Next')}">›</button>
					<button class="btn btn--sm btn--ghost" type="button" id="mn-full">${L('ملء الشاشة', 'Full screen')}</button>
				</div>
				<p class="muted mn-tip">${L('لو في أغنية شغالة من «أغانينا» هتكمّل معاك', 'A song playing from «Our songs» keeps going while you watch')}</p>
			</div>
		</div></section>
		${related(['story', 'music', 'gallery'])}`;
	},
	after(main, s) {
		const list = (s.timeline || []).filter((x) => x.photo).sort((a, b) => String(a.date).localeCompare(String(b.date)));
		if (!list.length) { $('#mn-slide', main).innerHTML = `<p class="empty">${L('مفيش صور على «حكايتنا» لسه', 'No photos on our story yet')}</p>`; return; }
		let i = 0, timer = null;
		const stage = $('#mn-stage', main), slide = $('#mn-slide', main), bar = $('#mn-bar', main), play = $('#mn-play', main);
		const show = () => {
			const x = list[i];
			slide.innerHTML = `<figure class="mn-fig">${img(x.photo, t(x.title), 'mn-img')}<figcaption><small>${esc(longDate(x.date))}</small><b dir="auto">${esc(t(x.title))}</b></figcaption></figure>`;
			hydrate(slide);
			bar.style.width = `${((i + 1) / list.length) * 100}%`;
		};
		const stop = () => { clearInterval(timer); timer = null; play.innerHTML = `${doodle('heart', 18)} ${Y('شغّل', 'شغّلي', 'Play')}`; };
		const go = (n) => { i = (n + list.length) % list.length; show(); };
		play.onclick = () => {
			if (timer) return stop();
			play.textContent = L('وقّف', 'Pause');
			timer = setInterval(() => { if (i === list.length - 1) return stop(); go(i + 1); }, REDUCE ? STEP * 1.5 : STEP);
		};
		$('#mn-prev', main).onclick = () => go(i - 1);
		$('#mn-next', main).onclick = () => go(i + 1);
		$('#mn-full', main).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen?.());
		slide.onclick = () => play.click();
		stage.onkeydown = (e) => { if (e.key === 'ArrowLeft') go(App.lang === 'ar' ? i + 1 : i - 1); if (e.key === 'ArrowRight') go(App.lang === 'ar' ? i - 1 : i + 1); if (e.key === ' ') { e.preventDefault(); play.click(); } };
		let x0 = null;
		slide.ontouchstart = (e) => { x0 = e.touches[0].clientX; };
		slide.ontouchend = (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(i + ((dx < 0) !== (App.lang === 'ar') ? 1 : -1)); };
		show();
	}
};
