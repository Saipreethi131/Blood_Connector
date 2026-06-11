import express from 'express';
import {
  getDonorProfile,
  updateDonorProfile,
  getBloodRequests,
  toggleAvailability,
  respondToRequest
} from '../controllers/donorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All donor routes require authentication and donor role
router.use(protect, authorize('donor'));

router.route('/profile').get(getDonorProfile).post(updateDonorProfile);
router.get('/requests', getBloodRequests);
router.put('/availability', toggleAvailability);
router.post('/respond/:requestId', respondToRequest);

export default router;
