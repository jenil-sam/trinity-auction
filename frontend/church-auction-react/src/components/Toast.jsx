import { useAuction } from '../context/AuctionContext';
import styles from './Toast.module.css';

export default function ToastContainer() {
  const { toasts } = useAuction();
  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${t.type === 'success' ? styles.success : t.type === 'error' ? styles.error : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
