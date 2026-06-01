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
app.post('/items', async (req, res) => {
    const { data, error } = await supabase
        .from('items_duplicate')
        .insert(req.body);

    res.json({ data, error })

});


//users
app.get('/items', async (req, res) => {
    const { data, error } = await supabase
        .from('items_duplicate')
        .select()

    res.json({ data, error })

});

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
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});