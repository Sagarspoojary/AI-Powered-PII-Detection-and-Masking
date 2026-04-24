from fastapi import FastAPI, UploadFile, File, Response, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import re

try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None

from ocr_utils import perform_ocr
try:
    from llm import OllamaLLMPIIDetector
    llm_detector = OllamaLLMPIIDetector(model_name="llama3.2:3b")
    llm_available = True
except Exception as e:
    print(f"LLM not available: {e}")
    llm_detector = None
    llm_available = False
from mask_utils import mask_pii_in_image
from pii_utils import PII_PATTERNS

def _regex_pii_detection(text: str) -> list:
    """Fallback PII detection using regex patterns when LLM is not available."""
    pii_items = []
    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            pii_items.append({
                "type": pii_type,
                "value": match.strip(),
                "confidence": 0.8  # Default confidence for regex matches
            })
    return pii_items

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check(response: Response):
    response.status_code = 200
    if llm_available:
        ollama_status = llm_detector.check_ollama_status()
        available_models = llm_detector.client.get_available_models()
        model_name = llm_detector.model_name
    else:
        ollama_status = False
        available_models = []
        model_name = "Not available"
    
    return {
        "status": "ok",
        "ollama_available": ollama_status,
        "model": model_name,
        "available_models": available_models
    }


def _load_image_from_bytes(contents: bytes, content_type: str) -> Image.Image:
    if content_type == 'application/pdf' or contents[:4] == b'%PDF':
        if convert_from_bytes is None:
            raise RuntimeError('pdf2image is required to process PDF files. Install it with pip install pdf2image')

        # Convert first page of PDF to image
        images = convert_from_bytes(contents, first_page=1, last_page=1)
        if not images:
            raise ValueError('PDF contains no pages')
        
        return images[0].convert('RGB')

    return Image.open(io.BytesIO(contents)).convert('RGB')


@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    mask_type: str = Query("pixelate", description="Masking type: pixelate, blur, black, red")
):
    contents = await file.read()
    image = _load_image_from_bytes(contents, file.content_type)

    # Perform OCR with EasyOCR
    ocr_results = perform_ocr(image)
    text_data = "\n".join([text for _, text, _ in ocr_results])
    print("📄 OCR Text:", text_data)

    # Enhanced PII detection with LLM + Regex or fallback to regex only
    if llm_available:
        pii_items = llm_detector.enhanced_pii_detection(text_data)
    else:
        pii_items = _regex_pii_detection(text_data)
    print("🔍 Detected PII:", pii_items)

    # Mask/redact the image with chosen effect
    masked_image = mask_pii_in_image(image, ocr_results, pii_items, mask_type)

    buf = io.BytesIO()
    masked_image.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
from pydantic import BaseModel

class TextDetectRequest(BaseModel):
    text: str

@app.post("/detect-text")
async def detect_text_pii(request: TextDetectRequest):
    text = request.text

    if llm_available:
        pii_items = llm_detector.enhanced_pii_detection(text)
    else:
        pii_items = _regex_pii_detection(text)

    return {
        "original_text": text,
        "pii_detected": pii_items,
        "masked_text": _mask_text(text, pii_items)
    }

def _mask_text(text: str, pii_items: list) -> str:
    masked = text
    sorted_pii = sorted(pii_items, key=lambda x: len(x.get("value", "")), reverse=True)
    for item in sorted_pii:
        value = item.get("value", "")
        pii_type = item.get("type", "")
        if value:
            if pii_type == "aadhaar":
                # Show last 4 digits: **** **** 9012
                parts = value.replace(" ", "")
                masked_val = "**** **** " + parts[-4:]
            elif pii_type == "pan":
                # Mask middle: AB***1234F
                masked_val = value[:2] + "*" * (len(value) - 4) + value[-2:]
            elif pii_type == "driving_license":
                # Show state code only: MH***********
                masked_val = value[:2] + "*" * (len(value) - 2)
            elif pii_type == "phone":
                # Show last 4 digits: ******7890
                masked_val = "*" * (len(value) - 4) + value[-4:]
            elif pii_type == "email":
                # Mask username: a***@gmail.com
                at = value.index("@")
                masked_val = value[0] + "*" * (at - 1) + value[at:]
            elif pii_type == "dob":
                # Mask day and month: **/**/1995
                parts = value.replace("-", "/").split("/")
                masked_val = "**/**/" + parts[-1]
            else:
                # Generic: mask all characters keep spaces
                masked_val = "".join("*" if c != " " else " " for c in value)
            
            masked = masked.replace(value, masked_val)
    return masked
@app.post("/ocr-text")
async def ocr_text(file: UploadFile = File(...)):
    contents = await file.read()
    image = _load_image_from_bytes(contents, file.content_type)
    ocr_results = perform_ocr(image)
    text_data = "\n".join([text for _, text, _ in ocr_results])
    return {"text": text_data}