import { body } from 'express-validator';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const registerDonorRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates [lng, lat] are required'),
  body('coordinates.*').isFloat().withMessage('Coordinates must be valid numbers'),
];

export const registerHospitalRules = [
  body('name').trim().notEmpty().withMessage('Contact name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('emergencyContact').trim().notEmpty().withMessage('Emergency contact is required'),
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates [lng, lat] are required'),
];

export const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshTokenRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
