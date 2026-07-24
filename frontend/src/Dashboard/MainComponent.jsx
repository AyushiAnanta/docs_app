import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { LayoutGrid, List, Pin, Clock, FilePlus } from 'lucide-react'
import DocCard from './DocCard'

// Illustration widgets spread across the app
const WIDGETS = [
  '/images/1.png', '/images/2.png', '/images/3.png', '/images/4.png',
  '/images/5.png', '/images/6.png', '/images/7.png', '/images/8.png',
]

const MainComponent = ({
  docs,
  pinnedDocs,
  pinnedDocIds,
  viewMode,
  onViewModeChange,
  onTogglePin,
  onDeleteDoc,
  loading,
  activeFolder,
  onNewClick,
}) => {

  const [activeTag, setActiveTag] = useState(null)

  // Extract all unique tags in active docs list
  const allTags = useMemo(() => {
    const tagsSet = new Set()
    docs.forEach(doc => {
      doc.tags?.forEach(tag => {
        if (tag && tag.trim()) {
          tagsSet.add(tag.trim().toLowerCase())
        }
      })
    })
    return Array.from(tagsSet)
  }, [docs])

  // Filter docs by clicked tag state
  const displayedDocs = useMemo(() => {
    if (!activeTag) return docs
    return docs.filter(doc => 
      doc.tags?.some(tag => tag.trim().toLowerCase() === activeTag)
    )
  }, [docs, activeTag])

  if (loading) {
    return (
      <main className="main-content">
        <div className="main-loading">
          <motion.img
            src="/images/1.png"
            alt="loading"
            style={{ height: 100, opacity: 0.6 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <p>Loading your documents...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="main-content">
      <div className="main-scroll">

        {/* Pinned Section */}
        {pinnedDocs.length > 0 && (
          <section className="main-section">
            <div className="main-section-header">
              <div className="main-section-title">
                <Pin size={16} className="main-section-icon pinned" />
                <h2>Pinned</h2>
              </div>
            </div>
            <div className="main-pinned-scroll">
              {pinnedDocs.map(doc => (
                <DocCard
                  key={doc._id}
                  doc={doc}
                  isPinned={true}
                  viewMode="grid"
                  onTogglePin={onTogglePin}
                  onDelete={onDeleteDoc}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Documents Section */}
        <section className="main-section">
          <div className="main-section-header">
            <div className="main-section-title">
              <Clock size={16} className="main-section-icon" />
              <h2>{activeFolder ? 'Documents' : 'Recent Documents'}</h2>
              <span className="main-doc-count">{displayedDocs.length}</span>
            </div>

            <div className="main-view-toggle">
              <button
                className={`main-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`main-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Tag Filter Pills */}
          {allTags.length > 0 && (
            <div className="main-tags-filter">
              <button
                className={`main-tag-pill ${activeTag === null ? 'active' : ''}`}
                onClick={() => setActiveTag(null)}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`main-tag-pill ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => setActiveTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {displayedDocs.length === 0 ? (
            <div className="main-empty">
              {/* Illustrated empty state with widgets */}
              <div className="main-empty-widgets">
                {[3, 5, 8].map((num, i) => (
                  <motion.img
                    key={num}
                    src={`/images/${num}.png`}
                    alt="illustration"
                    className="main-empty-widget-img"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                    drag
                    dragSnapToOrigin
                  />
                ))}
              </div>
              <h3>No documents found</h3>
              <p>{activeTag ? `No documents match tag #${activeTag}` : 'Create your first document to get started'}</p>
              {!activeTag && (
                <button className="main-empty-btn" onClick={onNewClick}>
                  <FilePlus size={16} />
                  <span>New Document</span>
                </button>
              )}
            </div>
          ) : (
            <motion.div
              className={viewMode === 'grid' ? 'main-grid' : 'main-list'}
              layout
            >
              {displayedDocs.map((doc, i) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  layout
                >
                  <DocCard
                    doc={doc}
                    isPinned={pinnedDocIds.includes(doc._id)}
                    viewMode={viewMode}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteDoc}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Decorative corner widget — subtle and alive */}
        {displayedDocs.length > 0 && (
          <motion.div
            className="main-corner-widget"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <motion.img
              src={WIDGETS[Math.floor(Date.now() / 86400000) % WIDGETS.length]}
              alt="decoration"
              className="main-corner-widget-img"
              drag
              dragSnapToOrigin
              whileHover={{ scale: 1.1 }}
            />
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default MainComponent