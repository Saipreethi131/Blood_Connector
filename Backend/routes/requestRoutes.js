import express from 'express';
import { getAllRequests, getRequestById } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllRequests);
router.get('/:id', getRequestById);

export default router;
