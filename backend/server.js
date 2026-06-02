import express from 'express'
import { supabase } from './supabase.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { DataHandler } from './socket/dataHandler.js';
import { BidModel, ItemModel, UserModel } from './models/index.js';


const app = express();
const port = 3000;
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const dataHandler = new DataHandler(io, supabase);

app.use(express.json())

// items
app.post('/items', async (req, res) => {
    const { data, error } = await supabase
        .from(ItemModel.tableName)
        .insert(req.body);

    res.json({ data, error })

});

app.get('/items', async (req, res) => {
    const { data, error } = await supabase
        .from(ItemModel.tableName)
        .select()

    res.json({ data, error })

});

//bids
app.post('/bids', async (req, res) => {
    const { data, error } = await supabase
        .from(BidModel.tableName)
        .insert(req.body);

    res.json({ data, error })

});



app.get('/bids', async (req, res) => {
    const { data, error } = await supabase
        .from(BidModel.tableName)
        .select()

    res.json({ data, error })

});

//users
app.post('/users', async (req, res) => {
    const { data, error } = await supabase
        .from(UserModel.tableName)
        .insert(req.body);

    res.json({ data, error })

});

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from(UserModel.tableName)
        .select()

    res.json({ data, error })

});

dataHandler.register();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});