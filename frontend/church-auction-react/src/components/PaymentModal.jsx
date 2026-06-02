import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Btn } from './UI';
import styles from './PaymentModal.module.css';

const METHODS = [
  { id: 'stripe', icon: '💳', name: 'Card / Stripe', sub: 'Pay instantly now' },
  { id: 'zelle',  icon: '📱', name: 'Zelle',          sub: 'Send via Zelle app' },
  { id: 'check',  icon: '📝', name: 'Check',          sub: 'Mail or hand-deliver' },
  { id: 'cash',   icon: '💵', name: 'Cash',           sub: 'Pay at the table' },
];

export default function PaymentModal() {
  const { pendingWinItem, confirmPayment } = useAuction();
  const [method, setMethod] = useState('stripe');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!pendingWinItem) return null;

  const amount = pendingWinItem.currentBid;

  const handleConfirm = async () => {
    if (method !== 'stripe' && !agreed) return;
    if (method === 'stripe') {
      setProcessing(true);
      await new Promise(r => setTimeout(r, 1400)); // Simulate Stripe charge
      setProcessing(false);
    }
    confirmPayment(method);
  };

  const formatCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExp  = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d; };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.winBadge}>🏆 You Won!</div>
        <h2 className={styles.title}>{pendingWinItem.name}</h2>
        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>Final bid</span>
          <span className={styles.amount}>${amount}</span>
        </div>
        <p className={styles.subtitle}>Complete your payment to return to the auction.</p>

        <div className={styles.methods}>
          {METHODS.map(m => (
            <button
              key={m.id}
              className={`${styles.method} ${method === m.id ? styles.selected : ''}`}
              onClick={() => { setMethod(m.id); setAgreed(false); }}
            >
              <span className={styles.mIcon}>{m.icon}</span>
              <span className={styles.mName}>{m.name}</span>
              <span className={styles.mSub}>{m.sub}</span>
            </button>
          ))}
        </div>

        {method === 'stripe' && (
          <div className={styles.stripeSection}>
            <p className={styles.fieldLabel}>Card number</p>
            <input className={styles.cardInput} placeholder="1234 5678 9012 3456" value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} maxLength={19} inputMode="numeric" />
            <div className={styles.cardRow}>
              <div>
                <p className={styles.fieldLabel}>Expiry</p>
                <input className={styles.cardInput} placeholder="MM/YY" value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))} maxLength={5} inputMode="numeric" />
              </div>
              <div>
                <p className={styles.fieldLabel}>CVV</p>
                <input className={styles.cardInput} placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4} inputMode="numeric" />
              </div>
            </div>
            <div className={styles.stripeNote}>🔒 Secured by Stripe — your card info is never stored</div>
          </div>
        )}

        {method === 'zelle' && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}><span>Send to:</span><strong>harvest@gracecommunitychurch.org</strong></div>
            <div className={styles.infoRow}><span>Amount:</span><strong>${amount}</strong></div>
            <div className={styles.infoRow}><span>Memo:</span><strong>Your name + Church ID</strong></div>
            <div className={styles.infoRow}><span>Deadline:</span><strong>Within 24 hours</strong></div>
            <label className={styles.agree}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I will send the Zelle payment within 24 hours</label>
          </div>
        )}

        {method === 'check' && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}><span>Payable to:</span><strong>Grace Community Church</strong></div>
            <div className={styles.infoRow}><span>Amount:</span><strong>${amount}</strong></div>
            <div className={styles.infoRow}><span>Mail to:</span><strong>123 Faith St, Houston TX 77001</strong></div>
            <div className={styles.infoRow}><span>Deadline:</span><strong>3 business days</strong></div>
            <label className={styles.agree}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I will mail or hand-deliver the check within 3 days</label>
          </div>
        )}

        {method === 'cash' && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}><span>Amount due:</span><strong>${amount}</strong></div>
            <div className={styles.infoRow}><span>Where:</span><strong>Registration table tonight</strong></div>
            <label className={styles.agree}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I will pay cash at the registration table</label>
          </div>
        )}

        <Btn
          variant="green"
          full
          onClick={handleConfirm}
          disabled={(method !== 'stripe' && !agreed) || processing}
          style={{ marginTop: '1.1rem', padding: '.85rem', fontSize: '1rem' }}
        >
          {processing ? '⏳ Processing…' : `Confirm Payment — $${amount}`}
        </Btn>
        <p className={styles.lockNote}>You must complete payment before returning to bid on other items</p>
      </div>
    </div>
  );
}
