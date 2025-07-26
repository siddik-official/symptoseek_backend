"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import {
  Activity,
  Heart,
  Stethoscope,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Shield,
  LogOut,
  Settings,
  Bell,
  Menu,
  FileText,
  User,
  Calendar
} from "lucide-react"
import styles from "./dashboard.module.css"

interface StatCard {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

interface RecentActivity {
  _id: string
  action: string
  user: string
  time: string
}

interface DashboardStats {
  users: number
  doctors: number
  appointments: number
  appointmentStatusBreakdown: {
    pending: number
    approved: number
    rejected: number
    cancelled: number
    completed: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    doctors: 0,
    appointments: 0,
    appointmentStatusBreakdown: {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0
    }
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const notifications = [
    {
      id: 1,
      title: "New doctor registration request",
      time: "5 minutes ago",
      icon: <User size={16} />
    },
    {
      id: 2,
      title: "System maintenance scheduled",
      time: "1 hour ago",
      icon: <Settings size={16} />
    },
    {
      id: 3,
      title: "New appointment request",
      time: "2 hours ago",
      icon: <Calendar size={16} />
    }
  ]

  useEffect(() => {
    setIsClient(true)
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("adminToken")
      if (!token) {
        router.push("/admin/auth")
        return
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        setStats(response.data)
        
        // Fetch recent appointments for activity
        try {
          const appointmentsResponse = await axios.get(`http://localhost:5000/api/admin/appointments?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          
          // Check if appointmentsResponse.data has appointments array
          const appointmentsData = appointmentsResponse.data.appointments || []
          const activities = appointmentsData.slice(0, 4).map((appointment: any) => ({
            _id: appointment._id,
            action: `New ${appointment.type || 'Medical'} appointment`,
            user: appointment.userId?.name || 'Unknown User',
            time: getRelativeTime(appointment.createdAt)
          }))
          
          setRecentActivity(activities)
        } catch (appointmentErr) {
          console.warn("Failed to fetch appointments for recent activity:", appointmentErr)
          // Continue without recent activity data
        }
        
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("adminToken")
          router.push("/admin/auth")
        } else {
          setError("Failed to fetch dashboard data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: stats.users.toString(),
      change: 12.5,
      icon: <Heart className={styles.statIcon} />
    },
    {
      title: "Active Doctors",
      value: stats.doctors.toString(),
      change: 8.3,
      icon: <Stethoscope className={styles.statIcon} />
    },
    {
      title: "Total Appointments",
      value: stats.appointments.toString(),
      change: 8.7,
      icon: <Activity className={styles.statIcon} />
    },
    {
      title: "Pending Appointments",
      value: stats.appointmentStatusBreakdown.pending.toString(),
      change: -5.2,
      icon: <Calendar className={styles.statIcon} />
    }
  ]

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    router.push("/admin/auth")
  }

  if (!isClient) return null
  if (loading) return <div className={styles.loading}>Loading dashboard...</div>
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <div className={styles.container}>
      <button 
        className={styles.menuToggle} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>
      
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Stethoscope size={24} />
          <span>SymptoSeek Admin</span>
        </div>
        
        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={`${styles.sidebarLink} ${styles.active}`}>
            <BarChart3 size={20} />
            Overview
          </Link>
          <Link href="/admin/doctors" className={styles.sidebarLink}>
            <Stethoscope size={20} />
            Doctors
          </Link>
          <Link href="/admin/users" className={styles.sidebarLink}>
            <User size={20} />
            Users
          </Link>
          <Link href="/admin/appointments" className={styles.sidebarLink}>
            <Calendar size={20} />
            Appointments
          </Link>
          <Link href="/admin/reports" className={styles.sidebarLink}>
            <FileText size={20} />
            Reports
          </Link>
          <Link href="/admin/settings" className={styles.sidebarLink}>
            <Settings size={20} />
            Settings
          </Link>
        </nav>

        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Admin Overview</h1>
          <div className={styles.headerActions}>
            <div className={styles.notificationButton}>
              <button 
                className={styles.iconButton}
                onClick={() => setShowNotifications(!showNotifications)}
              >
              <Bell size={20} />
                <span className={styles.notificationBadge}>3</span>
              </button>
              
              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <h3>Notifications</h3>
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.map((notification) => (
                      <div key={notification.id} className={styles.notificationItem}>
                        <div className={styles.notificationIcon}>
                          {notification.icon}
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationTitle}>
                            {notification.title}
                          </div>
                          <div className={styles.notificationTime}>
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/admin/settings" className={styles.iconButton}>
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <div className={styles.stats}>
          {statCards.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statHeader}>
                {stat.icon}
                <span className={styles.statTitle}>{stat.title}</span>
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={`${styles.statChange} ${stat.change >= 0 ? styles.positive : styles.negative}`}>
                {stat.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(stat.change)}%
              </div>
            </div>
          ))}
        </div>

        <section className={styles.activitySection}>
          <h2>Recent Activity</h2>
          <div className={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity._id} className={styles.activityItem}>
                  <div className={styles.activityContent}>
                    <span className={styles.activityAction}>{activity.action}</span>
                    <span className={styles.activityUser}>{activity.user}</span>
                  </div>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyActivity}>
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}