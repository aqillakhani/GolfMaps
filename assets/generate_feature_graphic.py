"""
GolfMaps Feature Graphic — 1024x500 PNG (Google Play banner)
Cartographic Reverence: panoramic topographic landscape with branding
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

FONTS_DIR = os.path.expanduser("~/.claude/plugins/cache/anthropic-agent-skills/document-skills/7029232b9212/skills/canvas-design/canvas-fonts")
OUT = os.path.join(os.path.dirname(__file__), "feature_graphic_1024x500.png")

W, H = 1024, 500
BG_GREEN = (26, 62, 35)
MID_GREEN = (30, 92, 42)
LIGHT_GREEN = (45, 110, 58)
GOLD = (212, 168, 75)
CREAM = (245, 240, 228)
DARK = (18, 42, 24)

img = Image.new("RGB", (W, H), BG_GREEN)
draw = ImageDraw.Draw(img)

# --- Rolling contour lines across the full width ---
for i in range(18):
    y_base = 80 + i * 22
    points = []
    green_val = int(MID_GREEN[1] + (i % 4) * 8)
    line_color = (MID_GREEN[0], min(green_val, 130), MID_GREEN[2])

    for x in range(0, W + 1, 4):
        y = y_base + math.sin(x * 0.008 + i * 0.6) * 25 + math.sin(x * 0.003 + i * 1.2) * 40
        points.append((x, int(y)))

    if len(points) > 1:
        draw.line(points, fill=line_color, width=1)

# --- Central branding area with subtle darkened backdrop ---
# Semi-transparent effect via darker rectangle
rect_y1, rect_y2 = 140, 370
for y in range(rect_y1, rect_y2):
    alpha = 0.5
    draw.line([(200, y), (824, y)], fill=DARK)

# Gold thin border
draw.rectangle([(220, 155), (804, 355)], outline=GOLD, width=1)

# --- Typography ---
try:
    font_title = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Bold.ttf"), 80)
    font_sub = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Regular.ttf"), 24)
    font_tagline = ImageFont.truetype(os.path.join(FONTS_DIR, "Italiana-Regular.ttf"), 28)
except:
    font_title = ImageFont.load_default()
    font_sub = font_title
    font_tagline = font_title

# GOLFMAPS
text = "GOLFMAPS"
bbox = draw.textbbox((0, 0), text, font=font_title)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) / 2, 180), text, fill=CREAM, font=font_title)

# Gold rule
draw.line([(362, 280), (662, 280)], fill=GOLD, width=2)

# Tagline
tagline = "Every Course. Beautifully Mapped."
bbox_t = draw.textbbox((0, 0), tagline, font=font_tagline)
ttw = bbox_t[2] - bbox_t[0]
draw.text(((W - ttw) / 2, 298), tagline, fill=GOLD, font=font_tagline)

# --- Corner registration marks ---
m = 30
ml = 40
mc = (45, 90, 50)
draw.line([(m, m), (m + ml, m)], fill=mc, width=2)
draw.line([(m, m), (m, m + ml)], fill=mc, width=2)
draw.line([(W - m, m), (W - m - ml, m)], fill=mc, width=2)
draw.line([(W - m, m), (W - m, m + ml)], fill=mc, width=2)
draw.line([(m, H - m), (m + ml, H - m)], fill=mc, width=2)
draw.line([(m, H - m), (m, H - m - ml)], fill=mc, width=2)
draw.line([(W - m, H - m), (W - m - ml, H - m)], fill=mc, width=2)
draw.line([(W - m, H - m), (W - m, H - m - ml)], fill=mc, width=2)

# --- Small coordinate labels (cartographic detail) ---
try:
    font_tiny = ImageFont.truetype(os.path.join(FONTS_DIR, "DMMono-Regular.ttf"), 11)
except:
    font_tiny = ImageFont.load_default()

draw.text((45, 45), "33°29'N", fill=mc, font=font_tiny)
draw.text((W - 105, H - 50), "111°55'W", fill=mc, font=font_tiny)

img.save(OUT, "PNG")
print(f"Feature graphic saved: {OUT}")
