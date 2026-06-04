import styles from '../styles/components/UI.module.css';

export function Btn({ children, variant = 'primary', full, onClick, disabled, style, type = 'button' }) {
  const cls = [styles.btn, styles[variant], full ? styles.full : ''].filter(Boolean).join(' ');
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

export function Card({ children, style, className = '' }) {
  return <div className={`${styles.card} ${className}`} style={style}>{children}</div>;
}

export function FormGroup({ label, children }) {
  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className={styles.input} {...props} />;
}

export function Textarea({ ...props }) {
  return <textarea className={styles.textarea} {...props} />;
}

export function Select({ children, ...props }) {
  return <select className={styles.input} {...props}>{children}</select>;
}

export function StatusPill({ status }) {
  const map = {
    live: { label: '🔴 Live', cls: styles.pillLive },
    pending: { label: '⏳ Pending', cls: styles.pillPending },
    sold: { label: '✅ Sold', cls: styles.pillSold },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`${styles.pill} ${cls}`}>{label}</span>;
}

export function SectionTitle({ children }) {
  return <h3 className={styles.sectionTitle}>{children}</h3>;
}

export function EmptyState({ children }) {
  return <div className={styles.emptyState}>{children}</div>;
}
