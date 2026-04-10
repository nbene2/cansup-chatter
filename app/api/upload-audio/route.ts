import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const ALLOWED_TYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];

const ALLOWED_EXTENSIONS = [
  '.m4a', '.mp4', '.mp3', '.wav', '.ogg', '.webm', '.flac', '.mov', '.avi'
];

// Ensure S3 bucket allows browser PUT uploads (CORS)
let corsChecked = false;
async function ensureBucketCors(bucketName: string) {
  if (corsChecked) return;
  try {
    const existing = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    const hasPutRule = existing.CORSRules?.some(rule =>
      rule.AllowedMethods?.includes('PUT')
    );
    if (hasPutRule) {
      corsChecked = true;
      return;
    }
    // Merge: keep existing rules, add ours
    const existingRules = existing.CORSRules || [];
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          ...existingRules,
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['PUT'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }));
    corsChecked = true;
  } catch (e: any) {
    if (e.name === 'NoSuchCORSConfiguration') {
      try {
        await s3Client.send(new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [{
              AllowedHeaders: ['*'],
              AllowedMethods: ['PUT'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            }],
          },
        }));
        corsChecked = true;
      } catch (corsErr: any) {
        console.error('Failed to set bucket CORS:', corsErr.message);
      }
    } else {
      console.warn('Could not check bucket CORS:', e.message);
    }
  }
}

/**
 * GET /api/upload-audio?fileName=...&contentType=...
 * Returns a presigned S3 PUT URL so the browser can upload directly,
 * bypassing Vercel's 4.5 MB serverless body-size limit.
 */
export async function GET(req: NextRequest) {
  try {
    const fileName = req.nextUrl.searchParams.get('fileName');
    const contentType = req.nextUrl.searchParams.get('contentType') || 'application/octet-stream';

    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName parameter' }, { status: 400 });
    }

    const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload an audio or video file (m4a, mp4, mp3, wav, etc.)'
      }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
    }

    await ensureBucketCors(bucketName);

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `uploads/${timestamp}_${sanitizedName}`;

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        'original-filename': fileName,
        'upload-timestamp': timestamp.toString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 600 });

    return NextResponse.json({ presignedUrl, s3Key });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({
      error: error.message || 'Failed to generate upload URL'
    }, { status: 500 });
  }
}

/**
 * POST /api/upload-audio
 *
 * Two flows:
 * 1. JSON body { s3Key, fileName } — presigned-URL flow (preferred).
 *    The file is already in S3; just kick off transcription.
 * 2. FormData with "file" field — legacy direct-upload flow.
 *    Still works for small files under Vercel's 4.5 MB limit.
 */
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    let s3Key: string;
    let fileName: string;

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
    }

    if (ct.includes('application/json')) {
      // ── Presigned-URL flow ──────────────────────────────────
      const body = await req.json();
      s3Key = body.s3Key;
      fileName = body.fileName;

      if (!s3Key || !fileName) {
        return NextResponse.json({ error: 'Missing s3Key or fileName' }, { status: 400 });
      }
    } else {
      // ── Legacy direct-upload flow ───────────────────────────
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExtension);

      if (!isValidType) {
        return NextResponse.json({
          error: 'Invalid file type. Please upload an audio or video file (m4a, mp4, mp3, wav, etc.)'
        }, { status: 400 });
      }

      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({
          error: 'File too large. Maximum size is 100MB.'
        }, { status: 400 });
      }

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      s3Key = `uploads/${timestamp}_${sanitizedName}`;
      fileName = file.name;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          'original-filename': file.name,
          'upload-timestamp': timestamp.toString(),
        },
      }));
    }

    // ── Start transcription job ─────────────────────────────
    const transcribeClient = new TranscribeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const sanitizedJobName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
                                      .replace(/[^a-zA-Z0-9-_.!*'()]/g, '_');
    const jobName = `job_${Date.now()}_${sanitizedJobName}`.substring(0, 200);

    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      Media: {
        MediaFileUri: `s3://${bucketName}/${s3Key}`,
      },
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 4,
      },
    }));

    return NextResponse.json({
      success: true,
      message: 'File uploaded and transcription started.',
      s3Key,
      fileName,
      jobName,
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      error: error.message || 'Failed to upload file'
    }, { status: 500 });
  }
}
