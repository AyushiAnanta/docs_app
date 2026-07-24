import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Home, FileText, ChevronRight, ChevronDown, Folder, FolderOpen, FolderPlus, Settings, Check, X, Edit2, Trash2, Upload } from 'lucide-react'

const SideBar = ({ 
  isOpen, 
  folders, 
  activeFolder, 
  onAllDocsClick, 
  onFolderClick, 
  onNewClick, 
  onCreateFolder, 
  onRenameFolder, 
  onDeleteFolder, 
  onSettingsClick,
  onUploadClick,
  onClose 
}) => {

  const folderTree = useMemo(() => buildFolderTree(folders), [folders])
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (creatingFolder && inputRef.current) {
      inputRef.current.focus()
    }
  }, [creatingFolder])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    await onCreateFolder(name)
    setNewFolderName('')
    setCreatingFolder(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateFolder()
    if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'var(--sidebar-width)', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="sidebar"
        >
          <div className="sidebar-inner">
            {/* Actions Container */}
            <div className="sidebar-actions-group">
              <button className="sidebar-new-btn flex-1" onClick={onNewClick}>
                <Plus size={15} />
                <span>New Doc</span>
              </button>
              <button className="sidebar-upload-btn flex-1" onClick={onUploadClick}>
                <Upload size={14} />
                <span>Upload</span>
              </button>
            </div>

            {/* Navigation */}
            <div className="sidebar-nav">
              <NavItem
                icon={<Home size={17} />}
                label="Dashboard"
                active={activeFolder === null}
                onClick={() => { onAllDocsClick(); if (window.innerWidth < 768) onClose(); }}
              />
              <NavItem
                icon={<FileText size={17} />}
                label="All Documents"
                active={false}
                onClick={() => { onAllDocsClick(); if (window.innerWidth < 768) onClose(); }}
              />
            </div>

            {/* Folders */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <p className="sidebar-section-title">Folders</p>
                <button
                  className="sidebar-add-folder-btn"
                  onClick={() => setCreatingFolder(true)}
                  title="New folder"
                >
                  <FolderPlus size={15} />
                </button>
              </div>

              {/* Inline folder creation input */}
              <AnimatePresence>
                {creatingFolder && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="sidebar-new-folder"
                  >
                    <Folder size={15} className="sidebar-new-folder-icon" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="sidebar-new-folder-input"
                    />
                    <button
                      className="sidebar-new-folder-confirm"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="sidebar-new-folder-cancel"
                      onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="sidebar-folder-list">
                {folderTree.length > 0 ? (
                  folderTree.map(folder => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      activeFolder={activeFolder}
                      onFolderClick={(id) => { onFolderClick(id); if (window.innerWidth < 768) onClose(); }}
                      onCreateFolder={onCreateFolder}
                      onRenameFolder={onRenameFolder}
                      onDeleteFolder={onDeleteFolder}
                      depth={0}
                    />
                  ))
                ) : (
                  !creatingFolder && <p className="sidebar-empty">No folders yet</p>
                )}
              </div>
            </div>

            {/* Bottom */}
            <div className="sidebar-bottom">
              <div className="sidebar-widget">
                <motion.img
                  src="/images/7.png"
                  alt="decoration"
                  className="sidebar-widget-img"
                  drag
                  dragSnapToOrigin
                  whileHover={{ scale: 1.05 }}
                />
              </div>
              <NavItem icon={<Settings size={17} />} label="Settings" onClick={() => { onSettingsClick(); if (window.innerWidth < 768) onClose(); }} />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/* ---- Nav Item ---- */
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    className={`sidebar-nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </button>
)

/* ---- Folder Item (recursive) ---- */
const FolderItem = ({ 
  folder, 
  activeFolder, 
  onFolderClick, 
  onCreateFolder, 
  onRenameFolder, 
  onDeleteFolder, 
  depth 
}) => {
  const [open, setOpen] = useState(false)
  const [creatingChild, setCreatingChild] = useState(false)
  const [childName, setChildName] = useState('')
  const childInputRef = useRef(null)
  
  // Renaming folder states
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(folder.name)
  const renameInputRef = useRef(null)

  const hasChildren = folder.children && folder.children.length > 0
  const isActive = activeFolder === folder.id

  useEffect(() => {
    if (creatingChild && childInputRef.current) {
      childInputRef.current.focus()
    }
  }, [creatingChild])

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [isRenaming])

  const handleCreateChild = async () => {
    const name = childName.trim()
    if (!name) return
    await onCreateFolder(name, folder.id)
    setChildName('')
    setCreatingChild(false)
    setOpen(true)
  }

  const handleChildKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateChild()
    if (e.key === 'Escape') { setCreatingChild(false); setChildName('') }
  }

  const handleRenameFolder = async () => {
    const name = renameName.trim()
    if (!name || name === folder.name) {
      setIsRenaming(false)
      return
    }
    await onRenameFolder(folder.id, name)
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameFolder()
    if (e.key === 'Escape') { setIsRenaming(false); setRenameName(folder.name); }
  }

  const handleDeleteFolder = () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${folder.name}" and all subfolders/documents inside it?`)
    if (confirmDelete) {
      onDeleteFolder(folder.id)
    }
  }

  return (
    <div>
      <div
        className={`sidebar-folder-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <button className="sidebar-folder-toggle" onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span style={{ width: '14px', display: 'inline-block' }} />
        )}

        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameFolder}
            className="sidebar-folder-rename-input"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button className="sidebar-folder-name" onClick={() => onFolderClick(folder.id)}>
            {open ? <FolderOpen size={15} /> : <Folder size={15} />}
            <span>{folder.name}</span>
          </button>
        )}

        {!isRenaming && (
          <div className="sidebar-folder-actions">
            <button
              className="sidebar-folder-action-btn"
              onClick={(e) => { e.stopPropagation(); setRenameName(folder.name); setIsRenaming(true); }}
              title="Rename folder"
            >
              <Edit2 size={12} />
            </button>
            <button
              className="sidebar-folder-action-btn delete"
              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(); }}
              title="Delete folder"
            >
              <Trash2 size={12} />
            </button>
            <button
              className="sidebar-folder-action-btn"
              onClick={(e) => { e.stopPropagation(); setCreatingChild(true); setOpen(true) }}
              title="New subfolder"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(open || creatingChild) && (hasChildren || creatingChild) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Inline subfolder creation */}
            {creatingChild && (
              <div
                className="sidebar-new-folder"
                style={{ paddingLeft: `${28 + depth * 16}px` }}
              >
                <Folder size={14} className="sidebar-new-folder-icon" />
                <input
                  ref={childInputRef}
                  type="text"
                  placeholder="Subfolder name..."
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  onKeyDown={handleChildKeyDown}
                  className="sidebar-new-folder-input"
                />
                <button
                  className="sidebar-new-folder-confirm"
                  onClick={handleCreateChild}
                  disabled={!childName.trim()}
                >
                  <Check size={13} />
                </button>
                <button
                  className="sidebar-new-folder-cancel"
                  onClick={() => { setCreatingChild(false); setChildName('') }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {folder.children.map(child => (
              <FolderItem
                key={child.id}
                folder={child}
                activeFolder={activeFolder}
                onFolderClick={onFolderClick}
                onCreateFolder={onCreateFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---- Tree Builder ---- */
const buildFolderTree = (folders) => {
  const map = {}
  const roots = []

  folders.forEach(folder => {
    const id = folder._id || folder.id
    map[id] = { ...folder, id, children: [] }
  })

  folders.forEach(folder => {
    const id = folder._id || folder.id
    const parentId = folder.parentFolder
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[id])
    } else {
      roots.push(map[id])
    }
  })

  return roots
}

export default SideBar
