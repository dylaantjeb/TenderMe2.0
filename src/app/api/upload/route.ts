import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseDocument } from '@/lib/ingestion/parser';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'text/plain',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tenderId = formData.get('tenderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bestand is te groot (max 50MB)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|zip|txt)$/i)) {
      return NextResponse.json(
        { error: 'Bestandstype niet ondersteund. Gebruik PDF, DOCX, ZIP of TXT.' },
        { status: 400 }
      );
    }

    // Read file buffer (in-memory only — Vercel has no writable filesystem)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileId = randomUUID();
    const ext = file.name.split('.').pop() || 'bin';

    // Parse document to extract text
    const parsed = await parseDocument(buffer, file.name, file.type || `.${ext}`);

    // Create or get tender
    let currentTenderId = tenderId;
    if (!currentTenderId) {
      const tender = await db.tender.create({
        data: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          status: 'IMPORTING',
          source: 'UPLOAD',
          userId: session.user.id,
          organizationId: session.user.organizationId,
        },
      });
      currentTenderId = tender.id;
    }

    // Store document record (text in DB, no file on disk)
    const document = await db.document.create({
      data: {
        tenderId: currentTenderId,
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
        storagePath: `memory://${fileId}.${ext}`,
        extractedText: parsed.text,
        ocrApplied: parsed.metadata.ocrApplied,
        metadata: parsed.metadata as any,
      },
    });

    // Update tender status
    await db.tender.update({
      where: { id: currentTenderId },
      data: { status: 'IMPORTING' },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: currentTenderId,
        action: 'DOCUMENT_UPLOADED',
        resource: 'Document',
        resourceId: document.id,
        details: {
          fileName: file.name,
          fileSize: file.size,
          ocrApplied: parsed.metadata.ocrApplied,
        },
      },
    });

    return NextResponse.json({
      success: true,
      tenderId: currentTenderId,
      documentId: document.id,
      extractedLength: parsed.text.length,
      ocrApplied: parsed.metadata.ocrApplied,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het uploaden' },
      { status: 500 }
    );
  }
}
