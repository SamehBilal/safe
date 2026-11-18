/* A plain street map drawn from OpenStreetMap tiles, fitted around some points: used by the distances page and the
   city maps. No library: Web Mercator maths, a grid of <img> tiles, and a function that says where a spot lands. */

export const TILE = 256;
const TILES = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
/* the city posters: Esri's Dark Gray Canvas without its labels layer — streets, water and land only, no key needed —
   which CSS turns into white streets on black, black on white, or cream on charcoal */
const POSTER = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`;

/** "30.0731, 31.3456" (or [lat, lng], or { lat, lng }, or a thing with "at") → { lat, lng }, or null. */
export function where(m) {
	let v = m?.at ?? (m?.lat != null ? [m.lat, m.lng] : m);
	if (typeof v === 'string') v = v.split(/[,\s،]+/).filter(Boolean).map(Number);
	if (v && !Array.isArray(v)) v = [v.lat, v.lng];
	if (!v || v.length < 2 || !isFinite(v[0]) || !isFinite(v[1]) || Math.abs(v[0]) > 85 || Math.abs(v[1]) > 180) return null;
	return { lat: +v[0], lng: +v[1] };
}

/** Web Mercator, in pixels at zoom 0. */
export const world = ({ lat, lng }) => {
	const s = Math.sin((lat * Math.PI) / 180);
	return { x: ((lng + 180) / 360) * TILE, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE };
};

/** Kilometres between two spots, along the ground. */
export function km(a, b) {
	const R = 6371, rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Lay tiles in `el` (position: relative, a size of its own) so every point shows, leaving `pad` pixels around them.
 * Returns { z, at(spot) → { x, y } in the box's pixels, W, H }. With one point (or none) it uses `zoom` around it.
 */
export function fit(el, spots, { pad = 60, padTop = pad, zoom = 13, maxZ = 16, minZ = 3, center = { lat: 30.0444, lng: 31.2357 }, poster = false, detail = 1 } = {}) {
	const TILES_ = poster ? POSTER : TILES;
	const W = el.clientWidth, H = el.clientHeight;
	const pts = spots.filter(Boolean).map(world);
	if (!pts.length) pts.push(world(center));
	const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
	const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
	let z = zoom;
	if (pts.length > 1 && (maxX - minX > 1e-9 || maxY - minY > 1e-9)) {
		const k = Math.min((W - 2 * pad) / Math.max(maxX - minX, 1e-9), (H - pad - padTop) / Math.max(maxY - minY, 1e-9));
		z = Math.floor(Math.log2(Math.max(k, 1e-9)));
	}
	z = Math.max(minZ, Math.min(maxZ, z));
	const k = 2 ** z;
	const cx = ((minX + maxX) / 2) * k, cy = ((minY + maxY) / 2) * k - (padTop - pad) / 2;
	const ox = cx - W / 2, oy = cy - H / 2;
	// a poster asks for the next zoom's tiles and draws them at half size: the same ground, twice the streets, finer lines
	const d = poster ? Math.max(0, Math.min(detail, 18 - z)) : 0, zt = z + d, T = TILE / 2 ** d;
	const n = 2 ** zt, x0 = Math.floor(ox / T), y0 = Math.floor(oy / T), x1 = Math.floor((ox + W) / T), y1 = Math.floor((oy + H) / T);
	let html = '';
	for (let ty = Math.max(0, y0); ty <= Math.min(n - 1, y1); ty++) {
		for (let tx = x0; tx <= x1; tx++) {
			const wx = ((tx % n) + n) % n;
			html += `<img src="${TILES_(zt, wx, ty)}" alt="" width="${T}" height="${T}" draggable="false" referrerpolicy="origin" style="left:${(tx * T - ox).toFixed(1)}px;top:${(ty * T - oy).toFixed(1)}px;width:${T}px;height:${T}px" onerror="this.remove()">`;
		}
	}
	el.innerHTML = html;
	return { z, W, H, at: (s) => { const p = world(s); return { x: p.x * k - ox, y: p.y * k - oy }; } };
}

/** Each governorate's capital (or where we'd go there), to name a city and to centre its map. */
export const CAPITALS = {
	'EG.QH': [30.0444, 31.2357], 'EG.JZ': [30.0131, 31.2089], 'EG.IK': [31.2001, 29.9187], 'EG.QL': [30.466, 31.1858],
	'EG.IS': [30.5965, 32.2715], 'EG.SW': [29.9668, 32.5498], 'EG.BS': [31.2653, 32.3019], 'EG.DT': [31.4175, 31.8144],
	'EG.DQ': [31.0409, 31.3785], 'EG.SQ': [30.5877, 31.502], 'EG.GH': [30.7865, 31.0004], 'EG.MF': [30.5503, 31.0106],
	'EG.KS': [31.1107, 30.9388], 'EG.BH': [31.0341, 30.4682], 'EG.MT': [31.3543, 27.2373], 'EG.FY': [29.3084, 30.8428],
	'EG.BN': [29.0661, 31.0994], 'EG.MN': [28.1099, 30.7503], 'EG.AT': [27.1783, 31.1859], 'EG.SJ': [26.5591, 31.6957],
	'EG.QN': [26.1551, 32.716], 'EG.UQ': [25.6872, 32.6396], 'EG.AN': [24.0889, 32.8998], 'EG.WJ': [25.439, 30.5586],
	'EG.BA': [27.2579, 33.8116], 'EG.JS': [27.9158, 34.33], 'EG.SS': [31.1316, 33.7984]
};

/** The governorate whose capital is nearest a spot. */
export function nearestGov(spot) {
	let best = '', d = Infinity;
	for (const [id, [lat, lng]] of Object.entries(CAPITALS)) {
		const k = km(spot, { lat, lng });
		if (k < d) { d = k; best = id; }
	}
	return best;
}

/** Ask the phone where it is: resolves { lat, lng, acc } or rejects with a reason the page can show. */
export function here() {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) return reject(new Error('none'));
		navigator.geolocation.getCurrentPosition(
			(p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy) }),
			(e) => reject(new Error(e.code === 1 ? 'denied' : 'failed')),
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
		);
	});
}
