"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"
import { useRouter } from "next/navigation"
import {
  Stethoscope,
  BarChart3,
  Calendar,
  Search,
  Plus,
  Edit,
  X,
  MapPin,
  Clock,
  User,
  Filter,
  Menu,
  FileText,
  Settings,
  LogOut,
  Check,
  XCircle
} from "lucide-react"
import styles from "./appointments.module.css"

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  profile_pic?: string
}

interface Doctor {
  _id: string
  name: string
  speciality: string
  hospital_name: string
  address: string
}

interface Appointment {
  _id: string
  reason: string
  date: string
  status: "Pending" | "Approved" | "Completed" | "Cancelled" | "Rejected"
  userId: User
  doctors_id?: Doctor
  createdAt: string
  updatedAt: string
  adminNote?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const appointmentsPerPage = 12

  useEffect(() => {
    const fetchAppointments = async (page = 1) => {
      const token = localStorage.getItem("adminToken")
      
      if (!token) {
        router.push("/admin/auth")
        return
      }
      
      try {
        setLoading(true)
        const response = await axios.get(`http://localhost:5000/api/admin/appointments?page=${page}&limit=${appointmentsPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        // Backend returns {appointments: [...], pagination: {...}}
        console.log('Appointments response:', response.data)
        console.log('Individual appointments:', response.data.appointments)
        
        // Log user profile pictures for debugging
        if (response.data.appointments && response.data.appointments.length > 0) {
          console.log('Sample user data:', response.data.appointments[0].userId)
          console.log('Profile pic URL:', response.data.appointments[0].userId?.profile_pic)
        }
        
        setAppointments(response.data.appointments || [])
        setTotalAppointments(response.data.pagination?.total || response.data.appointments?.length || 0)
        setCurrentPage(page)
      } catch (err: any) {
        console.error("Failed to fetch appointments:", err)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("adminToken")
          router.push("/admin/auth")
        } else {
          setError("Failed to fetch appointments. Please try refreshing the page.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    router.push("/admin/auth")
  }

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalAppointments / appointmentsPerPage)
    if (page >= 1 && page <= totalPages) {
      const fetchAppointments = async () => {
        const token = localStorage.getItem("adminToken")
        
        if (!token) {
          router.push("/admin/auth")
          return
        }
        
        try {
          setLoading(true)
          const response = await axios.get(`http://localhost:5000/api/admin/appointments?page=${page}&limit=${appointmentsPerPage}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          
          setAppointments(response.data.appointments || [])
          setTotalAppointments(response.data.pagination?.total || response.data.appointments?.length || 0)
          setCurrentPage(page)
        } catch (err: any) {
          console.error("Failed to fetch appointments:", err)
          setError("Failed to fetch appointments. Please try refreshing the page.")
        } finally {
          setLoading(false)
        }
      }
      
      fetchAppointments()
    }
  }

    const handleApprove = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.patch(`http://localhost:5000/api/admin/appointments/${appointmentId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Update the local state
      setAppointments(prev => 
        prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: 'Approved' }
            : app
        )
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve appointment')
    }
  }

  const handleReject = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.patch(`http://localhost:5000/api/admin/appointments/${appointmentId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Update the local state
      setAppointments(prev => 
        prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: 'Rejected' }
            : app
        )
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject appointment')
    }
  }

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    console.log('Updating appointment status:', appointmentId, 'to', status)
    if (status === 'Approved') {
      await handleApprove(appointmentId)
    } else if (status === 'Rejected' || status === 'Cancelled') {
      await handleReject(appointmentId)
    } else {
      // For other status updates like 'Completed'
      try {
        const token = localStorage.getItem('adminToken')
        console.log('Making PUT request to:', `http://localhost:5000/api/admin/appointments/${appointmentId}`)
        const response = await axios.put(`http://localhost:5000/api/admin/appointments/${appointmentId}`, {
          status
        }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log('PUT response:', response.data)
        
        setAppointments(prev => 
          prev.map(app => 
            app._id === appointmentId 
              ? { ...app, status: status as Appointment['status'] }
              : app
          )
        )
      } catch (err: any) {
        console.error('PUT request failed:', err)
        setError(err.response?.data?.message || 'Failed to update appointment status')
      }
    }
  }

  const types = Array.from(new Set(appointments.map(appointment => appointment.reason)))
  const statuses = Array.from(new Set(appointments.map(appointment => appointment.status)))

  const totalPages = Math.ceil(totalAppointments / appointmentsPerPage)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Calculate start and end of visible pages
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      // Adjust start if we're near the end
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.doctors_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !selectedType || appointment.reason === selectedType
    const matchesStatus = !selectedStatus || appointment.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#10b981'
      case 'Pending':
        return '#f59e0b'
      case 'Completed':
        return '#6366f1'
      case 'Cancelled':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  if (loading) return <div className={styles.loading}>Loading appointments...</div>
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
            <Link href="/admin/dashboard" className={styles.sidebarLink}>
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
            <Link href="/admin/appointments" className={`${styles.sidebarLink} ${styles.active}`}>
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
          <div className={styles.header}>
            <h1>Appointments</h1>
            <button className={styles.addButton}>
              <Plus size={20} />
              New Appointment
            </button>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBar}>
              <Search size={20} />
              <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <Filter size={20} />
              <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Reasons</option>
                {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.appointmentsGrid}>
            {filteredAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.patientInfo}>
                      <img
                          src={appointment.userId.profile_pic || "/default-avatar.svg"}
                          alt={appointment.userId.name}
                          className={styles.avatar}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/default-avatar.svg") {
                              target.src = "/default-avatar.svg";
                            }
                          }}
                      />
                      <div>
                        <div className={styles.patientName}>{appointment.userId.name}</div>
                        <div className={styles.appointmentType}>{appointment.reason}</div>
                      </div>
                    </div>
                    <div className={styles.status} style={{color: getStatusColor(appointment.status)}}>
                      {appointment.status}
                    </div>
                  </div>

                  <div className={styles.details}>
                    <div className={styles.detail}>
                      <Calendar size={16} />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className={styles.detail}>
                      <User size={16} />
                      <span>Dr. {appointment.doctors_id?.name || 'TBD'}</span>
                    </div>
                    <div className={styles.detail}>
                      <FileText size={16} />
                      <span>{appointment.reason}</span>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {appointment.status === 'Pending' && (
                      <>
                        <button 
                          className={`${styles.actionButton} ${styles.approveButton}`}
                          onClick={() => handleStatusUpdate(appointment._id, 'Approved')}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.cancelButton}`}
                          onClick={() => handleStatusUpdate(appointment._id, 'Cancelled')}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                    {appointment.status === 'Approved' && (
                      <button 
                        className={`${styles.actionButton} ${styles.completeButton}`}
                        onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                      >
                        <Check size={16} />
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              <div className={styles.pageNumbers}>
                {/* Show page 1 if not in visible range */}
                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 && (
                      <span className={styles.dots}>...</span>
                    )}
                  </>
                )}

                {pageNumbers.map(page => (
                  <button
                    key={page}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                {/* Show dots and last page if not in visible range */}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className={styles.dots}>...</span>
                    )}
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button 
                className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
  )
}