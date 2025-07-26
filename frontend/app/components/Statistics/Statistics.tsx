import styles from './Statistics.module.css'

export default function Statistics() {
  return (
    <section className={styles.statistics}>
      <div className={styles.container}>
        <div className={styles.stat}>
          <div className={styles.number}>50K+</div>
          <div className={styles.label}>Active Users</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.number}>95%</div>
          <div className={styles.label}>Accuracy Rate</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.number}>24/7</div>
          <div className={styles.label}>Support Available</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.number}>100+</div>
          <div className={styles.label}>Health Conditions</div>
        </div>
      </div>
    </section>
  )
}