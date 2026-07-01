import { ensureSeeded, loadDb, saveDb } from '../utils/storage.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withLatency(result, ms = 250) {
  await sleep(ms)
  return result
}

export async function apiGetUsers() {
  ensureSeeded()
  const db = loadDb()
  return withLatency(db.users)
}

export async function apiPatchUser(userId, patch) {
  ensureSeeded()
  const db = loadDb()
  const idx = db.users.findIndex((u) => u.userId === userId)
  if (idx < 0) throw new Error('User not found')

  const current = db.users[idx]
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    profile: patch.profile ? { ...current.profile, ...patch.profile, updatedAt: new Date().toISOString() } : current.profile,
  }

  db.users[idx] = updated
  saveDb(db)
  return withLatency(updated)
}

export async function apiGetListings() {
  ensureSeeded()
  const db = loadDb()
  return withLatency(db.listings)
}

export async function apiPatchListing(listingId, patch) {
  ensureSeeded()
  const db = loadDb()
  const idx = db.listings.findIndex((l) => l.id === listingId)
  if (idx < 0) throw new Error('Listing not found')

  const current = db.listings[idx]
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  db.listings[idx] = updated
  saveDb(db)
  return withLatency(updated)
}

export async function apiGetAuctions() {
  ensureSeeded()
  const db = loadDb()
  return withLatency(db.auctions || [])
}

export async function apiPatchAuction(auctionId, patch) {
  ensureSeeded()
  const db = loadDb()
  const auctions = Array.isArray(db.auctions) ? db.auctions : []
  const idx = auctions.findIndex((a) => a.auctionId === auctionId)
  if (idx < 0) throw new Error('Auction not found')

  const current = auctions[idx]
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  auctions[idx] = updated
  db.auctions = auctions
  saveDb(db)
  return withLatency(updated)
}
