import { google } from 'googleapis';

// Hardcoded folder IDs from notebook
const SHEETS_FOLDER_ID = '1FR4KGeS7hm5PCgKdR6VNqNzUQ3oKxi2L';
const DOCS_FOLDER_ID = '1ARZsqy8EatCAS7kIdtg-LuK_w2Hu51Jq';

function getAuth() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
    }

    const credentials = JSON.parse(credentialsJson);

    return new google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
        ],
    });
}

export async function createWordChartSheet(filename: string, wordChartData: string[][]) {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Create Spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: filename },
        },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // 2. Write Data
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
            values: wordChartData,
        },
    });

    // 3. Move to Folder
    // Get current parents
    const file = await drive.files.get({
        fileId: spreadsheetId,
        fields: 'parents',
    });
    const previousParents = file.data.parents?.join(',') || '';

    // Move
    await drive.files.update({
        fileId: spreadsheetId,
        addParents: SHEETS_FOLDER_ID,
        removeParents: previousParents,
        fields: 'id, parents',
    });

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export async function createReportDoc(filename: string, report: string, transcript: string) {
    const auth = getAuth();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Create Doc
    const doc = await docs.documents.create({
        requestBody: { title: filename },
    });
    const docId = doc.data.documentId!;

    // 2. Insert Content (Reverse order because inserting at index 1 shifts content)
    // We want: [Report] \n\n [Transcript]
    // Insert Transcript first at index 1
    await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
            requests: [
                {
                    insertText: {
                        text: report + "\n\n" + transcript,
                        location: { index: 1 },
                    },
                },
            ],
        },
    });

    // 3. Move to Folder
    const file = await drive.files.get({
        fileId: docId,
        fields: 'parents',
    });
    const previousParents = file.data.parents?.join(',') || '';

    await drive.files.update({
        fileId: docId,
        addParents: DOCS_FOLDER_ID,
        removeParents: previousParents,
        fields: 'id, parents',
    });

    return `https://docs.google.com/document/d/${docId}`;
}
