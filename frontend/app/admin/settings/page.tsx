"use client"

import {type ReactNode, useState} from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Stethoscope,
  BarChart3,
  Calendar,
  FileText,
  Settings,
  Menu,
  Globe,
  Bell,
  Mail,
  Shield,
  Moon,
  Sun,
  Database,
  Lock,
  LogOut,
  User
} from "lucide-react"
import styles from "./settings.module.css"

interface NavItemProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface UserProfile {
  profile_pic?: string;
  name?: string;
}

export default function SettingsPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [systemNotifications, setSystemNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("UTC")
  const [dataRetention, setDataRetention] = useState("30")
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from local storage
    setUser(null); // Reset user state
    router.push("/auth"); // Redirect to auth page
  };

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
          <Link href="/admin/reports" className={styles.sidebarLink}>
            <FileText size={20} />
            Reports
          </Link>
          <Link href="/admin/settings" className={`${styles.sidebarLink} ${styles.active}`}>
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
          <h1>System Settings</h1>
          <p>Configure system-wide settings and preferences</p>
        </div>

        <div className={styles.settingsGrid}>
          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Globe size={20} />
              <h2>Localization</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>
                Language
                <select 
                  className={styles.select}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </label>
              <label className={styles.settingLabel}>
                Time Zone
                <select 
                  className={styles.select}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="GMT">GMT</option>
                </select>
              </label>
            </div>
          </section>

          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Bell size={20} />
              <h2>Notifications</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.toggle}>
                <span className={styles.toggleLabel}>
                  <Mail size={16} />
                  Email Notifications
                </span>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span className={styles.toggleSwitch}></span>
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleLabel}>
                  <Bell size={16} />
                  System Notifications
                </span>
                <input
                  type="checkbox"
                  checked={systemNotifications}
                  onChange={(e) => setSystemNotifications(e.target.checked)}
                />
                <span className={styles.toggleSwitch}></span>
              </label>
            </div>
          </section>

          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Database size={20} />
              <h2>Data Management</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>
                Data Retention Period (days)
                <select 
                  className={styles.select}
                  value={dataRetention}
                  onChange={(e) => setDataRetention(e.target.value)}
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                </select>
              </label>
            </div>
          </section>

          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Shield size={20} />
              <h2>Security</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.toggle}>
                <span className={styles.toggleLabel}>
                  <Lock size={16} />
                  Two-Factor Authentication
                </span>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                />
                <span className={styles.toggleSwitch}></span>
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleLabel}>
                  <Moon size={16} />
                  Dark Mode
                </span>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className={styles.toggleSwitch}></span>
              </label>
            </div>
          </section>
        </div>

        <div className={styles.dangerZone}>
          <h2>Danger Zone</h2>
          <div className={styles.dangerActions}>
            <button className={styles.dangerButton}>
              Reset System Settings
            </button>
            <button className={styles.dangerButton}>
              Clear All Data
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}