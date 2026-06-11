import express from 'express';
import {
  registerDonor,
  registerHospital,
  verifyOTP,
  resendOTP,
  login,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register/donor', registerDonor);
router.post('/register/hospital', registerHospital);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
