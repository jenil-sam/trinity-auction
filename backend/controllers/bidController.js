import { supabase } from '../supabase.js';

class BidController {
    // normal auction: place one bid on an item.
    // The user id comes from the verified JWT, never from the request body.
    async placeBid(req, res) {
        try {
            const userId = req.user?.userId;
            const itemId = Number(req.body.item_id);
            const amount = Number(req.body.amount);

            if (!userId) {
                return res.status(401).json({ error: 'Not signed in' });
            }
            if (!Number.isFinite(itemId) || !Number.isFinite(amount) || amount <= 0) {
                return res.status(400).json({ error: 'item_id and a positive amount are required' });
            }

            // place_bid runs as one transaction and locks the item row
            const { data, error } = await supabase.rpc('place_bid', {
                p_item_id: itemId,
                p_user_id: userId,
                p_amount: amount,
            });

            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Could not place bid' });
            }
            if (data === false) {
                return res.status(409).json({ error: 'Bid rejected: item is not live or the bid is too low' });
            }

            return res.status(201).json({ ok: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // group auction (not implemented yet)
}

export default new BidController();
