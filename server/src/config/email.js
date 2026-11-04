/**
 * email.js — GradLink OTP Email Service
 *
 * Priority:
 *  1. Resend (HTTP API — works reliably from Render/cloud, no SMTP port issues)
 *  2. Gmail SMTP via Nodemailer (fallback if RESEND_API_KEY not set)
 *
 * Set RESEND_API_KEY in Render environment variables to use Resend.
 * If not set, falls back to SMTP (SMTP_USER + SMTP_PASS required).
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// ─── Shared email template ────────────────────────────────────────────────────
function buildOTPEmailHtml(name, otp) {
  return `
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
  `;
}

// ─── Resend (primary) ─────────────────────────────────────────────────────────
async function sendViaResend(to, otp, name) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const resend = new Resend(apiKey);

  // If a custom verified domain is set use it, otherwise use Resend's
  // onboarding address which works without domain verification.
  const from = process.env.EMAIL_FROM_RESEND || 'GradLink <onboarding@resend.dev>';

  console.log(`[EMAIL] Sending via Resend to ${to}`);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'GradLink — Verify Your Email',
    html: buildOTPEmailHtml(name, otp),
  });

  if (error) {
    console.error(`[EMAIL] Resend error: ${JSON.stringify(error)}`);
    throw new Error(`Resend delivery failed: ${error.message}`);
  }

  console.log(`[EMAIL] Resend accepted — id: ${data.id}, to: ${to}`);
}

// ─── Gmail SMTP fallback (via Nodemailer) ─────────────────────────────────────
function createSmtpTransporter() {
  const user = process.env.SMTP_USER;
  // Strip spaces — Gmail App Passwords are often pasted with spaces
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  console.log(`[EMAIL] Creating SMTP transporter — ${host}:${port}, user: ${user}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    // Do NOT set requireTLS — it breaks on Render/AWS infrastructure
    tls: { rejectUnauthorized: false },
  });
}

async function sendViaSmtp(to, otp, name) {
  const transport = createSmtpTransporter();
  if (!transport) {
    throw new Error('SMTP not configured — SMTP_USER and SMTP_PASS are missing.');
  }

  const from = process.env.EMAIL_FROM || 'GradLink <noreply@gradlink.app>';
  console.log(`[EMAIL] Sending via SMTP to ${to}`);

  const info = await transport.sendMail({
    from,
    to,
    subject: 'GradLink — Verify Your Email',
    html: buildOTPEmailHtml(name, otp),
  });

  console.log(`[EMAIL] SMTP accepted — messageId: ${info.messageId}, to: ${to}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Send an OTP verification email.
 * Uses Resend if RESEND_API_KEY is set, otherwise falls back to SMTP.
 * Throws on delivery failure so the caller can return a proper HTTP error.
 */
export const sendOTPEmail = async (to, otp, name) => {
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, otp, name);
      return; // success via Resend
    } catch (resendErr) {
      console.error(`[EMAIL] Resend failed (${resendErr.message}), trying SMTP fallback…`);
      // Fall through to SMTP
    }
  }

  // SMTP fallback
  try {
    await sendViaSmtp(to, otp, name);
  } catch (smtpErr) {
    console.error(`[EMAIL] SMTP also failed: ${smtpErr.message}`);
    throw new Error('Email delivery failed. Please check server email configuration.');
  }
};
