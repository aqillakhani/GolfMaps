"""
GolfMaps Screenshot Mockups — 1080x1920 PNG (phone screenshots for store listing)
Creates stylized mockups showing the app's key screens with phone frame.
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

FONTS_DIR = os.path.expanduser("~/.claude/plugins/cache/anthropic-agent-skills/document-skills/7029232b9212/skills/canvas-design/canvas-fonts")
ASSETS_DIR = os.path.dirname(__file__)

W, H = 1080, 1920
BG_GREEN = (26, 62, 35)
MID_GREEN = (30, 92, 42)
LIGHT_GREEN = (58, 130, 70)
GOLD = (212, 168, 75)
CREAM = (245, 240, 228)
DARK = (18, 42, 24)
WHITE = (255, 255, 255)
CARD_BG = (32, 72, 42)

try:
    font_headline = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Bold.ttf"), 64)
    font_sub = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Regular.ttf"), 36)
    font_body = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Regular.ttf"), 28)
    font_label = ImageFont.truetype(os.path.join(FONTS_DIR, "DMMono-Regular.ttf"), 20)
    font_big = ImageFont.truetype(os.path.join(FONTS_DIR, "Italiana-Regular.ttf"), 48)
except:
    font_headline = ImageFont.load_default()
    font_sub = font_headline
    font_body = font_headline
    font_label = font_headline
    font_big = font_headline


def draw_phone_frame(draw, screen_rect, color=CREAM):
    """Draw a minimal phone outline."""
    x1, y1, x2, y2 = screen_rect
    pad = 12
    r = 30
    draw.rounded_rectangle([x1 - pad, y1 - pad * 3, x2 + pad, y2 + pad * 3],
                           radius=r, outline=color, width=3)
    # Notch
    nw = 120
    cx = (x1 + x2) / 2
    draw.rounded_rectangle([cx - nw / 2, y1 - pad * 3 - 1, cx + nw / 2, y1 - pad],
                           radius=10, fill=BG_GREEN, outline=color, width=2)


def draw_contour_bg(draw, w, h, offset=0):
    """Subtle topographic background lines."""
    for i in range(12):
        y_base = 200 + i * 140 + offset
        points = []
        gc = (MID_GREEN[0] + i % 3 * 3, MID_GREEN[1] + i % 3 * 5, MID_GREEN[2] + i % 3 * 2)
        for x in range(0, w + 1, 5):
            y = y_base + math.sin(x * 0.006 + i * 0.8) * 30 + math.cos(x * 0.003) * 20
            points.append((x, int(y)))
        if len(points) > 1:
            draw.line(points, fill=gc, width=1)


# ===== SCREENSHOT 1: Course Search =====
def make_screenshot_search():
    img = Image.new("RGB", (W, H), BG_GREEN)
    draw = ImageDraw.Draw(img)
    draw_contour_bg(draw, W, H)

    # Header text
    draw.text((80, 120), "Find Your Course", fill=CREAM, font=font_headline)
    draw.text((80, 200), "Search 35,000+ golf courses worldwide", fill=GOLD, font=font_sub)

    # Search bar mockup
    draw.rounded_rectangle([80, 320, W - 80, 400], radius=12, fill=CARD_BG, outline=(60, 120, 70), width=2)
    draw.text((110, 340), "Augusta National Golf Club", fill=(180, 180, 170), font=font_body)

    # Search results
    courses = [
        ("Augusta National Golf Club", "Augusta, Georgia, USA"),
        ("Pebble Beach Golf Links", "Pebble Beach, California, USA"),
        ("St Andrews Links - Old Course", "St Andrews, Scotland"),
        ("Pinehurst No. 2", "Pinehurst, North Carolina, USA"),
    ]
    y = 460
    for name, loc in courses:
        draw.rounded_rectangle([80, y, W - 80, y + 130], radius=12, fill=CARD_BG)
        draw.text((120, y + 20), name, fill=CREAM, font=font_body)
        draw.text((120, y + 60), loc, fill=GOLD, font=font_label)
        # Small arrow
        draw.text((W - 140, y + 35), "→", fill=GOLD, font=font_body)
        y += 155

    # Bottom tagline
    draw.line([(340, H - 220), (740, H - 220)], fill=GOLD, width=1)
    t = "GOLFMAPS"
    bb = draw.textbbox((0, 0), t, font=font_big)
    draw.text(((W - bb[2] + bb[0]) / 2, H - 200), t, fill=CREAM, font=font_big)

    img.save(os.path.join(ASSETS_DIR, "screenshot_1_search.png"), "PNG")
    print("Screenshot 1 saved: search")


# ===== SCREENSHOT 2: Course Map / Poster =====
def make_screenshot_poster():
    img = Image.new("RGB", (W, H), BG_GREEN)
    draw = ImageDraw.Draw(img)

    # Header
    draw.text((80, 100), "Your Course,", fill=CREAM, font=font_headline)
    draw.text((80, 175), "Beautifully Mapped", fill=GOLD, font=font_headline)

    # Poster preview area (dark card)
    poster_rect = [120, 320, W - 120, 1320]
    draw.rounded_rectangle(poster_rect, radius=16, fill=DARK)
    draw.rounded_rectangle(poster_rect, radius=16, outline=GOLD, width=1)

    # Inside poster: simulated course layout with contours and holes
    pcx, pcy = 540, 780
    for i, r in enumerate(range(40, 380, 28)):
        ox = int(math.sin(i * 0.8) * 12)
        oy = int(math.cos(i * 0.6) * 8)
        c = (MID_GREEN[0] + i * 2, MID_GREEN[1] + i * 3, MID_GREEN[2] + i)
        draw.ellipse([pcx - r + ox, pcy - r + oy, pcx + r + ox, pcy + r + oy], outline=c, width=1)

    # Simulated fairway paths
    for hole in range(6):
        angle = hole * 1.05 + 0.3
        length = 120 + hole * 25
        sx = pcx + int(math.cos(angle) * 50)
        sy = pcy + int(math.sin(angle) * 50)
        ex = pcx + int(math.cos(angle) * length)
        ey = pcy + int(math.sin(angle) * length)
        draw.line([(sx, sy), (ex, ey)], fill=LIGHT_GREEN, width=3)
        # Green dot at end
        draw.ellipse([ex - 6, ey - 6, ex + 6, ey + 6], fill=GOLD)

    # Course name inside poster
    draw.text((180, 1180), "AUGUSTA NATIONAL", fill=CREAM, font=font_body)
    draw.text((180, 1220), "GOLF CLUB", fill=GOLD, font=font_label)

    # Style selector dots at bottom
    dot_y = 1400
    styles = ["Classic", "Dark", "Blueprint", "Vintage", "Watercolor"]
    dot_x_start = (W - len(styles) * 100) // 2
    for i, s in enumerate(styles):
        x = dot_x_start + i * 100 + 40
        fill = GOLD if i == 0 else CARD_BG
        draw.ellipse([x - 18, dot_y - 18, x + 18, dot_y + 18], fill=fill, outline=GOLD, width=2)
        bb = draw.textbbox((0, 0), s, font=font_label)
        sw = bb[2] - bb[0]
        draw.text((x - sw / 2, dot_y + 28), s, fill=CREAM, font=font_label)

    # CTA
    draw.rounded_rectangle([240, 1550, W - 240, 1630], radius=30, fill=GOLD)
    cta = "Download Poster"
    bb = draw.textbbox((0, 0), cta, font=font_body)
    draw.text(((W - bb[2] + bb[0]) / 2, 1568), cta, fill=DARK, font=font_body)

    # Bottom brand
    draw.line([(340, H - 180), (740, H - 180)], fill=GOLD, width=1)
    t = "GOLFMAPS"
    bb = draw.textbbox((0, 0), t, font=font_big)
    draw.text(((W - bb[2] + bb[0]) / 2, H - 160), t, fill=CREAM, font=font_big)

    img.save(os.path.join(ASSETS_DIR, "screenshot_2_poster.png"), "PNG")
    print("Screenshot 2 saved: poster")


# ===== SCREENSHOT 3: Multiple Styles =====
def make_screenshot_styles():
    img = Image.new("RGB", (W, H), BG_GREEN)
    draw = ImageDraw.Draw(img)
    draw_contour_bg(draw, W, H, offset=-100)

    draw.text((80, 100), "5 Stunning Styles", fill=CREAM, font=font_headline)
    draw.text((80, 180), "Choose the perfect aesthetic", fill=GOLD, font=font_sub)

    # Style cards grid
    style_configs = [
        ("Classic", (245, 240, 228), (30, 92, 42), (26, 62, 35)),
        ("Dark", (40, 40, 40), (180, 200, 180), (100, 140, 100)),
        ("Blueprint", (20, 50, 100), (200, 220, 240), (100, 150, 200)),
        ("Vintage", (225, 210, 185), (120, 80, 50), (160, 120, 70)),
        ("Watercolor", (240, 245, 235), (58, 90, 64), (90, 140, 100)),
    ]

    y = 320
    for i, (name, bg, fg, accent) in enumerate(style_configs):
        row = i // 2
        col = i % 2
        if i == 4:  # Last one centered
            cx = (W - 420) // 2
            cy = y + row * 380
        else:
            cx = 80 + col * 480
            cy = y + row * 380

        card_w, card_h = 420, 340
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=12, fill=bg)

        # Mini course contours inside card
        ccx, ccy = cx + card_w // 2, cy + card_h // 2 - 20
        for j in range(5):
            r = 30 + j * 18
            draw.ellipse([ccx - r, ccy - r, ccx + r, ccy + r], outline=accent, width=1)

        # Mini fairways
        for h in range(3):
            a = h * 2.1 + 0.5
            l = 40 + h * 15
            draw.line([(ccx, ccy), (ccx + int(math.cos(a) * l), ccy + int(math.sin(a) * l))],
                      fill=fg, width=2)

        # Style name
        bb = draw.textbbox((0, 0), name, font=font_body)
        nw = bb[2] - bb[0]
        draw.text((cx + (card_w - nw) / 2, cy + card_h - 50), name, fill=fg, font=font_body)

    # Bottom brand
    draw.line([(340, H - 180), (740, H - 180)], fill=GOLD, width=1)
    t = "GOLFMAPS"
    bb = draw.textbbox((0, 0), t, font=font_big)
    draw.text(((W - bb[2] + bb[0]) / 2, H - 160), t, fill=CREAM, font=font_big)

    img.save(os.path.join(ASSETS_DIR, "screenshot_3_styles.png"), "PNG")
    print("Screenshot 3 saved: styles")


# ===== SCREENSHOT 4: Collections / Journal =====
def make_screenshot_collections():
    img = Image.new("RGB", (W, H), BG_GREEN)
    draw = ImageDraw.Draw(img)
    draw_contour_bg(draw, W, H, offset=50)

    draw.text((80, 100), "Your Golf Journal", fill=CREAM, font=font_headline)
    draw.text((80, 180), "Track courses played & dream list", fill=GOLD, font=font_sub)

    # Stats bar
    stats = [("Played", "12"), ("Dream List", "8"), ("Posters", "5")]
    stat_w = (W - 160) // 3
    for i, (label, val) in enumerate(stats):
        sx = 80 + i * stat_w
        draw.rounded_rectangle([sx, 290, sx + stat_w - 20, 410], radius=12, fill=CARD_BG)
        bb = draw.textbbox((0, 0), val, font=font_headline)
        vw = bb[2] - bb[0]
        draw.text((sx + (stat_w - 20 - vw) / 2, 305), val, fill=GOLD, font=font_headline)
        bb2 = draw.textbbox((0, 0), label, font=font_label)
        lw = bb2[2] - bb2[0]
        draw.text((sx + (stat_w - 20 - lw) / 2, 375), label, fill=CREAM, font=font_label)

    # Recent rounds list
    draw.text((80, 470), "Recent Rounds", fill=CREAM, font=font_sub)
    rounds = [
        ("Pebble Beach Golf Links", "Mar 12, 2026", "78"),
        ("TPC Sawgrass", "Feb 28, 2026", "82"),
        ("Bethpage Black", "Feb 15, 2026", "85"),
        ("Torrey Pines South", "Jan 30, 2026", "80"),
    ]
    y = 540
    for name, date, score in rounds:
        draw.rounded_rectangle([80, y, W - 80, y + 120], radius=12, fill=CARD_BG)
        draw.text((120, y + 15), name, fill=CREAM, font=font_body)
        draw.text((120, y + 55), date, fill=(160, 160, 150), font=font_label)
        # Score badge
        draw.rounded_rectangle([W - 200, y + 25, W - 115, y + 85], radius=8, fill=GOLD)
        bb = draw.textbbox((0, 0), score, font=font_sub)
        sw = bb[2] - bb[0]
        draw.text((W - 200 + (85 - sw) / 2, y + 32), score, fill=DARK, font=font_sub)
        y += 145

    # Bottom brand
    draw.line([(340, H - 180), (740, H - 180)], fill=GOLD, width=1)
    t = "GOLFMAPS"
    bb = draw.textbbox((0, 0), t, font=font_big)
    draw.text(((W - bb[2] + bb[0]) / 2, H - 160), t, fill=CREAM, font=font_big)

    img.save(os.path.join(ASSETS_DIR, "screenshot_4_journal.png"), "PNG")
    print("Screenshot 4 saved: journal")


if __name__ == "__main__":
    make_screenshot_search()
    make_screenshot_poster()
    make_screenshot_styles()
    make_screenshot_collections()
    print("\nAll screenshots generated!")
