#!/usr/bin/env python3
import csv
import hashlib
import json
import sys
from pathlib import Path


def selected_url(row):
    return (
        row.get("approved_video_url", "").strip()
        or row.get("narrated_url", "").strip()
        or row.get("final_video_url", "").strip()
    )


def main():
    if len(sys.argv) < 2:
        raise SystemExit(
            "usage: python scripts/build-manifest.py INDEX.csv [FALLBACKS.csv ...]"
        )

    output = {}
    for source in map(Path, sys.argv[1:]):
        with source.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                email = row.get("email", "").strip().lower()
                url = selected_url(row)
                status = row.get("status", "").strip().lower()
                if not email or not url or status not in {"completed", "approved"}:
                    continue
                key = hashlib.sha256(email.encode()).hexdigest()
                experience = (
                    row.get("fallback_experience")
                    or row.get("experience")
                    or "Anteros"
                )
                output[key] = {"experience": experience, "url": url}

    destination = Path(__file__).resolve().parents[1] / "data" / "experiences.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
    print(f"Wrote {len(output)} experiences to {destination}")


if __name__ == "__main__":
    main()
