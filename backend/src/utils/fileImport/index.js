/**
 * fileImport/index.js
 * Central dispatcher for file imports (.pdf, .docx, .txt).
 * Converts file buffer into sanitized, structured HTML suitable for TipTap.
 */

import { importTxt } from './txt.js';
import { importDocx } from './docx.js';
import { importPdf } from './pdf.js';
import { ApiError } from '../ApiError.js';

async function importFile(fileBuffer, mimetype = '', filename = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (mimetype === 'text/plain' || ext === 'txt') {
    return importTxt(fileBuffer);
  }
  if (
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('msword') ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    return importDocx(fileBuffer);
  }
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    return importPdf(fileBuffer);
  }

  throw new ApiError(400, 'Unsupported file format. Please upload .pdf, .docx, or .txt files.');
}

export { importFile };
