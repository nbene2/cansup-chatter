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
      <div>
        <div
          style={{ padding: '20px', display: 'flex', alignItems: 'center', borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <div
            style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(199,210,254,0.5)' }}
          >
            <FileIcon style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
          </div>
          <div style={{ marginLeft: '20px', minWidth: 0, flex: 1 }}>
            <p style={{ fontWeight: 600, color: '#111827', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '4px' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={handleClear}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '16px', flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div
          style={{ marginTop: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center' }}
        >
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '50%', border: '1px solid #e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
          </div>
          <p style={{ marginLeft: '14px', fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
            File will be securely transmitted and transcribed using AWS architecture.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`
          relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group
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

        <div className="flex flex-col items-center py-10 sm:py-14 px-6">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors border shadow-sm
            ${dragActive ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200'}
          `}>
            <Upload className={`w-6 h-6 ${dragActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'}`} />
          </div>
          <p className="text-base font-semibold text-gray-900 mb-1.5">
            Drop your clinical recording here
          </p>
          <p className="text-sm text-gray-500 mb-4 font-medium">
            or click to browse local files
          </p>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            Supports M4A, MP4, MP3, WAV, FLAC, MOV, AVI up to 100MB
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#dc2626', fontSize: '14px', fontWeight: 500 }}>
          {error}
        </div>
      )}
    </div>
  );
}
