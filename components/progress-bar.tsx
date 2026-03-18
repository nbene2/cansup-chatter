'use client';

import { useEffect, useState } from 'react';
import { Upload, Sparkles, FileText, Check, Mic, RefreshCw } from 'lucide-react';

interface ProgressBarProps {
    status: 'uploading' | 'processing' | 'generating' | 'complete' | 'transcribing' | 'converting' | null;
    conversionProgress?: number;
}

const audioSteps = [
    { id: 'converting', label: 'Preparing', icon: RefreshCw },
    { id: 'uploading', label: 'Uploading', icon: Upload },
    { id: 'transcribing', label: 'Transcribing', icon: Mic },
    { id: 'processing', label: 'Analyzing', icon: Sparkles },
    { id: 'generating', label: 'Drafting', icon: FileText },
    { id: 'complete', label: 'Ready', icon: Check },
];

const messages = {
    converting: "Optimizing audio payload...",
    uploading: "Uploading to secure vault...",
    transcribing: "AI transcribing speech...",
    processing: "Extracting clinical insights...",
    generating: "Drafting medical reports...",
    complete: "Analysis finalized."
};

const subMessages = {
    converting: ["Encoding video...", "Compressing...", "Preparing M4A format..."],
    transcribing: ["Identifying speakers...", "Converting speech to text...", "Securing transcription payload..."],
    processing: ["Reading metadata...", "Finding patient insights...", "Understanding patient sentiment..."],
    generating: ["Formatting documents...", "Generating tables...", "Polishing text..."]
};

export function ProgressBar({ status, conversionProgress = 0 }: ProgressBarProps) {
    const [subIndex, setSubIndex] = useState(0);

    const currentIndex = audioSteps.findIndex(s => s.id === status);

    useEffect(() => {
        if (!status || status === 'complete' || status === 'uploading') return;
        const interval = setInterval(() => {
            setSubIndex(i => i + 1);
        }, 2500);
        return () => clearInterval(interval);
    }, [status]);

    if (!status) return null;

    const currentMessage = messages[status as keyof typeof messages] || "";
    const currentSubs = subMessages[status as keyof typeof subMessages];
    const subMessage = currentSubs ? currentSubs[subIndex % currentSubs.length] : "";
    const currentStep = audioSteps[currentIndex];

    return (
        <div className="w-full">
            {/* Step indicators */}
            <div className="flex items-start justify-between mb-8">
                {audioSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative flex-1 min-w-0">
                            {/* Connector Line */}
                            {index < audioSteps.length - 1 && (
                                <div className="absolute top-3 sm:top-3.5 left-1/2 w-full h-[2px] -z-10 px-3 sm:px-4">
                                    <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-[#6A35FF] transition-all duration-700 ease-out ${index < currentIndex ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Circle */}
                            <div
                                className={`
                                    w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 relative z-0
                                    ${isComplete ? 'bg-[#6A35FF] text-white shadow-sm' : ''}
                                    ${isActive ? 'border-2 border-[#6A35FF] bg-white text-[#6A35FF] shadow-md shadow-[#6A35FF]/20 ring-[3px] ring-[#6A35FF]/10' : ''}
                                    ${isPending ? 'border-[1.5px] border-gray-200 bg-white text-gray-300' : ''}
                                `}
                            >
                                {isComplete ? (
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                ) : (
                                    <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isActive && status !== 'complete' ? 'animate-pulse' : ''}`} />
                                )}
                            </div>

                            {/* Label - hidden on mobile to prevent overlap */}
                            <span className={`
                                hidden sm:block text-[10px] font-semibold mt-2.5 uppercase tracking-wider transition-colors duration-300 text-center
                                ${isActive || isComplete ? 'text-gray-900' : 'text-gray-400'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Status message area */}
            <div className="bg-[#FAFAFA] border border-gray-200/60 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                {/* Show current step label on mobile since stepper labels are hidden */}
                {currentStep && status !== 'complete' && (
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-widest text-[#6A35FF] mb-2">
                        {currentStep.label}
                    </span>
                )}

                <span className="text-sm font-semibold text-gray-900 mb-1">
                    {currentMessage}
                    {status === 'converting' && <span className="text-gray-500 font-mono ml-2">({Math.round(conversionProgress)}%)</span>}
                </span>

                {status !== 'complete' && status !== 'uploading' && (
                    <span key={subMessage} className="text-xs text-gray-500 min-h-[16px] animate-in fade-in slide-in-from-bottom-1">
                        {subMessage}
                    </span>
                )}

                {status !== 'complete' && (
                    <div className="w-48 h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
                       <div className="h-full bg-[#6A35FF] rounded-full w-full animate-progress" />
                    </div>
                )}
            </div>
        </div>
    );
}
