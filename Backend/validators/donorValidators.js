import { body } from 'express-validator';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const updateProfileRules = [
  body('bloodGroup').optional().isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('address').optional().trim().isLength({ max: 300 }).withMessage('Address too long'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
];
