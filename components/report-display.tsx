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
            if (!line) return <div key={idx} style={{ height: '12px' }} />;

            if (line.startsWith('Section')) {
                return (
                    <h3 key={idx} style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '28px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
                        {line}
                    </h3>
                );
            }
            if (line.startsWith('- ')) {
                return (
                    <li key={idx} style={{ marginLeft: '20px', listStyleType: 'disc', color: '#374151', marginBottom: '6px', fontSize: '14px', lineHeight: 1.7 }}>
                        {line.replace('- ', '')}
                    </li>
                );
            }

            if (line.includes('|')) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                if (cells.length > 0 && !line.includes('---')) {
                    return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                            {cells.map((cell, i) => (
                                <span key={i} style={{ color: i === 1 ? '#9333ea' : '#4b5563', fontWeight: i === 1 ? 500 : 400, overflowWrap: 'break-word', minWidth: 0 }}>
                                    {cell.trim()}
                                </span>
                            ))}
                        </div>
                    )
                }
                return null;
            }

            return <p key={idx} style={{ color: '#374151', marginBottom: '10px', fontSize: '14px', lineHeight: 1.7 }}>{line}</p>;
        });
    };

    return (
        <div>
            {/* Internal Report */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#fef2f2', padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #fecdd3' }}>
                    <Activity style={{ width: '18px', height: '18px', color: '#dc2626', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: '#7f1d1d', fontSize: '15px', marginLeft: '12px' }}>Internal Report</span>
                    <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>Clinician Only</span>
                </div>
                <div style={{ padding: '24px' }}>
                    {renderContent(internalText)}
                </div>
            </div>

            {/* Family Report */}
            {familyText && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginTop: '24px' }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #bfdbfe' }}>
                        <User style={{ width: '18px', height: '18px', color: '#2563eb', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#1e3a5f', fontSize: '15px', marginLeft: '12px' }}>Family Report</span>
                        <span style={{ fontSize: '11px', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>Patient Friendly</span>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {renderContent(familyText)}
                    </div>
                </div>
            )}
        </div>
    );
}
