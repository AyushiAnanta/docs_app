import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { FileText, File, MoreHorizontal, Pin, PinOff, Trash2, Globe, Clock } from 'lucide-react'

const DocCard = ({ doc, isPinned, viewMode, onTogglePin, onDelete, compact }) => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isFile = doc.content && doc.content.type === 'file-upload'
  const CardIcon = isFile ? File : FileText

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const getSnippet = () => {
    try {
      if (!doc.content) return 'Empty document'
      if (doc.content.type === 'file-upload') {
        const ext = (doc.content.extension || 'file').toUpperCase()
        return `${ext} Document — Click to open`
      }
      if (typeof doc.content === 'string') return doc.content.slice(0, 80)
      const nodes = doc.content.content || (Array.isArray(doc.content) ? doc.content : null)
      if (!nodes) return 'Empty document'
      for (const node of nodes) {
        if (node.type === 'paragraph' && node.content) {
          const text = node.content.filter(n => n.type === 'text').map(n => n.text).join('')
          if (text) return text.slice(0, 80) + (text.length > 80 ? '...' : '')
        }
      }
    } catch { /* ignore */ }
    return 'Empty document'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleCardClick = () => {
    navigate(`/document/${doc._id}`)
  }

  // ---- LIST VIEW ----
  if (viewMode === 'list') {
    return (
      <div className="doc-list-item" onClick={handleCardClick}>
        <div className="doc-list-icon">
          <CardIcon size={18} className={isFile ? "text-fuchsia-400" : ""} />
        </div>

        <div className="doc-list-info">
          <p className="doc-list-title">{doc.title || 'Untitled'}</p>
          <p className="doc-list-snippet">{getSnippet()}</p>
        </div>

        <div className="doc-list-meta">
          {doc.tags && doc.tags.length > 0 && (
            <span className="doc-tag">{doc.tags[0]}</span>
          )}
          <span className="doc-list-date">
            <Clock size={12} />
            {formatDate(doc.updatedAt || doc.createdAt)}
          </span>
        </div>

        <div className="doc-list-actions" onClick={e => e.stopPropagation()} ref={menuRef}>
          <button className="doc-action-btn" onClick={() => onTogglePin(doc._id)}>
            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
          <button className="doc-action-btn danger" onClick={() => onDelete(doc._id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ---- GRID VIEW ----
  return (
    <motion.div
      className={`doc-card ${compact ? 'compact' : ''}`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={handleCardClick}
    >
      {/* Card Accent */}
      <div className="doc-card-accent" />

      {/* Header */}
      <div className="doc-card-header" onClick={e => e.stopPropagation()}>
        <CardIcon size={16} className={`doc-card-file-icon ${isFile ? "text-fuchsia-400" : ""}`} />
        <div style={{ flex: 1 }} />

        {isPinned && <Pin size={13} className="doc-card-pin-indicator" />}

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="doc-card-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="doc-card-dropdown"
            >
              <button onClick={() => { onTogglePin(doc._id); setMenuOpen(false) }}>
                {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
              <button className="danger" onClick={() => { onDelete(doc._id); setMenuOpen(false) }}>
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="doc-card-body">
        <h3 className="doc-card-title">{doc.title || 'Untitled'}</h3>
        <p className="doc-card-snippet">{getSnippet()}</p>
      </div>

      {/* Footer */}
      <div className="doc-card-footer">
        {doc.tags && doc.tags.length > 0 && (
          <span className="doc-tag">{doc.tags[0]}</span>
        )}
        <span className="doc-card-date">
          <Clock size={11} />
          {formatDate(doc.updatedAt || doc.createdAt)}
        </span>
        {doc.isPublic && (
          <Globe size={12} className="doc-card-public" />
        )}
      </div>
    </motion.div>
  )
}

export default DocCard
