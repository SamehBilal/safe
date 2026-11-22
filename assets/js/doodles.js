/* Hand-drawn icons, in the pencil style of the footer sketch, used everywhere instead of emoji.
   doodle(key) takes an icon name or an emoji (so emoji already saved in our data still draw):
   a 24×24 line drawing in the current text colour, roughened slightly so the lines wobble like a pen. */

const CIRCLE = (cx, cy, r) => `M${cx + r} ${cy}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0`;
const FACE = CIRCLE(12, 12, 9);
const HEART = 'M12 20C6 16 3.5 12.7 3.5 9.5A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.5 2.3C20.5 12.7 18 16 12 20Z';

const PATHS = {
	heart: HEART,
	cake: 'M4 20.5h16M5 20.5v-7h14v7M5 15.5c2 1.5 4 1.5 6 0s4-1.5 6 0 2 1 2 1M9 13.5V10M15 13.5V10M12 13.5V9.5M9 8.5c.7-.7.7-1.6 0-2.6-.7 1-.7 1.9 0 2.6ZM15 8.5c.7-.7.7-1.6 0-2.6-.7 1-.7 1.9 0 2.6ZM12 7.5c.7-.7.7-1.6 0-2.6-.7 1-.7 1.9 0 2.6Z',
	ring: `${CIRCLE(12, 15, 6)}M9 9.5 7.5 6h9L15 9.5M9.5 6 12 3.5 14.5 6`,
	chat: 'M4 5h16v11h-9l-5 4v-4H4zM8 9h8M8 12h5',
	pen: 'M4 20l1.2-4.6L15.6 5a2.2 2.2 0 0 1 3.1 3.1L8.3 18.5zM14 6.6l3.1 3.1M3 22h8',
	pencil: 'M4 20l1.2-4.6L15.6 5a2.2 2.2 0 0 1 3.1 3.1L8.3 18.5zM14 6.6l3.1 3.1',
	party: 'M4 20.5 9 8l7 7zM9 8l7 7M14 4c.6 1.5 0 3-1 3.5M18 7c1.5-.6 2.6 0 3 1M17 3l.5 1.5M20 12l1.5.6M11 3.5l.3.7M6.5 14.5l3 3',
	sparkle: 'M12 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6ZM19 15c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z',
	suitcase: 'M4 8h16v11H4zM9 8V5.5h6V8M4 13h16M8 8v11M16 8v11',
	music: `M9 18V6l10-2v11M9 10l10-2${CIRCLE(6.5, 18, 2.5)}${CIRCLE(16.5, 15, 2.5)}`,
	popcorn: 'M6 10l1.6 10.5h8.8L18 10M6 10h12M9.3 10l.6 10.5M14.7 10l-.6 10.5M7 10c-1.6-.6-1.4-3.2.6-3 .1-2.1 2.6-2.4 3.5-.9 1.1-1.6 3.6-1.4 3.9.5 2-.3 2.9 2.2 1.3 3.4',
	sun: `${CIRCLE(12, 12, 4.5)}M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8`,
	moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5ZM17 4.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4Z',
	camera: `M4 8h4l1.5-2h5L16 8h4v11H4z${CIRCLE(12, 13.5, 3.5)}`,
	dice: 'M4.5 4.5h15v15h-15zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01',
	dress: 'M9 3h6l-1 4.5 4.5 13H5.5L10 7.5zM10 7.5h4M9.5 3l2.5 2 2.5-2',
	dinner: `${CIRCLE(12.5, 12, 6)}${CIRCLE(12.5, 12, 3)}M3.5 4v5c0 1 .6 1.6 1.5 1.6V20M5 4v4M21 4c-1.6 1-2.2 3-2.2 5H21v11`,
	scooter: `${CIRCLE(6, 17.5, 2.5)}${CIRCLE(18, 17.5, 2.5)}M8.5 17.5h6l2.5-7h-3.5M17 10.5 16 7h-2.5M3 8.5h6v4.5H3z`,
	clapper: 'M4 10h16v10H4zM4 10l.6-3.8 15-2.2.5 3.6M8.4 5.6l1.6 3.6M13.4 4.8l1.6 3.6',
	lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5',
	eraser: 'M4 15.5l8.5-8.5 6 6-7.5 7.5H7zM8.5 11.5l6 6M11 20.5h9',
	trash: 'M5 7h14M9 7V4.5h6V7M7 7l1 13.5h8L17 7M10 10.5v6.5M14 10.5v6.5',
	plane: 'M21 3.5 3 11l6.5 2.5L12 20l3-5 4.5 3zM9.5 13.5 21 3.5',
	back: 'M15 5l-7 7 7 7',
	forward: 'M9 5l7 7-7 7',
	refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20 3.8V8h-4.2',
	shuffle: 'M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3',
	pin: 'M14.5 3.5 20.5 9.5l-3 1-4 4 1 4-2 1L8.5 15.5M3.5 20.5l5-5M9 10l5 5',
	gear: `${CIRCLE(12, 12, 3)}M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8`,
	letter: 'M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5M12 17c-1.4-1-3-2-3-3.2 0-.9.6-1.4 1.3-1.4.8 0 1.3.5 1.7 1 .4-.5.9-1 1.7-1 .7 0 1.3.5 1.3 1.4 0 1.2-1.6 2.2-3 3.2Z',
	handshake: 'M2.5 11 6 7.5l4 1.5 2.5-1.5 4.5 1 4.5 3.5M6 14l3 3 1.6-1 1.6 1.6 1.6-1 1.6 1.4 2.5-2.5M2.5 11 6 14M21.5 11.5 18 15',
	calendar: 'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M8 14h2M14 14h2M8 17h2',
	star: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
	wave: 'M7 13V6.5a1.5 1.5 0 0 1 3 0V11M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 12V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14a1.5 1.5 0 0 1 2.3-1.9L7 13M3 6c.5-1.2 1.3-2 2.3-2.5M20 3.5c.9.5 1.5 1.2 1.8 2',
	clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V12l3 2',
	coins: 'M5 7.5c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5S5 8.9 5 7.5ZM5 7.5v3c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-3M5 10.5v3c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-3M5 13.5v3c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-3',
	grad: 'M2.5 9.5 12 5l9.5 4.5L12 14ZM6.5 11.6v4.1c3.3 2.4 7.7 2.4 11 0v-4.1M21.5 9.5v5.5',
	house: 'M3.5 11.5 12 4.5l8.5 7M5.5 10v10h13V10M10 20v-5.5h4V20',
	tooth: 'M7 4c2-1 3.5.5 5 .5S15 3 17 4c2.5 1.3 2.6 5 1.5 8-.8 2.3-1 5-1.6 7.5-.4 1.6-2.2 1.6-2.6 0L13 15.5c-.3-1-1.7-1-2 0l-1.3 4c-.4 1.6-2.2 1.6-2.6 0C6.5 17 6.3 14.3 5.5 12 4.4 9 4.5 5.3 7 4Z',
	foot: 'M7.5 13C5.8 13 5 10.6 5 8s1-4.5 2.7-4.5S10.4 5.6 10.2 8.3 9.1 13 7.5 13ZM5.8 15.6h3.6M16.5 20.5c-1.7 0-2.6-2.5-2.4-5.2.2-2.7 1.3-4.8 3-4.8s2.5 2.3 2.2 5-1.2 5-2.8 5ZM14.8 8h3.6',
	mosque: 'M3 21h18M6 21v-8h12v8M7 13c0-3 2.2-5 5-6.5 2.8 1.5 5 3.5 5 6.5M12 6.5V3.5M10.2 21v-3.8a1.8 1.8 0 0 1 3.6 0V21M3.5 21V10.5M2.7 10.5l.8-2.2.8 2.2M20.5 21V10.5M19.7 10.5l.8-2.2.8 2.2',
	trophy: 'M8 4h8v5a4 4 0 0 1-8 0ZM8 6H5.2A3 3 0 0 0 8 10.2M16 6h2.8A3 3 0 0 1 16 10.2M12 13v3M10 16h4v4h-4ZM8.5 20h7',
	crown: 'M4 18.5 2.8 8.5l5 4 4.2-7 4.2 7 5-4-1.2 10ZM4 21h16',
	tv: 'M3.5 7.5h17v11h-17ZM8 21.5h8M9 3.5l3 4 3-4M17.5 11v.01M17.5 14v.01',
	teddy: `${CIRCLE(12, 13.5, 6.5)}${CIRCLE(6.3, 6.8, 2.6)}${CIRCLE(17.7, 6.8, 2.6)}M9.8 12.5h.01M14.2 12.5h.01M10.6 16c.9.7 1.9.7 2.8 0M12 14.3v1`,
	palette: 'M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.8-1 1.3-2-.6-1.1.1-2.3 1.4-2.3h2.2a3.6 3.6 0 0 0 3.6-3.7C20.5 7.6 16.7 3.5 12 3.5ZM7.5 11.5h.01M9.5 7.5h.01M14 7h.01M17 10.5h.01',
	ruler: 'M3 16.5 16.5 3l4.5 4.5L7.5 21ZM6.4 13.1l1.6 1.6M9 10.5l2.4 2.4M11.6 7.9l1.6 1.6M14.2 5.3l2.4 2.4',
	scale: 'M4.5 6.5h15l-1.4 13.5H5.9ZM9 12a3 3 0 0 1 6 0M12 12l1.6-2M7 4h10',
	syringe: 'M14 4l6 6M17 7l-9.5 9.5-3.2 1 1-3.2L14.8 4.8M8.8 11.2l2 2M11.3 8.7l2 2M4.3 19.7 2.8 21.2',
	stethoscope: `M6 3v6a4 4 0 0 0 8 0V3M4.5 3h3M12.5 3h3M10 13v3a4 4 0 0 0 8 0v-1.5${CIRCLE(18, 12.5, 2)}`,
	pill: 'M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7ZM7 10l6.5 6.5',
	flask: 'M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
	plaster: 'M4.5 14.5 14.5 4.5a3 3 0 0 1 4.2 0l.8.8a3 3 0 0 1 0 4.2L9.5 19.5a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2ZM10 10h.01M12 12h.01M10 12h.01M12 10h.01',
	thermometer: `M10 14.2V5a2 2 0 0 1 4 0v9.2${CIRCLE(12, 17.5, 3.6)}M12 9v6`,
	gift: 'M4 10h16v4H4zM5 14v7h14v-7M12 10v11M12 10c-2-4-6-4-6-1.5S10 10 12 10Zm0 0c2-4 6-4 6-1.5S14 10 12 10Z',
	phone: 'M5 4h4l1.5 4L8 9.5a11 11 0 0 0 6.5 6.5L16 13.5l4 1.5v4a2 2 0 0 1-2 2C10 20.5 3.5 14 3 6a2 2 0 0 1 2-2Z',
	rain: 'M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5 3.3 3.3 0 0 1 0 6.5zM8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5',
	train: 'M7 3.5h10a2.5 2.5 0 0 1 2.5 2.5v9.5a2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 7 3.5ZM4.5 10.5h15M12 3.5v7M8 14.5h.01M16 14.5h.01M8 18l-2.5 3M16 18l2.5 3',
	bus: 'M6.5 3h11A1.5 1.5 0 0 1 19 4.5V18H5V4.5A1.5 1.5 0 0 1 6.5 3ZM5 11h14M5 6.5h14M8 14.5h.01M16 14.5h.01M7 18v2.5M17 18v2.5',
	ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4ZM15 7.5v1.6M15 11.2v1.6M15 14.9v1.6M6.5 10.5h5M6.5 13.5h3.5',
	mailbox: 'M4 20.5V11a4.5 4.5 0 0 1 9 0v9.5ZM13 6.5h3.5a4 4 0 0 1 4 4v10H8.5M6.5 11h4M15.5 20.5V3.5h3.5v2.5h-3.5',
	magnet: 'M5 4h4v8a3 3 0 0 0 6 0V4h4v8a7 7 0 0 1-14 0ZM5 7.5h4M15 7.5h4',
	wrench: 'M14.6 3.6a4.6 4.6 0 0 0-3.7 6.1l-7 7a2 2 0 0 0 2.9 2.9l7-7a4.6 4.6 0 0 0 6.1-3.7l-2.6 1.6-2.3-.6-.6-2.3Z',
	drop: 'M12 3c3.6 4.6 6.2 8.1 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 11.1 8.4 7.6 12 3ZM9 14.5a3 3 0 0 0 3 3',
	coffee: 'M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1.5a2.5 2.5 0 0 1 0 5H16M9 3c-1 1.5 1 2.5 0 4M12.5 3c-1 1.5 1 2.5 0 4',
	walk: `${CIRCLE(13, 4.5, 1.8)}M12 8l-2 5 3 2 1 6M10 13l-3 7.5M12 8l3 3 3 1M12 8 9 10l-2 3`,
	couple: `${CIRCLE(8, 5, 2)}${CIRCLE(16, 5, 2)}M5 21l1-9h4l1 9M13 21l1.5-9h3l1.5 9M10 13.5h3.5`,
	family: `${CIRCLE(7, 5, 2)}${CIRCLE(17, 5, 2)}${CIRCLE(10.5, 12, 1.5)}${CIRCLE(14.5, 13, 1.3)}M4 21l1-11h4l1 11M14 21l1-11h4l1 11M9.5 21l.5-6.5h1.5l.5 6.5M13.5 21l.5-5.5h1.5`,
	book: 'M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5zM12 6v13.5',
	scroll: 'M7 4h11v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2h12M7 4a2 2 0 0 0-2 2v10M10 8h5M10 11h5',
	bride: `${CIRCLE(12, 5, 2.5)}M9.5 4C6 5 5 10 4 13.5M12 7.5 8 21h8zM10 12h4`,
	baby: `${FACE}M12 6c1-1.6 2.6-1 2.6 0M9.5 11h.01M14.5 11h.01M10.5 15c1 .8 2 .8 3 0`,
	bottle: 'M10 3h4v3h-4zM9 6h6l1 3v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9zM8 12h3M8 15h3',
	lion: `${CIRCLE(12, 12.5, 5)}M12 3l1.5 2 2.5-1 .5 2.5 2.5.5-1 2.5 2 1.5-2 1.5 1 2.5-2.5.5-.5 2.5-2.5-1L12 21.5l-1.5-2-2.5 1-.5-2.5-2.5-.5 1-2.5-2-1.5 2-1.5-1-2.5 2.5-.5.5-2.5 2.5 1zM10 11.5h.01M14 11.5h.01M11 14.5h2L12 15.5z`,
	chick: `M5 14c0 4 3 7 7 7s7-3 7-7l-2.5 1.5L14 13l-2 2-2-2-2.5 2.5z${CIRCLE(12, 9, 4)}M10.5 8.5h.01M13.5 8.5h.01M11.4 10.6h1.2l-.6.8z`,
	groom: `${CIRCLE(12, 8, 5)}M7 6.5c2-3 8-3 10 0M10 8h.01M14 8h.01M10.5 10.5q1.5 1 3 0M9 18l3-1.8 3 1.8-3 1.8zM5 22c1-4 3.5-6 7-6s6 2 7 6`,
	princess: `${CIRCLE(12, 9, 5)}M8 5l1.5 1.8L12 3.5l2.5 3.3L16 5l-.4 2.5H8.4zM10 9h.01M14 9h.01M10.5 11.5q1.5 1 3 0M7 9c-1.5 3-1 7 0 9M17 9c1.5 3 1 7 0 9M5 22c1-3.5 3.5-5 7-5s6 1.5 7 5`,
	eyes: `${CIRCLE(8, 12, 4)}${CIRCLE(16, 12, 4)}M8.5 12.5h.01M16.5 12.5h.01`,
	shy: `${FACE}M7 9.5l3 1M17 9.5l-3 1M9.5 15.5q2.5 1.5 5 0M6 8l2-1.5M18 8l-2-1.5`,
	/* moods */
	love: `${FACE}M8 9.5c-.5-.7-1.8-.5-1.8.4 0 .9 1.8 1.9 1.8 1.9s1.8-1 1.8-1.9c0-.9-1.3-1.1-1.8-.4ZM16 9.5c-.5-.7-1.8-.5-1.8.4 0 .9 1.8 1.9 1.8 1.9s1.8-1 1.8-1.9c0-.9-1.3-1.1-1.8-.4ZM8 15c2 2.5 6 2.5 8 0`,
	smitten: `${FACE}M7 10q1.5-1.6 3 0M14 10q1.5-1.6 3 0M8.5 15c2 2 5 2 7 0M18.5 4.5c-.3-.4-1-.3-1 .3 0 .5 1 1 1 1s1-.5 1-1c0-.6-.7-.7-1-.3Z`,
	laugh: `${FACE}M7 10l3-1M17 10l-3-1M7.5 13.5h9c0 3-2 4.5-4.5 4.5s-4.5-1.5-4.5-4.5ZM4.8 11.5c-1 1.5-1 2.5 0 3M19.2 11.5c1 1.5 1 2.5 0 3`,
	teary: `${FACE}M8 9.5h2M14 9.5h2M9 12v1.6M15 12v1.6M10 16.5q2-1.5 4 0`,
	calm: `${FACE}M7 10q1.5 1.5 3 0M14 10q1.5 1.5 3 0M9 15q3 2 6 0`,
	sleepy: `${FACE}M7 10.5h3M14 10.5h3M10.5 16h3M17.5 2.5h3l-3 3h3`,
	sick: `${FACE}M7 10h3M14 10h3M9 16q3-1.5 6 0M15 14.5l5.5-5.5M19 8l2 2`,
	angry: `${FACE}M7 9l3 1.5M17 9l-3 1.5M9 16q3-2 6 0M4.5 17.5 3 19.5M19.5 17.5l1.5 2`
};

