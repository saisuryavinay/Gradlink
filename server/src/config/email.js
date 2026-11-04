import nodemailer from 'nodemailer';

const createTransporter = () => {
  const user = process.env.SMTP_USER;
  // Strip all whitespace from the password — Gmail App Passwords are sometimes
  // copy-pasted with spaces (e.g. "abcd efgh ijkl mnop") but must be sent as
  // a continuous 16-character string.
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true'; // only true for port 465

  if (!user || !pass) {
    console.error('[EMAIL] SMTP_USER or SMTP_PASS is missing from environment variables.');
    return null;
  }

  console.log(`[EMAIL] Creating transporter — host: ${host}, port: ${port}, user: ${user}, secure: ${secure}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,       // false for port 587 (STARTTLS), true for port 465 (SSL)
    auth: { user, pass },
    // Do NOT set requireTLS=true — it breaks on some cloud hosts including Render.
    // STARTTLS is negotiated automatically on port 587.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false, // allow self-signed certs on relay hosts
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
