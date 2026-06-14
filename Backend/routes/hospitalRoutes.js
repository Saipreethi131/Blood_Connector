import express from 'express';
import {
  getHospitalProfile,
  updateHospitalProfile,
  searchDonors,
  postBloodRequest,
  getHospitalRequests,
  handleDonorResponse,
  updateRequestStatus,
  getInventory,
  updateInventory,
} from '../controllers/hospitalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { postRequestRules, updateInventoryRules } from '../validators/hospitalValidators.js';

const router = express.Router();

router.use(protect, authorize('hospital'));

router.route('/profile').get(getHospitalProfile).post(updateHospitalProfile);
router.get('/donors', searchDonors);
router.post('/request', validate(postRequestRules), postBloodRequest);
router.get('/requests', getHospitalRequests);
router.put('/request/:requestId/response/:donorId', handleDonorResponse);
router.put('/request/:id', updateRequestStatus);
router.route('/inventory').get(getInventory).put(validate(updateInventoryRules), updateInventory);

export default router;
