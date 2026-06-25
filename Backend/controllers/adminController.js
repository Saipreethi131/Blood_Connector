import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import Hospital from '../models/Hospital.js';
import BloodRequest from '../models/BloodRequest.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import AdminBloodStock from '../models/AdminBloodStock.js';
import BloodCamp from '../models/BloodCamp.js';
import BloodInventory from '../models/BloodInventory.js';
import Rating from '../models/Rating.js';
import PushSubscription from '../models/PushSubscription.js';
import { emitToUser } from '../socket/socketHandler.js';
import { sendHospitalApprovedEmail, sendHospitalRejectedEmail } from '../utils/emailService.js';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * @desc    Dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getStats = async (req, res) => {
  try {
    const MS = 8000; // abort each query after 8 s so the 15 s server timeout still fires cleanly
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
      User.countDocuments({ role: 'donor' }).maxTimeMS(MS),
      User.countDocuments({ role: 'hospital' }).maxTimeMS(MS),
      User.countDocuments({ role: 'hospital', verificationStatus: 'pending' }).maxTimeMS(MS),
      User.countDocuments({ role: 'hospital', verificationStatus: 'rejected' }).maxTimeMS(MS),
      User.countDocuments({ role: 'hospital', verificationStatus: 'approved' }).maxTimeMS(MS),
      BloodRequest.countDocuments().maxTimeMS(MS),
      BloodRequest.countDocuments({ status: 'Pending' }).maxTimeMS(MS),
      BloodRequest.countDocuments({ status: 'Fulfilled' }).maxTimeMS(MS),
      BloodRequest.countDocuments({ status: 'Cancelled' }).maxTimeMS(MS),
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
 * @desc    Dashboard analytics — registrations over time, requests by blood group,
 *          fulfillment rate, top cities, top donating blood groups
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
export const getAnalytics = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      registrationsOverTime,
      requestsByBloodGroup,
      fulfillmentCounts,
      topCities,
      topDonatingBloodGroups,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      BloodRequest.aggregate([
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      BloodRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      BloodRequest.aggregate([
        // Best-effort city bucket: last comma-separated segment of the free-text address
        { $project: { city: { $trim: { input: { $arrayElemAt: [{ $split: ['$address', ','] }, -1] } } } } },
        { $match: { city: { $ne: '' } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Donation.aggregate([
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const fulfilled = fulfillmentCounts.find((f) => f._id === 'Fulfilled')?.count || 0;
    const totalForFulfillment = fulfillmentCounts.reduce((sum, f) => sum + f.count, 0);
    const fulfillmentRate = totalForFulfillment > 0 ? Math.round((fulfilled / totalForFulfillment) * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        registrationsOverTime: registrationsOverTime.map((r) => ({ month: r._id, count: r.count })),
        requestsByBloodGroup: requestsByBloodGroup.map((r) => ({ bloodGroup: r._id, count: r.count })),
        fulfillmentRate,
        topCities: topCities.map((c) => ({ city: c._id, count: c.count })),
        topDonatingBloodGroups: topDonatingBloodGroups.map((d) => ({ bloodGroup: d._id, count: d.count })),
      }
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
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

    // The approval itself is already saved — a notification failure here
    // must not turn this into an error response.
    try {
      await Notification.create({
        recipient: user._id,
        message: 'Your hospital registration has been approved by the administrator. You can now log in.',
        type: 'general'
      });

      emitToUser(user._id.toString(), 'notification', {
        message: 'Your hospital registration has been approved! You can now log in.',
        type: 'general'
      });
    } catch (notifyError) {
      console.error('Approve Hospital Notification Error:', notifyError.message);
    }

    const hospitalProfile = await Hospital.findOne({ user: user._id }).select('hospitalName').lean();
    sendHospitalApprovedEmail({ to: user.email, hospitalName: hospitalProfile?.hospitalName || user.name });

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

    // The rejection itself is already saved — a notification failure here
    // must not turn this into an error response.
    try {
      await Notification.create({
        recipient: user._id,
        message,
        type: 'general'
      });
    } catch (notifyError) {
      console.error('Reject Hospital Notification Error:', notifyError.message);
    }

    const hospitalProfile = await Hospital.findOne({ user: user._id }).select('hospitalName').lean();
    sendHospitalRejectedEmail({ to: user.email, hospitalName: hospitalProfile?.hospitalName || user.name, reason });

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

    if (user.role === 'donor') {
      await Promise.all([
        Donor.findOneAndDelete({ user: user._id }),
        Donation.deleteMany({ donor: user._id }),
        Rating.deleteMany({ $or: [{ fromUser: user._id }, { toUser: user._id }] }),
      ]);
    }
    if (user.role === 'hospital') {
      await Promise.all([
        Hospital.findOneAndDelete({ user: user._id }),
        BloodRequest.deleteMany({ hospital: user._id }),
        BloodInventory.deleteMany({ hospital: user._id }),
        BloodCamp.deleteMany({ hospital: user._id }),
        Rating.deleteMany({ $or: [{ fromUser: user._id }, { toUser: user._id }] }),
      ]);
    }
    await Promise.all([
      Notification.deleteMany({ recipient: user._id }),
      PushSubscription.deleteMany({ user: user._id }),
    ]);

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
 * @desc    Suspend a user account
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Private/Admin
 */
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ status: 'fail', message: 'Admin accounts cannot be suspended' });
    }

    user.isSuspended = true;
    await user.save();

    // Suspension is already saved — a notification failure here must not
    // turn this into an error response.
    try {
      await Notification.create({
        recipient: user._id,
        message: 'Your account has been suspended by an administrator. Please contact support.',
        type: 'general'
      });
    } catch (notifyError) {
      console.error('Suspend User Notification Error:', notifyError.message);
    }

    res.status(200).json({ status: 'success', message: `${user.name} has been suspended` });
  } catch (error) {
    console.error('Suspend User Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Unsuspend a user account
 * @route   PUT /api/admin/users/:id/unsuspend
 * @access  Private/Admin
 */
export const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    user.isSuspended = false;
    await user.save();

    // Unsuspension is already saved — a notification failure here must not
    // turn this into an error response.
    try {
      await Notification.create({
        recipient: user._id,
        message: 'Your account suspension has been lifted. You can now log in.',
        type: 'general'
      });
    } catch (notifyError) {
      console.error('Unsuspend User Notification Error:', notifyError.message);
    }

    res.status(200).json({ status: 'success', message: `${user.name} has been unsuspended` });
  } catch (error) {
    console.error('Unsuspend User Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get national/admin blood stock levels (auto-seeds missing groups)
 * @route   GET /api/admin/blood-stock
 * @access  Private/Admin
 */
export const getBloodStock = async (req, res) => {
  try {
    const existing = await AdminBloodStock.find();
    const existingGroups = new Set(existing.map((s) => s.bloodGroup));
    const missing = ALL_BLOOD_GROUPS.filter((bg) => !existingGroups.has(bg));

    if (missing.length > 0) {
      await AdminBloodStock.insertMany(missing.map((bg) => ({ bloodGroup: bg, unitsAvailable: 0 })));
    }

    const stock = await AdminBloodStock.find().sort({ bloodGroup: 1 });
    res.status(200).json({ status: 'success', data: { stock } });
  } catch (error) {
    console.error('Get Blood Stock Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Update national/admin blood stock levels
 * @route   PUT /api/admin/blood-stock
 * @access  Private/Admin
 */
export const updateBloodStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (!Array.isArray(stock) || stock.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'stock must be a non-empty array' });
    }

    await Promise.all(
      stock.map(({ bloodGroup, unitsAvailable }) =>
        AdminBloodStock.findOneAndUpdate(
          { bloodGroup },
          { $set: { unitsAvailable: Math.max(0, parseInt(unitsAvailable, 10) || 0), lastUpdated: new Date() } },
          { upsert: true }
        )
      )
    );

    const updated = await AdminBloodStock.find().sort({ bloodGroup: 1 });
    res.status(200).json({ status: 'success', message: 'Blood stock updated', data: { stock: updated } });
  } catch (error) {
    console.error('Update Blood Stock Error:', error);
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
