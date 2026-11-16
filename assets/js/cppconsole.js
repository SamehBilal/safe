/* Runs a small C++ program right on the page, in a console that looks like the Windows one it first ran in.
   It understands just what our programs use: `string`/`int` declarations, `cout << "text" << var << endl;`,
   `cin >> a >> b;` and `for (int i = 0; i < N; i++) { … }`. Like the real `cin`, it reads one word at a time,
   so a line with three words fills three variables, and a question only waits when the words run out.
   An `int` left without a value starts at 0, as it did on that laptop. Ctrl+C (or ✕) stops it. */

const KEEP = 400; // lines kept on screen; the rest have scrolled away, as in a real console
const PER_FRAME = 700; // loop lines printed per frame: a million takes about half a minute

/* ---------- reading the program ---------- */

function body(src) {
	src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
	const m = /\bmain\s*\([^)]*\)\s*\{/.exec(src);
	if (!m) throw new Error('no main()');
	const start = m.index + m[0].length;
	const end = matching(src, start - 1);
	return src.slice(start, end);
}

/* index of the bracket that closes the one at `open`, skipping strings */
function matching(src, open) {
	const pair = { '{': '}', '(': ')' }[src[open]];
	let depth = 0;
	for (let i = open; i < src.length; i++) {
		const c = src[i];
		if (c === '"' || c === "'") i = skipString(src, i);
		else if (c === src[open]) depth++;
		else if (c === pair && --depth === 0) return i;
	}
	throw new Error('unbalanced ' + src[open]);
}

function skipString(src, i) {
	const q = src[i];
	for (i++; i < src.length && src[i] !== q; i++) if (src[i] === '\\') i++;
	return i;
}

/* split on `<<` / `>>` outside strings */
function splitOps(s, op) {
	const out = [];
	let cur = '';
	for (let i = 0; i < s.length; i++) {
		if (s[i] === '"' || s[i] === "'") {
			const j = skipString(s, i);
			cur += s.slice(i, j + 1);
			i = j;
		} else if (s.startsWith(op, i)) {
			out.push(cur.trim());
			cur = '';
			i++;
		} else cur += s[i];
	}
	out.push(cur.trim());
	return out;
}

const unquote = (s) => s.slice(1, -1).replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t', '"': '"', "'": "'", '\\': '\\' })[c] ?? c);

