import { L, Y, esc, pageHead, related, App, $, t, img, hydrate, num, longDate, REDUCE } from '../shell.js';
import { doodle } from '../doodles.js';
import * as live from '../live.js';
import * as radio from '../radio.js';

/* Our story in a minute: every moment on «حكايتنا» that has a photo, one after another, oldest first — the date and
   title over each, a progress bar along the top — with one of our songs playing under it. Press play (the song starts
   with the photos and pauses with them); tap to pause, swipe or use the arrows.
   The top: a strip of film running past, its frames our own photos with the year on each, and under it how many
   memories, how long the minute really is, which song goes with it (or a random one), and Play.
   Each photo fills the whole width of the player: a blurred copy of it fills the frame behind, and the photo sits on
   top whole, so a tall photo has no black bars. */
const STEP = 3200;
const yr = (y) => num(+y).replace(/[٬,]/g, '');
let bye = null;

const momentsOf = (s) => (s.timeline || []).filter((x) => x.photo).sort((a, b) => String(a.date).localeCompare(String(b.date)));

/* the film strip: up to 14 of the moments, spread across the years */
function film(list) {
	const pick = list.length <= 14 ? list : Array.from({ length: 14 }, (_, k) => list[Math.round((k * (list.length - 1)) / 13)]);
	const frames = pick.map((x) => `<span class="mn-frame"><span class="mn-frame__ph">${img(x.photo, '', 'mn-frame__img')}</span><b>${yr(String(x.date).slice(0, 4))}</b></span>`).join('');
	return `<div class="mn-film" aria-hidden="true">${frames}${frames}</div>`;
}

