import { motion } from 'motion/react'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import CustomHighlight from '../Highlight'
import { applyTheme, applyThemeMode } from '../Dashboard/SettingsModal'
import { Globe } from 'lucide-react'

const SharedDoc = () => {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [txtContent, setTxtContent] = useState('')

  useEffect(() => {
    if (doc && doc.content && doc.content.type === 'file-upload' && doc.content.extension === 'txt' && doc.content.fileUrl) {
      axios.get(doc.content.fileUrl)
        .then(res => setTxtContent(res.data))
        .catch(err => console.error("Error fetching shared text file:", err))
    }
  }, [doc])

  const editor = useEditor({
    editable: false, // Make read-only
    extensions: [
      StarterKit,
      Underline,
      Image,
      CustomHighlight,
    ],
    content: '',
  })

  // Load saved theme preferences on mount
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

  // Fetch public shared document once on mount
  useEffect(() => {
    const fetchSharedDoc = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await axios.get(`/api/v1/docs/shared/${id}`)
        if (res.data.success || res.data.statusCode === 200) {
          const fetchedDoc = res.data.data
          setDoc(fetchedDoc)
          if (editor && fetchedDoc.content) {
            editor.commands.setContent(fetchedDoc.content)
          }
        }
      } catch (err) {
        console.error("Error fetching shared document:", err)
        setError(err.response?.data?.message || "Failed to load shared document. It may be private or deleted.")
      } finally {
        setLoading(false)
      }
    }

    if (editor) {
      fetchSharedDoc()
    }
  }, [id, editor])

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
        <div className="text-lg font-medium">Loading shared document...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="h-screen w-screen flex flex-col items-center justify-center gap-6 p-6 text-center"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        <motion.img
          src="/images/3.png"
          alt="error"
          style={{ height: 140, opacity: 0.7 }}
        />
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p className="max-w-md" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <a 
          href="/auth" 
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-fuchsia-500/10 hover:scale-105 transition-all"
        >
          Sign In to docs.
        </a>
      </div>
    )
  }

  return (
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
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-fuchsia-500" />
          <h2 className="text-sm font-semibold text-zinc-300 max-w-[50vw] truncate">
            {doc?.title || 'Shared Document'}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
            Read-Only
          </span>
        </div>
        
        <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
          docs.
        </h1>
      </motion.header>

      {/* Editor Content Box */}
      <div id="page" className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-24 z-10 relative">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-md border rounded-2xl shadow-2xl p-6 sm:p-10 md:p-14 min-h-[80vh]"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {doc?.content?.type === 'file-upload' ? (
            <div className="flex flex-col gap-4 w-full">
              {/* Header preview info */}
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {doc.title}
                  </h1>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-fuchsia-400">
                    Shared {doc.content.extension?.toUpperCase()} Document
                  </p>
                </div>
                <a 
                  href={doc.content.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-[10px] font-bold transition-all cursor-pointer"
                >
                  Download
                </a>
              </div>

              {/* View Rendering based on extension */}
              {doc.content.extension === 'pdf' && (
                <iframe
                  src={doc.content.fileUrl}
                  title={doc.title}
                  className="w-full h-[70vh] rounded-lg border"
                  style={{ borderColor: 'var(--border)' }}
                />
              )}

              {(doc.content.extension === 'docx' || doc.content.extension === 'doc') && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.content.fileUrl)}`}
                  title={doc.title}
                  className="w-full h-[70vh] rounded-lg border bg-white"
                  style={{ borderColor: 'var(--border)' }}
                />
              )}

              {doc.content.extension === 'txt' && (
                <div 
                  className="w-full h-[70vh] overflow-y-auto p-4 rounded-lg border font-mono text-xs whitespace-pre-wrap select-text"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {txtContent || 'Loading file content...'}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {doc?.title || 'Untitled Document'}
                </h1>
                <div className="flex items-center gap-2 mt-3">
                  {doc?.tags?.map(tag => (
                    <span key={tag} className="text-xs text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <EditorContent
                editor={editor}
                className="ProseMirror outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </>
          )}
        </motion.div>
      </div>

    </div>
  )
}

export default SharedDoc
