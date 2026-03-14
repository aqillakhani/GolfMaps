"""Generate static course data files from known GPS coordinates.

Run this script when BlueGolf is accessible to populate the data/ directory,
OR run it without BlueGolf to generate approximate data from known coordinates.
"""

import asyncio
import json
import math
import os
import random

# Real GPS coordinates for famous courses (center of course)
# Source: OpenStreetMap / public geographic data
COURSES = {
    "pinehurst2": {
        "name": "Pinehurst No. 2",
        "lat": 35.1920, "lon": -79.4600,
        "city": "Pinehurst", "state": "NC",
        "holes": [
            {"par": 4, "distance": 403, "bearing": 30},
            {"par": 4, "distance": 500, "bearing": 60},
            {"par": 4, "distance": 387, "bearing": 110},
            {"par": 5, "distance": 565, "bearing": 170},
            {"par": 5, "distance": 588, "bearing": 240},
            {"par": 3, "distance": 222, "bearing": 320},
            {"par": 4, "distance": 436, "bearing": 200},
            {"par": 3, "distance": 175, "bearing": 160},
            {"par": 3, "distance": 189, "bearing": 10},
            {"par": 5, "distance": 612, "bearing": 290},
            {"par": 4, "distance": 478, "bearing": 200},
            {"par": 4, "distance": 423, "bearing": 120},
            {"par": 4, "distance": 389, "bearing": 40},
            {"par": 4, "distance": 495, "bearing": 310},
            {"par": 3, "distance": 206, "bearing": 180},
            {"par": 5, "distance": 531, "bearing": 70},
            {"par": 3, "distance": 190, "bearing": 260},
            {"par": 4, "distance": 445, "bearing": 170},
        ],
    },
    "pebblebeach": {
        "name": "Pebble Beach Golf Links",
        "lat": 36.5681, "lon": -121.9498,
        "city": "Pebble Beach", "state": "CA",
        "holes": [
            {"par": 4, "distance": 381, "bearing": 230},
            {"par": 5, "distance": 502, "bearing": 310},
            {"par": 4, "distance": 404, "bearing": 280},
            {"par": 4, "distance": 331, "bearing": 210},
            {"par": 3, "distance": 195, "bearing": 300},
            {"par": 5, "distance": 513, "bearing": 200},
            {"par": 3, "distance": 106, "bearing": 250},
            {"par": 4, "distance": 428, "bearing": 170},
            {"par": 4, "distance": 505, "bearing": 80},
            {"par": 4, "distance": 446, "bearing": 120},
            {"par": 4, "distance": 390, "bearing": 60},
            {"par": 3, "distance": 202, "bearing": 340},
            {"par": 4, "distance": 445, "bearing": 20},
            {"par": 5, "distance": 580, "bearing": 130},
            {"par": 4, "distance": 397, "bearing": 200},
            {"par": 4, "distance": 403, "bearing": 280},
            {"par": 3, "distance": 178, "bearing": 170},
            {"par": 5, "distance": 543, "bearing": 60},
        ],
    },
    "augustanationalgc": {
        "name": "Augusta National",
        "lat": 33.5032, "lon": -82.0225,
        "city": "Augusta", "state": "GA",
        "holes": [
            {"par": 4, "distance": 445, "bearing": 200},
            {"par": 5, "distance": 575, "bearing": 240},
            {"par": 4, "distance": 350, "bearing": 180},
            {"par": 3, "distance": 240, "bearing": 130},
            {"par": 4, "distance": 495, "bearing": 190},
            {"par": 3, "distance": 180, "bearing": 270},
            {"par": 4, "distance": 450, "bearing": 350},
            {"par": 5, "distance": 570, "bearing": 20},
            {"par": 4, "distance": 460, "bearing": 330},
            {"par": 4, "distance": 495, "bearing": 180},
            {"par": 4, "distance": 520, "bearing": 210},
            {"par": 3, "distance": 155, "bearing": 280},
            {"par": 5, "distance": 510, "bearing": 10},
            {"par": 4, "distance": 440, "bearing": 350},
            {"par": 5, "distance": 530, "bearing": 190},
            {"par": 3, "distance": 170, "bearing": 160},
            {"par": 4, "distance": 440, "bearing": 30},
            {"par": 4, "distance": 465, "bearing": 80},
        ],
    },
    "tpcsawgrassstadium": {
        "name": "THE PLAYERS Stadium",
        "lat": 30.1975, "lon": -81.3946,
        "city": "Ponte Vedra Beach", "state": "FL",
        "holes": [
            {"par": 4, "distance": 423, "bearing": 340},
            {"par": 5, "distance": 532, "bearing": 20},
            {"par": 3, "distance": 177, "bearing": 290},
            {"par": 4, "distance": 384, "bearing": 200},
            {"par": 4, "distance": 466, "bearing": 160},
            {"par": 4, "distance": 393, "bearing": 250},
            {"par": 4, "distance": 442, "bearing": 330},
            {"par": 3, "distance": 219, "bearing": 100},
            {"par": 5, "distance": 583, "bearing": 180},
            {"par": 4, "distance": 424, "bearing": 40},
            {"par": 5, "distance": 542, "bearing": 300},
            {"par": 4, "distance": 358, "bearing": 180},
            {"par": 3, "distance": 181, "bearing": 90},
            {"par": 4, "distance": 467, "bearing": 200},
            {"par": 4, "distance": 449, "bearing": 340},
            {"par": 5, "distance": 523, "bearing": 160},
            {"par": 3, "distance": 137, "bearing": 60},
            {"par": 4, "distance": 462, "bearing": 200},
        ],
    },
    "bethpageblack": {
        "name": "Bethpage Black",
        "lat": 40.7449, "lon": -73.4539,
        "city": "Farmingdale", "state": "NY",
        "holes": [
            {"par": 4, "distance": 430, "bearing": 70},
            {"par": 4, "distance": 389, "bearing": 340},
            {"par": 3, "distance": 230, "bearing": 260},
            {"par": 5, "distance": 517, "bearing": 170},
            {"par": 4, "distance": 478, "bearing": 110},
            {"par": 4, "distance": 408, "bearing": 340},
            {"par": 4, "distance": 524, "bearing": 70},
            {"par": 3, "distance": 210, "bearing": 200},
            {"par": 4, "distance": 460, "bearing": 280},
            {"par": 4, "distance": 502, "bearing": 180},
            {"par": 4, "distance": 435, "bearing": 90},
            {"par": 4, "distance": 501, "bearing": 350},
            {"par": 5, "distance": 608, "bearing": 250},
            {"par": 3, "distance": 161, "bearing": 120},
            {"par": 4, "distance": 478, "bearing": 30},
            {"par": 4, "distance": 479, "bearing": 300},
            {"par": 3, "distance": 207, "bearing": 190},
            {"par": 4, "distance": 411, "bearing": 50},
        ],
    },
}


