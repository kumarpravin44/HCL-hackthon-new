import React from 'react';
import styles from './StatusTimeline.module.scss';

export default function StatusTimeline({ history = [] }) {
  if (!history.length) return <p>No status history available.</p>;

  return (
    <div className={styles.timeline}>
      {history.map((entry, idx) => (
        <div key={idx} className={styles['timeline-item']}>
          <div className={`${styles['timeline-dot']} ${styles[entry.status.toLowerCase()]}`} />
          <div className={styles['timeline-content']}>
            <div className={styles['timeline-status']}>{entry.status}</div>
            {entry.comment && (
              <div className={styles['timeline-comment']}>{entry.comment}</div>
            )}
            <div className={styles['timeline-date']}>
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
