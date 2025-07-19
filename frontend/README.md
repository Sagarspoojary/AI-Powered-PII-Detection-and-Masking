# PII Detection & Masking Frontend

React TypeScript application for detecting and masking Personally Identifiable Information (PII) in images.

## Features

- **Drag & Drop Upload** - Easy image upload interface
- **Multiple Masking Options** - Pixelate, blur, black box, red overlay
- **Real-time Processing** - Side-by-side before/after comparison
- **Download Results** - Save masked images locally
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **FastAPI** backend integration

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Frontend: http://localhost:5173
   - Make sure backend is running on http://localhost:8000

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_API_UPLOAD_ENDPOINT` | Upload endpoint | `/upload` |
| `VITE_API_HEALTH_ENDPOINT` | Health check endpoint | `/health` |

## Supported PII Types

- Names, Phone numbers, Email addresses
- Aadhaar numbers, PAN numbers, Dates of birth
- Addresses, Father/Mother names

## Build for Production

```bash
npm run build
```

**Part of the PII Detection & Masking System - See main project README for backend setup.**
