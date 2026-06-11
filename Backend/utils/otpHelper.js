import OTP from '../models/OTP.js';

/**
 * Generates a 6-digit numeric OTP, saves it to database, and logs it (Mock SMS)
 * @param {string} phone - User phone number
 * @returns {string} otp - Generated code
 */
export const sendOTP = async (phone) => {
  // Generate 6-digit random code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Check if an OTP already exists for this phone, if so, delete it
  await OTP.deleteMany({ phone });

  // Save to DB
  await OTP.create({
    phone,
    otp,
    expiresAt
  });

  // Mock SMS transmission: Log the code clearly in the server console
  console.log('\n=======================================');
  console.log(`[MOCK SMS SENDER] Sending OTP to: ${phone}`);
  console.log(`[OTP CODE] >>> ${otp} <<< (Valid for 5 mins)`);
  console.log('=======================================\n');

  return otp;
};

/**
 * Verifies if the provided OTP is valid for the phone
 * @param {string} phone
 * @param {string} code
 * @returns {boolean} isValid
 */
export const verifyOTPCode = async (phone, code) => {
  const record = await OTP.findOne({ phone, otp: code });
  
  if (!record) {
    return false;
  }

  // Check expiration
  if (record.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: record._id });
    return false;
  }

  // Valid, clean up OTP record
  await OTP.deleteOne({ _id: record._id });
  return true;
};
