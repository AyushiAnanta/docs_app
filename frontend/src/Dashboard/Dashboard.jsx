import React, { useEffect, useState, useCallback, useRef } from 'react'
import NavBar from './NavBar'
import MainComponent from './MainComponent'
import SideBar from './SideBar'
import NewDocModal from './NewDocModal'
import SettingsModal, { applyTheme } from './SettingsModal'
import axios from 'axios'
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
  const [loading, setLoading] = useState(true)
  const uploadInputRef = useRef(null)

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
          const folderRes = await axios.post('/api/v1/folder/', { name: 'Uploads' })
          folderId = folderRes.data.data._id || folderRes.data.data.id
          await fetchFolders()
        }
      }

      const extension = file.name.split('.').pop().toLowerCase()
      const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      let parsedHTML = ''

      if (extension === 'txt') {
        parsedHTML = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (evt) => {
            const text = evt.target.result
            const cleanText = text
              .split('\n')
              .map(line => `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
              .join('')
            resolve(cleanText)
          }
          reader.onerror = (err) => reject(err)
          reader.readAsText(file)
        })
      } else if (extension === 'docx' || extension === 'doc') {
        await loadScript('mammoth-script', 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
        parsedHTML = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async (evt) => {
            try {
              const arrayBuffer = evt.target.result
              if (!window.mammoth) {
                throw new Error("Mammoth library failed to load.")
              }
              const result = await window.mammoth.convertToHtml({ arrayBuffer })
              resolve(result.value || '<p></p>')
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = (err) => reject(err)
          reader.readAsArrayBuffer(file)
        })
      } else if (extension === 'pdf') {
        await loadScript('pdfjs-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js')
        parsedHTML = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async (evt) => {
            try {
              const arrayBuffer = evt.target.result
              if (!window.pdfjsLib) {
                throw new Error("PDF.js library failed to load.")
              }
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
              const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
              let htmlText = ''
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i)
                const textContent = await page.getTextContent()
                const pageText = textContent.items.map(item => item.str).join(' ')
                if (pageText.trim()) {
                  htmlText += `<p>${pageText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
                }
              }
              resolve(htmlText || '<p>Empty PDF document</p>')
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = (err) => reject(err)
          reader.readAsArrayBuffer(file)
        })
      } else {
        throw new Error("Unsupported format. Please upload .pdf, .docx, or .txt files.")
      }

      // Create a native document on the backend with this HTML content
      const docRes = await axios.post('/api/v1/docs/', {
        title: titleWithoutExt,
        folder: folderId,
        content: parsedHTML
      })
      const newDoc = docRes.data.data

      // Redirect directly to the workspace editor page
      navigate(`/document/${newDoc._id}`)
    } catch (err) {
      console.error("Error converting file:", err)
      alert(err.message || "Failed to convert file to native document.")
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
      const res = await axios.get('/api/v1/docs/')
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
      const res = await axios.get(`/api/v1/docs/folder/${folderId}`)
      setDocs(res.data.data || [])
      setActiveFolder(folderId)
    } catch (error) {
      console.error('Error fetching folder docs:', error)
      setDocs([])
    }
  }, [])

  const fetchFolders = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/folder/')
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
      await axios.delete(`/api/v1/docs/${docId}`)
      setDocs(prev => prev.filter(d => d._id !== docId))
      setPinnedDocIds(prev => prev.filter(id => id !== docId))
    } catch (error) {
      console.error('Error deleting doc:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/user/logout')
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleNewDoc = async (docData) => {
    try {
      const res = await axios.post('/api/v1/docs/', docData)
      const newDoc = res.data.data
      setShowNewDocModal(false)
      navigate(`/document/${newDoc._id}`)
    } catch (error) {
      console.error('Error creating doc:', error)
    }
  }

  const handleCreateFolder = async (name, parentFolder) => {
    try {
      await axios.post('/api/v1/folder/', { name, parentFolder })
      fetchFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleRenameFolder = async (folderId, newName) => {
    try {
      await axios.patch(`/api/v1/folder/${folderId}`, { name: newName })
      fetchFolders()
    } catch (error) {
      console.error('Error renaming folder:', error)
    }
  }

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`/api/v1/folder/${folderId}?withDocs=true`)
      fetchFolders()
      if (activeFolder === folderId) {
        fetchAllDocs()
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  // Filter docs by search
  const filteredDocs = docs.filter(doc => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  })

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
    </div>
  )
}

export default Dashboard