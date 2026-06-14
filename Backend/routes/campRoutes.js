import express from 'express';
import {
  createCamp,
  getHospitalCamps,
  updateCampStatus,
  getPublicCamps,
  registerForCamp,
} from '../controllers/campController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createCampRules } from '../validators/hospitalValidators.js';

const router = express.Router();

// Public — any logged-in user can view upcoming camps
router.get('/', protect, getPublicCamps);

// Donor only — register for a camp
router.post('/:id/register', protect, authorize('donor'), registerForCamp);

// Hospital only — manage their own camps
router.post('/', protect, authorize('hospital'), validate(createCampRules), createCamp);
router.get('/mine', protect, authorize('hospital'), getHospitalCamps);
router.put('/:id/status', protect, authorize('hospital'), updateCampStatus);

export default router;
