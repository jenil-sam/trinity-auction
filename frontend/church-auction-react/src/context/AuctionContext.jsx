/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuctionContext = createContext(null);

const INITIAL_ITEMS = [];

export function AuctionProvider({ children }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [liveItemId, setLiveItemId] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pendingWinItem, setPendingWinItem] = useState(null);
  const [camOn, setCamOn] = useState(false);

  const liveItem = items.find(i => i.id === liveItemId) || null;

  useEffect(() => {
    // Session restore handled centrally in App to avoid duplicate requests
    setAuthLoading(false);
  }, []);

  const addToast = useCallback((msg, type = '') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const placeBid = useCallback((incrementAmt) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setItems(prev => prev.map(item => {
      if (item.id !== liveItemId) return item;
      const newAmt = (item.currentBid || item.startPrice) + incrementAmt;
      const newBid = {
        user: currentUser?.name || 'You',
        churchId: currentUser?.churchId || '???',
        amount: newAmt,
        time: timeStr,
        uid: 'me',
      };
      return { ...item, currentBid: newAmt, topBidder: currentUser?.name || 'You', topBidderUid: 'me', bids: [newBid, ...item.bids] };
    }));
    addToast('🌾 Bid placed!', 'success');
  }, [liveItemId, currentUser, addToast]);

  const goLive = useCallback((id) => {
    const alreadyLive = items.find(i => i.status === 'live');
    if (alreadyLive) { addToast('Close the current live item first', 'error'); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'live' } : i));
    setLiveItemId(id);
    addToast(`Item is now LIVE!`, 'success');
  }, [items, addToast]);

  const closeItem = useCallback((id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const winner = i.topBidder;
      return { ...i, status: 'sold', winner };
    }));
    const item = items.find(i => i.id === id);
    if (item?.topBidderUid === 'me') setPendingWinItem(item);
    addToast('Item closed! Winner announced.', 'success');
  }, [items, addToast]);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const addItem = useCallback((newItem) => {
    setItems(prev => [...prev, { ...newItem, id: Date.now(), currentBid: 0, status: 'pending', bids: [], topBidder: null, topBidderUid: null, winner: null, payStatus: null }]);
    addToast('Item added!', 'success');
  }, [addToast]);

  const markPaid = useCallback((id, method) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, payStatus: method } : i));
    addToast('Payment recorded', 'success');
  }, [addToast]);

  const confirmPayment = useCallback((method) => {
    if (pendingWinItem) {
      markPaid(pendingWinItem.id, method === 'stripe' ? 'paid' : method);
      setPendingWinItem(null);
      const nextPending = items.find(i => i.status === 'pending');
      if (nextPending) { setLiveItemId(nextPending.id); }
    }
    const labels = { stripe: 'Payment confirmed! ✅', zelle: 'Zelle noted — pay within 24h', check: 'Check noted — mail within 3 days', cash: 'See registration table tonight' };
    addToast(labels[method] || 'Payment noted', 'success');
  }, [pendingWinItem, items, markPaid, addToast]);

  return (
    <AuctionContext.Provider value={{
      items, liveItem, liveItemId,
      currentUser, setCurrentUser,
      authLoading,
      accessToken,
      isAdmin, setIsAdmin,
      toasts,
      pendingWinItem, setPendingWinItem,
      camOn, setCamOn,
      addToast, placeBid, goLive, closeItem, updateItem, addItem, markPaid, confirmPayment,
    }}>
      {children}
    </AuctionContext.Provider>
  );
}

export const useAuction = () => useContext(AuctionContext);
