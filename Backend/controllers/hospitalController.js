import Hospital from '../models/Hospital.js';
import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import BloodInventory from '../models/BloodInventory.js';
import { emitToUser, emitToBloodGroup } from '../socket/socketHandler.js';
import { getCompatibleDonors } from '../utils/bloodCompatibility.js';
import { sendPushToBloodGroup } from './pushController.js';
import {
  sendResponseAcceptedEmail,
  sendResponseRejectedEmail,
  sendCriticalRequestEmail,
} from '../utils/emailService.js';
import User from '../models/User.js';
import { getUserRatingSummary } from './ratingController.js';

const computeHospitalCompleteness = (hospital, user) => {
  const checks = [
    !!hospital?.hospitalName,
    !!hospital?.address,
    !!hospital?.licenseNumber,
    !!hospital?.emergencyContact,
    !!user?.phone,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id }).populate('user', 'name email phone');

    // Normally created atomically at registration, but return null gracefully
    // instead of 404 — same convention as the donor profile endpoint — so the
    // dashboard can render a friendly state instead of treating this as an error.
    if (!hospital) {
      return res.status(200).json({ status: 'success', data: { hospital: null, profileCompleteness: null, rating: null } });
    }

    const profileCompleteness = computeHospitalCompleteness(hospital, hospital.user);
    const rating = await getUserRatingSummary(hospital.user._id);
    res.status(200).json({ status: 'success', data: { hospital, profileCompleteness, rating } });
  } catch (error) {
    console.error('Get Hospital Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

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

    const profileCompleteness = computeHospitalCompleteness(hospital, hospital.user);

    res.status(200).json({
      status: 'success',
      message: 'Hospital profile updated successfully',
      data: { hospital, profileCompleteness }
    });
  } catch (error) {
    console.error('Update Hospital Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const searchDonors = async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng, radius, compatible, includeUnavailable } = req.query;

    // Expand to all compatible blood types when compatible=true
    let searchGroups = bloodGroup ? [bloodGroup] : null;
    if (compatible === 'true' && bloodGroup) {
      searchGroups = getCompatibleDonors(bloodGroup);
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (lat && lng && !isNaN(parsedLat) && !isNaN(parsedLng)) {
      try {
        const radiusInMeters = (parseFloat(radius) || 10) * 1000;
        const matchQuery = {};
        if (includeUnavailable !== 'true') matchQuery.isAvailable = true;
        if (searchGroups) matchQuery.bloodGroup = { $in: searchGroups };

        const donors = await Donor.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [parsedLng, parsedLat] },
              distanceField: 'distance',
              maxDistance: radiusInMeters,
              spherical: true,
              query: matchQuery
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              bloodGroup: 1, address: 1, isAvailable: 1,
              totalDonations: 1, lastDonationDate: 1, distance: 1,
              'user._id': 1, 'user.name': 1, 'user.email': 1, 'user.phone': 1
            }
          }
        ]);

        return res.status(200).json({ status: 'success', data: { donors, count: donors.length } });
      } catch (geoError) {
        // No 2dsphere index, bad coordinates, etc. — fall back to a regular query below
        // rather than failing the whole search.
        console.error('Search Donors GeoNear Error, falling back to regular find:', geoError.message);
      }
    }

    const query = {};
    if (includeUnavailable !== 'true') query.isAvailable = true;
    if (searchGroups) query.bloodGroup = { $in: searchGroups };
    if (city) query.address = { $regex: city, $options: 'i' };

    const donors = await Donor.find(query)
      .populate('user', 'name email phone')
      .sort({ lastDonationDate: 1 });

    res.status(200).json({ status: 'success', data: { donors, count: donors.length } });
  } catch (error) {
    console.error('Search Donors Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const postBloodRequest = async (req, res) => {
  try {
    if (req.user.verificationStatus !== 'approved') {
      return res.status(403).json({
        status: 'fail',
        message: 'Your hospital account must be approved by an administrator before posting requests.'
      });
    }

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

    if (urgency === 'Critical' || urgency === 'Urgent') {
      const matchingDonors = await Donor.find({ bloodGroup, isAvailable: true })
        .populate('user', 'email name').lean();

      // Donors whose `user` ref didn't resolve (deleted/orphaned account) can't receive a notification
      const donorsWithUser = matchingDonors.filter((d) => d.user?._id);

      const notificationDocs = donorsWithUser.map((d) => ({
        recipient: d.user._id, // User _id, not Donor profile _id
        message: `${urgency.toUpperCase()}: ${hospitalProfile.hospitalName} urgently needs ${bloodGroup} blood — ${unitsRequired} unit(s) required.`,
        type: 'new_request',
        relatedRequest: bloodRequest._id
      }));

      // Notification failures must never fail the request post itself — the
      // BloodRequest is already saved by this point.
      try {
        if (notificationDocs.length > 0) {
          await Notification.insertMany(notificationDocs, { ordered: false });
        }
      } catch (notifyError) {
        console.error('Critical Request Notification Error:', notifyError.message);
      }

      const socketPayload = {
        message: `${urgency}: ${hospitalProfile.hospitalName} needs ${bloodGroup} blood`,
        urgency,
        requestId: bloodRequest._id,
        hospitalName: hospitalProfile.hospitalName,
        bloodGroup,
        unitsRequired
      };
      emitToBloodGroup(bloodGroup, 'new_urgent_request', socketPayload);

      // Web push to subscribed donors with matching blood group
      sendPushToBloodGroup(bloodGroup, {
        title: `${urgency} Blood Request 🩸`,
        body: `${hospitalProfile.hospitalName} urgently needs ${bloodGroup} blood (${unitsRequired} unit${unitsRequired > 1 ? 's' : ''})`,
        url: '/',
        tag: `request-${bloodRequest._id}`,
      });

      // Email each available matching donor
      for (const donor of matchingDonors) {
        if (donor.user?.email) {
          sendCriticalRequestEmail({
            to: donor.user.email,
            donorName: donor.user.name,
            hospitalName: hospitalProfile.hospitalName,
            bloodGroup,
            city: hospitalProfile.address,
            urgency,
          });
        }
      }
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
 * @desc    Accept or reject an individual donor's response
 * @route   PUT /api/hospital/request/:requestId/response/:donorId
 * @access  Private/Hospital
 */
export const handleDonorResponse = async (req, res) => {
  try {
    const { requestId, donorId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'fail', message: 'Action must be accept or reject' });
    }

    const request = await BloodRequest.findOne({ _id: requestId, hospital: req.user._id });
    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'Request not found or not authorized' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ status: 'fail', message: 'Request is no longer pending' });
    }

    const response = request.responses.find((r) => r.donorId.toString() === donorId);
    if (!response) {
      return res.status(404).json({ status: 'fail', message: 'Donor response not found' });
    }

    response.status = action === 'accept' ? 'Accepted' : 'Rejected';
    await request.save();

    const hospitalProfile = await Hospital.findOne({ user: req.user._id });
    const hospitalName = hospitalProfile?.hospitalName || req.user.name;

    const notifMessage = action === 'accept'
      ? `Your response to ${hospitalName}'s ${request.bloodGroup} blood request has been accepted! Please visit the hospital to confirm your donation.`
      : `Your response to ${hospitalName}'s ${request.bloodGroup} blood request was not needed this time. Thank you for stepping up!`;

    // The response accept/reject decision is already saved — a notification
    // failure here must not turn this into an error response.
    try {
      const notification = await Notification.create({
        recipient: donorId, // donorId is already the donor's User _id
        message: notifMessage,
        type: 'request_update',
        relatedRequest: request._id
      });

      emitToUser(donorId, 'notification', {
        message: notification.message,
        type: 'request_update',
        requestId: request._id
      });
    } catch (notifyError) {
      console.error('Donor Response Notification Error:', notifyError.message);
    }

    // Email the donor about the accept / reject decision
    const donorUser = await User.findById(donorId).select('email name').lean();
    if (donorUser?.email) {
      if (action === 'accept') {
        sendResponseAcceptedEmail({
          to: donorUser.email,
          donorName: donorUser.name,
          hospitalName,
          hospitalPhone: hospitalProfile?.emergencyContact,
          bloodGroup: request.bloodGroup,
        });
      } else {
        sendResponseRejectedEmail({
          to: donorUser.email,
          donorName: donorUser.name,
          hospitalName,
          bloodGroup: request.bloodGroup,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Donor response ${response.status.toLowerCase()}`,
      data: { responseStatus: response.status }
    });
  } catch (error) {
    console.error('Handle Donor Response Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

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
    if (request.status !== 'Pending') {
      return res.status(400).json({ status: 'fail', message: 'Request is no longer pending' });
    }

    request.status = status;

    // Set fulfilledBy from the first accepted donor (or first responder if none accepted)
    if (status === 'Fulfilled' && request.responses.length > 0) {
      const accepted = request.responses.filter((r) => r.status === 'Accepted');
      const primary = accepted.length > 0 ? accepted[0] : request.responses[0];
      request.fulfilledBy = {
        donorId: primary.donorId,
        donorName: primary.donorName || 'Donor'
      };
    }

    await request.save();

    // Create donation records for accepted donors (or all responders if none accepted)
    if (status === 'Fulfilled' && request.responses.length > 0) {
      const accepted = request.responses.filter((r) => r.status === 'Accepted');
      const fulfillDonors = accepted.length > 0 ? accepted : request.responses;
      const donorUserIds = fulfillDonors.map((r) => r.donorId);

      const donationDocs = donorUserIds.map((userId) => ({
        request: request._id,
        donor: userId,
        hospitalName: request.hospitalName,
        bloodGroup: request.bloodGroup
      }));

      await Donation.insertMany(donationDocs, { ordered: false })
        .catch((err) => console.error('Donation Record Creation Error:', err.message));

      await Donor.updateMany(
        { user: { $in: donorUserIds } },
        { $inc: { totalDonations: 1 }, $set: { lastDonationDate: new Date() } }
      );
    }

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

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const getInventory = async (req, res) => {
  try {
    let inv = await BloodInventory.findOne({ hospital: req.user._id });
    if (!inv) {
      inv = await BloodInventory.create({
        hospital: req.user._id,
        inventory: ALL_BLOOD_GROUPS.map((bg) => ({ bloodGroup: bg, units: 0 })),
      });
    }
    res.json({ status: 'success', data: { inventory: inv } });
  } catch (error) {
    console.error('Get Inventory Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { inventory } = req.body;

    const updateItems = inventory.map((item) => ({
      bloodGroup: item.bloodGroup,
      units: parseInt(item.units, 10),
      lastUpdated: new Date(),
    }));

    const inv = await BloodInventory.findOneAndUpdate(
      { hospital: req.user._id },
      { $set: { inventory: updateItems, updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ status: 'success', message: 'Inventory updated', data: { inventory: inv } });
  } catch (error) {
    console.error('Update Inventory Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
