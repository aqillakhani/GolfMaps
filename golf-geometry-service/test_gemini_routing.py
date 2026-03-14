import asyncio, json, base64, httpx, os
from dotenv import load_dotenv
load_dotenv()

async def test():
    # Fetch fresh satellite image of Pinehurst
    from services.satellite_fetcher import SatelliteFetcher
    fetcher = SatelliteFetcher()
    img_bytes, bounds, w, h = await fetcher.fetch_course_image(35.1920, -79.4600)

    image_b64 = base64.b64encode(img_bytes).decode()

    # Use a very detailed prompt focused on tracing VISIBLE fairways
    prompt = """Look at this satellite image of Pinehurst No. 2 golf course very carefully.

You can see golf fairways as lighter green strips cutting through darker trees/vegetation.
Each fairway is a distinct strip going from a tee area to a green.

IMPORTANT: The fairways go in MANY DIFFERENT DIRECTIONS (north, south, east, west,
northeast, southwest, etc). Do NOT assume they all go the same way.

For EACH distinct fairway strip you can identify, trace it by providing:
- The tee position (start of the fairway)
- 8-12 center-line points following the VISIBLE fairway shape (including any doglegs/curves)
- The green position (end of the fairway, usually a slightly different colored small area)
- The approximate width of this fairway in pixels

Carefully look at the ENTIRE image (all four corners and center) - there should be
approximately 18 fairways spread across the whole golf course.

Return JSON: {"holes": [{"hole_number": 1, "tee": [x,y], "path": [[x,y],...],
"green": [x,y], "green_radius": 15, "fairway_width": 50, "bunkers": [[x,y]], "water": []}]}

Coordinates in pixels (0-""" + str(w) + """). Return ONLY valid JSON."""

    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    payload = {
        'contents': [{'parts': [
            {'text': prompt},
            {'inlineData': {'mimeType': 'image/png', 'data': image_b64}}
        ]}],
        'generationConfig': {'temperature': 0.1, 'maxOutputTokens': 32768, 'responseMimeType': 'application/json'}
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, params={'key': os.getenv('GEMINI_API_KEY')}, json=payload, timeout=180)
        result = resp.json()
        text = result['candidates'][0]['content']['parts'][0]['text']

    # Try to parse
    try:
        data = json.loads(text)
    except:
        # Try repair
        import re
        text = re.sub(r',\s*([}\]])', r'\1', text)
        data = json.loads(text)

    holes = data.get('holes', [])
    print(f'Traced {len(holes)} holes')

    for h in holes:
        tee = h.get('tee', [0,0])
        green = h.get('green', [0,0])
        path = h.get('path', [])
        # Calculate direction angle
        import math
        dx = green[0] - tee[0]
        dy = green[1] - tee[1]
        angle = math.degrees(math.atan2(-dy, dx))  # negative dy because y increases downward
        length = math.hypot(dx, dy)
        print(f'  Hole {h["hole_number"]:2d}: tee=({tee[0]:4.0f},{tee[1]:4.0f}) green=({green[0]:4.0f},{green[1]:4.0f}) '
              f'dir={angle:6.1f}\u00b0 len={length:5.0f}px fw_width={h.get("fairway_width",0)} '
              f'path_pts={len(path)} bunkers={len(h.get("bunkers",[]))}')

    # Save raw response
    with open('gemini_v2_response.json', 'w') as f:
        json.dump(data, f, indent=2)
    print('Saved gemini_v2_response.json')

asyncio.run(test())
