from __future__ import annotations
import argparse, sys
import requests

def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument("--base-url", required=True); args = parser.parse_args()
    base, failures = args.base_url.rstrip("/"), []
    checks = [("/health", 200), ("/cities", 200), ("/model-info", 200),
              *[(f"/forecast/{city}", 200) for city in ("Karachi", "Lahore", "Islamabad")],
              ("/forecast/InvalidCity", 404)]
    for path, expected in checks:
        try:
            response = requests.get(base + path, timeout=30)
            if response.status_code != expected: failures.append(f"{path}: {response.status_code}, expected {expected}")
            elif path == "/health" and not response.json().get("model_ready"): failures.append("/health: model not ready")
        except requests.RequestException as exc: failures.append(f"{path}: {type(exc).__name__}")
    print("\n".join(failures) if failures else "Backend smoke test: PASS")
    return int(bool(failures))

if __name__ == "__main__": sys.exit(main())
