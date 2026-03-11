/**
 * Document Generator
 * Genera documentos en varios formatos: DOCX, XLSX, PDF, TXT
 */

import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

interface DocContent {
  title?: string;
  content: string;
  sections?: Array<{ heading: string; content: string }>;
}

interface ExcelContent {
  sheets: Array<{
    name: string;
    data: Array<Record<string, string | number>>;
  }>;
}

/**
 * Genera un documento DOCX
 */
export async function generateDocx(docContent: DocContent): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (docContent.title) {
    children.push(
      new Paragraph({
        text: docContent.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    children.push(new Paragraph({ text: '' }));
  }

  if (docContent.sections) {
    for (const section of docContent.sections) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
        })
      );
      children.push(
        new Paragraph({
          text: section.content,
        })
      );
      children.push(new Paragraph({ text: '' }));
    }
  } else if (docContent.content) {
    // Dividir contenido por líneas
    const lines = docContent.content.split('\n');
    for (const line of lines) {
      children.push(new Paragraph({ text: line }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Genera un archivo Excel (.xlsx)
 */
export async function generateExcel(excelContent: ExcelContent): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  for (const sheet of excelContent.sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Genera un archivo PDF
 */
export async function generatePdf(docContent: DocContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (docContent.title) {
      doc.fontSize(20).text(docContent.title, { align: 'center' });
      doc.moveDown();
    }

    doc.fontSize(12);

    if (docContent.sections) {
      for (const section of docContent.sections) {
        doc.fontSize(16).text(section.heading);
        doc.fontSize(12).text(section.content);
        doc.moveDown();
      }
    } else if (docContent.content) {
      doc.text(docContent.content);
    }

    doc.end();
  });
}

/**
 * Genera un archivo de texto (.txt)
 */
export async function generateTxt(content: string): Promise<Buffer> {
  return Buffer.from(content, 'utf-8');
}

/**
 * Genera un archivo Markdown (.md)
 */
export async function generateMarkdown(docContent: DocContent): Promise<Buffer> {
  let markdown = '';

  if (docContent.title) {
    markdown += `# ${docContent.title}\n\n`;
  }

  if (docContent.sections) {
    for (const section of docContent.sections) {
      markdown += `## ${section.heading}\n\n${section.content}\n\n`;
    }
  } else if (docContent.content) {
    markdown += docContent.content;
  }

  return Buffer.from(markdown, 'utf-8');
}
