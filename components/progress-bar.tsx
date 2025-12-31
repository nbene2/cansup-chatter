'use client';

import { useEffect, useState } from 'react';
import { Upload, Sparkles, FileText, Check, Mic, RefreshCw } from 'lucide-react';

interface ProgressBarProps {
    status: 'uploading' | 'processing' | 'generating' | 'complete' | 'transcribing' | 'converting' | null;
    isAudioMode?: boolean;
    conversionProgress?: number;
}

const transcriptSteps = [
    { id: 'uploading', label: 'Uploading', icon: Upload, message: 'Uploading your transcript...' },
    { id: 'processing', label: 'Analyzing', icon: Sparkles, message: 'AI is reading the conversation...' },
    { id: 'generating', label: 'Generating', icon: FileText, message: 'Writing your reports...' },
    { id: 'complete', label: 'Done', icon: Check, message: 'All done!' },
];

const audioSteps = [
    { id: 'converting', label: 'Converting', icon: RefreshCw, message: 'Converting to audio format...' },
    { id: 'uploading', label: 'Uploading', icon: Upload, message: 'Uploading your audio file...' },
    { id: 'transcribing', label: 'Transcribing', icon: Mic, message: 'AWS is transcribing your audio...' },
    { id: 'processing', label: 'Analyzing', icon: Sparkles, message: 'AI is reading the conversation...' },
    { id: 'generating', label: 'Generating', icon: FileText, message: 'Writing your reports...' },
    { id: 'complete', label: 'Done', icon: Check, message: 'All done!' },
];

const funMessages = [
    "Reading between the lines...",
    "Connecting the dots...",
    "Finding key insights...",
    "Almost there...",
    "Putting it all together...",
];

const transcribingMessages = [
    "Converting speech to text...",
    "Identifying speakers...",
    "Processing audio...",
    "This may take a few minutes...",
];

const convertingMessages = [
    "Extracting audio from video...",
    "Converting to M4A format...",
    "Optimizing for transcription...",
];

export function ProgressBar({ status, isAudioMode = false, conversionProgress = 0 }: ProgressBarProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    const steps = isAudioMode ? audioSteps : transcriptSteps;
    const currentIndex = steps.findIndex(s => s.id === status);
    const currentStep = steps[currentIndex] || steps[0];

    // Rotate through fun messages during processing/generating/transcribing/converting
    useEffect(() => {
        if (status === 'processing' || status === 'generating' || status === 'transcribing' || status === 'converting') {
            const messages = status === 'transcribing' ? transcribingMessages
                : status === 'converting' ? convertingMessages
                : funMessages;
            const interval = setInterval(() => {
                setMessageIndex(i => (i + 1) % messages.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [status]);

    // Animate dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 400);
        return () => clearInterval(interval);
    }, []);

    const getMessage = () => {
        if (status === 'converting') {
            return `${convertingMessages[messageIndex % convertingMessages.length]} (${conversionProgress}%)`;
        }
        if (status === 'transcribing') {
            return transcribingMessages[messageIndex % transcribingMessages.length];
        }
        if (status === 'processing' || status === 'generating') {
            return funMessages[messageIndex % funMessages.length];
        }
        return currentStep.message;
    };

    const accentColor = isAudioMode ? 'orange' : 'purple';

    return (
        <div className="w-full">
            {/* Steps */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className="flex items-center">
                            {/* Step circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500
                                        ${isComplete ? (isAudioMode ? 'bg-orange-600 text-white scale-90' : 'bg-purple-600 text-white scale-90') : ''}
                                        ${isActive ? (isAudioMode ? 'bg-orange-600 text-white scale-110 shadow-lg shadow-orange-600/30' : 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30') : ''}
                                        ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                                    `}
                                >
                                    {isComplete ? (
                                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                    )}
                                </div>
                                <span className={`
                                    text-xs font-medium mt-2 transition-colors duration-300 hidden sm:block
                                    ${isActive ? (isAudioMode ? 'text-orange-600' : 'text-purple-600') : ''}
                                    ${isComplete ? (isAudioMode ? 'text-orange-600' : 'text-purple-600') : ''}
                                    ${isPending ? 'text-gray-400' : ''}
                                `}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="w-6 sm:w-12 md:w-16 h-0.5 mx-1 sm:mx-2 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-200" />
                                    <div
                                        className={`
                                            absolute inset-y-0 left-0 transition-all duration-700 ease-out
                                            ${isAudioMode ? 'bg-orange-600' : 'bg-purple-600'}
                                            ${index < currentIndex ? 'w-full' : 'w-0'}
                                        `}
                                    />
                                    {index === currentIndex - 1 && (
                                        <div className={`absolute inset-0 animate-pulse ${isAudioMode ? 'bg-gradient-to-r from-orange-600 via-orange-400 to-transparent' : 'bg-gradient-to-r from-purple-600 via-purple-400 to-transparent'}`} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Message card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isAudioMode ? 'bg-orange-50' : 'bg-purple-50'}`}>
                    <currentStep.icon className={`w-7 h-7 ${isAudioMode ? 'text-orange-600' : 'text-purple-600'} ${status !== 'complete' ? 'animate-bounce' : ''}`} />
                </div>

                <p className="text-lg font-medium text-gray-900 mb-1">
                    {getMessage()}{status !== 'complete' && dots}
                </p>

                <p className="text-sm text-gray-500">
                    {status === 'complete'
                        ? 'Your reports are ready below'
                        : status === 'transcribing'
                            ? 'Transcription can take a few minutes depending on file size'
                            : status === 'converting'
                                ? 'Converting video to audio format'
                                : 'This usually takes about 30 seconds'
                    }
                </p>

                {/* Progress bar */}
                {status !== 'complete' && (
                    <div className="mt-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        {status === 'converting' ? (
                            // Fixed progress bar for conversion
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isAudioMode ? 'bg-orange-600' : 'bg-purple-600'}`}
                                style={{ width: `${conversionProgress}%` }}
                            />
                        ) : (
                            // Animated progress bar for other states
                            <div className={`h-full rounded-full animate-progress ${isAudioMode ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500' : 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500'}`} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
