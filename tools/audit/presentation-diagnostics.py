from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "artifacts" / "presentation-v2-diagnostics"
OUT.mkdir(parents=True, exist_ok=True)

POUCH = [
    ROOT / "public/assets/package/pouch-body.webp",
    ROOT / "public/assets/package/pouch-tear-strip.webp",
    ROOT / "public/assets/package/pouch-star-tab.webp",
]
PHONES = sorted((ROOT / "public/assets/collectibles").glob("flip-phone-*.webp"))

THRESHOLD = 8


def weighted_quantile(values: Iterable[tuple[int, int]], q: float) -> int:
    pairs = list(values)
    total = sum(w for _, w in pairs)
    if total <= 0:
        return 0
    target = total * q
    acc = 0
    for coord, weight in pairs:
        acc += weight
        if acc >= target:
            return coord
    return pairs[-1][0]


def analyze(path: Path) -> dict:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    width, height = image.size
    px = alpha.load()

    xs: list[int] = []
    ys: list[int] = []
    x_weights = [0] * width
    y_weights = [0] * height
    weighted_x = 0
    weighted_y = 0
    alpha_sum = 0
    covered = 0

    for y in range(height):
        for x in range(width):
            a = px[x, y]
            if a <= THRESHOLD:
                continue
            xs.append(x)
            ys.append(y)
            x_weights[x] += a
            y_weights[y] += a
            weighted_x += x * a
            weighted_y += y * a
            alpha_sum += a
            covered += 1

    if not xs:
        raise RuntimeError(f"No meaningful alpha in {path}")

    bbox = [min(xs), min(ys), max(xs) + 1, max(ys) + 1]
    centroid = [weighted_x / alpha_sum, weighted_y / alpha_sum]
    robust_bbox = [
        weighted_quantile(enumerate(x_weights), 0.02),
        weighted_quantile(enumerate(y_weights), 0.02),
        weighted_quantile(enumerate(x_weights), 0.98) + 1,
        weighted_quantile(enumerate(y_weights), 0.98) + 1,
    ]
    robust_center = [
        (robust_bbox[0] + robust_bbox[2]) / 2,
        (robust_bbox[1] + robust_bbox[3]) / 2,
    ]

    return {
        "path": str(path.relative_to(ROOT)),
        "size": [width, height],
        "bbox": bbox,
        "bbox_center": [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
        "robust_bbox_2_98": robust_bbox,
        "robust_center_2_98": robust_center,
        "alpha_centroid": centroid,
        "alpha_coverage": covered / (width * height),
    }


def draw_bbox(draw: ImageDraw.ImageDraw, box: list[int], color: tuple[int, int, int, int], width: int = 4):
    draw.rectangle(tuple(box), outline=color, width=width)


def build_pouch_diagnostic(stats: list[dict]):
    images = [Image.open(ROOT / s["path"]).convert("RGBA") for s in stats]
    canvas_size = images[0].size
    if any(img.size != canvas_size for img in images):
        max_w = max(img.width for img in images)
        max_h = max(img.height for img in images)
        canvas_size = (max_w, max_h)

    composite = Image.new("RGBA", canvas_size, (24, 20, 31, 255))
    for img in images:
        layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        layer.alpha_composite(img, (0, 0))
        composite.alpha_composite(layer)

    draw = ImageDraw.Draw(composite, "RGBA")
    colors = [(255, 80, 120, 255), (80, 220, 255, 255), (255, 210, 70, 255)]
    labels = ["body", "strip", "tab"]
    for s, color, label in zip(stats, colors, labels):
        draw_bbox(draw, s["bbox"], color)
        draw_bbox(draw, s["robust_bbox_2_98"], (*color[:3], 150), 2)
        cx, cy = s["alpha_centroid"]
        draw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=color)
        draw.text((s["bbox"][0] + 8, s["bbox"][1] + 8), label, fill=color)

    display_width = 374
    source_w = canvas_size[0]
    source_h = canvas_size[1]
    scale = display_width / source_w

    def local_to_source(x: float, y: float) -> tuple[float, float]:
        return (x / scale + source_w / 2, (y - 8) / scale + source_h / 2)

    hit_local_x, hit_local_y, hit_size = -126, -126, 140
    hx0, hy0 = local_to_source(hit_local_x - hit_size / 2, hit_local_y - hit_size / 2)
    hx1, hy1 = local_to_source(hit_local_x + hit_size / 2, hit_local_y + hit_size / 2)
    draw.rectangle((hx0, hy0, hx1, hy1), outline=(80, 255, 120, 255), width=4)
    draw.text((hx0 + 6, hy0 + 6), "current hitbox", fill=(80, 255, 120, 255))

    sx0, sy = local_to_source(-126, -112)
    sx1, _ = local_to_source(-126 + 263, -112)
    draw.line((sx0, sy, sx1, sy), fill=(255, 255, 255, 255), width=5)
    draw.ellipse((sx0 - 8, sy - 8, sx0 + 8, sy + 8), fill=(255, 255, 255, 255))
    draw.ellipse((sx1 - 8, sy - 8, sx1 + 8, sy + 8), fill=(255, 255, 255, 255))
    draw.text((sx0, sy + 12), "current tear travel", fill=(255, 255, 255, 255))

    composite.save(OUT / "pouch-diagnostic.png")


