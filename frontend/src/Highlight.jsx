import { Mark } from '@tiptap/core'

const CustomHighlight = Mark.create({
  name: 'customHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'mark',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', this.options.HTMLAttributes, 0]
  },

  addCommands() {
    return {
      toggleHighlight:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
    }
  },
})

export default CustomHighlight
