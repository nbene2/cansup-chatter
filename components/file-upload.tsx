'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileJson } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
}

export function FileUpload({ onFileSelect, selectedFile, onClear }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    if (selectedFile) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileJson className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`
                relative rounded-xl border-2 border-dashed transition-all cursor-pointer
                ${dragActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50"
                }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleChange}
            />

            <div className="flex flex-col items-center py-12 px-4">
                <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
                    ${dragActive ? 'bg-purple-100' : 'bg-gray-100'}
                `}>
                    <Upload className={`w-6 h-6 ${dragActive ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">
                    Drop your JSON file here
                </p>
                <p className="text-sm text-gray-500">
                    or click to browse
                </p>
            </div>
        </div>
    );
}
