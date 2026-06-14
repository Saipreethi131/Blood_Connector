import express from 'express';
import {
  getDonorProfile,
  updateDonorProfile,
  getBloodRequests,
  getDonationHistory,
  toggleAvailability,
  respondToRequest
} from '../controllers/donorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { updateProfileRules } from '../validators/donorValidators.js';

const router = express.Router();

router.use(protect, authorize('donor'));

router.route('/profile').get(getDonorProfile).post(validate(updateProfileRules), updateDonorProfile);
router.get('/requests', getBloodRequests);
router.get('/donations', getDonationHistory);
router.put('/availability', toggleAvailability);
router.post('/respond/:requestId', respondToRequest);

export default router;
