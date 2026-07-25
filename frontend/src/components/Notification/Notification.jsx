/**
 * Notification.jsx
 * Reusable inline toast / banner notification component.
 * Replaces native browser alert() calls with sleek, animated inline notifications
 * that match the "Vibrant Minimal" design system.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'success';

  const bgColor = isError
    ? 'rgba(239, 68, 68, 0.15)'
    : isSuccess
    ? 'rgba(34, 197, 94, 0.15)'
    : 'var(--accent-dim)';

  const borderColor = isError
    ? 'rgba(239, 68, 68, 0.4)'
    : isSuccess
    ? 'rgba(34, 197, 94, 0.4)'
    : 'rgba(217, 70, 239, 0.4)';

  const iconColor = isError
    ? '#f87171'
    : isSuccess
    ? '#4ade80'
    : 'var(--accent)';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--bg-secondary)',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
          maxWidth: 380,
        }}
      >
        {isError && <AlertCircle size={18} color={iconColor} style={{ flexShrink: 0 }} />}
        {isSuccess && <CheckCircle size={18} color={iconColor} style={{ flexShrink: 0 }} />}
        {!isError && !isSuccess && <Info size={18} color={iconColor} style={{ flexShrink: 0 }} />}

        <span style={{ flex: 1, lineHeight: 1.4 }}>{notification.message}</span>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
