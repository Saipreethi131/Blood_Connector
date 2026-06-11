import express from 'express';
import {
  getStats,
  getPendingHospitals,
  getAllHospitals,
  approveHospital,
  rejectHospital,
  getAllUsers,
  deleteUser,
  getAdminRequests,
  seedAdmin
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Seed endpoint is public — self-disables once one admin exists
router.post('/seed', seedAdmin);

// All routes below require admin JWT
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/hospitals/pending', getPendingHospitals);
router.get('/hospitals', getAllHospitals);
router.put('/hospitals/:userId/approve', approveHospital);
router.put('/hospitals/:userId/reject', rejectHospital);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/requests', getAdminRequests);

export default router;
