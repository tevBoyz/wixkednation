function normalizePhone(phone) {
    if (!phone || typeof phone !== "string") {
      return null;
    }
  
    return phone.trim().replace(/\s+/g, "");
  }
  
  function isValidEthiopianPhone(phone) {
    const normalizedPhone = normalizePhone(phone);
  
    if (!normalizedPhone) {
      return false;
    }
  
    return /^\+2519\d{8}$/.test(normalizedPhone) || /^\+2517\d{8}$/.test(normalizedPhone);
  }
  
  module.exports = {
    normalizePhone,
    isValidEthiopianPhone
  };