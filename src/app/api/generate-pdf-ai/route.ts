import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for PDF generation

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { optimizedText, originalFileName } = await request.json();

    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Optimized text is required' },
        { status: 400 }
      );
    }
    
    // Step 1: Generate beautiful HTML/CSS with AI
    const htmlContent = await generateStyledHTML(optimizedText);
    
    // Step 2: Convert HTML to PDF using Puppeteer
    const pdfBuffer = await convertHTMLtoPDF(htmlContent);

    // Generate filename
    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'cv';
    const fileName = `${baseFileName}_optimized.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function generateStyledHTML(cvText: string): Promise<string> {
  console.log('Generating styled HTML for CV...');
  
  const prompt = `You are an expert CV/resume designer specializing in ATS-optimized resumes. Convert the following OPTIMIZED CV text into a professional, ATS-friendly HTML resume.

CRITICAL REQUIREMENTS:
1. **LENGTH**: Maximum 1-2 pages. Be concise. Remove redundancy.
2. **ATS-FRIENDLY**: 
   - Use simple, clean HTML structure
   - NO tables for layout (use divs with flexbox/grid sparingly)
   - NO images, icons, or graphics
   - Standard section headings: SUMMARY, EXPERIENCE, EDUCATION, SKILLS
   - Simple bullet points (use • character)
3. **STYLING**:
   - Clean, professional look with subtle colors
   - Primary color: #2563eb (blue) for name and section headers only
   - All other text: #1f2937 (dark gray)
   - Font: Arial, sans-serif (ATS-safe)
   - Font sizes: Name 24px, Section headers 14px bold, Body 11px
   - Margins: 0.5 inch all around
   - Line height: 1.4 for readability
4. **STRUCTURE**:
   - Name at top (larger, blue)
   - Contact info on one line below name (email | phone | location | linkedin)
   - Clear section breaks with blue header and thin line
   - Job entries: Company + Title on one line, dates on right
   - Bullet points for achievements (3-5 per role max)
   - Skills as comma-separated list or simple columns
5. **CONTENT**: Use EXACTLY the text provided. Do not add or remove content.

CV TEXT TO FORMAT:
${cvText}

Return ONLY the complete HTML document. No explanations, no markdown.`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an ATS resume expert. Create clean, scannable HTML resumes that pass ATS systems and impress recruiters. Output only valid HTML.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 4000,
    temperature: 0.2,
  });

  let html = response.choices[0]?.message?.content || '';
  
  // Clean up any markdown code blocks if present
  html = html.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();
  
  // Ensure it starts with DOCTYPE
  if (!html.toLowerCase().startsWith('<!doctype')) {
    html = '<!DOCTYPE html>\n' + html;
  }

  return html;
}

async function convertHTMLtoPDF(html: string): Promise<Buffer> {
  // Check if running locally or in production (Vercel)
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  
  let browser;
  
  if (isLocal) {
    // Local development - use regular puppeteer if available
    try {
      const puppeteerFull = await import('puppeteer');
      browser = await puppeteerFull.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch {
      // Fallback to puppeteer-core with chromium
      const executablePath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: executablePath,
        headless: true,
      });
    }
  } else {
    // Production (Vercel) - use @sparticuz/chromium
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: executablePath,
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    
    // Set content and wait for any styles to load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
