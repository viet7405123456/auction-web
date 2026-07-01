import { http } from './httpClient.js'

export async function getAuctionDetail(auctionId) {
  const res = await http.get(`/auctions/${auctionId}`)
  return res.data
}

export async function getAuctionBids(auctionId) {
  const res = await http.get(`/auctions/${auctionId}/bids`)
  return res.data
}

export async function createAuction(payload) {
  const res = await http.post('/auctions/', payload)
  return res.data
}

export async function placeBid(auctionId, bidAmount) {
  const res = await http.post(`/auctions/${auctionId}/bids`, { bidAmount })
  return res.data
}

export async function getMyProxyBid(auctionId) {
  const res = await http.get(`/auctions/${auctionId}/proxy-bids/me`)
  return res.data
}

export async function setProxyBid(auctionId, maxBidAmount) {
  const res = await http.post(`/auctions/${auctionId}/proxy-bids`, { maxBidAmount })
  return res.data
}

export async function disableProxyBid(auctionId) {
  const res = await http.delete(`/auctions/${auctionId}/proxy-bids`)
  return res.data
}

export async function getAuctionResult(auctionId) {
  const res = await http.get(`/auctions/${auctionId}/result`)
  return res.data
}
