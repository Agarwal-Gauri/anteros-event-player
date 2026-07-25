# Anteros Event Player

Static event kiosk: guests enter their registration email and watch their
personalized film. The idle screen plays the shared Anteros loop.

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
