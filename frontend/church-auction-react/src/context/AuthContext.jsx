/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Btn, FormGroup, Input } from './UI';
import styles from './AuthOverlays.module.css';
import { GoogleLogin } from "@react-oauth/google";

export function AuthContext() {
    const { setCurrentUser, addToast } = useAuction();
    const [pendingUser, setPendingUser] = useState(null);

    const refreshToken = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include', // include cookies
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }
        
            const data = await response.json();
            return data.accessToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return null;
        }
    }

    const logout = () => {
        // Clear user state and any relevant data
        setCurrentUser(null);
        setPendingUser(null);
        // Optionally, you can also call an API endpoint to invalidate the refresh token on the server
    }

    return { refreshToken, logout };
}   
