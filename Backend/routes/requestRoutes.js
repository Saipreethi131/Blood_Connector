import express from 'express';
import { getAllRequests, getRequestById } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — shareable link (no auth required)
router.get('/:id', getRequestById);

// Protected
router.get('/', protect, getAllRequests);

export default router;
