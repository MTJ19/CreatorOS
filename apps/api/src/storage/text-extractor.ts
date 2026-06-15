import * as mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';

export async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    // pdf-parse might return a default object or function depending on runtime
    const pdf = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
    if (typeof pdf !== 'function') {
      // Fallback require if module import is weird
      const reqPdf = require('pdf-parse');
      const data = await reqPdf(buffer);
      return data.text || '';
    }
    const data = await pdf(buffer);
    return data.text || '';
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    mimetype.includes('word')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } else {
    // If it's a plain text or unknown, try to decode as UTF-8
    try {
      return buffer.toString('utf-8');
    } catch {
      throw new Error(`Unsupported mimetype for text extraction: ${mimetype}`);
    }
  }
}
