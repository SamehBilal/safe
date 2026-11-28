import { L, Y, T, esc, img, num, pageHead, related, App, $, $$, rand, REDUCE, qs, occasions, longDate, age } from '../shell.js';
import { doodle } from '../doodles.js';
import { sky } from '../bdsky.js';
import { fly } from '../airmsg.js';
import { pastBirthdays, wallHTML, tickerHTML, startTicker, gameHTML, balloonGame, filmstrip } from '../bdmore.js';
import { hang } from '../lights.js';

/* Birthdays: each of us, with how long until the next one and the age we're turning. The cake below is for
   whoever is next (or whose day it is today, or whoever you tap): blow out the candles, get confetti.
   Above the headline, a night sky of fireworks spelling out the greeting for whoever is next (bdsky.js). Each
   card throws its own little party, after Siggy's «Happy Birthday, Go!» pen (codepen.io/siggy/pen/bVOaQe): a party
   hat pops onto the photo with confetti, a balloon blows up on a string you can drag around, and the greeting comes. */
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
const HAT = `<svg class="bd-hat" viewBox="0 0 60 72" aria-hidden="true">
	<path d="M30 8 54 62c-8 6-40 6-48 0Z" fill="#f2726f" stroke="#37353f" stroke-width="1.6" stroke-linejoin="round"/>
	<path d="M23 24c4 2 10 2 14 0M17 38c7 3 19 3 26 0M11 52c10 4 28 4 38 0" fill="none" stroke="#ffc94a" stroke-width="4" stroke-linecap="round"/>
	<ellipse cx="30" cy="63" rx="25" ry="5" fill="#fde3e0" stroke="#37353f" stroke-width="1.6"/>
	<circle cx="30" cy="7" r="6" fill="#ffc94a" stroke="#37353f" stroke-width="1.6"/>
</svg>`;
const BIT = ['#0e6990', '#f2726f', '#ffc94a', '#5a9e6f', '#c2185b'];
/* the cake's icing: the round top, then drips hanging all along its edge, some long, some short */
function frosting() {
	const drips = [12, 5, 16, 7, 11, 4, 14, 6, 10, 15];
	let d = 'M20 124C20 115 60 108 110 108S200 115 200 124V129';
	const n = drips.length, step = 180 / n;
	for (let i = 0; i < n; i++) {
		const x = 200 - i * step, L = drips[i];
		d += `C${(x - step * 0.1).toFixed(1)} ${129 + L} ${(x - step * 0.9).toFixed(1)} ${129 + L} ${(x - step).toFixed(1)} 129`;
	}
	return d + 'Z';
}
export default {
	title: { ar: 'أعياد الميلاد', en: 'Birthdays' },
	render(s) {
		const members = s.family?.members || [];
		const bdays = occasions(s).filter((o) => o.kind === 'birthday');
		const missing = members.filter((m) => !m.born);
		const pick = bdays.find((o) => o.id === qs('id')) || bdays[0];
		this.pick = pick;
		this.s = s;
		this.past = pick ? pastBirthdays(s, pick.member) : [];
		// the balloons carry photos from everyone's birthdays gone by
		this.shots = [...new Set(members.flatMap((m) => pastBirthdays(s, m)).flatMap((p) => p.shots))];
		const card = (o) => `
			<a class="bd-card reveal${o === pick ? ' is-on' : ''}${o.days === 0 ? ' is-today' : ''}" href="birthday.html?id=${esc(o.id)}" style="--c:${esc(o.member.color || '#0e6990')}">
				<svg class="bd-fx" aria-hidden="true">
					<path class="bd-string" d="M0 0"/>
					<g class="bd-bits">${Array.from({ length: 12 }, (_, i) => `<circle r="${[5, 3.5, 2.5, 4, 2][i % 5]}" fill="${BIT[i % BIT.length]}" style="--i:${i}"/>`).join('')}</g>
					<g class="bd-balloon" role="presentation">
						<g class="bd-balloon__in">
							<path d="M0 0C-15-4-21-22-21-35-21-51-11-60 0-60 11-60 21-51 21-35 21-22 15-4 0 0Z" fill="var(--c)" stroke="#37353f" stroke-width="1.5"/>
							<path d="M10-44c3 3 5 7 4 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
							<path d="M-4 5 0 0 4 5Z" fill="var(--c)" stroke="#37353f" stroke-width="1.2" stroke-linejoin="round"/>
						</g>
					</g>
				</svg>
				<span class="bd-pic">
					<span class="fam__pic">${o.member.photo ? `<span data-media-box>${img(o.member.photo, App.t(o.member.name))}</span>` : `<span class="fam__emoji">${doodle(o.member.emoji, 52)}</span>`}</span>
					${HAT}
					<span class="bd-pop" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--a:${(i * 30) + 15}deg;--d:${28 + (i % 3) * 12}px;background:${BIT[i % BIT.length]}"></i>`).join('')}</span>
				</span>
				<span class="bd-hi" aria-hidden="true">${L(`هابي <b>${num(o.years)}</b>!!!`, `Happy <b>${ord(o.years)}</b>!!!`)}</span>
				<b>${T(o.member.name)}</b>
				<small>${longDate(o.member.born).replace(/\s*\d{4}$|[\s،,]*[٠-٩]{4}$/, '')}</small>
				<em>${o.days === 0 ? L('النهارده!', 'Today!') : L(`بعد ${num(o.days)} يوم`, `in ${o.days} days`)}</em>
				<small>${L(`${o.member.female ? 'هتكمل' : 'هيكمل'} ${num(o.years)}`, `turning ${o.years}`)}</small>
			</a>`;
		const n = pick ? Math.min(Math.max(pick.years, 1), 9) : 5;
		const xs = Array.from({ length: n }, (_, k) => 40 + (k * 140) / Math.max(n - 1, 1));
		return `
		${pageHead(L('أعياد الميلاد', 'Birthdays'), L('عيد ميلاد كل واحد فينا، وكام يوم فاضل عليه', 'Each of our birthdays, and how long until the next'), [{ href: 'birthday.html', ar: 'أعياد الميلاد', en: 'Birthdays' }], {
			band: `<div class="bd-sky" id="bd-sky" role="img" aria-label="${esc(pick ? L(`ألعاب نارية: كل سنة و${App.t(pick.member.name)} ${pick.member.female ? 'طيبة' : 'طيب'}`, `Fireworks: happy birthday, ${App.t(pick.member.name)}`) : L('ألعاب نارية', 'Fireworks'))}">
				<p class="bd-sky__tip">${Y('دوس في أي حتة ✦', 'دوسي في أي حتة ✦', 'Tap anywhere ✦')}</p>
			</div>`
		})}
		<section class="sec sec--top"><div class="wrap">
			<div class="bd-row">${bdays.map(card).join('')}</div>
			${missing.length ? `<p class="empty" style="margin-top:16px">${Y(`ضيف تاريخ ميلاد ${missing.map((m) => App.t(m.name)).join(' و')} (born) في private/story.json عشان يظهر هنا`, `ضيفي تاريخ ميلاد ${missing.map((m) => App.t(m.name)).join(' و')} (born) في private/story.json عشان يظهر هنا`, `Add a birth date ("born") for ${missing.map((m) => App.t(m.name)).join(' and ')} in private/story.json to show them here`)}</p>` : ''}
		</div></section>
		${pick ? `
		<section class="sec sec--top bday"><div class="wrap narrow">
			<h2 class="sec__title reveal">${esc(pick.title)}</h2>
			<p class="sec__sub reveal">${pick.days === 0 ? esc(pick.sub) : L(`بعد ${num(pick.days)} يوم — ${age(pick.member.born)} دلوقتي`, `in ${pick.days} days — ${age(pick.member.born)} now`)}</p>
			<p class="bday__hint reveal" id="bday-hint">${Y('اتمنى أمنية… وبعدين اطفي الشمع (دوس على كل شمعة)', 'اتمني أمنية… وبعدين اطفي الشمع (دوسي على كل شمعة)', 'Make a wish… then blow out the candles (tap each one)')}</p>
			<div class="cake reveal">
				<svg viewBox="0 0 220 210" role="img" aria-label="${L('تورتة عيد ميلاد', 'A birthday cake')}">
					<!-- drawn like the journal: wobbly ink outlines, highlighter colours, a hard offset shadow -->
					<path class="ck-ink ck-plate" d="M8 193c2-7 48-11 103-11s100 4 102 10c1 7-46 11-102 11S7 200 8 193Z"/>
					<path class="ck-shadow" d="M27 128c1 20 0 42 1 64 30 9 140 9 170 0 1-22 0-44 1-64Z"/>
					<path class="ck-ink ck-body" d="M21 122c1 21-1 43 1 65 31 9 145 9 176 0 2-22 0-44 1-65Z"/>
					<path class="ck-ink ck-layer" d="M22 156c30 6 146 6 176-1" fill="none"/>
					<path class="ck-sprinkle ck-sprinkle--a" d="M40 170l6-2M114 179l5-3M184 166l5 3M150 146l6 2"/>
					<path class="ck-sprinkle ck-sprinkle--b" d="M62 178l5 3M140 170l6 2M52 145l6-1"/>
					<path class="ck-sprinkle ck-sprinkle--c" d="M88 168l6 1M164 177l5-2M100 147l5 2"/>
					<path class="ck-ink ck-frost" d="${frosting()}"/>
					<path class="ck-ink" d="M30 121c24-7 136-7 160 0" fill="none" opacity=".35"/>
					${xs.map((x, k) => `
					<g class="candle" data-k="${k}" tabindex="0" role="button" aria-label="${L('شمعة', 'Candle')} ${k + 1}">
						<rect class="ck-ink" x="${x - 4.5}" y="72" width="9" height="44" rx="2.5" fill="${['#8fd1ef', '#f9a3a8', '#ffd66b', '#b9e08a'][k % 4]}"/>
						<path d="M${x - 4} 83l8-5M${x - 4} 95l8-5M${x - 4} 107l8-5" stroke="#37353f" stroke-width="1.3" opacity=".55" stroke-linecap="round"/>
						<path d="M${x} 72v-6" stroke="#37353f" stroke-width="1.4" stroke-linecap="round"/>
						<path class="flame" d="M${x} 44c7 9 8 16 0 24-8-8-7-15 0-24Z" fill="#ffc94a" stroke="#37353f" stroke-width="1.2" stroke-linejoin="round"/>
						<path class="flame flame--in" d="M${x} 58c3 4 3 7 0 10-3-3-3-6 0-10Z" fill="#fff4c4"/>
						<path class="smoke" d="M${x} 66c-4-8 4-12 0-20s4-12 0-18" fill="none" stroke="#9aa9b3" stroke-width="2" stroke-linecap="round"/>
						<rect x="${x - 14}" y="40" width="28" height="80" fill="transparent"/>
					</g>`).join('')}
				</svg>
			</div>
			<div class="bday__msg" id="bday-msg" hidden>
				<h2 class="sec__title">${L(`كل سنة و${App.t(pick.member.name)} ${pick.member.female ? 'طيبة' : 'طيب'}`, `Happy birthday, ${App.t(pick.member.name)}`)}</h2>
				<p class="center"><a class="btn btn--coral" href="wishes.html">${Y('اكتب الأمنية في البرطمان', 'اكتبي الأمنية في البرطمان', 'Put the wish in the jar')} ${App.arrow}</a></p>
			</div>
		</div></section>
		${tickerHTML(pick.member, s)}
		${wallHTML(pick.member, this.past)}` : ''}
		${gameHTML()}
		${related(['wishes', 'family', 'journal'])}`;
	},
	after(main) {
		/* the sky: the greeting for whoever is next */
		const p = this.pick, name = p ? App.t(p.member.name) : '';
		const lines = App.lang === 'ar'
			? (p ? ['كل سنة', `و${name} ${p.member.female ? 'طيبة' : 'طيب'}`] : ['كل سنة', 'وإحنا مع بعض'])
			: ['HAPPY', 'BIRTHDAY', ...(p ? [name.toUpperCase()] : [])];
		const box = $('#bd-sky', main);
		const stopSky = box ? sky(box, lines) : () => {};
		/* in the week of a birthday, a string of little lights goes up across the sky, and comes down after (lights.js) */
		if (box && p && p.days <= 7) hang(box, { top: 0 });
		/* a little plane crosses the sky towing the countdown (or, on the day, the wish), as Ma5a's «air message» did for a sister */
		const wish = p ? L(`كل سنة و${name} ${p.member.female ? 'طيبة' : 'طيب'}`, `Happy birthday, ${name}`) : '';
		const planes = [];
		if (box && p) planes.push(fly(box, p.days === 0 ? wish : L(`فاضل ${p.days === 1 ? 'يوم' : p.days === 2 ? 'يومين' : `${num(p.days)} ${p.days <= 10 ? 'أيام' : 'يوم'}`} على عيد ميلاد ${name}`, `${p.days} day${p.days === 1 ? '' : 's'} to ${name}’s birthday`), { ic: p.days === 0 ? 'cake' : 'gift', delay: 2200, times: 2, gap: 6000, c: p.member.color || '#f2726f' }));

		/* each card's party: the hat pops on, then the balloon, then the greeting (as the pen's timeline goes) */
		const cards = $$('.bd-card', main);
		const rtl = () => document.documentElement.dir === 'rtl';
		const place = (card) => {
			const fx = $('.bd-fx', card), pic = $('.fam__pic', card);
			const W = card.clientWidth, H = card.clientHeight;
			fx.setAttribute('viewBox', `0 0 ${W} ${H}`);
			const cr = card.getBoundingClientRect(), pr = pic.getBoundingClientRect();
			// the string is tied at the side of the photo, the balloon floats up in the top corner
			card._tie = { x: (rtl() ? pr.left : pr.right) - cr.left, y: pr.top - cr.top + pr.height * 0.62 };
			card._rest = { x: rtl() ? 30 : W - 30, y: 70 };
			if (!card._at) card._at = { ...card._rest };
			draw(card);
		};
		const draw = (card) => {
			const { _tie: t, _at: b } = card;
			$('.bd-balloon', card).setAttribute('transform', `translate(${b.x} ${b.y})`);
			// a loose curve, like the pen's string
			const cx = t.x + (b.x - t.x) * 0.15 + (rtl() ? -1 : 1) * 18, cy = Math.min(t.y, b.y) + Math.abs(t.y - b.y) * 0.85;
			$('.bd-string', card).setAttribute('d', `M${t.x} ${t.y}Q${cx} ${cy} ${b.x} ${b.y + 6}`);
			for (const [i, c] of $$('.bd-bits circle', card).entries()) {
				const a = (i / 12) * Math.PI * 2, r = 30 + (i % 3) * 9;
				c.style.transform = `translate(${b.x + Math.cos(a) * r}px, ${b.y - 30 + Math.sin(a) * r * 0.8}px)`;
			}
		};
		const ro = new ResizeObserver(() => cards.forEach(place));
		ro.observe($('.bd-row', main));
		cards.forEach(place);
		const party = (card, k) => setTimeout(() => card.classList.add('is-party'), REDUCE ? 0 : 250 + k * 280);
		const io = new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) { party(en.target, cards.indexOf(en.target)); io.unobserve(en.target); } }), { threshold: 0.4 });
		cards.forEach((c) => io.observe(c));

		/* drag the balloon: the string follows, the confetti chases it */
		for (const card of cards) {
			const bal = $('.bd-balloon', card);
			let moved = false;
			bal.addEventListener('pointerdown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				moved = false;
				try { bal.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ }
				card.classList.add('is-drag');
				const r = card.getBoundingClientRect();
				const move = (m) => {
					moved = true;
					card._at = { x: Math.max(-20, Math.min(card.clientWidth + 20, m.clientX - r.left)), y: Math.max(-40, Math.min(card.clientHeight - 10, m.clientY - r.top + 30)) };
					draw(card);
				};
				const up = () => { bal.removeEventListener('pointermove', move); card.classList.remove('is-drag'); };
				bal.addEventListener('pointermove', move);
				bal.addEventListener('pointerup', up, { once: true });
				bal.addEventListener('pointercancel', up, { once: true });
			});
			// a drag isn't a tap on the card
			card.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
		}
		const stopTicker = p ? startTicker(main, p.member, this.s) : () => {};
		const stopGame = balloonGame(main, this.shots || []);
		filmstrip(main);
		this.leave = () => { stopSky(); planes.forEach((f) => f()); ro.disconnect(); io.disconnect(); stopTicker(); stopGame(); };

		const candles = $$('.candle', main);
		const blow = (c) => {
			if (c.classList.contains('is-out')) return;
			c.classList.add('is-out');
			navigator.vibrate?.(30);
			if (candles.every((x) => x.classList.contains('is-out'))) done();
		};
		for (const c of candles) {
			c.onclick = () => blow(c);
			c.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blow(c); } };
		}
		function done() {
			$('#bday-hint', main).innerHTML = doodle('party', 44);
			$('#bday-msg', main).hidden = false;
			confetti();
			planes.push(fly($('.bday', main), wish, { ic: 'heart', top: 0, delay: 900, c: p.member.color || '#f2726f' }));
		}
	}
};

function confetti() {
	if (REDUCE) return;
	const box = document.createElement('div');
	box.className = 'confetti';
	box.setAttribute('aria-hidden', 'true');
	const colors = ['#f2726f', '#0e6990', '#ffc94a', '#5a9e6f', '#fde3e0'];
	box.innerHTML = Array.from({ length: 90 }, (_, k) => `<i style="--x:${rand(0, 100)}vw;--d:${rand(2.2, 4.2)}s;--delay:${rand(0, 0.8)}s;--r:${rand(-720, 720)}deg;--dx:${rand(-80, 80)}px;background:${colors[k % colors.length]}${k % 3 ? '' : ';border-radius:50%'}"></i>`).join('');
	document.body.append(box);
	setTimeout(() => box.remove(), 5500);
}