export default {
	title: { ar: 'الحكاية في دقيقة', en: 'Our story in a minute' },
	render(s) {
		const list = momentsOf(s);
		const years = list.map((x) => String(x.date).slice(0, 4)).filter((y) => /^\d{4}$/.test(y));
		const secs = Math.round((list.length * STEP) / 1000), mins = Math.floor(secs / 60), rest = secs % 60;
		const long = mins ? L(`${num(mins)} دقيقة${rest ? ` و${num(rest)} ثانية` : ''}`, `${mins} min${rest ? ` ${rest} s` : ''}`) : L(`${num(secs)} ثانية`, `${secs} s`);
		return `<section class="sec sec--top mn-top"><div class="mn-hero">
			<div class="mn-reel">${film(list)}</div>
			<div class="wrap mn-hero__row">
				<div class="mn-hero__facts">
					<p class="mn-k">${doodle('clapper', 16)} ${L('فيلمنا', 'Our film')}${years.length ? ` · ${yr(years[0])}–${yr(years.at(-1))}` : ''}</p>
					<p class="mn-count"><b>${num(list.length)}</b> <span>${L('ذكرى، صورة ورا صورة', 'memories, one photo after another')}</span></p>
					<p class="mn-long">${doodle('clock', 16)} ${L(`الدقيقة بتاعتنا طولها ${long}`, `our minute runs ${long}`)}</p>
				</div>
				<div class="mn-hero__song">
					<label class="mn-song" title="${esc(L('الأغنية', 'The song'))}">${doodle('music', 18)}<select id="mn-song" aria-label="${esc(L('الأغنية اللي هتشتغل مع الصور', 'The song that plays with the photos'))}"><option value="">${L('أغنية عشوائية من «أغانينا»', 'A random song from «Our songs»')}</option></select></label>
					<button class="btn btn--coral" type="button" id="mn-start">${doodle('heart', 18)} ${Y('شغّل الحكاية', 'شغّلي الحكاية', 'Play our story')}</button>
				</div>
			</div>
		</div></section>
		${pageHead(L('الحكاية في دقيقة', 'Our story in a minute'), L(`${num(list.length)} ذكرى، صورة ورا صورة`, `${list.length} memories, one photo after another`), [{ href: 'minute.html', ar: 'الحكاية في دقيقة', en: 'Our story in a minute' }], { band: '' })}
		<section class="sec"><div class="wrap">
			<div class="mn-stage" id="mn-stage" tabindex="0">
				<div class="mn-bar"><i id="mn-bar"></i></div>
				<div class="mn-slide" id="mn-slide"></div>
				<div class="mn-ctl">
					<button class="btn btn--sm btn--ghost" type="button" id="mn-prev" aria-label="${L('اللي قبلها', 'Previous')}">‹</button>
					<button class="btn btn--coral" type="button" id="mn-play">${doodle('heart', 18)} ${Y('شغّل', 'شغّلي', 'Play')}</button>
					<button class="btn btn--sm btn--ghost" type="button" id="mn-next" aria-label="${L('اللي بعدها', 'Next')}">›</button>
					<button class="btn btn--sm btn--ghost" type="button" id="mn-full">${L('ملء الشاشة', 'Full screen')}</button>
				</div>
				<p class="muted mn-tip" id="mn-now">${L('الأغنية بتشتغل مع الصور، وبتقف لما تقف', 'The song plays with the photos, and stops when they stop')}</p>
			</div>
		</div></section>
		${related(['story', 'music', 'gallery'])}`;
	},
	leave() { bye?.(); bye = null; },
	async after(main, s) {
		bye?.();
		let timer = null;
		bye = () => clearInterval(timer);
		const list = momentsOf(s);
		if (!list.length) { $('#mn-slide', main).innerHTML = `<p class="empty">${L('مفيش صور على «حكايتنا» لسه', 'No photos on our story yet')}</p>`; return; }
		let i = 0, mine = false;
		const stage = $('#mn-stage', main), slide = $('#mn-slide', main), bar = $('#mn-bar', main), play = $('#mn-play', main), pickEl = $('#mn-song', main), now = $('#mn-now', main);
		const show = () => {
			const x = list[i];
			slide.innerHTML = `<figure class="mn-fig">${img(x.photo, '', 'mn-blur').replace('<img ', '<img aria-hidden="true" ')}${img(x.photo, t(x.title), 'mn-img')}<figcaption><small>${x.when ? esc(t(x.when)) : esc(longDate(x.date))}</small><b dir="auto">${esc(t(x.title))}</b></figcaption></figure>`;
			hydrate(slide);
			bar.style.width = `${((i + 1) / list.length) * 100}%`;
			// the next photo on its way, so it's there when its turn comes
			const nx = list[(i + 1) % list.length];
			if (nx) { const pre = document.createElement('div'); pre.innerHTML = img(nx.photo); hydrate(pre); }
		};

		/* our songs that have their own recording */
		let songs = [];
		try { songs = ((await live.load('music')).items || []).filter((x) => x.audio); } catch { /* no songs list */ }
		pickEl.insertAdjacentHTML('beforeend', songs.map((x) => `<option value="${esc(x.id)}">${esc(x.title)}${x.artist ? ` — ${esc(x.artist)}` : ''}</option>`).join(''));
		if (!songs.length) pickEl.closest('.mn-song').hidden = true;
		const nowLine = () => {
			const r = radio.state();
			now.innerHTML = r.item ? `${doodle('music', 16)} ${esc(r.item.title)}${r.item.artist ? ` — ${esc(r.item.artist)}` : ''}` : esc(L('الأغنية بتشتغل مع الصور، وبتقف لما تقف', 'The song plays with the photos, and stops when they stop'));
		};
		const quiet = radio.on(nowLine);
		const prev = bye; bye = () => { prev(); quiet?.(); };
		const songStart = (fresh) => {
			if (!songs.length) return;
			const r = radio.state();
			if (!fresh && r.item && r.playing) { mine = false; return; }
			if (!fresh && r.item && !r.playing && mine) { radio.resume(); return; }
			const x = songs.find((y) => y.id === pickEl.value) || songs[Math.floor(Math.random() * songs.length)];
			radio.play(x, songs);
			mine = true;
		};
		const songStop = () => { if (mine && radio.state().playing) radio.pause(); };

		const stop = () => { clearInterval(timer); timer = null; play.innerHTML = `${doodle('heart', 18)} ${Y('شغّل', 'شغّلي', 'Play')}`; songStop(); };
		const go = (n) => { i = (n + list.length) % list.length; show(); };
		const start = (fresh) => {
			if (timer) return;
			if (i === list.length - 1) go(0);
			play.textContent = L('وقّف', 'Pause');
			timer = setInterval(() => { if (i === list.length - 1) return stop(); go(i + 1); }, REDUCE ? STEP * 1.5 : STEP);
			songStart(fresh);
		};
		play.onclick = () => (timer ? stop() : start(false));
		$('#mn-start', main).onclick = () => {
			stage.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
			if (timer) stop();
			go(0);
			start(true);
		};
		pickEl.onchange = () => { if (timer) songStart(true); };
		$('#mn-prev', main).onclick = () => go(i - 1);
		$('#mn-next', main).onclick = () => go(i + 1);
		$('#mn-full', main).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen?.());
		slide.onclick = () => play.click();
		stage.onkeydown = (e) => { if (e.key === 'ArrowLeft') go(App.lang === 'ar' ? i + 1 : i - 1); if (e.key === 'ArrowRight') go(App.lang === 'ar' ? i - 1 : i + 1); if (e.key === ' ') { e.preventDefault(); play.click(); } };
		let x0 = null;
		slide.ontouchstart = (e) => { x0 = e.touches[0].clientX; };
		slide.ontouchend = (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(i + ((dx < 0) !== (App.lang === 'ar') ? 1 : -1)); };
		show();
		nowLine();
	}
};
