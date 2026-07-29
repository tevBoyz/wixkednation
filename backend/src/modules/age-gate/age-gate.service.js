const jwt = require("jsonwebtoken");

const env = require("../../config/env");

const AGE_GATE_EXPIRES_IN = "30d";
const AGE_GATE_PURPOSE = "age-gate";

function createAgeGateError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureJwtConfig() {
  if (!env.jwt.accessSecret) {
    throw new Error("Missing JWT access secret configuration.");
  }
}

function isAccepted(body) {
  if (typeof body?.accepted === "boolean") {
    return body.accepted;
  }

  if (typeof body?.over21 === "boolean") {
    return body.over21;
  }

  return null;
}

function signAgeGateToken() {
  ensureJwtConfig();

  return jwt.sign(
    {
      purpose: AGE_GATE_PURPOSE,
      approved: true
    },
    env.jwt.accessSecret,
    {
      expiresIn: AGE_GATE_EXPIRES_IN
    }
  );
}

function verifyAgeGate(body) {
  const accepted = isAccepted(body);

  if (accepted === null) {
    throw createAgeGateError(
      'Request body must include "accepted": true or "over21": true.',
      400
    );
  }

  if (!accepted) {
    throw createAgeGateError("Age verification was not accepted.", 400);
  }

  const ageGateToken = signAgeGateToken();

  return {
    approved: true,
    ageGateToken,
    expiresIn: AGE_GATE_EXPIRES_IN
  };
}

function blockAgeGate(body) {
  const accepted = isAccepted(body);

  if (accepted === null) {
    throw createAgeGateError(
      'Request body must include "accepted": false or "over21": false.',
      400
    );
  }

  if (accepted) {
    throw createAgeGateError("Use POST /api/age-gate/verify for approved age verification.", 400);
  }

  if (env.nodeEnv === "development") {
    console.log("[age-gate] user declined age verification");
  }

  return {
    blocked: true
  };
}

module.exports = {
  AGE_GATE_EXPIRES_IN,
  blockAgeGate,
  verifyAgeGate
};
