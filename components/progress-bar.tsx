'use client';

import { useEffect, useState } from 'react';
import { Upload, Sparkles, FileText, Check, Mic, RefreshCw, Loader2 } from 'lucide-react';

interface ProgressBarProps {
    status: 'uploading' | 'processing' | 'generating' | 'complete' | 'transcribing' | 'converting' | null;
    conversionProgress?: number;
}

const audioSteps = [
    { id: 'converting', label: 'Preparing', icon: RefreshCw, message: 'Optimizing audio format...' },
    { id: 'uploading', label: 'Uploading', icon: Upload, message: 'Uploading to secure vault...' },
    { id: 'transcribing', label: 'Transcribing', icon: Mic, message: 'AI is transcribing speech...' },
    { id: 'processing', label: 'Analyzing', icon: Sparkles, message: 'Extracting medical insights...' },
    { id: 'generating', label: 'Drafting', icon: FileText, message: 'Writing clinical reports...' },
    { id: 'complete', label: 'Ready', icon: Check, message: 'All done!' },
];

const funMessages = [
    "Reading between the lines...",
    "Connecting clinical dots...",
    "Finding key medical insights...",
    "Polishing the final draft...",
    "Structuring patient data...",
];

const transcribingMessages = [
    "Converting speech to text...",
    "Identifying distinct speakers...",
    "Processing complex audio...",
    "This may take a few minutes...",
];

const convertingMessages = [
    "Extracting audio from video...",
    "Converting to optimized M4A format...",
    "Preparing file for processing...",
];

export function ProgressBar({ status, conversionProgress = 0 }: ProgressBarProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    const currentIndex = audioSteps.findIndex(s => s.id === status);
    const currentStep = audioSteps[currentIndex] || audioSteps[0];

    useEffect(() => {
        if (status === 'processing' || status === 'generating' || status === 'transcribing' || status === 'converting') {
            const messages = status === 'transcribing' ? transcribingMessages
                : status === 'converting' ? convertingMessages
                : funMessages;
            const interval = setInterval(() => {
                setMessageIndex(i => (i + 1) % messages.length);
            }, 3500);
            return () => clearInterval(interval);
        }
    }, [status]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const getMessage = () => {
        if (status === 'converting') {
            return `${convertingMessages[messageIndex % convertingMessages.length]} (${Math.round(conversionProgress)}%)`;
        }
        if (status === 'transcribing') {
            return transcribingMessages[messageIndex % transcribingMessages.length];
        }
        if (status === 'processing' || status === 'generating') {
            return funMessages[messageIndex % funMessages.length];
        }
        return currentStep.message;
    };

    return (
        <div className="w-full bg-white/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white max-w-2xl mx-auto ring-1 ring-gray-900/5 shadow-xl shadow-orange-500/5">
            {/* Steps Timeline Track */}
            <div className="flex items-center justify-between mb-10 relative">
                {audioSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10">
                            {/* Connector Line behind circles */}
                            {index < audioSteps.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] h-1 -z-10 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-1000 ease-in-out ${index < currentIndex ? 'w-full' : 'w-0'}`}
                                    />
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-rose-500/80 to-transparent animate-[shimmer_2s_infinite] w-full" />
                                    )}
                                </div>
                            )}

                            {/* Step Circle */}
                            <div
                                className={`
                                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 transform
                                    ${isComplete ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30' : ''}
                                    ${isActive ? 'bg-white border-2 border-rose-500 text-rose-500 scale-125 shadow-xl shadow-rose-500/30' : ''}
                                    ${isPending ? 'bg-gray-50 border border-gray-200 text-gray-400' : ''}
                                `}
                            >
                                {isComplete ? (
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                ) : (
                                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                )}
                            </div>
                            
                            {/* Step Label */}
                            <span className={`
                                text-[10px] sm:text-xs font-bold mt-4 transition-colors duration-300 uppercase tracking-wider
                                ${isActive ? 'text-rose-600' : ''}
                                ${isComplete ? 'text-rose-600' : ''}
                                ${isPending ? 'text-gray-400' : ''}
                                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Status Card */}
            <div className="bg-gradient-to-br from-[#ffffff] to-[#fffaf8] border border-orange-100/50 rounded-2xl p-6 text-center shadow-lg shadow-orange-500/5 relative overflow-hidden">
                {/* Background ambient glow when active */}
                {status !== 'complete' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-rose-500/5 to-orange-500/5 animate-[pulse_4s_infinite]" />
                )}
                
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-5 relative">
                        {status !== 'complete' && (
                            <div className="absolute inset-0 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
                        )}
                        <currentStep.icon className={`w-7 h-7 text-orange-600 ${status !== 'complete' ? 'animate-pulse' : ''}`} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans tracking-tight">
                        {getMessage()}{status !== 'complete' && <span className="text-orange-500 font-mono inline-block w-8 text-left">{dots}</span>}
                    </h3>

                    <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                        {status === 'complete'
                            ? 'Your clinical analysis is ready. View the insights below.'
                            : status === 'transcribing'
                                ? 'Transcription utilizes secure AWS infrastructure. Long recordings may take up to 5 minutes.'
                                : status === 'converting'
                                    ? 'Ensuring optimal audio bitrate for the transcription model.'
                                    : 'Applying advanced clinical reasoning models. This usually takes 30-45 seconds.'
                        }
                    </p>

                    {/* Progress Loader Bar */}
                    {status !== 'complete' && (
                        <div className="mt-8 w-full max-w-sm mx-auto h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            {status === 'converting' ? (
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300"
                                    style={{ width: `${conversionProgress}%` }}
                                />
                            ) : (
                                <div className="h-full rounded-full w-full bg-gradient-to-r from-orange-400 via-rose-500 to-orange-400 animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
