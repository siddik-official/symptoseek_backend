"use client"

import Link from "next/link"
import {type ReactNode, useState, useEffect} from "react"
import { useRouter } from 'next/navigation'
import axios from "axios"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Stethoscope,
  Plus,
  Clock,
  Pill,
  Activity,
  Menu,
  X
} from "lucide-react"
import styles from "./reminders.module.css"

interface Reminder {
  _id: string
  title: string
  time: string
  type: "medication" | "appointment" | "exercise" | "other"
  description: string
  completed: boolean
  user_id: string
  createdAt: string
  updatedAt: string
  date?: string
  recurring?: "none" | "daily" | "weekly" | "monthly"
  daysOfWeek?: number[]
}

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

type ReminderFormData = {
  title: string;
  time: string;
  type: "medication" | "appointment" | "exercise" | "other";
  description: string;
  date: string;
  recurring: "none" | "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
};

export default function RemindersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newReminder, setNewReminder] = useState<ReminderFormData>({
    title: "",
    time: "",
    type: "medication",
    description: "",
    date: "",
    recurring: "none",
    daysOfWeek: []
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

        // Fetch reminders
        const remindersResponse = await axios.get(`http://localhost:5000/api/reminder`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveReminders(remindersResponse.data);
        
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

  const toggleComplete = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const reminder = activeReminders.find(r => r._id === id);
      if (!reminder) return;

      const response = await axios.put(
        `http://localhost:5000/api/reminder/${id}`,
        { completed: !reminder.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActiveReminders(prev =>
        prev.map(reminder =>
          reminder._id === id
            ? { ...reminder, completed: !reminder.completed }
            : reminder
        )
      );
    } catch (error) {
      console.error("Error updating reminder:", error);
      setError("Failed to update reminder");
    }
  };

  const addReminder = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!newReminder.title || !newReminder.time || !newReminder.description) {
      setError("Please fill all required fields");
      return;
    }

    // Validate date for non-recurring reminders
    if (newReminder.recurring === "none" && !newReminder.date) {
      setError("Please select a date for one-time reminders");
      return;
    }

    // Validate days for weekly recurring reminders
    if (newReminder.recurring === "weekly" && newReminder.daysOfWeek.length === 0) {
      setError("Please select at least one day for weekly reminders");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/reminder`,
        newReminder,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActiveReminders(prev => [...prev, response.data]);
      setNewReminder({
        title: "",
        time: "",
        type: "medication",
        description: "",
        date: "",
        recurring: "none",
        daysOfWeek: []
      });
      setIsAddModalOpen(false);
      setError("");
    } catch (error) {
      console.error("Error adding reminder:", error);
      setError("Failed to add reminder");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Pill size={20} />
      case "appointment":
        return <Calendar size={20} />
      case "exercise":
        return <Activity size={20} />
      case "other":
        return <Bell size={20} />
      default:
        return <Bell size={20} />
    }
  }

  const formatRecurringInfo = (reminder: Reminder) => {
    if (reminder.recurring === "none" || !reminder.recurring) {
      if (reminder.date) {
        const date = new Date(reminder.date);
        return `${date.toLocaleDateString()}`;
      }
      return "One time";
    }
    
    if (reminder.recurring === "daily") {
      return "Daily";
    }
    
    if (reminder.recurring === "weekly" && reminder.daysOfWeek) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = reminder.daysOfWeek.map(d => dayNames[d]).join(', ');
      return `Weekly: ${selectedDays}`;
    }
    
    if (reminder.recurring === "monthly") {
      return "Monthly";
    }
    
    return "One time";
  }

  if (loading) return <div className={styles.loading}>Loading reminders...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
      <div className={styles.container}>
        <button className={styles.menuButton} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </button>

        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <Link href="/" className={styles.mainLogo}>
            <div className={styles.logoIcon}>
              <Stethoscope size={24} />
            </div>
            <span>SymptoSeek</span>
          </Link>

          <nav className={styles.navigation}>
            <Link href="/dashboard" className={styles.navItem}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/reports" className={styles.navItem}>
              <FileText size={20} />
              Reports
            </Link>
            <Link href="/appointments" className={styles.navItem}>
              <Calendar size={20} />
              Appointments
            </Link>
            <Link href="/reminders" className={`${styles.navItem} ${styles.active}`}>
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
            <h1>Reminders</h1>
            {error && <div className={styles.error}>{error}</div>}
            <button className={styles.addButton} onClick={() => {
              setIsAddModalOpen(true);
              setError("");
            }}>
              <Plus size={20} />
              Add Reminder
            </button>
          </div>

          <div className={styles.reminders}>
            {activeReminders.map((reminder) => (
                <div
                    key={reminder._id}
                    className={`${styles.reminderCard} ${reminder.completed ? styles.completed : ''}`}
                >
                  <div className={styles.reminderHeader}>
                    <div className={styles.reminderIcon}>
                      {getIcon(reminder.type)}
                    </div>
                    <div className={styles.reminderTime}>
                      <Clock size={16} />
                      {reminder.time}
                    </div>
                  </div>

                  <div className={styles.reminderContent}>
                    <h3>{reminder.title}</h3>
                    <p>{reminder.description}</p>
                    <div className={styles.reminderSchedule}>
                      {formatRecurringInfo(reminder)}
                    </div>
                  </div>

                  <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={reminder.completed}
                        onChange={() => toggleComplete(reminder._id)}
                    />
                    <span className={styles.checkmark}></span>
                    Mark as completed
                  </label>
                </div>
            ))}
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
                    <h2>Add New Reminder</h2>
                    {error && <div className={styles.modalError}>{error}</div>}
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault()
                    addReminder()
                  }}>
                    <div className={styles.modalContent}>
                      <div className={styles.formGroup}>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={newReminder.title}
                            onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Take Blood Pressure Medicine"
                            required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="time">Time</label>
                          <input
                              id="time"
                              type="time"
                              value={newReminder.time}
                              onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                              required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="type">Type</label>
                          <select
                              id="type"
                              value={newReminder.type}
                              onChange={(e) => {
                                const value = e.target.value as ReminderFormData['type'];
                                setNewReminder(prev => ({ ...prev, type: value }));
                              }}
                              required
                          >
                            <option value="medication">Medication</option>
                            <option value="appointment">Appointment</option>
                            <option value="exercise">Exercise</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="recurring">Recurring Pattern</label>
                        <select
                            id="recurring"
                            value={newReminder.recurring}
                            onChange={(e) => {
                              const value = e.target.value as ReminderFormData['recurring'];
                              setNewReminder(prev => ({ 
                                ...prev, 
                                recurring: value,
                                daysOfWeek: value === 'weekly' ? prev.daysOfWeek : []
                              }));
                            }}
                            required
                        >
                          <option value="none">One Time</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      {newReminder.recurring === 'none' && (
                        <div className={styles.formGroup}>
                          <label htmlFor="date">Date</label>
                          <input
                              id="date"
                              type="date"
                              value={newReminder.date}
                              onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              required
                          />
                        </div>
                      )}

                      {newReminder.recurring === 'weekly' && (
                        <div className={styles.formGroup}>
                          <label>Days of Week</label>
                          <div className={styles.daysSelector}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                              <label key={index} className={styles.dayCheckbox}>
                                <input
                                  type="checkbox"
                                  checked={newReminder.daysOfWeek.includes(index)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewReminder(prev => ({
                                        ...prev,
                                        daysOfWeek: [...prev.daysOfWeek, index]
                                      }));
                                    } else {
                                      setNewReminder(prev => ({
                                        ...prev,
                                        daysOfWeek: prev.daysOfWeek.filter(d => d !== index)
                                      }));
                                    }
                                  }}
                                />
                                <span>{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className={styles.textarea}
                            value={newReminder.description}
                            onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add any additional details..."
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
                        Add Reminder
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