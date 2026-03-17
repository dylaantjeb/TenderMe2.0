import type { ParsedDocument } from '@/types';

/**
 * Document Ingestion Engine
 * Handles PDF, DOCX, and ZIP file parsing with graceful fallbacks for serverless
 */

export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<ParsedDocument> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (true) {
    case fileType === 'application/pdf' || ext === 'pdf':
      return parsePDF(buffer, fileName);

    case fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx':
      return parseDOCX(buffer, fileName);

    case fileType === 'application/zip' || ext === 'zip':
      return parseZIP(buffer, fileName);

    case fileType === 'text/plain' || ext === 'txt':
      return {
        text: buffer.toString('utf-8'),
        metadata: { fileName, fileType: 'txt', ocrApplied: false },
      };

    default:
      return {
        text: buffer.toString('utf-8'),
        metadata: { fileName, fileType: ext, ocrApplied: false },
      };
  }
}

async function parsePDF(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    // pdf-parse has a known issue: it tries to load a test PDF from the filesystem.
    // We use a dynamic import with error handling for serverless safety.
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);

    const text = cleanExtractedText(result.text);

    if (text.length < 50 && result.numpages > 0) {
      // Very little text extracted — likely a scanned document
      return {
        text: text || `[Document bevat ${result.numpages} pagina('s) maar geen selecteerbare tekst. Upload een PDF met selecteerbare tekst voor de beste resultaten.]`,
        metadata: {
          fileName,
          fileType: 'pdf',
          pageCount: result.numpages,
          ocrApplied: false,
        },
      };
    }

    return {
      text,
      metadata: {
        fileName,
        fileType: 'pdf',
        pageCount: result.numpages,
        ocrApplied: false,
      },
    };
  } catch (error) {
    console.error('PDF parse error:', error);
    return {
      text: `[PDF-verwerking mislukt voor ${fileName}. Probeer het bestand opnieuw te uploaden of converteer naar DOCX/TXT.]`,
      metadata: {
        fileName,
        fileType: 'pdf',
        ocrApplied: false,
      },
    };
  }
}

async function parseDOCX(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
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
  } catch (error) {
    console.error('DOCX parse error:', error);
    return {
      text: `[DOCX-verwerking mislukt voor ${fileName}. Controleer of het bestand geldig is.]`,
      metadata: {
        fileName,
        fileType: 'docx',
        ocrApplied: false,
      },
    };
  }
}

async function parseZIP(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const texts: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName.toLowerCase();
      const entryBuffer = entry.getData();

      try {
        if (entryName.endsWith('.pdf')) {
          const parsed = await parsePDF(entryBuffer, entry.entryName);
          texts.push(`--- ${entry.entryName} ---\n${parsed.text}`);
        } else if (entryName.endsWith('.docx')) {
          const parsed = await parseDOCX(entryBuffer, entry.entryName);
          texts.push(`--- ${entry.entryName} ---\n${parsed.text}`);
        } else if (entryName.endsWith('.txt')) {
          texts.push(`--- ${entry.entryName} ---\n${entryBuffer.toString('utf-8')}`);
        }
      } catch {
        texts.push(`--- ${entry.entryName} ---\n[Bestand kon niet worden verwerkt]`);
      }
    }

    return {
      text: texts.join('\n\n') || `[ZIP bevat ${entries.length} bestanden maar geen verwerkte inhoud]`,
      metadata: {
        fileName,
        fileType: 'zip',
        entryCount: entries.length,
        ocrApplied: false,
      },
    };
  } catch (error) {
    console.error('ZIP parse error:', error);
    return {
      text: `[ZIP-verwerking mislukt voor ${fileName}.]`,
      metadata: {
        fileName,
        fileType: 'zip',
        ocrApplied: false,
      },
    };
  }
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^\d+\s*$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Estimate token count for a text string (rough approximation)
 */
export function estimateTokens(text: string): number {
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
