# Daily Words

Learn 5 English words a day. Keep your streak, earn points, level up, collect badges.
Built for modest Android phones, slow mobile data, and people who read English as a second language.

**Live:** _add your link here after deploying_

## Run it

No install and no build. It is plain HTML, CSS and JavaScript.

```bash
git clone <this repo>
cd <this repo>
python -m http.server 8000      # or: npx serve .
```

Open http://localhost:8000 (on a phone: use your computer's IP address on the same Wi-Fi).

Opening `index.html` directly also works, but the offline mode needs a web server.

## Run the tests

Needs Node 18+ (no packages).

```bash
node test.js
```

## Deploy (free)

Upload the folder to any static host: GitHub Pages, Netlify, Cloudflare Pages, Vercel.
Nothing to configure.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `app.js` | Screens: home, quiz, result, badges. Saves progress on the phone |
| `logic.js` | Game rules: daily questions, streak, points, levels, badges (no screen code) |
| `words.js` | The word bank (60 words). Add a row to add a word |
| `test.js` | Tests for `logic.js` and `words.js` |
| `sw.js`, `manifest.webmanifest` | Offline mode and "Add to home screen" |

Total size is about 30 KB. No libraries, no web fonts, no images.

See [EXPLAINER.md](EXPLAINER.md) for the choices I made and what I left out.
