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
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          <p className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            This file will be uploaded to AWS and automatically transcribed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all cursor-pointer
          ${dragActive
            ? "border-orange-500 bg-orange-50"
            : "border-gray-200 bg-white hover:border-orange-300 hover:bg-gray-50"
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
            w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
            ${dragActive ? 'bg-orange-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-6 h-6 ${dragActive ? 'text-orange-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-base font-medium text-gray-900 mb-1">
            Drop your audio or video file here
          </p>
          <p className="text-sm text-gray-500 mb-2">
            or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported: M4A, MP4, MP3, WAV, OGG, WEBM, FLAC, MOV, AVI (max 100MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
