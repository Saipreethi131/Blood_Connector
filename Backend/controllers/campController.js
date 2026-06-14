import BloodCamp from '../models/BloodCamp.js';
import Hospital from '../models/Hospital.js';
import Donor from '../models/Donor.js';
import Notification from '../models/Notification.js';
import { emitToBloodGroup } from '../socket/socketHandler.js';

export const createCamp = async (req, res) => {
  try {
    const { title, description, date, address, targetBloodGroups } = req.body;

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
      location: hospitalProfile.location,
      targetBloodGroups: targetBloodGroups || [],
    });

    // Notify donors with matching blood groups (or all if no target groups)
    const bloodGroupsToNotify = targetBloodGroups?.length ? targetBloodGroups : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const campDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const donorQuery = { isAvailable: true };
    if (targetBloodGroups?.length) donorQuery.bloodGroup = { $in: targetBloodGroups };
    const donors = await Donor.find(donorQuery).select('user bloodGroup').lean();

    if (donors.length > 0) {
      await Notification.insertMany(
        donors.map((d) => ({
          recipient: d.user,
          message: `🏕 Blood Camp: "${title}" by ${hospitalProfile.hospitalName} on ${campDate}. Register now!`,
          type: 'general',
        })),
        { ordered: false }
      ).catch(() => {});
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

    await Notification.create({
      recipient: camp.hospital,
      message: `${req.user.name} registered for your blood camp "${camp.title}"`,
      type: 'general',
    });

    res.json({ status: 'success', message: 'Registered for camp successfully', data: { campId: camp._id } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
