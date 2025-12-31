import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Load ffmpeg with CORS-enabled URLs
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export type ConversionProgress = {
  progress: number; // 0-100
  message: string;
};

export async function convertToM4A(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<File> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // If already m4a, no conversion needed
  if (extension === 'm4a') {
    return file;
  }

  // Check if it's a format that needs conversion
  const videoFormats = ['mov', 'mp4', 'avi', 'webm', 'mkv', 'wmv', 'flv'];
  const audioFormats = ['wav', 'mp3', 'ogg', 'flac', 'aac', 'wma'];
  const needsConversion = videoFormats.includes(extension || '') || audioFormats.includes(extension || '');

  if (!needsConversion) {
    // Unknown format, try to convert anyway
    console.warn(`Unknown format .${extension}, attempting conversion`);
  }

  onProgress?.({ progress: 5, message: 'Loading converter...' });

  const ffmpeg = await getFFmpeg();

  onProgress?.({ progress: 10, message: 'Preparing file...' });

  // Write input file to ffmpeg virtual filesystem
  const inputFileName = `input.${extension}`;
  const outputFileName = 'output.m4a';

  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  onProgress?.({ progress: 20, message: 'Converting audio...' });

  // Set up progress handler
  ffmpeg.on('progress', ({ progress }) => {
    const percent = Math.round(20 + progress * 70); // Map to 20-90%
    onProgress?.({ progress: percent, message: 'Converting audio...' });
  });

  // Run ffmpeg command: extract audio and convert to AAC
  await ffmpeg.exec([
    '-i', inputFileName,
    '-vn',              // No video
    '-acodec', 'aac',   // AAC codec
    '-b:a', '128k',     // 128kbps bitrate
    outputFileName
  ]);

  onProgress?.({ progress: 95, message: 'Finalizing...' });

  // Read output file
  const data = await ffmpeg.readFile(outputFileName);

  // Clean up
  await ffmpeg.deleteFile(inputFileName);
  await ffmpeg.deleteFile(outputFileName);

  onProgress?.({ progress: 100, message: 'Complete!' });

  // Create new File object
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  // FFmpeg readFile returns Uint8Array for binary files
  if (typeof data === 'string') {
    throw new Error('Unexpected string data from ffmpeg');
  }
  // Create a new Uint8Array copy to ensure proper buffer type
  const uint8Data = new Uint8Array(data as Uint8Array);
  const blob = new Blob([uint8Data] as BlobPart[], { type: 'audio/mp4' });
  return new File([blob], `${baseName}.m4a`, { type: 'audio/mp4' });
}

export function needsConversion(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension !== 'm4a';
}
