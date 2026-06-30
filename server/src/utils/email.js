const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * Email sending with three modes, in priority order:
 *  1. Resend (HTTPS API) — works on cloud hosts like Render where SMTP is blocked.
 *     Enabled when RESEND_API_KEY is set.
 *  2. SMTP (nodemailer) — for local/dev or hosts that allow outbound SMTP.
 *  3. Demo (console) — logs the email so the app still works with no config.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// The "from" address. With Resend's test setup use onboarding@resend.dev,
// or your own verified domain. Falls back to SMTP_FROM or a default.
const MAIL_FROM =
  process.env.MAIL_FROM ||
  env.SMTP_FROM ||
  'MarketHub <onboarding@resend.dev>';

let transporter = null;
if (!RESEND_API_KEY && env.isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      subject,
      html: html || `<p>${text}</p>`,
      text: text || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return { provider: 'resend' };
}

/**
 * Sends an email. Never throws to the caller's critical path is the caller's
 * job (auth wraps this in try/catch), but we surface errors so they can be logged.
 */
async function sendEmail({ to, subject, html, text }) {
  if (RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, text });
  }
  if (transporter) {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text });
    return { provider: 'smtp' };
  }
  // demo mode
  console.log('\n========== [EMAIL - DEMO MODE, not actually sent] ==========');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', text || html);
  console.log('============================================================\n');
  return { provider: 'demo' };
}

module.exports = { sendEmail };
