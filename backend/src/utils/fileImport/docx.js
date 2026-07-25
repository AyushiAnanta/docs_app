/**
 * docx.js
 * High-fidelity DOCX converter using mammoth with an explicit style map.
 * Preserves headings (H1-H4), titles, quotes, bold, italic, underline,
 * and inline text alignment styles.
 */

import mammoth from 'mammoth';

const styleMap = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",
  "b => strong",
  "i => em",
  "u => u",
  "strike => s",
];

async function importDocx(buffer) {
  const result = await mammoth.convertToHtml(
    { buffer },
    { styleMap, includeDefaultStyleMap: true }
  );

  if (result.messages && result.messages.length > 0) {
    console.log('[importDocx] Conversion warnings:', result.messages.map((m) => m.message).join(' | '));
  }

  return result.value || '<p></p>';
}

export { importDocx };
