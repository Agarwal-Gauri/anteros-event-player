#!/usr/bin/env python3
import json
import re
import shutil
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "offline-player"
STATIC_FILES = ("index.html", "styles.css", "app.js", ".nojekyll")


def download(url, destination):
    if destination.exists() and destination.stat().st_size:
        print(f"Already downloaded: {destination.name}")
        return
    temporary = destination.with_suffix(destination.suffix + ".part")
    print(f"Downloading: {destination.name}")
    with urllib.request.urlopen(url) as response, temporary.open("wb") as output:
        shutil.copyfileobj(response, output)
    temporary.replace(destination)


def main():
    videos = DESTINATION / "videos"
    data = DESTINATION / "data"
    videos.mkdir(parents=True, exist_ok=True)
    data.mkdir(parents=True, exist_ok=True)

    for name in STATIC_FILES:
        shutil.copy2(ROOT / name, DESTINATION / name)

    source_manifest = json.loads((ROOT / "data" / "experiences.json").read_text())
    local_manifest = {}
    downloads = []
    for digest, experience in source_manifest.items():
        source_url = experience["url"]
        suffix = Path(urlparse(source_url).path).suffix or ".mp4"
        filename = f"{digest[:16]}{suffix}"
        downloads.append((source_url, videos / filename))
        local_manifest[digest] = {
            **experience,
            "url": f"./videos/{filename}",
        }

    config_text = (ROOT / "config.js").read_text()
    match = re.search(r'loopVideo:\s*"([^"]+)"', config_text)
    if not match:
        raise RuntimeError("Could not read loop URL from config.js")
    downloads.append((match.group(1), videos / "anteros-loop.mp4"))

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda item: download(*item), downloads))

    (data / "experiences.json").write_text(
        json.dumps(local_manifest, indent=2, sort_keys=True) + "\n"
    )
    (DESTINATION / "config.js").write_text(
        'window.ANTEROS_CONFIG = { loopVideo: "./videos/anteros-loop.mp4" };\n'
    )
    (DESTINATION / "START_HERE.txt").write_text(
        "ANTEROS OFFLINE EVENT PLAYER\n\n"
        "Mac: double-click start.command, then keep its Terminal window open.\n"
        "If the browser does not open, visit http://localhost:8080.\n\n"
        "All videos are stored in this folder. Wi-Fi is not required.\n"
    )
    start_script = DESTINATION / "start.command"
    start_script.write_text(
        '#!/usr/bin/env bash\n'
        'cd "$(dirname "$0")"\n'
        '(sleep 1; open http://localhost:8080) &\n'
        'python3 -m http.server 8080\n'
    )
    start_script.chmod(0o755)
    print(f"\nOffline player ready at {DESTINATION}")
    print(
        "Start it with: "
        f"python3 -m http.server 8080 --directory {DESTINATION}"
    )


if __name__ == "__main__":
    main()
