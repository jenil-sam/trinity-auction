import express from 'express'
import { supabase } from './supabase';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(supabase.)
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});