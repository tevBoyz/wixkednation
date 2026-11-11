async function sendSms({ phone, message }) {
  const providerRef = `mock-${Date.now()}`;

  console.log(`[mock-sms] to=${phone} message=${message}`);

  return {
    success: true,
    provider: "mock",
    providerRef,
    error: null,
    raw: {
      mocked: true,
      phone,
      message
    }
  };
}

module.exports = {
  name: "mock",
  sendSms
};
