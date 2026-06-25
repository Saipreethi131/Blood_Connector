import { body, param } from 'express-validator';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const postRequestRules = [
  body('bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('unitsRequired').isInt({ min: 1, max: 100 }).withMessage('Units required must be between 1 and 100'),
  body('urgency').isIn(['Normal', 'Urgent', 'Critical']).withMessage('Invalid urgency level'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long (max 500 chars)'),
];

export const updateInventoryRules = [
  body('inventory').isArray({ min: 1 }).withMessage('Inventory must be a non-empty array'),
  body('inventory.*.bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group in inventory'),
  body('inventory.*.units').isInt({ min: 0, max: 10000 }).withMessage('Units must be between 0 and 10000'),
];

export const createCampRules = [
  body('title').trim().notEmpty().withMessage('Camp title is required').isLength({ max: 200 }),
  body('date').isISO8601().withMessage('Valid date is required').toDate(),
  body('address').trim().notEmpty().withMessage('Camp address is required'),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('City too long'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('targetBloodGroups').optional().isArray().withMessage('targetBloodGroups must be an array'),
  body('targetBloodGroups.*').optional().isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('expectedDonors').optional().isInt({ min: 0, max: 100000 }).withMessage('Expected donors must be a non-negative number'),
];
