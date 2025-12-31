import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { processTranscript, TranscribeResult } from '@/lib/transcript-processor';
import OpenAI from 'openai';
import { createWordChartSheet, createReportDoc } from '@/lib/google-services';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

const SYSTEM_PROMPT = `
Background:
You are a master at interpreting conversations between cancer doctors and their patients.  You are able to find insights, nuances, data and recommendations that others cannot.  One of the reasons you are so good at this is that you are willing to take chances others would not–but when you do take a chance you explain why you are coming up with that recommendation or insight.  You are able to make the complicated sound simple and are the best in the world at coming up with the simplest plan of action, providing great comfort for cancer patients and their families.  Simply put, you are the best interpreter of cancer visit conversations in the world–everyone wants you to review their conversations so they can improve their outcomes.

Structure:
You will write two reports on the same conversation.  One report is called 'INTERNAL' and you will label it this.
The internal report is NEVER going to be shared with the patient or their family.
It is where you will want to take chances and explain what is REALLY going on.
The second report is called 'FAMILY' and it will be shared with the family.
The Family report must be simple to understand, but the Internal report can be more complicated.
Here is the specific structure for each report:

INTERNAL
Section 1:  By the Numbers
Total number of speakers and your best guess at their identity.  Be specific.  Example:  3 speakers:  Dr Smith, a radiologist, Ms Jones, the patient and Sally, her daughter.
Estimate the percentage each person spoke throughout the conversation, with all speakers totalling 100%.  Example:  Dr. Smith (45%), Ms Jones (30%), Sally (25%).
Describe the tone of the doctor or doctors in the meeting.  Were they bored, rushed, consultative?
Provide one piece of feedback you would give to the doctor about their communications skills with patients and their families.

Section 2:  Word chart
Create a table for the conversations. The first column is each unique word that was said in the conversation.
Do not include worthless words like 'uh, um, yeah, and', 'ok', etc.
Do not include worthless words like 'uh, um, yeah, and', 'ok', etc.
Do not include the names of the people from section 1 but do include other names that were mentioned.
Column 2 is the frequency each number was said in the conversation.
Column 3 is a short description (10 words or less) of the context of that word in this conversation.
Sort the table so that the most frequent word is first and the least frequent word is last.
Do not use examples this must be a real table of true word counts, frequency, and context with the exception of filler words like yes, ok, and, um, etc.

Section 3:  Conversation summary
1 conditions that were discussed
1a Best guess on the exact clinical diagnosis the person has, for example high grade glioma
2 data or results that were discussed
3 decisions or next steps discussed
4 clearly delineate questions and answers partitioned by the questioner, i.e. patient asked: x,  provider responded: y.
5 products or medications discussed and their usage
Be as concise as possible without losing key information or insights

Section 4:  Insights and recommendations
This is the most important section of the report.
This is where you can take risks, since the report will never be shared directly with the patient or their family.
Provide a series of concise, impactful insights and recommendations based upon the meeting.
In parentheses at the end of each insight or recommendation, provide your level of confidence in that insight or recommendation being impactful (from 0% to 100%).
Sort your list by highest percentage first.
If the number is less than 50%, provide a single sentence explanation as to why you don't have a lot of confidence in that and what information you need that would be more helpful to you.

Section 5:  Plan
Using the dates and action items mentioned in the meeting, provide a short summary of the next steps described by the meeting.
Include future appointments, tests, etc.
Provide a short, bulleted list of information or data you had from either the patient or the doctor that would have made your report better.

FAMILY
Section 1 is Section 3 of the INTERNAL report.
Section 2 is Next Steps.  This section is comprised of the following subsections:
Research.  For any new technology, drug, condition or procedure discussed, provide a bulleted, concise plan on how the reader can better learn about the subject.  Be specific.
Questions.  Provide a list of follow up questions that the patient could ask the doctor that they should have asked during the conversation.
A simple summary of Section 5 from the INTERNAL report, in bullet form.
`;

