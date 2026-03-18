'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { AudioUpload } from '@/components/audio-upload';
import { ProgressBar } from '@/components/progress-bar';
import { ReportDisplay } from '@/components/report-display';
import { CheckCircle2, ArrowRight, FileSpreadsheet, FileText, Copy, Check, ChevronDown, RefreshCcw } from 'lucide-react';
import { convertToM4A, needsConversion } from '@/lib/audio-converter';

type OpenAIModel = 'gpt-5' | 'o1' | 'o1-mini' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';

const MODEL_OPTIONS: { value: OpenAIModel; label: string; description: string }[] = [
  { value: 'o1', label: 'o1', description: 'Best reasoning (default)' },
  { value: 'gpt-5', label: 'GPT-5', description: 'Latest model' },
  { value: 'o1-mini', label: 'o1 Mini', description: 'Fast reasoning' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Fast & capable' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cheap' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Legacy' },
];

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>('o1');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'uploading' | 'processing' | 'generating' | 'complete' | 'transcribing' | 'converting' | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);

  const handleAnalyze = async (analyzeFile: File | null = file) => {
    if (!analyzeFile) return;

    setError(null);
    setSheetUrl(null);
    setDocUrl(null);
    setCopied(false);
    setStatus('uploading');

    setTimeout(() => setStatus('processing'), 800);

    const formData = new FormData();
    formData.append('file', analyzeFile);
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

  // Poll transcription job status
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const pollTranscription = async () => {
      if (!pendingTranscription || status !== 'transcribing') return;

      try {
        const response = await fetch(`/api/check-transcription?jobName=${pendingTranscription}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check transcription status');
        }

        if (data.status === 'COMPLETED') {
          setPendingTranscription(null);
          
          // Create a File from the JSON transcript to pass to analyze
          const jsonString = JSON.stringify(data.transcript);
          const transcriptFile = new File([jsonString], "transcript.json", { type: 'application/json' });
          
          await handleAnalyze(transcriptFile);
        } else if (data.status === 'FAILED') {
          throw new Error(`Transcription failed: ${data.failureReason || 'Unknown error'}`);
        } else {
          // Still processing, poll again in 5 seconds
          timeoutId = setTimeout(pollTranscription, 5000);
        }
      } catch (err: any) {
        setError(err.message);
        setStatus(null);
        setPendingTranscription(null);
      }
    };

    if (pendingTranscription && status === 'transcribing') {
      pollTranscription();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pendingTranscription, status, selectedModel]);

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
      setPendingTranscription(data.jobName);

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
    <main className="min-h-screen relative bg-gradient-to-br from-[#f8f9ff] via-[#ffffff] to-[#fff5f0] overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-orange-200/40 to-rose-200/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 px-4 py-8 md:py-16">
        {/* User menu */}
        <div className="absolute top-4 right-4 z-50">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-1 rounded-2xl bg-gradient-to-b from-white/80 to-white/20 shadow-xl shadow-orange-500/10 mb-6 backdrop-blur-xl border border-white/50">
              <img
                src="/images.jpg"
                alt="Cansup"
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4 font-sans">
              Clinical <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-500">Audio Intelligence</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Upload clinical recordings to instantly generate structured medical reports and word frequency insights.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white max-w-xl mx-auto rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5 transition-all duration-500">
            {/* Upload Section */}
            {showInput && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Model Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Analysis Engine
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as OpenAIModel)}
                      className="w-full appearance-none bg-white/50 border border-gray-200 rounded-2xl px-5 py-4 pr-12 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer transition-all hover:bg-white"
                    >
                      {MODEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>

                <AudioUpload
                  selectedFile={file}
                  onFileSelect={setFile}
                  onClear={() => setFile(null)}
                />

                <button
                  onClick={handleAudioUpload}
                  disabled={!file}
                  className={`
                    w-full h-16 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3
                    ${!file
                      ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 active:scale-[0.98] shadow-xl shadow-orange-500/25 border border-orange-400/20 hover:shadow-2xl hover:shadow-orange-500/40'
                    }
                  `}
                >
                  Upload & Transcribe
                  {file && <ArrowRight className="w-5 h-5" />}
                </button>

                {error && (
                  <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl text-red-600 text-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            {showProgress && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <ProgressBar status={status} conversionProgress={conversionProgress} />
              </div>
            )}

            {/* Results */}
            {report && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
                  <div className="bg-emerald-100 rounded-full p-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-900">Analysis Complete</p>
                    <p className="text-sm text-emerald-700 font-medium">Your medical reports have been securely generated.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 h-14 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      Frequency Chart
                    </a>
                  )}
                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 h-14 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95"
                    >
                      <FileText className="w-5 h-5" />
                      Full Report Doc
                    </a>
                  )}
                  {(sheetUrl || docUrl) && (
                    <button
                      onClick={handleCopyUrls}
                      className="sm:col-span-2 flex items-center justify-center gap-2 h-12 bg-white/50 border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors active:scale-95"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      {copied ? "Links Copied!" : "Copy Links"}
                    </button>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white/80 backdrop-blur-md">
                  <ReportDisplay text={report} />
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleReset}
                    className="group w-full h-16 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm shadow-indigo-500/5 hover:shadow-md hover:shadow-indigo-500/10"
                  >
                    <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                    Process New Recording
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
