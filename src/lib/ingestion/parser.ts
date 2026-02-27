import type { ParsedDocument } from '@/types';

/**
 * Document Ingestion Engine
 * Handles PDF, DOCX, and ZIP file parsing with OCR fallback
 */

export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<ParsedDocument> {
  switch (fileType) {
    case 'application/pdf':
    case '.pdf':
      return parsePDF(buffer, fileName);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case '.docx':
      return parseDOCX(buffer, fileName);

    case 'application/zip':
    case '.zip':
      return parseZIP(buffer, fileName);

    case 'text/plain':
    case '.txt':
      return {
        text: buffer.toString('utf-8'),
        metadata: { fileName, fileType, ocrApplied: false },
      };

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parsePDF(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);

    // Check if text extraction yielded minimal content (might need OCR)
    if (result.text.trim().length < 100 && result.numpages > 0) {
      return await parseWithOCR(buffer, fileName, result.numpages);
    }

    return {
      text: cleanExtractedText(result.text),
      metadata: {
        fileName,
        fileType: 'pdf',
        pageCount: result.numpages,
        ocrApplied: false,
      },
    };
  } catch (error) {
    // Fallback to OCR
    return await parseWithOCR(buffer, fileName);
  }
}

async function parseDOCX(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: cleanExtractedText(result.value),
    metadata: {
      fileName,
      fileType: 'docx',
      ocrApplied: false,
    },
  };
}

async function parseZIP(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const texts: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryName = entry.entryName.toLowerCase();
    const entryBuffer = entry.getData();

    if (entryName.endsWith('.pdf')) {
      const parsed = await parsePDF(entryBuffer, entry.entryName);
      texts.push(`--- ${entry.entryName} ---\n${parsed.text}`);
    } else if (entryName.endsWith('.docx')) {
      const parsed = await parseDOCX(entryBuffer, entry.entryName);
      texts.push(`--- ${entry.entryName} ---\n${parsed.text}`);
    } else if (entryName.endsWith('.txt')) {
      texts.push(`--- ${entry.entryName} ---\n${entryBuffer.toString('utf-8')}`);
    }
  }

  return {
    text: texts.join('\n\n'),
    metadata: {
      fileName,
      fileType: 'zip',
      ocrApplied: false,
    },
  };
}

async function parseWithOCR(
  buffer: Buffer,
  fileName: string,
  pageCount?: number
): Promise<ParsedDocument> {
  try {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('nld+eng');

    // Convert PDF buffer to image-like data for OCR
    // In production, use pdf2pic or similar for page-by-page conversion
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    return {
      text: cleanExtractedText(text),
      metadata: {
        fileName,
        fileType: 'pdf',
        pageCount,
        ocrApplied: true,
      },
    };
  } catch {
    return {
      text: '[OCR processing unavailable - please ensure document contains selectable text]',
      metadata: {
        fileName,
        fileType: 'pdf',
        pageCount,
        ocrApplied: false,
      },
    };
  }
}

function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove page numbers/headers that are just numbers
    .replace(/^\d+\s*$/gm, '')
    // Normalize spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Trim
    .trim();
}

/**
 * Estimate token count for a text string (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for Dutch/English
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks that fit within token limits
 */
export function chunkText(text: string, maxTokens = 30000): string[] {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return [text];

  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (estimateTokens(currentChunk + paragraph) > maxTokens) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}
