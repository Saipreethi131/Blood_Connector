import Hospital from '../models/Hospital.js';
import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { emitToUser, emitToBloodGroup } from '../socket/socketHandler.js';

/**
 * @desc    Get logged-in hospital's profile
 * @route   GET /api/hospital/profile
 * @access  Private/Hospital
 */
export const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!hospital) {
      return res.status(404).json({ status: 'fail', message: 'Hospital profile not found' });
    }
    res.status(200).json({ status: 'success', data: { hospital } });
  } catch (error) {
    console.error('Get Hospital Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Update hospital profile
 * @route   POST /api/hospital/profile
 * @access  Private/Hospital
 */
export const updateHospitalProfile = async (req, res) => {
  try {
    const { address, emergencyContact, coordinates } = req.body;

    const updateFields = {};
    if (address) updateFields.address = address;
    if (emergencyContact) updateFields.emergencyContact = emergencyContact;
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updateFields.location = {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
      };
    }

    const hospital = await Hospital.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    if (!hospital) {
      return res.status(404).json({ status: 'fail', message: 'Hospital profile not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Hospital profile updated successfully',
      data: { hospital }
    });
  } catch (error) {
    console.error('Update Hospital Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Search available donors by blood group and optional city
 * @route   GET /api/hospital/donors
 * @access  Private/Hospital
 */
export const searchDonors = async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    const query = { isAvailable: true };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.address = { $regex: city, $options: 'i' };

    const donors = await Donor.find(query)
      .populate('user', 'name email phone')
      .sort({ lastDonationDate: 1 });

    res.status(200).json({
      status: 'success',
      data: { donors, count: donors.length }
    });
  } catch (error) {
    console.error('Search Donors Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Post a new blood request
 * @route   POST /api/hospital/request
 * @access  Private/Hospital
 */
export const postBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsRequired, urgency, notes } = req.body;

    const hospitalProfile = await Hospital.findOne({ user: req.user._id });
    if (!hospitalProfile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Hospital profile not found. Please complete your profile first.'
      });
    }

    const bloodRequest = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: hospitalProfile.hospitalName,
      bloodGroup,
      unitsRequired,
      urgency,
      location: hospitalProfile.location,
      address: hospitalProfile.address,
      notes,
      status: 'Pending'
    });

    // For Urgent or Critical requests, notify ALL donors with matching blood group.
    // Availability is not filtered here — unavailable donors should still see critical needs.
    // Socket broadcast also reaches all connected donors in the room regardless of availability.
    if (urgency === 'Critical' || urgency === 'Urgent') {
      const matchingDonors = await Donor.find({ bloodGroup });

      // Batch-create notifications
      const notificationDocs = matchingDonors.map((d) => ({
        recipient: d.user,
        message: `${urgency.toUpperCase()}: ${hospitalProfile.hospitalName} urgently needs ${bloodGroup} blood — ${unitsRequired} unit(s) required.`,
        type: 'new_request',
        relatedRequest: bloodRequest._id
      }));

      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs);
      }

      // Broadcast via socket to the blood-group room
      emitToBloodGroup(bloodGroup, 'new_urgent_request', {
        message: `${urgency}: ${hospitalProfile.hospitalName} needs ${bloodGroup} blood`,
        urgency,
        requestId: bloodRequest._id,
        hospitalName: hospitalProfile.hospitalName,
        bloodGroup,
        unitsRequired
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Blood request posted successfully',
      data: { bloodRequest }
    });
  } catch (error) {
    console.error('Post Blood Request Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all requests posted by this hospital
 * @route   GET /api/hospital/requests
 * @access  Private/Hospital
 */
export const getHospitalRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ hospital: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: { requests, count: requests.length }
    });
  } catch (error) {
    console.error('Get Hospital Requests Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Update a blood request's status (Fulfilled / Cancelled)
 * @route   PUT /api/hospital/request/:id
 * @access  Private/Hospital
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Status must be Fulfilled or Cancelled' });
    }

    const request = await BloodRequest.findOne({ _id: id, hospital: req.user._id });
    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'Request not found or not authorized' });
    }

    request.status = status;
    await request.save();

    res.status(200).json({
      status: 'success',
      message: `Request marked as ${status}`,
      data: { request }
    });
  } catch (error) {
    console.error('Update Request Status Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
