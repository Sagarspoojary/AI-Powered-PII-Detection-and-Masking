# PII Detection & Masking Server

**Backend API for automatically detecting and masking Personally Identifiable Information (PII) in images using OCR and LLM technology.**

## Overview

This FastAPI-based server provides intelligent PII detection and masking capabilities for document images. It combines EasyOCR for text extraction with local LLM models for context-aware PII identification, then applies various masking effects to protect sensitive information.

## Architecture

```
server/
├── main.py                    # FastAPI application entry point
├── ocr_utils.py              # EasyOCR text extraction with bounding boxes
├── pii_utils.py              # Regex-based PII patterns (fallback)
├── mask_utils.py             # Image masking utilities (pixelate, blur, etc.)
├── llm/                      # LLM module for intelligent PII detection
│   ├── __init__.py
│   ├── ollama_client.py      # Ollama API connection handler
│   ├── prompts.py            # Specialized prompts for different scenarios
│   └── pii_detector.py       # Main PII detection logic
├── requirements.txt          # Python dependencies
└── run_server.py            # Server startup script
```

## Processing Pipeline

1. **Image Upload** → FastAPI endpoint receives image
2. **OCR Extraction** → EasyOCR extracts text with coordinates
3. **Dual PII Detection** → LLM + Regex identify sensitive information
4. **Smart Masking** → Apply chosen effect (pixelate/blur/black/red)
5. **Response** → Return masked image

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Setup Ollama (for LLM functionality)
ollama serve
ollama pull llama3.2:3b  # or gemma3n:e2b

# Start server
uvicorn main:app --reload
# Server runs on http://localhost:8000
```

## 📡 API Endpoints

- **`GET /health`** - Check server and model status
- **`POST /upload?mask_type=pixelate`** - Process image with PII masking

## 🤖 Models Used

- **Primary**: `gemma3n:e2b` (5.6GB) - Context-aware PII detection
- **Alternative**: `llama3.2:3b` (2.0GB) - Backup LLM model
- **OCR**: EasyOCR with English + Hindi support
- **Fallback**: Regex patterns for reliability

## 🔧 Key Features

- **Multilingual Support** - English, Hindi, regional languages
- **Smart Partial Masking** - Only masks values, preserves labels
- **Multiple Effects** - Pixelate, blur, black box, colored overlay
- **Hybrid Detection** - LLM intelligence + regex reliability
- **Privacy-First** - All processing happens locally

## 📋 Supported PII Types

- Names, Phone numbers, Email addresses
- Aadhaar numbers, PAN numbers, Dates of birth
- Addresses, Father/Mother names
