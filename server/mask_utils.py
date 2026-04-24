from PIL import ImageDraw, Image, ImageFilter
import re

def pixelate_region(image, x1, y1, x2, y2, pixel_size=10):
    """Apply pixelation effect to a specific region"""
    region = image.crop((x1, y1, x2, y2))
    
    width, height = region.size
    
    if width <= 0 or height <= 0:
        return image
    
    small_width = max(1, width // pixel_size)
    small_height = max(1, height // pixel_size)
    
    small_region = region.resize((small_width, small_height), Image.NEAREST)
    pixelated_region = small_region.resize((width, height), Image.NEAREST)
    
    image.paste(pixelated_region, (x1, y1))
    
    return image

def blur_region(image, x1, y1, x2, y2):
    """Apply blur effect to a specific region"""
    region = image.crop((x1, y1, x2, y2))
    blurred_region = region.filter(ImageFilter.GaussianBlur(radius=8))
    image.paste(blurred_region, (x1, y1))
    return image

def black_rectangle(image, x1, y1, x2, y2):
    """Apply black rectangle to a specific region"""
    draw = ImageDraw.Draw(image)
    draw.rectangle([x1, y1, x2, y2], fill="black")
    return image

def colored_rectangle(image, x1, y1, x2, y2, color="red"):
    """Apply colored rectangle to a specific region"""
    draw = ImageDraw.Draw(image)
    draw.rectangle([x1, y1, x2, y2], fill=color)
    return image

def _get_mask_spans_for_value(value: str, pii_type: str):
    """Return character spans within the PII value that should be masked."""
    value = value.strip()

    if pii_type == "aadhaar":
        digit_positions = [i for i, c in enumerate(value) if c.isdigit()]
        if len(digit_positions) == 12:
            return [(digit_positions[0], digit_positions[7] + 1)]

    if pii_type == "pan":
        alnum_positions = [i for i, c in enumerate(value) if c.isalnum()]
        if len(alnum_positions) == 10:
            return [(alnum_positions[2], alnum_positions[-2] + 1)]

    if pii_type in {"driving_license", "license", "driver_license"}:
        alnum_positions = [i for i, c in enumerate(value) if c.isalnum()]
        if len(alnum_positions) == 15:
            return [(alnum_positions[2], alnum_positions[-1] + 1)]

    return [(0, len(value))]


def _find_pii_substring_ranges(text: str, pii_value: str, pii_type: str):
    text_lower = text.lower()
    value_lower = pii_value.lower()

    if ':' in text_lower:
        label, value_part = text.split(':', 1)
        value_part_lower = value_part.lower()
        match_index = value_part_lower.find(value_lower)
        if match_index != -1:
            start = text.index(value_part) + match_index
            mask_spans = _get_mask_spans_for_value(value_part[match_index:match_index + len(pii_value)], pii_type)
            return [(start + span_start, start + span_end) for span_start, span_end in mask_spans]

    match_index = text_lower.find(value_lower)
    if match_index != -1:
        mask_spans = _get_mask_spans_for_value(pii_value, pii_type)
        return [(match_index + span_start, match_index + span_end) for span_start, span_end in mask_spans]

    return []


def _apply_mask_to_slice(image, bbox, text, mask_ranges, mask_type):
    x_coords = [point[0] for point in bbox]
    y_coords = [point[1] for point in bbox]
    min_x, max_x = int(min(x_coords)), int(max(x_coords))
    min_y, max_y = int(min(y_coords)), int(max(y_coords))
    text_length = len(text)

    if text_length == 0 or max_x <= min_x or max_y <= min_y:
        return image

    text_width = max_x - min_x

    for start, end in mask_ranges:
        if start >= end:
            continue

        region_x1 = min_x + int((start / text_length) * text_width)
        region_x2 = min_x + int((end / text_length) * text_width)
        region_x2 = max(region_x2, region_x1 + 1)

        if mask_type == "pixelate":
            image = pixelate_region(image, region_x1, min_y, region_x2, max_y)
        elif mask_type == "blur":
            image = blur_region(image, region_x1, min_y, region_x2, max_y)
        elif mask_type == "black":
            image = black_rectangle(image, region_x1, min_y, region_x2, max_y)
        elif mask_type == "red":
            image = colored_rectangle(image, region_x1, min_y, region_x2, max_y, "red")

    return image


def mask_pii_in_image(image, ocr_results, pii_items, mask_type="pixelate"):
    """
    Mask PII values in the image with different effects.
    
    Args:
        image: PIL Image object
        ocr_results: OCR results with bounding boxes
        pii_items: Detected PII items
        mask_type: "pixelate", "blur", "black", "red" (default: "pixelate")
    """
    pii_items = [item for item in pii_items if item.get("value")]
    pii_values = [item["value"].strip() for item in pii_items]
    print(f"🎯 Masking PII values with {mask_type} effect: {pii_values}")

    masked_count = 0

    for bbox, text, conf in ocr_results:
        text_clean = text.strip()
        if not text_clean:
            continue

        for item in pii_items:
            pii_value = item["value"].strip()
            mask_ranges = _find_pii_substring_ranges(text_clean, pii_value, item.get("type", ""))
            if not mask_ranges:
                continue

            image = _apply_mask_to_slice(image, bbox, text_clean, mask_ranges, mask_type)
            print(f"🎨 {mask_type.capitalize()} masked substring in '{text_clean}' for '{pii_value}'")
            masked_count += 1

    print(f"✅ Masking complete: {masked_count} regions processed with {mask_type} effect")
    return image
