import React, { useEffect, useState, useCallback, useRef } from 'react'
import NavBar from './NavBar'
import MainComponent from './MainComponent'
import SideBar from './SideBar'
import NewDocModal from './NewDocModal'
import SettingsModal, { applyTheme } from './SettingsModal'
import Notification from '../components/Notification/Notification'
import RagChat from '../components/RagChat/RagChat'
import api from '../axios'
import { useNavigate } from 'react-router-dom'
import './dashboard.css'

const Dashboard = ({ user: initialUser, onLogout }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(initialUser)
  const [docs, setDocs] = useState([])
  const [folders, setFolders] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState(null) // null = all docs
  const [pinnedDocIds, setPinnedDocIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pinnedDocs') || '[]')
    } catch { return [] }
  })
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [ragChatOpen, setRagChatOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const uploadInputRef = useRef(null)
  // Semantic search state
  const [searchResults, setSearchResults] = useState(null) // null = not searched yet; [] = no results
  // Inline notification state
  const [notification, setNotification] = useState(null)

  const loadScript = (id, src) => {
    return new Promise((resolve) => {
      if (document.getElementById(id)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.onload = () => resolve()
      document.body.appendChild(script)
    })
  }

  const handleDashboardUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    try {
      let folderId = activeFolder
      if (!folderId) {
        if (folders.length > 0) {
          folderId = folders[0]._id || folders[0].id
        } else {
          const folderRes = await api.post('/api/v1/folder/', { name: 'Uploads' })
          folderId = folderRes.data.data._id || folderRes.data.data.id
          await fetchFolders()
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      if (folderId) formData.append('folderId', folderId)

      const docRes = await api.post('/api/v1/docs/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const newDoc = docRes.data.data

      // Redirect directly to the workspace editor page
      navigate(`/document/${newDoc._id}`)
    } catch (err) {
      console.error("Error importing file:", err)
      const errorMsg = err.response?.data?.message || err.message || "Failed to import file to native document."
      setNotification({ message: errorMsg, type: 'error' })
    } finally {
      setLoading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

  // Initialize saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('docs-theme') || 'vibrant-magenta'
    applyTheme(savedTheme)

    const savedMode = localStorage.getItem('docs-theme-mode') || 'dark'
    if (savedMode === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
  }, [])

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persist pinned docs
  useEffect(() => {
    localStorage.setItem('pinnedDocs', JSON.stringify(pinnedDocIds))
  }, [pinnedDocIds])

  const fetchAllDocs = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/docs/')
      setDocs(res.data.data || [])
      setActiveFolder(null)
    } catch (error) {
      console.error('Error fetching docs:', error)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDocsByFolder = useCallback(async (folderId) => {
    try {
      const res = await api.get(`/api/v1/docs/folder/${folderId}`)
      setDocs(res.data.data || [])
      setActiveFolder(folderId)
    } catch (error) {
      console.error('Error fetching folder docs:', error)
      setDocs([])
    }
  }, [])

  const fetchFolders = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/folder/')
      setFolders(res.data.data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }, [])

  useEffect(() => {
    fetchAllDocs()
    fetchFolders()
  }, [fetchAllDocs, fetchFolders])

  const togglePin = (docId) => {
    setPinnedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await api.delete(`/api/v1/docs/${docId}`)
      setDocs(prev => prev.filter(d => d._id !== docId))
      setPinnedDocIds(prev => prev.filter(id => id !== docId))
      setNotification({ message: "Document deleted successfully.", type: 'info' })
    } catch (error) {
      console.error('Error deleting doc:', error)
      const msg = error.response?.data?.message || "Failed to delete document."
      setNotification({ message: msg, type: 'error' })
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/user/logout')
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      const msg = error.response?.data?.message || "Failed to log out."
      setNotification({ message: msg, type: 'error' })
    }
  }

  const handleNewDoc = async (docData) => {
    try {
      const res = await api.post('/api/v1/docs/', docData)
      const newDoc = res.data.data
      setShowNewDocModal(false)
      navigate(`/document/${newDoc._id}`)
    } catch (error) {
      console.error('Error creating doc:', error)
      const msg = error.response?.data?.message || "Failed to create document."
      setNotification({ message: msg, type: 'error' })
    }
  }

  const handleCreateFolder = async (name, parentFolder) => {
    try {
      await api.post('/api/v1/folder/', { name, parentFolder })
      fetchFolders()
      setNotification({ message: `Folder "${name}" created.`, type: 'success' })
    } catch (error) {
      console.error('Error creating folder:', error)
      const msg = error.response?.data?.message || "Failed to create folder."
      setNotification({ message: msg, type: 'error' })
    }
  }

  const handleRenameFolder = async (folderId, newName) => {
    try {
      await api.patch(`/api/v1/folder/${folderId}`, { name: newName })
      fetchFolders()
      setNotification({ message: "Folder renamed.", type: 'success' })
    } catch (error) {
      console.error('Error renaming folder:', error)
      const msg = error.response?.data?.message || "Failed to rename folder."
      setNotification({ message: msg, type: 'error' })
    }
  }

  const handleDeleteFolder = async (folderId) => {
    try {
      await api.delete(`/api/v1/folder/${folderId}?withDocs=true`)
      fetchFolders()
      if (activeFolder === folderId) {
        fetchAllDocs()
      }
      setNotification({ message: "Folder deleted.", type: 'info' })
    } catch (error) {
      console.error('Error deleting folder:', error)
      const msg = error.response?.data?.message || "Failed to delete folder."
      setNotification({ message: msg, type: 'error' })
    }
  }

  // Semantic search via hybrid endpoint (debounced 400ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/api/v1/search', { query: searchQuery.trim() })
        const hits = res.data.data || []
        // Map hit docIds back to full doc objects from the docs list
        const hitDocIds = new Set(hits.map(h => h.docId?.toString()))
        const matched = docs.filter(d => hitDocIds.has(d._id?.toString()))
        // If semantic search found nothing, fall back to title substring match
        if (matched.length === 0) {
          const q = searchQuery.toLowerCase()
          setSearchResults(docs.filter(d =>
            d.title?.toLowerCase().includes(q) ||
            d.tags?.some(tag => tag.toLowerCase().includes(q))
          ))
        } else {
          // Order by hit rank (order from search results)
          const orderedIds = hits.map(h => h.docId?.toString())
          setSearchResults(
            matched.sort((a, b) => orderedIds.indexOf(a._id?.toString()) - orderedIds.indexOf(b._id?.toString()))
          )
        }
      } catch {
        // Fallback to local filter on error
        const q = searchQuery.toLowerCase()
        setSearchResults(docs.filter(d =>
          d.title?.toLowerCase().includes(q) ||
          d.tags?.some(tag => tag.toLowerCase().includes(q))
        ))
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, docs])

  // Use semantic search results when available, otherwise full doc list
  const filteredDocs = searchResults !== null ? searchResults : docs

  const pinnedDocs = filteredDocs.filter(d => pinnedDocIds.includes(d._id))
  const recentDocs = filteredDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      <NavBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onLogout={handleLogout}
        onSettingsClick={() => setShowSettingsModal(true)}
        ragChatOpen={ragChatOpen}
        onToggleRagChat={() => setRagChatOpen(prev => !prev)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <SideBar
          isOpen={sidebarOpen}
          folders={folders}
          activeFolder={activeFolder}
          onAllDocsClick={fetchAllDocs}
          onFolderClick={fetchDocsByFolder}
          onNewClick={() => setShowNewDocModal(true)}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onSettingsClick={() => setShowSettingsModal(true)}
          onUploadClick={() => uploadInputRef.current.click()}
          onClose={() => setSidebarOpen(false)}
        />

        <MainComponent
          docs={recentDocs}
          pinnedDocs={pinnedDocs}
          pinnedDocIds={pinnedDocIds}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onTogglePin={togglePin}
          onDeleteDoc={handleDeleteDoc}
          loading={loading}
          activeFolder={activeFolder}
          onNewClick={() => setShowNewDocModal(true)}
        />
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        onChange={handleDashboardUpload}
        accept=".pdf,.txt,.docx"
        style={{ display: 'none' }}
      />

      {showNewDocModal && (
        <NewDocModal
          folders={folders}
          onClose={() => setShowNewDocModal(false)}
          onCreate={handleNewDoc}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettingsModal(false)}
          onUserUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}

      <Notification notification={notification} onClose={() => setNotification(null)} />
      <RagChat isOpen={ragChatOpen} onClose={() => setRagChatOpen(false)} />
    </div>
  )
}

export default Dashboard