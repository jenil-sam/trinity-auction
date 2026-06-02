import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Btn, Card, FormGroup, Input, Textarea, StatusPill, SectionTitle, EmptyState } from './UI';
import styles from './AdminPanel.module.css';

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'items',     icon: '🛍️', label: 'Auction Items' },
  { id: 'live',      icon: '🔴', label: 'Live Controls' },
  { id: 'winners',   icon: '🏆', label: 'Winners & Payments' },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>⛪ Admin Panel</div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`${styles.navItem} ${tab === n.id ? styles.active : ''}`}
            onClick={() => setTab(n.id)}
          >
            <span className={styles.navIcon}>{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarNote}>Harvest Festival 2024</div>
        </div>
      </aside>

      <main className={styles.content}>
        {tab === 'dashboard' && <Dashboard setTab={setTab} />}
        {tab === 'items'     && <ItemsTab />}
        {tab === 'live'      && <LiveTab />}
        {tab === 'winners'   && <WinnersTab />}
        {tab === 'settings'  && <SettingsTab />}
      </main>
    </div>
  );
}

/* ═══════ DASHBOARD ═══════ */
function Dashboard({ setTab }) {
  const { items, liveItem } = useAuction();
  const totalRaised = items.reduce((s, i) => s + (i.status !== 'pending' ? (i.currentBid || i.startPrice) : 0), 0);
  const sold = items.filter(i => i.status === 'sold').length;
  const pending = items.filter(i => i.status === 'pending').length;
  const allBids = items.flatMap(i => i.bids.map(b => ({ ...b, itemName: i.name }))).slice(0, 8);

  return (
    <div>
      <PageHeader title="Dashboard" sub="Real-time overview of tonight's harvest auction" />
      <div className={styles.statsGrid}>
        <StatCard label="Total Raised" value={`$${totalRaised}`} color="gold" />
        <StatCard label="Total Items" value={items.length} color="green" />
        <StatCard label="Items Sold" value={sold} color="brown" />
        <StatCard label="Items Remaining" value={pending} color="gray" />
      </div>

      <div className={styles.dashRow}>
        <Card style={{ flex: 1 }}>
          <SectionTitle>🔴 Currently Live</SectionTitle>
          {liveItem ? (
            <div className={styles.liveItemSummary}>
              <div>
                <div className={styles.liveItemName}>{liveItem.name}</div>
                <div className={styles.liveItemMeta}>Start: ${liveItem.startPrice} · {liveItem.bids.length} bids · Top: {liveItem.topBidder || '—'}</div>
              </div>
              <div className={styles.liveItemAmount}>${liveItem.currentBid || liveItem.startPrice}</div>
            </div>
          ) : <EmptyState>No item is currently live</EmptyState>}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
            <Btn variant="secondary" onClick={() => setTab('live')}>Open Live Controls →</Btn>
          </div>
        </Card>

        <Card style={{ flex: 1 }}>
          <SectionTitle>📋 Item Status</SectionTitle>
          <div className={styles.itemStatusList}>
            {items.map(i => (
              <div key={i.id} className={styles.statusRow}>
                <span className={styles.statusItemName}>{i.name}</span>
                <StatusPill status={i.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: '1rem' }}>
        <SectionTitle>⚡ Recent Bids</SectionTitle>
        {allBids.length === 0 ? <EmptyState>No bids placed yet</EmptyState> : (
          <table className={styles.table}>
            <thead><tr><th>Bidder</th><th>Church ID</th><th>Item</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              {allBids.map((b, i) => (
                <tr key={i}>
                  <td>{b.user}</td>
                  <td className={styles.muted}>{b.churchId}</td>
                  <td className={styles.muted} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.itemName}</td>
                  <td><strong style={{ color: 'var(--green)' }}>${b.amount}</strong></td>
                  <td className={styles.muted}>{b.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ═══════ ITEMS TAB ═══════ */
function ItemsTab() {
  const { items, goLive, closeItem, addItem, updateItem, addToast } = useAuction();
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState({ name: '', desc: '', startPrice: '', increments: [5, 10, 20] });
  const [newInc, setNewInc] = useState('');

  const openNew = () => {
    setForm({ name: '', desc: '', startPrice: '', increments: [5, 10, 20] });
    setEditing('new');
  };
  const openEdit = item => {
    setForm({ name: item.name, desc: item.desc, startPrice: item.startPrice, increments: [...item.increments] });
    setEditing(item);
  };
  const removeInc = v => setForm(f => ({ ...f, increments: f.increments.filter(x => x !== v) }));
  const addInc = () => {
    const v = parseInt(newInc);
    if (!v || v < 1 || form.increments.includes(v)) return;
    setForm(f => ({ ...f, increments: [...f.increments, v].sort((a,b)=>a-b) }));
    setNewInc('');
  };
  const save = () => {
    if (!form.name.trim() || !form.startPrice || form.increments.length === 0) {
      addToast('Fill in all fields and add at least one increment', 'error'); return;
    }
    if (editing === 'new') {
      addItem({ name: form.name, desc: form.desc, startPrice: parseInt(form.startPrice), increments: form.increments });
    } else {
      updateItem(editing.id, { name: form.name, desc: form.desc, startPrice: parseInt(form.startPrice), increments: form.increments });
      addToast('Item updated!', 'success');
    }
    setEditing(null);
  };

  return (
    <div>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Auction Items" sub="Manage items, prices, and bid increments" />
        <Btn variant="primary" onClick={openNew}>+ Add Item</Btn>
      </div>

      <div className={styles.itemList}>
        {items.map(item => (
          <div key={item.id} className={`${styles.itemRow} ${item.status === 'live' ? styles.itemLive : ''}`}>
            <div className={styles.itemInfo}>
              <div className={styles.itemTitle}>{item.name}</div>
              <div className={styles.itemMeta}>
                Start: ${item.startPrice} &nbsp;·&nbsp; Current: ${item.currentBid || item.startPrice} &nbsp;·&nbsp; Increments: {item.increments.map(i => '$'+i).join(', ')} &nbsp;·&nbsp; {item.bids.length} bids
              </div>
            </div>
            <div className={styles.itemActions}>
              <StatusPill status={item.status} />
              {item.status === 'pending' && <button className={`${styles.actionBtn} ${styles.goLive}`} onClick={() => goLive(item.id)}>Go Live</button>}
              {item.status === 'live'    && <button className={`${styles.actionBtn} ${styles.closeBtn}`} onClick={() => closeItem(item.id)}>Close Item</button>}
              {item.status !== 'sold'    && <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(item)}>Edit</button>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Card style={{ border: '2px solid var(--gold-light)', marginTop: '1rem' }}>
          <SectionTitle>{editing === 'new' ? 'Add New Item' : `Edit: ${editing.name}`}</SectionTitle>
          <div className={styles.formGrid}>
            <FormGroup label="Item Name">
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Apple Pie Basket" />
            </FormGroup>
            <FormGroup label="Starting Price ($)">
              <Input type="number" value={form.startPrice} onChange={e => setForm(f => ({...f, startPrice: e.target.value}))} placeholder="40" min="1" />
            </FormGroup>
          </div>
          <FormGroup label="Description">
            <Textarea value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} placeholder="Brief description…" />
          </FormGroup>
          <FormGroup label="Bid Increments">
            <div className={styles.incTags}>
              {form.increments.map(v => (
                <span key={v} className={styles.incTag}>${v}<button onClick={() => removeInc(v)} className={styles.removeInc}>×</button></span>
              ))}
            </div>
            <div className={styles.addInc}>
              <Input type="number" value={newInc} onChange={e => setNewInc(e.target.value)} placeholder="e.g. 25" style={{ width: 110 }} onKeyDown={e => e.key === 'Enter' && addInc()} />
              <Btn variant="secondary" onClick={addInc}>+ Add</Btn>
            </div>
          </FormGroup>
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.25rem' }}>
            <Btn variant="primary" onClick={save}>{editing === 'new' ? 'Add Item' : 'Save Changes'}</Btn>
            <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════ LIVE TAB ═══════ */
function LiveTab() {
  const { items, liveItem, updateItem, closeItem, addToast } = useAuction();
  const item = liveItem;
  const [newInc, setNewInc] = useState('');
  const [localIncs, setLocalIncs] = useState(item?.increments || []);
  const [localStart, setLocalStart] = useState(item?.startPrice || '');

  const removeInc = v => setLocalIncs(p => p.filter(x => x !== v));
  const addInc = () => {
    const v = parseInt(newInc);
    if (!v || v < 1) return;
    setLocalIncs(p => [...p, v].sort((a,b)=>a-b));
    setNewInc('');
  };
  const applyChanges = () => {
    if (!item) return;
    const updates = { increments: localIncs };
    if (!item.bids.length) updates.startPrice = parseInt(localStart) || item.startPrice;
    updateItem(item.id, updates);
    addToast('Live item updated — bidders see new increments instantly', 'success');
  };

  const allBids = items.flatMap(i => i.bids.map(b => ({ ...b, itemName: i.name }))).slice(0, 15);

  return (
    <div>
      <PageHeader title="Live Controls" sub="Control the active auction in real time" />
      {item ? (
        <Card style={{ border: '2px solid var(--green)', marginBottom: '1rem' }}>
          <div className={styles.liveTitleRow}>
            <span className={styles.liveDot} />
            <h3 className={styles.liveTitle}>Live: {item.name}</h3>
          </div>
          <div className={styles.liveStats}>
            <LiveStat label="Current Bid" value={`$${item.currentBid || item.startPrice}`} />
            <LiveStat label="Total Bids"  value={item.bids.length} />
            <LiveStat label="Top Bidder"  value={item.topBidder || '—'} />
            <LiveStat label="Church ID"   value={item.bids[0]?.churchId || '—'} />
          </div>
          <div className={styles.formGrid} style={{ marginTop: '1.25rem' }}>
            <FormGroup label={`Starting Price ${item.bids.length ? '(locked — bids placed)' : '($)'}`}>
              <Input type="number" value={localStart} disabled={!!item.bids.length}
                onChange={e => setLocalStart(e.target.value)} placeholder="40" />
            </FormGroup>
          </div>
          <FormGroup label="Bid Increments (live — changes reflected immediately for all bidders)">
            <div className={styles.incTags}>
              {localIncs.map(v => (
                <span key={v} className={styles.incTag}>${v}<button onClick={() => removeInc(v)} className={styles.removeInc}>×</button></span>
              ))}
            </div>
            <div className={styles.addInc}>
              <Input type="number" value={newInc} onChange={e => setNewInc(e.target.value)} placeholder="e.g. 50" style={{ width: 110 }} onKeyDown={e => e.key === 'Enter' && addInc()} />
              <Btn variant="secondary" onClick={addInc}>+ Add</Btn>
            </div>
          </FormGroup>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
            <Btn variant="primary" onClick={applyChanges}>💾 Apply Changes</Btn>
            <Btn variant="danger" onClick={() => closeItem(item.id)}>🔨 Close & Announce Winner</Btn>
          </div>
        </Card>
      ) : (
        <Card><EmptyState>No item is currently live. Go to Auction Items to set one live.</EmptyState></Card>
      )}

      <Card>
        <SectionTitle>⚡ Live Bid Feed</SectionTitle>
        {allBids.length === 0 ? <EmptyState>No bids yet tonight</EmptyState> : (
          <table className={styles.table}>
            <thead><tr><th>Bidder</th><th>Church ID</th><th>Item</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              {allBids.map((b, i) => (
                <tr key={i}>
                  <td>{b.user}</td>
                  <td className={styles.muted}>{b.churchId}</td>
                  <td className={styles.muted}>{b.itemName}</td>
                  <td><strong style={{ color: 'var(--green)' }}>${b.amount}</strong></td>
                  <td className={styles.muted}>{b.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ═══════ WINNERS TAB ═══════ */
function WinnersTab() {
  const { items, markPaid } = useAuction();
  const sold = items.filter(i => i.status === 'sold');
  const totalCollected = sold.filter(i => i.payStatus === 'paid').reduce((s, i) => s + i.currentBid, 0);
  const totalPending   = sold.filter(i => i.payStatus !== 'paid').reduce((s, i) => s + i.currentBid, 0);

  return (
    <div>
      <PageHeader title="Winners & Payments" sub="Track winners and payment status for sold items" />
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.25rem' }}>
        <StatCard label="Items Sold"    value={sold.length}        color="green" />
        <StatCard label="Collected"     value={`$${totalCollected}`} color="gold" />
        <StatCard label="Pending"       value={`$${totalPending}`} color="gray" />
      </div>
      <Card>
        <SectionTitle>Winner Records</SectionTitle>
        {sold.length === 0 ? <EmptyState>No items sold yet</EmptyState> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Item</th><th>Winner</th><th>Church ID</th><th>Amount</th><th>Payment</th><th>Action</th></tr>
            </thead>
            <tbody>
              {sold.map(item => {
                const topBid = item.bids[0];
                const payLabel = { paid: '✅ Paid (Card)', zelle: '📱 Zelle Pending', check: '📝 Check Pending', cash: '💵 Cash Pending' };
                const payClass = { paid: styles.payPaid, zelle: styles.payZelle, check: styles.payCheck, cash: styles.payCash };
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.winner || '—'}</td>
                    <td className={styles.muted}>{topBid?.churchId || '—'}</td>
                    <td><strong style={{ color: 'var(--green)' }}>${item.currentBid}</strong></td>
                    <td><span className={`${styles.payBadge} ${payClass[item.payStatus] || styles.payAwaiting}`}>{payLabel[item.payStatus] || '⏳ Awaiting'}</span></td>
                    <td>
                      {item.payStatus !== 'paid' && (
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => markPaid(item.id, 'paid')}>Mark Paid</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ═══════ SETTINGS TAB ═══════ */
function SettingsTab() {
  const { addToast } = useAuction();
  return (
    <div>
      <PageHeader title="Settings" sub="Configure integrations, church details, and payment info" />
      <div className={styles.settingsGrid}>
        <Card>
          <SectionTitle>🏛️ Church Information</SectionTitle>
          <FormGroup label="Church Name"><Input defaultValue="Trinity Marthoma Church" /></FormGroup>
          <FormGroup label="Zelle Email / Phone"><Input defaultValue="harvest@gracecommunitychurch.org" /></FormGroup>
          <FormGroup label="Mailing Address"><Input defaultValue="123 Faith St, Houston TX 77001" /></FormGroup>
          <FormGroup label="Check Payable To"><Input defaultValue="Trinity Marthoma Church" /></FormGroup>
        </Card>

        <Card>
          <SectionTitle>💳 Stripe Payments</SectionTitle>
          <FormGroup label="Publishable Key (frontend safe)"><Input placeholder="pk_live_..." /></FormGroup>
          <FormGroup label="Secret Key (server-side only)"><Input type="password" placeholder="sk_live_…" /></FormGroup>
          <div className={styles.settingsNote}>⚠️ Never put your secret key in frontend code. Use Firebase Functions, a Node server, or Netlify Functions to process charges server-side.</div>
        </Card>

        <Card>
          <SectionTitle>📹 Video (Agora SDK)</SectionTitle>
          <FormGroup label="Agora App ID"><Input placeholder="Enter your Agora App ID" /></FormGroup>
          <FormGroup label="Channel Name"><Input defaultValue="harvest-auction-2024" /></FormGroup>
          <FormGroup label="Token (for production)"><Input placeholder="Leave blank for testing" /></FormGroup>
          <div className={styles.settingsNote}>Alternatively, use Daily.co: swap the feed placeholder in AuctionView with <code>{'<DailyIframe />'}</code> from <code>@daily-co/daily-js</code>.</div>
        </Card>

        <Card>
          <SectionTitle>🔐 Firebase Auth</SectionTitle>
          <FormGroup label="Firebase Project ID"><Input placeholder="grace-harvest-auction" /></FormGroup>
          <FormGroup label="API Key"><Input type="password" placeholder="AIza…" /></FormGroup>
          <FormGroup label="Auth Domain"><Input placeholder="grace-harvest-auction.firebaseapp.com" /></FormGroup>
          <div className={styles.settingsNote}>Enable Google Sign-In in Firebase Console → Authentication → Sign-in method → Google.</div>
        </Card>

        <Card>
          <SectionTitle>🗄️ Firestore Database</SectionTitle>
          <FormGroup label="Database URL"><Input placeholder="https://grace-harvest-auction.firebaseio.com" /></FormGroup>
          <div className={styles.settingsNote}>Real-time bids require Firestore. Replace the React state in AuctionContext with Firestore listeners (<code>onSnapshot</code>) for live multi-user sync.</div>
        </Card>

        <Card>
          <SectionTitle>🌐 Hosting</SectionTitle>
          <div className={styles.settingsNote} style={{ marginBottom: '.75rem' }}>
            Recommended: <strong>Firebase Hosting</strong> — run <code>npm run build</code> then <code>firebase deploy</code>.<br/>
            Alternative: <strong>Netlify</strong> — drag your <code>dist/</code> folder to netlify.com.
          </div>
          <FormGroup label="Custom Domain (optional)"><Input placeholder="auction.gracecommunitychurch.org" /></FormGroup>
        </Card>
      </div>
      <Btn variant="primary" onClick={() => addToast('Settings saved (demo)', 'success')} style={{ marginTop: '1rem' }}>Save All Settings</Btn>
    </div>
  );
}

/* ═══════ HELPERS ═══════ */
function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.55rem', color: 'var(--brown)' }}>{title}</h2>
      <p style={{ color: 'var(--brown3)', fontSize: '.87rem', marginTop: '.2rem' }}>{sub}</p>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = { gold: 'var(--gold-dark)', green: 'var(--green)', brown: 'var(--brown2)', gray: 'var(--brown3)' };
  return (
    <div className={styles.statCard}>
      <div className={styles.statVal} style={{ color: colors[color] || 'var(--brown)' }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function LiveStat({ label, value }) {
  return (
    <div className={styles.liveStat}>
      <div className={styles.liveStatVal}>{value}</div>
      <div className={styles.liveStatLabel}>{label}</div>
    </div>
  );
}
