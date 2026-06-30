const nodemailer = require('nodemailer');
const env = require('../config/env');

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'no-reply@markethub.dev';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'MarketHub';

let transporter = null;
if (!BREVO_API_KEY && !RESEND_API_KEY && env.isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html || `<p>${text}</p>`,
      textContent: text || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
  return { provider: 'brevo' };
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${MAIL_FROM_NAME} <${MAIL_FROM_EMAIL}>`,
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

async function sendEmail({ to, subject, html, text }) {
  if (BREVO_API_KEY) {
    return sendViaBrevo({ to, subject, html, text });
  }
  if (RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, text });
  }
  if (transporter) {
    await transporter.sendMail({
      from: `${MAIL_FROM_NAME} <${MAIL_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    return { provider: 'smtp' };
  }
  console.log('\n========== [EMAIL - DEMO MODE, not actually sent] ==========');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', text || html);
  console.log('============================================================\n');
  return { provider: 'demo' };
}

module.exports = { sendEmail };