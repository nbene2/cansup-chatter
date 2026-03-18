import { NextRequest, NextResponse } from 'next/server';
import { TranscribeClient, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

export async function GET(req: NextRequest) {
  try {
    const jobName = req.nextUrl.searchParams.get('jobName');

    if (!jobName) {
      return NextResponse.json({ error: 'Missing jobName parameter' }, { status: 400 });
    }

    const transcribeClient = new TranscribeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const getJobCommand = new GetTranscriptionJobCommand({
      TranscriptionJobName: jobName,
    });

    const response = await transcribeClient.send(getJobCommand);
    const job = response.TranscriptionJob;

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const { TranscriptionJobStatus, Transcript } = job;

    if (TranscriptionJobStatus === 'COMPLETED' && Transcript?.TranscriptFileUri) {
      // Fetch the actual transcript JSON from the signed S3 URL
      const transcriptResponse = await fetch(Transcript.TranscriptFileUri);
      
      if (!transcriptResponse.ok) {
        throw new Error('Failed to fetch transcript JSON from AWS');
      }

      const transcriptData = await transcriptResponse.json();

      return NextResponse.json({
        success: true,
        status: TranscriptionJobStatus,
        transcript: transcriptData,
      });
    }

    if (TranscriptionJobStatus === 'FAILED') {
      return NextResponse.json({
        error: 'Transcription job failed',
        failureReason: job.FailureReason,
        status: TranscriptionJobStatus,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: TranscriptionJobStatus,
    });

  } catch (error: any) {
    console.error('Error checking transcription job:', error);
    return NextResponse.json({
      error: error.message || 'Failed to check transcription job'
    }, { status: 500 });
  }
}
