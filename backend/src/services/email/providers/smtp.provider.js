const nodemailer = require("nodemailer");
const env = require("../../../config/env");

let cachedTransport = null;

function isSmtpConfigured() {
  return Boolean(
    env.email.smtpHost &&
      env.email.smtpUser &&
      env.email.smtpPass
  );
}

function getTransport() {
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS."
    );
  }

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpSecure,
      auth: {
        user: env.email.smtpUser,
        pass: env.email.smtpPass
      }
    });
  }

  return cachedTransport;
}

async function sendEmail({ to, subject, text, html, from }) {
  if (!isSmtpConfigured()) {
    return {
      success: false,
      provider: "smtp",
      providerRef: null,
      error: "SMTP credentials are not fully configured.",
      raw: null
    };
  }

  try {
    const transport = getTransport();
    const info = await transport.sendMail({
      from: from || env.email.from,
      to,
      subject,
      text,
      html
    });

    return {
      success: true,
      provider: "smtp",
      providerRef: info.messageId || null,
      error: null,
      raw: {
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      }
    };
  } catch (error) {
    return {
      success: false,
      provider: "smtp",
      providerRef: null,
      error: error.message || "SMTP send failed.",
      raw: null
    };
  }
}

module.exports = {
  name: "smtp",
  sendEmail,
  isConfigured: isSmtpConfigured,
  isSmtpConfigured
};
