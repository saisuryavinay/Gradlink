/**
 * email.js — GradLink Email Service
 *
 * Primary provider : Resend HTTP API (set RESEND_API_KEY on Render)
 * Fallback         : Gmail SMTP via Nodemailer (requires SMTP_USER + SMTP_PASS)
 *
 * Resend is strongly preferred for Render deployments because cloud provider
 * IPs (AWS) are often blocked by Gmail's SMTP servers.
 *
 * Environment variables (set in Render Dashboard → Environment):
 *   RESEND_API_KEY      – Resend API key (re_xxxx...). Required for Resend path.
 *   EMAIL_FROM          – Sender shown to recipients.
 *                         Without a verified Resend domain use the default below.
 *   SMTP_USER           – Gmail address (fallback only)
 *   SMTP_PASS           – Gmail App Password (fallback only)
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// ─── Email templates ──────────────────────────────────────────────────────────

/**
 * Shared HTML wrapper for all GradLink emails.
 * Keeps a consistent brand look across registration OTP and future emails.
 */
function buildEmailWrapper(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GradLink</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#FFFFFF;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 100%);
                        padding:28px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;
                          letter-spacing:-0.5px;">
                🎓 GradLink
              </h1>
              <p style="margin:4px 0 0;font-size:13px;color:#BFDBFE;">
                Alumni Networking &amp; Student Career Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;text-align:center;
                        border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                This email was sent by GradLink. If you did not request this,
                please ignore it — no action is required.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#CBD5E1;">
                &copy; ${new Date().getFullYear()} GradLink. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Registration / resend OTP email template.
 */
function buildOTPEmailHtml(name, otp) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1E293B;">
      Verify Your Email Address
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">
      Use the OTP below to verify your GradLink account. This code is valid for
      <strong>5 minutes</strong>.
    </p>

    <!-- OTP box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:#EFF6FF;border:2px solid #2563EB;
                      border-radius:12px;padding:20px 40px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;
                          color:#1D4ED8;font-family:'Courier New',monospace;">
              ${otp}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Security tips -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#FEF9C3;border:1px solid #FDE047;border-radius:8px;
                  margin-bottom:24px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#713F12;">
            ⚠️ <strong>Security notice:</strong> GradLink staff will
            <em>never</em> ask for your OTP. Do not share this code with anyone.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#94A3B8;">
      If you did not create a GradLink account, you can safely ignore this email.
    </p>
  `;
  return buildEmailWrapper(body);
}

// ─── Resend (primary path) ────────────────────────────────────────────────────

async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const resend = new Resend(apiKey);

  // Use EMAIL_FROM if set (requires a verified sender domain in Resend).
  // Otherwise fall back to Resend's default onboarding address which works
  // without domain verification on the free tier.
  const from = process.env.EMAIL_FROM || 'GradLink <onboarding@resend.dev>';

  console.log(`[EMAIL] Sending via Resend | to: ${to} | subject: "${subject}"`);

  const { data, error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    // Log the full error object (never contains user passwords or OTP plaintext)
    console.error(`[EMAIL] Resend rejected — ${JSON.stringify(error)}`);
    throw new Error(`Resend delivery failed: ${error.message || JSON.stringify(error)}`);
  }

  console.log(`[EMAIL] Resend accepted — id: ${data.id} | to: ${to}`);
}

// ─── Gmail SMTP fallback ──────────────────────────────────────────────────────

function createSmtpTransporter() {
  const user = process.env.SMTP_USER;
  // Strip all whitespace — Gmail App Passwords are often pasted with spaces
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) return null;

  const host   = process.env.SMTP_HOST   || 'smtp.gmail.com';
  const port   = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true'; // true only for port 465

  console.log(`[EMAIL] Creating SMTP transporter — ${host}:${port} | user: ${user}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout : 15000,
    socketTimeout   : 30000,
    // Do NOT set requireTLS — it breaks connections on Render/AWS infrastructure
    tls: { rejectUnauthorized: false },
  });
}

async function sendViaSmtp(to, subject, html) {
  const transport = createSmtpTransporter();
  if (!transport) {
    throw new Error('SMTP not configured — SMTP_USER and SMTP_PASS are missing.');
  }

  // EMAIL_FROM can override the SMTP sender display name
  const from = process.env.EMAIL_FROM || `GradLink <${process.env.SMTP_USER}>`;
  console.log(`[EMAIL] Sending via SMTP | to: ${to} | subject: "${subject}"`);

  const info = await transport.sendMail({ from, to, subject, html });
  console.log(`[EMAIL] SMTP accepted — messageId: ${info.messageId} | to: ${to}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an OTP verification email to `to`.
 *
 * Uses Resend when RESEND_API_KEY is present (recommended for production).
 * Falls back to SMTP when only SMTP_USER/SMTP_PASS are configured.
 *
 * Throws on delivery failure — callers must handle the error and return an
 * appropriate HTTP error response. Never silently swallow failures.
 *
 * @param {string} to   - Recipient email address
 * @param {string} otp  - Plaintext 6-digit OTP (hashed version already in DB)
 * @param {string} name - Recipient's display name for the greeting
 */
export const sendOTPEmail = async (to, otp, name) => {
  const subject = 'GradLink — Verify Your Email';
  const html    = buildOTPEmailHtml(name, otp);

  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html);
      return; // ✅ Delivered via Resend
    } catch (resendErr) {
      console.error(`[EMAIL] Resend failed (${resendErr.message}) — trying SMTP fallback…`);
      // Fall through to SMTP
    }
  }

  // SMTP fallback (works locally; often blocked on Render cloud IPs)
  try {
    await sendViaSmtp(to, subject, html);
  } catch (smtpErr) {
    console.error(`[EMAIL] SMTP also failed — ${smtpErr.message}`);
    throw new Error(
      'Email delivery failed. Please check the server email configuration ' +
      '(RESEND_API_KEY or SMTP_USER/SMTP_PASS).'
    );
  }
};
