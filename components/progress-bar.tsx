'use client';

import { useEffect, useState } from 'react';
import { Upload, Sparkles, FileText, Check } from 'lucide-react';

interface ProgressBarProps {
    status: 'uploading' | 'processing' | 'generating' | 'complete' | null;
}

const steps = [
    { id: 'uploading', label: 'Uploading', icon: Upload, message: 'Uploading your transcript...' },
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

export function ProgressBar({ status }: ProgressBarProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    const currentIndex = steps.findIndex(s => s.id === status);
    const currentStep = steps[currentIndex] || steps[0];

    // Rotate through fun messages during processing/generating
    useEffect(() => {
        if (status === 'processing' || status === 'generating') {
            const interval = setInterval(() => {
                setMessageIndex(i => (i + 1) % funMessages.length);
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
        if (status === 'processing' || status === 'generating') {
            return funMessages[messageIndex];
        }
        return currentStep.message;
    };

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
                                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                                        ${isComplete ? 'bg-purple-600 text-white scale-90' : ''}
                                        ${isActive ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30' : ''}
                                        ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                                    `}
                                >
                                    {isComplete ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                    )}
                                </div>
                                <span className={`
                                    text-xs font-medium mt-2 transition-colors duration-300
                                    ${isActive ? 'text-purple-600' : ''}
                                    ${isComplete ? 'text-purple-600' : ''}
                                    ${isPending ? 'text-gray-400' : ''}
                                `}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="w-12 sm:w-20 h-0.5 mx-2 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-200" />
                                    <div
                                        className={`
                                            absolute inset-y-0 left-0 bg-purple-600 transition-all duration-700 ease-out
                                            ${index < currentIndex ? 'w-full' : 'w-0'}
                                        `}
                                    />
                                    {index === currentIndex - 1 && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-400 to-transparent animate-pulse" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Message card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                    <currentStep.icon className={`w-7 h-7 text-purple-600 ${status !== 'complete' ? 'animate-bounce' : ''}`} />
                </div>

                <p className="text-lg font-medium text-gray-900 mb-1">
                    {getMessage()}{status !== 'complete' && dots}
                </p>

                <p className="text-sm text-gray-500">
                    {status === 'complete'
                        ? 'Your reports are ready below'
                        : 'This usually takes about 30 seconds'
                    }
                </p>

                {/* Animated progress bar */}
                {status !== 'complete' && (
                    <div className="mt-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 rounded-full animate-progress" />
                    </div>
                )}
            </div>
        </div>
    );
}
