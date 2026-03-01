declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdfParse(buffer: Buffer): Promise<PDFParseResult>;
  export default pdfParse;
}

declare module 'pdfkit' {
  import { Writable } from 'stream';

  class PDFDocument extends Writable {
    constructor(options?: Record<string, unknown>);
    fontSize(size: number): this;
    font(name: string): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    text(text: string, options?: Record<string, unknown>): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    addPage(): this;
    end(): void;
    y: number;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export default PDFDocument;
}
