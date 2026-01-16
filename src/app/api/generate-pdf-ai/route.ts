import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Colors
const COLORS = {
  primary: '#2563eb',      // Blue for name and headers
  text: '#1f2937',         // Dark gray for body text
  secondary: '#6b7280',    // Medium gray for dates/secondary text
  light: '#9ca3af',        // Light gray for subtle elements
  link: '#2563eb',         // Blue for links
};

export async function POST(request: NextRequest) {
  try {
    const { optimizedText, originalFileName } = await request.json();

    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Optimized text is required' },
        { status: 400 }
      );
    }

    console.log('📄 Generating PDF with pdfkit...');
    
    const pdfBuffer = await generatePDF(optimizedText);

    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'cv';
    const fileName = `${baseFileName}_optimized.pdf`;

    console.log('✅ PDF generated successfully');

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

async function generatePDF(cvText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Parse and render the CV
      renderCV(doc, cvText);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderCV(doc: PDFKit.PDFDocument, cvText: string) {
  const lines = cvText.split('\n');
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  
  let isFirstLine = true;
  let isContactLine = false;
  let currentSection = '';
  
  // Section patterns
  const sectionPattern = /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS?|LANGUAGES?|PROFESSIONAL EXPERIENCE|WORK HISTORY|TECHNICAL SKILLS|PROFILE|ABOUT)$/i;
  const datePattern = /\b(19|20)\d{2}\b.*?(present|current|19|20)\d{0,2}/i;
  const contactPattern = /@|linkedin|github|\+\d{10,}|\.com/i;
  const bulletPattern = /^[\s]*[-•*▸►]\s*/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      doc.moveDown(0.3);
      continue;
    }

    // Check if we need a new page
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }

    // First non-empty line is the name
    if (isFirstLine && line.length < 50) {
      doc.fontSize(22)
         .fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .text(line, { align: 'left' });
      doc.moveDown(0.2);
      isFirstLine = false;
      isContactLine = true;
      continue;
    }

    // Contact info line (usually second line with email, phone, etc.)
    if (isContactLine && (contactPattern.test(line) || i <= 3)) {
      doc.fontSize(9)
         .fillColor(COLORS.secondary)
         .font('Helvetica')
         .text(sanitizeText(line), { align: 'left' });
      
      if (!contactPattern.test(lines[i + 1] || '')) {
        isContactLine = false;
        doc.moveDown(0.8);
      } else {
        doc.moveDown(0.1);
      }
      continue;
    }
    isContactLine = false;
    isFirstLine = false;

    // Section headers
    if (sectionPattern.test(line)) {
      currentSection = line.toUpperCase();
      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .text(line.toUpperCase());
      
      // Draw line under header
      doc.moveTo(doc.x, doc.y + 2)
         .lineTo(doc.x + pageWidth, doc.y + 2)
         .strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.4);
      continue;
    }

    // Job title / Company lines (contain dates)
    if (datePattern.test(line)) {
      doc.fontSize(10)
         .fillColor(COLORS.text)
         .font('Helvetica-Bold')
         .text(sanitizeText(line), { align: 'left' });
      doc.moveDown(0.2);
      continue;
    }

    // Company/Role lines without dates but look like headers (short, no bullet)
    if (!bulletPattern.test(line) && line.length < 80 && !line.includes('.') && 
        (currentSection === 'EXPERIENCE' || currentSection === 'PROFESSIONAL EXPERIENCE' || currentSection === 'WORK HISTORY')) {
      // Check if next line has a date - if so, this is likely a company name
      const nextLine = lines[i + 1] || '';
      if (datePattern.test(nextLine) || line.includes(' - ') || line.includes(' | ')) {
        doc.fontSize(10)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(sanitizeText(line));
        doc.moveDown(0.1);
        continue;
      }
    }

    // Bullet points
    if (bulletPattern.test(line)) {
      const bulletText = line.replace(bulletPattern, '').trim();
      const bulletX = doc.x;
      
      doc.fontSize(9)
         .fillColor(COLORS.text)
         .font('Helvetica')
         .text('•', bulletX, doc.y, { continued: false });
      
      doc.fontSize(9)
         .text(sanitizeText(bulletText), bulletX + 12, doc.y - 11, {
           width: pageWidth - 12,
           align: 'left',
         });
      doc.moveDown(0.1);
      continue;
    }

    // Skills section - often comma-separated or special formatting
    if (currentSection === 'SKILLS' || currentSection === 'TECHNICAL SKILLS') {
      doc.fontSize(9)
         .fillColor(COLORS.text)
         .font('Helvetica')
         .text(sanitizeText(line), { align: 'left' });
      doc.moveDown(0.2);
      continue;
    }

    // Education entries
    if (currentSection === 'EDUCATION') {
      if (line.includes('University') || line.includes('College') || line.includes('Degree') || line.includes('Master') || line.includes('Bachelor')) {
        doc.fontSize(10)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(sanitizeText(line));
      } else {
        doc.fontSize(9)
           .fillColor(COLORS.secondary)
           .font('Helvetica')
           .text(sanitizeText(line));
      }
      doc.moveDown(0.2);
      continue;
    }

    // Regular text
    doc.fontSize(9)
       .fillColor(COLORS.text)
       .font('Helvetica')
       .text(sanitizeText(line), {
         width: pageWidth,
         align: 'left',
       });
    doc.moveDown(0.2);
  }
}

// Sanitize text to remove characters that pdfkit can't handle
function sanitizeText(text: string): string {
  return text
    // Replace special quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace special bullets (keep standard bullet)
    .replace(/[▸►◆◇■□●○]/g, '•')
    // Replace special dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Replace other problematic characters
    .replace(/[\u00A0]/g, ' ')  // Non-breaking space
    .replace(/[\u2026]/g, '...') // Ellipsis
    .replace(/[\u00B7]/g, '•')   // Middle dot
    // Remove or replace checkmarks and other symbols
    .replace(/[✓✔☑]/g, '[x]')
    .replace(/[✗✘☐]/g, '[ ]')
    // Keep only ASCII and common extended chars
    .replace(/[^\x20-\x7E\xA0-\xFF•]/g, '');
}
