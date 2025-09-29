import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { convertToHtml } from 'mammoth/mammoth.browser';

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'unknown';

export interface ParsedFile {
  fileName: string;
  fileType: SupportedFileType;
  text: string;
  wordCount: number;
  pageCount?: number;
  extractedAt: number;
}

const workerSrc = `${typeof window !== 'undefined' ? window.location.origin : ''}/pdf.worker.min.js`;
GlobalWorkerOptions.workerSrc = workerSrc;

function detectFileType(file: File): SupportedFileType {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return 'docx';
  }

  if (mimeType.startsWith('text/') || fileName.endsWith('.txt')) {
    return 'txt';
  }

  return 'unknown';
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function parsePdf(file: File): Promise<ParsedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf: PDFDocumentProxy = await loadingTask.promise;

  let textContent = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page: PDFPageProxy = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ');
    textContent += pageText + '\n';
  }

  const cleaned = cleanText(textContent);
  return {
    fileName: file.name,
    fileType: 'pdf',
    text: cleaned,
    wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    pageCount: pdf.numPages,
    extractedAt: Date.now(),
  };
}

async function parseDocx(file: File): Promise<ParsedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await convertToHtml({ arrayBuffer });
  const text = cleanText(value.replace(/<[^>]+>/g, ' '));

  return {
    fileName: file.name,
    fileType: 'docx',
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    extractedAt: Date.now(),
  };
}

async function parseTxt(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const cleaned = cleanText(text);

  return {
    fileName: file.name,
    fileType: 'txt',
    text: cleaned,
    wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    extractedAt: Date.now(),
  };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const fileType = detectFileType(file);

  switch (fileType) {
    case 'pdf':
      return parsePdf(file);
    case 'docx':
      return parseDocx(file);
    case 'txt':
      return parseTxt(file);
    default: {
      const text = await file.text();
      const cleaned = cleanText(text);
      return {
        fileName: file.name,
        fileType: 'unknown',
        text: cleaned,
        wordCount: cleaned.split(/\s+/).filter(Boolean).length,
        extractedAt: Date.now(),
      };
    }
  }
}
