import easyocr
from PIL import Image
import numpy as np

reader = easyocr.Reader(['en', 'hi'])

def perform_ocr(image: Image.Image):
    img_np = np.array(image)
    results = reader.readtext(img_np, detail=1)
    # results: list of (bbox, text, confidence)
    return results