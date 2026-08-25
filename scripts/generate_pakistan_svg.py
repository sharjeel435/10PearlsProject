"""
Generate a high-precision Pakistan SVG path from Natural Earth GeoJSON.

1. Downloads Natural Earth 1:10m admin-0 countries (Pakistan polygon only).
2. Applies Douglas-Peucker simplification (epsilon tunable).
3. Projects WGS-84 lon/lat → SVG pixel coordinates.
4. Writes the d="..." string ready to paste into PakistanCityMap.tsx.

Run with venv Python:
    .venv\Scripts\python.exe scripts\generate_pakistan_svg.py

Dependencies: only stdlib (urllib, json, math) — no extra packages needed.
"""

import json
import math
import urllib.request
from pathlib import Path

# ── SVG canvas ────────────────────────────────────────────────────────────────
# Pakistan geographic bounding box (Natural Earth confirmed):
LON_MIN, LON_MAX = 60.87, 77.84  # degrees E
LAT_MIN, LAT_MAX = 23.69, 37.10  # degrees N
SVG_W, SVG_H = 200, 300

# ── Simplification ────────────────────────────────────────────────────────────
# Epsilon in geographic degrees. 0.15 → ~150-200 pts (crisp at 200px wide).
# Reduce to 0.08 for more detail (more pts, larger string).
EPSILON = 0.15


def project(lon: float, lat: float) -> tuple[float, float]:
    """WGS-84 → SVG pixel (rounded to 1 decimal)."""
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W
    y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * SVG_H
    return round(x, 1), round(y, 1)


def point_line_distance(p: tuple, a: tuple, b: tuple) -> float:
    """Perpendicular distance from point p to segment a-b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == 0 and dy == 0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def douglas_peucker(points: list, epsilon: float) -> list:
    """Ramer-Douglas-Peucker polyline simplification."""
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = point_line_distance(points[i], points[0], points[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax >= epsilon:
        left  = douglas_peucker(points[:idx + 1], epsilon)
        right = douglas_peucker(points[idx:], epsilon)
        return left[:-1] + right
    return [points[0], points[-1]]


def fetch_pakistan_rings() -> list[list[tuple[float, float]]]:
    """
    Download Natural Earth 1:50m countries GeoJSON and extract Pakistan rings.
    Falls back to 1:110m if the larger file fails.
    """
    sources = [
        # 1:50m — good detail, ~4 MB total, only PAK extracted
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
        # 1:110m — fallback, ~700 KB
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
    ]
    for url in sources:
        try:
            print(f"  Fetching {url.split('/')[-1]} …")
            req = urllib.request.Request(url, headers={"User-Agent": "pearls-aqi-map/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            for feat in data["features"]:
                props = feat.get("properties", {})
                # Natural Earth uses ADM0_A3 or ISO_A3 for the 3-letter code
                if props.get("ADM0_A3") == "PAK" or props.get("ISO_A3") == "PAK":
                    geom = feat["geometry"]
                    if geom["type"] == "Polygon":
                        return [geom["coordinates"][0]]       # one outer ring
                    if geom["type"] == "MultiPolygon":
                        # Return the largest ring (main landmass)
                        rings = [p[0] for p in geom["coordinates"]]
                        return [max(rings, key=len)]
            print("  WARNING: PAK not found in this file, trying next source.")
        except Exception as e:
            print(f"  WARNING: fetch failed ({e}), trying next source.")
    raise RuntimeError("Could not fetch Pakistan GeoJSON from any source.")


def rings_to_svg_path(rings: list, epsilon_deg: float) -> str:
    """Project rings to SVG space, simplify, return SVG path d attribute."""
    all_paths = []
    for ring in rings:
        # Project all points
        projected = [project(lon, lat) for lon, lat in ring]
        # Simplify in SVG-pixel space (epsilon_deg degrees × scale factor ≈ pixels)
        px_per_deg = SVG_W / (LON_MAX - LON_MIN)
        eps_px = epsilon_deg * px_per_deg
        simplified = douglas_peucker(projected, eps_px)
        # Remove duplicate last point (closed ring)
        if simplified[-1] == simplified[0]:
            simplified = simplified[:-1]
        coords = " L ".join(f"{x} {y}" for x, y in simplified)
        all_paths.append(f"M {coords} Z")
    return " ".join(all_paths)


def main():
    import sys
    # Force UTF-8 stdout on Windows to avoid cp1252 errors
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("Generating accurate Pakistan SVG path...\n")

    rings = fetch_pakistan_rings()
    print(f"  Raw vertices in largest ring: {len(rings[0])}")

    path = rings_to_svg_path(rings, EPSILON)

    pt_count = path.count(" L ") + path.count("M ")
    print(f"  Simplified to ~{pt_count} vertices (epsilon={EPSILON} deg)\n")

    # Write to file (UTF-8 safe regardless of terminal)
    out = Path(__file__).parent / "pakistan_svg_path.txt"
    out.write_text(path, encoding="utf-8")
    print(f"Written to: {out}")

    return path


if __name__ == "__main__":
    main()
