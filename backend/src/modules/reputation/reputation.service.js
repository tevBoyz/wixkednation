const prisma = require("../../config/prisma");

function mapReputation(user) {
  return {
    reputationScore: user.reputationScore ?? 0,
    deliveredOrderCount: user.deliveredOrderCount ?? 0,
    cancelledOrderCount: user.cancelledOrderCount ?? 0
  };
}

async function applyDeliveryCredit(userId, tx = prisma) {
  return tx.user.update({
    where: {
      id: userId
    },
    data: {
      reputationScore: {
        increment: 1
      },
      deliveredOrderCount: {
        increment: 1
      }
    },
    select: {
      id: true,
      reputationScore: true,
      deliveredOrderCount: true,
      cancelledOrderCount: true
    }
  });
}

async function applyCustomerCancelPenalty(userId, tx = prisma) {
  return tx.user.update({
    where: {
      id: userId
    },
    data: {
      reputationScore: {
        decrement: 1
      },
      cancelledOrderCount: {
        increment: 1
      }
    },
    select: {
      id: true,
      reputationScore: true,
      deliveredOrderCount: true,
      cancelledOrderCount: true
    }
  });
}

async function getUserReputation(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      reputationScore: true,
      deliveredOrderCount: true,
      cancelledOrderCount: true
    }
  });

  if (!user) {
    return null;
  }

  return mapReputation(user);
}

module.exports = {
  applyCustomerCancelPenalty,
  applyDeliveryCredit,
  getUserReputation,
  mapReputation
};
