"""
GolfMaps App Icon Generator — 1024x1024 PNG
Cartographic Reverence: deep green, gold accent, topographic contour lines
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

FONTS_DIR = os.path.expanduser("~/.claude/plugins/cache/anthropic-agent-skills/document-skills/7029232b9212/skills/canvas-design/canvas-fonts")
OUT = os.path.join(os.path.dirname(__file__), "icon_1024.png")

SIZE = 1024
# Brand palette
BG_GREEN = (26, 62, 35)       # #1A3E23 deep forest
MID_GREEN = (30, 92, 42)      # #1e5c2a
GOLD = (212, 168, 75)         # #D4A84B
LIGHT_GREEN = (45, 110, 58)
CREAM = (245, 240, 228)

img = Image.new("RGB", (SIZE, SIZE), BG_GREEN)
draw = ImageDraw.Draw(img)

# --- Topographic contour rings (centered slightly above middle) ---
cx, cy = 512, 480
for i, radius in enumerate(range(60, 520, 32)):
    opacity_factor = 1.0 - (i / 16.0) * 0.6
    r = int(MID_GREEN[0] + (LIGHT_GREEN[0] - MID_GREEN[0]) * (i % 3) / 3)
    g = int(MID_GREEN[1] + (LIGHT_GREEN[1] - MID_GREEN[1]) * (i % 3) / 3)
    b = int(MID_GREEN[2] + (LIGHT_GREEN[2] - MID_GREEN[2]) * (i % 3) / 3)

    # Organic contour — slightly offset ellipses
    offset_x = int(math.sin(i * 0.7) * 15)
    offset_y = int(math.cos(i * 0.9) * 10)

    line_color = (r, g, b)
    bbox = [cx - radius + offset_x, cy - radius + offset_y,
            cx + radius + offset_x, cy + radius + offset_y]
    draw.ellipse(bbox, outline=line_color, width=2)

# --- Gold flagstick pin (center focal point) ---
# Flag pole
pole_x = 512
pole_top = 280
pole_bottom = 580
draw.line([(pole_x, pole_top), (pole_x, pole_bottom)], fill=GOLD, width=4)

# Flag triangle
flag_points = [(pole_x, pole_top), (pole_x + 65, pole_top + 30), (pole_x, pole_top + 60)]
draw.polygon(flag_points, fill=GOLD)

# Small circle at base (hole)
draw.ellipse([pole_x - 16, pole_bottom - 8, pole_x + 16, pole_bottom + 8], fill=GOLD)

# --- "GOLFMAPS" text at bottom ---
try:
    font_title = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Bold.ttf"), 72)
    font_sub = ImageFont.truetype(os.path.join(FONTS_DIR, "InstrumentSans-Regular.ttf"), 32)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Title
text = "GOLFMAPS"
bbox_text = draw.textbbox((0, 0), text, font=font_title)
tw = bbox_text[2] - bbox_text[0]
draw.text(((SIZE - tw) / 2, 720), text, fill=CREAM, font=font_title)

# Thin gold rule
draw.line([(312, 810), (712, 810)], fill=GOLD, width=2)

# Subtitle
sub = "COURSE CARTOGRAPHY"
bbox_sub = draw.textbbox((0, 0), sub, font=font_sub)
sw = bbox_sub[2] - bbox_sub[0]
draw.text(((SIZE - sw) / 2, 830), sub, fill=GOLD, font=font_sub)

# --- Subtle corner marks (cartographic reference) ---
mark_len = 60
mark_margin = 80
mark_color = (45, 90, 50)
# Top-left
draw.line([(mark_margin, mark_margin), (mark_margin + mark_len, mark_margin)], fill=mark_color, width=2)
draw.line([(mark_margin, mark_margin), (mark_margin, mark_margin + mark_len)], fill=mark_color, width=2)
# Top-right
draw.line([(SIZE - mark_margin, mark_margin), (SIZE - mark_margin - mark_len, mark_margin)], fill=mark_color, width=2)
draw.line([(SIZE - mark_margin, mark_margin), (SIZE - mark_margin, mark_margin + mark_len)], fill=mark_color, width=2)
# Bottom-left
draw.line([(mark_margin, SIZE - mark_margin), (mark_margin + mark_len, SIZE - mark_margin)], fill=mark_color, width=2)
draw.line([(mark_margin, SIZE - mark_margin), (mark_margin, SIZE - mark_margin - mark_len)], fill=mark_color, width=2)
# Bottom-right
draw.line([(SIZE - mark_margin, SIZE - mark_margin), (SIZE - mark_margin - mark_len, SIZE - mark_margin)], fill=mark_color, width=2)
draw.line([(SIZE - mark_margin, SIZE - mark_margin), (SIZE - mark_margin, SIZE - mark_margin - mark_len)], fill=mark_color, width=2)

img.save(OUT, "PNG")
print(f"Icon saved: {OUT}")
