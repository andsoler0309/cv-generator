import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from 'docx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { optimizedText, originalFileName } = await request.json();

    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Optimized text is required' },
        { status: 400 }
      );
    }

    const docxBuffer = await createDocx(optimizedText);

    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'cv';
    const fileName = `${baseFileName}_optimized.docx`;

    return new NextResponse(Buffer.from(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function createDocx(text: string): Promise<Buffer> {
  const lines = text.split('\n');
  const children: Paragraph[] = [];

  const sectionHeaders = /^(experience|education|skills|summary|profile|projects|certifications?|languages?|work\s*history|professional\s*experience|technical\s*skills)/i;
  
  // Color definitions (as hex without #)
  const primaryColor = '2E4F72';
  const secondaryColor = '666666';
  const textColor = '262626';

  let isFirstLine = true;
  let isSecondLine = false;
  let lastWasSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Empty lines
    if (!trimmedLine) {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    // First line - Name (large, bold, primary color)
    if (isFirstLine && trimmedLine.length < 50) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              bold: true,
              size: 36, // 18pt
              color: primaryColor,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 80 },
        })
      );
      isFirstLine = false;
      isSecondLine = true;
      continue;
    }

    // Second line - Title/Role (medium, regular, secondary color)
    if (isSecondLine && trimmedLine.length < 80) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 24, // 12pt
              color: secondaryColor,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 80 },
        })
      );
      isSecondLine = false;
      continue;
    }
    isFirstLine = false;
    isSecondLine = false;

    // Contact info (has email, phone, or linkedin)
    if (
      trimmedLine.includes('@') ||
      /\+?\d{10,}/.test(trimmedLine) ||
      trimmedLine.toLowerCase().includes('linkedin') ||
      trimmedLine.toLowerCase().includes('github')
    ) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 20, // 10pt
              color: '3366CC',
              font: 'Calibri',
            }),
          ],
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Section headers
    if (sectionHeaders.test(trimmedLine)) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.toUpperCase(),
              bold: true,
              size: 24, // 12pt
              color: primaryColor,
              font: 'Calibri',
            }),
          ],
          border: {
            bottom: {
              color: 'CCCCCC',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 120 },
        })
      );
      lastWasSection = true;
      continue;
    }

    // Job titles / Company names (contain dates like 2020, 2021-2023)
    if (/\d{4}/.test(trimmedLine) && trimmedLine.length < 120) {
      // Check if it looks like a company/role line
      if (/[-–|]/.test(trimmedLine) || /\d{4}\s*[-–]\s*(present|\d{4})/i.test(trimmedLine)) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: 22, // 11pt
                color: textColor,
                font: 'Calibri',
              }),
            ],
            spacing: { before: lastWasSection ? 0 : 120, after: 60 },
          })
        );
        lastWasSection = false;
        continue;
      }
    }

    // Bullet points
    if (/^[-*•]/.test(trimmedLine)) {
      const bulletText = trimmedLine.replace(/^[-*•]\s*/, '');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletText,
              size: 22, // 11pt
              color: textColor,
              font: 'Calibri',
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      lastWasSection = false;
      continue;
    }

    // Regular text
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            size: 22, // 11pt
            color: textColor,
            font: 'Calibri',
          }),
        ],
        spacing: { after: 60 },
      })
    );
    lastWasSection = false;
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,   // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
  });

  return await Packer.toBuffer(doc);
}
