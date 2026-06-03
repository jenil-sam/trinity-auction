import express from "express";
import StreamController from "../controllers/streamController.js";

const router = express.Router();

router.post("/token", StreamController.createToken);

export default router;