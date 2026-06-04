/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Btn, FormGroup, Input } from './UI';
import styles from '../styles/components/AuthOverlays.module.css';
import { GoogleLogin } from "@react-oauth/google";

export default function AuthOverlays() {
  const { currentUser, setCurrentUser, setIsAdmin, addToast } = useAuction();
  const [stage, setStage] = useState('signin'); // signin | churchid
  const [churchId, setChurchId] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  if (currentUser) return null;

  const handleGoogle = async (credentialResponse) => {
    // Production: firebase.auth().signInWithPopup(googleProvider)
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
       },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });

    const data = await response.json();
    if (!response.ok) {
      addToast(data.error || 'Google sign-in failed. Please try again.', 'error');
      return;
    }

    if (data.dataCompleteness === 'incomplete') {
      setPendingUser({
        name: data.name,
        email: data.email,
        username: data.username,
        accessToken: data.accessToken
      });
      setStage('complete-onboarding');
    } else {
      setCurrentUser({ name: data.name, email: data.email, avatarInitial: data.name?.[0]?.toUpperCase() || 'G', churchId: data.churchId || data.church_id, username: data.username });
      addToast(`Welcome, ${data.name || 'Guest'}! 🌾`, 'success');
    }
  };

  const completeOnboarding = async () => {
    if (!pendingUser?.accessToken) {
      addToast('Missing authentication token. Please sign in again.', 'error');
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/complete-onboarding`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ churchId, phoneNumber }),
    });

    const data = await response.json();
    if (!response.ok) {
      addToast(data.error || 'Login failed. Please try again.', 'error');
      return;
    }

    const user = { ...pendingUser, churchId, phoneNumber };
    setCurrentUser(user);
    setPendingUser(null);
    addToast(`Welcome, ${user.name || 'Guest'}! 🌾`, 'success');
  }

  const handleAdminLogin = () => {
    setCurrentUser({ name: 'Pastor Mike', email: 'admin@gracecc.org', avatarInitial: 'P', churchId: 'ADM', isAdmin: true });
    setIsAdmin(true);
  };

  return (
    <div className={styles.overlay}>
      {stage === 'signin' && (
        <div className={styles.modal}>
          <div className={styles.icon}>⛪</div>
          <h2 className={styles.title}>Harvest Festival 2026 Auction</h2>
          <p className={styles.subtitle}>Trinity Mar Thoma Church — Sign in to join today's live auction and support our congregation.</p>

          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => addToast('Google sign-in failed. Please try again.', 'error')}
          />

          <div className={styles.divider}><span>or</span></div>
          <Btn variant="ghost" full onClick={handleAdminLogin}> Admin Sign In</Btn>
          <p className={styles.demoNote}>Demo: click "Continue with Google" to sign in as a bidder</p>
        </div>
      )}

      {stage === 'complete-onboarding' && (
        <div className={styles.modal}>
          <div className={styles.icon}>🎟️</div>
          <h2 className={styles.title}>Enter Your Church ID</h2>
          <p className={styles.subtitle}>Enter your Church member ID and phone number to access the auction.</p>
          <FormGroup label="Phone number">
            <Input
              type="tel"
              placeholder="e.g. 041-555-1212"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Church ID (3 digits)">
            <Input
              type="text"
              placeholder="e.g. 042"
              value={churchId}
              maxLength={3}
              inputMode="numeric"
              pattern="\\d{3}"
              onChange={e => { setChurchId(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && completeOnboarding()}
              autoFocus
            />
          </FormGroup>

          {error && <p className={styles.error}>{error}</p>}
          <Btn variant="green" full onClick={completeOnboarding}>Enter Auction →</Btn>
          <button className={styles.backBtn} onClick={() => setStage('signin')}>← Back</button>
        </div>
      )}
    </div>
  );
}