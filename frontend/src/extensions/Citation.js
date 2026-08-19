/**
 * Citation.js
 * Custom TipTap inline atomic Node extension for AI-cited claims.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CitationNodeView from './CitationNodeView';

export const Citation = Node.create({
  name: 'citation',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      docId: { default: null },
      docTitle: { default: '' },
      headingPath: { default: '' },
      chunkIndex: { default: null },
      snippet: { default: '' },
      claimText: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-citation-node]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-citation-node': '' }),
      HTMLAttributes.claimText || '',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationNodeView);
  },

  addCommands() {
    return {
      insertCitation:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs })
            .run();
        },
    };
  },
});
