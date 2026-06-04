import { useAuction } from '../context/AuctionContext';
import styles from './Navbar.module.css';

export default function Navbar({ page, setPage }) {
  const { currentUser, isAdmin } = useAuction();

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>⛪</span>
        <div>
          <div className={styles.brandName}>Harvest Auction</div>
          <div className={styles.brandSub}>Trinity Marthoma Church</div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${page === 'auction' ? styles.active : ''}`}
          onClick={() => setPage('auction')}
        >
          🛒 Auction
        </button>
        {isAdmin && (
          <button
            className={`${styles.tab} ${page === 'admin' ? styles.active : ''}`}
            onClick={() => setPage('admin')}
          >
            ⚙️ Admin
          </button>
        )}
      </div>

      {currentUser && (
        <div className={styles.userChip}>
          <div className={styles.avatar}>{currentUser.avatarInitial || currentUser.name[0]}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{currentUser.name}</div>
            {currentUser.churchId && (
              <div className={styles.churchId}>ID: {currentUser.churchId}</div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
