// Load test for POST /bids.
//
// Simulates many users bidding on one item at the same time, then checks the
// database for correctness: the highest bid saved must equal the highest bid
// the server accepted, and the number of saved bids must equal the number accepted.
//
// Run it against a LOCAL or TEST server only. It inserts real rows into the
// bids table for the item you point it at.
//
// Usage (from the backend folder):
//   JWT_SECRET=... ITEM_ID=1 USERS=150 BIDS_PER_USER=3 node load-test/bid-load-test.js
//
// Settings (environment variables):
//   BASE_URL       default http://localhost:3000
//   JWT_SECRET     same secret the backend uses to verify tokens (required)
//   ITEM_ID        id of a LIVE test item (required)
//   USERS          number of simulated users, default 150
//   BIDS_PER_USER  bids each user places, default 3
//   USER_IDS       optional comma separated list of real user ids to use.
//                  If not set, user ids 1..USERS are used, so those users
//                  must exist in the users table.
//   START_AMOUNT   the item's starting price, default 1

import jwt from 'jsonwebtoken';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;
const ITEM_ID = Number(process.env.ITEM_ID);
const USERS = Number(process.env.USERS || 150);
const BIDS_PER_USER = Number(process.env.BIDS_PER_USER || 3);
const START_AMOUNT = Number(process.env.START_AMOUNT || 1);

if (!JWT_SECRET || !Number.isFinite(ITEM_ID)) {
    console.error('JWT_SECRET and ITEM_ID are required.');
    process.exit(1);
}

function buildUserIds() {
    const ids = [];
    if (process.env.USER_IDS) {
        const parts = process.env.USER_IDS.split(',');
        for (let i = 0; i < parts.length; i++) {
            const id = Number(parts[i].trim());
            if (Number.isFinite(id)) {
                ids.push(id);
            }
        }
        return ids;
    }
    for (let i = 1; i <= USERS; i++) {
        ids.push(i);
    }
    return ids;
}

// Highest amount any simulated user has seen accepted so far.
// Each user bids a little above it, like a real bidder who just saw the
// latest price. Many users act on a stale value at the same moment, so
// some bids collide, which is exactly what the row lock must handle.
let knownHigh = START_AMOUNT - 1;

function nextAmount() {
    return knownHigh + 1 + Math.floor(Math.random() * 5);
}

function percentile(sorted, p) {
    if (sorted.length === 0) {
        return 0;
    }
    let index = Math.ceil((p / 100) * sorted.length) - 1;
    if (index < 0) {
        index = 0;
    }
    return sorted[index];
}

const results = {
    accepted: 0,
    rejected: 0,
    errors: 0,
    latencies: [],
    acceptedAmounts: [],
};

async function placeOneBid(token, amount) {
    const startedAt = performance.now();
    try {
        const response = await fetch(`${BASE_URL}/bids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ item_id: ITEM_ID, amount }),
        });
        results.latencies.push(performance.now() - startedAt);

        if (response.status === 201) {
            results.accepted++;
            results.acceptedAmounts.push(amount);
            if (amount > knownHigh) {
                knownHigh = amount;
            }
        } else if (response.status === 409) {
            results.rejected++;
        } else {
            results.errors++;
        }
    } catch (err) {
        results.latencies.push(performance.now() - startedAt);
        results.errors++;
    }
}

async function simulateUser(userId) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '10m' });
    for (let i = 0; i < BIDS_PER_USER; i++) {
        // short random pause so users are not perfectly synchronized
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 300));
        await placeOneBid(token, nextAmount());
    }
}

async function checkDatabase() {
    const response = await fetch(`${BASE_URL}/bids`);
    const body = await response.json();
    const rows = body.data || [];

    let savedCount = 0;
    let savedHighest = 0;
    for (let i = 0; i < rows.length; i++) {
        if (Number(rows[i].item_id) === ITEM_ID) {
            savedCount++;
            const amount = Number(rows[i].amount);
            if (amount > savedHighest) {
                savedHighest = amount;
            }
        }
    }
    return { savedCount, savedHighest };
}

async function main() {
    const userIds = buildUserIds();

    // count bids already on this item so reruns do not break the check
    const before = await checkDatabase();

    console.log(`Simulating ${userIds.length} users, ${BIDS_PER_USER} bids each, on item ${ITEM_ID}`);
    const startedAt = performance.now();

    const jobs = [];
    for (let i = 0; i < userIds.length; i++) {
        jobs.push(simulateUser(userIds[i]));
    }
    await Promise.all(jobs);

    const totalSeconds = (performance.now() - startedAt) / 1000;
    const sorted = results.latencies.slice().sort((a, b) => a - b);
    const total = results.accepted + results.rejected + results.errors;

    let acceptedHighest = 0;
    for (let i = 0; i < results.acceptedAmounts.length; i++) {
        if (results.acceptedAmounts[i] > acceptedHighest) {
            acceptedHighest = results.acceptedAmounts[i];
        }
    }

    const after = await checkDatabase();
    const newRows = after.savedCount - before.savedCount;

    console.log('');
    console.log(`Requests sent:      ${total}`);
    console.log(`Accepted (201):     ${results.accepted}`);
    console.log(`Rejected (409):     ${results.rejected}  (outbid by a simultaneous bid, or item not live)`);
    console.log(`Errors:             ${results.errors}`);
    console.log(`Total time:         ${totalSeconds.toFixed(2)} s`);
    console.log(`Latency p50:        ${percentile(sorted, 50).toFixed(0)} ms`);
    console.log(`Latency p95:        ${percentile(sorted, 95).toFixed(0)} ms`);
    console.log(`Latency max:        ${percentile(sorted, 100).toFixed(0)} ms`);
    console.log('');
    console.log(`Highest accepted bid:   ${acceptedHighest}`);
    console.log(`Highest bid in database: ${after.savedHighest}`);
    console.log(`New rows in database:    ${newRows} (accepted: ${results.accepted})`);

    const highestOk = after.savedHighest >= acceptedHighest;
    const countOk = newRows === results.accepted;
    console.log('');
    console.log(highestOk && countOk ? 'CHECK PASSED' : 'CHECK FAILED');
    process.exit(highestOk && countOk && results.errors === 0 ? 0 : 1);
}

main();
