"use client";

import Link from "next/link"
import axios from "axios";
import Image from "next/image"
import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Clock,
  Stethoscope,
  Hash,
  Activity,
  Heart,
  Pill,
  LineChart,
  Moon,
  Footprints,
  Scale,
  Timer,
  Edit,
  Menu,
} from "lucide-react"
import styles from "./profile.module.css"

interface NavItemProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
interface User {
  _id: string;
  name: string;
  email: string;
  bio: string;
  gender: string;
  age: number | null;
  phone: string;
  address: string;
  zip_code: string;
  country: string;
  state: string;
  city: string;
  profile_pic: string;
  role: string;
  status: string;
  blood_group: string;
  weight: string;
  height: string;
  allergies: string;
  medical_conditions: string;
  medications: string;
  surgeries: string;
  family_medical_history: string;
  emergency_contact: string;
  date: string;
  __v: number;
}

const NavItem = ({ href, children, className, onClick }: NavItemProps) => {
  const classes = `${styles.navItem} ${className || ''}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from local storage
    setUser(null); // Reset user state
    router.push("/auth"); // Redirect to auth page
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth");
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/profile`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        console.log(response.data)
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // localStorage.removeItem("token");
        // router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    if (isMounted) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={toggleSidebar}>
        <Menu size={24} />
      </button>
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <Link href="/" className={styles.mainLogo}>
          <div className={styles.logoIcon}>
            <Stethoscope size={24} />
          </div>
          <span>SymptoSeek</span>
        </Link>

        <nav className={styles.navigation}>
          <NavItem href="/dashboard">
            <LayoutDashboard size={20} />
            Dashboard
          </NavItem>
          <NavItem href="/reports">
            <FileText size={20} />
            Reports
          </NavItem>
          <NavItem href="/appointments">
            <Calendar size={20} />
            Appointments
          </NavItem>
          <NavItem href="/reminders">
            <Bell size={20} />
            Reminders
          </NavItem>
          <NavItem href="/profile" className={styles.active}>
            <User size={20} />
            Profile
          </NavItem>
        </nav>

        <div className={styles.bottomNav}>
          <NavItem href="/settings">
            <Settings size={20} />
            Settings
          </NavItem>
          <NavItem onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={20} />
            Log out
          </NavItem>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.profileImage}>
            <Image
              src={user?.profile_pic || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740"}
              alt="Profile"
              width={120}
              height={120}
            />
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{user?.name}</h1>
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <User size={16} />
                Age: {user?.age || 'Not availabe'}
              </div>
              <div className={styles.metaItem}>
                <Clock size={16} />
                Last analysis: Today
              </div>
              <div className={styles.metaItem}>
                <Hash size={16} />
                User ID: J8D2N0E5
              </div>
            </div>
          </div>
          <Link href="/profile/edit" className={styles.editButton}>
            <Edit size={16} />
            Edit Profile
          </Link>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Activity size={20} />
              Analysis history
            </h2>
            <div className={styles.historyItem}>
              <div className={styles.historyIcon}>
                <Heart size={20} />
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyTitle}>Recommendation test</div>
                <div className={styles.historyMeta}>Dr. Lisa Smith</div>
                <Link href="/dashboard" className={styles.viewMore}>View in Dashboard</Link>
              </div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyIcon}>
                <Activity size={20} />
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyTitle}>X-ray scan</div>
                <div className={styles.historyMeta}>Dr. Michael Johnson</div>
                <Link href="/dashboard" className={styles.viewMore}>View in Dashboard</Link>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Heart size={20} />
              Health status
            </h2>
            <div className={styles.healthStatus}>
              <div className={styles.statusItem}>
                <div className={styles.statusIcon}>
                  <Activity size={16} />
                </div>
                Vitamin deficiency
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusIcon}>
                  <Heart size={16} />
                </div>
                Blood pressure normal
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusIcon}>
                  <LineChart size={16} />
                </div>
                Sugar levels stable
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Pill size={20} />
              Medication history
            </h2>
            <div className={styles.historyItem}>
              <div className={styles.historyIcon}>
                <Pill size={20} />
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyTitle}>Ibuprofen 200mg</div>
                <div className={styles.historyMeta}>Prescribed weekly</div>
              </div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyIcon}>
                <Pill size={20} />
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyTitle}>Omeprazole</div>
                <div className={styles.historyMeta}>As needed</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Activity size={20} />
              Daily Statistics
            </h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Moon size={20} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Sleep</div>
                  <div className={styles.statValue}>avg. 8h 15 min</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Footprints size={20} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Activity</div>
                  <div className={styles.statValue}>10,502 steps</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Scale size={20} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Body mass</div>
                  <div className={styles.statValue}>70 kg</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Timer size={20} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Calories</div>
                  <div className={styles.statValue}>2,300 kcal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}