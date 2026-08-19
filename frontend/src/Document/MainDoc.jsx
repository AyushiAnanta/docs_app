import { motion, AnimatePresence } from 'motion/react'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import CustomHighlight from '../Highlight'
import { Download, Paperclip, File, Trash2, Loader2, CloudLightning, Sparkles } from 'lucide-react'
import { applyTheme, applyThemeMode } from '../Dashboard/SettingsModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import RagChat from '../components/RagChat/RagChat'
import Notification from '../components/Notification/Notification'
import { Citation } from '../extensions/Citation'
import {
  faBold,
  faItalic,
  faStrikethrough,
  faCode,
  faCodeBranch,
  faAlignJustify,
  faListUl,
  faListOl,
  faQuoteRight,
  faUnderline,
  faHighlighter,
  faImage,
  faLink
} from '@fortawesome/free-solid-svg-icons'

const MainDoc = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [contentLoaded, setContentLoaded] = useState(false)
  const [txtContent, setTxtContent] = useState('')

  useEffect(() => {
    if (doc && doc.content && doc.content.type === 'file-upload' && doc.content.extension === 'txt' && doc.content.fileUrl) {
      axios.get(doc.content.fileUrl)
        .then(res => setTxtContent(res.data))
        .catch(err => console.error("Error fetching text file content:", err))
    }
  }, [doc])
  
  // Autosave states
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const [changeTrigger, setChangeTrigger] = useState(0)

  // Drawer Panel states
  const [showPanel, setShowPanel] = useState(false) // replaces showHistory
  const [activePanelTab, setActivePanelTab] = useState('history') // 'history' | 'attachments'

  // Version History state
  const [versions, setVersions] = useState([])

  // Attachments states
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Download menu state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const downloadMenuRef = useRef(null)

  // RAG Chat panel state
  const [ragChatOpen, setRagChatOpen] = useState(false)

  // Inline notification state
  const [notification, setNotification] = useState(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      Image,
      CustomHighlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Citation,
      Placeholder.configure({
        placeholder: 'Write something awesome...',
      }),
    ],
    content: '',
  })

  // Close download menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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

  // Fetch document once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/v1/docs/${id}`);
        if ((res.data.success || res.data.statusCode === 200) && isMounted) {
          const fetchedDoc = res.data.data;
          setDoc(fetchedDoc);
          setTitle(fetchedDoc.title || 'Untitled Document');
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDoc();
    return () => { isMounted = false; };
  }, [id]);

  // Set editor content once when editor and doc data are both ready
  useEffect(() => {
    if (editor && doc && !contentLoaded) {
      if (doc.content) {
        editor.commands.setContent(doc.content);
      }
      setContentLoaded(true);
    }
  }, [editor, doc, contentLoaded]);

  // Listen to editor content updates for autosave
  useEffect(() => {
    if (!editor || !contentLoaded) return;
    
    const handleUpdate = () => {
      setSaveStatus('saving');
      setChangeTrigger(prev => prev + 1);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, contentLoaded]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (changeTrigger === 0) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const currentTitle = title.trim() || 'Untitled Document';
        const content = editor.getJSON();
        await axios.patch(`/api/v1/docs/${id}`, {
          title: currentTitle,
          content
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus('error');
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(delayDebounceFn);
  }, [changeTrigger, id, title, editor]);

  // Fetch Version History
  const fetchVersions = async () => {
    try {
      const res = await axios.get(`/api/v1/version/${id}`)
      if (res.data.success || res.data.statusCode === 200) {
        setVersions(res.data.data || [])
      }
    } catch (error) {
      console.error("Error fetching versions:", error)
    }
  }

  // Fetch Attachments
  const fetchAttachments = async () => {
    try {
      const res = await axios.get(`/api/v1/file/${id}`)
      if (res.data.success || res.data.statusCode === 200) {
        setFiles(res.data.data || [])
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    }
  }

  useEffect(() => {
    if (showPanel) {
      if (activePanelTab === 'history') {
        fetchVersions()
      } else if (activePanelTab === 'attachments') {
        fetchAttachments()
      }
    }
  }, [showPanel, activePanelTab, id])

  if (!editor) return null

  // Manual save creates snapshot and exits to dashboard
  const handleSave = async () => {
    try {
      const currentTitle = title.trim() || 'Untitled Document';
      const content = editor.getJSON();
      
      const res = await axios.patch(`/api/v1/docs/${id}`, {
        title: currentTitle,
        content
      });

      if (res.data.success || res.data.statusCode === 200) {
        await axios.post(`/api/v1/version/${id}`, {
          content
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  // Restore document version
  const handleRestore = async (versionId) => {
    try {
      const res = await axios.patch(`/api/v1/version/version/${versionId}/restore`);
      if (res.data.success || res.data.statusCode === 200) {
        const restoredDoc = res.data.data;
        editor.commands.setContent(restoredDoc.content);
        setTitle(restoredDoc.title);
        setSaveStatus('saved');
        setShowPanel(false);
        setNotification({ message: "Document restored to selected version.", type: 'success' });
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      const msg = error.response?.data?.message || "Failed to restore version.";
      setNotification({ message: msg, type: 'error' });
    }
  }

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', file.name)

    try {
      setUploading(true)
      const res = await axios.post(`/api/v1/file/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success || res.data.statusCode === 201) {
        fetchAttachments()
        setNotification({ message: "Attachment uploaded successfully.", type: 'success' });
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      const msg = error.response?.data?.message || "File upload failed.";
      setNotification({ message: msg, type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // File Delete Handler
  const handleFileDelete = async (fileId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this attachment?")
    if (!confirmDelete) return
    try {
      await axios.delete(`/api/v1/file/file/${fileId}`)
      fetchAttachments()
      setNotification({ message: "Attachment deleted.", type: 'info' });
    } catch (error) {
      console.error("Error deleting file:", error)
      const msg = error.response?.data?.message || "Failed to delete attachment.";
      setNotification({ message: msg, type: 'error' });
    }
  }

  // Exports & Downloads
  const exportPDF = () => {
    setShowDownloadMenu(false)
    const element = document.querySelector('.ProseMirror')
    if (!element) return

    // Temporarily apply light export styling directly to the live DOM element for html2canvas
    element.classList.add('pdf-export-mode')

    const triggerHtml2Pdf = (el) => {
      const opt = {
        margin:       15,
        filename:     `${title.trim() || 'Untitled Document'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      window.html2pdf()
        .from(el)
        .set(opt)
        .save()
        .then(() => {
          el.classList.remove('pdf-export-mode')
        })
        .catch((err) => {
          console.error("PDF export error:", err)
          el.classList.remove('pdf-export-mode')
        })
    }

    if (window.html2pdf) {
      triggerHtml2Pdf(element)
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => triggerHtml2Pdf(element)
      document.body.appendChild(script)
    }
  }

  const exportWord = () => {
    setShowDownloadMenu(false)
    const contentHtml = editor.getHTML()
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
          "xmlns:w='urn:schemas-microsoft-com:office:word' "+
          "xmlns='http://www.w3.org/TR/REC-html40'>"+
          "<head><title>Document</title><style>body { font-family: Arial; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + contentHtml + footer;
    
    const blob = new Blob(['\ufeff' + sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.trim() || 'Untitled Document'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const exportText = () => {
    setShowDownloadMenu(false)
    const textContent = editor.getText()
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.trim() || 'Untitled Document'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Sharing states
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/shared/${id}`
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setNotification({ message: "Shareable link copied to clipboard!", type: 'success' })

      if (doc && !doc.isPublic) {
        const res = await axios.patch(`/api/v1/docs/${id}/toggle-public`)
        if (res.data.success || res.data.statusCode === 200) {
          setDoc(prev => ({ ...prev, isPublic: true }))
        }
      }
    } catch (err) {
      console.error("Failed to share link:", err)
      setNotification({ message: "Failed to copy share link.", type: 'error' })
    }
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('saving');
    setChangeTrigger(prev => prev + 1);
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isBold = editor.isActive('bold')
  const isStrike = editor.isActive('strike')
  const isItalic = editor.isActive('italic')
  const isCode = editor.isActive('code')
  const isCodeBlock = editor.isActive('codeBlock')
  const isParagraph = editor.isActive('paragraph')
  const isHeading1 = editor.isActive('heading', { level: 1 })
  const isHeading2 = editor.isActive('heading', { level: 2 })
  const isHeading3 = editor.isActive('heading', { level: 3 })
  const isHeading4 = editor.isActive('heading', { level: 4 })
  const isHeading5 = editor.isActive('heading', { level: 5 })
  const isHeading6 = editor.isActive('heading', { level: 6 })
  const isBulletList = editor.isActive('bulletList')
  const isOrderedList = editor.isActive('orderedList')
  const isBlockquote = editor.isActive('blockquote')
  const isUnderline = editor.isActive('underline')
  const isHighlight = editor.isActive('customHighlight')

  const toolbarActions = [
    { key: 'b', label: <FontAwesomeIcon icon={faBold} />, active: isBold, action: () => editor.chain().focus().toggleBold().run() },
    { key: 'i', label: <FontAwesomeIcon icon={faItalic} />, active: isItalic, action: () => editor.chain().focus().toggleItalic().run() },
    { key: 's', label: <FontAwesomeIcon icon={faStrikethrough} />, active: isStrike, action: () => editor.chain().focus().toggleStrike().run() },
    { key: 'c', label: <FontAwesomeIcon icon={faCode} />, active: isCode, action: () => editor.chain().focus().toggleCode().run() },
    { key: 'ch', label: <FontAwesomeIcon icon={faCodeBranch} />, active: isCodeBlock, action: () => editor.chain().focus().toggleCodeBlock().run() },
    { key: 'a', label: <FontAwesomeIcon icon={faAlignJustify} />, active: isParagraph, action: () => editor.chain().focus().setParagraph().run() },
    { key: 'h1', label: <span className="font-bold text-xs">H1</span>, active: isHeading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: 'h2', label: <span className="font-bold text-xs">H2</span>, active: isHeading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: <span className="font-bold text-xs">H3</span>, active: isHeading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'h4', label: <span className="font-bold text-xs">H4</span>, active: isHeading4, action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { key: 'h5', label: <span className="font-bold text-xs">H5</span>, active: isHeading5, action: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { key: 'h6', label: <span className="font-bold text-xs">H6</span>, active: isHeading6, action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
    { key: 'l', label: <FontAwesomeIcon icon={faListUl} />, active: isBulletList, action: () => editor.chain().focus().toggleBulletList().run() },
    { key: 'lo', label: <FontAwesomeIcon icon={faListOl} />, active: isOrderedList, action: () => editor.chain().focus().toggleOrderedList().run() },
    { key: 'q', label: <FontAwesomeIcon icon={faQuoteRight} />, active: isBlockquote, action: () => editor.chain().focus().toggleBlockquote().run() },
    { key: 'u', label: <FontAwesomeIcon icon={faUnderline} />, active: isUnderline, action: () => editor.chain().focus().toggleUnderline().run() },
    { key: 'h', label: <FontAwesomeIcon icon={faHighlighter} />, active: isHighlight, action: () => editor.chain().focus().toggleHighlight().run() },
  ]

  const isUploadedFile = doc && doc.content && doc.content.type === 'file-upload'

  if (loading) {
    return (
      <div 
        className="h-screen w-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        <motion.img
          src="/images/1.png"
          alt="loading"
          style={{ height: 120, opacity: 0.6 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="text-lg font-medium">Loading document...</div>
      </div>
    )
  }

  return (
    <>
    <div 
      className="min-h-screen w-screen flex flex-col relative overflow-x-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Graphic overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: "url('/images/background.png')" }}
      />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between shadow-lg h-14"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Document title..."
          className="focus:border-fuchsia-500/80 rounded-lg px-3 py-1.5 outline-none w-[40vw] sm:w-[25vw] transition-all font-semibold text-sm border"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Autosave status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 mr-2 select-none">
            {saveStatus === 'saving' && (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Draft saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400">Save error</span>
              </>
            )}
          </div>

          {/* Download Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="px-3 py-1.5 rounded-lg border font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              title="Download/Export"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 mt-2 w-44 rounded-lg shadow-xl py-1 z-35 border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                >
                  <button 
                    onClick={exportPDF} 
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-card-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Export to PDF (.pdf)
                  </button>
                  <button 
                    onClick={exportWord} 
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-card-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Export to Word (.doc)
                  </button>
                  <button 
                    onClick={exportText} 
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-card-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Export to Text (.txt)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            className="px-3 py-1.5 rounded-lg border font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            onClick={handleShare}
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <FontAwesomeIcon icon={faLink} />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <button 
            className="px-3 py-1.5 rounded-lg border font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            onClick={() => { setShowPanel(prev => !prev); }}
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <Paperclip size={13} />
            <span className="hidden sm:inline">Files & History</span>
          </button>

          <button 
            className="px-3 py-1.5 rounded-lg border font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            onClick={() => setRagChatOpen(prev => !prev)}
            style={ragChatOpen
              ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' }
              : { borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }
            }
            title="Chat with your workspace"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          <button 
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-amber-500 text-zinc-950 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center font-bold text-xs transition-all duration-150 shadow-md shadow-fuchsia-500/10 cursor-pointer"
            onClick={handleSave}
          >
            Save
          </button>
          
          <h1 
            className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate('/dashboard')}
          >
            docs.
          </h1>
        </div>
      </motion.header>

      {/* Toolbar - Horizontally Scrollable on Mobile (Hidden for uploaded files) */}
      {!isUploadedFile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="fixed top-14 left-0 right-0 z-20 backdrop-blur-md border-b p-2 flex justify-center shadow-md overflow-x-auto scrollbar-none"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5 max-w-full px-2 py-0.5 md:flex-wrap md:justify-center scrollbar-none">
            {toolbarActions.map(({ key, label, active, action }) => (
              <button
                key={key}
                onClick={action}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center min-w-8 h-8 flex-shrink-0 border ${
                  active
                    ? 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20'
                    : ''
                }`}
                style={!active ? { background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
              >
                {label}
              </button>
            ))}

            {/* Image button */}
            <button
              onClick={() => {
                const url = window.prompt('Enter image URL')
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run()
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex-shrink-0 flex items-center justify-center h-8"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <FontAwesomeIcon icon={faImage}/>
            </button>
          </div>
        </motion.div>
      )}

      {/* Editor / File Viewer Content Box */}
      <div id="page" className={`flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-12 z-10 relative ${isUploadedFile ? 'pt-20' : 'pt-32'}`}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-md border rounded-2xl shadow-2xl p-6 sm:p-10 md:p-14 min-h-[70vh]"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {isUploadedFile ? (
            <div className="flex flex-col gap-4 w-full">
              {/* Header preview info */}
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{doc.title}</h2>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-fuchsia-400 mt-1">
                    Uploaded {doc.content.extension?.toUpperCase()} Document
                  </p>
                </div>
                <a 
                  href={doc.content.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-[10px] font-bold transition-all cursor-pointer"
                >
                  Download Original
                </a>
              </div>

              {/* View Rendering based on extension */}
              {doc.content.extension === 'pdf' && (
                <iframe
                  src={doc.content.fileUrl}
                  title={doc.title}
                  className="w-full h-[65vh] rounded-lg border"
                  style={{ borderColor: 'var(--border)' }}
                />
              )}

              {(doc.content.extension === 'docx' || doc.content.extension === 'doc') && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.content.fileUrl)}`}
                  title={doc.title}
                  className="w-full h-[65vh] rounded-lg border bg-white"
                  style={{ borderColor: 'var(--border)' }}
                />
              )}

              {doc.content.extension === 'txt' && (
                <div 
                  className="w-full h-[65vh] overflow-y-auto p-4 rounded-lg border font-mono text-xs whitespace-pre-wrap select-text"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {txtContent || 'Loading file content...'}
                </div>
              )}
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="cursor-text ProseMirror outline-none
                [&.is-empty::before]:content-[attr(data-placeholder)]
                [&.is-empty::before]:text-zinc-500
                [&.is-empty::before]:float-left"
              style={{ color: 'var(--text-primary)' }}
            />
          )}
        </motion.div>
      </div>

      {/* Right Drawer Panel (Dual tabs: History & Attachments) */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop overlay for closing */}
            <div 
              className="fixed inset-0 z-35 bg-black/45 backdrop-blur-xs"
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed top-0 right-0 bottom-0 w-[320px] border-l z-40 p-4 shadow-2xl flex flex-col pt-16"
              style={{ background: 'var(--bg-secondary)', borderLeftColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {/* Header Tab Selectors */}
              <div className="flex border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setActivePanelTab('history')}
                  className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all ${
                    activePanelTab === 'history'
                      ? 'border-fuchsia-500 text-fuchsia-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActivePanelTab('attachments')}
                  className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all ${
                    activePanelTab === 'attachments'
                      ? 'border-fuchsia-500 text-fuchsia-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Attachments ({files.length})
                </button>
              </div>

              {/* TAB 1: History content */}
              {activePanelTab === 'history' && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                  {versions.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">No saved versions yet</p>
                  ) : (
                    versions.map((ver, idx) => (
                      <div 
                        key={ver._id}
                        className="p-3 rounded-lg border flex flex-col gap-2 transition-colors"
                        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {idx === 0 ? 'Current Version' : `Version ${versions.length - idx}`}
                          </span>
                          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(ver.createdAt)}
                          </span>
                        </div>
                        
                        {idx > 0 && (
                          <button
                            onClick={() => handleRestore(ver._id)}
                            className="w-full py-1.5 text-center bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 hover:text-fuchsia-300 font-bold text-[10px] uppercase tracking-wider rounded border border-fuchsia-500/20 transition-all cursor-pointer"
                          >
                            Restore this version
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Attachments content */}
              {activePanelTab === 'attachments' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Upload button area */}
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-2 border rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-fuchsia-500" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip size={13} className="text-fuchsia-400" />
                          <span>Attach File</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Attached Files List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {files.length === 0 ? (
                      <p className="text-xs text-zinc-550 text-center py-8">No attachments uploaded</p>
                    ) : (
                      files.map(file => (
                        <div 
                          key={file._id}
                          className="p-3 rounded-lg border flex items-center justify-between transition-colors"
                          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
                        >
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 min-w-0 flex-1 hover:text-fuchsia-400 transition-colors cursor-pointer"
                            title="Download attachment"
                          >
                            <File size={16} className="text-zinc-500 flex-shrink-0" />
                            <div className="min-w-0 flex flex-col">
                              <span className="text-xs font-medium truncate pr-2" style={{ color: 'var(--text-primary)' }}>
                                {file.filename}
                              </span>
                              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                {formatDate(file.createdAt)}
                              </span>
                            </div>
                          </a>
                          
                          <button
                            onClick={() => handleFileDelete(file._id)}
                            className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                            title="Delete attachment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

    {/* RAG Chat slide-over panel */}
    <RagChat isOpen={ragChatOpen} onClose={() => setRagChatOpen(false)} editor={editor} />

    {/* Inline toast notification */}
    <Notification notification={notification} onClose={() => setNotification(null)} />
  </>
  )
}

export default MainDoc
