/**
 * MessageBubble.jsx
 * Renders a single chat message (user or assistant).
 * Assistant messages are rendered as formatted markdown with citation pills.
 * Styled using the existing "Vibrant Minimal" design token set.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessageBubble = ({ message, editor }) => {
  const navigate = useNavigate();
  const isUser = message.role === 'user';

  /**
   * Pre-process the markdown text:
   * Replace [Source N] tokens with inline HTML-safe markers that
   * ReactMarkdown will leave intact, then render them as clickable pills
   * via the custom 'code' component override.
   *
   * Strategy: wrap [Source N] in backticks so ReactMarkdown treats them
   * as inline code, then we hijack the `code` renderer to display pills.
   */
  function preprocessCitations(text) {
    if (!text) return '';
    // Wrap [Source N] in backticks: `[Source N]` → ReactMarkdown renders as <code>
    return text.replace(/\[Source (\d+)\]/g, '`[Source $1]`');
  }

  const handleInsertCitation = (src, e) => {
    e.stopPropagation();
    if (!editor) return;

    const { selection, doc } = editor.state;
    const isSelected = !selection.empty;
    const selectedText = isSelected ? doc.textBetween(selection.from, selection.to) : '';

    const attrs = {
      docId: src.docId,
      docTitle: src.headingPath?.split('>')[0]?.trim() || 'Source Document',
      headingPath: src.headingPath,
      chunkIndex: src.chunkIndex,
      snippet: src.preview || '',
      claimText: selectedText || '',
    };

    // If editor has an active cursor inside content, insert at cursor with spacing
    if (selection && selection.from > 1) {
      editor.chain().focus().insertCitation(attrs).insertContent(' ').run();
    } else {
      // If no active cursor, append to the end of the document as a clean block
      const endPos = doc.content.size - 1;
      editor
        .chain()
        .focus(endPos)
        .insertContent([
          { type: 'citation', attrs },
          { type: 'text', text: ' ' }
        ])
        .run();
    }
  };

  /** Custom ReactMarkdown component overrides for theming */
  const markdownComponents = {
    // Hijack inline code to render [Source N] as clickable pills
    code({ children, inline, ...props }) {
      const text = String(children).trim();
      const sourceMatch = text.match(/^\[Source (\d+)\]$/);
      if (inline && sourceMatch && message.sources) {
        const idx = parseInt(sourceMatch[1], 10) - 1;
        const source = message.sources[idx];
        if (source) {
          return (
            <button
              onClick={() => {
                const url = `/document/${source.docId}?heading=${encodeURIComponent(source.headingPath || '')}&chat=open`;
                navigate(url);
              }}
              title={`Go to: ${source.headingPath}`}
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid rgba(217,70,239,0.25)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                margin: '0 2px',
                lineHeight: 1.4,
                verticalAlign: 'middle',
              }}
            >
              {text}
            </button>
          );
        }
      }
      // Regular inline code
      if (inline) {
        return (
          <code
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: '0.9em',
              fontFamily: 'monospace',
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      // Block code (shouldn't hit here, handled by `pre`)
      return <code {...props}>{children}</code>;
    },
    // Code blocks
    pre({ children }) {
      return (
        <pre
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            overflow: 'auto',
            fontSize: 12,
            fontFamily: 'monospace',
            margin: '8px 0',
            border: '1px solid var(--border)',
          }}
        >
          {children}
        </pre>
      );
    },
    // Tables
    table({ children }) {
      return (
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: 12,
            }}
          >
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th
          style={{
            border: '1px solid var(--border)',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.05)',
            fontWeight: 600,
            textAlign: 'left',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td
          style={{
            border: '1px solid var(--border)',
            padding: '6px 10px',
            fontSize: 12.5,
          }}
        >
          {children}
        </td>
      );
    },
    // Strong (bold)
    strong({ children }) {
      return <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{children}</strong>;
    },
    // Emphasis (italic)
    em({ children }) {
      return <em style={{ fontStyle: 'italic', opacity: 0.92 }}>{children}</em>;
    },
    // Headings → render as bold text (no actual headings inside a chat bubble)
    h1({ children }) {
      return <p style={{ fontWeight: 700, fontSize: 15, margin: '10px 0 4px' }}>{children}</p>;
    },
    h2({ children }) {
      return <p style={{ fontWeight: 700, fontSize: 14, margin: '8px 0 4px' }}>{children}</p>;
    },
    h3({ children }) {
      return <p style={{ fontWeight: 600, fontSize: 13.5, margin: '6px 0 3px' }}>{children}</p>;
    },
    // Paragraphs
    p({ children }) {
      return <p style={{ margin: '4px 0' }}>{children}</p>;
    },
    // Lists
    ul({ children }) {
      return <ul style={{ paddingLeft: 18, margin: '4px 0' }}>{children}</ul>;
    },
    ol({ children }) {
      return <ol style={{ paddingLeft: 18, margin: '4px 0' }}>{children}</ol>;
    },
    li({ children }) {
      return <li style={{ marginBottom: 2 }}>{children}</li>;
    },
    // Links
    a({ children, href }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
        >
          {children}
        </a>
      );
    },
    // Blockquotes
    blockquote({ children }) {
      return (
        <blockquote
          style={{
            borderLeft: '3px solid var(--accent)',
            paddingLeft: 12,
            margin: '6px 0',
            opacity: 0.85,
            fontStyle: 'italic',
          }}
        >
          {children}
        </blockquote>
      );
    },
    // Horizontal rule
    hr() {
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />;
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 6,
        marginBottom: 12,
      }}
    >
      {/* Bubble */}
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser
            ? 'linear-gradient(135deg, var(--accent), rgba(217,70,239,0.7))'
            : 'var(--bg-elevated)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          fontSize: 13.5,
          lineHeight: 1.65,
          border: isUser ? 'none' : '1px solid var(--border)',
          boxShadow: isUser ? '0 2px 12px rgba(217,70,239,0.25)' : 'none',
          wordBreak: 'break-word',
        }}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {preprocessCitations(message.content)}
          </ReactMarkdown>
        )}
      </div>

      {/* Sources */}
      {message.sources && message.sources.length > 0 && (
        <div
          style={{
            maxWidth: '85%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 2,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Sources
          </p>
          {message.sources.map((src) => (
            <div
              key={src.sourceIndex}
              onClick={() => {
                const url = `/document/${src.docId}?heading=${encodeURIComponent(src.headingPath || '')}&chat=open`;
                navigate(url);
              }}
              title={src.preview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
            >
              <FileText size={12} color="var(--accent)" />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                [{src.sourceIndex}] {src.headingPath}
              </span>
              
              {editor && (
                <button
                  onClick={(e) => handleInsertCitation(src, e)}
                  title="Insert citation node into editor"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={10} /> Insert
                </button>
              )}

              <ExternalLink size={11} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
