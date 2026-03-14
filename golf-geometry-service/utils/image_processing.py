"""Image processing utilities."""

import io

from PIL import Image


def get_image_dimensions(image_data: bytes) -> tuple[int, int]:
    """Get width and height of an image from raw bytes."""
    img = Image.open(io.BytesIO(image_data))
    return img.size


def validate_image(image_data: bytes) -> bool:
    """Check if image data is a valid image."""
    try:
        img = Image.open(io.BytesIO(image_data))
        img.verify()
        return True
    except Exception:
        return False
