import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TableOfContents,
  BorderStyle,
} from 'docx';

interface ExportTender {
  title: string;
  referenceNumber?: string | null;
  contractingAuth?: string | null;
  criteria: any[];
  context: any;
}

interface ExportResponse {
  criterionResponses: {
    criterion: { name: string; weight: number };
    content: string;
    score: number | null;
    understanding: string | null;
    solution: string | null;
    evidence: string | null;
    riskMitigation: string | null;
    measurableImpact: string | null;
  }[];
  overallScore: number | null;
}

export async function generateWordDocument(
  tender: ExportTender,
  response: ExportResponse
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'EMVI/BPKV Inschrijving',
          bold: true,
          size: 48,
          color: '1a1a2e',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: tender.title,
          bold: true,
          size: 36,
          color: '16213e',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  if (tender.referenceNumber) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Referentienummer: ${tender.referenceNumber}`,
            size: 24,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  if (tender.contractingAuth) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Aanbestedende dienst: ${tender.contractingAuth}`,
            size: 24,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Datum: ${new Date().toLocaleDateString('nl-NL')}`,
          size: 22,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  if (response.overallScore) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Verwachte score: ${response.overallScore.toFixed(1)}/10`,
            size: 24,
            color: '27ae60',
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1000 },
      })
    );
  }

  // Separator
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
      spacing: { after: 400 },
    })
  );

  // Table of Contents header
  children.push(
    new Paragraph({
      text: 'Inhoudsopgave',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  // List criteria as ToC
  response.criterionResponses.forEach((cr, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${cr.criterion.name}`,
            size: 22,
          }),
          new TextRun({
            text: `  (Gewicht: ${cr.criterion.weight}%)`,
            size: 20,
            color: '888888',
          }),
        ],
        spacing: { after: 80 },
      })
    );
  });

  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
      spacing: { before: 300, after: 400 },
    })
  );

  // Content per criterion
  response.criterionResponses.forEach((cr, index) => {
    // Criterion header
    children.push(
      new Paragraph({
        text: `${index + 1}. ${cr.criterion.name}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Gewicht: ${cr.criterion.weight}%`,
            size: 20,
            color: '666666',
            italics: true,
          }),
          cr.score
            ? new TextRun({
                text: `  |  Verwachte score: ${cr.score.toFixed(1)}/10`,
                size: 20,
                color: cr.score >= 8 ? '27ae60' : cr.score >= 6 ? 'f39c12' : 'e74c3c',
                italics: true,
              })
            : new TextRun({ text: '' }),
        ],
        spacing: { after: 300 },
      })
    );

    // Structured sections
    const sections = [
      { title: 'Begrip', content: cr.understanding },
      { title: 'Concrete Oplossing', content: cr.solution },
      { title: 'Bewijs en Onderbouwing', content: cr.evidence },
      { title: 'Risicobeheersing', content: cr.riskMitigation },
      { title: 'Meetbaar Resultaat', content: cr.measurableImpact },
    ];

    for (const section of sections) {
      if (section.content) {
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          })
        );

        // Split content into paragraphs
        const paragraphs = section.content.split('\n').filter((p) => p.trim());
        for (const para of paragraphs) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para.trim(), size: 22 })],
              spacing: { after: 120 },
            })
          );
        }
      }
    }

    // If no structured sections, use full content
    if (!cr.understanding && !cr.solution && cr.content) {
      const paragraphs = cr.content.split('\n').filter((p) => p.trim());
      for (const para of paragraphs) {
        if (para.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: para.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para.trim(), size: 22 })],
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  });

  // Legal disclaimer
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
      spacing: { before: 600, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Disclaimer: Dit document is gegenereerd met behulp van AI-technologie en dient als concept. ',
          size: 18,
          color: '999999',
          italics: true,
        }),
        new TextRun({
          text: 'De inhoud moet worden gecontroleerd en aangepast door een gekwalificeerde professional voordat het wordt ingediend.',
          size: 18,
          color: '999999',
          italics: true,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  const doc = new DocxDocument({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${tender.title} — EMVI Inschrijving`,
                    size: 16,
                    color: 'aaaaaa',
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Pagina ',
                    size: 16,
                    color: 'aaaaaa',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: 'aaaaaa',
                  }),
                  new TextRun({
                    text: ' | Gegenereerd door TenderMe',
                    size: 16,
                    color: 'aaaaaa',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generatePDFDocument(
  tender: ExportTender,
  response: ExportResponse
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: `${tender.title} — EMVI Inschrijving`,
        Author: 'TenderMe',
        Subject: 'EMVI/BPKV Inschrijving',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title page
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1a1a2e');
    doc.text('EMVI/BPKV Inschrijving', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#16213e');
    doc.text(tender.title, { align: 'center' });
    doc.moveDown(0.5);

    if (tender.referenceNumber) {
      doc.fontSize(12).font('Helvetica').fillColor('#666666');
      doc.text(`Referentienummer: ${tender.referenceNumber}`, { align: 'center' });
    }

    if (tender.contractingAuth) {
      doc.fontSize(12).font('Helvetica').fillColor('#666666');
      doc.text(`Aanbestedende dienst: ${tender.contractingAuth}`, { align: 'center' });
    }

    doc.moveDown(1);
    doc.fontSize(11).fillColor('#999999');
    doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, { align: 'center' });

    if (response.overallScore) {
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#27ae60');
      doc.text(`Verwachte score: ${response.overallScore.toFixed(1)}/10`, { align: 'center' });
    }

    // Content pages
    doc.addPage();

    response.criterionResponses.forEach((cr, index) => {
      if (index > 0) doc.addPage();

      // Criterion header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a2e');
      doc.text(`${index + 1}. ${cr.criterion.name}`);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica').fillColor('#888888');
      const scoreColor = cr.score && cr.score >= 8 ? '#27ae60' : cr.score && cr.score >= 6 ? '#f39c12' : '#e74c3c';
      doc.text(`Gewicht: ${cr.criterion.weight}%${cr.score ? `  |  Score: ${cr.score.toFixed(1)}/10` : ''}`);
      doc.moveDown(0.5);

      // Line separator
      doc.moveTo(72, doc.y).lineTo(523, doc.y).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);

      // Content
      const content = cr.content || '';
      const lines = content.split('\n');

      for (const line of lines) {
        if (doc.y > 700) doc.addPage();

        if (line.startsWith('## ')) {
          doc.moveDown(0.3);
          doc.fontSize(13).font('Helvetica-Bold').fillColor('#16213e');
          doc.text(line.replace('## ', ''));
          doc.moveDown(0.2);
        } else if (line.trim()) {
          doc.fontSize(10.5).font('Helvetica').fillColor('#333333');
          doc.text(line.trim(), { lineGap: 3 });
        } else {
          doc.moveDown(0.3);
        }
      }
    });

    // Disclaimer page
    doc.addPage();
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#999999');
    doc.text(
      'Disclaimer: Dit document is gegenereerd met behulp van AI-technologie en dient als concept. ' +
        'De inhoud moet worden gecontroleerd en aangepast door een gekwalificeerde professional voordat het wordt ingediend.',
      { align: 'center' }
    );

    doc.end();
  });
}
