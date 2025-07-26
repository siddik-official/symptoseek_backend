import { MessageSquare, Stethoscope, ClipboardCheck } from 'lucide-react'
import styles from './HowItWorks.module.css'

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.title}>
          <h2>How SymptoSeek Works</h2>
          <p>Get started with our simple three-step process to receive AI-powered health insights</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.icon}>
              <MessageSquare size={32} />
            </div>
            <h3>Describe Your Symptoms</h3>
            <p>Share your symptoms and health concerns with our AI chatbot in natural language</p>
          </div>
          <div className={styles.step}>
            <div className={styles.icon}>
              <Stethoscope size={32} />
            </div>
            <h3>AI Analysis</h3>
            <p>Our advanced AI analyzes your symptoms and compares them with extensive medical data</p>
          </div>
          <div className={styles.step}>
            <div className={styles.icon}>
              <ClipboardCheck size={32} />
            </div>
            <h3>Get Insights</h3>
            <p>Receive personalized health insights and recommendations for next steps</p>
          </div>
        </div>
      </div>
    </section>
  )
}