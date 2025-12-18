'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
    status: 'uploading' | 'processing' | 'generating' | 'complete' | null;
}

export function ProgressBar({ status }: ProgressBarProps) {
    const steps = ['uploading', 'processing', 'generating', 'complete'];
    const currentStepIndex = steps.findIndex(s => s === status);
    const progress = Math.max(10, ((currentStepIndex + 1) / steps.length) * 100);

    const [message, setMessage] = useState("Starting...");

    useEffect(() => {
        if (status === 'uploading') setMessage("Uploading transcript...");
        if (status === 'processing') setMessage("Analyzing conversation...");
        if (status === 'generating') setMessage("Generating reports...");
        if (status === 'complete') setMessage("Complete!");
    }, [status]);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="font-medium text-gray-900">{message}</span>
            </div>

            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="text-sm text-gray-500 mt-3">
                This may take a minute...
            </p>
        </div>
    );
}
