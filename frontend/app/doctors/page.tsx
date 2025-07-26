"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Navbar from "../components/Navbar/Navbar"
import Footer from "../components/Footer/Footer"
import { MapPin, Clock, Star, Phone, Mail, Building, Search, X, Calendar, Award, Stethoscope } from "lucide-react"
import styles from "./doctors.module.css"
import { useRouter } from "next/navigation"
import axios from "axios"

interface Doctor {
  _id: string
  name: string
  speciality: string
  address: string
  visiting_hours: string
  hospital_name: string
  image_source: string
  number: string
  degree: string
  About: string
  latitude: string
  longitude: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalDoctors: number
  doctorsPerPage: number
}

interface ApiResponse {
  doctors: Doctor[]
  pagination: Pagination
}

export default function DoctorsPage() {
  const router = useRouter()

  interface User {
    _id: string
    name: string
    email: string
    bio: string
    gender: string
    age: number | null
    phone: string
    address: string
    zip_code: string
    country: string
    state: string
    city: string
    profile_pic: string
    role: string
    status: string
    blood_group: string
    weight: string
    height: string
    allergies: string
    medical_conditions: string
    medications: string
    surgeries: string
    family_medical_history: string
    emergency_contact: string
    date: string
    __v: number
  }

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalDoctors: 0,
    doctorsPerPage: 12,
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        return
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(response.data)
        setLoggedIn(true)
      } catch (err) {
        console.error("Failed to fetch user data:", err)
        setError("Failed to fetch user data.")
        setLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `http://localhost:5000/api/doctors?page=${currentPage}&limit=12`
        )
        setDoctors(response.data.doctors)
        setPagination(response.data.pagination)
      } catch (err) {
        console.error("Failed to fetch doctors:", err)
        setError("Failed to fetch doctors data.")
      }
    }

    fetchDoctors()
  }, [currentPage])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      setUser(null)
      setLoggedIn(false)
    }
  }

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedAvailability, setSelectedAvailability] = useState("")

  const specialties = Array.from(new Set(doctors.map(doctor => doctor.speciality)))
  const locations = Array.from(new Set(doctors.map(doctor => doctor.address)))
  const availabilities = Array.from(new Set(doctors.map(doctor => doctor.visiting_hours)))

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSpecialty = !selectedSpecialty || doctor.speciality === selectedSpecialty
      const matchesLocation = !selectedLocation || doctor.address === selectedLocation
      const matchesAvailability = !selectedAvailability || doctor.visiting_hours === selectedAvailability

      return matchesSearch && matchesSpecialty && matchesLocation && matchesAvailability
    })
  }, [doctors, searchTerm, selectedSpecialty, selectedLocation, selectedAvailability])

    // Pagination logic for limited page numbers
    const maxPageNumbers = 9 // Maximum page numbers to display before ellipses
    const pageRange = Math.floor(maxPageNumbers / 2) // Pages to show on each side of current page
    const startPage = Math.max(2, currentPage - pageRange)
    const endPage = Math.min(pagination.totalPages - 1, currentPage + pageRange)
  
    const pageNumbers = []
    // Always show page 1
    pageNumbers.push(1)
    // Add ellipsis if startPage > 2
    if (startPage > 2) {
      pageNumbers.push("...")
    }
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    // Add ellipsis if endPage < totalPages - 1
    if (endPage < pagination.totalPages - 1) {
      pageNumbers.push("...")
    }
    // Always show last page if totalPages > 1
    if (pagination.totalPages > 1) {
      pageNumbers.push(pagination.totalPages)
    }

  return (
    <div className={styles.container}>
      <Navbar
        isLoggedIn={loggedIn}
        userImage={user?.profile_pic || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740"}
        onLogout={handleLogout}
      />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Find the Right Doctor</h1>
          <p>Connect with qualified healthcare professionals based on your needs</p>
        </div>

        <section className={styles.searchSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by name, specialty, or hospital..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Specialty</label>
              <select
                className={styles.select}
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Location</label>
              <select
                className={styles.select}
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Availability</label>
              <select
  className={styles.select}
  value={selectedAvailability}
  onChange={(e) => setSelectedAvailability(e.target.value)}
>
  <option value="">Any Availability</option>
  {availabilities.map(availability => (
    <option key={availability} value={availability}>
      {availability}
    </option>
  ))}
</select>
            </div>
          </div>
        </section>

        <div className={styles.doctorsGrid}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <div key={doctor._id} className={styles.doctorCard}>
                <img src={doctor.image_source} alt={doctor.name} className={styles.doctorImage} />
                <div className={styles.doctorInfo}>
                  <h2 className={styles.doctorName}>{doctor.name}</h2>
                  <p className={styles.doctorSpecialty}>{doctor.speciality}</p>
                  <div className={styles.doctorDetails}>
                    <div className={styles.detailItem}>
                      <MapPin size={16} />
                      {doctor.address}
                    </div>
                    <div className={styles.detailItem}>
                      <Clock size={16} />
                      {doctor.visiting_hours}
                    </div>
                    <div className={styles.detailItem}>
                      <Building size={16} />
                      {doctor.hospital_name}
                    </div>
                    <div className={styles.detailItem}>
                      <Phone size={16} />
                      {doctor.number}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      View Details
                    </button>
                    <Link  href={loggedIn ? `/doctors/${doctor._id}/book` : "/auth"} className={styles.bookButton}>
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              No doctors found matching your criteria
            </div>
          )}
        </div>

        {pagination.totalPages > 0 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            <div className={styles.pageNumbers}>
              {pageNumbers.map((number, index) => (
                <span key={index}>
                  {number === "..." ? (
                    <span className={styles.ellipsis}>...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(number as number)}
                      className={`${styles.pageNumber} ${currentPage === number ? styles.active : ''}`}
                    >
                      {number}
                    </button>
                  )}
                </span>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />

      {selectedDoctor && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDoctor(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedDoctor(null)}
            >
              <X size={24} />
            </button>

            <div className={styles.modalHeader}>
              <img
                src={selectedDoctor.image_source}
                alt={selectedDoctor.name}
                className={styles.modalImage}
              />
              <div className={styles.modalHeaderContent}>
                <h2>{selectedDoctor.name}</h2>
                <p className={styles.specialty}>{selectedDoctor.speciality}</p>
              </div>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.infoSection}>
                <h3>
                  <Award size={20} />
                  Education & Training
                </h3>
                <ul>
                  <li>{selectedDoctor.degree}</li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <h3>
                  <Stethoscope size={20} />
                  About
                </h3>
                <p>{selectedDoctor.About}</p>
              </div>

              <div className={styles.infoSection}>
                <h3>
                  <Calendar size={20} />
                  Availability
                </h3>
                <p>{selectedDoctor.visiting_hours}</p>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <Building size={20} />
                  <span>{selectedDoctor.hospital_name}</span>
                </div>
                <div className={styles.contactItem}>
                  <MapPin size={20} />
                  <span>{selectedDoctor.address}</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={20} />
                  <span>{selectedDoctor.number}</span>
                </div>
              </div>
              <Link
                href={loggedIn ? `/doctors/${selectedDoctor._id}/book` : "/auth"}
                className={styles.modalBookButton}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}