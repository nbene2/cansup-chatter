'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { AudioUpload } from '@/components/audio-upload';
import { ProgressBar } from '@/components/progress-bar';
import { ReportDisplay } from '@/components/report-display';
import { CheckCircle2, ArrowRight, FileSpreadsheet, FileText, Copy, Check, ChevronDown, RotateCcw } from 'lucide-react';
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

  const handleAnalyze = async (analyzeFile: File) => {
    setStatus('processing');

    const formData = new FormData();
    formData.append('file', analyzeFile);
    formData.append('model', selectedModel);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const interval = setInterval(() => {
        setStatus((prev) => prev === 'processing' ? 'generating' : prev);
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
    <main className="min-h-screen relative bg-[#FAFAFA] text-gray-900 font-sans selection:bg-purple-200">
      <div className="relative z-10 px-4 py-12 md:py-20">
        <div className="absolute top-6 right-6 z-50">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <img
              src="/images.jpg"
              alt="Cansup"
              className="w-16 h-auto mx-auto mb-6 rounded-lg shadow-sm"
              style={{ mixBlendMode: 'multiply' }}
            />
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-3">
              Transcript Analyzer
            </h1>
            <p className="text-gray-500 text-lg">
              Upload a secure clinical recording to generate reports
            </p>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
            {showInput && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Analysis Engine
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as OpenAIModel)}
                      className="w-full appearance-none bg-[#FAFAFA] border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      {MODEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
                    w-full h-14 rounded-xl text-base font-medium transition-all flex items-center justify-center gap-2
                    ${!file
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-[#6A35FF] text-white hover:bg-[#582CD6] shadow-sm shadow-[#6A35FF]/20 active:scale-[0.99]'
                    }
                  `}
                >
                  Upload & Transcribe
                  {file && <ArrowRight className="w-4 h-4" />}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}
              </div>
            )}

            {showProgress && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <ProgressBar status={status} conversionProgress={conversionProgress} />
              </div>
            )}

            {report && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-5 flex items-center gap-4">
                  <div className="bg-white rounded-full p-1 border border-[#DCFCE7] shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#166534]">Analysis Complete</p>
                    <p className="text-sm text-[#15803D]">Medical reports successfully generated</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 bg-[#059669] text-white rounded-xl font-medium hover:bg-[#047857] transition-all shadow-sm active:scale-[0.99]"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      View Frequency Chart
                    </a>
                  )}
                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-all shadow-sm active:scale-[0.99]"
                    >
                      <FileText className="w-4 h-4" />
                      View Full Report
                    </a>
                  )}
                  {(sheetUrl || docUrl) && (
                    <button
                      onClick={handleCopyUrls}
                      className="sm:col-span-2 flex items-center justify-center gap-2 h-12 bg-[#FAFAFA] border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors active:scale-[0.99]"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Links Copied" : "Copy Shared Links"}
                    </button>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#FAFAFA]">
                  <ReportDisplay text={report} />
                </div>

                <button
                  onClick={handleReset}
                  className="w-full h-14 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Process New File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
