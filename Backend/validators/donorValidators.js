import { body } from 'express-validator';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const updateProfileRules = [
  body('bloodGroup').optional().isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('address').optional().trim().isLength({ max: 300 }).withMessage('Address too long'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  body('weight').optional({ nullable: true }).isFloat({ min: 1, max: 500 }).withMessage('Weight must be a valid number'),
  body('age').optional({ nullable: true }).isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('hemoglobin').optional({ nullable: true }).isFloat({ min: 0, max: 30 }).withMessage('Hemoglobin must be a valid number'),
  body('chronicConditions').optional().isBoolean().withMessage('chronicConditions must be boolean'),
];
