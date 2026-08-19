/**
 * chunker.js
 * TipTap-JSON-aware chunker.
 * Splits a TipTap doc JSON tree into semantically meaningful chunks
 * using heading boundaries. Code blocks are always emitted atomically.
 */

const MAX_WORDS = 500;
const MIN_CHARS = 10;

/**
 * Extract plain text from a TipTap inline content array.
 * @param {Array} inlineContent - Array of TipTap inline nodes
 * @returns {string}
 */
function extractText(inlineContent = []) {
  return inlineContent
    .map((node) => {
      if (node.type === 'text') return node.text || '';
      if (node.type === 'citation') return node.attrs?.claimText || '';
      if (node.type === 'hardBreak') return '\n';
      return '';
    })
    .join('');
}

/**
 * Count words in a string.
 */
function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Walk bullet / ordered list children and return flat text.
 */
function extractListText(listNode) {
  const lines = [];
  for (const item of listNode.content || []) {
    // listItem → paragraph (or nested list)
    for (const child of item.content || []) {
      if (child.type === 'paragraph') {
        lines.push(extractText(child.content));
      } else if (child.type === 'bulletList' || child.type === 'orderedList') {
        lines.push(extractListText(child));
      }
    }
  }
  return lines.join('\n');
}

/**
 * Core chunker.
 * @param {string} docId - MongoDB ObjectId string of the document
 * @param {Object} tiptapDoc - TipTap JSON document object ({ type: 'doc', content: [...] })
 * @returns {Array<{ docId, headingPath, text, chunkIndex, isCode }>}
 */
function chunkTipTapDoc(docId, tiptapDoc) {
  const chunks = [];
  let currentText = '';
  let currentHeadingPath = '(Introduction)';
  let headingStack = []; // Array of { level, text }

  function flushChunk(isCode = false) {
    const trimmed = currentText.trim();
    if (trimmed.length >= MIN_CHARS) {
      chunks.push({
        docId: docId.toString(),
        headingPath: currentHeadingPath,
        text: trimmed,
        chunkIndex: chunks.length,
        isCode,
      });
    }
    currentText = '';
  }

  function appendText(text) {
    if (!text) return;
    currentText += (currentText ? ' ' : '') + text;
    // If we've exceeded MAX_WORDS, flush and continue under same heading
    if (wordCount(currentText) >= MAX_WORDS) {
      flushChunk();
    }
  }

  function updateHeadingPath(level, text) {
    // Pop everything at this level or deeper
    headingStack = headingStack.filter((h) => h.level < level);
    headingStack.push({ level, text });
    currentHeadingPath = headingStack.map((h) => h.text).join(' > ') || '(Introduction)';
  }

  function walkNode(node) {
    switch (node.type) {
      case 'heading': {
        // Flush current buffer before new heading
        flushChunk();
        const level = node.attrs?.level || 1;
        const headingText = extractText(node.content);
        updateHeadingPath(level, headingText);
        // Heading text itself goes into the next chunk as a label — don't append to body
        break;
      }

      case 'codeBlock': {
        // Always flush before + emit code atomically
        flushChunk();
        const code = extractText(node.content);
        const lang = node.attrs?.language || '';
        currentText = lang ? `[${lang}]\n${code}` : code;
        flushChunk(true);
        break;
      }

      case 'paragraph': {
        const text = extractText(node.content);
        if (text.trim()) appendText(text);
        break;
      }

      case 'bulletList':
      case 'orderedList': {
        const text = extractListText(node);
        if (text.trim()) appendText(text);
        break;
      }

      case 'blockquote': {
        // Recursively walk blockquote children
        for (const child of node.content || []) {
          walkNode(child);
        }
        break;
      }

      case 'horizontalRule': {
        // Treat as a soft section break — flush current chunk
        flushChunk();
        break;
      }

      case 'image': {
        // Add a placeholder so context is preserved
        const alt = node.attrs?.alt || 'image';
        appendText(`[Image: ${alt}]`);
        break;
      }

      case 'table': {
        // Walk table rows/cells
        for (const row of node.content || []) {
          const cells = [];
          for (const cell of row.content || []) {
            const cellText = (cell.content || [])
              .map((n) => (n.type === 'paragraph' ? extractText(n.content) : ''))
              .join(' ');
            cells.push(cellText.trim());
          }
          appendText(cells.join(' | '));
        }
        break;
      }

      default: {
        // Generic fallback: recurse into children
        for (const child of node.content || []) {
          walkNode(child);
        }
      }
    }
  }

  // Walk the top-level content array
  for (const node of tiptapDoc.content || []) {
    walkNode(node);
  }

  // Flush any remaining text
  flushChunk();

  // Re-index chunkIndex to be sequential (already sequential since we push in order)
  return chunks;
}

export { chunkTipTapDoc };