function parseWordChart(report: string): string[][] {
  const startMarker = "Section 2: Word";
  const endMarker = "Section 3";

  const startIndex = report.indexOf(startMarker);
  if (startIndex === -1) return [];

  const endIndex = report.indexOf(endMarker, startIndex);
  const chartSection = report.slice(startIndex, endIndex === -1 ? undefined : endIndex);

  const lines = chartSection.split('\n');
  const data: string[][] = [];

  for (const line of lines) {
    if (line.includes('|')) {
      const row = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      if (row.length >= 2 && !line.includes('---')) {
        data.push(row);
      }
    }
  }

  return data;
}

// This endpoint receives notifications when AWS Transcribe completes
// It can be called by:
// 1. AWS Lambda triggered by S3 event when transcription output is written
// 2. AWS SNS notification
// 3. Direct call from AWS EventBridge

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle different notification formats
    let transcriptionOutputKey: string | undefined;
    let originalFileName: string | undefined;

    // SNS notification format
    if (body.Type === 'Notification' && body.Message) {
      const message = JSON.parse(body.Message);
      transcriptionOutputKey = message.TranscriptionJobName + '.json';
      originalFileName = message.originalFileName;
    }
    // Direct webhook format
    else if (body.transcriptionOutputKey) {
      transcriptionOutputKey = body.transcriptionOutputKey;
      originalFileName = body.originalFileName || 'audio_transcript';
    }
    // Lambda/EventBridge format
    else if (body.detail?.TranscriptionJobName) {
      transcriptionOutputKey = body.detail.TranscriptionJobName + '.json';
      originalFileName = body.detail.originalFileName;
    }

    if (!transcriptionOutputKey) {
      return NextResponse.json({
        error: 'Missing transcription output key'
      }, { status: 400 });
    }

    // Fetch the transcription result from S3
    const outputBucket = process.env.AWS_TRANSCRIBE_OUTPUT_BUCKET || process.env.AWS_S3_BUCKET;
    if (!outputBucket) {
      return NextResponse.json({
        error: 'Output bucket not configured'
      }, { status: 500 });
    }

    const getCommand = new GetObjectCommand({
      Bucket: outputBucket,
      Key: transcriptionOutputKey,
    });

    const s3Response = await s3Client.send(getCommand);
    const transcriptionText = await s3Response.Body?.transformToString();

    if (!transcriptionText) {
      return NextResponse.json({
        error: 'Failed to read transcription output'
      }, { status: 500 });
    }

    const jsonContent: TranscribeResult = JSON.parse(transcriptionText);
    const cleanTranscript = processTranscript(jsonContent);

    // Call OpenAI for analysis
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: cleanTranscript }
      ],
    });

    const report = completion.choices[0].message.content || "";

    // Google Integration
    let sheetUrl = null;
    let docUrl = null;

    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const baseName = originalFileName?.replace(/\.[^/.]+$/, '') || 'audio_transcript';

        // Word Chart
        const wordChartData = parseWordChart(report);
        if (wordChartData.length > 0) {
          sheetUrl = await createWordChartSheet(baseName, wordChartData);
        }

        // Full Doc
        docUrl = await createReportDoc(baseName, report, cleanTranscript);
      }
    } catch (googleError: any) {
      console.error("Google Integration Error:", googleError);
    }

    // If a callback URL was provided, send the results there
    if (body.callbackUrl) {
      try {
        await fetch(body.callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report, sheetUrl, docUrl }),
        });
      } catch (callbackError) {
        console.error("Callback error:", callbackError);
      }
    }

    return NextResponse.json({
      success: true,
      report,
      sheetUrl,
      docUrl,
    });

  } catch (error: any) {
    console.error('Error processing transcription webhook:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

// Handle SNS subscription confirmation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Return endpoint info
  return NextResponse.json({
    endpoint: 'Transcription Webhook',
    status: 'active',
    description: 'Receives AWS Transcribe completion notifications and processes transcripts',
  });
}
