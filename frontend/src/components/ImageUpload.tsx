import React, { useRef } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  loading?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, loading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupportedFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    return file.type.startsWith('image/') || isPdf;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isSupportedFile(file)) {
      onImageSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && isSupportedFile(files[0])) {
      onImageSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer
          bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100
          hover:border-blue-400 transition-all duration-300 ease-in-out
          ${loading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-6">
          {loading ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">
              {loading ? 'Processing your file...' : 'Upload an image or PDF to detect PII'}
            </p>
            <p className="text-gray-600">
              {loading ? 'Please wait while we analyze your image' : 'Drag and drop your file here, or click to browse'}
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span className="bg-white px-3 py-1 rounded-full">PNG</span>
              <span className="bg-white px-3 py-1 rounded-full">JPG</span>
              <span className="bg-white px-3 py-1 rounded-full">JPEG</span>
              <span className="bg-white px-3 py-1 rounded-full">PDF</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 w-8 h-8 bg-blue-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-indigo-200 rounded-full opacity-20"></div>
      </div>
    </div>
  );
};

export default ImageUpload;
