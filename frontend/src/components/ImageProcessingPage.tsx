import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import TextInputMask from './TextInputMask';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const UPLOAD_ENDPOINT = import.meta.env.VITE_API_UPLOAD_ENDPOINT || '/upload';

interface PiiItem {
  type: string;
  value: string;
  confidence?: number;
}

const piiTypeColor: Record<string, string> = {
  aadhaar: 'bg-red-100 text-red-700 border-red-300',
  pan: 'bg-orange-100 text-orange-700 border-orange-300',
  driving_license: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  phone: 'bg-blue-100 text-blue-700 border-blue-300',
  email: 'bg-purple-100 text-purple-700 border-purple-300',
  dob: 'bg-pink-100 text-pink-700 border-pink-300',
  name: 'bg-green-100 text-green-700 border-green-300',
  address: 'bg-teal-100 text-teal-700 border-teal-300',
};

const ImageProcessingPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskType, setMaskType] = useState('pixelate');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [originalFileType, setOriginalFileType] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [detectedPii, setDetectedPii] = useState<PiiItem[]>([]);
  const [showMaskedPage, setShowMaskedPage] = useState(false);

  const handleImageSelect = async (file: File) => {
    setError(null);
    setLoading(true);
    setCurrentFile(file);
    setOriginalFileType(file.type);

    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const ocrResponse = await fetch(`${API_BASE_URL}/ocr-text`, {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) throw new Error('OCR failed');

      const ocrData = await ocrResponse.json();
      const extractedText = ocrData.text || '';

      const detectResponse = await fetch(`${API_BASE_URL}/detect-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!detectResponse.ok) throw new Error('PII detection failed');

      const detectData = await detectResponse.json();
      const piiItems: PiiItem[] = detectData.pii_detected || [];

      setDetectedPii(piiItems);
      setShowPopup(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMaskAndDownload = async () => {
    setShowPopup(false);
    setShowMaskedPage(true);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', currentFile!);

      const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}?mask_type=${maskType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process image');

      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImage(processedUrl);

      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = `pii-masked-${maskType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePopupCancel = () => {
    setShowPopup(false);
    setOriginalImage(null);
    setCurrentFile(null);
    setDetectedPii([]);
  };

  const handleMaskTypeChange = (newMaskType: string) => {
    setMaskType(newMaskType);
  };

  const handleReprocess = async () => {
    if (currentFile) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', currentFile);
        const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}?mask_type=${maskType}`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to process image');
        const blob = await response.blob();
        setProcessedImage(URL.createObjectURL(blob));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `pii-masked-${maskType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    setOriginalImage(null);
    setOriginalFileType(null);
    setProcessedImage(null);
    setError(null);
    setCurrentFile(null);
    setMaskType('pixelate');
    setDetectedPii([]);
    setShowPopup(false);
    setShowMaskedPage(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== POPUP ===== */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">⚠️ Sensitive Data Detected</h2>
                <p className="text-sm text-gray-500">
                  This document contains {detectedPii.length} PII item{detectedPii.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detected Items</p>
              {detectedPii.length === 0 ? (
                <p className="text-sm text-gray-400">No specific PII patterns found but document may still contain sensitive info.</p>
              ) : (
                detectedPii.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${piiTypeColor[item.type] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                    <span className="uppercase tracking-wide">{item.type.replace('_', ' ')}</span>
                    <span className="font-mono">{item.value}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
              🔒 Click <strong>"Mask & Download"</strong> to mask all sensitive data and download the protected image.
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePopupCancel}
                className="px-5 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMaskAndDownload}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow hover:from-orange-600 hover:to-red-600 transition-all"
              >
                🔒 Mask & Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== UPLOAD PAGE ===== */}
      {!showMaskedPage && (
        <div className="py-8">
          <div className="container mx-auto px-4">

            {/* ===== HEADER ===== */}
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-2">Team CodeX</p>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                AI-Powered PII Detection and Masking
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Secure your sensitive data with cutting-edge AI. Upload images like Aadhaar, IDs, and documents — we automatically detect and mask personal information.
              </p>
            </div>

            {error && (
              <div className="max-w-md mx-auto mb-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <ImageUpload onImageSelect={handleImageSelect} loading={loading} />

            <div className="flex items-center max-w-2xl mx-auto my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="mx-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <TextInputMask />
          </div>
        </div>
      )}

      {/* ===== MASKED IMAGE PAGE ===== */}
      {showMaskedPage && (
        <div className="h-screen flex flex-col">
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <div className="flex-1">
            <ImagePreview
              originalImage={originalImage!}
              originalFileType={originalFileType}
              processedImage={processedImage || undefined}
              onDownload={handleDownload}
              onReset={handleReset}
              loading={loading}
              maskType={maskType}
              onMaskTypeChange={handleMaskTypeChange}
              onReprocess={handleReprocess}
            />
          </div>
        </div>
      )}

      {/* ===== HOW IT WORKS ===== */}
      {!showMaskedPage && (
        <div className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">OCR Detection</h3>
                <p className="text-sm text-gray-600">Advanced optical character recognition to extract text from images</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">PII Identification</h3>
                <p className="text-sm text-gray-600">Intelligent detection of names, addresses, phone numbers, and more</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Privacy Protection</h3>
                <p className="text-sm text-gray-600">Multiple masking options including pixelation, blur, and colored boxes</p>
              </div>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="text-center py-6 text-sm text-gray-400 border-t border-gray-200 mt-8">
            Developed by&nbsp;
            <span className="font-medium text-gray-600">Ravikumar</span> ·&nbsp;
            <span className="font-medium text-gray-600">Prakhyath P Shetty</span> ·&nbsp;
            <span className="font-medium text-gray-600">Sagar S</span> ·&nbsp;
            <span className="font-medium text-gray-600">Vaibhav G</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default ImageProcessingPage;