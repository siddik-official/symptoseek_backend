import { Brain, Users, Heart } from "lucide-react"
import styles from "./Features.module.css"

export default function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.feature}>
          <div className={styles.icon}>
            <Brain />
          </div>
          <h3>AI-Driven Analysis</h3>
          <p>Leverage the power of artificial intelligence to understand your symptoms better.</p>
        </div>

        <div className={styles.feature}>
          <div className={styles.icon}>
            <Users />
          </div>
          <h3>User-Friendly Interface</h3>
          <p>Experience a seamless and intuitive platform designed for everyone.</p>
        </div>

        <div className={styles.feature}>
          <div className={styles.icon}>
            <Heart />
          </div>
          <h3>Personalized Recommendations</h3>
          <p>Receive insights tailored specifically to your health needs.</p>
        </div>
      </div>
    </section>
  )
}

