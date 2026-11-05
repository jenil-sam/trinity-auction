# Bid load test

A script that simulates many users bidding on one item at the same time, then checks the database for correctness.

This script was written after the original team load test was lost, so it is a new script and not the one that produced earlier results. No results from it are recorded here. Run it yourself and use your own numbers.

## What it measures

* Latency of `POST /bids` (p50, p95, max)
* How many bids were accepted (201), rejected (409), or failed
* Correctness: the highest bid in the database matches the highest bid the server accepted, and the number of new bid rows matches the number accepted. This is what the row lock in `place_bid` protects.

## Run it

Use a local or test server only. It inserts real rows for the item you pick.

1. Start the backend and make sure `place_bid.sql` has been run in Supabase.
2. Create a test item with status `live`, and note its `item_id`.
3. Make sure the simulated users exist. By default it uses user ids 1 to USERS. Or pass real ids with `USER_IDS=1,2,3`.
4. From the `backend` folder:

```
JWT_SECRET=your_secret ITEM_ID=1 USERS=150 BIDS_PER_USER=3 node load-test/bid-load-test.js
```

Optional settings: `BASE_URL`, `START_AMOUNT` (the item's starting price), `USER_IDS`.

Each simulated user bids a little above the highest accepted bid it has seen. Many users act on the same stale price at once, so some bids collide and are rejected. That is expected, and it is the situation the row lock exists for. The test passes when the database state matches what the server accepted and there were no errors.
