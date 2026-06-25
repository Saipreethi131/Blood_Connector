import BloodCamp from '../models/BloodCamp.js';
import Hospital from '../models/Hospital.js';
import Donor from '../models/Donor.js';
import Notification from '../models/Notification.js';
import { emitToBloodGroup } from '../socket/socketHandler.js';
import { sendCampAnnouncementEmail } from '../utils/emailService.js';
import User from '../models/User.js';

export const createCamp = async (req, res) => {
  try {
    const { title, description, date, address, city, targetBloodGroups, expectedDonors } = req.body;

    const hospitalProfile = await Hospital.findOne({ user: req.user._id });
    if (!hospitalProfile) {
      return res.status(404).json({ status: 'fail', message: 'Hospital profile not found' });
    }

    if (new Date(date) < new Date()) {
      return res.status(400).json({ status: 'fail', message: 'Camp date must be in the future' });
    }

    const camp = await BloodCamp.create({
      hospital: req.user._id,
      hospitalName: hospitalProfile.hospitalName,
      title,
      description,
      date: new Date(date),
      address,
      city: city || '',
      location: hospitalProfile.location,
      targetBloodGroups: targetBloodGroups || [],
      expectedDonors: expectedDonors || 0,
    });

    // Notify donors with matching blood groups (or all if no target groups), optionally narrowed to the camp's city
    const bloodGroupsToNotify = targetBloodGroups?.length ? targetBloodGroups : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const campDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const donorQuery = { isAvailable: true };
    if (targetBloodGroups?.length) donorQuery.bloodGroup = { $in: targetBloodGroups };
    if (city?.trim()) donorQuery.address = { $regex: city.trim(), $options: 'i' };
    const donors = await Donor.find(donorQuery).select('user bloodGroup').lean();

    if (donors.length > 0) {
      // Camp + emails already succeed regardless — notification failures are logged, not thrown.
      await Notification.insertMany(
        donors.filter((d) => d.user).map((d) => ({
          recipient: d.user, // not populated above, so this is already the donor's User _id
          message: `🏕 Blood Camp: "${title}" by ${hospitalProfile.hospitalName} on ${campDate}. Register now!`,
          type: 'general',
        })),
        { ordered: false }
      ).catch((notifyError) => console.error('Camp Announcement Notification Error:', notifyError.message));

      const donorUsers = await User.find({ _id: { $in: donors.map((d) => d.user) } })
        .select('email name').lean();
      for (const u of donorUsers) {
        if (u.email) {
          sendCampAnnouncementEmail({
            to: u.email,
            donorName: u.name,
            title,
            hospitalName: hospitalProfile.hospitalName,
            date: camp.date,
            address,
          });
        }
      }
    }

    bloodGroupsToNotify.forEach((bg) => {
      emitToBloodGroup(bg, 'new_camp', {
        campId: camp._id,
        title,
        hospitalName: hospitalProfile.hospitalName,
        date: camp.date,
        address,
      });
    });

    res.status(201).json({ status: 'success', message: 'Blood camp created', data: { camp } });
  } catch (error) {
    console.error('Create Camp Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getHospitalCamps = async (req, res) => {
  try {
    const camps = await BloodCamp.find({ hospital: req.user._id }).sort({ date: 1 });
    res.json({ status: 'success', data: { camps, count: camps.length } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateCampStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status' });
    }
    const camp = await BloodCamp.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user._id },
      { status },
      { new: true }
    );
    if (!camp) return res.status(404).json({ status: 'fail', message: 'Camp not found' });
    res.json({ status: 'success', data: { camp } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getPublicCamps = async (req, res) => {
  try {
    const now = new Date();
    const camps = await BloodCamp.find({
      status: { $in: ['Upcoming', 'Ongoing'] },
      date: { $gte: now },
    }).sort({ date: 1 }).limit(50);
    res.json({ status: 'success', data: { camps, count: camps.length } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const registerForCamp = async (req, res) => {
  try {
    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ status: 'fail', message: 'Camp not found' });
    if (camp.status === 'Cancelled' || camp.status === 'Completed') {
      return res.status(400).json({ status: 'fail', message: 'This camp is no longer accepting registrations' });
    }

    const alreadyRegistered = camp.registrations.some(
      (r) => r.donor.toString() === req.user._id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ status: 'fail', message: 'You are already registered for this camp' });
    }

    const donorProfile = await Donor.findOne({ user: req.user._id }).select('bloodGroup');
    camp.registrations.push({
      donor: req.user._id,
      donorName: req.user.name,
      bloodGroup: donorProfile?.bloodGroup || '',
    });
    await camp.save();

    // Registration is already saved — a notification failure here must not
    // turn this into an error response.
    try {
      await Notification.create({
        recipient: camp.hospital, // camp.hospital is already the hospital's User _id
        message: `${req.user.name} registered for your blood camp "${camp.title}"`,
        type: 'general',
      });
    } catch (notifyError) {
      console.error('Camp Registration Notification Error:', notifyError.message);
    }

    res.json({ status: 'success', message: 'Registered for camp successfully', data: { campId: camp._id } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
