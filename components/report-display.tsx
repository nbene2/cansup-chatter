'use client';

import React from 'react';
import { Activity, User } from 'lucide-react';

interface ReportDisplayProps {
    text: string;
}

export function ReportDisplay({ text }: ReportDisplayProps) {
    const internalIndex = text.indexOf('INTERNAL');
    const familyIndex = text.indexOf('FAMILY');

    let internalText = "";
    let familyText = "";

    if (internalIndex !== -1 && familyIndex !== -1) {
        internalText = text.slice(internalIndex, familyIndex);
        familyText = text.slice(familyIndex);
    } else {
        internalText = text;
    }

    const renderContent = (content: string) => {
        return content.split('\n').map((line, idx) => {
            line = line.trim();
            if (!line) return <div key={idx} className="h-3" />;

            if (line.startsWith('Section')) {
                return (
                    <h3 key={idx} className="text-base sm:text-lg font-semibold text-gray-900 mt-7 mb-3 pb-2.5 border-b border-gray-200">
                        {line}
                    </h3>
                );
            }
            if (line.startsWith('- ')) {
                return (
                    <li key={idx} className="ml-5 list-disc text-gray-700 mb-1.5 text-sm sm:text-base leading-relaxed">
                        {line.replace('- ', '')}
                    </li>
                );
            }

            if (line.includes('|')) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                if (cells.length > 0 && !line.includes('---')) {
                    return (
                        <div key={idx} className="grid grid-cols-3 gap-3 sm:gap-4 py-2.5 border-b border-gray-100 text-xs sm:text-sm">
                            {cells.map((cell, i) => (
                                <span key={i} className={`${i === 1 ? 'font-medium text-purple-600' : 'text-gray-600'} break-words min-w-0`}>
                                    {cell.trim()}
                                </span>
                            ))}
                        </div>
                    )
                }
                return null;
            }

            return <p key={idx} className="text-gray-700 mb-2.5 text-sm sm:text-base leading-relaxed">{line}</p>;
        });
    };

    return (
        <div className="space-y-6">
            {/* Internal Report */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-5 py-4 flex items-center border-b border-red-100">
                    <Activity className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-red-600 shrink-0" />
                    <span className="font-semibold text-red-900 text-sm sm:text-base ml-3">Internal Report</span>
                    <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ml-auto">Clinician Only</span>
                </div>
                <div className="p-5 sm:p-7">
                    {renderContent(internalText)}
                </div>
            </div>

            {/* Family Report */}
            {familyText && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-5 py-4 flex items-center border-b border-blue-100">
                        <User className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                        <span className="font-semibold text-blue-900 text-sm sm:text-base ml-3">Family Report</span>
                        <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ml-auto">Patient Friendly</span>
                    </div>
                    <div className="p-5 sm:p-7">
                        {renderContent(familyText)}
                    </div>
                </div>
            )}
        </div>
    );
}
