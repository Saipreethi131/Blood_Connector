import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import Hospital from '../models/Hospital.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../socket/socketHandler.js';

/**
 * @desc    Dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getStats = async (req, res) => {
  try {
    const [
      totalDonors,
      totalHospitals,
      pendingHospitals,
      rejectedHospitals,
      approvedHospitals,
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      cancelledRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital' }),
      User.countDocuments({ role: 'hospital', verificationStatus: 'pending' }),
      User.countDocuments({ role: 'hospital', verificationStatus: 'rejected' }),
      User.countDocuments({ role: 'hospital', verificationStatus: 'approved' }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'Pending' }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      BloodRequest.countDocuments({ status: 'Cancelled' })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: { totalDonors, totalHospitals, pendingHospitals, rejectedHospitals, approvedHospitals },
        requests: { totalRequests, pendingRequests, fulfilledRequests, cancelledRequests }
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get hospitals awaiting approval
 * @route   GET /api/admin/hospitals/pending
 * @access  Private/Admin
 */
export const getPendingHospitals = async (req, res) => {
  try {
    const users = await User.find({ role: 'hospital', verificationStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    const hospitals = await Promise.all(
      users.map(async (u) => {
        const profile = await Hospital.findOne({ user: u._id });
        return { ...u.toObject(), profile };
      })
    );

    res.status(200).json({ status: 'success', data: { hospitals, count: hospitals.length } });
  } catch (error) {
    console.error('Pending Hospitals Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all hospitals (any verification status)
 * @route   GET /api/admin/hospitals
 * @access  Private/Admin
 */
export const getAllHospitals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: 'hospital' };
    if (status) query.verificationStatus = status;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    const hospitals = await Promise.all(
      users.map(async (u) => {
        const profile = await Hospital.findOne({ user: u._id });
        return { ...u.toObject(), profile };
      })
    );

    res.status(200).json({ status: 'success', data: { hospitals, count: hospitals.length } });
  } catch (error) {
    console.error('Get All Hospitals Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Approve a hospital
 * @route   PUT /api/admin/hospitals/:userId/approve
 * @access  Private/Admin
 */
export const approveHospital = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, role: 'hospital' },
      { verificationStatus: 'approved', isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Hospital not found' });
    }

    await Notification.create({
      recipient: user._id,
      message: 'Your hospital registration has been approved by the administrator. You can now log in.',
      type: 'general'
    });

    emitToUser(user._id.toString(), 'notification', {
      message: 'Your hospital registration has been approved! You can now log in.',
      type: 'general'
    });

    res.status(200).json({
      status: 'success',
      message: `${user.name} has been approved`,
      data: { user }
    });
  } catch (error) {
    console.error('Approve Hospital Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Reject a hospital
 * @route   PUT /api/admin/hospitals/:userId/reject
 * @access  Private/Admin
 */
export const rejectHospital = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, role: 'hospital' },
      { verificationStatus: 'rejected', isVerified: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Hospital not found' });
    }

    const message = reason
      ? `Your hospital registration has been rejected. Reason: ${reason}`
      : 'Your hospital registration has been rejected by the administrator.';

    await Notification.create({
      recipient: user._id,
      message,
      type: 'general'
    });

    res.status(200).json({
      status: 'success',
      message: `${user.name} has been rejected`,
      data: { user }
    });
  } catch (error) {
    console.error('Reject Hospital Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all users (paginated, filterable by role)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Delete a user and their profile
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ status: 'fail', message: 'Admin accounts cannot be deleted via this endpoint' });
    }

    await User.findByIdAndDelete(req.params.id);

    if (user.role === 'donor') await Donor.findOneAndDelete({ user: user._id });
    if (user.role === 'hospital') {
      await Hospital.findOneAndDelete({ user: user._id });
      await BloodRequest.deleteMany({ hospital: user._id });
    }
    await Notification.deleteMany({ recipient: user._id });

    res.status(200).json({ status: 'success', message: `User "${user.name}" deleted` });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all blood requests (paginated, filterable by status)
 * @route   GET /api/admin/requests
 * @access  Private/Admin
 */
export const getAdminRequests = async (req, res) => {
  try {
    const { status, bloodGroup, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      BloodRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      BloodRequest.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        requests,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin Get Requests Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Seed first admin account (only works when zero admins exist)
 * @route   POST /api/admin/seed
 * @access  Public (but self-disables after first use)
 */
export const seedAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'An admin account already exists. This endpoint is disabled.'
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'fail', message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: 'fail', message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hash,
      phone: `admin_${Date.now()}`,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin account created. You can now log in.',
      data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Seed Admin Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
