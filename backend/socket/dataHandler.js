import { BidModel } from '../models/BidModel.js';

export class DataHandler  {
    constructor(io, supabase) {
        this.io = io;
        this.supabase = supabase;
    }

    register() {
        this.io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);

            socket.on('place_bid', async (payload) => {
                await this.handlePlaceBid(socket, payload);
            });

            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    async handlePlaceBid(socket, bid) {
        const bidModel = BidModel.fromRow(bid);

        const { data, error } = await this.supabase
            .from(BidModel.tableName)
            .insert(bidModel.toRow())
            .select()
            .single();

        if (error) {
            socket.emit('bid_error', error);
            return;
        }

        this.io.emit('bid_placed', data);
    }

 
    handleDisconnect(socket) {
        console.log(`Socket disconnected: ${socket.id}`);
    }
}