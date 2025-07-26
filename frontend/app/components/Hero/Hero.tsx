
"use client"

import { useCallback } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { useRouter } from "next/navigation"
import type { Engine } from "tsparticles-engine"
import styles from "./Hero.module.css"
import type React from "react"

interface HeroProps {
  isLoggedIn: boolean
}

export default function Hero({ isLoggedIn }: HeroProps) {
  const router = useRouter()

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  // console.log(isLoggedIn)

  const handleClick = () => {
    if (isLoggedIn) {
      router.push("/dashboard")
    } else {
      router.push("/auth")
    }
  }

  return (
    <section className={styles.hero}>
      <Particles
        className={styles.particles}
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: { repulse: { distance: 100, duration: 0.4 } },
          },
          particles: {
            color: { value: "#9333EA" },
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
              outModes: { default: "bounce" },
              random: false,
              speed: 2,
              straight: false,
            },
            number: {
              density: { enable: true, area: 800 },
              value: 50,
            },
            opacity: { value: 0.2 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />
      <div className={styles.content}>
        <h1 className={styles.animatedText}>Welcome to SymptoSeek</h1>
        <p className={styles.animatedSubtext}>Revolutionizing Symptom Analysis with AI-driven insights</p>

        <button
          onClick={handleClick}
          className={styles.button}
          style={{ "--clr": "#7808d0" } as React.CSSProperties}
        >
          <span className={styles.buttonIconWrapper}>
            <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.buttonIconSvg} width="10">
              <path
                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                fill="currentColor"
              ></path>
            </svg>

            <svg viewBox="0 0 14 15" fill="none" width="10" xmlns="http://www.w3.org/2000/svg" className={`${styles.buttonIconSvg} ${styles.buttonIconSvgCopy}`}>
              <path
                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                fill="currentColor"
              ></path>
            </svg>
          </span>
          {isLoggedIn ? "Go To Dashboard" : "Get Started"}
        </button>
      </div>
    </section>
  )
}
