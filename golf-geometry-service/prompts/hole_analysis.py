"""Vision prompt templates for extracting golf course geometry from satellite images."""

HOLE_ANALYSIS_PROMPT = """You are a golf course cartographer analyzing a satellite image of a golf hole to extract polygon geometry for a stylized course poster.

## Task
Analyze this satellite image of hole {hole_number} (Par {par}, {distance} yards) and trace polygon outlines for each visible golf feature.

## Known Reference Points
These GPS-derived points are confirmed. Use them to calibrate your coordinate estimates:
{reference_points_text}

## Known Features at This Hole
These features exist at known locations — trace their boundaries:
{features_text}

## Instructions
1. For each visible golf feature, output a polygon as a list of [x, y] coordinate pairs.
2. Coordinates are normalized to [0, 1] range: (0,0) = top-left, (1,1) = bottom-right of the image.
3. Use 8-20 vertices per polygon — smooth enough for rendering, not excessive.
4. **Fairways**: Trace the mowed grass boundary from the landing zone to the green approach. These are lighter green areas.
5. **Greens**: Trace the putting surface boundary. Usually oval/circular, darkest manicured green area near the flagstick.
6. **Bunkers**: Trace each sand trap individually. Light tan/beige/white areas.
7. **Water**: Trace ponds, lakes, or streams. Dark blue/black areas.
8. **Tees**: Trace tee box areas. Small rectangular manicured areas near the tee reference point.
9. If a feature is partially hidden by trees, estimate the likely boundary based on visible edges.
10. Order polygon points clockwise.

## Output
Return ONLY a JSON object with this exact structure (no extra text):
"""

HOLE_ANALYSIS_JSON_HINT = """{
  "hole_number": <int>,
  "features": [
    {
      "type": "fairway" | "green" | "bunker" | "water" | "tee",
      "points": [[x1, y1], [x2, y2], ...],
      "confidence": <float 0-1>
    }
  ]
}"""

FULL_COURSE_PROMPT = """You are a golf course cartographer analyzing a satellite overview image of an entire golf course.

## Task
Analyze this satellite image of {course_name} and trace polygon outlines for all visible golf features across the course.

## Instructions
1. Identify and trace ALL visible fairways, greens, bunkers, water features, and tee boxes.
2. Coordinates are normalized to [0, 1] range: (0,0) = top-left, (1,1) = bottom-right.
3. Use 10-25 vertices per fairway polygon, 8-15 for smaller features.
4. **Fairways**: Lighter green mowed corridors. Trace each hole's fairway as a separate polygon.
5. **Greens**: Small dark green oval/circular areas at the end of each fairway.
6. **Bunkers**: White/tan sand areas adjacent to fairways and greens.
7. **Water**: Dark blue/black ponds, lakes, or streams.
8. **Tees**: Small rectangular areas at the start of each hole.
9. Order features roughly by hole number if you can identify the routing.
10. Order polygon points clockwise.

## Output
Return ONLY a JSON object with this structure (no extra text):
{
  "features": [
    {
      "type": "fairway" | "green" | "bunker" | "water" | "tee",
      "points": [[x1, y1], [x2, y2], ...],
      "confidence": <float 0-1>
    }
  ]
}"""


def build_hole_prompt(
    hole_number: int,
    par: int,
    distance: int,
    reference_points: list[dict],
    features: list[dict],
) -> str:
    """Build the complete vision prompt for a single hole analysis."""
    # Format reference points
    if reference_points:
        ref_lines = []
        for pt in reference_points:
            ref_lines.append(f"  - {pt['name']}: approximately ({pt['x']:.3f}, {pt['y']:.3f})")
        reference_text = "\n".join(ref_lines)
    else:
        reference_text = "  (No reference points available)"

    # Format known features
    if features:
        feat_lines = []
        for f in features:
            desc = f.get("descrip") or f["type"]
            feat_lines.append(f"  - {desc} (type: {f['type']})")
        features_text = "\n".join(feat_lines)
    else:
        features_text = "  (No pre-identified features)"

    prompt = HOLE_ANALYSIS_PROMPT.format(
        hole_number=hole_number,
        par=par,
        distance=distance,
        reference_points_text=reference_text,
        features_text=features_text,
    )
    prompt += HOLE_ANALYSIS_JSON_HINT
    return prompt
