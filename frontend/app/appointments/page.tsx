"use client"

import {type ReactNode, useState, useEffect} from 'react'
import { Calendar, Clock, Plus, LayoutDashboard, FileText, Bell, User, Settings, LogOut, Stethoscope, Menu, X } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import Navbar from "../components/Navbar/Navbar"
import Footer from "../components/Footer/Footer"
import styles from "./appointments.module.css"
import {useRouter} from "next/navigation";

interface NavItemProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
interface User {
  profile_pic?: string;
  name?: string;
}

interface Appointment {
  _id: string
  title: string
  date: string
  time: string
  type: string
  status: "Pending" | "Approved" | "Completed" | "Cancelled"
  doctors_id?: {
    name: string
    _id: string
  }
  user_id: string
  createdAt: string
  updatedAt: string
}

interface Reminder {
  _id: string
  title: string
  date: string
  time: string
  type: string
  description: string
  completed: boolean
}

export default function AppointmentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    date: "",
    time: "",
    type: "Check-up",
    status: "Pending",
    description: ""
  })
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth");
        return;
      }
      
      try {
        // Fetch user data
        const userResponse = await axios.get(`http://localhost:5000/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);

        // Fetch appointments
        const appointmentsResponse = await axios.get(`http://localhost:5000/api/appointments/my-appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(appointmentsResponse.data);

        // Fetch reminders
        const remindersResponse = await axios.get(`http://localhost:5000/api/reminder`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReminders(remindersResponse.data);
        
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth");
        } else {
          setError("Failed to fetch data. Please try refreshing the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#10b981';
      case 'Pending':
        return '#f59e0b';
      case 'Completed':
        return '#6366f1';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) return <div className={styles.loading}>Loading appointments...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/appointments`,
        {
          title: newAppointment.title,
          date: newAppointment.date,
          time: newAppointment.time,
          type: newAppointment.type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments(prev => [...prev, response.data]);
      setNewAppointment({
        title: "",
        date: "",
        time: "",
        type: "Check-up",
        status: "Pending",
        description: ""
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding appointment:", error);
      setError("Failed to add appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.patch(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { status: "Cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: "Cancelled" as const }
            : apt
        )
      );
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError("Failed to cancel appointment");
    }
  };

  return (
      <div className={styles.container}>
        <button
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={24} />
        </button>

        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <Link href="/" className={styles.mainLogo}>
            <div className={styles.logoIcon}>
              <Stethoscope size={24} />
            </div>
            <span>SymptoSeek</span>
          </Link>

          <nav>
            <Link href="/dashboard" className={styles.navItem}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/reports" className={styles.navItem}>
              <FileText size={20} />
              Reports
            </Link>
            <Link href="/appointments" className={`${styles.navItem} ${styles.active}`}>
              <Calendar size={20} />
              Appointments
            </Link>
            <Link href="/reminders" className={styles.navItem}>
              <Bell size={20} />
              Reminders
            </Link>
            <Link href="/profile" className={styles.navItem}>
              <User size={20} />
              Profile
            </Link>
          </nav>

          <div className={styles.bottomNav}>
            <Link href="/settings" className={styles.navItem}>
              <Settings size={20} />
              Settings
            </Link>
            <button onClick={handleLogout}  className={styles.navItem}>
              <LogOut size={20} />
              Log out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.header}>
            <h1>My Appointments</h1>
            <button className={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              New Appointment
            </button>
          </div>

          <div className={styles.content}>
            {appointments.map((appointment) => (
                <div key={appointment._id} className={`${styles.appointmentCard}`} style={{borderLeft: `4px solid ${getStatusColor(appointment.status)}`}}>
                  <div className={styles.appointmentHeader}>
                    <h3 className={styles.appointmentTitle}>{appointment.title}</h3>
                    <span className={styles.appointmentStatus} style={{color: getStatusColor(appointment.status)}}>{appointment.status}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <div className={styles.appointmentInfo}>
                      <Calendar size={16} />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>
                  </div>
                  <div className={styles.appointmentType}>Dr. {appointment.doctors_id?.name || 'TBD'}</div>
                  <div className={styles.appointmentActions}>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => handleCancelAppointment(appointment._id)}
                      disabled={appointment.status === 'Cancelled' || appointment.status === 'Completed'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
            ))}

            {appointments.length === 0 && (
              <div className={styles.emptyState}>
                <Calendar size={48} />
                <h3>No Appointments Yet</h3>
                <p>Book an appointment with a doctor to get started with your healthcare journey.</p>
                <Link href="/doctors" className={styles.bookButton}>
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

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
                    <h2>Add New Appointment</h2>
                  </div>

                  <form onSubmit={handleAddAppointment}>
                    <div className={styles.modalContent}>
                      <div className={styles.formGroup}>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={newAppointment.title}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. General Health Check-up"
                            required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="date">Date</label>
                          <input
                              id="date"
                              type="date"
                              value={newAppointment.date}
                              onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                              required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="time">Time</label>
                          <input
                              id="time"
                              type="time"
                              value={newAppointment.time}
                              onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                              required
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="type">Type</label>
                          <select
                              id="type"
                              value={newAppointment.type}
                              onChange={(e) => setNewAppointment(prev => ({ ...prev, type: e.target.value }))}
                              required
                          >
                            <option value="Check-up">Check-up</option>
                            <option value="Dental">Dental</option>
                            <option value="Test">Test</option>
                            <option value="Vaccination">Vaccination</option>
                            <option value="Therapy">Therapy</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="status">Status</label>
                          <select
                              id="status"
                              value={newAppointment.status}
                              onChange={(e) => setNewAppointment(prev => ({ ...prev, status: e.target.value }))}
                              required
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className={styles.textarea}
                            value={newAppointment.description}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add any additional details about the appointment..."
                            rows={4}
                        />
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
                        Add Appointment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}
        </main>
      </div>
  )
}