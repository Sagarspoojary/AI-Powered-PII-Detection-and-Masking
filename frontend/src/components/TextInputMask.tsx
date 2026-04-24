import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface PiiItem {
  type: string;
  value: string;
  confidence?: number;
}

interface DetectResponse {
  original_text: string;
  pii_detected: PiiItem[];
  masked_text: string;
}

const TextInputMask: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [detectedPii, setDetectedPii] = useState<PiiItem[]>([]);
  const [maskedText, setMaskedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/detect-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error('Failed to analyze text');

      const data: DetectResponse = await response.json();

      if (data.pii_detected.length === 0) {
        setError('No sensitive PII detected in the entered text.');
        setLoading(false);
        return;
      }

      setDetectedPii(data.pii_detected);
      setMaskedText(data.masked_text);
      setShowPopup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMaskAndUpload = () => {
    setShowPopup(false);
    setDone(true);
    setInputText(maskedText);
  };

  const handleCancel = () => setShowPopup(false);

  const handleReset = () => {
    setInputText('');
    setMaskedText('');
    setDetectedPii([]);
    setDone(false);
    setError(null);
  };

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

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-orange-400 transition-all duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800">Enter Text to Detect PII</p>
            <p className="text-gray-500 text-sm mt-1">
              Paste text containing Aadhaar, PAN, Driving Licence, phone numbers, etc.
            </p>
          </div>

          <textarea
            className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            rows={5}
            placeholder="e.g. My Aadhaar is 1234 5678 9012, PAN: ABCDE1234F, DL: MH1234567890123"
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); setDone(false); setError(null); }}
            disabled={loading}
          />

          {error && (
            <div className="w-full bg-red-50 border-l-4 border-red-400 p-3 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {done && (
            <div className="w-full bg-green-50 border border-green-300 rounded-xl p-3 text-green-700 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>PII has been masked successfully in the text above.</span>
            </div>
          )}

          <div className="flex gap-3 w-full justify-end">
            {done && (
              <button onClick={handleReset} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">
                Reset
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim() || done}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing...
                </span>
              ) : 'Detect & Mask PII'}
            </button>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
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
                <p className="text-sm text-gray-500">Your text contains personally identifiable information (PII).</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detected PII ({detectedPii.length} items)</p>
              {detectedPii.map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${piiTypeColor[item.type] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                  <span className="uppercase tracking-wide">{item.type.replace('_', ' ')}</span>
                  <span className="font-mono">{item.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Masked Preview</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-gray-700 font-mono break-words">
                {maskedText}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button onClick={handleCancel} className="px-5 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleMaskAndUpload} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow hover:from-orange-600 hover:to-red-600 transition-all">
                ✅ Mask & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextInputMask;