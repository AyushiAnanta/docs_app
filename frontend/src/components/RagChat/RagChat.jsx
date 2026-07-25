/**
 * RagChat.jsx
 * "Chat with your Workspace" slide-over panel.
 * Uses the existing Vibrant Minimal design tokens — no new color system introduced.
 *
 * Props:
 *   isOpen {boolean}
 *   onClose {function}
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import axios from 'axios';
import MessageBubble from './MessageBubble';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm your workspace assistant. Ask me anything about your documents — I'll search across all of them and answer with citations.",
  sources: [],
};

const RagChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/v1/rag/query', { query });
      const { answer, sources } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}`, sources: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setInput('');
  };

  // Suggested prompts
  const suggestions = [
    'Summarize my recent documents',
    'What topics appear across my notes?',
    'Find anything related to pricing',
  ];

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 998,
          }}
        />
      )}

      {/* Slide-over panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: '100vw',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Workspace Chat
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              RAG · powered by Atlas + Claude
            </p>
          </div>

          <button
            onClick={handleReset}
            title="Clear conversation"
            style={{
              padding: 6,
              borderRadius: 6,
              color: 'var(--text-muted)',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={onClose}
            title="Close"
            style={{
              padding: 6,
              borderRadius: 6,
              color: 'var(--text-muted)',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: '14px 14px 14px 4px',
                border: '1px solid var(--border)',
                alignSelf: 'flex-start',
                marginBottom: 12,
              }}
            >
              <Loader2 size={14} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Searching your workspace…
              </span>
            </div>
          )}

          {/* Suggestions (only when just the welcome message is showing) */}
          {messages.length === 1 && !loading && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Try asking
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      textAlign: 'left',
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--accent-dim)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '8px 10px 8px 14px',
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your docs…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13.5,
                resize: 'none',
                maxHeight: 120,
                lineHeight: 1.6,
                padding: '2px 0',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  input.trim() && !loading
                    ? 'linear-gradient(135deg, var(--accent), rgba(217,70,239,0.7))'
                    : 'var(--bg-elevated)',
                color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s, color 0.2s',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default RagChat;
