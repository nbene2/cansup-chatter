import { type NextRequest, NextResponse } from 'next/server';

export interface TranscribeItem {
  start_time?: string;
  end_time?: string;
  alternatives: { content: string; confidence: string }[];
  type: 'pronunciation' | 'punctuation';
  speaker_label?: string;
}

export interface TranscribeResult {
  results: {
    items: TranscribeItem[];
  };
}

const FILLER_WORDS = ['um', 'uh', 'hmm', 'ah', 'like', 'oh', 'Oh', 'Uh', 'Um', 'Ah'];

export function processTranscript(data: TranscribeResult): string {
  const items = data.results.items;
  let coherentTranscript = "";
  let currentSpeaker: string | null = null;
  const transcriptParts: string[] = [];

  for (const item of items) {
    const speaker = item.speaker_label;
    const content = item.alternatives[0]?.content;
    
    if (!content) continue;

    if (item.type === 'pronunciation') {
      if (speaker !== currentSpeaker) {
         if (currentSpeaker !== null) {
             transcriptParts.push(`${currentSpeaker}: ${coherentTranscript.trim()}`);
         }
         currentSpeaker = speaker || "Unknown";
         coherentTranscript = "";
      }
      coherentTranscript += " " + content;
    } else if (item.type === 'punctuation') {
      coherentTranscript += content;
    }
  }

  // Add the last part
  if (currentSpeaker !== null) {
      transcriptParts.push(`${currentSpeaker}: ${coherentTranscript.trim()}`);
  }

  let fullTranscript = transcriptParts.join("\n");

  // Clean filler words
  for (const filler of FILLER_WORDS) {
    const pattern = new RegExp(`\\b${filler}\\b`, 'g'); // Simplified regex, ignoring case might be better but sticking to notebook logic which had explicit capitalized versions
    fullTranscript = fullTranscript.replace(pattern, '');
  }

  // Clean extra whitespace
  fullTranscript = fullTranscript.replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1');

  return fullTranscript;
}
