import React from 'react';

interface ImagePreviewProps {
  originalImage: string;
  originalFileType?: string | null;
  processedImage?: string;
  onDownload: () => void;
  onReset: () => void;
  loading?: boolean;
  maskType: string;
  onMaskTypeChange: (maskType: string) => void;
  onReprocess: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  originalFileType = null,
  processedImage,
  onDownload,
  onReset,
  loading = false,
  maskType,
  onMaskTypeChange,
  onReprocess
}) => {
  const maskingOptions = [
    { value: 'pixelate', label: '🎮 Pixelate', description: 'Retro pixelated effect' },
    { value: 'blur', label: '🌀 Blur', description: 'Smooth blur effect' },
    { value: 'black', label: '⬛ Black Box', description: 'Classic black rectangle' },
    { value: 'red', label: '🔴 Red Box', description: 'Red colored rectangle' }
  ];

  return (
    <div className="h-full flex">
      {/* Options Side Panel - Fixed Width */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header with Actions */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            PII Detection & Masking
          </h2>
          <div className="flex flex-col space-y-3">
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>New Upload</span>
            </button>
            {processedImage && (
              <button
                onClick={onDownload}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>
            )}
          </div>
        </div>

        {/* Masking Options */}
        <div className="p-6 flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Masking Options
          </h3>
          
          <div className="space-y-3">
            {maskingOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  maskType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => onMaskTypeChange(option.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{option.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    maskType === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {maskType === option.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {processedImage && maskType !== 'pixelate' && (
            <button
              onClick={onReprocess}
              disabled={loading}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Processing...' : 'Apply Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Images Container - Full Remaining Width */}
      <div className="flex-1 bg-white shadow-lg flex flex-col">
        {/* Processing Status */}
        {loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-700 font-medium">
                Processing image to detect and mask PII... This may take a few moments.
              </p>
            </div>
          </div>
        )}

        {/* Full Width Image Comparison */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200">
          {/* Original Image */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center p-4 bg-gray-50 border-b border-gray-200">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <h3 className="font-semibold text-gray-800 text-lg">Original Image</h3>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
              {originalFileType === 'application/pdf' ? (
                <embed
                  src={originalImage}
                  type="application/pdf"
                  className="w-full h-full rounded-lg shadow-md"
                />
              ) : (
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
          </div>

          {/* Processed Image */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center p-4 bg-gray-50 border-b border-gray-200">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                loading ? 'bg-yellow-500' : processedImage ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {loading ? 'Processing...' : 'PII Masked Image'}
              </h3>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing image...</p>
                </div>
              ) : processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Processed image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span>Original</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  loading ? 'bg-yellow-500' : processedImage ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span>Processed ({maskingOptions.find(opt => opt.value === maskType)?.label || maskType})</span>
              </div>
            </div>
            {processedImage && (
              <div className="text-sm text-green-600 font-medium">
                ✓ PII Detection Complete
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
