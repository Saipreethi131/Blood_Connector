import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../socket/socketHandler.js';
import { sendDonorResponseEmail } from '../utils/emailHelper.js';
import { canDonate } from '../utils/bloodCompatibility.js';

const DONATION_COOLDOWN_DAYS = 90;

export const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!donor) {
      return res.status(404).json({ status: 'fail', message: 'Donor profile not found' });
    }

    const lastDonated = donor.lastDonationDate;
    const daysSince = lastDonated
      ? (Date.now() - new Date(lastDonated).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    const isEligible = daysSince >= DONATION_COOLDOWN_DAYS;
    const nextEligibleDate = isEligible
      ? null
      : new Date(new Date(lastDonated).getTime() + DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const daysUntilEligible = isEligible ? 0 : Math.ceil(DONATION_COOLDOWN_DAYS - daysSince);

    res.status(200).json({
      status: 'success',
      data: { donor, eligibility: { isEligible, nextEligibleDate, daysUntilEligible } }
    });
  } catch (error) {
    console.error('Get Donor Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

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

export const getBloodRequests = async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng, radius } = req.query;
    const donorUserId = req.user._id.toString();

    // Fetch donor's blood group for compatibility calculation
    const donorProfile = await Donor.findOne({ user: req.user._id }).select('bloodGroup').lean();
    const donorBloodGroup = donorProfile?.bloodGroup;

    const now = new Date();
    const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] };

    const attachMeta = (responses, requestBloodGroup) => {
      const myResp = responses?.find((resp) => resp.donorId?.toString() === donorUserId);
      const compatibility = donorBloodGroup
        ? (donorBloodGroup === requestBloodGroup ? 'exact' : canDonate(donorBloodGroup, requestBloodGroup) ? 'compatible' : 'none')
        : 'unknown';
      return {
        hasResponded: !!myResp,
        myResponse: myResp ? { status: myResp.status, respondedAt: myResp.respondedAt } : null,
        compatibility
      };
    };

    if (lat && lng) {
      const radiusInMeters = (parseFloat(radius) || 10) * 1000;
      const matchQuery = { status: 'Pending', ...expiryFilter };
      if (bloodGroup) matchQuery.bloodGroup = bloodGroup;

      const requests = await BloodRequest.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: { status: 'Pending' }
          }
        },
        { $match: { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] } }
      ]);

      const requestsWithStatus = requests.map((r) => ({ ...r, ...attachMeta(r.responses, r.bloodGroup) }));
      return res.status(200).json({ status: 'success', data: { requests: requestsWithStatus } });
    }

    const query = { status: 'Pending', ...expiryFilter };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.address = { $regex: city, $options: 'i' };

    const requests = await BloodRequest.find(query).sort({ createdAt: -1 });

    const requestsWithStatus = requests.map((r) => {
      const obj = r.toObject();
      return { ...obj, ...attachMeta(obj.responses, obj.bloodGroup) };
    });

    res.status(200).json({ status: 'success', data: { requests: requestsWithStatus } });
  } catch (error) {
    console.error('Get Blood Requests Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('request', 'bloodGroup unitsRequired urgency')
      .sort({ donationDate: -1 });

    res.status(200).json({ status: 'success', data: { donations, count: donations.length } });
  } catch (error) {
    console.error('Get Donation History Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

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
      (r) => r.donorId.toString() === donorUserId.toString()
    );
    if (alreadyResponded) {
      return res.status(400).json({ status: 'fail', message: 'You have already responded to this request' });
    }

    // Fetch donor profile to get blood group + check 90-day eligibility
    const donorProfile = await Donor.findOne({ user: donorUserId });

    if (donorProfile?.lastDonationDate) {
      const daysSince =
        (Date.now() - new Date(donorProfile.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DONATION_COOLDOWN_DAYS) {
        const nextEligible = new Date(
          new Date(donorProfile.lastDonationDate).getTime() + DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        );
        return res.status(400).json({
          status: 'fail',
          message: `You are not eligible to donate yet. Next eligible date: ${nextEligible.toLocaleDateString('en-IN')}.`,
          data: { nextEligibleDate: nextEligible }
        });
      }
    }

    request.responses.push({
      donorId: donorUserId,
      donorName: req.user.name,
      bloodGroup: donorProfile?.bloodGroup || '',
      phone: req.user.phone || ''
    });
    await request.save();

    // Notify the hospital with full donor details including phone
    const notification = await Notification.create({
      recipient: request.hospital,
      message: `${req.user.name} (${donorProfile?.bloodGroup || 'Unknown'} blood group) responded to your ${request.bloodGroup} request. Phone: ${req.user.phone || 'N/A'}.`,
      type: 'donor_response',
      relatedRequest: request._id
    });

    emitToUser(request.hospital.toString(), 'notification', {
      message: notification.message,
      type: 'donor_response',
      requestId: request._id
    });

    const hospitalUser = await User.findById(request.hospital).select('email name').lean();
    if (hospitalUser?.email) {
      sendDonorResponseEmail({
        to: hospitalUser.email,
        hospitalName: request.hospitalName,
        donorName: req.user.name,
        donorPhone: req.user.phone,
        bloodGroup: request.bloodGroup,
        units: request.unitsRequired
      });
    }

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
