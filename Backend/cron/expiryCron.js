import cron from 'node-cron';
import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';
import { sendRequestExpiryReminderEmail } from '../utils/emailService.js';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const closeExpiredRequests = async () => {
  try {
    const result = await BloodRequest.updateMany(
      { status: 'Pending', expiresAt: { $lte: new Date() } },
      { $set: { status: 'Cancelled' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Cron] Auto-closed ${result.modifiedCount} expired blood request(s)`);
    }
  } catch (err) {
    console.error('[Cron] Failed to auto-close expired requests:', err.message);
  }
};

const sendExpiryReminders = async () => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const requests = await BloodRequest.find({
      status: 'Pending',
      reminderSent: false,
      expiresAt: { $gt: now, $lte: soon },
    }).lean();

    for (const request of requests) {
      const hospitalUser = await User.findById(request.hospital).select('email').lean();
      if (hospitalUser?.email) {
        await sendRequestExpiryReminderEmail({
          to: hospitalUser.email,
          hospitalName: request.hospitalName,
          bloodGroup: request.bloodGroup,
          unitsRequired: request.unitsRequired,
          responseCount: request.responses?.length || 0,
        });
      }
      await BloodRequest.updateOne({ _id: request._id }, { $set: { reminderSent: true } });
    }

    if (requests.length > 0) {
      console.log(`[Cron] Sent ${requests.length} expiry reminder email(s)`);
    }
  } catch (err) {
    console.error('[Cron] Failed to send expiry reminders:', err.message);
  }
};

export const startExpiryCron = () => {
  // Runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    await closeExpiredRequests();
    await sendExpiryReminders();
  });
  console.log('[Cron] Request expiry cron scheduled (hourly)');
};
