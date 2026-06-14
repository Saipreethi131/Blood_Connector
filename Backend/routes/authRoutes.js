import express from 'express';
import {
  registerDonor,
  registerHospital,
  verifyOTP,
  resendOTP,
  login,
  refreshAccessToken,
  logout,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { registerDonorRules, registerHospitalRules, loginRules, refreshTokenRules } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register/donor',    validate(registerDonorRules),    registerDonor);
router.post('/register/hospital', validate(registerHospitalRules), registerHospital);
router.post('/verify-otp',   verifyOTP);
router.post('/resend-otp',   resendOTP);
router.post('/login',        validate(loginRules),        login);
router.post('/refresh',      validate(refreshTokenRules), refreshAccessToken);
router.post('/logout',       logout);
router.get('/me',            protect, getMe);

export default router;
