import express from "express";
import StreamController from "../controllers/streamController.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";

const router = express.Router();

router.post("/token", verifyJwt, StreamController.createToken);

export default router;
