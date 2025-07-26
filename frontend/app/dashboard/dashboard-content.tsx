"use client"

import { useCallback, useEffect, useState } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import Link from "next/link"
import axios from "axios";
import { useRouter } from "next/navigation";
import type { Engine } from "tsparticles-engine"
import { Calendar, Clock, MessageSquare, Stethoscope, User, Plus } from "lucide-react"
import Navbar from "../components/Navbar/Dashboard-Navbar"
import Footer from "../components/Footer/Footer"
import styles from "./dashboard.module.css"

interface User {
  profile_pic?: string;
  name?: string;
  email?: string;
}

interface DashboardStats {
  upcomingAppointments: number;
  pastConsultations: number;
  activeAppointments: number;
  healthScore: number;
}

interface RecentActivity {
  icon: JSX.Element;
  title: string;
  time: string;
  type: string;
}

export default function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    pastConsultations: 0,
    activeAppointments: 0,
    healthScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      console.log("Token from localStorage:", token ? "exists" : "missing");
      
      if (!token) {
        console.log("No token found, redirecting to auth");
        router.push("/auth");
        return;
      }
      
      try {
        console.log("Attempting to fetch user data...");
        const response = await axios.get(`http://localhost:5000/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User data fetched successfully:", response.data);
        setUser(response.data);
        
        // Fetch dashboard stats after user data is loaded
        await fetchDashboardStats(token);
        await fetchRecentActivity(token);
        
      } catch (err: any) {
        console.error("Failed to fetch user data:", err);
        console.log("Error response:", err.response);
        
        if (err.response && err.response.status === 401) {
          console.log("Token is invalid/expired, clearing localStorage and redirecting");
          localStorage.removeItem("token");
          localStorage.removeItem("id");
          router.push("/auth");
        } else {
          setError("Failed to fetch user data. Please try refreshing the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchDashboardStats = async (token: string) => {
    try {
      // Fetch appointments
      const appointmentsResponse = await axios.get(`http://localhost:5000/api/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const appointments = appointmentsResponse.data;
      const now = new Date();
      
      // Calculate upcoming and past appointments
      const upcomingAppointments = appointments.filter((apt: any) => 
        new Date(apt.date) > now && apt.status === 'Approved'
      ).length;
      
      const pastConsultations = appointments.filter((apt: any) => 
        new Date(apt.date) < now && (apt.status === 'Completed' || apt.status === 'Approved')
      ).length;

      // Fetch reminders for active appointments count
      const remindersResponse = await axios.get(`http://localhost:5000/api/reminder`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const activeAppointments = appointments.filter((apt: any) => 
        apt.status === 'Approved' && new Date(apt.date) > now
      ).length;

      // Calculate health score based on completed activities
      const completedReminders = remindersResponse.data.filter((reminder: any) => reminder.completed).length;
      const totalReminders = remindersResponse.data.length;
      const healthScore = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 0;

      setStats({
        upcomingAppointments,
        pastConsultations,
        activeAppointments,
        healthScore
      });    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchRecentActivity = async (token: string) => {
    try {
      const activities: RecentActivity[] = [];

      // Fetch recent appointments
      const appointmentsResponse = await axios.get(`http://localhost:5000/api/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const recentAppointments = appointmentsResponse.data
        .slice(0, 2)
        .map((apt: any) => ({
          icon: <Calendar size={20} />,
          title: `Appointment ${apt.status.toLowerCase()} with Dr. ${apt.doctors_id?.name || 'Unknown'}`,
          time: getRelativeTime(apt.createdAt),
          type: 'appointment'
        }));

      // Fetch recent reminders
      const remindersResponse = await axios.get(`http://localhost:5000/api/reminder`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const recentReminders = remindersResponse.data
        .slice(0, 2)
        .map((reminder: any) => ({
          icon: reminder.type === 'medication' ? <Stethoscope size={20} /> : <Clock size={20} />,
          title: reminder.title,
          time: getRelativeTime(reminder.createdAt),
          type: 'reminder'
        }));

      // Add chatbot activity
      activities.push({
        icon: <MessageSquare size={20} />,
        title: "Chat session with AI Health Assistant",
        time: "Today",
        type: 'chat'
      });

      setRecentActivity([...recentAppointments, ...recentReminders, ...activities].slice(0, 4));

    } catch (error) {
      console.error("Error fetching recent activity:", error);
      // Set default activity if API fails
      setRecentActivity([
        {
          icon: <MessageSquare size={20} />,
          title: "Welcome to SymptoSeek!",
          time: "Now",
          type: 'welcome'
        }
      ]);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      setUser(null);
      router.push("/auth");
    }
  };

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const dashboardStats = [
    { value: stats.upcomingAppointments.toString(), label: "Upcoming Appointments", link: "/appointments"},
    { value: stats.pastConsultations.toString(), label: "Past Consultations" },
    { value: stats.activeAppointments.toString(), label: "Active Appointments", link: "/appointments" },
    { value: `${stats.healthScore}%`, label: "Health Score" },
  ]

  if (loading) return <p className={styles.loading}></p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
      <div className={styles.container}>
        <Navbar isLoggedIn={true} userImage={user?.profile_pic || "/default-avatar.png"} onLogout={handleLogout} />
        <main className={styles.main}>
          <section className={styles.welcomeSection}>
            <Particles
                className={styles.particles}
                init={particlesInit}
                options={{
                  fullScreen: { enable: false },
                  background: {
                    color: {
                      value: "transparent",
                    },
                  },
                  fpsLimit: 120,
                  interactivity: {
                    events: {
                      onHover: {
                        enable: true,
                        mode: "repulse",
                      },
                      resize: true,
                    },
                    modes: {
                      repulse: {
                        distance: 100,
                        duration: 0.4,
                      },
                    },
                  },
                  particles: {
                    color: {
                      value: "#9333EA",
                    },
                    links: {
                      color: "#9333EA",
                      distance: 150,
                      enable: true,
                      opacity: 0.2,
                      width: 1,
                    },
                    move: {
                      direction: "none",
                      enable: true,
                      outModes: {
                        default: "bounce",
                      },
                      random: false,
                      speed: 2,
                      straight: false,
                    },
                    number: {
                      density: {
                        enable: true,
                        area: 800,
                      },
                      value: 50,
                    },
                    opacity: {
                      value: 0.2,
                    },
                    shape: {
                      type: "circle",
                    },
                    size: {
                      value: { min: 1, max: 3 },
                    },
                  },
                  detectRetina: true,
                }}
            />
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>Welcome back, {user?.name || "User"}! </h1>
              <p className={styles.welcomeText}>
                Track your health journey and manage your appointments all in one place
              </p>
            </div>
          </section>

          <div className={styles.statsGrid}>
            {dashboardStats.map((stat, index) => (
                <Link
                    key={index}
                    href={stat.link || "#"}
                    className={styles.statCard}
                    style={{ textDecoration: 'none' }}
                >
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                  {stat.link && (
                      <div className={styles.statAction}>
                        <Plus size={16} />
                        View
                      </div>
                  )}
                </Link>
            ))}
          </div>

          <section className={styles.recentActivity}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{activity.icon}</div>
                    <div className={styles.activityContent}>
                      <Link href="/profile" className={styles.activityTitle}>{activity.title}</Link>
                      <div className={styles.activityTime}>{activity.time}</div>
                    </div>
                  </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
  )
}