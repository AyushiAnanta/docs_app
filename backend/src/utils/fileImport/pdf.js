/**
 * pdf.js
 * Server-side PDF parser with heuristic structure inference using pdfjs-dist legacy build.
 * Infers headings (H1/H2/H3) based on relative font sizes, detects alignment by x-coordinates,
 * and handles paragraph breaks by line gaps.
 * Detects scanned/image-based PDFs and returns a clear message.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Compute mode (most frequent value) of an array of numbers.
 */
function getMode(arr) {
  if (!arr || arr.length === 0) return 12;
  const counts = {};
  let maxCount = 0;
  let mode = arr[0];
  for (const val of arr) {
    const rounded = Math.round(val * 10) / 10;
    counts[rounded] = (counts[rounded] || 0) + 1;
    if (counts[rounded] > maxCount) {
      maxCount = counts[rounded];
      mode = rounded;
    }
  }
  return mode;
}

async function importPdf(buffer) {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pagesData = [];
  const allFontSizes = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => item.str && item.str.trim() !== '')
      .map((item) => {
        const fontSize = Math.abs(item.transform[0]) || 12;
        allFontSizes.push(fontSize);
        return {
          str: item.str,
          fontSize,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 0,
          pageWidth: viewport.width,
        };
      });

    pagesData.push({ pageNum, items, pageWidth: viewport.width });
  }

  // Check if PDF has an extractable text layer
  const totalTextLength = pagesData.reduce(
    (sum, p) => sum + p.items.reduce((s, i) => s + i.str.length, 0),
    0
  );

  if (totalTextLength < 10) {
    throw new Error(
      'Could not extract text layer. Scanned or image-based PDFs are not supported for text import.'
    );
  }

  // Pass 1: Compute dominant body font size
  const bodyFontSize = getMode(allFontSizes);

  // Pass 2: Group text items into lines and paragraphs
  const htmlBlocks = [];

  for (const page of pagesData) {
    if (page.items.length === 0) continue;

    // Group items on the same page into lines (items with close y-coordinates)
    const lines = [];
    let currentLine = [page.items[0]];

    for (let i = 1; i < page.items.length; i++) {
      const item = page.items[i];
      const prevItem = currentLine[currentLine.length - 1];

      // Vertical distance threshold for same line (within ~3 units)
      if (Math.abs(item.y - prevItem.y) < 3.5) {
        currentLine.push(item);
      } else {
        lines.push(currentLine);
        currentLine = [item];
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    // Process each line into HTML elements based on font size & alignment
    for (const line of lines) {
      // Sort items horizontally left to right
      line.sort((a, b) => a.x - b.x);
      const lineText = line.map((item) => item.str).join(' ').trim();
      if (!lineText) continue;

      const maxLineFontSize = Math.max(...line.map((item) => item.fontSize));
      const firstItem = line[0];
      const lastItem = line[line.length - 1];
      const lineLeft = firstItem.x;
      const lineRight = lastItem.x + lastItem.width;
      const pageWidth = firstItem.pageWidth || 600;

      // Check alignment heuristic (centered if left margin approx equals right margin)
      const leftMargin = lineLeft;
      const rightMargin = pageWidth - lineRight;
      const isCentered =
        leftMargin > 50 &&
        rightMargin > 50 &&
        Math.abs(leftMargin - rightMargin) < 40;

      const styleAttr = isCentered ? ' style="text-align: center;"' : '';
      const escaped = escapeHtml(lineText);

      // Structure inference based on font size relative to body size
      if (maxLineFontSize >= bodyFontSize * 1.45) {
        htmlBlocks.push(`<h1${styleAttr}>${escaped}</h1>`);
      } else if (maxLineFontSize >= bodyFontSize * 1.25) {
        htmlBlocks.push(`<h2${styleAttr}>${escaped}</h2>`);
      } else if (maxLineFontSize >= bodyFontSize * 1.1) {
        htmlBlocks.push(`<h3${styleAttr}>${escaped}</h3>`);
      } else {
        htmlBlocks.push(`<p${styleAttr}>${escaped}</p>`);
      }
    }
  }

  return htmlBlocks.join('');
}

export { importPdf };
