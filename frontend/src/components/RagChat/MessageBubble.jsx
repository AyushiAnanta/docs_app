/**
 * MessageBubble.jsx
 * Renders a single chat message (user or assistant).
 * Styled using the existing "Vibrant Minimal" design token set.
 */

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessageBubble = ({ message }) => {
  const navigate = useNavigate();
  const isUser = message.role === 'user';

  // Parse [Source N] citations into clickable spans if sources exist
  function renderAnswer(text, sources) {
    if (!sources || sources.length === 0) return <span>{text}</span>;

    const parts = text.split(/(\[Source \d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[Source (\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const source = sources[idx];
        if (source) {
          return (
            <button
              key={i}
              onClick={() => navigate(`/document/${source.docId}`)}
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
              }}
            >
              {part}
            </button>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  }

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
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.role === 'assistant'
          ? renderAnswer(message.content, message.sources)
          : message.content}
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
            <button
              key={src.sourceIndex}
              onClick={() => navigate(`/document/${src.docId}`)}
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
              <ExternalLink size={11} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
