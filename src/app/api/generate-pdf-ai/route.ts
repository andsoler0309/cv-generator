import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Colors
const COLORS = {
  primary: rgb(0.145, 0.388, 0.922),    // #2563eb - Blue
  text: rgb(0.122, 0.161, 0.216),        // #1f2937 - Dark gray
  secondary: rgb(0.420, 0.451, 0.498),   // #6b7280 - Medium gray
  line: rgb(0.898, 0.902, 0.918),        // #e5e7eb - Light gray
};

interface CVSection {
  type: 'name' | 'contact' | 'section_header' | 'job_title' | 'job_details' | 'bullet' | 'text' | 'skill_group';
  content: string;
  secondary?: string; // For dates, locations, etc.
}

interface StructuredCV {
  sections: CVSection[];
}

export async function POST(request: NextRequest) {
  try {
    const { optimizedText, originalFileName } = await request.json();

    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Optimized text is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Using AI to structure CV for PDF...');
    
    // Step 1: Use AI to parse and structure the CV
    const structuredCV = await parseWithAI(optimizedText);
    
    console.log('📄 Generating PDF with pdf-lib...');
    
    // Step 2: Render the structured CV to PDF
    const pdfBytes = await generatePDF(structuredCV);

    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'cv';
    const fileName = `${baseFileName}_optimized.pdf`;

    console.log('✅ PDF generated successfully');

    return new NextResponse(new Uint8Array(pdfBytes), {
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

async function parseWithAI(cvText: string): Promise<StructuredCV> {
  const prompt = `Parse this CV text into a structured JSON format for PDF generation. 

RULES:
1. Identify the person's name (usually first line)
2. Identify contact info (email, phone, LinkedIn, location)
3. Identify section headers (EXPERIENCE, EDUCATION, SKILLS, etc.)
4. For jobs: extract title, company, dates separately
5. Identify bullet points (achievements/responsibilities)
6. Group skills appropriately

Return JSON in this EXACT format:
{
  "sections": [
    {"type": "name", "content": "John Doe"},
    {"type": "contact", "content": "john@email.com | +1234567890 | LinkedIn: /in/johndoe | New York, NY"},
    {"type": "section_header", "content": "PROFESSIONAL EXPERIENCE"},
    {"type": "job_title", "content": "Senior Software Engineer", "secondary": "2022 - Present"},
    {"type": "job_details", "content": "Google", "secondary": "Mountain View, CA"},
    {"type": "bullet", "content": "Led development of microservices architecture serving 1M+ users"},
    {"type": "bullet", "content": "Reduced system latency by 40% through optimization"},
    {"type": "section_header", "content": "EDUCATION"},
    {"type": "text", "content": "Master of Computer Science, Stanford University, 2020"},
    {"type": "section_header", "content": "SKILLS"},
    {"type": "skill_group", "content": "Python, Java, TypeScript, Go, SQL, AWS, Docker, Kubernetes"}
  ]
}

CV TEXT:
${cvText}

Return ONLY valid JSON, no explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You parse CVs into structured JSON. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    if (!result.sections || !Array.isArray(result.sections)) {
      // Fallback to basic parsing
      return fallbackParse(cvText);
    }
    
    return result;
  } catch (error) {
    console.error('AI parsing failed, using fallback:', error);
    return fallbackParse(cvText);
  }
}

function fallbackParse(cvText: string): StructuredCV {
  const lines = cvText.split('\n').filter(l => l.trim());
  const sections: CVSection[] = [];
  
  const sectionPattern = /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS?|LANGUAGES?|PROFESSIONAL EXPERIENCE|WORK HISTORY|TECHNICAL SKILLS|PROFILE|ABOUT)$/i;
  const bulletPattern = /^[\s]*[-•*]\s*/;
  
  let isFirst = true;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (isFirst) {
      sections.push({ type: 'name', content: trimmed });
      isFirst = false;
      continue;
    }
    
    if (sections.length === 1 && (trimmed.includes('@') || trimmed.includes('linkedin'))) {
      sections.push({ type: 'contact', content: trimmed });
      continue;
    }
    
    if (sectionPattern.test(trimmed)) {
      sections.push({ type: 'section_header', content: trimmed.toUpperCase() });
      continue;
    }
    
    if (bulletPattern.test(trimmed)) {
      sections.push({ type: 'bullet', content: trimmed.replace(bulletPattern, '') });
      continue;
    }
    
    sections.push({ type: 'text', content: trimmed });
  }
  
  return { sections };
}

async function generatePDF(cv: StructuredCV): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y - requiredSpace < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };
  
  const drawText = (
    text: string, 
    x: number, 
    fontSize: number, 
    font: typeof helvetica, 
    color: typeof COLORS.text,
    maxWidth?: number
  ) => {
    const cleanText = sanitizeText(text);
    const words = cleanText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    const effectiveWidth = maxWidth || contentWidth;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > effectiveWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    for (const line of lines) {
      addNewPageIfNeeded(fontSize + 4);
      page.drawText(line, { x, y, size: fontSize, font, color });
      y -= fontSize + 4;
    }
    
    return lines.length * (fontSize + 4);
  };
  
  for (const section of cv.sections) {
    switch (section.type) {
      case 'name':
        addNewPageIfNeeded(30);
        page.drawText(sanitizeText(section.content), {
          x: margin,
          y,
          size: 24,
          font: helveticaBold,
          color: COLORS.primary,
        });
        y -= 32;
        break;
        
      case 'contact':
        addNewPageIfNeeded(16);
        page.drawText(sanitizeText(section.content), {
          x: margin,
          y,
          size: 10,
          font: helvetica,
          color: COLORS.secondary,
        });
        y -= 24;
        break;
        
      case 'section_header':
        y -= 12; // Extra space before section
        addNewPageIfNeeded(30);
        page.drawText(sanitizeText(section.content), {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: COLORS.primary,
        });
        y -= 4;
        // Draw line under header
        page.drawLine({
          start: { x: margin, y },
          end: { x: margin + contentWidth, y },
          thickness: 0.5,
          color: COLORS.line,
        });
        y -= 12;
        break;
        
      case 'job_title':
        addNewPageIfNeeded(20);
        const titleText = sanitizeText(section.content);
        page.drawText(titleText, {
          x: margin,
          y,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        if (section.secondary) {
          const dateText = sanitizeText(section.secondary);
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 10);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y,
            size: 10,
            font: helvetica,
            color: COLORS.secondary,
          });
        }
        y -= 16;
        break;
        
      case 'job_details':
        addNewPageIfNeeded(16);
        const companyText = sanitizeText(section.content);
        page.drawText(companyText, {
          x: margin,
          y,
          size: 10,
          font: helvetica,
          color: COLORS.secondary,
        });
        if (section.secondary) {
          const locText = sanitizeText(section.secondary);
          const locWidth = helvetica.widthOfTextAtSize(locText, 10);
          page.drawText(locText, {
            x: pageWidth - margin - locWidth,
            y,
            size: 10,
            font: helvetica,
            color: COLORS.secondary,
          });
        }
        y -= 14;
        break;
        
      case 'bullet':
        addNewPageIfNeeded(16);
        page.drawText('•', {
          x: margin + 4,
          y,
          size: 10,
          font: helvetica,
          color: COLORS.text,
        });
        drawText(section.content, margin + 16, 10, helvetica, COLORS.text, contentWidth - 16);
        break;
        
      case 'skill_group':
        addNewPageIfNeeded(16);
        drawText(section.content, margin, 10, helvetica, COLORS.text);
        y -= 4;
        break;
        
      case 'text':
      default:
        addNewPageIfNeeded(16);
        drawText(section.content, margin, 10, helvetica, COLORS.text);
        break;
    }
  }
  
  return await pdfDoc.save();
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[▸►◆◇■□●○•]/g, '-')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00B7]/g, '-')
    .replace(/[✓✔☑]/g, '[x]')
    .replace(/[✗✘☐]/g, '[ ]')
    .replace(/[^\x20-\x7E]/g, '');
}
