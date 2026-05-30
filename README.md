# thetechgeekko.github.io

Personal site for [Akshay Sharma](https://github.com/thetechgeekko) — engineer working on color science, computational photography, and Android camera apps (SpectraFilm, Filmcam).

Live: https://thetechgeekko.github.io

## Stack

Plain HTML + CSS + vanilla JS. No build step, no framework, no Node — GitHub Pages serves the files as-is.

```
.
├── index.html              one-page site
├── 404.html                custom 404
├── favicon.svg
├── assets/
│   ├── style.css           dark mono + bento + grain
│   ├── script.js           cursor, theme, counter, easter egg
│   └── games.js            reflex · snake · film-stock memory
└── README.md
```

## Features

- **Bento-grid** project showcase
- **Three canvas mini-games** — Shutter Reflex, Snake, Film Stock Match
- **Custom cursor** with state changes (link / zoom / open)
- **Dark / light theme toggle**, persisted to `localStorage`
- **CSS grain overlay** for tactile depth
- **Hero word-reveal** animation
- **Marquee** ticker of tech topics
- **GitHub repo counter** (animates on load)
- **Konami code** easter egg (↑↑↓↓←→←→ B A)
- **Reduced-motion** support
- **Responsive** down to small phones
- **Zero JavaScript dependencies**

## Local preview

```bash
# any static server works
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000

## Deploy

Push to `main` — GitHub Pages serves automatically.

## Credits

Built by hand. Type: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) + [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif).