def _yards_to_meters(yards: float) -> float:
    return yards * 0.9144


def _bearing_to_rad(bearing_deg: float) -> float:
    return math.radians(bearing_deg)


def _offset_latlon(lat: float, lon: float, distance_m: float, bearing_rad: float):
    """Offset a lat/lon by distance in meters along a bearing."""
    R = 6371000  # Earth radius in meters
    lat_r = math.radians(lat)
    lon_r = math.radians(lon)

    new_lat = math.asin(
        math.sin(lat_r) * math.cos(distance_m / R)
        + math.cos(lat_r) * math.sin(distance_m / R) * math.cos(bearing_rad)
    )
    new_lon = lon_r + math.atan2(
        math.sin(bearing_rad) * math.sin(distance_m / R) * math.cos(lat_r),
        math.cos(distance_m / R) - math.sin(lat_r) * math.sin(new_lat),
    )
    return (math.degrees(new_lat), math.degrees(new_lon))


def generate_course_json(handle: str, info: dict) -> dict:
    """Generate a BlueGolf-format JSON for a course from basic info."""
    random.seed(hash(handle))
    base_lat = info["lat"]
    base_lon = info["lon"]

    # Place holes in a routing pattern around the clubhouse
    holes = []
    current_lat = base_lat
    current_lon = base_lon

    lat2y = 110944.0
    lon2x = 110944.0 * math.cos(math.radians(base_lat))

    for i, hole_info in enumerate(info["holes"]):
        bearing = _bearing_to_rad(hole_info["bearing"])
        distance_m = _yards_to_meters(hole_info["distance"])

        # Tee position: near the end of the previous hole (or clubhouse for hole 1)
        tee_lat, tee_lon = current_lat, current_lon

        # Green position: offset from tee along bearing
        green_lat, green_lon = _offset_latlon(tee_lat, tee_lon, distance_m, bearing)

        # Dogleg: midpoint with slight offset
        mid_lat = (tee_lat + green_lat) / 2 + random.uniform(-0.0002, 0.0002)
        mid_lon = (tee_lon + green_lon) / 2 + random.uniform(-0.0002, 0.0002)

        # Green front/back
        green_depth_m = random.uniform(25, 40) * 0.3048  # feet to meters
        gf_lat, gf_lon = _offset_latlon(green_lat, green_lon, -green_depth_m / 2, bearing)
        gb_lat, gb_lon = _offset_latlon(green_lat, green_lon, green_depth_m / 2, bearing)

        image_scale = random.uniform(1.5, 2.5)
        rotation = bearing + random.uniform(-0.3, 0.3)

        # Points in image coordinates (relative to green center, 800x800 image)
        def latlon_to_img(lat, lon):
            dy = (green_lat - lat) * lat2y / image_scale
            dx = (lon - green_lon) * lon2x / image_scale
            cos_r = math.cos(rotation)
            sin_r = math.sin(rotation)
            ix = dx * cos_r + dy * sin_r
            iy = -dx * sin_r + dy * cos_r
            return (ix, iy)

        tee_img = latlon_to_img(tee_lat, tee_lon)
        mid_img = latlon_to_img(mid_lat, mid_lon)
        gf_img = latlon_to_img(gf_lat, gf_lon)
        gc_img = latlon_to_img(green_lat, green_lon)
        gb_img = latlon_to_img(gb_lat, gb_lon)

        # Generate features (bunkers)
        features = [
            {
                "type": "green",
                "descrip": None,
                "icon": None,
                "frontlat": gf_lat,
                "frontlon": gf_lon,
                "backlat": gb_lat,
                "backlon": gb_lon,
                "centerlat": green_lat,
                "centerlon": green_lon,
            }
        ]

        # Add 0-3 bunkers
        n_bunkers = random.randint(0, 3)
        for b in range(n_bunkers):
            # Place bunkers near the green or along the fairway
            if random.random() < 0.7:
                # Greenside bunker
                offset_bearing = bearing + random.choice([-1.2, 1.2, -0.8, 0.8])
                offset_dist = random.uniform(15, 35)
                b_lat, b_lon = _offset_latlon(green_lat, green_lon, offset_dist, offset_bearing)
                btype = "greensidebunker"
                descrip = f"{'Left' if b % 2 == 0 else 'Right'} Greenside Bunker"
            else:
                # Fairway bunker
                t = random.uniform(0.3, 0.7)
                b_lat = tee_lat + t * (green_lat - tee_lat) + random.uniform(-0.0001, 0.0001)
                b_lon = tee_lon + t * (green_lon - tee_lon) + random.uniform(-0.0002, 0.0002)
                btype = "fairwaybunker"
                descrip = f"{'Left' if b % 2 == 0 else 'Right'} Fairway Bunker"

            features.append({
                "type": btype,
                "descrip": descrip,
                "icon": None,
                "frontlat": b_lat,
                "frontlon": b_lon,
                "backlat": b_lat + random.uniform(-0.00005, 0.00005),
                "backlon": b_lon + random.uniform(-0.00005, 0.00005),
                "centerlat": b_lat,
                "centerlon": b_lon,
            })

        # Add water on some holes
        if random.random() < 0.15:
            t = random.uniform(0.2, 0.8)
            w_lat = tee_lat + t * (green_lat - tee_lat) + random.uniform(-0.0003, 0.0003)
            w_lon = tee_lon + t * (green_lon - tee_lon) + random.uniform(-0.0003, 0.0003)
            features.append({
                "type": "water",
                "descrip": "Water Hazard",
                "icon": None,
                "frontlat": w_lat,
                "frontlon": w_lon,
                "backlat": None,
                "backlon": None,
                "centerlat": w_lat,
                "centerlon": w_lon,
            })

        hole = {
            "par": hole_info["par"],
            "distance": hole_info["distance"],
            "handicap": i + 1,
            "image": None,
            "image2x": None,
            "green": {
                "image": None,
                "image2x": None,
                "maskScale": 1.0,
                "rotation": rotation,
                "lon": green_lon,
                "lat": green_lat,
                "lon2x": lon2x,
                "lat2y": lat2y,
                "lunit": 1,
                "imageScale": image_scale,
                "depth": green_depth_m / 0.3048,
                "blurb": {"allowedit": False, "text": None},
                "points": [
                    {"x": gf_img[0], "y": gf_img[1], "name": "green_front"},
                    {"x": gc_img[0], "y": gc_img[1], "name": "green_center"},
                    {"x": gb_img[0], "y": gb_img[1], "name": "green_back"},
                ],
            },
            "blurb": {"allowedit": False, "text": None},
            "points": [
                {"x": tee_img[0], "y": tee_img[1], "name": "tee"},
                {"x": mid_img[0], "y": mid_img[1], "name": "dogleg"},
                {"x": gf_img[0], "y": gf_img[1], "name": "green_front"},
                {"x": gc_img[0], "y": gc_img[1], "name": "green_center"},
                {"x": gb_img[0], "y": gb_img[1], "name": "green_back"},
            ],
            "features": features,
        }
        holes.append(hole)

        # Next hole starts near this green (with some offset for routing)
        route_bearing = bearing + random.uniform(1.5, 3.0)
        current_lat, current_lon = _offset_latlon(
            green_lat, green_lon, random.uniform(30, 80), route_bearing
        )

    return {
        "robot": False,
        "path": f"/bluegolf/app/course/{handle}/overview.json",
        "allowgps": True,
        "allowShots": False,
        "course": {
            "name": info["name"],
            "address": "",
            "city": info.get("city", ""),
            "state": info.get("state", ""),
            "zip": "",
            "phone": "",
            "website": "",
            "lat": base_lat,
            "lon": base_lon,
        },
        "holes": holes,
    }


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)

    for handle, info in COURSES.items():
        data = generate_course_json(handle, info)
        path = os.path.join(out_dir, f"{handle}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Generated {path} ({len(data['holes'])} holes)")


if __name__ == "__main__":
    main()
