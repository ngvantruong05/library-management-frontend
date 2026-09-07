import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  triggerScan
} from '../services/notificationService'
import { useAuth } from '../context/AuthContext'

const NotificationBell = () => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchUnreadCount = async () => {
    if (!user) return
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }

  const fetchNotificationsList = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await getNotifications()
      setNotifications(list || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      // Poll unread count every 45 seconds
      const interval = setInterval(fetchUnreadCount, 45000)
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
      setNotifications([])
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotificationsList()
      fetchUnreadCount()
    }
    setIsOpen(!isOpen)
  }

  const handleMarkRead = async (id, currentIsRead) => {
    if (currentIsRead) return
    try {
      await markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleManualScan = async (e) => {
    e.stopPropagation()
    try {
      await triggerScan()
      await fetchNotificationsList()
      await fetchUnreadCount()
    } catch (err) {
      console.error('Failed to trigger notification scan:', err)
    }
  }

  // Sorted list: Unread notifications at the top, Read notifications at the bottom
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const aRead = a.isRead === true || a.read === true
      const bRead = b.isRead === true || b.read === true
      if (aRead === bRead) {
        // If both read or both unread, sort newest first
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return aRead ? 1 : -1
    })
  }, [notifications])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'OVERDUE':
        return { icon: '🚨', label: 'Quá hạn', bg: '#fee2e2', color: '#991b1b' }
      case 'DUE_SOON':
        return { icon: '⚠️', label: 'Sắp đến hạn', bg: '#fef3c7', color: '#92400e' }
      default:
        return { icon: 'ℹ️', label: 'Hệ thống', bg: '#e0f2fe', color: '#075985' }
    }
  }

  if (!user) return null

  return (
    <div className="fx-notification-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="fx-bell-btn"
        onClick={handleToggle}
        title="Thông báo"
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.4rem 0.6rem',
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              borderRadius: '9999px',
              padding: '0.15rem 0.4rem',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fx-notification-dropdown"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'var(--color-bg-paper, #ffffff)',
            color: 'var(--color-text, #1f2937)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--color-border, #e5e7eb)'
          }}
        >
          {/* Header - Only shows "Thông báo" title without unread text */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--color-border, #e5e7eb)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-subtle, #f9fafb)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Thông báo</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={handleManualScan}
                title="Quét thông báo ngay"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                🔄 Quét
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
            {loading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                Đang tải thông báo...
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                🔕 Không có thông báo nào
              </div>
            ) : (
              sortedNotifications.map((item) => {
                const isItemRead = item.isRead === true || item.read === true
                const typeStyle = getTypeBadge(item.type)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkRead(item.id, isItemRead)}
                    style={{
                      padding: '0.75rem 1rem 0.75rem 1.25rem',
                      borderBottom: '1px solid var(--color-border, #f3f4f6)',
                      backgroundColor: isItemRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      position: 'relative'
                    }}
                  >
                    {!isItemRead && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontWeight: isItemRead ? '500' : '700',
                          fontSize: '0.85rem',
                          color: 'var(--color-text, #111827)'
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.color,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {typeStyle.icon} {typeStyle.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #4b5563)', lineHeight: '1.4', marginBottom: '0.25rem' }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'right' }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
