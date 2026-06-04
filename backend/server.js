import dotenv from "dotenv";
dotenv.config();
import express from 'express'
import cors from 'cors'
import { supabase } from './supabase.js';
import { createServer } from 'http';
import { BidModel, ItemModel, UserModel } from './models/index.js';
import userController from './controllers/userController.js';
import { verifyJwt } from './middlewares/verifyJwt.js';
import cookieParser from 'cookie-parser';
import streamRoutes from "./routes/streamRoutes.js"
// import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
// Allow CORS from the frontend dev server and allow credentials for cookies
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
// enable parsing cookies (for reading refresh token later if needed)
app.use(cookieParser());

// Debug endpoint: returns cookies the server sees (useful to confirm refreshToken cookie)
app.get('/debug/cookies', (req, res) => {
    res.json({ cookies: req.cookies || {} });
});
app.use("/api/stream", streamRoutes);


console.log(process.env.AWS_REGION);

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

// Note: `authenticateToken` middleware not implemented yet. Call controller directly.
app.post('/auth/google', userController.authenticateUser.bind(userController));
app.post('/auth/complete-onboarding', verifyJwt, userController.completeOnboarding.bind(userController));
app.post('/auth/refresh', userController.refreshToken.bind(userController));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});