import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExtension);

    if (!isValidType) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload an audio or video file (m4a, mp4, mp3, wav, etc.)'
      }, { status: 400 });
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 100MB.'
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `uploads/${timestamp}_${sanitizedName}`;

    // Upload to S3
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({
        error: 'S3 bucket not configured'
      }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      Metadata: {
        'original-filename': file.name,
        'upload-timestamp': timestamp.toString(),
      },
    });

    await s3Client.send(putCommand);

    // Return success with the S3 key (the transcription job will be triggered by S3 event)
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully. Transcription will start automatically.',
      s3Key,
      fileName: file.name,
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      error: error.message || 'Failed to upload file'
    }, { status: 500 });
  }
}
