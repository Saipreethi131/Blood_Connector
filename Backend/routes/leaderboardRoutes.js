import express from 'express';
import { getLeaderboard } from '../controllers/donorController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getLeaderboard);

export default router;
