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

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                {audioSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative flex-1">
                            {/* Connector Line */}
                            {index < audioSteps.length - 1 && (
                                <div className="absolute top-4 left-[50%] w-full h-[2px] -z-10 px-4">
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
                                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 bg-white
                                    ${isComplete ? 'border-2 border-[#6A35FF] text-[#6A35FF]' : ''}
                                    ${isActive ? 'border-2 border-[#6A35FF] bg-[#6A35FF] text-white shadow-md shadow-[#6A35FF]/20' : ''}
                                    ${isPending ? 'border-2 border-gray-100 text-gray-300' : ''}
                                `}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive && status !== 'complete' ? 'animate-pulse' : ''}`} />
                            </div>
                            
                            <span className={`
                                text-[11px] font-semibold mt-3 uppercase tracking-wider transition-colors duration-300
                                ${isActive || isComplete ? 'text-gray-900' : 'text-gray-400'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-[#FAFAFA] border border-gray-200/60 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-gray-900 mb-1">
                    {currentMessage}
                    {status === 'converting' && <span className="text-gray-500 font-mono ml-2">({Math.round(conversionProgress)}%)</span>}
                </span>
                
                {status !== 'complete' && status !== 'uploading' && (
                    <span className="text-xs text-gray-500 min-h-[16px] animate-in fade-in slide-in-from-bottom-1 key={subMessage}">
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
