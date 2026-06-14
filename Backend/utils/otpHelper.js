import OTP from '../models/OTP.js';

export const sendOTP = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OTP.deleteMany({ phone });
  await OTP.create({ phone, otp, expiresAt });

  // Dev fallback: print OTP when email credentials are not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV] OTP for ${phone}: ${otp} (valid 10 min)`);
  }

  return otp;
};

export const verifyOTPCode = async (phone, code) => {
  const record = await OTP.findOne({ phone, otp: code });
  if (!record) return false;

  if (record.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: record._id });
    return false;
  }

  await OTP.deleteOne({ _id: record._id });
  return true;
};
