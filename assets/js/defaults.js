/* What each shared list starts as before anything was saved (the phones and tools/import.mjs both start from this). */

/* Ideas to start from — edit, remove or add your own on the page. */
const DEFAULTS = {
	outfit: [['ليلة بيجامات', 'Pyjama night'], ['ستايل التسعينات', '90s retro'], ['أبيض في أبيض', 'All white'], ['أحمر وأسود', 'Red & black'], ['زمن الفن الجميل', 'Golden-age Egyptian cinema'], ['لبس متطابق', 'Matching outfits'], ['شخصية من فيلم', 'A movie character'], ['سهرة شيك', 'Black tie at home']],
	dining: [['مكان جديد عمرنا ما رحناه', 'Somewhere we’ve never been'], ['ستاربكس بتاعنا', 'Our Starbucks'], ['سمك وسي فود', 'Fish & seafood'], ['سوشي', 'Sushi'], ['مشويات', 'Grills'], ['إيطالي', 'Italian'], ['فطار برا', 'Breakfast out']],
	delivery: [['بيتزا', 'Pizza'], ['برجر', 'Burgers'], ['كشري', 'Koshary'], ['شاورما', 'Shawarma'], ['فطير مشلتت', 'Feteer'], ['سوشي', 'Sushi'], ['حلويات بس', 'Only desserts']],
	movie: [['كوميدي', 'A comedy'], ['فيلم عربي قديم', 'An old Arabic film'], ['رومانسي', 'Romance'], ['أنيميشن مع الولاد', 'Animated, with the boys'], ['إثارة', 'A thriller'], ['فيلم اتفرجنا عليه زمان', 'One we saw years ago'], ['اختيار إسراء', 'Esraa’s pick'], ['اختيار سامح', 'Sameh’s pick']],
	game: [['كوتشينة', 'Cards'], ['دومينو', 'Dominoes'], ['طاولة', 'Backgammon'], ['أونو', 'UNO'], ['بنك الحظ', 'Monopoly'], ['شطرنج', 'Chess'], ['بلايستيشن', 'PlayStation'], ['أسئلة وحكايات', 'Questions & stories']],
	sweet: [['كنافة', 'Kunafa'], ['بسبوسة', 'Basbousa'], ['أم علي', 'Om Ali'], ['آيس كريم', 'Ice cream'], ['وافل', 'Waffles'], ['كريب نوتيلا', 'Nutella crêpes'], ['كيكة نعملها سوا', 'A cake we bake together'], ['رز بلبن', 'Rice pudding']],
	outing: [['النادي', 'The club'], ['كورنيش النيل', 'The Nile corniche'], ['مركب في النيل', 'A boat on the Nile'], ['جنينة الحيوانات', 'The zoo'], ['الملاهي', 'An amusement park'], ['مول وسينما', 'A mall and a film'], ['يوم في إسكندرية', 'A day in Alexandria'], ['مكان جديد', 'Somewhere new']],
	kids: [['رسم وتلوين', 'Drawing & colouring'], ['صلصال', 'Play-Doh'], ['بازل', 'A puzzle'], ['بيت من الكراتين', 'A cardboard house'], ['نعمل بسكوت سوا', 'Bake cookies together'], ['خيمة في الصالة', 'A tent in the living room'], ['كورة في النادي', 'Football at the club'], ['حكاية قبل النوم', 'A bedtime story']]
};
const drawInit = () => ({
	lists: Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, v.map(([ar, en], n) => ({ id: `d-${k}-${n}`, text: { ar, en } }))])),
	history: []
});
/* An example restaurant, so the food page shows how a menu reads — a made-up place; remove it on the page any time. */
const D = (id, ar, en, price, dar, den, fav) => ({ id, name: { ar, en }, price, desc: dar ? { ar: dar, en: den } : undefined, fav });
const foodInit = () => ({
	items: [{
		id: 'f-example', icon: 'dinner', color: '#c2185b',
		name: { ar: 'مطبخ تيتا', en: 'Teta’s Kitchen' },
		tagline: { ar: 'أكل بيتي زي زمان', en: 'Home cooking, the way it used to be' },
		cuisine: { ar: 'أكل مصري', en: 'Egyptian' },
		area: { ar: 'مثال — ممكن يتغيّر أو يتمسح', en: 'An example — change it or remove it' },
		order: { ar: 'ملوخية بالفراخ وطاجن بامية ومحشي مشكل، وأم علي في الآخر', en: 'Molokhia with chicken, an okra tagine, mixed mahshi, and Om Ali to finish' },
		sections: [
			{ id: 's1', title: { ar: 'مقبلات', en: 'Starters' }, dishes: [
				D('d1', 'طحينة وبابا غنوج', 'Tahini & baba ghanoush', 45, 'مع عيش بلدي سخن', 'With warm baladi bread', 'both'),
				D('d2', 'سلطة بلدي', 'Baladi salad', 35, 'طماطم وخيار وبصل وليمون', 'Tomato, cucumber, onion and lemon'),
				D('d3', 'بطاطس محمرة', 'Fried potatoes', 40, 'مقرمشة بالكمون', 'Crispy, with cumin', 'him'),
				D('d4', 'شوربة لسان عصفور', 'Orzo soup', 50, 'بمرقة الفراخ', 'In chicken broth')
			] },
			{ id: 's2', title: { ar: 'طواجن ومحاشي', en: 'Tagines & mahshi' }, dishes: [
				D('d5', 'محشي مشكل', 'Mixed mahshi', 110, 'كرنب وورق عنب وكوسة وفلفل', 'Cabbage, vine leaves, courgette and peppers', 'her'),
				D('d6', 'طاجن بامية باللحمة', 'Okra tagine with beef', 160, 'في الفرن في طاجن فخار', 'Baked in a clay pot'),
				D('d7', 'مكرونة بشاميل', 'Macaroni béchamel', 120, 'باللحمة المفرومة', 'With minced beef', 'both')
			] },
			{ id: 's3', title: { ar: 'أطباق رئيسية', en: 'Mains' }, dishes: [
				D('d8', 'ملوخية بالفراخ', 'Molokhia with chicken', 150, 'نص فرخة مشوية ورز بالشعرية', 'Half a roast chicken and vermicelli rice', 'both'),
				D('d9', 'كفتة على الفحم', 'Charcoal kofta', 180, 'ربع كيلو مع طحينة وعيش', 'A quarter kilo, with tahini and bread', 'him'),
				D('d10', 'سمك بوري مشوي', 'Grilled mullet', 210, 'بالردة والليمون', 'Bran-crusted, with lemon')
			] },
			{ id: 's4', title: { ar: 'حلو', en: 'Dessert' }, dishes: [
				D('d11', 'أم علي', 'Om Ali', 70, 'بالمكسرات والقشطة', 'With nuts and cream', 'her'),
				D('d12', 'رز بلبن', 'Rice pudding', 45, 'في الفرن بالقرفة', 'Baked, with cinnamon')
			] }
		]
	}]
});
export const INIT = {
	draw: drawInit,
	food: foodInit
};
export const initOf = (kind) => (INIT[kind] ? INIT[kind]() : { items: [] });
