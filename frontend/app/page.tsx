"use client"

import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "./components/Navbar/Navbar"
import Hero from "./components/Hero/Hero"
import Features from "./components/Features/Features"
import Statistics from "./components/Statistics/Statistics"
import HowItWorks from "./components/HowItWorks/HowItWorks"
import Testimonials from "./components/Testimonials/Testimonials"
import Footer from "./components/Footer/Footer"
import styles from "./page.module.css"
import { useEffect, useState } from "react"


export default function Home() {
    const router = useRouter();

    interface User {
        profile_pic?: string;
        name?: string;
    }

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            console.log('From root',token);
            if (!token) {
                // router.push("/auth");
                return;
            }
            try {
                const response = await axios.get(`http://localhost:5000/api/auth/profile`, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                if(response){
                    setIsLoggedIn(true);
                }
                setUser(response.data);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError("Failed to fetch user data.");
                // localStorage.removeItem("token");
                // router.push("/auth");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token"); // Remove token from local storage
        setUser(null); // Reset user state
        setIsLoggedIn(false);
        // router.push("/auth"); // Redirect to auth page
    };

  return (
    <div className={styles.app}>
      <Navbar isLoggedIn={isLoggedIn} userImage={user?.profile_pic || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740"} onLogout={handleLogout} />
      <main className={styles.main}>
        <Hero isLoggedIn={isLoggedIn} />
        <Features />
        <Statistics />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}