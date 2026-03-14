"""Claude Vision API integration for extracting course geometry from satellite images."""

import asyncio
import base64
import json
import logging
from typing import Optional

import anthropic

from config import settings
from models.bluegolf import BlueGolfHole, BlueGolfResponse
from models.course import HoleImage
from models.geometry import HoleAnalysisResult, HoleVisionFeature
from prompts.hole_analysis import build_hole_prompt, FULL_COURSE_PROMPT

logger = logging.getLogger(__name__)


class VisionAnalysisError(Exception):
    pass


class VisionAnalyzer:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.semaphore = asyncio.Semaphore(settings.vision_max_concurrent)

    async def analyze_all_holes(
        self,
        images: list[Optional[HoleImage]],
        course_data: BlueGolfResponse,
    ) -> list[Optional[HoleAnalysisResult]]:
        """Analyze all hole images concurrently with rate limiting."""
        tasks = []
        for i, (image, hole) in enumerate(zip(images, course_data.holes)):
            if image is None:
                tasks.append(self._return_none())
            else:
                tasks.append(
                    self._analyze_with_semaphore(image, hole, i + 1)
                )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        analyses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.warning(f"Vision analysis failed for hole {i + 1}: {result}")
                analyses.append(None)
            else:
                analyses.append(result)

        analyzed = sum(1 for a in analyses if a is not None)
        logger.info(f"Vision analyzed {analyzed}/{len(images)} holes")
        return analyses

    async def _return_none(self) -> None:
        return None

    async def _analyze_with_semaphore(
        self, image: HoleImage, hole: BlueGolfHole, hole_number: int
    ) -> HoleAnalysisResult:
        async with self.semaphore:
            return await self._analyze_hole(image, hole, hole_number)

    async def _analyze_hole(
        self, image: HoleImage, hole: BlueGolfHole, hole_number: int
    ) -> HoleAnalysisResult:
        """Analyze a single hole image with Claude Vision."""
        # Build reference points from BlueGolf data
        reference_points = self._extract_reference_points(hole)
        features_info = self._extract_features_info(hole)

        prompt = build_hole_prompt(
            hole_number=hole_number,
            par=hole.par,
            distance=hole.distance,
            reference_points=reference_points,
            features=features_info,
        )

        image_b64 = base64.b64encode(image.image_data).decode()

        # Determine media type from image data
        media_type = "image/jpeg"
        if image.image_data[:4] == b"\x89PNG":
            media_type = "image/png"

        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=settings.vision_model,
                max_tokens=settings.vision_max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )
        except anthropic.APIError as e:
            raise VisionAnalysisError(f"Claude API error for hole {hole_number}: {e}")

        # Parse the response
        raw_text = response.content[0].text.strip()

        # Extract JSON from response (handle markdown code blocks)
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            json_lines = []
            inside = False
            for line in lines:
                if line.startswith("```") and not inside:
                    inside = True
                    continue
                elif line.startswith("```") and inside:
                    break
                elif inside:
                    json_lines.append(line)
            raw_text = "\n".join(json_lines)

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as e:
            raise VisionAnalysisError(
                f"Failed to parse Vision response for hole {hole_number}: {e}"
            )

        # Validate and build result
        features = []
        for f in data.get("features", []):
            try:
                feature = HoleVisionFeature(
                    type=f["type"],
                    points=f["points"],
                    confidence=f.get("confidence", 0.7),
                )
                # Filter out degenerate polygons
                if len(feature.points) >= 3:
                    features.append(feature)
            except (KeyError, ValueError) as e:
                logger.warning(
                    f"Skipping invalid feature in hole {hole_number}: {e}"
                )

        return HoleAnalysisResult(hole_number=hole_number, features=features)

    async def analyze_full_course(
        self, image_data: bytes, course_name: str
    ) -> list[HoleVisionFeature]:
        """Analyze a full course overview image (fallback mode)."""
        image_b64 = base64.b64encode(image_data).decode()
        media_type = "image/jpeg"
        if image_data[:4] == b"\x89PNG":
            media_type = "image/png"

        prompt = FULL_COURSE_PROMPT.format(course_name=course_name)

        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=settings.vision_model,
                max_tokens=settings.vision_max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )
        except anthropic.APIError as e:
            raise VisionAnalysisError(f"Claude API error for full course: {e}")

        raw_text = response.content[0].text.strip()
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            json_lines = []
            inside = False
            for line in lines:
                if line.startswith("```") and not inside:
                    inside = True
                    continue
                elif line.startswith("```") and inside:
                    break
                elif inside:
                    json_lines.append(line)
            raw_text = "\n".join(json_lines)

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as e:
            raise VisionAnalysisError(f"Failed to parse full course response: {e}")

        features = []
        for f in data.get("features", []):
            try:
                feature = HoleVisionFeature(
                    type=f["type"],
                    points=f["points"],
                    confidence=f.get("confidence", 0.5),
                )
                if len(feature.points) >= 3:
                    features.append(feature)
            except (KeyError, ValueError):
                pass

        return features

    def _extract_reference_points(self, hole: BlueGolfHole) -> list[dict]:
        """Extract normalized reference points from BlueGolf hole data."""
        points = []
        for pt in hole.points:
            # BlueGolf points are in image-relative coordinates
            # Normalize to [0, 1] based on typical 800x800 image
            points.append({
                "name": pt.name,
                "x": pt.x / 800.0,
                "y": pt.y / 800.0,
            })
        return points

    def _extract_features_info(self, hole: BlueGolfHole) -> list[dict]:
        """Extract feature descriptions from BlueGolf data."""
        features = []
        for f in hole.features:
            feat_type = self._map_bluegolf_type(f.type)
            features.append({
                "type": feat_type,
                "descrip": f.descrip,
            })
        return features

    @staticmethod
    def _map_bluegolf_type(bg_type: str) -> str:
        """Map BlueGolf feature types to our standardized types."""
        mapping = {
            "green": "green",
            "fairwaybunker": "bunker",
            "greensidebunker": "bunker",
            "bunker": "bunker",
            "water": "water",
            "lateral": "water",
            "pond": "water",
            "creek": "water",
            "stream": "water",
            "lake": "water",
            "tee": "tee",
            "teebox": "tee",
        }
        return mapping.get(bg_type.lower(), "bunker")
