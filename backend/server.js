import express from 'express'
import { supabase } from './supabase.js';

const app = express();
const port = 3000;

app.use(express.json())

// items
app.post('/items', async (req, res) => {
    const { data, error } = await supabase
        .from('items_duplicate')
        .insert(req.body);

    res.json({ data, error })

});

app.get('/items', async (req, res) => {
    const { data, error } = await supabase
        .from('items_duplicate')
        .select()

    res.json({ data, error })

});

//bids
app.post('/bids', async (req, res) => {
    const { data, error } = await supabase
        .from('bids_duplicate')
        .insert(req.body);

    res.json({ data, error })

});



app.get('/bids', async (req, res) => {
    const { data, error } = await supabase
        .from('bids_duplicate')
        .select()

    res.json({ data, error })

});

//users
app.post('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users_duplicate')
        .insert(req.body);

    res.json({ data, error })

});

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users_duplicate')
        .select()

    res.json({ data, error })

});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});