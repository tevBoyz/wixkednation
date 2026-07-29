const { sendSms } = require("../../../services/sms/sms.service");
const { isValidEthiopianPhone, normalizePhone } = require("../../../utils/phone");
const prisma = require("../../../config/prisma");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const DEFAULT_TEST_MESSAGE = "This is a test SMS from the backend.";

async function sendAdminTestSms(payload = {}, adminUserId = null) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  const phone = normalizePhone(payload.phone);

  if (!isValidEthiopianPhone(phone)) {
    throw createServiceError(
      "phone must be a valid Ethiopian number (+2519XXXXXXXX or +2517XXXXXXXX).",
      400
    );
  }

  let message = DEFAULT_TEST_MESSAGE;

  if (payload.message !== undefined && payload.message !== null) {
    if (typeof payload.message !== "string" || !payload.message.trim()) {
      throw createServiceError("message must be a non-empty string.", 400);
    }
    message = payload.message.trim();
  }

  const result = await sendSms({
    phone,
    message,
    purpose: "test",
    metadata: {
      requestedByAdminId: adminUserId || null
    }
  });

  if (!result.success) {
    const error = createServiceError(
      result.error || "Failed to send test SMS.",
      502
    );
    error.details = {
      provider: result.provider || null,
      smsLogId: result.smsLogId || null
    };
    throw error;
  }

  return {
    phone,
    provider: result.provider,
    providerRef: result.providerRef || null,
    smsLogId: result.smsLogId || null,
    purpose: "test"
  };
}

async function listSmsLogs(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.phone && String(query.phone).trim()) {
    where.phone = {
      contains: String(query.phone).trim(),
      mode: "insensitive"
    };
  }

  if (query.provider && String(query.provider).trim()) {
    where.provider = {
      equals: String(query.provider).trim(),
      mode: "insensitive"
    };
  }

  if (query.status && String(query.status).trim()) {
    where.status = {
      equals: String(query.status).trim(),
      mode: "insensitive"
    };
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};

    if (query.dateFrom) {
      const from = new Date(query.dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw createServiceError("Invalid dateFrom.", 400);
      }

      where.createdAt.gte = from;
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo);

      if (Number.isNaN(to.getTime())) {
        throw createServiceError("Invalid dateTo.", 400);
      }

      where.createdAt.lte = to;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.smsLog.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.smsLog.count({
      where
    })
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      phone: log.phone,
      message: log.message,
      provider: log.provider,
      providerRef: log.providerRef,
      status: log.status,
      errorMessage: log.errorMessage,
      metadata: log.metadata,
      createdAt: log.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

module.exports = {
  listSmsLogs,
  sendAdminTestSms
};
