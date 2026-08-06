# Koyal Event Player

Static event page: the right-hand player continuously rotates through the three
shared base films. A guest can enter their registration email to open their
personalized film separately; lookup never replaces the shared reel. Native
video controls remain available so viewers can pause, seek, adjust volume, or
enter fullscreen.

## Configure the base-film reel

Set `loopVideos` in `config.js` to the longer base masters. They play in order
and repeat after the last film:

```js
loopVideos: [
  { label: "Space", url: "https://.../space-long.mp4" },
  { label: "Titanic", url: "https://.../titanic-long.mp4" },
  { label: "Bollywood", url: "https://.../bollywood-long.mp4" },
]
```

The configured order is Space, Titanic, then Bollywood, repeating after the
last film.

## Update the experience index

No emails are published. The build script normalizes and hashes each email before
writing the browser manifest.

```bash
python scripts/build-manifest.py anteros-bulk.csv
```

When Titanic fallbacks or Bollywood videos are ready, pass the newer CSV last so
its approved URL wins:

```bash
python scripts/build-manifest.py anteros-bulk.csv titanic-fallbacks.csv bollywood.csv
```

Then commit and push `data/experiences.json`. GitHub Pages updates automatically.

URL priority per row: `approved_video_url`, then `narrated_url`, then
`final_video_url`.

## Prepare for an event without Wi-Fi

Run this once while online:

```bash
python3 scripts/prepare-offline.py
python3 -m http.server 8080 --directory offline-player
```

Then open `http://localhost:8080`. The page, idle loop, and participant films
will all play from the laptop. Leave the terminal window open during the event.
