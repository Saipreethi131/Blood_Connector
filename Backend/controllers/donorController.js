import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../socket/socketHandler.js';

/**
 * @desc    Get logged-in donor's profile
 * @route   GET /api/donor/profile
 * @access  Private/Donor
 */
export const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!donor) {
      return res.status(404).json({ status: 'fail', message: 'Donor profile not found' });
    }
    res.status(200).json({ status: 'success', data: { donor } });
  } catch (error) {
    console.error('Get Donor Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Create or update donor profile
 * @route   POST /api/donor/profile
 * @access  Private/Donor
 */
export const updateDonorProfile = async (req, res) => {
  try {
    const { bloodGroup, address, coordinates, isAvailable } = req.body;

    const updateFields = {};
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (address) updateFields.address = address;
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable;
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updateFields.location = {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
      };
    }

    const donor = await Donor.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      message: 'Donor profile updated successfully',
      data: { donor }
    });
  } catch (error) {
    console.error('Update Donor Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all open blood requests (filterable by bloodGroup and city)
 * @route   GET /api/donor/requests
 * @access  Private/Donor
 */
export const getBloodRequests = async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    const query = { status: 'Pending' };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.address = { $regex: city, $options: 'i' };

    const requests = await BloodRequest.find(query).sort({ createdAt: -1 });

    const donorUserId = req.user._id.toString();
    const requestsWithStatus = requests.map((r) => {
      const hasResponded = r.responses.some(
        (resp) => resp.donor.toString() === donorUserId
      );
      return { ...r.toObject(), hasResponded };
    });

    res.status(200).json({
      status: 'success',
      data: { requests: requestsWithStatus }
    });
  } catch (error) {
    console.error('Get Blood Requests Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Toggle donor availability
 * @route   PUT /api/donor/availability
 * @access  Private/Donor
 */
export const toggleAvailability = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ status: 'fail', message: 'Donor profile not found' });
    }

    donor.isAvailable = !donor.isAvailable;
    await donor.save();

    res.status(200).json({
      status: 'success',
      message: `Availability set to ${donor.isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable: donor.isAvailable }
    });
  } catch (error) {
    console.error('Toggle Availability Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Donor responds to a blood request
 * @route   POST /api/donor/respond/:requestId
 * @access  Private/Donor
 */
export const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorUserId = req.user._id;

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'Blood request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ status: 'fail', message: 'This blood request is no longer active' });
    }

    const alreadyResponded = request.responses.some(
      (r) => r.donor.toString() === donorUserId.toString()
    );
    if (alreadyResponded) {
      return res.status(400).json({ status: 'fail', message: 'You have already responded to this request' });
    }

    request.responses.push({ donor: donorUserId });
    await request.save();

    const donorProfile = await Donor.findOne({ user: donorUserId });

    // Notify the hospital that posted the request
    const notification = await Notification.create({
      recipient: request.hospital,
      message: `Donor ${req.user.name} (${donorProfile?.bloodGroup || 'Unknown'} blood type) has responded to your request for ${request.bloodGroup} blood (${request.unitsRequired} units).`,
      type: 'donor_response',
      relatedRequest: request._id
    });

    emitToUser(request.hospital.toString(), 'notification', {
      message: notification.message,
      type: 'donor_response',
      requestId: request._id
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully responded to the blood request',
      data: { requestId: request._id }
    });
  } catch (error) {
    console.error('Respond to Request Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
