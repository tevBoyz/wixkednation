const prisma = require("../../config/prisma");

/**
 * Active promo banners: isActive, not deleted, within optional schedule window.
 */
function activeBannerWhere(now = new Date()) {
  return {
    isActive: true,
    deletedAt: null,
    AND: [
      {
        OR: [{ startsAt: null }, { startsAt: { lte: now } }]
      },
      {
        OR: [{ endsAt: null }, { endsAt: { gte: now } }]
      }
    ]
  };
}

/**
 * @param {string[]} skuIds
 * @returns {Promise<Map<string, number>>} skuId -> lowest active salePrice
 */
async function getActiveSalePricesBySkuIds(skuIds) {
  const uniqueIds = [
    ...new Set(
      (skuIds || []).filter((id) => typeof id === "string" && id.length > 0)
    )
  ];

  const map = new Map();
  if (uniqueIds.length === 0) {
    return map;
  }

  const banners = await prisma.promoBanner.findMany({
    where: {
      ...activeBannerWhere(),
      skuId: { in: uniqueIds }
    },
    select: {
      skuId: true,
      salePrice: true
    }
  });

  for (const banner of banners) {
    const price = Number(banner.salePrice);
    if (!Number.isFinite(price)) {
      continue;
    }
    const existing = map.get(banner.skuId);
    if (existing == null || price < existing) {
      map.set(banner.skuId, price);
    }
  }

  return map;
}

/**
 * @param {string} skuId
 * @param {number|string|null|undefined} listPrice
 * @returns {Promise<number|null>}
 */
async function resolveEffectiveSkuPrice(skuId, listPrice) {
  const list =
    listPrice == null || listPrice === ""
      ? null
      : Number(listPrice);

  if (!skuId) {
    return Number.isFinite(list) ? list : null;
  }

  const saleMap = await getActiveSalePricesBySkuIds([skuId]);
  if (saleMap.has(skuId)) {
    return saleMap.get(skuId);
  }

  return Number.isFinite(list) ? list : null;
}

/**
 * Apply sale map over list price.
 * @param {string} skuId
 * @param {number|string|null|undefined} listPrice
 * @param {Map<string, number>} saleMap
 */
function effectivePriceFromMap(skuId, listPrice, saleMap) {
  if (skuId && saleMap && saleMap.has(skuId)) {
    return saleMap.get(skuId);
  }
  const list =
    listPrice == null || listPrice === ""
      ? null
      : Number(listPrice);
  return Number.isFinite(list) ? list : null;
}

module.exports = {
  activeBannerWhere,
  effectivePriceFromMap,
  getActiveSalePricesBySkuIds,
  resolveEffectiveSkuPrice
};