def build_pouch_layers_montage(stats: list[dict]):
    labels = ["BODY", "TEAR STRIP", "STAR TAB"]
    tiles: list[Image.Image] = []
    for s, label in zip(stats, labels):
        image = Image.open(ROOT / s["path"]).convert("RGBA")
        bg = Image.new("RGBA", image.size, (28, 24, 36, 255))
        bg.alpha_composite(image)
        draw = ImageDraw.Draw(bg, "RGBA")
        draw_bbox(draw, s["bbox"], (255, 100, 150, 255), 5)
        draw_bbox(draw, s["robust_bbox_2_98"], (80, 220, 255, 220), 3)
        bg.thumbnail((440, 440), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (460, 500), (20, 17, 26, 255))
        tile.alpha_composite(bg, ((460 - bg.width) // 2, 20))
        text = ImageDraw.Draw(tile)
        text.text((16, 462), label, fill=(245, 240, 255, 255))
        text.text((16, 480), str(s["bbox"]), fill=(180, 220, 255, 255))
        tiles.append(tile)

    montage = Image.new("RGBA", (len(tiles) * 460, 500), (16, 14, 20, 255))
    for i, tile in enumerate(tiles):
        montage.alpha_composite(tile, (i * 460, 0))
    montage.save(OUT / "pouch-layers-montage.png")


def build_phone_montage(stats: list[dict]):
    thumbs = []
    for s in stats:
        img = Image.open(ROOT / s["path"]).convert("RGBA")
        bg = Image.new("RGBA", img.size, (30, 25, 38, 255))
        bg.alpha_composite(img)
        draw = ImageDraw.Draw(bg, "RGBA")
        draw_bbox(draw, s["bbox"], (255, 100, 140, 255), 5)
        draw_bbox(draw, s["robust_bbox_2_98"], (80, 220, 255, 220), 3)
        cx, cy = s["alpha_centroid"]
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=(255, 230, 70, 255))
        rcx, rcy = s["robust_center_2_98"]
        draw.line((rcx - 18, rcy, rcx + 18, rcy), fill=(80, 255, 120, 255), width=4)
        draw.line((rcx, rcy - 18, rcx, rcy + 18), fill=(80, 255, 120, 255), width=4)
        bg.thumbnail((360, 360), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (360, 404), (24, 20, 31, 255))
        tile.alpha_composite(bg, ((360 - bg.width) // 2, 0))
        ImageDraw.Draw(tile).text((10, 370), Path(s["path"]).stem, fill=(245, 240, 255, 255))
        thumbs.append(tile)

    cols = 3
    rows = (len(thumbs) + cols - 1) // cols
    montage = Image.new("RGBA", (cols * 360, rows * 404), (20, 17, 26, 255))
    for i, tile in enumerate(thumbs):
        montage.alpha_composite(tile, ((i % cols) * 360, (i // cols) * 404))
    montage.save(OUT / "phone-alpha-montage.png")


def main():
    pouch_stats = [analyze(path) for path in POUCH]
    phone_stats = [analyze(path) for path in PHONES]
    payload = {"pouch": pouch_stats, "phones": phone_stats}
    (OUT / "measurements.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    build_pouch_diagnostic(pouch_stats)
    build_pouch_layers_montage(pouch_stats)
    build_phone_montage(phone_stats)
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
