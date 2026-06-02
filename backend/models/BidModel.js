export class BidModel {
    static tableName = 'bids';
    static primaryKey = 'bid_id';

    static schema = {
        bid_id: { type: 'int8', primary: true, identity: true },
        user_id: { type: 'int8', nullable: false },
        amount: { type: 'numeric', nullable: false },
        item_id: { type: 'int8', nullable: false },
        created_at: { type: 'timestamptz', nullable: true },
        payment_id: { type: 'text', nullable: true }
    };

    constructor({
        bid_id = null,
        user_id = null,
        amount = null,
        item_id = null,
        created_at = null,
        payment_id = null
    } = {}) {
        this.bid_id = bid_id;
        this.user_id = user_id;
        this.amount = amount;
        this.item_id = item_id;
        this.created_at = created_at;
        this.payment_id = payment_id;
    }

    static fromRow(row = {}) {
        return new BidModel(row);
    }

    toRow() {
        return {
            ...(this.bid_id !== null ? { bid_id: this.bid_id } : {}),
            user_id: this.user_id,
            amount: this.amount,
            item_id: this.item_id,
            ...(this.created_at !== null ? { created_at: this.created_at } : {}),
            ...(this.payment_id !== null ? { payment_id: this.payment_id } : {})
        };
    }
}