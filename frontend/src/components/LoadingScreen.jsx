import React from 'react'
import { motion } from 'motion/react'

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 transition-all duration-300 select-none"
      style={{ background: 'var(--bg-primary, #09090b)', color: 'var(--text-primary, #f4f4f5)' }}
    >
      {/* Background ambient glow */}
      <div 
        className="absolute w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-20 animate-pulse"
        style={{ background: 'var(--accent, #d946ef)' }}
      />

      <div className="relative flex flex-col items-center gap-4 z-10">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex items-center justify-center p-3 rounded-2xl border backdrop-blur-md shadow-2xl"
          style={{ 
            background: 'var(--bg-secondary, rgba(24, 24, 27, 0.8))', 
            borderColor: 'var(--border, rgba(255, 255, 255, 0.1))' 
          }}
        >
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="w-12 h-12 object-contain"
            onError={(e) => {
              // Fallback to /images/1.png if logo.svg fails to load
              e.target.onerror = null;
              e.target.src = '/images/1.png';
            }}
          />
        </motion.div>

        {/* Spinner ring */}
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ 
              borderColor: 'var(--accent, #d946ef)', 
              borderTopColor: 'transparent' 
            }}
          />
          <span 
            className="text-sm font-medium tracking-wide"
            style={{ color: 'var(--text-secondary, #a1a1aa)' }}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
