"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Filter,
  ArrowLeft,
  Trash2,
  RotateCcw
} from "lucide-react"
import Link from "next/link"
import styles from "./notifications.module.css"

interface Notification {
  _id: string
  title: string
  description: string
  type: string
  scheduleTime: string
  isCompleted: boolean
  isRecurring: boolean
  recurrencePattern?: string
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // all, unread, completed
  const [typeFilter, setTypeFilter] = useState("all") // all, medicine, exercise, appointment

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth")
      return
    }

    try {
      setLoading(true)
      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(response.data)
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
      if (error.response?.status === 401) {
        router.push("/auth")
      } else {
        setError("Failed to fetch notifications")
      }
    } finally {
      setLoading(false)
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
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isCompleted: true } : n
        )
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
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

  const filteredNotifications = notifications.filter(notification => {
    const statusMatch = filter === "all" || 
                       (filter === "unread" && !notification.isCompleted) ||
                       (filter === "completed" && notification.isCompleted)
    
    const typeMatch = typeFilter === "all" || notification.type === typeFilter
    
    return statusMatch && typeMatch
  })

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Clock size={48} />
        <h2>Loading Notifications...</h2>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/dashboard" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <h1>
            <Bell size={28} />
            Notifications
          </h1>
        </div>
        
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Type</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="medicine">Medicine</option>
              <option value="exercise">Exercise</option>
              <option value="appointment">Appointment</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchNotifications}>Try Again</button>
        </div>
      )}

      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={64} />
            <h3>No Notifications Found</h3>
            <p>
              {filter === "unread" 
                ? "You're all caught up! No unread notifications."
                : "No notifications match your current filters."}
            </p>
            <Link href="/reminders" className={styles.createButton}>
              Create New Reminder
            </Link>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`${styles.notificationCard} ${!notification.isCompleted ? styles.unread : ''}`}
            >
              <div className={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h3>{notification.title}</h3>
                  <div className={styles.notificationMeta}>
                    <span className={styles.notificationType}>
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </span>
                    {notification.isRecurring && (
                      <span className={styles.recurringBadge}>
                        <RotateCcw size={12} />
                        {notification.recurrencePattern}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className={styles.notificationDescription}>
                  {notification.description}
                </p>
                
                <div className={styles.notificationTime}>
                  <Calendar size={14} />
                  <span>Scheduled: {formatTime(notification.scheduleTime)}</span>
                </div>
              </div>
              
              <div className={styles.notificationActions}>
                {!notification.isCompleted && (
                  <button 
                    onClick={() => markAsRead(notification._id)}
                    className={styles.markReadBtn}
                    title="Mark as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification._id)}
                  className={styles.deleteBtn}
                  title="Delete notification"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
