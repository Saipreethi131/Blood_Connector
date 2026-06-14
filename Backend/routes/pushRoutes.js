import express from 'express';
import { getVapidKey, subscribe, unsubscribe } from '../controllers/pushController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/vapid-key', getVapidKey);
router.post('/subscribe',   protect, authorize('donor'), subscribe);
router.delete('/subscribe', protect, authorize('donor'), unsubscribe);

export default router;
