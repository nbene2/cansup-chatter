'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileAudio, FileVideo, Mic } from 'lucide-react';

interface AudioUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ALLOWED_EXTENSIONS = ['m4a', 'mp4', 'mp3', 'wav', 'ogg', 'webm', 'flac', 'mov', 'avi'];

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  if (ext && videoExtensions.includes(ext)) {
    return FileVideo;
  }
  return FileAudio;
}

export function AudioUpload({ onFileSelect, selectedFile, onClear }: AudioUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 100MB.');
      return false;
    }

    setError(null);
    return true;
  };

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
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleClear = () => {
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onClear();
  };

  if (selectedFile) {
    const FileIcon = getFileIcon(selectedFile.name);
    return (
      <div className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100/50">
              <FileIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm overflow-hidden text-ellipsis max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5 text-sm text-gray-700 flex items-start sm:items-center gap-2 shadow-sm">
          <div className="mt-0.5 sm:mt-0 p-1 bg-white rounded-full border border-gray-200">
             <Mic className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="font-medium">
            File will be securely transmitted and transcribed using AWS architecture.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all cursor-pointer group
          ${dragActive
            ? "border-indigo-500 bg-indigo-50/50"
            : "border-gray-200 bg-[#FAFAFA] hover:border-indigo-300 hover:bg-white"
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
          accept=".m4a,.mp4,.mp3,.wav,.ogg,.webm,.flac,.mov,.avi,audio/*,video/*"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center py-12 px-4">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors border shadow-sm
            ${dragActive ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200'}
          `}>
            <Upload className={`w-6 h-6 ${dragActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'}`} />
          </div>
          <p className="text-base font-semibold text-gray-900 mb-1">
            Drop your clinical recording here
          </p>
          <p className="text-sm text-gray-500 mb-3 font-medium">
            or click to browse local files
          </p>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            Supports M4A, MP4, MP3, WAV, FLAC, MOV, AVI up to 100MB
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          {error}
        </div>
      )}
    </div>
  );
}
