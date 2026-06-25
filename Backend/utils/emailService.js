import nodemailer from 'nodemailer';

const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false },
  });

const canSend = () => !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const header = (subtitle) => `
  <div style="background:linear-gradient(135deg,#C0162C,#8B0000);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0 0 6px;font-size:24px;font-family:Arial,sans-serif;letter-spacing:-0.5px;">🩸 Blood Connector</h1>
    <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;font-family:Arial,sans-serif;">${subtitle}</p>
  </div>`;

const footer = () => `
  <div style="padding:16px;text-align:center;color:#aaa;font-size:12px;font-family:Arial,sans-serif;border-top:1px solid #f0f0f0;">
    © 2024 Blood Connector · Built to save lives
  </div>`;

const wrap = (inner) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAFAFA;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
    ${inner}
  </div>`;

// ── OTP Verification Email ────────────────────────────────────────────────────
export const sendOTPEmail = async (email, otp) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Blood Connector - Your Verification Code',
      html: wrap(`
        ${header('Email Verification')}
        <div style="padding:36px 28px;background:#fff;text-align:center;">
          <p style="color:#1A1A2E;font-size:16px;margin:0 0 20px;">Your verification code is:</p>
          <div style="display:inline-block;background:#FFF0F0;border:2px solid #C0162C;border-radius:12px;padding:18px 40px;margin:0 0 20px;">
            <span style="font-size:42px;font-weight:900;color:#C0162C;letter-spacing:0.2em;">${otp}</span>
          </div>
          <p style="color:#555;font-size:14px;margin:0 0 8px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#aaa;font-size:12px;margin:0;">If you did not request this, please ignore this email.</p>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] OTP email failed:', err.message);
  }
};

// ── Donor responded to a hospital's blood request ─────────────────────────────
export const sendDonorResponseEmail = async ({ to, hospitalName, donorName, donorPhone, bloodGroup, units }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🩸 A donor responded to your blood request!`,
      html: wrap(`
        ${header('A donor has stepped forward to help')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Great news, ${hospitalName}!</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 20px;">A donor responded to your <strong style="color:#C0162C;">${bloodGroup}</strong> blood request:</p>
          <div style="background:#FFF0F0;border-left:4px solid #C0162C;border-radius:0 8px 8px 0;padding:18px 20px;margin:0 0 20px;">
            <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Name:</strong> ${donorName}</p>
            <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Phone:</strong> ${donorPhone || 'See dashboard'}</p>
            <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Blood Group:</strong> <span style="color:#C0162C;font-weight:700;">${bloodGroup}</span></p>
            <p style="margin:0;color:#1A1A2E;"><strong>Units Needed:</strong> ${units}</p>
          </div>
          <p style="color:#555;margin:0 0 20px;">Log in to accept or reject this response and coordinate the donation.</p>
          <a href="${CLIENT}/hospital/dashboard" style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            View Dashboard →
          </a>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Donor response email failed:', err.message);
  }
};

// ── Hospital accepted a donor's response ──────────────────────────────────────
export const sendResponseAcceptedEmail = async ({ to, donorName, hospitalName, hospitalPhone, bloodGroup }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Your response was accepted by ${hospitalName}!`,
      html: wrap(`
        ${header('Your donation response was accepted!')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Congratulations, ${donorName}! 🎉</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            <strong>${hospitalName}</strong> has accepted your offer to donate
            <strong style="color:#C0162C;">${bloodGroup}</strong> blood.
            You are about to save a life!
          </p>
          <div style="background:#F0FFF4;border-left:4px solid #22C55E;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;color:#1A1A2E;"><strong>Hospital:</strong> ${hospitalName}</p>
            ${hospitalPhone ? `<p style="margin:0;color:#1A1A2E;"><strong>Contact:</strong> ${hospitalPhone}</p>` : ''}
          </div>
          <p style="color:#555;margin:0 0 20px;">Please contact the hospital or visit in person to complete your donation. Bring a valid ID.</p>
          <a href="${CLIENT}/donor/dashboard" style="display:inline-block;background:#22C55E;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            View My Dashboard →
          </a>
          <p style="color:#aaa;font-size:13px;margin:20px 0 0;">Thank you for your generosity. Every drop counts. ❤️</p>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Acceptance email failed:', err.message);
  }
};

// ── Hospital rejected a donor's response ──────────────────────────────────────
export const sendResponseRejectedEmail = async ({ to, donorName, hospitalName, bloodGroup }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Update on your blood donation response`,
      html: wrap(`
        ${header('Update on your donation response')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Hi ${donorName},</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            Thank you so much for offering to donate <strong style="color:#C0162C;">${bloodGroup}</strong> blood
            to <strong>${hospitalName}</strong>.
          </p>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            Unfortunately, the hospital was able to find another donor for this request and your response
            was not needed this time. Please do not be discouraged — your willingness to help is truly
            appreciated and your profile remains active for future requests.
          </p>
          <p style="color:#555;line-height:1.6;margin:0 0 20px;">
            Keep an eye on the Blood Requests tab — there are always people who need your help.
          </p>
          <a href="${CLIENT}/donor/dashboard" style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            Browse Other Requests →
          </a>
          <p style="color:#aaa;font-size:13px;margin:20px 0 0;">Heroes like you make the difference. Thank you. 🩸</p>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Rejection email failed:', err.message);
  }
};

