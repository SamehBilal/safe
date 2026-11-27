#!/usr/bin/env node
/* The menus' widgets on a phone. Their looks were written for the big menu, inside «@media (min-width: 980px)» and
   under each chapter's class (.mega-nights .mg-kinds…), so on a phone, where each chapter's card in the phone menu
   is a board of the same widgets (.pn-wg), none of it applied: a moon as big as the screen, the draws in one long
   column. This copies those widget rules — only the ones about widgets (mg-…, wg…), never the menu's own layout — into
   the end of assets/css/widgets.css, under .pn-wg and with no screen size, so they apply in the phone menu too.
   The copy sits between two markers and is written again on every build (tools/build.mjs runs this), so it never
   falls behind the big menu's.  Run alone: node tools/wgphone.mjs */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['assets/css/live.css', 'assets/css/chrome.css', 'assets/css/bujo.css', 'assets/css/widgets.css']; // in the order the pages load them
const OUT = 'assets/css/widgets.css';
const START = '/* ==== phone widgets (written by tools/wgphone.mjs — do not edit by hand) ==== */';
const END = '/* ==== end of phone widgets ==== */';
const CH = '(?:story|memories|nights|kids|home|people)';

/* the blocks at the top level of a stylesheet: [{ head, body }] (a rule, or an at-rule with its inside) */
function blocks(css) {
	const out = [];
	let i = 0;
	css = css.replace(/\/\*[\s\S]*?\*\//g, '');
	while (i < css.length) {
		const open = css.indexOf('{', i);
		if (open < 0) break;
		let depth = 0, j = open;
		for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}') { depth--; if (!depth) break; } }
		out.push({ head: css.slice(i, open).trim(), body: css.slice(open + 1, j) });
		i = j + 1;
	}
	return out;
}
const aboutWidgets = (sel) => /\.(mg-|wg[-_a-z]|mf-)/.test(sel) && !/\.(mega-in|mx-|mnav|wgp-)/.test(sel);
/* one selector under the phone's board: «.mega-nights .x» → «.pn-wg.mega-nights .x», «.mega .x» → «.pn-wg .x» */
function scope(sel) {
	return sel.split(',').map((s) => {
		s = s.trim();
		const pre = (/^((?:\[dir=['"]?\w+['"]?\]|:lang\(\w+\)|html(?:\[[^\]]+\])?|:root(?:\[[^\]]+\])?)\s+)/.exec(s) || ['', ''])[1];
		let rest = s.slice(pre.length);
		// the big menu opening (what starts the widgets' animations) is a chapter opening in the phone menu
		const opening = new RegExp(`^\\.mega(?:-(${CH}))?\\.is-open(?=[\\s.:[]|$)`).exec(rest);
		if (opening) rest = `.pn-ch[open] .pn-wg${opening[1] ? `.mega-${opening[1]}` : ''}${rest.slice(opening[0].length)}`;
		else if (new RegExp(`^\\.mega-${CH}\\b`).test(rest)) rest = rest.replace(new RegExp(`^\\.mega-(${CH})`), '.pn-wg.mega-$1');
		else if (/^\.mega\b/.test(rest)) rest = rest.replace(/^\.mega(?=[\s.:[])/, '.pn-wg');
		else rest = `.pn-wg ${rest}`;
		return pre + rest;
	}).join(', ');
}

let copied = '';
let n = 0;
for (const file of SOURCES) {
	const css = await readFile(path.join(ROOT, file), 'utf8');
	const own = file === OUT ? css.split(START)[0] : css;
	for (const b of blocks(own)) {
		if (!/^@media\s*\(min-width:\s*9[0-9]0px\)\s*$/.test(b.head)) continue; // the big menu's, with no upper bound
		for (const r of blocks(b.body)) {
			if (r.head.startsWith('@') || !aboutWidgets(r.head)) continue;
			copied += `${scope(r.head)} {${r.body}}\n`;
			n++;
		}
	}
}
const out = await readFile(path.join(ROOT, OUT), 'utf8');
const before = out.split(START)[0].replace(/\s*$/, '\n');
const after = out.includes(END) ? out.split(END)[1] : '\n';
await writeFile(path.join(ROOT, OUT), `${before}\n${START}\n${copied}${END}${after}`);
console.log(`✓ phone widgets: ${n} rule(s) copied for the phone menu`);
