import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { X, User, Palette, Lock, Mail, Check, AlertCircle } from 'lucide-react'
import axios from 'axios'

const THEMES = [
  { id: 'vibrant-magenta', name: 'Vibrant Pop', primary: '#D946EF', secondary: '#F59E0B', desc: 'Magenta & Warm Amber (Default)' },
  { id: 'classic-purple', name: 'Classic Purple', primary: '#9fa3ff', secondary: '#c9bdff', desc: 'Muted Notion Lavender' },
  { id: 'neon-emerald', name: 'Neon Cyber', primary: '#10B981', secondary: '#06B6D4', desc: 'Emerald Green & Cyan' },
  { id: 'rose-cyberpunk', name: 'Rose Cyberpunk', primary: '#F43F5E', secondary: '#EC4899', desc: 'Rose & Pink Hot Glow' },
]

export const applyTheme = (themeId) => {
  const root = document.documentElement
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  
  root.style.setProperty('--accent', theme.primary)
  root.style.setProperty('--accent-soft', theme.secondary)
  
  // Extract RGB values for dim and glow effects
  if (themeId === 'vibrant-magenta') {
    root.style.setProperty('--accent-dim', 'rgba(217, 70, 239, 0.12)')
    root.style.setProperty('--accent-glow', 'rgba(217, 70, 239, 0.2)')
  } else if (themeId === 'classic-purple') {
    root.style.setProperty('--accent-dim', 'rgba(159, 163, 255, 0.12)')
    root.style.setProperty('--accent-glow', 'rgba(159, 163, 255, 0.2)')
  } else if (themeId === 'neon-emerald') {
    root.style.setProperty('--accent-dim', 'rgba(16, 185, 129, 0.12)')
    root.style.setProperty('--accent-glow', 'rgba(16, 185, 129, 0.2)')
  } else if (themeId === 'rose-cyberpunk') {
    root.style.setProperty('--accent-dim', 'rgba(244, 63, 94, 0.12)')
    root.style.setProperty('--accent-glow', 'rgba(244, 63, 94, 0.2)')
  }
  
  localStorage.setItem('docs-theme', themeId)
}

export const applyThemeMode = (mode) => {
  const body = document.body
  if (mode === 'light') {
    body.classList.add('light-mode')
  } else {
    body.classList.remove('light-mode')
  }
  localStorage.setItem('docs-theme-mode', mode)
}

const SettingsModal = ({ user, onClose, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('docs-theme') || 'vibrant-magenta')
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('docs-theme-mode') || 'dark')

  const handleToggleMode = (mode) => {
    setThemeMode(mode)
    applyThemeMode(mode)
  }

  // Profile fields
  const [email, setEmail] = useState(user?.email || '')
  
  // Password fields
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notifications
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' })
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setProfileMsg({ text: '', type: '' })
    try {
      const res = await axios.patch('/api/v1/user/update-account', { email })
      if (res.data.success || res.data.statusCode === 200) {
        setProfileMsg({ text: 'Email updated successfully!', type: 'success' })
        if (onUserUpdate) onUserUpdate(res.data.data)
      }
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Failed to update email.', type: 'error' })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg({ text: '', type: '' })

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    try {
      const res = await axios.post('/api/v1/user/change-password', { oldPassword, newPassword })
      if (res.data.success || res.data.statusCode === 200) {
        setPasswordMsg({ text: 'Password changed successfully!', type: 'success' })
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || 'Failed to change password.', type: 'error' })
    }
  }

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId)
    applyTheme(themeId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Backdrop Closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-[620px] h-[480px] shadow-2xl flex flex-row overflow-hidden z-10"
      >
        {/* Left Tab selector */}
        <div className="w-[180px] bg-zinc-950/40 border-r border-zinc-800/80 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-6 px-2">
            <img 
              src={user?.avatar || '/images/8.png'} 
              alt="avatar" 
              className="w-8 h-8 rounded-full object-cover border border-zinc-800"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate">{user?.username}</p>
              <p className="text-[10px] text-zinc-500 truncate">Settings Panel</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full py-2 px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User size={14} />
            <span>Profile & Account</span>
          </button>
          
          <button
            onClick={() => setActiveTab('themes')}
            className={`w-full py-2 px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold transition-all ${
              activeTab === 'themes' 
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette size={14} />
            <span>App Themes</span>
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 p-6 flex flex-col min-w-0 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>

          {activeTab === 'profile' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-none">
              <h2 className="text-base font-bold text-zinc-100 mb-4">Profile & Account</h2>
              
              {/* Email Form */}
              <form onSubmit={handleUpdateEmail} className="space-y-3 mb-6 pb-6 border-b border-zinc-800/80">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={10} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-fuchsia-500 rounded-lg px-3 py-1.5 outline-none text-xs text-zinc-100 transition-all"
                    required
                  />
                </div>
                {profileMsg.text && (
                  <div className={`text-[10px] font-semibold flex items-center gap-1 ${
                    profileMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {profileMsg.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                    {profileMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] border border-zinc-700/50 cursor-pointer transition-colors"
                >
                  Update Email
                </button>
              </form>

              {/* Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-3 pb-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={10} /> Change Password
                  </label>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-fuchsia-500 rounded-lg px-3 py-1.5 outline-none text-xs text-zinc-100 transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-fuchsia-500 rounded-lg px-3 py-1.5 outline-none text-xs text-zinc-100 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-fuchsia-500 rounded-lg px-3 py-1.5 outline-none text-xs text-zinc-100 transition-all"
                    required
                  />
                </div>
                {passwordMsg.text && (
                  <div className={`text-[10px] font-semibold flex items-center gap-1 ${
                    passwordMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {passwordMsg.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                    {passwordMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] border border-zinc-700/50 cursor-pointer transition-colors"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="flex-1 flex flex-col min-h-0">
              <h2 className="text-base font-bold text-zinc-100 mb-2">App Themes</h2>
              <p className="text-[11px] text-zinc-500 mb-4">Choose appearance mode and accent color pop to apply.</p>
              
              {/* Base Appearance Selection */}
              <div className="mb-4 pb-4 border-b border-zinc-800/80">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Appearance Mode</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleMode('dark')}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-zinc-800 border-accent text-zinc-100'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-450 hover:text-zinc-200'
                    }`}
                  >
                    🌙 Dark Mode
                  </button>
                  <button
                    onClick={() => handleToggleMode('light')}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-zinc-250 border-accent text-zinc-900 font-bold shadow-md shadow-accent-glow'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-450 hover:text-zinc-200'
                    }`}
                  >
                    ☀️ Light Mode
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none pb-2">
                {THEMES.map(theme => {
                  const isCurrent = activeTheme === theme.id
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`p-3 rounded-xl bg-zinc-950/40 border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent ? 'border-accent shadow-md shadow-accent-glow' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-zinc-200">{theme.name}</p>
                        <p className="text-[10px] text-zinc-500">{theme.desc}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Theme dot colors */}
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                        </div>
                        
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isCurrent ? 'border-accent bg-accent' : 'border-zinc-700'
                        }`}>
                          {isCurrent && <Check size={10} className="text-zinc-950 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsModal
