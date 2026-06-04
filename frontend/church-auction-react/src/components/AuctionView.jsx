/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import styles from '../styles/components/AuctionView.module.css';
import LiveFeed from './LiveFeed';

export default function AuctionView() {
  const { liveItem, currentUser, camOn, setCamOn, placeBid, pendingWinItem } = useAuction();
  const [feedView, setFeedView] = useState('feed'); // feed | cams
  const [selectedInc, setSelectedInc] = useState(null);
  const [bidFlash, setBidFlash] = useState(false);
  

  const item = liveItem;
  const increments = item?.increments || [5, 10, 20];
  const activeInc = selectedInc && increments.includes(selectedInc) ? selectedInc : increments[0];
  const currentAmt = item ? (item.currentBid || item.startPrice) : 0;
  const bidPreview = currentAmt + activeInc;
  const iAmTopBidder = item?.topBidderUid === 'me';
  const iWon = item?.status === 'sold' && item?.topBidderUid === 'me';

  const handleBid = () => {
    placeBid(activeInc);
    setBidFlash(true);
    setTimeout(() => setBidFlash(false), 500);
  };

  return (
    <div className={styles.layout}>
      {/* ─── LEFT: FEED ─── */}
      <div className={styles.feedPane}>
        {/* View toggle */}
        <div className={styles.feedToggles}>
          {/* <button className={`${styles.vt} ${feedView === 'feed' ? styles.vtActive : ''}`} onClick={() => setFeedView('feed')}>📺 Host Feed</button> */}
          {/* <button className={`${styles.vt} ${feedView === 'cams' ? styles.vtActive : ''}`} onClick={() => setFeedView('cams')}>👥 Participants</button> */}
        </div>
        <div className={styles.liveBadge}><span className={styles.liveDot} />LIVE</div>

        {feedView === 'feed' && <LiveFeed />}

        {/* {feedView === 'cams' && (
          <div className={styles.camsGrid}>
            <CamTile name="Pastor Mike (Host)" isHost active icon="🎙️" />
            <CamTile name="Maria R." icon="🟢" camOn />
            <CamTile name="Sarah K." icon="👤" />
            <CamTile name="James T." icon="👤" />
            <CamTile name={currentUser?.name || 'You'} icon={camOn ? '🟢' : '😊'} isMe camOn={camOn} />
            <button className={styles.toggleCamTile} onClick={() => setCamOn(v => !v)}>
              <span style={{ fontSize: '1.8rem' }}>{camOn ? '🚫' : '📷'}</span>
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)' }}>{camOn ? 'Turn off camera' : 'Turn on camera'}</span>
            </button>
          </div>
        )} */}
      </div>

      {/* ─── RIGHT: SIDEBAR ─── */}
      <div className={styles.sidebar}>
        {/* Item header */}
        <div className={styles.itemHeader}>
          <div className={styles.itemNum}>Item #{item?.id || '—'} of 5</div>
          <div className={styles.itemName}>{item?.name || 'No live item'}</div>
          <div className={styles.itemDesc}>{item?.desc}</div>
        </div>

        {/* Current bid */}
        <div className={`${styles.bidDisplay} ${bidFlash ? styles.flash : ''}`}>
          <div className={styles.bidLabel}>Current Bid</div>
          <div className={styles.bidAmount}><span className={styles.dollar}>$</span>{currentAmt}</div>
          <div className={styles.bidMeta}>
            Top bidder: <strong>{item?.topBidder || '—'}</strong>
            {iAmTopBidder && <span className={styles.youBadge}>You!</span>}
            &nbsp;·&nbsp; {item?.bids?.length || 0} bids
          </div>
        </div>

        {/* Winner state */}
        {iWon && pendingWinItem && (
          <div className={styles.winnerBanner}>
            <div className={styles.winnerTitle}>🏆 You Won!</div>
            <div className={styles.winnerSub}>Complete payment to continue bidding.</div>
          </div>
        )}

        {/* Sold to someone else */}
        {item?.status === 'sold' && !iWon && (
          <div className={styles.soldBanner}>
            <div>🔨 Item sold to <strong>{item.winner}</strong></div>
            <div style={{ fontSize: '.82rem', marginTop: '.2rem', opacity: .8 }}>Next item coming up…</div>
          </div>
        )}

        {/* Bid controls */}
        {item?.status === 'live' && (
          <div className={styles.bidControls}>
            <p className={styles.incLabel}>Select increment:</p>
            <div className={styles.incGrid}>
              {increments.map(inc => (
                <button
                  key={inc}
                  className={`${styles.incBtn} ${activeInc === inc ? styles.incSelected : ''}`}
                  onClick={() => setSelectedInc(inc)}
                >
                  +${inc}
                </button>
              ))}
            </div>
            <button className={styles.bidBtn} onClick={handleBid}>
              🌾 Place Bid — ${bidPreview}
            </button>
          </div>
        )}

        {/* Bid history */}
        <div className={styles.bidLog}>
          <div className={styles.bidLogTitle}>Bid History</div>
          {!item?.bids?.length && <div className={styles.noBids}>No bids yet — be the first!</div>}
          {item?.bids?.slice(0, 30).map((b, i) => (
            <div key={i} className={`${styles.bidRow} ${b.uid === 'me' ? styles.myBid : ''}`}>
              <div className={styles.bidRowLeft}>
                <span className={styles.bidderName}>{b.user}</span>
                {b.uid === 'me' && <span className={styles.meBadge}>you</span>}
                {i === 0 && <span className={styles.topBadge}>Top</span>}
              </div>
              <div className={styles.bidRowRight}>
                <span className={styles.bidAmt}>${b.amount}</span>
                <span className={styles.bidTime}>{b.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CamTile({ name, icon, isHost, isMe, camOn, active }) {
  return (
    <div className={`${styles.camTile} ${isHost ? styles.hostTile : ''} ${isMe ? styles.meTile : ''} ${active ? styles.activeSpeaker : ''}`}>
      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
      <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginTop: '.15rem' }}>
        {camOn ? 'Video on' : isHost ? 'Host' : 'Camera off'}
      </span>
      <div className={styles.camName}>{name}</div>
    </div>
  );
}
