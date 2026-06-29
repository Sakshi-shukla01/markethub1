const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
if (env.isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

/**
 * Sends an email. If SMTP is not configured, logs to console instead
 * so the app keeps working in demo mode.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('\n========== [EMAIL - DEMO MODE, not actually sent] ==========');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text || html);
    console.log('============================================================\n');
    return { demo: true };
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html, text });
  return { demo: false };
}

module.exports = { sendEmail };
