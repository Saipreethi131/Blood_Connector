import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Donor from '../models/Donor.js';

let vapidSet = false;
function ensureVapid() {
  if (!vapidSet) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidSet = true;
  }
}

export const getVapidKey = (req, res) => {
  res.json({ status: 'success', data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
};

export const subscribe = async (req, res) => {
  ensureVapid();
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ status: 'fail', message: 'Invalid push subscription object' });
    }

    const donorProfile = await Donor.findOne({ user: req.user._id }).select('bloodGroup').lean();

    await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      { user: req.user._id, subscription, bloodGroup: donorProfile?.bloodGroup || null },
      { upsert: true, new: true }
    );

    res.status(201).json({ status: 'success', message: 'Push subscription saved' });
  } catch (error) {
    console.error('Push Subscribe Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    await PushSubscription.deleteMany({ user: req.user._id });
    res.json({ status: 'success', message: 'Push subscriptions removed' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Called internally by hospitalController when posting urgent/critical requests
export const sendPushToBloodGroup = async (bloodGroup, payload) => {
  ensureVapid();
  try {
    const subs = await PushSubscription.find({ bloodGroup }).lean();
    const message = JSON.stringify(payload);

    await Promise.allSettled(
      subs.map(async ({ subscription, _id }) => {
        try {
          await webpush.sendNotification(subscription, message);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.findByIdAndDelete(_id);
          }
        }
      })
    );
  } catch (error) {
    console.error('Push Notification Error:', error);
  }
};
