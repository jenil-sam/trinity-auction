import { useState, useEffect } from 'react';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import AuthOverlays from './components/AuthOverlays';
import Navbar from './components/Navbar';
import AuctionView from './components/AuctionView';
import AdminPanel from './components/AdminPanel';
import PaymentModal from './components/PaymentModal';
import ToastContainer from './components/Toast';

function AppInner() {
  const { currentUser, isAdmin } = useAuction();
  const { authLoading } = useAuction();
  const { setCurrentUser } = useAuction();
  // One-time session restore on app mount to avoid duplicate refresh calls
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUser({
          name: data.user.name,
          email: data.user.email,
          username: data.user.username,
          churchId: data.user.church_id,
        });
      } catch (e) {
        console.error('App session restore failed', e);
      }
    })();
  }, []);
  // NOTE: useAuction() should be called once; keep destructuring together to avoid extra renders.
  // Combine into a single call to prevent multiple hook reads.
  // const { currentUser, isAdmin, authLoading } = useAuction();
  const [page, setPage] = useState('auction');
  if (authLoading) return null;
  return (
    <>
      <AuthOverlays />
      {currentUser && (
        <>
          <Navbar page={page} setPage={setPage} />
          {page === 'auction' && <AuctionView />}
          {page === 'admin' && isAdmin && <AdminPanel />}
          <PaymentModal />
        </>
      )}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuctionProvider>
      <AppInner />
    </AuctionProvider>
  );
}
