"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Bell, Clock, CheckCircle, X } from "lucide-react"
import styles from "./NotificationDropdown.module.css"

interface Notification {
  _id: string
  title: string
  description: string
  type: string
  scheduleTime: string
  isCompleted: boolean
  createdAt: string
}

interface NotificationDropdownProps {
  className?: string
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Ensure component is mounted before running effects
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    fetchNotifications()
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      if (mounted) {
        fetchUnreadCount()
      }
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showNotifications, mounted])

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      setLoading(true)
      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      })
      setNotifications(response.data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Don't throw error, just log it
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await axios.get("http://localhost:5000/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000 // 5 second timeout
      })
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error("Error fetching unread count:", error)
      // Silently fail for unread count
    }
  }

  const markAsRead = async (notificationId: string) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isCompleted: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medicine':
        return '💊'
      case 'exercise':
        return '🏃‍♂️'
      case 'appointment':
        return '🏥'
      default:
        return '🔔'
    }
  }

  const toggleNotifications = () => {
    if (!mounted) return
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      fetchNotifications()
    }
  }

  // Don't render anything until component is mounted
  if (!mounted) {
    return (
      <div className={`${styles.notificationContainer} ${className}`}>
        <button className={styles.notificationButton}>
          <Bell size={20} />
        </button>
      </div>
    )
  }

  return (
    <div className={`${styles.notificationContainer} ${className}`} ref={notificationRef}>
      <button
        className={styles.notificationButton}
        onClick={toggleNotifications}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className={styles.notificationDropdown}>
          <div className={styles.notificationHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className={styles.unreadCount}>{unreadCount} unread</span>
            )}
          </div>
          
          <div className={styles.notificationList}>
            {loading ? (
              <div className={styles.loadingState}>
                <Clock size={24} />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <Bell size={48} />
                <h4>No Notifications</h4>
                <p>You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${!notification.isCompleted ? styles.unread : ''}`}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.description}
                    </div>
                    <div className={styles.notificationMeta}>
                      <span className={styles.notificationTime}>
                        <Clock size={12} />
                        {formatTime(notification.scheduleTime)}
                      </span>
                      <span className={styles.notificationType}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  {!notification.isCompleted && (
                    <button
                      className={styles.markReadButton}
                      onClick={() => markAsRead(notification._id)}
                      title="Mark as read"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className={styles.notificationFooter}>
              <button 
                className={styles.viewAllButton}
                onClick={() => {
                  setShowNotifications(false)
                  // Use window.location to avoid Next.js router issues
                  if (typeof window !== 'undefined') {
                    window.location.href = '/notifications'
                  }
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
