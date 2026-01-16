# CV Optimizer

An AI-powered web application that intelligently adapts your CV to specific job descriptions while preserving complete factual integrity.

## Features

- **📄 CV Upload** - Support for PDF, DOCX, or paste text directly
- **🎯 Job Description Analysis** - Extract key requirements, skills, and keywords
- **✨ AI-Powered Optimization** - Uses GPT-4 to intelligently rewrite and optimize
- **🛡️ Integrity Guaranteed** - Never adds fake experience or alters core data
- **📊 Match Score** - See how well your CV matches the job description
- **📝 Change Summary** - Detailed explanation of what was changed and why

## What It Does

- Rewrites bullet points to match job terminology
- Reorders points to prioritize relevant experience
- Adds keywords already supported by your CV
- Improves clarity and impact
- Refines your professional summary

## What It Never Does

- Add new jobs, companies, or roles
- Invent skills or certifications
- Change dates or timelines
- Alter contact information
- Add experience not implied by your CV

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

Copy the example environment file and add your OpenAI API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your key:

```
OPENAI_API_KEY=sk-your-api-key-here
```

> **Note:** The app works without an API key using rule-based optimization, but AI-powered optimization requires a valid OpenAI API key.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini (configurable)
- **Icons**: Lucide React
- **PDF Parsing**: pdfjs-dist
- **DOCX Parsing**: Mammoth

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze-job/    # Job description analysis
│   │   ├── optimize/       # AI-powered CV optimization
│   │   └── parse-cv/       # PDF/DOCX parsing
│   ├── optimize/           # Main optimizer page
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # Reusable UI components
└── types/                  # TypeScript type definitions
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | Your OpenAI API key |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4o-mini`) |

*The app falls back to rule-based optimization if not provided.

## API Endpoints

### POST `/api/parse-cv`
Parses uploaded PDF or DOCX files and extracts text.

### POST `/api/analyze-job`
Analyzes a job description and extracts keywords, skills, and requirements.

### POST `/api/optimize`
Optimizes the CV for the given job description using AI.

**Request body:**
```json
{
  "cvText": "Full CV text content",
  "jobDescription": "Full job description text",
  "preferences": {
    "tone": "professional",
    "emphasis": ["leadership", "technical"],
    "targetSeniority": "senior"
  }
}
```

## Deploy

Deploy on [Vercel](https://vercel.com) for the best experience with Next.js:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add `OPENAI_API_KEY` to environment variables
4. Deploy!
