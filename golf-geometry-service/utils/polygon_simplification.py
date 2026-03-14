"""Douglas-Peucker polygon simplification for smooth poster rendering."""

import math


def _perpendicular_distance(
    point: tuple[float, float],
    line_start: tuple[float, float],
    line_end: tuple[float, float],
) -> float:
    """Calculate perpendicular distance from a point to a line segment."""
    dx = line_end[0] - line_start[0]
    dy = line_end[1] - line_start[1]
    line_len_sq = dx * dx + dy * dy

    if line_len_sq == 0:
        return math.hypot(point[0] - line_start[0], point[1] - line_start[1])

    t = max(0, min(1, (
        (point[0] - line_start[0]) * dx + (point[1] - line_start[1]) * dy
    ) / line_len_sq))

    proj_x = line_start[0] + t * dx
    proj_y = line_start[1] + t * dy

    return math.hypot(point[0] - proj_x, point[1] - proj_y)


def simplify_polygon(
    points: list[tuple[float, float]],
    tolerance: float = 1.5,
    min_points: int = 6,
) -> list[tuple[float, float]]:
    """Simplify a polygon using Douglas-Peucker algorithm.

    Args:
        points: Polygon vertices.
        tolerance: Maximum distance threshold for point removal.
        min_points: Minimum number of points to keep.

    Returns:
        Simplified polygon.
    """
    if len(points) <= min_points:
        return points

    simplified = _douglas_peucker(points, tolerance)

    # If we over-simplified, reduce tolerance
    while len(simplified) < min_points and tolerance > 0.1:
        tolerance *= 0.5
        simplified = _douglas_peucker(points, tolerance)

    return simplified


def _douglas_peucker(
    points: list[tuple[float, float]], tolerance: float
) -> list[tuple[float, float]]:
    """Recursive Douglas-Peucker simplification."""
    if len(points) <= 2:
        return points

    max_dist = 0.0
    max_idx = 0

    for i in range(1, len(points) - 1):
        dist = _perpendicular_distance(points[i], points[0], points[-1])
        if dist > max_dist:
            max_dist = dist
            max_idx = i

    if max_dist > tolerance:
        left = _douglas_peucker(points[: max_idx + 1], tolerance)
        right = _douglas_peucker(points[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [points[0], points[-1]]