// ── Hospital registration approved by admin ───────────────────────────────────
export const sendHospitalApprovedEmail = async ({ to, hospitalName }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Your hospital registration has been approved!`,
      html: wrap(`
        ${header('Registration Approved')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Welcome aboard, ${hospitalName}! 🎉</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 20px;">
            Your hospital registration has been reviewed and <strong style="color:#16a34a;">approved</strong> by our administrator.
            You can now log in and start posting blood requests, searching for donors, and managing your inventory.
          </p>
          <a href="${CLIENT}/login" style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            Log In Now →
          </a>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Hospital approved email failed:', err.message);
  }
};

// ── Hospital registration rejected by admin ───────────────────────────────────
export const sendHospitalRejectedEmail = async ({ to, hospitalName, reason }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Update on your hospital registration`,
      html: wrap(`
        ${header('Registration Update')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Hi ${hospitalName},</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            After review, we were unable to approve your hospital registration at this time.
          </p>
          ${reason ? `<div style="background:#FFF0F0;border-left:4px solid #C0162C;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;"><p style="margin:0;color:#1A1A2E;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
          <p style="color:#555;line-height:1.6;margin:0 0 20px;">
            If you believe this is a mistake or would like to provide additional information, please contact support.
          </p>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Hospital rejected email failed:', err.message);
  }
};

// ── New blood camp announced in a donor's city ─────────────────────────────────
export const sendCampAnnouncementEmail = async ({ to, donorName, title, hospitalName, date, address }) => {
  if (!canSend()) return;
  try {
    const campDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⛺ New Blood Camp Near You: ${title}`,
      html: wrap(`
        ${header('A blood donation camp is happening near you')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Hi ${donorName},</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            <strong>${hospitalName}</strong> just announced a new blood donation camp in your area:
          </p>
          <div style="background:#FFF0F0;border-left:4px solid #C0162C;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 8px;color:#1A1A2E;font-size:16px;"><strong>${title}</strong></p>
            <p style="margin:0 0 6px;color:#1A1A2E;"><strong>When:</strong> ${campDate}</p>
            <p style="margin:0;color:#1A1A2E;"><strong>Where:</strong> ${address}</p>
          </div>
          <p style="color:#555;margin:0 0 20px;">Log in to register and reserve your spot — your contribution can save lives.</p>
          <a href="${CLIENT}/donor/dashboard" style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            Register for Camp →
          </a>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Camp announcement email failed:', err.message);
  }
};

// ── Reminder: a hospital's request expires in ~24 hours ───────────────────────
export const sendRequestExpiryReminderEmail = async ({ to, hospitalName, bloodGroup, unitsRequired, responseCount }) => {
  if (!canSend()) return;
  try {
    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏱ Your ${bloodGroup} blood request expires in 24 hours`,
      html: wrap(`
        ${header('Your request is about to expire')}
        <div style="padding:28px 24px;background:#fff;">
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:20px;">Hi ${hospitalName},</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            Your blood request for <strong style="color:#C0162C;">${bloodGroup}</strong>
            (${unitsRequired} unit(s)) will expire in about 24 hours and is still <strong>Pending</strong>.
          </p>
          <p style="color:#555;line-height:1.6;margin:0 0 20px;">
            So far <strong>${responseCount}</strong> donor(s) have responded. If you still need blood,
            log in to review responses or extend your search before it auto-closes.
          </p>
          <a href="${CLIENT}/hospital/dashboard" style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            View My Requests →
          </a>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Expiry reminder email failed:', err.message);
  }
};

// ── Critical / Urgent blood request alert to matching donors ──────────────────
export const sendCriticalRequestEmail = async ({ to, donorName, hospitalName, bloodGroup, city, urgency }) => {
  if (!canSend()) return;
  try {
    const isEmergency = urgency === 'Critical';
    const accentColor = isEmergency ? '#C0162C' : '#F59E0B';
    const badge = isEmergency ? '🚨 CRITICAL' : '⚠️ URGENT';

    await createTransporter().sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${badge}: ${bloodGroup} blood needed at ${hospitalName}`,
      html: wrap(`
        ${header(`${badge} — ${bloodGroup} Blood Needed`)}
        <div style="padding:28px 24px;background:#fff;">
          <div style="background:${isEmergency ? '#FFF0F0' : '#FFFBEB'};border:2px solid ${accentColor};border-radius:10px;padding:16px 20px;margin:0 0 20px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:${accentColor};">${badge}</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#1A1A2E;">${bloodGroup} Blood Required</p>
          </div>
          <h2 style="color:#1A1A2E;margin:0 0 12px;font-size:18px;">Hi ${donorName},</h2>
          <p style="color:#555;line-height:1.6;margin:0 0 16px;">
            A hospital urgently needs <strong style="color:${accentColor};">${bloodGroup}</strong> blood.
            As a matching donor, you could save a life today.
          </p>
          <div style="background:#F8F8F8;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;color:#1A1A2E;"><strong>Hospital:</strong> ${hospitalName}</p>
            <p style="margin:0 0 6px;color:#1A1A2E;"><strong>Location:</strong> ${city}</p>
            <p style="margin:0;color:#1A1A2E;"><strong>Urgency:</strong> <span style="color:${accentColor};font-weight:700;">${urgency}</span></p>
          </div>
          <p style="color:#555;margin:0 0 20px;">Log in now to respond to this request. Every minute matters.</p>
          <a href="${CLIENT}/donor/dashboard" style="display:inline-block;background:${accentColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
            Respond Now →
          </a>
          <p style="color:#aaa;font-size:12px;margin:20px 0 0;">
            You are receiving this because your blood group (${bloodGroup}) matches this request and you are listed as available.
            <a href="${CLIENT}/donor/dashboard" style="color:#C0162C;">Update availability</a>
          </p>
        </div>
        ${footer()}
      `),
    });
  } catch (err) {
    console.error('[Email] Critical request email failed:', err.message);
  }
};
