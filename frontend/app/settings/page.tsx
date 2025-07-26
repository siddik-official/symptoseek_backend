"use client"

import Link from "next/link"
import {type ReactNode, useState} from "react"
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Stethoscope,
  Shield,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Menu,
  Mail
} from "lucide-react"
import styles from "./settings.module.css"
import router from "next/router";

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

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [language, setLanguage] = useState("en")
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from local storage
    setUser(null); // Reset user state
    router.push("/auth"); // Redirect to auth page
  };

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
          <Link href="/settings" className={`${styles.navItem} ${styles.active}`}>
            <Settings size={20} />
            Settings
          </Link>
          <button onClick={handleLogout} className={styles.navItem}>
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        <div className={styles.settingsGrid}>
          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Shield size={20} />
              <h2>Privacy</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>
                Profile Visibility
                <select className={styles.select}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="contacts">Contacts Only</option>
                </select>
              </label>
              <label className={styles.settingLabel}>
                Activity Status
                <select className={styles.select}>
                  <option value="online">Show when online</option>
                  <option value="hidden">Hide status</option>
                
                </select>
              </label>
            </div>
          </section>

          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <Globe size={20} />
              <h2>Language & Region</h2>
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
                <select className={styles.select}>
                  <option value="utc">UTC</option>
                  <option value="est">EST</option>
                  <option value="pst">PST</option>
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
                  <Smartphone size={16} />
                  Push Notifications
                </span>
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                />
                <span className={styles.toggleSwitch}></span>
              </label>
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
            </div>
          </section>

          <section className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <h2>Appearance</h2>
            </div>
            <div className={styles.settingGroup}>
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
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}