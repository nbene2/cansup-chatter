# Cansup Chatter

A modern web application to transform cancer consultation transcripts into actionable insights for families and doctors.

## Features

- **Upload AWS Transcribe JSON**: Drag and drop your transcript files.
- **Smart Cleaning**: Automatically removes filler words (um, uh, like) and formats the conversation.
- **AI Analysis**: Generates two distinct reports using specific prompts:
    - **Internal**: Deep clinical insights and "straight talk".
    - **Family**: Clear, simplified summary and next steps.
- **Privacy Focused**: Processing happens securely via your API key.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

3.  **Environment Variables (Optional)**:
    Create a `.env.local` file to avoid entering your API key manually:
    ```
    OPENAI_API_KEY=sk-...
    ```

## Deployment on Vercel

1.  Push this repository to GitHub.
2.  Import the project in Vercel.
3.  Add `OPENAI_API_KEY` in the Vercel Project Settings > Environment Variables.
4.  Deploy!
