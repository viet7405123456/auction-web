const AUCTION_HISTORY_NOTIFICATION_TYPES = new Set(['AUCTION_WON', 'AUCTION_LOST'])
const AUCTION_LISTING_NOTIFICATION_TYPES = new Set([
  'OUTBID',
  'AUCTION_WON',
  'AUCTION_LOST',
  'AUCTION_STARTED',
])

export function normalizeNotificationType(type) {
  return String(type || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase()
}

function toNumeric(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null
}

function getAuctionId(notification) {
  return toNumeric(notification?.referenceId)
}

function getListingIdFromCachedAuctions(auctionId, auctionsByListingId) {
  if (!auctionId || !auctionsByListingId || typeof auctionsByListingId !== 'object') return null

  for (const [listingKey, auctions] of Object.entries(auctionsByListingId)) {
    if (!Array.isArray(auctions)) continue

    const matched = auctions.some((auction) => Number(auction?.auctionId) === Number(auctionId))
    if (matched) {
      return toNumeric(listingKey)
    }
  }

  return null
}

function getListingIdFromMessage(notification) {
  const text = `${notification?.title || ''} ${notification?.message || ''}`
  const matched = text.match(/(?:bai dang|bài đăng|san pham|sản phẩm)\s*#\s*(\d+)/i)
  return matched ? toNumeric(matched[1]) : null
}

function shouldOpenAuctionHistory(type) {
  return AUCTION_HISTORY_NOTIFICATION_TYPES.has(type)
}

export async function buildNotificationNavigationTarget(notification, options = {}) {
  const type = normalizeNotificationType(notification?.type)
  if (!AUCTION_LISTING_NOTIFICATION_TYPES.has(type)) return null

  const auctionId = getAuctionId(notification)
  if (!auctionId) return null

  const cachedListingId =
    getListingIdFromCachedAuctions(auctionId, options.auctionsByListingId) ||
    getListingIdFromMessage(notification)

  let listingId = cachedListingId

  if (!listingId && typeof options.getAuctionById === 'function') {
    try {
      const detail = await options.getAuctionById(auctionId)
      listingId =
        toNumeric(detail?.listingId) ||
        toNumeric(detail?.listing?.id)
    } catch {
      listingId = null
    }
  }

  if (listingId) {
    if (shouldOpenAuctionHistory(type)) {
      return {
        to: `/listings/${listingId}?auctionId=${auctionId}`,
        type,
      }
    }

    return {
      to: `/listings/${listingId}`,
      type,
    }
  }

  return {
    to: `/auctions?auctionId=${auctionId}`,
    type,
  }
}
