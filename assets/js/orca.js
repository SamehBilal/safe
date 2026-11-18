/*
 * orca.js — animated ASCII orca for the footer (sibling of the owl).
 * Usage: AsciiOrca.mount(elements) — each element is an empty <span class="ascii orca" data-len="34">.
 * data-len is the body length in character heights; font-size sets the overall size.
 *
 * The body is a flexible spine; every character cell asks "how far along the spine am I,
 * and how far above/below it?" and is shaded from that. Approach inspired by the ASCII
 * whales in Chael-Chael/dsh-ascii-whales (itself based on stackedlol/ascii-sharks);
 * this is an independent, much smaller implementation tuned for a footer-sized side view.
 */
(function () {
    'use strict';

    const CSS = `.ascii.orca {
  --orca-body: light-dark(#0a0a0a, #F9812E);
  --orca-patch: light-dark(#8e8e96, #f4f4f5);
  --orca-saddle: light-dark(#5b5b63, #c2621f);
  --orca-eye: light-dark(#f4f4f5, #000);
  --orca-water: light-dark(#3b82f6, #7dd3fc);
  display: inline-block; margin: 0 8px;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 3.6px; font-weight: 700; line-height: 1; letter-spacing: 0;
  white-space: pre; vertical-align: middle; opacity: .92; cursor: default; user-select: none;
  transition: opacity .25s ease, transform .25s ease; will-change: transform, opacity;
}
.ascii.orca:hover { opacity: 1; cursor: help; }
.ascii.orca .b { color: var(--orca-body); }
.ascii.orca .w { color: var(--orca-patch); }
.ascii.orca .g { color: var(--orca-saddle); }
.ascii.orca .e { color: var(--orca-eye); }
.ascii.orca .s { color: var(--orca-water); }
@media (prefers-reduced-motion: reduce) { .ascii.orca { transition: none; } }`;

    let mounted = false;

    function mount(targets) {
        if (mounted || !targets || !targets.length) return;
        mounted = true;

        if (!document.getElementById('ascii-orca-css')) {
            const st = document.createElement('style');
            st.id = 'ascii-orca-css';
            st.textContent = CSS;
            document.head.prepend(st);   // first, so page CSS can override sizes
        }

        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const darkQuery = matchMedia('(prefers-color-scheme: dark)');

        function currentTheme() {
            const t = document.documentElement.dataset.theme || 'system';
            if (t === 'dark' || t === 'light') return t;
            return darkQuery.matches ? 'dark' : 'light';
        }

        /* =========================
           SHAPE  (all lengths in body-lengths, s = 0 snout → 1 tail)
        ========================= */

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        // body outline above (back) and below (belly) the spine:
        // rounded melon, straight back, belly that sweeps up into a deep tail stock
        function top(s) {
            if (s < 0 || s > 1) return 0;
            if (s < .18) return .10 * Math.pow(Math.sin(s / .18 * Math.PI / 2), .5);
            if (s < .42) return .10 + .012 * Math.sin((s - .18) / .24 * Math.PI);
            if (s < .9) return .024 + .088 * Math.pow(Math.cos((s - .42) / .48 * Math.PI / 2), 1.1);
            return .024 - .01 * (s - .9) / .1;
        }
        function bot(s) {
            if (s < 0 || s > 1) return 0;
            if (s < .2) return .11 * Math.pow(Math.sin(s / .2 * Math.PI / 2), .7);
            if (s < .4) return .11 + .015 * Math.sin((s - .2) / .2 * Math.PI);
            if (s < .9) return .022 + .103 * Math.pow(Math.cos((s - .4) / .5 * Math.PI / 2), 1.5);
            return .022 - .01 * (s - .9) / .1;
        }

        // tall, slightly swept-back dorsal fin
        function inDorsal(s, o) {
            const d = o - top(s), H = .14;
            if (d < 0 || d > H) return false;
            const u = d / H;
            return s >= .33 + .17 * Math.pow(u, 1.1) && s <= .53 - .02 * u * u;
        }

        // short rounded paddle flipper behind the head
        function inPectoral(s, o) {
            const d = -o - bot(s), R = .1;
            if (d < 0 || d > R) return false;
            const t = d / R;
            const c = .2 + .13 * t;
            return Math.abs(s - c) <= .05 * Math.sqrt(1 - t * t) + .008;
        }

        // flukes from the side: a thin horizontal blade, thickest mid-chord, swept to a point
        function inFlukes(s, o) {
            if (s < .93 || s > 1.05) return false;
            const u = (s - .93) / .12;
            const h = .014 + .035 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), .7);
            return o <= h * .8 && o >= -h * 1.1;
        }

        // returns [class, ink 0..1] or null for empty water
        function sample(s, o, eye) {
            if (inFlukes(s, o)) return ['b', .85];
            if (s >= 0 && s <= 1) {
                const t = top(s), b = bot(s);
                if (o <= t && o >= -b && t > 0) {
                    const v = o >= 0 ? o / t : o / b;   // -1 belly … +1 back
                    const e = 1 - Math.abs(v);           // 0 at outline, 1 mid-body

                    // eye
                    if (((s - .112) / .014) ** 2 + ((v - .02) / .24) ** 2 < 1) return ['e', eye];

                    // white: eye patch, chin + belly, flank sweep
                    const eyePatch = ((s - .18) / .06) ** 2 + ((v - .36) / .22) ** 2 < 1;
                    const belly = s < .52 && v < -.25 - .5 * Math.min(1, s / .3);
                    const flank = ((s - .64) / .1) ** 2 + ((v + .5) / .52) ** 2 < 1;
                    const underTail = s >= .5 && s < .62 && v < -.75;
                    if (eyePatch || belly || flank || underTail) {
                        // keep a faint outline so a white belly doesn't erase the silhouette
                        if (e < .12 && v < 0) return ['b', .38];
                        return ['w', clamp(.15 + .7 * (1 - e) * (v < 0 ? 1 : .5), 0, 1)];
                    }

                    // grey saddle behind the dorsal fin
                    if (((s - .56) / .06) ** 2 + ((v - 1) / .4) ** 2 < 1) return ['g', .55];

                    // black body: dense in the middle, a soft gloss band on the back, lighter outline
                    let ink = .86 + .14 * e - .14 * Math.exp(-(((v - .55) / .14) ** 2));
                    if (e < .15) ink *= .6 + 2.6 * e;
                    return ['b', clamp(ink, 0, 1)];
                }
            }
            if (inDorsal(s, o)) return ['b', .86];
            if (inPectoral(s, o)) return ['b', .8];
            return null;
        }

        const RAMP = {
            light: { b: ' .:-=+*#%@', w: '..::-=+', g: '-=+*', e: '.' },
            dark:  { b: ' .:-=+*#%@', w: '=+*#%%@', g: ':-=+', e: '.' }
        };

        /* =========================
           ORCA ENGINE
        ========================= */

        const SEGS = 72, S_END = 1.06;

        function createOrca(el) {
            const LEN = parseFloat(el.dataset.len) || 34;   // body length in character heights
            // measure the real monospace cell so the shape isn't squashed
            const probe = document.createElement('span');
            probe.textContent = 'MMMMMMMMMM';
            el.appendChild(probe);
            const fs = parseFloat(getComputedStyle(el).fontSize) || 6;
            const CW = probe.getBoundingClientRect().width / 10 / fs || .6;
            el.removeChild(probe);
            const CH = 1; // line-height: 1

            // grid sized to the body, with headroom for the spout
            const COLS = Math.ceil(LEN * 1.12 / CW) + 3;
            const ROWS = Math.ceil(LEN * .7);
            const anchor = { x: COLS * CW - .42 * LEN - 2.5 * CW, y: ROWS * CH * .6 };
            const K = LEN / 26;   // particle speeds were tuned at LEN 26

            const cur = { freq: .4, amp: .08, pitch: 0, curl: 0 };
            const tgt = { ...cur };
            const kick = { amp: 0, pitch: 0 };
            let phase = 0, time = 0;
            let eyeChar = '-';
            let particles = [];

            const spine = Array.from({ length: SEGS + 1 }, () => ({ x: 0, y: 0, tx: 0, ty: 0 }));

            function buildSpine() {
                const ds = S_END / SEGS;
                let x = 0, y = 0;
                for (let i = 0; i <= SEGS; i++) {
                    const s = i * ds;
                    // vertical tail beat grows towards the flukes; head counter-nods slightly
                    const wave = (cur.amp + kick.amp) * (s * s * 1.6 - .08) *
                        Math.sin(phase * Math.PI * 2 - s * 5.5);
                    const phi = cur.pitch + kick.pitch + cur.curl * s + wave;
                    const tx = -Math.cos(phi), ty = -Math.sin(phi);
                    spine[i].x = x; spine[i].y = y; spine[i].tx = tx; spine[i].ty = ty;
                    x += tx * ds * LEN; y += ty * ds * LEN;
                }
                // pin the chest (s ≈ .42) to the anchor so turns pivot around the middle
                const m = spine[Math.round(.42 / ds)];
                const bob = Math.sin(time * .9) * .35 * K;
                const dx = anchor.x - m.x, dy = anchor.y + bob - m.y;
                for (const p of spine) { p.x += dx; p.y += dy; }
            }

            // world position of a point on the body (for spout, splash)
            function bodyPoint(s, o) {
                const i = clamp(Math.round(s / S_END * SEGS), 0, SEGS), p = spine[i];
                return { x: p.x + p.ty * -o * LEN, y: p.y + p.tx * o * LEN };
            }

            function render() {
                buildSpine();
                const theme = currentTheme(), ramp = RAMP[theme];
                const ds = S_END / SEGS;
                const grid = [];

                // particle overlay
                const over = new Map();
                for (const p of particles) {
                    const c = Math.round(p.x / CW - .5), r = Math.round(p.y / CH - .5);
                    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) over.set(r * COLS + c, p.ch);
                }

                // bounding box of the body + fins, so empty water is cheap
                let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
                for (const p of spine) {
                    bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x);
                    by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y);
                }
                const pad = LEN * .3;
                bx0 -= pad; bx1 += pad; by0 -= pad; by1 += pad;

                let html = '';
                for (let r = 0; r < ROWS; r++) {
                    let run = '', runCls = '';
                    const flush = () => {
                        if (!run) return;
                        html += runCls ? `<span class="${runCls}">${run}</span>` : run;
                        run = '';
                    };
                    for (let c = 0; c < COLS; c++) {
                        const qx = (c + .5) * CW, qy = (r + .5) * CH;
                        if (qx < bx0 || qx > bx1 || qy < by0 || qy > by1) {
                            const pc = over.get(r * COLS + c);
                            const cls = pc ? 's' : '';
                            if (cls !== runCls) { flush(); runCls = cls; }
                            run += pc || ' ';
                            continue;
                        }
                        // nearest spine sample
                        let best = Infinity, bi = 0;
                        for (let i = 0; i <= SEGS; i++) {
                            const dx = qx - spine[i].x, dy = qy - spine[i].y;
                            const d = dx * dx + dy * dy;
                            if (d < best) { best = d; bi = i; }
                        }
                        const p = spine[bi];
                        const dx = qx - p.x, dy = qy - p.y;
                        const along = dx * p.tx + dy * p.ty;
                        const perp = dy * p.tx - dx * p.ty; // + = towards the back
                        const s = bi * ds + along / LEN, o = perp / LEN;

                        let ch = ' ', cls = '';
                        const hit = best < (LEN * .3) ** 2 ? sample(s, o, 0) : null;
                        if (hit) {
                            cls = hit[0];
                            if (cls === 'e') ch = eyeChar;
                            else {
                                const rm = ramp[cls];
                                ch = rm[Math.round(hit[1] * (rm.length - 1))];
                            }
                        }
                        const pc = over.get(r * COLS + c);
                        if (pc && (!hit || cls === 'w')) { ch = pc; cls = 's'; }
                        if (ch === ' ') cls = '';
                        if (cls !== runCls) { flush(); runCls = cls; }
                        run += ch;
                    }
                    flush();
                    if (r < ROWS - 1) html += '\n';
                }
                el.innerHTML = html;
            }

            function step(dt) {
                time += dt;
                const k = 1 - Math.exp(-dt * 5);
                for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
                kick.amp *= Math.exp(-dt * 2.5);
                kick.pitch *= Math.exp(-dt * 3);
                phase += cur.freq * dt;

                particles = particles.filter(p => (p.life -= dt) > 0);
                for (const p of particles) {
                    p.vy += p.g * dt;
                    p.x += p.vx * dt; p.y += p.vy * dt;
                    if (p.kind === 'bubble') p.x += Math.sin(time * 6 + p.seed) * dt * .6;
                    p.ch = glyph(p);
                }
            }

            function glyph(p) {
                if (p.kind === 'bubble') return p.life > 1.2 ? 'o' : p.life > .5 ? 'o' : '.';
                const vy = p.vy / K;
                if (vy < -4) return Math.abs(p.vx) < 1.2 ? '|' : p.vx > 0 ? '/' : '\\';
                if (vy < 2) return p.kind === 'splash' ? '*' : "'";
                return p.life > .25 ? ',' : '.';
            }

            function spout(power = 1) {
                const b = bodyPoint(.08, top(.08) + .005);
                const n = Math.round(16 * power);
                for (let i = 0; i < n; i++) {
                    const spread = (Math.random() - .5) * 2;
                    particles.push({
                        kind: 'spout', x: b.x, y: b.y,
                        vx: spread * 3.5 * K, vy: -(9 + Math.random() * 6) * power * K,
                        g: 18 * K, life: .9 + Math.random() * .5, ch: '|'
                    });
                }
            }

            function bubbles() {
                const b = bodyPoint(.08, top(.08));
                for (let i = 0; i < 2; i++) {
                    particles.push({
                        kind: 'bubble', x: b.x + i * CW, y: b.y - i * 1.2,
                        vx: 0, vy: -2.2 * K, g: 0, life: 2 + i * .4, seed: Math.random() * 9, ch: 'o'
                    });
                }
            }

            function splash() {
                for (let i = 0; i < 26; i++) {
                    const x = anchor.x + (Math.random() - .5) * LEN * .9;
                    particles.push({
                        kind: 'splash', x, y: (ROWS - 2) * CH,
                        vx: (x - anchor.x) * .25, vy: -(5 + Math.random() * 7) * K,
                        g: 20 * K, life: .7 + Math.random() * .4, ch: '*'
                    });
                }
            }

            return {
                cur, tgt, kick, step, render, spout, bubbles, splash,
                set eye(c) { eyeChar = c; },
                snap() { Object.assign(cur, tgt); }
            };
        }

        /* =========================
           BEHAVIOUR (same concept as the owl)
        ========================= */

        const els = [...targets];
        const orcas = els.map(el => ({ el, o: createOrca(el) }));

        const MOODS = {
            light: { freq: .32, amp: .07, eye: '-' },   // sleepy
            dark:  { freq: .75, amp: .13, eye: '.' },   // awake
        };

        let hovering = null;
        let busy = new Set();
        let blinkUntil = 0, nextBlink = 0, nextBubble = 0, nextHoverSpout = 0;
        let eyeOverride = null, eyeOverrideUntil = 0;

        function mood() { return MOODS[currentTheme()]; }

        function applyMood(o) {
            const m = mood();
            o.tgt.freq = m.freq; o.tgt.amp = m.amp;
            o.tgt.pitch = 0; o.tgt.curl = 0;
        }

        function flashEye(c, ms) { eyeOverride = c; eyeOverrideUntil = performance.now() + ms; }

        orcas.forEach(({ o }) => { applyMood(o); o.snap(); });

        function eyeFor(item, now) {
            if (eyeOverride && now < eyeOverrideUntil) return eyeOverride;
            if (hovering === item) return '^';
            const m = mood();
            if (m.eye === '-') return '-';
            return now < blinkUntil ? '-' : m.eye;
        }

        /* — interactions — */

        function spoutAll(power) { orcas.forEach(({ o }) => o.spout(power)); }

        // theme change → spout, then new mood
        function onTheme() {
            orcas.forEach(({ el, o }) => { if (!busy.has(el)) applyMood(o); });
            flashEye('.', 500);
            spoutAll(1);
        }
        new MutationObserver(onTheme).observe(document.documentElement, {
            attributes: true, attributeFilter: ['data-theme']
        });
        darkQuery.addEventListener('change', onTheme);

        orcas.forEach(item => {
            const { el, o } = item;

            // hover → excited
            el.addEventListener('mouseenter', () => {
                if (busy.has(el)) return;
                hovering = item;
                o.tgt.freq = 1.6; o.tgt.amp = .2; o.tgt.curl = .15;
                o.spout(1.1); nextHoverSpout = performance.now() + 1300;
            });
            el.addEventListener('mouseleave', () => {
                if (hovering === item) hovering = null;
                if (!busy.has(el)) applyMood(o);
            });

            // click → breach (curls into the logo pose mid-air)
            el.addEventListener('click', () => {
                if (busy.has(el)) return;
                busy.add(el);
                flashEye('^', 1200);
                o.tgt.freq = 2; o.tgt.amp = .1; o.tgt.pitch = -.55; o.tgt.curl = .5;
                el.style.transition = 'transform .4s cubic-bezier(.2,.7,.3,1)';
                el.style.transform = 'translateY(-26px)';
                setTimeout(() => {
                    o.tgt.pitch = .55; o.tgt.curl = 1.9;
                    el.style.transition = 'transform .38s cubic-bezier(.6,0,.9,.6)';
                    el.style.transform = 'translateY(4px)';
                }, 420);
                setTimeout(() => {
                    o.splash();
                    o.tgt.pitch = 0; o.tgt.curl = 0;
                    el.style.transition = 'transform .3s ease';
                    el.style.transform = '';
                }, 820);
                setTimeout(() => { busy.delete(el); applyMood(o); el.style.transition = ''; }, 1200);
            });
        });

        // scroll → pitch with the scroll and flick the tail (throttled)
        let lastScroll = 0, lastY = scrollY;
        addEventListener('scroll', () => {
            const now = Date.now(), dir = Math.sign(scrollY - lastY);
            lastY = scrollY;
            if (now - lastScroll < 500) return;
            lastScroll = now;
            orcas.forEach(({ el, o }) => {
                if (busy.has(el)) return;
                o.kick.amp = .14;
                o.kick.pitch = .28 * dir;
            });
            flashEye('o', 600);
        }, { passive: true });

        // nav link / back-forward → dive under and resurface
        function dive() {
            orcas.forEach(({ el, o }) => {
                if (busy.has(el)) return;
                busy.add(el);
                o.tgt.pitch = .8; o.tgt.freq = 2; o.tgt.amp = .16;
                o.splash();
                el.style.transition = 'transform .7s ease-in, opacity .5s ease .2s';
                el.style.transform = 'translateY(22px)';
                el.style.opacity = '0';
                setTimeout(() => {
                    el.style.transition = 'none';
                    el.style.transform = 'translateY(16px)';
                    applyMood(o); o.tgt.pitch = -.35; o.snap();
                    void el.offsetHeight;
                    setTimeout(() => {
                        el.style.transition = 'transform .7s cubic-bezier(.2,1.3,.4,1), opacity .5s ease';
                        el.style.transform = '';
                        el.style.opacity = '';
                        o.tgt.pitch = 0;
                        setTimeout(() => {
                            busy.delete(el); el.style.transition = '';
                            o.spout(1);
                        }, 700);
                    }, 30);
                }, 900);
            });
        }
        document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', dive));
        addEventListener('hashchange', dive);

        // quiet for a while → back to the theme's mood
        let idleTimer = null;
        function resetIdle() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                orcas.forEach(item => { if (!busy.has(item.el) && hovering !== item) applyMood(item.o); });
            }, 6000);
        }
        ['mousemove', 'keydown', 'scroll'].forEach(e => document.addEventListener(e, resetIdle, { passive: true }));

        /* — loop — */

        if (reduceMotion) {
            orcas.forEach(({ o }) => { o.eye = mood().eye; o.render(); });
            new MutationObserver(() => orcas.forEach(({ o }) => { o.eye = mood().eye; o.render(); }))
                .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
            return;
        }

        let last = performance.now(), acc = 0;
        function frame(now) {
            const dt = Math.min(.05, (now - last) / 1000);
            last = now;

            // ambient behaviour
            if (currentTheme() === 'dark' && now > nextBlink) {
                blinkUntil = now + 140; nextBlink = now + 2500 + Math.random() * 3500;
            }
            if (currentTheme() === 'light' && now > nextBubble) {
                orcas.forEach(({ el, o }) => { if (!busy.has(el)) o.bubbles(); });
                nextBubble = now + 3000 + Math.random() * 2500;
            }
            if (hovering && now > nextHoverSpout) {
                hovering.o.spout(.9); nextHoverSpout = now + 1300;
            }

            orcas.forEach(item => {
                item.o.step(dt);
                item.o.eye = eyeFor(item, now);
            });

            acc += dt;
            if (acc >= 1 / 24) {   // ~24 fps is plenty for ASCII
                acc = 0;
                orcas.forEach(({ el, o }) => {
                    const r = el.getBoundingClientRect();
                    if (r.bottom > -50 && r.top < innerHeight + 50) o.render();
                });
            }
            requestAnimationFrame(frame);
        }
        orcas.forEach(({ o }) => o.render());
        requestAnimationFrame(frame);
    }

    window.AsciiOrca = { mount };
})();
