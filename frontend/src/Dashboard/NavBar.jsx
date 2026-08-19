import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Menu, X, LogOut, User, Settings, Sparkles } from 'lucide-react'

const NavBar = ({ sidebarOpen, onToggleSidebar, searchQuery, onSearchChange, user, onLogout, onSettingsClick, ragChatOpen, onToggleRagChat }) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const profileRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="navbar" style={{
      height: '56px',
      minHeight: '56px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '12px',
      zIndex: 30,
      position: 'relative',
    }}>
      {/* Left: Toggle + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onToggleSidebar}
          className="nav-icon-btn"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h1 className="nav-logo">docs.</h1>
      </div>

      {/* Center: Search */}
      <div className="nav-search-wrapper">
        <div className={`nav-search ${searchFocused ? 'focused' : ''}`}>
          <Search size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="nav-search-input"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="nav-search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right: AI Chat + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          className="px-3 py-1.5 rounded-lg border font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5"
          onClick={onToggleRagChat}
          style={ragChatOpen
            ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' }
            : { borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }
          }
          title="Chat with your workspace"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">AI Chat</span>
        </button>

        <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="nav-avatar-btn"
          >
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="nav-avatar-img" />
          ) : (
            <User size={18} />
          )}
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="nav-dropdown"
            >
              <div className="nav-dropdown-header">
                <p className="nav-dropdown-name">{user?.username || 'User'}</p>
                <p className="nav-dropdown-email">{user?.email || ''}</p>
              </div>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item" onClick={() => { setProfileOpen(false); onSettingsClick(); }}>
                <Settings size={15} />
                <span>Settings</span>
              </button>
              <button className="nav-dropdown-item danger" onClick={onLogout}>
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </nav>
)
}

export default NavBar