import { L, esc, T } from '../shell.js';
import { listPage, shorten } from '../listpage.js';

/* Our chats: screenshots of the messages worth keeping — WhatsApp, SMS, Messenger — with the date and a line.
   Band: a phone screen where the latest captions arrive as bubbles, left and right, one after another. */
export default listPage({
	id: 'chats', kind: 'chats', icon: 'chat',
	title: ['محادثاتنا', 'Our chats'], sub: ['أحلى رسايل بعتناها لبعض، باسكرينشوت', 'The best messages we sent each other, screenshotted'],
	add: ['ضيفوا اسكرينشوت', 'Add a screenshot'],
	fields: [
		{ n: 'shots', t: 'photo', l: ['الاسكرينشوت (ممكن أكتر من واحد)', 'Screenshot(s)'], req: 1, many: 1, full: 1 },
		{ n: 'date', t: 'date', l: ['إمتى؟', 'When?'] },
		{ n: 'app', t: 'sel', l: ['على فين؟', 'On what?'], opts: [['whatsapp', 'واتساب', 'WhatsApp'], ['sms', 'رسالة', 'SMS'], ['messenger', 'ماسنجر', 'Messenger'], ['other', 'حاجة تانية', 'Other']] },
		{ n: 'from', t: 'sel', l: ['مين بعت؟', 'Who sent it?'], opts: 'who' },
		{ n: 'note', t: 'text', l: ['سطر عنها', 'A line about it'], grow: 1, full: 1 }
	],
	sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
	band: (items, c) => {
		const lines = items.slice(0, 5).map((x) => [x.from, x.note || L('رسالة حلوة ♥', 'A sweet message ♥')]);
		const shown = lines.length ? lines : [['him', L('صباح الخير يا قمر', 'Morning, my moon')], ['her', L('صباح النور ♥', 'Morning ♥')], ['him', L('وحشتيني', 'Missed you')], ['her', L('وإنت أكتر', 'More')]];
		return `<div class="ch-phone"><div class="ch-top">${esc(T(c.s.her))} ♥ ${esc(T(c.s.him))}</div>${shown.map(([w, t], i) => `<p class="ch-b ch-b--${w === 'her' ? 'her' : 'him'}" style="--i:${i}" dir="auto">${esc(shorten(t, 40))}</p>`).join('')}<p class="ch-typing" style="--i:${shown.length}"><i></i><i></i><i></i></p></div>`;
	},
	card: (x, c) => `<article class="lp-card ch-card">
		<div class="ch-shots">${(x.shots || []).map((id) => `<img class="zoom" data-sketch="${esc(id)}" alt="" loading="lazy">`).join('')}</div>
		<p class="lp-k">${c.date(x.date)}${x.from ? ` · ${esc(c.whoName(x.from))}` : ''}</p>
		${x.note ? `<p dir="auto">${esc(x.note)}</p>` : ''}
		${c.del(x)}
	</article>`,
	empty: ['أول اسكرينشوت يتحط هنا ♥', 'The first screenshot goes here ♥'],
	related: ['posts', 'notes', 'letters']
});
