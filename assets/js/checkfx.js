/* Hand-drawn ticks: the pen strokes of Codrops' «Animated Checkboxes and Radio Buttons with SVG» (Mary Lou, 2013 —
   tympanus.net/codrops/?p=16637), drawn stroke by stroke when something is ticked: a cross, a checkmark, a circle
   round it, a scribble filling the box, a slash, and two wavy lines through a line of a list.
   mark(svg, type) draws one into an <svg>; unmark(svg) rubs it out. The <svg> is sized and coloured by the page. */

export const MARKS = {
	cross: { box: '0 0 100 100', d: ['M 10 10 L 90 90', 'M 90 10 L 10 90'], speed: 0.2, ease: 'ease-in-out' },
	checkmark: { box: '0 0 100 100', d: ['M16.667,62.167c3.109,5.55,7.217,10.591,10.926,15.75 c2.614,3.636,5.149,7.519,8.161,10.853c-0.046-0.051,1.959,2.414,2.692,2.343c0.895-0.088,6.958-8.511,6.014-7.3 c5.997-7.695,11.68-15.463,16.931-23.696c6.393-10.025,12.235-20.373,18.104-30.707C82.004,24.988,84.802,20.601,87,16'], speed: 0.25, ease: 'ease-in-out' },
	circle: { box: '0 0 100 100', d: ['M34.745,7.183C25.078,12.703,13.516,26.359,8.797,37.13 c-13.652,31.134,9.219,54.785,34.77,55.99c15.826,0.742,31.804-2.607,42.207-17.52c6.641-9.52,12.918-27.789,7.396-39.713 C85.873,20.155,69.828-5.347,41.802,13.379'], speed: 0.35, ease: 'ease-in-out' },
	diagonal: { box: '0 0 100 100', d: ['M16.053,91.059c0.435,0,0.739-0.256,0.914-0.768 c3.101-2.85,5.914-6.734,8.655-9.865C41.371,62.438,56.817,44.11,70.826,24.721c3.729-5.16,6.914-10.603,10.475-15.835 c0.389-0.572,0.785-1.131,1.377-1.521'], speed: 0.2, ease: 'ease-in-out' },
	boxfill: { box: '0 0 100 100', d: ['M6.987,4.774c15.308,2.213,30.731,1.398,46.101,1.398 c9.74,0,19.484,0.084,29.225,0.001c2.152-0.018,4.358-0.626,6.229,1.201c-5.443,1.284-10.857,2.58-16.398,2.524 c-9.586-0.096-18.983,2.331-28.597,2.326c-7.43-0.003-14.988-0.423-22.364,1.041c-4.099,0.811-7.216,3.958-10.759,6.81 c8.981-0.104,17.952,1.972,26.97,1.94c8.365-0.029,16.557-1.168,24.872-1.847c2.436-0.2,24.209-4.854,24.632,2.223 c-14.265,5.396-29.483,0.959-43.871,0.525c-12.163-0.368-24.866,2.739-36.677,6.863c14.93,4.236,30.265,2.061,45.365,2.425 c7.82,0.187,15.486,1.928,23.337,1.903c2.602-0.008,6.644-0.984,9,0.468c-2.584,1.794-8.164,0.984-10.809,1.165 c-13.329,0.899-26.632,2.315-39.939,3.953c-6.761,0.834-13.413,0.95-20.204,0.938c-1.429-0.001-2.938-0.155-4.142,0.436 c5.065,4.68,15.128,2.853,20.742,2.904c11.342,0.104,22.689-0.081,34.035-0.081c9.067,0,20.104-2.412,29.014,0.643 c-4.061,4.239-12.383,3.389-17.056,4.292c-11.054,2.132-21.575,5.041-32.725,5.289c-5.591,0.124-11.278,1.001-16.824,2.088 c-4.515,0.885-9.461,0.823-13.881,2.301c2.302,3.186,7.315,2.59,10.13,2.694c15.753,0.588,31.413-0.231,47.097-2.172 c7.904-0.979,15.06,1.748,22.549,4.877c-12.278,4.992-25.996,4.737-38.58,5.989c-8.467,0.839-16.773,1.041-25.267,0.984 c-4.727-0.031-10.214-0.851-14.782,1.551c12.157,4.923,26.295,2.283,38.739,2.182c7.176-0.06,14.323,1.151,21.326,3.07 c-2.391,2.98-7.512,3.388-10.368,4.143c-8.208,2.165-16.487,3.686-24.71,5.709c-6.854,1.685-13.604,3.616-20.507,4.714 c-1.707,0.273-3.337,0.483-4.923,1.366c2.023,0.749,3.73,0.558,5.95,0.597c9.749,0.165,19.555,0.31,29.304-0.027 c15.334-0.528,30.422-4.721,45.782-4.653'], speed: 0.8, ease: 'ease-in' },
	list: { box: '0 0 300 100', d: ['M1.986,8.91c41.704,4.081,83.952,5.822,125.737,2.867 c17.086-1.208,34.157-0.601,51.257-0.778c21.354-0.223,42.706-1.024,64.056-1.33c18.188-0.261,36.436,0.571,54.609,0.571', 'M3.954,25.923c9.888,0.045,19.725-0.905,29.602-1.432 c16.87-0.897,33.825-0.171,50.658-2.273c14.924-1.866,29.906-1.407,44.874-1.936c19.9-0.705,39.692-0.887,59.586,0.45 c35.896,2.407,71.665-1.062,107.539-1.188'], speed: 0.3, ease: 'ease-in-out', stretch: true }
};
const NS = 'http://www.w3.org/2000/svg';
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** An empty <svg> ready for a mark of that type (as HTML). */
export const markSVG = (type, cls = '') => { const m = MARKS[type]; return `<svg class="cfx cfx--${type}${cls ? ' ' + cls : ''}" viewBox="${m.box}"${m.stretch ? ' preserveAspectRatio="none"' : ''} aria-hidden="true" focusable="false"></svg>`; };

/** Draw the mark into the svg, stroke after stroke (or at once: animate false). */
export function mark(svg, type, animate = true) {
	if (!svg) return;
	const m = MARKS[type];
	unmark(svg);
	m.d.forEach((d, i) => {
		const p = document.createElementNS(NS, 'path');
		p.setAttribute('d', d);
		svg.appendChild(p);
		const len = p.getTotalLength();
		if (!animate || still()) return;
		p.style.strokeDasharray = `${len} ${len}`;
		p.style.strokeDashoffset = i === 0 ? Math.floor(len) - 1 : len;
		p.getBoundingClientRect();
		p.style.transition = `stroke-dashoffset ${m.speed}s ${m.ease} ${i * m.speed}s`;
		p.style.strokeDashoffset = '0';
	});
}
/** Rub the mark out. */
export function unmark(svg) { if (svg) for (const p of [...svg.querySelectorAll('path')]) p.remove(); }
