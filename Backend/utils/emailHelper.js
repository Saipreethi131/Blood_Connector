import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

export const sendDonorResponseEmail = async ({ to, hospitalName, donorName, donorPhone, bloodGroup, units }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Blood Connector" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🩸 Donor Response: ${donorName} can donate ${bloodGroup} blood`,
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAFAFA;">
          <div style="background:linear-gradient(135deg,#C0162C,#1A1A2E);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">🩸 Blood Connector</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">A donor has responded to your request</p>
          </div>
          <div style="padding:32px 24px;background:#fff;border:1px solid #f0f0f0;">
            <h2 style="color:#1A1A2E;margin:0 0 16px;">Great news, ${hospitalName}!</h2>
            <p style="color:#555;line-height:1.6;">A donor has stepped forward to help with your blood request:</p>
            <div style="background:#FFF0F0;border-left:4px solid #C0162C;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
              <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Donor Name:</strong> ${donorName}</p>
              <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Phone:</strong> ${donorPhone || 'See dashboard'}</p>
              <p style="margin:0 0 8px;color:#1A1A2E;"><strong>Blood Group:</strong> <span style="color:#C0162C;font-weight:700;">${bloodGroup}</span></p>
              <p style="margin:0;color:#1A1A2E;"><strong>Units Requested:</strong> ${units}</p>
            </div>
            <p style="color:#555;line-height:1.6;">Log in to Blood Connector to view full contact details and coordinate the donation.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/hospital/dashboard"
               style="display:inline-block;background:#C0162C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
              View Dashboard →
            </a>
          </div>
          <div style="padding:16px;text-align:center;color:#999;font-size:12px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;">© 2024 Blood Connector. Built to save lives.</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('[Email] Failed to send donor response email:', err.message);
  }
};
