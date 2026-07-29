const prisma = require("../../config/prisma");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, fieldName = "id") {
  if (!value || typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw createServiceError(`Invalid ${fieldName}.`, 400);
  }

  return value;
}

function mapNotification(notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    orderId: notification.orderId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
}

async function listNotifications(userId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {
    userId
  };

  if (query.isRead === "true" || query.isRead === true) {
    where.isRead = true;
  } else if (query.isRead === "false" || query.isRead === false) {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.notification.count({
      where
    }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
  ]);

  return {
    notifications: notifications.map(mapNotification),
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function markNotificationRead(userId, notificationId) {
  assertUuid(notificationId, "notificationId");

  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!existing) {
    throw createServiceError("Notification not found.", 404);
  }

  if (existing.isRead) {
    return mapNotification(existing);
  }

  const notification = await prisma.notification.update({
    where: {
      id: existing.id
    },
    data: {
      isRead: true
    }
  });

  return mapNotification(notification);
}

async function markAllNotificationsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return {
    updatedCount: result.count
  };
}

module.exports = {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
};
