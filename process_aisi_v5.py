#!/usr/bin/env python3
"""
Fifth attempt: AISI cyber capabilities chart image processing.

Strategy (based on per-pixel analysis of the original):
  1. White/near-white → transparent
  2. Colored (saturation > 35) → preserve
  3. All other pixels → LIGHT_GREY (visible on dark bg)
  4. M-label removal: scan ORIGINAL image x=0-155 for dark-text bands, erase x=0-155 only
  5. Token label removal: scan ORIGINAL image x=1400+ for dark-unsaturated bands,
     find leftmost dark pixel per band, erase from there to right edge
     (only erase bands: height >= 10, y0 < PLOT_Y_MAX=1075)
"""

from PIL import Image
import colorsys, math

SRC  = 'img/aisi-cyber-capabilities.png'
DEST = 'img/aisi-cyber-capabilities-dark.png'

LIGHT_GREY = (180, 185, 190)
PLOT_Y_MAX = 1075  # bottom of plot area in the image

def brightness(r, g, b):  return 0.299*r + 0.587*g + 0.114*b
def dist_white(r, g, b):  return math.sqrt((255-r)**2+(255-g)**2+(255-b)**2)
def sat_pct(r, g, b):
    _, s, _ = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    return s * 100

def is_dark_text_orig(r, g, b, a):
    """Dark, unsaturated pixel in original = text/label (not chart line, not background)"""
    return a > 0 and sat_pct(r, g, b) < 15 and brightness(r, g, b) < 120

orig = Image.open(SRC).convert('RGBA')
px_orig = orig.load()
W, H = orig.size
print(f"Image: {W}×{H}")

# ── Step 1–3: process pixels ──────────────────────────────────────────────────
out = orig.copy()
px  = out.load()

for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]

        if dist_white(r, g, b) < 40:           # near-white background → transparent
            px[x, y] = (0, 0, 0, 0)
        elif sat_pct(r, g, b) > 35 and brightness(r, g, b) < 230:  # colored → keep
            px[x, y] = (r, g, b, 255)
        else:                                    # dark/grey/medium → light grey
            px[x, y] = (*LIGHT_GREY, 255)

print("Pass 1–3 done")

# ── Helper: detect contiguous text bands in original image ────────────────────
def detect_bands(x_start, x_end, y_start, y_max, min_density, min_height=10):
    """
    Scan rows y_start..y_max in original image, x_start..x_end.
    Return list of (y0, y1) bands where dark-text density > min_density,
    filtered to bands with height >= min_height.
    """
    in_band = False
    band_start = 0
    bands = []

    for y in range(y_start, y_max):
        count = sum(1 for x in range(x_start, x_end)
                    if is_dark_text_orig(*px_orig[x, y][:3], px_orig[x, y][3]))
        if not in_band and count >= min_density:
            in_band = True
            band_start = y
        elif in_band and count < min_density:
            in_band = False
            if y - band_start >= min_height:
                bands.append((band_start, y))
    if in_band and y_max - band_start >= min_height:
        bands.append((band_start, y_max))
    return bands

# ── Step 4: M-label removal (left margin only) ────────────────────────────────
# M-labels like "M:9 Full network takeover" live in x=0-155 (before the y-axis).
# Erase only x=0-155 so horizontal reference lines in the plot are untouched.

M_ERASE_X = 155  # only erase up to this x

m_bands = detect_bands(x_start=0, x_end=M_ERASE_X, y_start=50, y_max=PLOT_Y_MAX,
                        min_density=10, min_height=12)
print(f"M-label bands ({len(m_bands)}): {m_bands}")

for (y0, y1) in m_bands:
    for y in range(y0, y1):
        for x in range(0, M_ERASE_X):
            px[x, y] = (0, 0, 0, 0)

print("Step 4 done (M-labels erased)")

# ── Step 5: Token label removal (right side) ──────────────────────────────────
# All dark-unsaturated pixels at x=1400+ are model annotations (no colored lines there).
# For each band, find the leftmost dark pixel in original and erase from there rightward.

TOKEN_SCAN_X = 1400

tok_bands = detect_bands(x_start=TOKEN_SCAN_X, x_end=W, y_start=200, y_max=PLOT_Y_MAX,
                          min_density=5, min_height=10)
print(f"Token label bands ({len(tok_bands)}): {tok_bands}")

for (y0, y1) in tok_bands:
    # Find leftmost dark-text pixel in original across all rows in the band
    erase_from_x = W
    for y in range(y0, y1):
        for x in range(TOKEN_SCAN_X, W):
            if is_dark_text_orig(*px_orig[x, y][:3], px_orig[x, y][3]):
                if x < erase_from_x:
                    erase_from_x = x
                break

    if erase_from_x < W:
        erase_from_x = max(TOKEN_SCAN_X, erase_from_x - 8)  # small buffer
        for y in range(y0, y1):
            for x in range(erase_from_x, W):
                px[x, y] = (0, 0, 0, 0)
        print(f"  Erased y={y0}–{y1} from x={erase_from_x} to right")

print("Step 5 done (token labels erased)")

out.save(DEST, 'PNG')
print(f"Saved → {DEST}")
