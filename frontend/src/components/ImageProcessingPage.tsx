import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const UPLOAD_ENDPOINT = import.meta.env.VITE_API_UPLOAD_ENDPOINT || '/upload';

const ImageProcessingPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskType, setMaskType] = useState('pixelate');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processImage = async (file: File, selectedMaskType: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}?mask_type=${selectedMaskType}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      
      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImage(processedUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);
    setCurrentFile(file);
    
    await processImage(file, maskType);
  };

  const handleMaskTypeChange = (newMaskType: string) => {
    setMaskType(newMaskType);
  };

  const handleReprocess = async () => {
    if (currentFile) {
      await processImage(currentFile, maskType);
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
    setProcessedImage(null);
    setError(null);
    setCurrentFile(null);
    setMaskType('pixelate');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!originalImage && (
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                PII Detection & Masking
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Upload an image containing personally identifiable information (PII) such as 
                Aadhaar cards, ID documents, or forms. Our AI will automatically detect and 
                mask sensitive information to protect privacy.
              </p>
            </div>

            {error && (
              <div className="max-w-md mx-auto mb-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <ImageUpload onImageSelect={handleImageSelect} loading={loading} />
          </div>
        </div>
      )}

      {originalImage && (
        <div className="h-screen flex flex-col">
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex-1">
            <ImagePreview
              originalImage={originalImage}
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

      {!originalImage && (
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
        </div>
      )}
    </div>
  );
};

export default ImageProcessingPage;
