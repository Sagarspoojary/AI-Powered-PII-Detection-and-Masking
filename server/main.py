from fastapi import FastAPI, UploadFile, File, Response, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from ocr_utils import perform_ocr
from llm import OllamaLLMPIIDetector
from mask_utils import mask_pii_in_image

app = FastAPI()

llm_detector = OllamaLLMPIIDetector(model_name="llama3.2:3b")

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
    ollama_status = llm_detector.check_ollama_status()
    available_models = llm_detector.client.get_available_models()
    
    return {
        "status": "ok",
        "ollama_available": ollama_status,
        "model": llm_detector.model_name,
        "available_models": available_models
    }

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    mask_type: str = Query("pixelate", description="Masking type: pixelate, blur, black, red")
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # Perform OCR with EasyOCR
    ocr_results = perform_ocr(image)
    text_data = "\n".join([text for _, text, _ in ocr_results])
    print("📄 OCR Text:", text_data)

    # Enhanced PII detection with LLM + Regex
    pii_items = llm_detector.enhanced_pii_detection(text_data)
    print("🔍 Detected PII:", pii_items)

    # Mask/redact the image with chosen effect
    masked_image = mask_pii_in_image(image, ocr_results, pii_items, mask_type)

    buf = io.BytesIO()
    masked_image.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")