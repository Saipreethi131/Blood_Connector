import express from 'express';
import {
  getHospitalProfile,
  updateHospitalProfile,
  searchDonors,
  postBloodRequest,
  getHospitalRequests,
  updateRequestStatus
} from '../controllers/hospitalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All hospital routes require authentication and hospital role
router.use(protect, authorize('hospital'));

router.route('/profile').get(getHospitalProfile).post(updateHospitalProfile);
router.get('/donors', searchDonors);
router.post('/request', postBloodRequest);
router.get('/requests', getHospitalRequests);
router.put('/request/:id', updateRequestStatus);

export default router;
