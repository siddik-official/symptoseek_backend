import { User } from 'lucide-react'
import styles from './Testimonials.module.css'

export default function Testimonials() {
  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <div className={styles.title}>
          <h2>What Our Users Say</h2>
          <p>Discover how SymptoSeek has helped people understand their health better</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.testimonial}>
            <p className={styles.content}>
              &ldquo;SymptoSeek helped me understand my symptoms when I was unsure whether to see a doctor. The AI provided clear insights that helped me make an informed decision.&rdquo;
            </p>
            <div className={styles.author}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.info}>
                <h4>Sarah Johnson</h4>
                <p>Healthcare Professional</p>
              </div>
            </div>
          </div>
          <div className={styles.testimonial}>
            <p className={styles.content}>
              &ldquo;The accuracy of the symptom analysis is impressive. It&apos;s like having a knowledgeable healthcare companion available 24/7.&rdquo;
            </p>
            <div className={styles.author}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.info}>
                <h4>Michael Chen</h4>
                <p>Regular User</p>
              </div>
            </div>
          </div>
          <div className={styles.testimonial}>
            <p className={styles.content}>
              &ldquo;As someone with chronic conditions, having access to AI-powered health insights has been invaluable for managing my day-to-day health.&rdquo;
            </p>
            <div className={styles.author}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.info}>
                <h4>Emily Rodriguez</h4>
                <p>Long-term User</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}