export class ItemModel {
    static tableName = 'items';
    static primaryKey = 'item_id';
    static schema = {
        item_id: { type: 'int8', primary: true, identity: true },
        title: { type: 'text', nullable: false },
        starting_price: { type: 'numeric', nullable: false },
        status: { type: 'status', nullable: false },
        ended_price: { type: 'float4', nullable: true },
        winner_user_id: { type: 'int8', nullable: true },
        bidType: { type: 'types_of_bid', nullable: true }
    };

    constructor({
        item_id = null,
        title = null,
        starting_price = null,
        status = null,
        ended_price = null,
        winner_user_id = null,
        bidType = null
    } = {}) {
        this.item_id = item_id;
        this.title = title;
        this.starting_price = starting_price;
        this.status = status;
        this.ended_price = ended_price;
        this.winner_user_id = winner_user_id;
        this.bidType = bidType;
    }

    static fromRow(row = {}) {
        return new ItemModel(row);
    }

    toRow() {
        return {
            ...(this.item_id !== null ? { item_id: this.item_id } : {}),
            title: this.title,
            starting_price: this.starting_price,
            status: this.status,
            ...(this.ended_price !== null ? { ended_price: this.ended_price } : {}),
            ...(this.winner_user_id !== null ? { winner_user_id: this.winner_user_id } : {}),
            ...(this.bidType !== null ? { bidType: this.bidType } : {})
        };
    }
}