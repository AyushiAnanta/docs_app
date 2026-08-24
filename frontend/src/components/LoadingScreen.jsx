import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'

const LoadingScreen = ({ message = 'Loading...' }) => {
  // Pick a random image between 1.png and 8.png on mount
  const [imageSrc] = useState(() => {
    const randomNum = Math.floor(Math.random() * 8) + 1
    return `/images/${randomNum}.png`
  })

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 transition-all duration-300 select-none h-screen w-screen"
      style={{ background: 'var(--bg-primary, #09090b)', color: 'var(--text-primary, #f4f4f5)' }}
    >
      {/* Bobbing Mascot Image */}
      <motion.img
        src={imageSrc}
        alt="Loading mascot"
        className="w-28 h-28 object-contain"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex flex-col items-center gap-3 w-56">
        {/* Animated Loading Bar */}
        <div 
          className="w-full h-1.5 rounded-full overflow-hidden relative"
          style={{ background: 'var(--border, rgba(255, 255, 255, 0.1))' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent, #d946ef)' }}
            animate={{ 
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Message Text */}
        <div 
          className="text-sm font-medium tracking-wide"
          style={{ color: 'var(--text-secondary, #a1a1aa)' }}
        >
          {message}
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
