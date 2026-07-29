function getJwtExpiryDate(expiresIn) {
  const now = new Date();

  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    return new Date(now.getTime() + expiresIn * 1000);
  }

  if (typeof expiresIn !== "string" || expiresIn.length === 0) {
    throw new Error("Invalid JWT expiry value.");
  }

  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);

  if (!match) {
    throw new Error(`Unsupported JWT expiry format: ${expiresIn}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitToMilliseconds = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return new Date(now.getTime() + amount * unitToMilliseconds[unit]);
}

module.exports = {
  getJwtExpiryDate
};
