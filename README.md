# حكاية حبنا — Our Love Story ♥

Our private app for the two of us: our love story, and a place to keep recording our life together.
Questions only she can answer → loader → intro → the site. Installable as an app (PWA), works offline.

## Pages
| Page | What's on it |
| --- | --- |
| `index.html` | Home: what's new with us (the latest things either of us added), what's coming up (birthdays, anniversary), quick buttons to add to today, us in numbers |
| `story.html` → `moment.html?id=…` | The timeline, by year; each date has its own page |
| `chapters.html` → `chapter.html?id=…` | Big days: proposal, wedding, Fahd, Abdulrahman — long text + photos |
| `places.html` | Our places (photo cards that tilt with the mouse) |
| `gallery.html` | Photo album, filterable by album |
| `notes.html` · `letters.html` | Handwritten love notes · letters in envelopes she opens |
| `family.html` → `member.html?id=…` | The family newspaper; one page per person with age and next birthday |
| `birthday.html` · `wishes.html` | Everyone's birthdays with countdowns and a cake to blow out · our shared wish jar |
| `journal.html` | **Our journal** — you both write pages from your phones (mood, sketch, optionally pinned to the timeline) |
| `music.html` | **Our songs** on a record player (after Codrops' Interactive Record Player): songs are sleeves on a shelf; tap one and its vinyl goes on the turntable, the tonearm drops and it plays from its YouTube/Spotify link over a soft needle crackle |
| `draw.html?k=outfit\|dining\|delivery\|movie` | **Tonight's draw** — a wheel picks from your list, you log the night (note, hearts, sketch), and recent picks are skipped |
| `trips.html` → `trip.html?id=…` | **Anniversary trips** — the map of Egypt's 27 governorates, coloured where your anniversaries took you, with year pins; a draw for next year's governorate; every trip hangs as a polaroid on strings of lights, and each trip has its own photos, notes and sketches |
| `movies.html` | **What we've watched** — a binge-stats board: one coloured block per film or series, with your totals. Under it, **نتفرج على إيه بعد كده؟ / Up next**: the watchlist (`towatch` in `private/live/movies.json`, posters in `private/media/covers/towatch-*.jpg`), filterable by kind, a dice to pick tonight's, and a «اتفرجنا عليه» tick that moves a film up onto the board |
| `search.html` | **دوّر / Search** — one search over the pages, the story and every list from the phones (the 🔍 in the header, or press `/` or Ctrl+K). Arabic letter forms and tashkeel don't matter; results come grouped by page and open scrolled to the right card. It all runs on the phone after unlocking. «أوضتنا», the gift ideas and the time-capsule letters are left out, and letters are searched by title only |
| `settings.html` | Whose phone this is, and sending what's new on it to the other phone or the PC |

## Writing from your phones
No accounts and no tokens. The journal, songs, draws, trips, films and wishes are plain JSON files on this PC,
in `private/live/<kind>.json` (sketches and photos in `private/live/s/`). The build encrypts them into `content/live/`
with the same key as the story, so the site can show them and GitHub only ever holds unreadable data.

On a phone:
1. **الإعدادات / Settings** → pick whose phone it is (once).
2. Write as usual. It's saved on that phone straight away (only the changes) and shows on every page, even offline.
3. **ابعتوا اللي جديد / Send what's new** makes one encrypted `us-<who>-<date>.json` file with everything new on the phone.
   - To the other phone: open Settings there → **ضيفوا ملف من التاني / Add a file** — it sees it all at once.
   - To the site: save the file on this PC, then

```bash
node tools/import.mjs us-esraa-20261109-2130.json
```

```bash
node tools/build.mjs
```

   and push. Once the site has a change, each phone drops its own copy of it by itself.

Changes merge by id: two phones adding at the same time never overwrite each other, and importing the same file twice
changes nothing. You can also edit `private/live/*.json` by hand (`node tools/add-songs.mjs "Song — Artist"` adds songs).
**Never replace `private/.master-key`** — the phones' files and the site are encrypted with it.

Every page shares the header (mega menus on desktop, a “الفهرس” contents menu on phones), the footer,
and the language switch. The code: `assets/js/shell.js` (shared), `assets/js/pages/<page>.js` (one per page).

Each page's `<head>` (title, description, link-preview tags, stylesheets, script preloads) is written by one tool,
so they stay alike. After adding a page (an entry in `PAGES` in `shell.js`, a `<page>.html` with
`<body data-page="<page>">`, and `assets/js/pages/<page>.js`) or changing what a page imports, run

```bash
node tools/heads.mjs
```

## How it stays private
Everything readable lives in `private/` (git-ignored). `node tools/build.mjs` encrypts it into `content/`
with AES-256; only the right answers unlock the key. So the repo and site can be **public**.
After she unlocks once, her phone remembers (footer: **اقفلي 🔒** to lock again).

## Editing
| File | What it is |
| --- | --- |
| `private/questions.json` | Questions + hints (`{ "ar": …, "en": … }`), and every accepted answer. Case, spaces, punctuation, Arabic letter forms and Arabic digits are ignored, so `١٣/٠٧/٢٠٠٩` = `13.07.2009`. |
| `private/story.json` | All the content. Any text can be a plain string or `{ "ar": "…", "en": "…" }`. |
| `private/media/` | Photos/videos. Refer to them by file name in `story.json` (`"photo": "wedding.jpg"`). |
| `private/media/images/`, `videos/`, `songs/`, `gifts/` | **Just drop files in.** Albums, places, songs and gifts show up on the site by themselves at the next build: see `private/media/README.md` (read by `tools/library.mjs`). |
| `private/.master-key` | Created on first build. **Keep it** — if it changes, she has to answer again. |

Useful fields in `story.json`: `timeline[].photos`, `timeline[].story` (long text for its page),
`chapters[].photos` (`[{ "photo": "x.jpg", "caption": {…} }]`), `gallery[].album`, `gallery[].who: ["fahd"]`
(shows on that person's page), `family.members[].photo`, `family.members[].born` (birth dates — add yours and Esraa's so your birthdays show too), `letters[]`.

Then:

```bash
node tools/build.mjs
```

Starting fresh? Copy `tools/example/*.json` into `private/`.
Tips: shrink photos to ~1600px wide; keep videos short; make at least one answer something nobody could guess.

## Testing
```bash
node tools/serve.mjs
```
Open http://localhost:5174 (add `?intro` to replay the intro).

## Publishing (GitHub Pages)
Commit everything except `private/` (already ignored), push, enable Pages on `main`.
Back up `private/` — it's the only readable copy of the story.

## Credits
- Record player idea: [Codrops — Interactive Record Player](https://tympanus.net/codrops/?p=27200). Needle crackle: Vinyl Noise SFX by Chia (99Sounds), free to use.
- Intro night scene and star dust: [The programmer's romantic](https://codepen.io/CCG/pen/aZpVVv) by CCG.
