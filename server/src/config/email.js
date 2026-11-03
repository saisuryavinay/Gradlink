import nodemailer from 'nodemailer';

// Do NOT cache the transporter as a module-level singleton.
// On Render, environment variables are injected at startup. If the transporter
// is created before env vars are ready, or if credentials change, the cached
// instance will silently fail forever. Create fresh each time instead —
// nodemailer's connection pooling is off by default for port 587 (STARTTLS),
// so there is no meaningful performance cost.
const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!user || !pass) {
    return null;
  }

  console.log(`[EMAIL] Creating transporter — host: ${host}, port: ${port}, user: ${user}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Hard limits to prevent hanging on cloud hosts (Render, Railway, etc.)
    connectionTimeout: 15000,  // 15 s to establish TCP connection
    greetingTimeout: 15000,    // 15 s to receive SMTP greeting
    socketTimeout: 30000,      // 30 s of idle socket before abort
    // Force STARTTLS on port 587 even if server doesn't advertise it
    requireTLS: !secure && port === 587,
    tls: {
      // Accept self-signed certs on port 587 (Gmail does not need this,
      // but some relay services do)
      rejectUnauthorized: false,
    },
  });
};

export const sendOTPEmail = async (to, otp, name) => {
  const transport = createTransporter();

  if (!transport) {
    const msg = '[EMAIL] SMTP not configured — SMTP_USER and/or SMTP_PASS are missing from environment variables.';
    console.error(msg);
    throw new Error(
      'Email service is not configured on the server. Please contact the administrator.'
    );
  }

  const from = process.env.EMAIL_FROM || 'GradLink <noreply@gradlink.app>';

  console.log(`[EMAIL] Sending OTP email to ${to} from ${from}`);

  try {
    const info = await transport.sendMail({
      from,
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

    // Log acceptance — messageId confirms the SMTP server accepted it
    console.log(`[EMAIL] OTP email accepted by SMTP server — messageId: ${info.messageId}, to: ${to}`);
  } catch (err) {
    // Re-throw with a clean message so the controller can return a proper HTTP error
    console.error(`[EMAIL] SMTP delivery failed for ${to}: ${err.message}`);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
};
