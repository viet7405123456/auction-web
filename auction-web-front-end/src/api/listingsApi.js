import { http } from './httpClient.js'

const LISTING_VIEWER_KEY = 'listingViewerKey'

function getOrCreateListingViewerKey() {
  try {
    const existing = localStorage.getItem(LISTING_VIEWER_KEY)
    if (existing) return existing

    const nextKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `viewer-${Date.now()}-${Math.random().toString(16).slice(2)}`

    localStorage.setItem(LISTING_VIEWER_KEY, nextKey)
    return nextKey
  } catch {
    return `viewer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

export async function getListings({
  brand = '',
  addressSell = '',
  title = '',
  auctionStatus,
  page = 0,
  size = 10,
} = {}) {
  const params = { brand, addressSell, title, page, size }
  if (auctionStatus) params.auctionStatus = auctionStatus
  const res = await http.get('/listings/', { params })
  return res.data
}

export async function getMyListings({ page = 0, size = 10 } = {}) {
  const res = await http.get('/listings/mine', { params: { page, size } })
  return res.data
}

export async function getListingById(listingId, { trackView = true } = {}) {
  const headers = trackView ? { 'X-Viewer-Key': getOrCreateListingViewerKey() } : undefined
  const res = await http.get(`/listings/${listingId}`, { headers })
  return res.data
}

export async function getListingAuctions(listingId) {
  const res = await http.get(`/listings/${listingId}/auctions`)
  return res.data
}

export async function createListing(payload) {
  const res = await http.post('/listings/', payload)
  return res.data
}

export async function getAuctionRoomMessages(auctionId) {
  const res = await http.get(`/auctions/${auctionId}/room/messages`)
  return res.data
}

export async function sendAuctionRoomMessage(auctionId, payload) {
  const res = await http.post(`/auctions/${auctionId}/room/messages`, payload)
  return res.data
}

export async function checkListingNotSold(listingId) {
  const res = await http.get(`/listings/${listingId}/notSold`, { skipAuth: true })
  return Boolean(res.data)
}

export async function getListingEngagement(listingId) {
  const res = await http.get(`/listings/${listingId}/engagement`)
  return res.data
}

export async function getListingComments(listingId, { page, size } = {}) {
  const hasPaging = page != null || size != null

  if (hasPaging) {
    const params = {}
    if (page != null) params.page = page
    if (size != null) params.size = size

    const res = await http.get(`/listings/${listingId}/comments/page`, { params })
    return res.data
  }

  const res = await http.get(`/listings/${listingId}/comments`)
  return res.data
}

export async function createListingComment(listingId, payload) {
  const res = await http.post(`/listings/${listingId}/comments`, payload)
  return res.data
}

export async function toggleListingReaction(listingId) {
  const res = await http.post(`/listings/${listingId}/reactions/toggle`)
  return res.data
}
