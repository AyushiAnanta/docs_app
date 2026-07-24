import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, FileText, FolderOpen } from 'lucide-react'

const NewDocModal = ({ folders, onClose, onCreate }) => {
  const [title, setTitle] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?._id || '')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !selectedFolder) return

    setCreating(true)
    await onCreate({
      title: title.trim(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }] },
      folder: selectedFolder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublic,
    })
    setCreating(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <FileText size={20} />
            <h2>New Document</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label>Title</label>
            <input
              type="text"
              placeholder="Document title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-field">
            <label><FolderOpen size={14} style={{ display: 'inline', marginRight: 6 }} />Folder</label>
            <select
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              required
            >
              <option value="" disabled>Select a folder</option>
              {folders.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label>Tags <span className="modal-hint">(comma separated)</span></label>
            <input
              type="text"
              placeholder="e.g. notes, project, ideas"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="modal-field-row">
            <label>Make public</label>
            <button
              type="button"
              className={`modal-toggle ${isPublic ? 'on' : ''}`}
              onClick={() => setIsPublic(!isPublic)}
            >
              <span className="modal-toggle-knob" />
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={!title.trim() || !selectedFolder || creating}
            >
              {creating ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default NewDocModal
