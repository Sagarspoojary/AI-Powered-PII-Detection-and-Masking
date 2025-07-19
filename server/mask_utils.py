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

def mask_pii_in_image(image, ocr_results, pii_items, mask_type="pixelate"):
    """
    Mask PII values in the image with different effects.
    
    Args:
        image: PIL Image object
        ocr_results: OCR results with bounding boxes
        pii_items: Detected PII items
        mask_type: "pixelate", "blur", "black", "red" (default: "pixelate")
    """
    pii_values = {item["value"].strip() for item in pii_items}
    
    print(f"🎯 Masking PII values with {mask_type} effect: {pii_values}")
    
    masked_count = 0
    
    for bbox, text, conf in ocr_results:
        text_clean = text.strip()
        
        # Check if this OCR text contains any PII value
        should_mask = False
        
        for pii_value in pii_values:
            if pii_value in text_clean:
                if text_clean == pii_value:
                    should_mask = True
                    break
                
                if ':' in text_clean:
                    parts = text_clean.split(':')
                    if len(parts) == 2:
                        value_part = parts[1].strip()
                        if value_part == pii_value:
                            should_mask = True
                            break
                else:
                    if len(pii_value) / len(text_clean) > 0.5:
                        should_mask = True
                        break
        
        if should_mask:
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]
            min_x, max_x = int(min(x_coords)), int(max(x_coords))
            min_y, max_y = int(min(y_coords)), int(max(y_coords))
            
            if ':' in text_clean and any(pii_value in text_clean.split(':')[1].strip() for pii_value in pii_values):
                colon_pos = text_clean.find(':')
                total_length = len(text_clean)
                value_start_ratio = (colon_pos + 1) / total_length
                
                text_width = max_x - min_x
                value_start_x = int(min_x + (text_width * value_start_ratio))
                
                if mask_type == "pixelate":
                    image = pixelate_region(image, value_start_x, min_y, max_x, max_y)
                elif mask_type == "blur":
                    image = blur_region(image, value_start_x, min_y, max_x, max_y)
                elif mask_type == "black":
                    image = black_rectangle(image, value_start_x, min_y, max_x, max_y)
                elif mask_type == "red":
                    image = colored_rectangle(image, value_start_x, min_y, max_x, max_y, "red")
                
                print(f"🎨 Partially {mask_type} masked: '{text_clean}' (value portion only)")
            else:
                if mask_type == "pixelate":
                    image = pixelate_region(image, min_x, min_y, max_x, max_y)
                elif mask_type == "blur":
                    image = blur_region(image, min_x, min_y, max_x, max_y)
                elif mask_type == "black":
                    image = black_rectangle(image, min_x, min_y, max_x, max_y)
                elif mask_type == "red":
                    image = colored_rectangle(image, min_x, min_y, max_x, max_y, "red")
                
                print(f"🎨 Fully {mask_type} masked: '{text_clean}'")
            
            masked_count += 1
    
    print(f"✅ Masking complete: {masked_count} regions processed with {mask_type} effect")
    return image