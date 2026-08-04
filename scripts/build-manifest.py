#!/usr/bin/env python3
import argparse
import csv
import hashlib
import json
from pathlib import Path


def selected_url(row):
    return (
        row.get("approved_video_url", "").strip()
        or row.get("narrated_url", "").strip()
        or row.get("final_video_url", "").strip()
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build the hashed-email Anteros player manifest from result CSVs."
    )
    parser.add_argument(
        "--merge-existing",
        action="store_true",
        help="Preserve entries already present in data/experiences.json.",
    )
    parser.add_argument("sources", nargs="+", type=Path, metavar="CSV")
    return parser.parse_args()


def main():
    args = parse_args()
    destination = Path(__file__).resolve().parents[1] / "data" / "experiences.json"
    output = {}
    if args.merge_existing and destination.exists():
        output = json.loads(destination.read_text(encoding="utf-8"))

    for source in args.sources:
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

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
    print(f"Wrote {len(output)} experiences to {destination}")


if __name__ == "__main__":
    main()
