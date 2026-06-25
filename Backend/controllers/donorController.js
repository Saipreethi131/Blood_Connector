import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../socket/socketHandler.js';
import { sendDonorResponseEmail } from '../utils/emailService.js';
import { canDonate, getDonatableTo } from '../utils/bloodCompatibility.js';
import { getUserRatingSummary } from './ratingController.js';
import { sendPushToUser } from './pushController.js';

const DONATION_COOLDOWN_DAYS = 90;

// Best-effort city extraction from a free-text address ("123 MG Road, Hyderabad" -> "Hyderabad")
const extractCity = (address) => {
  if (!address) return '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : address.trim();
};

// Donor profile completeness — used to nudge profile setup and gate request responses
const computeDonorCompleteness = (donor, user) => {
  const checks = [
    !!user?.name,
    !!donor?.bloodGroup,
    !!donor?.address,
    !!user?.phone,
    donor?.weight != null,
    donor?.age != null,
    donor?.isAvailable !== undefined && donor?.isAvailable !== null,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// Health-based eligibility — separate from the 90-day cooldown so the UI can explain *why*
const getHealthEligibility = (donor) => {
  if (donor?.weight != null && donor.weight < 50) {
    return { healthEligible: false, healthReason: 'Donors must weigh over 50kg to donate.' };
  }
  if (donor?.age != null && (donor.age < 18 || donor.age > 65)) {
    return { healthEligible: false, healthReason: 'Donors must be between 18 and 65 years old to donate.' };
  }
  return { healthEligible: true, healthReason: null };
};

// "Monika Sharma" -> "Monika S." — never expose a donor's full name publicly
const maskName = (fullName) => {
  if (!fullName) return 'Anonymous Donor';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

/**
 * @desc    Public donor leaderboard — top donors by total donations
 * @route   GET /api/leaderboard
 * @access  Public (optionally personalized if authenticated as a donor)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { city, bloodGroup } = req.query;

    const query = { totalDonations: { $gt: 0 } };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city?.trim()) query.address = { $regex: city.trim(), $options: 'i' };

    const donors = await Donor.find(query)
      .populate('user', 'name')
      .sort({ totalDonations: -1 })
      .limit(200) // enough to compute an honest rank without scanning the whole collection
      .lean();

    const toEntry = (d, rank) => ({
      rank,
      name: maskName(d.user?.name),
      bloodGroup: d.bloodGroup,
      city: extractCity(d.address),
      totalDonations: d.totalDonations,
    });

    const top10 = donors.slice(0, 10).map((d, i) => toEntry(d, i + 1));

    let myEntry = null;
    if (req.user?.role === 'donor') {
      const myIndex = donors.findIndex((d) => d.user?._id?.toString() === req.user._id.toString());
      if (myIndex >= 0) myEntry = toEntry(donors[myIndex], myIndex + 1);
    }

    res.status(200).json({ status: 'success', data: { leaderboard: top10, myEntry } });
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id }).populate('user', 'name email phone');

    // New users won't have a profile yet — return null instead of 404
    if (!donor) {
      return res.status(200).json({ status: 'success', data: { donor: null, eligibility: null } });
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
    const { healthEligible, healthReason } = getHealthEligibility(donor);
    const profileCompleteness = computeDonorCompleteness(donor, donor.user);
    const rating = await getUserRatingSummary(donor.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        donor,
        eligibility: { isEligible, nextEligibleDate, daysUntilEligible, healthEligible, healthReason },
        profileCompleteness,
        rating,
      }
    });
  } catch (error) {
    console.error('Get Donor Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDonorProfile = async (req, res) => {
  try {
    const { bloodGroup, address, coordinates, isAvailable, weight, age, hemoglobin, chronicConditions } = req.body;

    const updateFields = {};
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (address) updateFields.address = address;
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable;
    if (weight !== undefined) updateFields.weight = weight === '' ? null : weight;
    if (age !== undefined) updateFields.age = age === '' ? null : age;
    if (hemoglobin !== undefined) updateFields.hemoglobin = hemoglobin === '' ? null : hemoglobin;
    if (chronicConditions !== undefined) updateFields.chronicConditions = chronicConditions;
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

    const profileCompleteness = computeDonorCompleteness(donor, donor.user);

    res.status(200).json({
      status: 'success',
      message: 'Donor profile updated successfully',
      data: { donor, profileCompleteness }
    });
  } catch (error) {
    console.error('Update Donor Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getBloodRequests = async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng, radius, showAll } = req.query;
    const donorUserId = req.user._id.toString();

    const donorProfile = await Donor.findOne({ user: req.user._id }).select('bloodGroup').lean();
    const donorBloodGroup = donorProfile?.bloodGroup;

    const now = new Date();
    const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] };

    // Build blood group filter:
    //   - explicit group selected  → exact match
    //   - showAll=true             → no filter (user wants everything)
    //   - default (no param)       → only groups this donor is compatible with
    let bgFilter;
    if (bloodGroup) {
      bgFilter = bloodGroup;
    } else if (showAll !== 'true' && donorBloodGroup) {
      bgFilter = { $in: getDonatableTo(donorBloodGroup) };
    }

    const attachMeta = (responses, requestBloodGroup) => {
      const myResp = responses?.find((resp) => resp.donorId?.toString() === donorUserId);
      const compatibility = donorBloodGroup
        ? (donorBloodGroup === requestBloodGroup ? 'exact'
          : canDonate(donorBloodGroup, requestBloodGroup) ? 'compatible' : 'none')
        : 'unknown';
      return {
        hasResponded: !!myResp,
        myResponse: myResp ? { status: myResp.status, respondedAt: myResp.respondedAt } : null,
        compatibility,
      };
    };

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (lat && lng && !isNaN(parsedLat) && !isNaN(parsedLng)) {
      try {
        const radiusInMeters = (parseFloat(radius) || 10) * 1000;
        const geoMatchQuery = { status: 'Pending' };
        if (bgFilter) geoMatchQuery.bloodGroup = bgFilter;

        const requests = await BloodRequest.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [parsedLng, parsedLat] },
              distanceField: 'distance',
              maxDistance: radiusInMeters,
              spherical: true,
              query: geoMatchQuery,
            },
          },
          { $match: { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] } },
        ]);

        const requestsWithStatus = requests.map((r) => ({ ...r, ...attachMeta(r.responses, r.bloodGroup) }));
        return res.status(200).json({ status: 'success', data: { requests: requestsWithStatus } });
      } catch (geoError) {
        // No 2dsphere index, bad coordinates, etc. — fall back to a regular query below
        // rather than failing the whole request.
        console.error('GeoNear Query Error, falling back to regular find:', geoError.message);
      }
    }

    const query = { status: 'Pending', ...expiryFilter };
    if (bgFilter) query.bloodGroup = bgFilter;
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

    if (computeDonorCompleteness(donorProfile, req.user) < 80) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please complete your donor profile (weight, age, address) before responding to requests.'
      });
    }

    const { healthEligible, healthReason } = getHealthEligibility(donorProfile);
    if (!healthEligible) {
      return res.status(400).json({ status: 'fail', message: healthReason });
    }

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

    // The donor's response is already saved — a notification failure here
    // must not turn this into an error response.
    try {
      const notification = await Notification.create({
        recipient: request.hospital, // request.hospital is already the hospital's User _id
        message: `${req.user.name} (${donorProfile?.bloodGroup || 'Unknown'} blood group) responded to your ${request.bloodGroup} request. Phone: ${req.user.phone || 'N/A'}.`,
        type: 'donor_response',
        relatedRequest: request._id
      });

      emitToUser(request.hospital.toString(), 'notification', {
        message: notification.message,
        type: 'donor_response',
        requestId: request._id
      });

      sendPushToUser(request.hospital, {
        title: 'Donor Responded 🤝',
        body: `${req.user.name} responded to your ${request.bloodGroup} blood request.`,
        url: '/hospital/dashboard',
        tag: `response-${request._id}`,
      });
    } catch (notifyError) {
      console.error('Respond To Request Notification Error:', notifyError.message);
    }

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
