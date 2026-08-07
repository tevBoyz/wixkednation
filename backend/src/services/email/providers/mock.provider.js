async function sendEmail({ to, subject, text, html }) {
  console.log(
    `[email-dev] to=${to} subject=${subject} text=${(text || "").slice(0, 200)}`
  );

  return {
    success: true,
    provider: "mock",
    providerRef: `mock-${Date.now()}`,
    error: null,
    raw: null
  };
}

function isConfigured() {
  return true;
}

module.exports = {
  name: "mock",
  sendEmail,
  isConfigured
};
