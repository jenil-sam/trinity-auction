import { OAuth2Client } from "google-auth-library";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, RefreshTokenModel } from "../models/index.js";
import { supabase } from "../supabase.js";

const client = new OAuth2Client(process.env.CLIENT_ID);

class UserController {
  async authenticateUser(req, res) {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: "Missing Google credential" });
      }

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub, email, name } = payload || {};

      let user = await this.checkUserExists({ googleSub: sub });

      // CREATE USER IF NOT EXISTS
      if (!user) {
        const { data, error } = await supabase
            .from(UserModel.tableName)
            .insert({ name, email, google_client_id: sub, username: email.split("@")[0] })
            .select()
            .single();

        if (error) throw error;
        user = data;
        console.log(`New user created: ${email} (user_id: ${user.user_id})`);
      }

      // determine onboarding state
      const isComplete = !!(user.church_id && user.phone_number);

      const dataCompleteness = isComplete ? "complete" : "incomplete";

      const userId = user.user_id ?? user.id;

      const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

      // persist refresh token hash in DB for rotation/revocation
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const { data: rtData, error: rtError } = await supabase
        .from(RefreshTokenModel.tableName)
        .insert({ user_id: userId, token_hash: tokenHash, expires_at: refreshExpiresAt, revoked: false })
        .select()
        .single();
      if (rtError) {
        console.error('Failed to store refresh token:', rtError);
        // continue — cookie will be set but token won't be tracked server-side
      }

      // Set refresh token as HttpOnly cookie (not accessible to JS)
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      res.cookie('refreshToken', refreshToken, cookieOptions);

      console.log(`User authenticated: ${email} (user_id: ${userId}, onboarding: ${dataCompleteness})`);

      return res.status(200).json({
        success: true,
        email,
        name,
        username: user.username,
        accessToken,
        dataCompleteness,
      });
    } catch (error) {
      console.error("authenticateUser error:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  async refreshToken(req, res) {
    try {
      console.log('refreshToken called, cookies:', req.cookies);
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ error: 'Missing refresh token' });

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const { data, error } = await supabase
        .from(RefreshTokenModel.tableName)
        .select('*')
        .eq('token_hash', tokenHash)
        .single();

      if (error?.code === 'PGRST116' || !data) return res.status(401).json({ error: 'Refresh token not found' });
      if (error) throw error;

      if (data.revoked) return res.status(401).json({ error: 'Refresh token revoked' });
      if (new Date(data.expires_at) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

      const userId = data.user_id;

      // issue new access token
      const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

      // In development, skip rotation to avoid StrictMode double-invocation issues
      if (process.env.NODE_ENV !== 'production') {
        const cookieOptions = {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        };
        res.cookie('refreshToken', token, cookieOptions); // reuse same token
        
        let user = null;
        const { data: udata, error: uerr } = await supabase
          .from(UserModel.tableName).select('*').eq('user_id', userId).single();
        if (!uerr) user = udata;
        
        return res.status(200).json({ accessToken, user });
      }

      // PRODUCTION ONLY: rotate refresh token
      const newRefreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: createErr } = await supabase
        .from(RefreshTokenModel.tableName)
        .insert({ user_id: userId, token_hash: newHash, expires_at: newExpiresAt, revoked: false })
        .select().single();
      if (createErr) throw createErr;

      const { error: revokeErr } = await supabase
        .from(RefreshTokenModel.tableName)
        .update({ revoked: true })
        .eq('token_hash', tokenHash);
      if (revokeErr) console.error('Failed to revoke old refresh token:', revokeErr);

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };
      res.cookie('refreshToken', newRefreshToken, cookieOptions);
      console.log('set new refresh cookie for user:', userId);

      let user = null;
      const { data: udata, error: uerr } = await supabase
        .from(UserModel.tableName).select('*').eq('user_id', userId).single();
      if (!uerr) user = udata;

      return res.status(200).json({ accessToken, user });
    } catch (error) {
      console.error('refreshToken error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // this function is to handle the second step of the onboarding process where the user submits their church ID and phone number, it will update the user data with the church ID and phone number and return a success response, it will also check if the user exists before updating the data
  async completeOnboarding(req, res) {
    try {
      const { churchId, phoneNumber } = req.body;

      if (!churchId || !phoneNumber) {
        return res.status(400).json({
          error: "Missing churchId or phoneNumber",
        });
      }

      // 👇 NEVER trust frontend user_id
      const userId = req.user.userId;

      // update user with church ID and phone number
      const { data, error } = await supabase
        .from(UserModel.tableName)
        .update({
          church_id: churchId,
          phone_number: phoneNumber,
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      console.log("User onboarding completed for user_id:", userId);
      return res.status(200).json({
        success: true,
        user: data,
      });
    } catch (error) {
      console.error("completeOnboarding error:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // checks if a user exists with the given google sub (unique identifier for google auth) and returns the user data if it exists, otherwise returns false
  async checkUserExists({ googleSub }) {
    const { data, error } = await supabase
      .from(UserModel.tableName)
      .select("*")
      .eq("google_client_id", googleSub)
      .single();

    if (error?.code === "PGRST116") return false;
    if (error) throw error;

    return data;
  }
}

export default new UserController();
