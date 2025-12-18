'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ProgressBar } from '@/components/progress-bar';
import { ReportDisplay } from '@/components/report-display';
import { CheckCircle2, ArrowRight, FileSpreadsheet, FileText, Copy, Check } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'uploading' | 'processing' | 'generating' | 'complete' | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;

    setError(null);
    setSheetUrl(null);
    setDocUrl(null);
    setCopied(false);
    setStatus('uploading');

    setTimeout(() => setStatus('processing'), 800);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const interval = setInterval(() => {
        setStatus((prev) => prev === 'uploading' ? 'processing' : prev === 'processing' ? 'generating' : prev);
      }, 4000);

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) {
        throw new Error(data.error || 'Processing Failed');
      }

      setReport(data.report);
      setSheetUrl(data.sheetUrl);
      setDocUrl(data.docUrl);
      setStatus('complete');

    } catch (err: any) {
      setError(err.message);
      setStatus(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
    setSheetUrl(null);
    setDocUrl(null);
    setError(null);
    setCopied(false);
    setStatus(null);
  };

  const handleCopyUrls = () => {
    if (!sheetUrl && !docUrl) return;
    const urlsToCopy = [sheetUrl, docUrl].filter(Boolean).join(', ');
    navigator.clipboard.writeText(urlsToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showInput = !report && status === null;
  const showProgress = status !== null && !report;

  return (
    <main className="min-h-screen px-4 py-8 md:py-16">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/images.jpg"
            alt="Cansup"
            className="w-16 h-auto mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Transcript Analyzer
          </h1>
          <p className="text-gray-500">
            Upload a conversation transcript to generate reports
          </p>
        </div>

        {/* Upload Section */}
        {showInput && (
          <div className="space-y-6">
            <FileUpload
              selectedFile={file}
              onFileSelect={setFile}
              onClear={() => setFile(null)}
            />

            <button
              onClick={handleAnalyze}
              disabled={!file}
              className={`
                w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2
                ${!file
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] shadow-lg shadow-purple-600/20'
                }
              `}
            >
              Generate Reports
              {file && <ArrowRight className="w-5 h-5" />}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {showProgress && (
          <ProgressBar status={status} />
        )}

        {/* Results */}
        {report && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Reports Ready</p>
                <p className="text-sm text-green-700">Your analysis is complete</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-12 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Open Word Chart
                </a>
              )}
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-12 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Open Full Report
                </a>
              )}
              {(sheetUrl || docUrl) && (
                <button
                  onClick={handleCopyUrls}
                  className="flex items-center justify-center gap-2 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copied!" : "Copy Links"}
                </button>
              )}
            </div>

            <ReportDisplay text={report} />

            <button
              onClick={handleReset}
              className="w-full h-12 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
