import { useState } from 'react';
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
