"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
  Stethoscope,
  BarChart3,
  Calendar,
  Search,
  Download,
  RefreshCw,
  FileText,
  Filter,
  Menu,
  Settings,
  Clock,
  User,
  LogOut,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  X
} from "lucide-react"
import styles from "./reports.module.css"

interface UserInfo {
  _id: string
  name: string
  email: string
  profile_pic?: string
  phone?: string
}

interface Report {
  _id: string
  title: string
  type: string
  status: "Completed" | "Processing" | "Pending"
  reportDate: string
  doctor?: string
  fileUrl: string
  fileSize: number
  user: UserInfo
  createdAt: string
  updatedAt: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReports, setTotalReports] = useState(0)
  const reportsPerPage = 12

  useEffect(() => {
    checkAuth()
    fetchReports()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/auth")
      return
    }
  }

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminToken")
      
      const response = await axios.get(`http://localhost:5000/api/admin/reports?page=${page}&limit=${reportsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Reports API response:', response.data)
      
      if (response.data.reports) {
        setReports(response.data.reports)
        setTotalReports(response.data.pagination?.total || response.data.reports.length)
      } else {
        setReports([])
        setTotalReports(0)
      }
      
      setCurrentPage(page)
      setError("")
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      setError(err.response?.data?.message || 'Failed to fetch reports')
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken")
        router.push("/admin/auth")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    router.push("/admin/auth")
  }

  const handleStatusUpdate = async (reportId: string, status: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      
      const response = await axios.patch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        status
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Update the local state
      setReports(prev => prev.map(report => 
        report._id === reportId ? { ...report, status: status as Report['status'] } : report
      ))
      
      setError("")
    } catch (err: any) {
      console.error('Error updating report status:', err)
      setError(err.response?.data?.message || 'Failed to update report status')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      
      await axios.delete(`http://localhost:5000/api/admin/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Remove from local state
      setReports(prev => prev.filter(report => report._id !== reportId))
      setError("")
    } catch (err: any) {
      console.error('Error deleting report:', err)
      setError(err.response?.data?.message || 'Failed to delete report')
    }
  }

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report)
    setIsDetailModalOpen(true)
  }

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalReports / reportsPerPage)
    if (page >= 1 && page <= totalPages) {
      fetchReports(page)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
      fetchReports(1)
    }
  }, [searchTerm, selectedType, selectedStatus])

  const types = Array.from(new Set(reports.map(report => report.type)));
  const statuses = Array.from(new Set(reports.map(report => report.status)));

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !selectedType || report.type === selectedType
    const matchesStatus = !selectedStatus || report.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(totalReports / reportsPerPage)
  const startIndex = (currentPage - 1) * reportsPerPage
  const endIndex = startIndex + reportsPerPage
  const currentReports = filteredReports.slice(startIndex, endIndex)

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

  if (loading && reports.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading reports...</p>
        </div>
      </div>
    )
  }

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
            <Link href="/admin/appointments" className={styles.sidebarLink}>
              <Calendar size={20} />
              Appointments
            </Link>
            <Link href="/admin/reports" className={`${styles.sidebarLink} ${styles.active}`}>
              <FileText size={20} />
              Reports
            </Link>
            <Link href="/admin/settings" className={styles.sidebarLink}>
              <Settings size={20} />
              Settings
            </Link>
          </nav>

          <button onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem("adminToken")
              router.push("/admin/auth")
            }
          }} className={styles.logoutButton}>
            <LogOut size={20} />
            Logout
          </button>
        </aside>

        <main className={styles.main}>
          <div className={styles.header}>
            <h1>Reports</h1>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBar}>
              <Search size={20} />
              <input
                  type="text"
                  placeholder="Search reports..."
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
                <option value="">All Types</option>
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

          <div className={styles.reportsGrid}>
            {currentReports.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={48} />
                <h3>No reports found</h3>
                <p>Try adjusting your search criteria.</p>
              </div>
            ) : (
              currentReports.map(report => (
                <div key={report._id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <h3 className={styles.reportTitle}>{report.title}</h3>
                    <div className={`${styles.status} ${styles[report.status.toLowerCase()]}`}>
                      {report.status}
                    </div>
                  </div>

                  <div className={styles.details}>
                    <div className={styles.detail}>
                      <FileText size={16} />
                      <span>Type: {report.type}</span>
                    </div>
                    <div className={styles.detail}>
                      <Clock size={16} />
                      <span>Date: {new Date(report.reportDate).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.detail}>
                      <User size={16} />
                      <span>Patient: {report.user.name}</span>
                    </div>
                    {report.doctor && (
                      <div className={styles.detail}>
                        <Stethoscope size={16} />
                        <span>Doctor: {report.doctor}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button 
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      onClick={() => handleViewDetails(report)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    {report.status === "Completed" && (
                      <button className={`${styles.actionButton} ${styles.downloadButton}`}>
                        <Download size={16} />
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                          Download
                        </a>
                      </button>
                    )}
                    {report.status !== "Completed" && (
                      <button 
                        className={`${styles.actionButton} ${styles.completeButton}`}
                        onClick={() => handleStatusUpdate(report._id, 'Completed')}
                      >
                        <CheckCircle size={16} />
                        Mark Complete
                      </button>
                    )}
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDeleteReport(report._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
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

        {/* Report Detail Modal */}
        {isDetailModalOpen && selectedReport && (
          <div className={styles.modalOverlay} onClick={() => setIsDetailModalOpen(false)}>
            <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Report Details</h2>
                <button
                    className={styles.closeButton}
                    onClick={() => setIsDetailModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.reportProfileSection}>
                  <img 
                    src={selectedReport.user.profile_pic || "/default-avatar.svg"} 
                    alt={selectedReport.user.name} 
                    className={styles.detailUserImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default-avatar.svg";
                    }}
                  />
                  <div className={styles.reportMainInfo}>
                    <h3>{selectedReport.title}</h3>
                    <p className={styles.reportType}>{selectedReport.type}</p>
                    <p className={`${styles.reportStatus} ${styles[selectedReport.status.toLowerCase()]}`}>
                      {selectedReport.status}
                    </p>
                  </div>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <User size={18} />
                    <div>
                      <strong>Patient</strong>
                      <p>{selectedReport.user.name}</p>
                      <p className={styles.email}>{selectedReport.user.email}</p>
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <Calendar size={18} />
                    <div>
                      <strong>Report Date</strong>
                      <p>{new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {selectedReport.doctor && (
                    <div className={styles.detailItem}>
                      <Stethoscope size={18} />
                      <div>
                        <strong>Doctor</strong>
                        <p>{selectedReport.doctor}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.detailItem}>
                    <FileText size={18} />
                    <div>
                      <strong>File Size</strong>
                      <p>{(selectedReport.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>

                <div className={styles.actionSection}>
                  {selectedReport.status === "Completed" && (
                    <a 
                      href={selectedReport.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`${styles.actionButton} ${styles.downloadButton}`}
                    >
                      <Download size={16} />
                      Download Report
                    </a>
                  )}
                  {selectedReport.status !== "Completed" && (
                    <button 
                      className={`${styles.actionButton} ${styles.completeButton}`}
                      onClick={() => {
                        handleStatusUpdate(selectedReport._id, 'Completed')
                        setIsDetailModalOpen(false)
                      }}
                    >
                      <CheckCircle size={16} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}