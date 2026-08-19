/**
 * CitationNodeView.jsx
 * React NodeView for the inline Citation extension.
 * Renders claim text + clickable source pill badge with hover card preview and deep-linking.
 */

import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink } from 'lucide-react';

export default function CitationNodeView({ node }) {
  const { docId, docTitle, headingPath, snippet, claimText } = node.attrs;
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!docId) return;
    const targetUrl = headingPath
      ? `/document/${docId}?heading=${encodeURIComponent(headingPath)}`
      : `/document/${docId}`;
    navigate(targetUrl);
  };

  return (
    <NodeViewWrapper as="span" className="citation-node-wrapper inline">
      {claimText && <span className="citation-claim-text mr-1">{claimText}</span>}
      <span
        className="citation-pill inline-flex items-center gap-1 cursor-pointer select-none"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onClick={handleClick}
        contentEditable={false}
      >
        <Bookmark size={10} className="citation-pill-icon" />
        <span className="citation-pill-title">{docTitle || 'Source'}</span>
        <ExternalLink size={9} className="citation-pill-link-icon opacity-70" />

        {showPreview && (
          <span className="citation-preview-card" contentEditable={false}>
            <span className="citation-preview-title block font-bold text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {docTitle || 'Source Document'}
            </span>
            {headingPath && (
              <span className="citation-preview-heading block text-[11px] font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                {headingPath}
              </span>
            )}
            {snippet && (
              <span className="citation-preview-snippet block text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "{snippet}"
              </span>
            )}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}
