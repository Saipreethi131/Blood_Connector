import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import Hospital from '../models/Hospital.js';
import { sendOTP, verifyOTPCode } from '../utils/otpHelper.js';
import { sendOTPEmail } from '../utils/emailService.js';

const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @desc    Register a new Donor
 * @route   POST /api/auth/register/donor
 * @access  Public
 */
export const registerDonor = async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, address, coordinates } = req.body;

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ status: 'fail', message: 'Location coordinates [lng, lat] are required' });
    }

    const [longitude, latitude] = coordinates;
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({ status: 'fail', message: 'Coordinates must be valid numbers' });
    }

    // Check user existing email/phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email or phone number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (Donor defaults to verified=false until OTP confirmed)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'donor',
      isVerified: false,
      verificationStatus: 'pending' // pending OTP verification
    });

    // Create Donor Profile
    const donor = await Donor.create({
      user: user._id,
      bloodGroup,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      isAvailable: true,
      eligibilityStatus: true
    });

    // Generate OTP and send via email
    const otp = await sendOTP(email);
    try {
      await sendOTPEmail(user.email, otp);
      console.log('[Email] OTP sent successfully to:', user.email);
    } catch (err) {
      console.error('[Email] Failed to send OTP:', err.message);
      // still return success to the user — the OTP is saved in the DB and
      // they can use Resend Code if the email never arrives
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken       = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_MS);
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Donor registered successfully. A verification code has been sent to your email.',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      profile: donor
    });
  } catch (error) {
    console.error('Register Donor Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Register a new Hospital
 * @route   POST /api/auth/register/hospital
 * @access  Public
 */
export const registerHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      hospitalName,
      licenseNumber,
      address,
      coordinates,
      emergencyContact
    } = req.body;

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ status: 'fail', message: 'Location coordinates [lng, lat] are required' });
    }

    const [longitude, latitude] = coordinates;
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({ status: 'fail', message: 'Coordinates must be valid numbers' });
    }

    // Check existing license
    const existingLicense = await Hospital.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({ status: 'fail', message: 'License/Registration number already exists' });
    }

    // Check user existing email/phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email or phone number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (Hospital is NOT verified by default, requires admin approval)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'hospital',
      isVerified: false,
      verificationStatus: 'pending' // pending admin verification
    });

    // Create Hospital Profile
    const hospital = await Hospital.create({
      user: user._id,
      hospitalName,
      licenseNumber,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      emergencyContact
    });

    res.status(201).json({
      status: 'success',
      message: 'Hospital registered successfully. Awaiting admin profile verification.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      },
      profile: hospital
    });
  } catch (error) {
    console.error('Register Hospital Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Verify Donor Registration OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Email and OTP are required' });
    }

    // Verify OTP code
    const isOTPValid = await verifyOTPCode(email, otp);
    if (!isOTPValid) {
      return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP code' });
    }

    // Find user and mark as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true, verificationStatus: 'approved' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully. Account is active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Resend registration OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email is required' });
    }

    const user = await User.findOne({ email, role: 'donor' });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Donor account not found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ status: 'fail', message: 'Email is already verified' });
    }

    const otp = await sendOTP(email);
    try {
      await sendOTPEmail(user.email, otp);
      console.log('[Email] OTP sent successfully to:', user.email);
    } catch (err) {
      console.error('[Email] Failed to send OTP:', err.message);
      // still return success — the OTP is saved in the DB regardless
    }

    res.status(200).json({
      status: 'success',
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    // Specific check for Hospital role (must be approved by Admin)
    if (user.role === 'hospital') {
      if (user.verificationStatus === 'pending') {
        return res.status(403).json({
          status: 'fail',
          message: 'Your hospital profile is currently pending administrator verification.'
        });
      }
      if (user.verificationStatus === 'rejected') {
        return res.status(403).json({
          status: 'fail',
          message: 'Your hospital registration has been rejected by administrator.'
        });
      }
    }

    // Check suspension BEFORE generating tokens
    if (user.isSuspended) {
      return res.status(403).json({ status: 'fail', message: 'Your account has been suspended. Please contact support.' });
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken       = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY_MS);
    await user.save();

    let profile = null;
    if (user.role === 'donor')    profile = await Donor.findOne({ user: user._id });
    if (user.role === 'hospital') profile = await Hospital.findOne({ user: user._id });

    res.status(200).json({
      status: 'success',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      },
      profile
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Issue new access token using a valid refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ status: 'fail', message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token' });
    }

    const user = await User.findOne({ _id: decoded.id, refreshToken });
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Refresh token revoked or not found' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ status: 'fail', message: 'Account suspended' });
    }
    if (!user.refreshTokenExpiry || new Date() > user.refreshTokenExpiry) {
      user.refreshToken = null; user.refreshTokenExpiry = null; await user.save();
      return res.status(401).json({ status: 'fail', message: 'Refresh token expired. Please log in again.' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ status: 'success', data: { token: newAccessToken } });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Logout — revoke refresh token
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { refreshToken: null, refreshTokenExpiry: null }
      );
    }
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;

    let profile = null;
    if (user.role === 'donor') {
      profile = await Donor.findOne({ user: user._id });
    } else if (user.role === 'hospital') {
      profile = await Hospital.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      },
      profile
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
