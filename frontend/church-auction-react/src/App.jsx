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
  const [page, setPage] = useState('auction');

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
