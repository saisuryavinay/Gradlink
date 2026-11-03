import nodemailer from 'nodemailer';

let transporter = null;

export const getEmailTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Prevent SMTP from hanging indefinitely — critical on cloud hosts
      connectionTimeout: 10000,   // 10 s to establish TCP connection
      greetingTimeout: 10000,     // 10 s to receive SMTP greeting
      socketTimeout: 20000,       // 20 s of socket inactivity before abort
    });
  }

  return transporter;
};

export const sendOTPEmail = async (to, otp, name) => {
  const transport = getEmailTransporter();
  if (!transport) {
    throw new Error('Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file.');
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'GradLink <noreply@gradlink.app>',
    to,
    subject: 'GradLink — Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563EB;">GradLink — Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Your email verification OTP is:</p>
        <div style="background: #EFF6FF; border: 2px solid #2563EB; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D4ED8;">${otp}</span>
        </div>
        <p>This OTP expires in <strong>5 minutes</strong>.</p>
        <p>If you did not create a GradLink account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6B7280;">GradLink — Alumni Networking &amp; Student Career Platform</p>
      </div>
    `,
  });
};

/**
 * Fire-and-forget email sender.
 * Sends the OTP email in the background without blocking the HTTP response.
 * Logs any delivery failures server-side without crashing the request.
 */
export const sendOTPEmailBackground = (to, otp, name) => {
  sendOTPEmail(to, otp, name).catch((err) => {
    // Log the failure but do NOT crash — the OTP is already saved in DB.
    // The user can request a resend from the OTP page.
    console.error(`[EMAIL] Failed to send OTP to ${to}: ${err.message}`);
  });
};
