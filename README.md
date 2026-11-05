# Trinity Auction

A live auction platform built for a church, to replace placing bids in a Zoom chat. The host streams video while members watch and bid on items in the same app. Built with a team.

## Status

Working prototype. It was built for production use at a church but was never shipped, because we ran out of time. See "Not finished" below for exactly what is and is not done.

## Stack

* Frontend: React (Vite), Amazon IVS web broadcast SDK
* Backend: Node.js, Express
* Database: PostgreSQL through Supabase
* Video: AWS IVS Real-Time Streaming
* Auth: Google sign in, JWT access tokens, refresh tokens stored hashed in the database

## Architecture

1. A user signs in with Google. The backend verifies the Google ID token, creates the user if needed, and returns a short lived access token (15 minutes) and a refresh token (7 days). Refresh tokens are stored as hashes so they can be rotated and revoked.
2. To watch or broadcast, the frontend calls `POST /api/stream/token` with the access token. The backend uses the AWS SDK to create an IVS participant token. Only user ids listed in `HOST_USER_IDS` get publish permission. Everyone else gets subscribe only.
3. To bid, the frontend calls `POST /bids`. The backend takes the user id from the verified token and calls the `place_bid` Postgres function (`backend/sql/place_bid.sql`). The function locks the item row, checks that the item is live and the amount beats the current high bid, then inserts the bid, all in one transaction. Two bids arriving at the same time are handled one after another, so only one can win.

## Data model

* `users_duplicate`: name, email, Google id, church id, phone number
* `items_duplicate`: title, starting price, status, ended price, winner, bid type
* `bids_duplicate`: item, user, amount, created time
* refresh tokens: hashed token, user, expiry

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and fill in the values.
2. Run `backend/sql/place_bid.sql` once in the Supabase SQL editor.
3. In `backend`, run `npm install` then `npm start`.
4. In `frontend/church-auction-react`, add a `.env` with `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`, then run `npm install` and `npm run dev`.

## Not finished

* The auction screens still keep bids in local React state. Connecting the bid button to `POST /bids` and showing other users' bids live (polling or Supabase Realtime) is not done.
* Payments are a simulated screen. There is no real payment processing.
* Group auctions and the admin controller are stubs.
* No automated tests. A teammate ran a load script against an earlier version, and it showed latency growing as simulated users increased.