/* emoji already in our data (and their old meanings) → drawings */
const EMOJI = {
	'🎂': 'cake', '💍': 'ring', '💬': 'chat', '✍️': 'pen', '✍': 'pen', '🎉': 'party', '✨': 'sparkle', '✏️': 'pencil', '✏': 'pencil', '🧳': 'suitcase',
	'🎵': 'music', '🎶': 'music', '🍿': 'popcorn', '☀️': 'sun', '🌙': 'moon', '🧡': 'heart', '❤️': 'heart', '❤': 'heart', '♥': 'heart', '💕': 'heart',
	'📸': 'camera', '📷': 'camera', '🎲': 'dice', '👗': 'dress', '🍽️': 'dinner', '🍽': 'dinner', '🛵': 'scooter', '🎬': 'clapper', '🔒': 'lock', '🔐': 'lock',
	'🧽': 'eraser', '🗑️': 'trash', '✈️': 'plane', '🔄': 'refresh', '🔀': 'shuffle', '📌': 'pin', '⚙️': 'gear', '💌': 'letter', '🤝': 'handshake',
	'🗓️': 'calendar', '⭐': 'star', '👋': 'wave', '👀': 'eyes', '🙈': 'shy', '🎁': 'gift', '📞': 'phone', '🌧️': 'rain', '☕': 'coffee', '🚆': 'train', '🚌': 'bus', '🎟️': 'ticket', '🎟': 'ticket', '🎤': 'music', '🧾': 'scroll', '📍': 'pin', '📮': 'mailbox', '🧲': 'magnet', '🔧': 'wrench', '🛠️': 'wrench', '💧': 'drop', '🚶': 'walk',
	'👫': 'couple', '👨‍👩‍👧‍👦': 'family', '📖': 'book', '📜': 'scroll', '👰': 'bride', '👶': 'baby', '🍼': 'bottle', '🦁': 'lion', '🐣': 'chick',
	'🤵': 'groom', '👸': 'princess', '😍': 'love', '🥰': 'smitten', '😂': 'laugh', '🥹': 'teary', '😌': 'calm', '😴': 'sleepy', '🤒': 'sick', '😤': 'angry'
};

