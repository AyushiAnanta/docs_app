import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, FileText, FolderOpen, Folder, ChevronDown, Check } from 'lucide-react'

const NewDocModal = ({ folders, onClose, onCreate }) => {
  const [title, setTitle] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?._id || '')
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false)
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setFolderDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedFolderName = folders.find(f => f._id === selectedFolder)?.name || 'Select a folder'

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

          {/* Custom Styled Folder Dropdown */}
          <div className="modal-field" ref={dropdownRef} style={{ position: 'relative' }}>
            <label><FolderOpen size={14} style={{ display: 'inline', marginRight: 6 }} />Folder</label>
            
            <button
              type="button"
              onClick={() => setFolderDropdownOpen(prev => !prev)}
              className="modal-custom-select-trigger"
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--bg-tertiary)',
                border: `1px solid ${folderDropdownOpen ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: folderDropdownOpen ? '0 0 0 2px var(--accent-dim)' : 'none',
                borderRadius: 'var(--radius-sm, 8px)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Folder size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedFolderName}
                </span>
              </div>
              <ChevronDown 
                size={15} 
                style={{ 
                  color: 'var(--text-muted)', 
                  transition: 'transform 0.2s ease', 
                  transform: folderDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
                }} 
              />
            </button>

            <AnimatePresence>
              {folderDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    padding: '4px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  {folders.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      No folders available
                    </div>
                  ) : (
                    folders.map(f => {
                      const isSelected = f._id === selectedFolder
                      return (
                        <div
                          key={f._id}
                          onClick={() => {
                            setSelectedFolder(f._id)
                            setFolderDropdownOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            background: isSelected ? 'var(--accent-dim)' : 'transparent',
                            transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)'
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <Folder size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </span>
                          </div>
                          {isSelected && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        </div>
                      )
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
