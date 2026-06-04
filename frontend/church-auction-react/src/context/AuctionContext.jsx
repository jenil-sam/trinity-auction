/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuctionContext = createContext(null);

const INITIAL_ITEMS = [
  {
    id: 1, name: 'Hand-Quilted Harvest Blanket',
    desc: 'Lovingly crafted by the Women\'s Ministry. One-of-a-kind autumn pattern with church emblem embroidered in the center.',
    startPrice: 40, currentBid: 85, status: 'live',
    increments: [5, 10, 20],
    bids: [
      { user: 'Maria R.', churchId: '021', amount: 85, time: '7:42 PM', uid: 'u2' },
      { user: 'James T.', churchId: '055', amount: 75, time: '7:40 PM', uid: 'u3' },
      { user: 'Sarah K.', churchId: '008', amount: 60, time: '7:38 PM', uid: 'u4' },
      { user: 'Maria R.', churchId: '021', amount: 50, time: '7:35 PM', uid: 'u2' },
    ],
    topBidder: 'Maria R.', topBidderUid: 'u2', winner: null, payStatus: null,
  },
  {
    id: 2, name: 'Apple Pie Basket (6 Pies)',
    desc: 'Six homemade apple pies from Sister Agnes — a legendary recipe passed down three generations.',
    startPrice: 30, currentBid: 0, status: 'pending',
    increments: [5, 10, 25], bids: [], topBidder: null, topBidderUid: null, winner: null, payStatus: null,
  },
  {
    id: 3, name: 'Weekend Cabin Getaway',
    desc: '2-night stay at Lake Conroe donated by the Henderson family. Sleeps 6, full kitchen, kayaks included.',
    startPrice: 150, currentBid: 0, status: 'pending',
    increments: [10, 25, 50], bids: [], topBidder: null, topBidderUid: null, winner: null, payStatus: null,
  },
  {
    id: 4, name: 'Custom Family Portrait',
    desc: 'Oil painting by Sister Elena. 16×20 canvas, delivered in 3–4 weeks. Choose your style.',
    startPrice: 80, currentBid: 0, status: 'pending',
    increments: [5, 10, 20], bids: [], topBidder: null, topBidderUid: null, winner: null, payStatus: null,
  },
  {
    id: 5, name: 'Gift Card Bundle ($200)',
    desc: 'Collection of local Houston restaurant and store gift cards — Whataburger, HEB, and more.',
    startPrice: 100, currentBid: 165, status: 'sold',
    increments: [5, 10, 20],
    bids: [{ user: 'David P.', churchId: '012', amount: 165, time: '6:55 PM', uid: 'u5' }],
    topBidder: 'David P.', topBidderUid: 'u5', winner: 'David P.', payStatus: 'paid',
  },
];

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

  const addToast = useCallback((msg, type = '') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // on mount, try to refresh session using HttpOnly refresh cookie
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!mounted) return;
        if (data.accessToken) setAccessToken(data.accessToken);
        if (data.user) setCurrentUser(data.user);
      } catch (err) {
        console.debug('No active session found:', err);
      }
      finally {
        if (mounted) setAuthLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
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
