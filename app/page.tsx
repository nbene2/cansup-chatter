'use client';

import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { FileUpload } from '@/components/file-upload';
import { AudioUpload } from '@/components/audio-upload';
import { ProgressBar } from '@/components/progress-bar';
import { ReportDisplay } from '@/components/report-display';
import { CheckCircle2, ArrowRight, FileSpreadsheet, FileText, Copy, Check, FileJson, Mic, ChevronDown } from 'lucide-react';
import { convertToM4A, needsConversion } from '@/lib/audio-converter';

type UploadMode = 'transcript' | 'audio';

type OpenAIModel = 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini';

const MODEL_OPTIONS: { value: OpenAIModel; label: string; description: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Latest & fastest' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Previous default' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cheap' },
  { value: 'o1', label: 'o1', description: 'Best reasoning' },
  { value: 'o1-mini', label: 'o1 Mini', description: 'Fast reasoning' },
];

export default function Home() {
  const [uploadMode, setUploadMode] = useState<UploadMode>('transcript');
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>('gpt-4o');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'uploading' | 'processing' | 'generating' | 'complete' | 'transcribing' | 'converting' | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);

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
    formData.append('model', selectedModel);

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

  const handleAudioUpload = async () => {
    if (!file) return;

    setError(null);
    setSheetUrl(null);
    setDocUrl(null);
    setCopied(false);
    setPendingTranscription(null);
    setConversionProgress(0);

    let fileToUpload = file;

    try {
      // Check if file needs conversion to m4a
      if (needsConversion(file)) {
        setStatus('converting');

        fileToUpload = await convertToM4A(file, (progress) => {
          setConversionProgress(progress.progress);
        });
      }

      setStatus('uploading');

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload Failed');
      }

      // File uploaded successfully, now waiting for transcription
      setStatus('transcribing');
      setPendingTranscription(data.s3Key);

    } catch (err: any) {
      setError(err.message);
      setStatus(null);
    }
  };

  const handleSubmit = () => {
    if (uploadMode === 'transcript') {
      handleAnalyze();
    } else {
      handleAudioUpload();
    }
  };

  const handleModeChange = (mode: UploadMode) => {
    if (status !== null) return; // Don't change mode while processing
    setUploadMode(mode);
    setFile(null);
    setError(null);
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
    setSheetUrl(null);
    setDocUrl(null);
    setError(null);
    setCopied(false);
    setStatus(null);
    setPendingTranscription(null);
    setConversionProgress(0);
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
    <main className="min-h-screen px-4 py-8 md:py-16 relative">
      {/* User menu */}
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

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
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => handleModeChange('transcript')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all
                  ${uploadMode === 'transcript'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <FileJson className="w-4 h-4" />
                Transcript JSON
              </button>
              <button
                onClick={() => handleModeChange('audio')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all
                  ${uploadMode === 'audio'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Mic className="w-4 h-4" />
                Audio/Video
              </button>
            </div>

            {/* Model Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as OpenAIModel)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Conditional Upload Component */}
            {uploadMode === 'transcript' ? (
              <FileUpload
                selectedFile={file}
                onFileSelect={setFile}
                onClear={() => setFile(null)}
              />
            ) : (
              <AudioUpload
                selectedFile={file}
                onFileSelect={setFile}
                onClear={() => setFile(null)}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!file}
              className={`
                w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2
                ${!file
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : uploadMode === 'transcript'
                    ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] shadow-lg shadow-purple-600/20'
                    : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98] shadow-lg shadow-orange-600/20'
                }
              `}
            >
              {uploadMode === 'transcript' ? 'Generate Reports' : 'Upload & Transcribe'}
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
          <ProgressBar status={status} isAudioMode={uploadMode === 'audio'} conversionProgress={conversionProgress} />
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
