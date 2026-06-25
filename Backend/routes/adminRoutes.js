import express from 'express';
import {
  getStats,
  getAnalytics,
  getPendingHospitals,
  getAllHospitals,
  approveHospital,
  rejectHospital,
  getAllUsers,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getAdminRequests,
  getBloodStock,
  updateBloodStock,
  seedAdmin
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Seed endpoint is public — self-disables once one admin exists
router.post('/seed', seedAdmin);

// All routes below require admin JWT
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/hospitals/pending', getPendingHospitals);
router.get('/hospitals', getAllHospitals);
router.put('/hospitals/:userId/approve', approveHospital);
router.put('/hospitals/:userId/reject', rejectHospital);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.get('/requests', getAdminRequests);
router.route('/blood-stock').get(getBloodStock).put(updateBloodStock);

export default router;