export const MOODS = ['love', 'smitten', 'laugh', 'teary', 'calm', 'party', 'sleepy', 'sick', 'angry', 'rain'];

/** Name of the drawing for an icon name or emoji ('' if there's none). */
export const doodleName = (key) => (PATHS[key] ? key : EMOJI[key] || EMOJI[String(key || '').replace(/️/g, '')] || '');

/** The drawing as inline SVG. Unknown keys fall back to a heart. */
export function doodle(key, size = 24, cls = '') {
	const d = PATHS[doodleName(key)] || HEART;
	return `<svg class="dd${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}" filter="url(#dd-rough)"/></svg>`;
}

/** Strip emoji out of a piece of text (for titles and labels that are plain text). */
export const noEmoji = (s) => String(s ?? '').replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}️?)*/gu, (m) => (m === '♥' ? m : '')).replace(/\s{2,}/g, ' ').trim();

/** The pen-wobble filter, added to the page once. */
export function doodleDefs() {
	if (document.getElementById('dd-defs')) return;
	const box = document.createElement('div');
	box.innerHTML = `<svg id="dd-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="dd-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".9" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>`;
	document.body.prepend(box.firstChild);
}

/** The raw 24×24 path of an icon (for drawing it inside a bigger picture). */
export const doodlePath = (key) => PATHS[doodleName(key)] || HEART;
