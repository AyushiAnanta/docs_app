/**
 * txt.js
 * Paragraph-aware TXT parser.
 * Merges consecutive non-empty lines into single paragraphs (handling hard-wraps)
 * and uses blank lines as paragraph separators.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function importTxt(buffer) {
  const rawText = buffer.toString('utf8');
  const lines = rawText.split(/\r?\n/);
  const paragraphs = [];
  let currentPara = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (currentPara.length > 0) {
        paragraphs.push(currentPara.join(' '));
        currentPara = [];
      }
    } else {
      currentPara.push(trimmed);
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(' '));
  }

  if (paragraphs.length === 0) {
    return '<p></p>';
  }

  const html = paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  return html;
}

export { importTxt };
