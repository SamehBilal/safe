import { App, REDUCE, esc, store } from './shell.js';
import { doodle } from './doodles.js';

/* A little plane towing a banner across the top of a box, after Ma5a's «air message» pen (codepen.io/Ma5a/pen/xxrPjPE),
   made to send a birthday message to a sister. Here it's drawn like the rest of the site: wobbly ink, highlighter
   colours, the banner a strip of paper in the handwriting font, with a swallowtail end that flutters.
   In Arabic it comes in from the right (the way the words read), in English from the left. It bobs as it goes, the
   propeller spins, the banner waves behind on its rope. With «reduce motion» it doesn't fly: the plane and its banner
   just appear in the middle for a few seconds and fade.
   fly(host, text, opt) — host: a box to fly across the top of (it's made position:relative if it's static);
   opt: { ic: a doodle on the banner, href: the banner is a link, top: px from the top, times: how many passes,
   gap: ms between passes, once: a key so it flies only once on this device, delay: ms before it starts,
   c: the plane's colour }. Returns stop(). */

const INK = '#37353f';
// the plane faces left (it leads when flying right-to-left); flipped for the other way
const plane = (c) => `<svg class="am-plane" viewBox="0 0 128 64" aria-hidden="true">
	<path d="M70 40 62 58h12l8-18" fill="#ffc94a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
	<path d="M16 33c0-8 10-13 26-13h40l22-12h10l-6 22c-2 8-8 12-18 12H34c-12 0-18-3-18-9Z" fill="${c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
	<path d="M104 8h10l-6 22h-8Z" fill="#ffc94a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
	<path d="M30 36c20 2 50 2 74-1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
	<path d="M38 22c2-7 9-10 16-10s10 4 11 8" fill="#bfe6f5" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
	<path d="M56 34 46 48h16l10-14" fill="#ffc94a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
	<circle cx="40" cy="52" r="4" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M40 44v4" stroke="${INK}" stroke-width="1.5"/>
	<circle cx="17" cy="32" r="3.5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
	<g class="am-prop"><ellipse cx="11" cy="32" rx="2.6" ry="15" fill="#fffdf8" fill-opacity=".75" stroke="${INK}" stroke-width="1.4"/></g>
</svg>`;
const rope = `<svg class="am-rope" viewBox="0 0 48 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6C14 4 26 16 48 10M0 6C16 10 30 18 48 10" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/></svg>`;

export function fly(host, text, opt = {}) {
	if (!host || !text) return () => {};
	const key = opt.once && `us.am.${opt.once}`;
	if (key && store.get(key)) return () => {};
	if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
	const rtl = (opt.dir || document.documentElement.dir) === 'rtl' || (!opt.dir && App.lang === 'ar');
	const lane = document.createElement('div');
	lane.className = `am${rtl ? ' am--rtl' : ''}`;
	lane.style.cssText = `position:absolute;top:${opt.top ?? 8}px;z-index:6`;
	const tag = opt.href ? 'a' : 'span';
	lane.innerHTML = `<p class="sr-only" role="status">${esc(text)}</p>
		<div class="am-train" dir="ltr" aria-hidden="true">
			<div class="am-bob">
				${plane(opt.c || '#f2726f')}${rope}
				<${tag} class="am-flag"${opt.href ? ` href="${esc(opt.href)}" tabindex="-1"` : ''} ><span class="am-cloth">${opt.ic ? doodle(opt.ic, 20) : ''}<b dir="auto">${esc(text)}</b></span></${tag}>
			</div>
		</div>`;
	host.append(lane);
	const train = lane.querySelector('.am-train');
	let anim = null, timer = 0, done = false;
	const stop = () => { done = true; clearTimeout(timer); anim?.cancel(); lane.remove(); };
	let left = Math.max(1, opt.times || 1);
	const pass = () => {
		if (done || !lane.isConnected) return stop();
		const W = lane.clientWidth, w = train.offsetWidth;
		if (REDUCE) {
			train.style.transform = `translateX(${Math.max(0, (W - w) / 2)}px)`;
			anim = train.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: 6000, fill: 'both' });
		} else {
			// about 110px a second, so a long banner doesn't rush past and a phone isn't crossed in a blink
			const from = rtl ? W + 10 : -w - 10, to = rtl ? -w - 10 : W + 10;
			const ms = Math.min(18000, Math.max(7000, (Math.abs(to - from) / 110) * 1000));
			anim = train.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: ms, easing: 'linear', fill: 'both' });
		}
		anim.onfinish = () => {
			if (--left > 0) timer = setTimeout(pass, opt.gap ?? 2500);
			else stop();
		};
	};
	if (key) store.set(key, '1');
	timer = setTimeout(() => (document.fonts?.ready || Promise.resolve()).then(pass), opt.delay ?? 600);
	return stop;
}