function parse(src) {
	const ops = [];
	let i = 0;
	while (i < src.length) {
		while (i < src.length && /[\s;]/.test(src[i])) i++;
		if (i >= src.length) break;
		if (/^for\s*\(/.test(src.slice(i))) {
			const open = src.indexOf('(', i);
			const close = matching(src, open);
			const [init, cond, step] = src.slice(open + 1, close).split(';').map((p) => p.trim());
			const b = src.indexOf('{', close);
			const e = matching(src, b);
			const im = /^(?:int\s+)?(\w+)\s*(?:=\s*(-?\d+))?$/.exec(init);
			const cm = /^(\w+)\s*(<=|<|>=|>|!=)\s*(-?\d+)$/.exec(cond);
			const sm = /^(?:\+\+(\w+)|(\w+)\+\+|--(\w+)|(\w+)--)$/.exec(step);
			if (!im || !cm || !sm) throw new Error('for loop not understood');
			ops.push({ t: 'for', v: im[1], from: im[2] == null ? null : Number(im[2]), cmp: cm[2], lim: Number(cm[3]), d: sm[1] || sm[2] ? 1 : -1, body: parse(src.slice(b + 1, e)) });
			i = e + 1;
			continue;
		}
		let j = i;
		for (; j < src.length && src[j] !== ';'; j++) if (src[j] === '"' || src[j] === "'") j = skipString(src, j);
		const st = src.slice(i, j).trim();
		i = j + 1;
		if (/^cout\s*<</.test(st)) {
			ops.push({ t: 'out', items: splitOps(st, '<<').slice(1).map((p) => (p === 'endl' ? { s: '\n' } : /^["']/.test(p) ? { s: unquote(p) } : /^-?\d+$/.test(p) ? { s: p } : { v: p })) });
		} else if (/^cin\s*>>/.test(st)) {
			ops.push({ t: 'in', vars: splitOps(st, '>>').slice(1) });
		} else if (/^(?:std::)?(string|int)\s/.test(st)) {
			const type = /^(?:std::)?(\w+)/.exec(st)[1];
			for (const d of st.replace(/^(?:std::)?\w+\s+/, '').split(',')) {
				const [, name, val] = /^\s*(\w+)\s*(?:=\s*(.+))?$/.exec(d) || [];
				if (name) ops.push({ t: 'let', v: name, val: val == null ? (type === 'int' ? 0 : '') : /^["']/.test(val.trim()) ? unquote(val.trim()) : Number(val) });
			}
		} else if (/^return\b/.test(st) || st === '') {
			/* nothing to do */
		} else throw new Error('not understood: ' + st);
	}
	return ops;
}

/* ---------- the console ---------- */

export function runCpp(host, code, { title = 'Untitled1.exe', hint = '', again = 'Run again' } = {}) {
	let ops;
	try {
		ops = parse(body(code));
	} catch (err) {
		host.textContent = String(err.message || err);
		return;
	}
	host.innerHTML = `<div class="cpp" dir="ltr">
		<div class="cpp__bar"><span class="cpp__ic" aria-hidden="true">▣</span><span class="cpp__title"></span><button class="cpp__x" type="button" aria-label="Stop">✕</button></div>
		<div class="cpp__screen" tabindex="-1"><span class="cpp__out"></span><input class="cpp__in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="${hint}"></div>
		<div class="cpp__foot"><small class="cpp__hint"></small><button class="cpp__again btn" type="button" hidden></button></div>
	</div>`;
	const $ = (s) => host.querySelector(s);
	const screen = $('.cpp__screen'), out = $('.cpp__out'), input = $('.cpp__in');
	$('.cpp__title').textContent = title;
	$('.cpp__again').textContent = again;

	let lines = [''];
	let stopped = false;
	let wake = null; // resolves when a line is typed or the run is stopped
	const words = [];
	const vars = Object.create(null);

	const paint = () => {
		if (lines.length > KEEP) lines = lines.slice(-KEEP);
		out.textContent = lines.join('\n');
		screen.scrollTop = screen.scrollHeight;
	};
	const write = (s) => {
		const parts = String(s).split('\n');
		lines[lines.length - 1] += parts[0];
		for (let k = 1; k < parts.length; k++) lines.push(parts[k]);
	};
	const val = (name) => (name in vars ? vars[name] : 0);

	input.addEventListener('keydown', (e) => {
		if (e.key === 'c' && e.ctrlKey && !input.value) return stop(e);
		if (e.key !== 'Enter') return;
		e.preventDefault();
		write(input.value + '\n');
		words.push(...input.value.split(/\s+/).filter(Boolean));
		input.value = '';
		paint();
		wake?.();
	});
	screen.addEventListener('click', () => !input.hidden && input.focus());
	const stop = (e) => {
		e?.preventDefault();
		if (stopped) return;
		stopped = true;
		write('^C');
		wake?.();
	};
	$('.cpp__x').addEventListener('click', stop);
	$('.cpp__again').addEventListener('click', () => runCpp(host, code, { title, hint, again }));

	async function word() {
		while (!words.length && !stopped) {
			input.hidden = false;
			$('.cpp__hint').textContent = hint;
			paint();
			input.focus({ preventScroll: true });
			await new Promise((r) => (wake = r));
			wake = null;
		}
		input.hidden = true;
		$('.cpp__hint').textContent = '';
		return words.shift();
	}

	const frame = () => new Promise((r) => requestAnimationFrame(r));
	const test = (a, cmp, b) => ({ '<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b, '!=': a !== b })[cmp];

	async function run(list) {
		for (const op of list) {
			if (stopped) return;
			if (op.t === 'let') vars[op.v] = op.val;
			else if (op.t === 'out') for (const it of op.items) write(it.v ? val(it.v) : it.s);
			else if (op.t === 'in') for (const v of op.vars) { const w = await word(); if (stopped) return; vars[v] = w; }
			else if (op.t === 'for') {
				vars[op.v] = op.from ?? 0;
				const waits = JSON.stringify(op.body).includes('"t":"in"');
				for (let n = 0; test(vars[op.v], op.cmp, op.lim); vars[op.v] += op.d) {
					if (stopped) return;
					await run(op.body);
					if (!waits && ++n % PER_FRAME === 0) { paint(); await frame(); }
				}
			}
		}
	}

	const t0 = performance.now();
	input.hidden = true;
	run(ops).then(() => {
		const secs = ((performance.now() - t0) / 1000).toFixed(3);
		write(`\n--------------------------------\nProcess exited after ${secs} seconds with return value ${stopped ? '3221225786' : '0'}\nPress any key to continue . . . `);
		input.hidden = true;
		$('.cpp__x').hidden = true;
		$('.cpp__hint').textContent = '';
		$('.cpp__again').hidden = false;
		paint();
	});
	paint();
	screen.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
