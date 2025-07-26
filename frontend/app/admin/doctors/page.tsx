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
  Plus,
  Edit,
  Trash2,
  X,
  MapPin,
  Mail,
  Phone,
  Menu,
  FileText,
  Settings,
  Filter,
  LogOut,
  Clock,
  Building,
  User
} from "lucide-react"
import styles from "./doctors.module.css"

interface Doctor {
  _id: string
  image_source: string
  name: string
  speciality: string
  address: string
  number: string
  visiting_hours: string
  degree: string
  hospital_name: string
  About: string
  longitude?: string
  latitude?: string
}

interface DoctorFormData {
  image_source: string
  name: string
  speciality: string
  address: string
  number: string
  visiting_hours: string
  degree: string
  hospital_name: string
  About: string
  longitude?: string
  latitude?: string
}

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState<DoctorFormData>({
    image_source: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    name: "",
    speciality: "",
    address: "",
    number: "",
    visiting_hours: "",
    degree: "",
    hospital_name: "",
    About: "",
    longitude: "",
    latitude: ""
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalDoctors, setTotalDoctors] = useState(0)
  const doctorsPerPage = 12

  // Get available specialties from current doctors
  const specialties = Array.from(new Set(doctors.map(doctor => doctor.speciality)))

  useEffect(() => {
    checkAuth()
    fetchDoctors()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/auth")
      return
    }
  }

  const fetchDoctors = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminToken")
      
      const response = await axios.get(`http://localhost:5000/api/admin/doctors?page=${page}&limit=${doctorsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Doctors API response:', response.data)
      
      // Handle different response formats
      if (response.data.doctors) {
        setDoctors(response.data.doctors)
        setTotalDoctors(response.data.pagination?.total || response.data.doctors.length)
      } else if (Array.isArray(response.data)) {
        setDoctors(response.data)
        setTotalDoctors(response.data.length)
      } else {
        setDoctors([])
        setTotalDoctors(0)
      }
      
      setCurrentPage(page)
      setError("")
    } catch (err: any) {
      console.error('Error fetching doctors:', err)
      setError(err.response?.data?.message || 'Failed to fetch doctors')
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

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("adminToken")
      
      const response = await axios.post('http://localhost:5000/api/admin/doctors', newDoctor, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setIsAddModalOpen(false)
      
      // Reset form
      setNewDoctor({
        image_source: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
        name: "",
        speciality: "",
        address: "",
        number: "",
        visiting_hours: "",
        degree: "",
        hospital_name: "",
        About: "",
        longitude: "",
        latitude: ""
      })
      
      // Refresh the current page to show the new doctor
      fetchDoctors(currentPage)
      setError("")
    } catch (err: any) {
      console.error('Error adding doctor:', err)
      setError(err.response?.data?.message || 'Failed to add doctor')
    }
  }

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setIsEditModalOpen(true)
  }

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoctor) return

    try {
      const token = localStorage.getItem("adminToken")
      
      const response = await axios.patch(`http://localhost:5000/api/admin/doctors/${editingDoctor._id}`, editingDoctor, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setIsEditModalOpen(false)
      setEditingDoctor(null)
      
      // Refresh the current page
      fetchDoctors(currentPage)
      setError("")
    } catch (err: any) {
      console.error('Error updating doctor:', err)
      setError(err.response?.data?.message || 'Failed to update doctor')
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return

    try {
      const token = localStorage.getItem("adminToken")
      
      await axios.delete(`http://localhost:5000/api/admin/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Refresh the current page
      fetchDoctors(currentPage)
      setError("")
    } catch (err: any) {
      console.error('Error deleting doctor:', err)
      setError(err.response?.data?.message || 'Failed to delete doctor')
    }
  }

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsDetailModalOpen(true)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= Math.ceil(totalDoctors / doctorsPerPage)) {
      fetchDoctors(page)
    }
  }

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = !selectedSpecialty || doctor.speciality === selectedSpecialty
    
    return matchesSearch && matchesSpecialty
  })

  const totalPages = Math.ceil(totalDoctors / doctorsPerPage)

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
            <Link href="/admin/doctors" className={`${styles.sidebarLink} ${styles.active}`}>
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
          <div className={styles.header}>
            <h1>Manage Doctors</h1>
            <button className={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              Add New Doctor
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.filters}>
            <div className={styles.searchBar}>
              <Search size={20} />
              <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <Filter size={20} />
              <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            <div className={styles.resultsInfo}>
              <span>Showing {doctors.length} of {totalDoctors} doctors</span>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading doctors...</p>
            </div>
          ) : (
            <>
              <div className={styles.doctorsGrid}>
                {filteredDoctors.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Stethoscope size={48} />
                    <h3>No doctors found</h3>
                    <p>Try adjusting your search criteria or add a new doctor.</p>
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <div key={doctor._id} className={styles.doctorCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.doctorProfile}>
                          <img 
                            src={doctor.image_source || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"} 
                            alt={doctor.name} 
                            className={styles.doctorImage}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
                            }}
                          />
                          <div className={styles.doctorInfo}>
                            <h3 
                              className={styles.doctorName}
                              onClick={() => handleViewDetails(doctor)}
                              title="Click to view details"
                            >
                              {doctor.name}
                            </h3>
                            <p className={styles.doctorSpecialty}>{doctor.speciality}</p>
                          </div>
                        </div>
                        <div className={styles.headerActions}>
                          <button
                              className={styles.actionButton}
                              onClick={() => handleEditDoctor(doctor)}
                              title="Edit doctor"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                              className={styles.actionButton}
                              onClick={() => handleDeleteDoctor(doctor._id)}
                              title="Delete doctor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.details}>
                        <div className={styles.detail}>
                          <MapPin size={16} />
                          <span>{doctor.address}</span>
                        </div>
                        <div className={styles.detail}>
                          <Clock size={16} />
                          <span>{doctor.visiting_hours}</span>
                        </div>
                        <div className={styles.detail}>
                          <Building size={16} />
                          <span>{doctor.hospital_name}</span>
                        </div>
                        <div className={styles.detail}>
                          <Phone size={16} />
                          <span>{doctor.number}</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.degreeLabel}>Degree:</span>
                          <span>{doctor.degree}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  {/* First button - only show if current page > 3 */}
                  {/* {currentPage > 3 && (
                    <button 
                      className={styles.pageButton}
                      onClick={() => handlePageChange(1)}
                    >
                      First
                    </button>
                  )} */}

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

                  {/* Last button - only show if current page is more than 3 pages from end */}
                  {/* {currentPage < totalPages - 2 && (
                    <button 
                      className={styles.pageButton}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      Last
                    </button>
                  )} */}
                </div>
              )}
            </>
          )}
        </main>

        {/* Doctor Detail Modal */}
        {isDetailModalOpen && selectedDoctor && (
          <div className={styles.modalOverlay} onClick={() => setIsDetailModalOpen(false)}>
            <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Doctor Details</h2>
                <button
                    className={styles.closeButton}
                    onClick={() => setIsDetailModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.doctorProfileSection}>
                  <img 
                    src={selectedDoctor.image_source || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"} 
                    alt={selectedDoctor.name} 
                    className={styles.detailDoctorImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className={styles.doctorMainInfo}>
                    <h3>{selectedDoctor.name}</h3>
                    <p className={styles.specialty}>{selectedDoctor.speciality}</p>
                    <p className={styles.degree}>{selectedDoctor.degree}</p>
                  </div>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <Building size={18} />
                    <div>
                      <strong>Hospital</strong>
                      <p>{selectedDoctor.hospital_name}</p>
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <MapPin size={18} />
                    <div>
                      <strong>Address</strong>
                      <p>{selectedDoctor.address}</p>
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <Phone size={18} />
                    <div>
                      <strong>Phone</strong>
                      <p>{selectedDoctor.number}</p>
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <Clock size={18} />
                    <div>
                      <strong>Visiting Hours</strong>
                      <p>{selectedDoctor.visiting_hours}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.aboutSection}>
                  <h4>About Doctor</h4>
                  <p>{selectedDoctor.About}</p>
                </div>

                {(selectedDoctor.longitude && selectedDoctor.latitude) && (
                  <div className={styles.locationSection}>
                    <h4>Location Coordinates</h4>
                    <p>Longitude: {selectedDoctor.longitude}</p>
                    <p>Latitude: {selectedDoctor.latitude}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isEditModalOpen && editingDoctor && (
            <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>Edit Doctor Profile</h2>
                  <button
                      className={styles.closeButton}
                      onClick={() => setIsEditModalOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveDoctor}>
                  <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">Full Name</label>
                      <input
                          id="name"
                          type="text"
                          value={editingDoctor.name}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, name: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="speciality">Specialty</label>
                      <input
                          id="speciality"
                          type="text"
                          value={editingDoctor.speciality}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, speciality: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="degree">Degree</label>
                      <input
                          id="degree"
                          type="text"
                          value={editingDoctor.degree}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, degree: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="hospital_name">Hospital Name</label>
                      <input
                          id="hospital_name"
                          type="text"
                          value={editingDoctor.hospital_name}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, hospital_name: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address">Address</label>
                      <input
                          id="address"
                          type="text"
                          value={editingDoctor.address}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, address: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="number">Phone Number</label>
                        <input
                            id="number"
                            type="tel"
                            value={editingDoctor.number}
                            onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, number: e.target.value } : null)}
                            required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="visiting_hours">Visiting Hours</label>
                        <input
                            id="visiting_hours"
                            type="text"
                            value={editingDoctor.visiting_hours}
                            onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, visiting_hours: e.target.value } : null)}
                            required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="About">About Doctor</label>
                      <textarea
                          id="About"
                          value={editingDoctor.About}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, About: e.target.value } : null)}
                          rows={4}
                          className={styles.textarea}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="image_source">Profile Image URL</label>
                      <input
                          id="image_source"
                          type="url"
                          value={editingDoctor.image_source}
                          onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, image_source: e.target.value } : null)}
                          required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="longitude">Longitude (Optional)</label>
                        <input
                            id="longitude"
                            type="text"
                            value={editingDoctor.longitude || ""}
                            onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, longitude: e.target.value } : null)}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="latitude">Latitude (Optional)</label>
                        <input
                            id="latitude"
                            type="text"
                            value={editingDoctor.latitude || ""}
                            onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, latitude: e.target.value } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveButton}>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {isAddModalOpen && (
            <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button
                    className={styles.closeButton}
                    onClick={() => setIsAddModalOpen(false)}
                >
                  <X size={20} />
                </button>

                <div className={styles.modalHeader}>
                  <h2>Add New Doctor</h2>
                </div>

                <form onSubmit={handleAddDoctor}>
                  <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">Full Name</label>
                      <input
                          id="name"
                          type="text"
                          value={newDoctor.name}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="speciality">Specialty</label>
                      <input
                          id="speciality"
                          type="text"
                          value={newDoctor.speciality}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, speciality: e.target.value }))}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="degree">Degree</label>
                      <input
                          id="degree"
                          type="text"
                          value={newDoctor.degree}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, degree: e.target.value }))}
                          placeholder="e.g. MBBS, MD"
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="hospital_name">Hospital Name</label>
                      <input
                          id="hospital_name"
                          type="text"
                          value={newDoctor.hospital_name}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, hospital_name: e.target.value }))}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address">Address</label>
                      <input
                          id="address"
                          type="text"
                          value={newDoctor.address}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, address: e.target.value }))}
                          required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="number">Phone Number</label>
                        <input
                            id="number"
                            type="tel"
                            value={newDoctor.number}
                            onChange={(e) => setNewDoctor(prev => ({ ...prev, number: e.target.value }))}
                            required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="visiting_hours">Visiting Hours</label>
                        <input
                            id="visiting_hours"
                            type="text"
                            value={newDoctor.visiting_hours}
                            onChange={(e) => setNewDoctor(prev => ({ ...prev, visiting_hours: e.target.value }))}
                            placeholder="e.g. 9:00 AM - 5:00 PM"
                            required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="About">About Doctor</label>
                      <textarea
                          id="About"
                          value={newDoctor.About}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, About: e.target.value }))}
                          placeholder="Brief description about the doctor..."
                          rows={4}
                          className={styles.textarea}
                          required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="image_source">Profile Image URL</label>
                      <input
                          id="image_source"
                          type="url"
                          value={newDoctor.image_source}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, image_source: e.target.value }))}
                          required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="longitude">Longitude (Optional)</label>
                        <input
                            id="longitude"
                            type="text"
                            value={newDoctor.longitude || ""}
                            onChange={(e) => setNewDoctor(prev => ({ ...prev, longitude: e.target.value }))}
                            placeholder="e.g. 90.4125"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="latitude">Latitude (Optional)</label>
                        <input
                            id="latitude"
                            type="text"
                            value={newDoctor.latitude || ""}
                            onChange={(e) => setNewDoctor(prev => ({ ...prev, latitude: e.target.value }))}
                            placeholder="e.g. 23.8103"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setIsAddModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveButton}>
                      Add Doctor
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}