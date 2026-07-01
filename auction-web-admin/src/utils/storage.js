const STORAGE_KEY = 'auction_admin_db_v1'
const AUTH_KEY = 'auction_admin_auth_v1'

function nowIso() {
  return new Date().toISOString()
}

function daysAgoIso(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function picsum(seed, w = 900, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

function seedDb() {
  const users = [
    {
      userId: 1,
      name: 'Nguyễn Văn A',
      email: 'a@example.com',
      role: 'USER',
      enabled: true,
      accountLocked: false,
      isVerified: false,
      createdAt: daysAgoIso(40),
      updatedAt: daysAgoIso(2),
      profile: {
        id: 101,
        fullname: 'Nguyễn Văn A',
        phoneNumber: '0901000001',
        avatarUrl: picsum('avatar-a', 256, 256),
        CCCDtruocUrl: picsum('cccd-a-front', 900, 600),
        CCCDsauUrl: picsum('cccd-a-back', 900, 600),
        gender: 'Nam',
        dateOfBirth: '1997-05-12',
        address: '12 Nguyễn Trãi',
        city: 'Hà Nội',
        cccdNumber: '001097000001',
        dateOfIssueCCCD: '2020-01-15',
        placeOfIssueCCCD: 'Hà Nội',
        commune: 'Phường 1',
        totalAuctionsJoined: 3,
        totalWins: 1,
        rating: 4.6,
        createdAt: daysAgoIso(40),
        updatedAt: daysAgoIso(2),
      },
    },
    {
      userId: 2,
      name: 'Trần Thị B',
      email: 'b@example.com',
      role: 'USER',
      enabled: true,
      accountLocked: false,
      isVerified: true,
      createdAt: daysAgoIso(90),
      updatedAt: daysAgoIso(1),
      profile: {
        id: 102,
        fullname: 'Trần Thị BC',
        phoneNumber: '0902000002',
        avatarUrl: picsum('avatar-b', 256, 256),
        CCCDtruocUrl: picsum('cccd-b-front', 900, 600),
        CCCDsauUrl: picsum('cccd-b-back', 900, 600),
        gender: 'Nữ',
        dateOfBirth: '1995-11-02',
        address: '45 Lê Lợi',
        city: 'Đà Nẵng',
        cccdNumber: '048095000002',
        dateOfIssueCCCD: '2019-08-20',
        placeOfIssueCCCD: 'Đà Nẵng',
        commune: 'Phường 2',
        totalAuctionsJoined: 8,
        totalWins: 2,
        rating: 4.8,
        createdAt: daysAgoIso(90),
        updatedAt: daysAgoIso(1),
      },
    },
    {
      userId: 3,
      name: 'Lê Văn CB',
      email: 'c@example.com',
      role: 'USER',
      enabled: false,
      accountLocked: true,
      isVerified: false,
      createdAt: daysAgoIso(15),
      updatedAt: daysAgoIso(10),
      profile: {
        id: 103,
        fullname: 'Lê Văn C',
        phoneNumber: '0903000003',
        avatarUrl: picsum('avatar-c', 256, 256),
        CCCDtruocUrl: picsum('cccd-c-front', 900, 600),
        CCCDsauUrl: picsum('cccd-c-back', 900, 600),
        gender: 'Nam',
        dateOfBirth: '2000-03-22',
        address: '89 Pasteur',
        city: 'TP. HCM',
        cccdNumber: '079100000003',
        dateOfIssueCCCD: '2021-09-10',
        placeOfIssueCCCD: 'TP. HCM',
        commune: 'Phường 3',
        totalAuctionsJoined: 1,
        totalWins: 0,
        rating: 3.9,
        createdAt: daysAgoIso(15),
        updatedAt: daysAgoIso(10),
      },
    },
  ]

  const listings = [
    {
      id: 1001,
      car: {
        carId: 5001,
        name: 'Toyota Camry',
        brand: 'Toyota',
        model: 'Camry 2.5Q',
        year: 2021,
        origin: 'Nhật Bản',
        fuelType: 'GASOLINE',
        horsepower: '203 hp',
        mileage: 28000,
        color: 'Đen',
        thumbnailUrl: picsum('car-camry-thumb', 640, 360),
        transmission: 'AUTOMATIC',
        bodyType: 'SEDAN',
        engine: '2.5L',
        description: 'Xe gia đình, bảo dưỡng định kỳ, nội thất sạch.',
        seats: 5,
        createdAt: daysAgoIso(20),
        updatedAt: daysAgoIso(5),
        carImages: [
          { imageId: 9001, sortOrder: 0, imageUrl: picsum('camry-1', 1200, 800) },
          { imageId: 9002, sortOrder: 1, imageUrl: picsum('camry-2', 1200, 800) },
          { imageId: 9003, sortOrder: 2, imageUrl: picsum('camry-3', 1200, 800) },
        ],
      },
      sellerId: 1,
      status: 'PENDING',
      title: 'Camry 2021 - Xe đẹp, đi ít',
      description: 'Đăng bán Camry 2021, odo 28k, full lịch sử bảo dưỡng.',
      inspectionReportUrl: picsum('report-camry', 1200, 800),
      inspectionGrade: 'A',
      submittedAt: daysAgoIso(4),
      approvedAt: null,
      rejectedReason: null,
      reviewedByUserId: null,
      reviewNote: '',
      createdAt: daysAgoIso(20),
      updatedAt: daysAgoIso(4),
      documents: [
        {
          documentId: 7001,
          type: 'REGISTRATION',
          fileUrl: picsum('doc-reg-camry', 1200, 800),
          mimeType: 'image/jpeg',
          fileSize: 245000,
          createdAt: daysAgoIso(4),
          updatedAt: daysAgoIso(4),
        },
        {
          documentId: 7002,
          type: 'INSPECTION',
          fileUrl: picsum('doc-insp-camry', 1200, 800),
          mimeType: 'image/jpeg',
          fileSize: 332000,
          createdAt: daysAgoIso(4),
          updatedAt: daysAgoIso(4),
        },
      ],
    },
    {
      id: 1002,
      car: {
        carId: 5002,
        name: 'Mazda CX-5',
        brand: 'Mazda',
        model: 'CX-5 2.0',
        year: 2020,
        origin: 'Nhật Bản',
        fuelType: 'GASOLINE',
        horsepower: '154 hp',
        mileage: 42000,
        color: 'Trắng',
        thumbnailUrl: picsum('car-cx5-thumb', 640, 360),
        transmission: 'AUTOMATIC',
        bodyType: 'SUV',
        engine: '2.0L',
        description: 'Xe một chủ, lốp mới thay.',
        seats: 5,
        createdAt: daysAgoIso(60),
        updatedAt: daysAgoIso(12),
        carImages: [
          { imageId: 9011, sortOrder: 0, imageUrl: picsum('cx5-1', 1200, 800) },
          { imageId: 9012, sortOrder: 1, imageUrl: picsum('cx5-2', 1200, 800) },
        ],
      },
      sellerId: 2,
      status: 'APPROVED',
      title: 'Mazda CX-5 2020 - Đã kiểm định',
      description: 'Xe đã được kiểm định, giấy tờ đầy đủ.',
      inspectionReportUrl: picsum('report-cx5', 1200, 800),
      inspectionGrade: 'B+',
      submittedAt: daysAgoIso(12),
      approvedAt: daysAgoIso(10),
      rejectedReason: null,
      reviewedByUserId: 0,
      reviewNote: 'Hồ sơ đầy đủ. Duyệt đăng.',
      createdAt: daysAgoIso(60),
      updatedAt: daysAgoIso(10),
      documents: [
        {
          documentId: 7011,
          type: 'REGISTRATION',
          fileUrl: picsum('doc-reg-cx5', 1200, 800),
          mimeType: 'image/jpeg',
          fileSize: 221000,
          createdAt: daysAgoIso(12),
          updatedAt: daysAgoIso(12),
        },
      ],
    },
    {
      id: 1003,
      car: {
        carId: 5003,
        name: 'Kia Morning',
        brand: 'Kia',
        model: 'Morning 1.25',
        year: 2018,
        origin: 'Hàn Quốc',
        fuelType: 'GASOLINE',
        horsepower: '86 hp',
        mileage: 68000,
        color: 'Đỏ',
        thumbnailUrl: picsum('car-morning-thumb', 640, 360),
        transmission: 'AUTOMATIC',
        bodyType: 'HATCHBACK',
        engine: '1.25L',
        description: 'Xe nhỏ gọn, phù hợp đi phố.',
        seats: 5,
        createdAt: daysAgoIso(120),
        updatedAt: daysAgoIso(30),
        carImages: [{ imageId: 9021, sortOrder: 0, imageUrl: picsum('morning-1', 1200, 800) }],
      },
      sellerId: 3,
      status: 'REJECTED',
      title: 'Kia Morning 2018 - Giá tốt',
      description: 'Xe chạy ổn, giá thương lượng.',
      inspectionReportUrl: null,
      inspectionGrade: null,
      submittedAt: daysAgoIso(30),
      approvedAt: null,
      rejectedReason: 'Thiếu ảnh giấy đăng ký xe rõ nét.',
      reviewedByUserId: 0,
      reviewNote: 'Vui lòng bổ sung giấy tờ/ảnh rõ.',
      createdAt: daysAgoIso(120),
      updatedAt: daysAgoIso(29),
      documents: [
        {
          documentId: 7021,
          type: 'REGISTRATION',
          fileUrl: picsum('doc-reg-morning', 1200, 800),
          mimeType: 'image/jpeg',
          fileSize: 102000,
          createdAt: daysAgoIso(30),
          updatedAt: daysAgoIso(30),
        },
      ],
    },
  ]

  const auctions = [
    {
      auctionId: 2001,
      listingId: 1001,
      sellerId: 1,
      title: 'Phiên đấu giá Camry 2021',
      version: 0,
      extendedCount: 0,
      startTime: daysAgoIso(1),
      endTime: daysAgoIso(-2),
      startingPrice: 850000000,
      reservePrice: 900000000,
      bidIncrement: 10000000,
      currentHighestBid: null,
      currentHighestBidderId: null,
      totalBids: 0,
      status: 'PENDING',
      closeReason: null,
      reviewNote: '',
      rejectedReason: null,
      approvedAt: null,
      reviewedByUserId: null,
      softCloseEnabled: true,
      softCloseTriggerSeconds: 120,
      softCloseExtendSeconds: 120,
      auctionResult: null,
      createdAt: daysAgoIso(2),
      updatedAt: daysAgoIso(1),
    },
    {
      auctionId: 2002,
      listingId: 1002,
      sellerId: 2,
      title: 'Phiên đấu giá Mazda CX-5 2020',
      version: 3,
      extendedCount: 1,
      startTime: daysAgoIso(9),
      endTime: daysAgoIso(6),
      startingPrice: 690000000,
      reservePrice: 740000000,
      bidIncrement: 5000000,
      currentHighestBid: 758000000,
      currentHighestBidderId: 1,
      totalBids: 14,
      status: 'ENDED',
      closeReason: 'RESERVE_MET',
      reviewNote: 'Hồ sơ xe đầy đủ, cho phép mở đấu giá.',
      rejectedReason: null,
      approvedAt: daysAgoIso(10),
      reviewedByUserId: 0,
      softCloseEnabled: true,
      softCloseTriggerSeconds: 120,
      softCloseExtendSeconds: 120,
      auctionResult: {
        auctionId: 2002,
        winnerUserId: 1,
        winnerBidAmount: 758000000,
        closedAt: daysAgoIso(6),
      },
      createdAt: daysAgoIso(11),
      updatedAt: daysAgoIso(6),
    },
    {
      auctionId: 2003,
      listingId: 1003,
      sellerId: 3,
      title: 'Phiên đấu giá Kia Morning 2018',
      version: 1,
      extendedCount: 0,
      startTime: daysAgoIso(4),
      endTime: daysAgoIso(1),
      startingPrice: 250000000,
      reservePrice: 290000000,
      bidIncrement: 2000000,
      currentHighestBid: null,
      currentHighestBidderId: null,
      totalBids: 0,
      status: 'REJECTED',
      closeReason: 'LISTING_NOT_APPROVED',
      reviewNote: 'Thông tin xe chưa rõ ràng.',
      rejectedReason: 'Listing đang bị từ chối, cần cập nhật lại hồ sơ trước khi mở đấu giá.',
      approvedAt: null,
      reviewedByUserId: 0,
      softCloseEnabled: true,
      softCloseTriggerSeconds: 120,
      softCloseExtendSeconds: 120,
      auctionResult: null,
      createdAt: daysAgoIso(5),
      updatedAt: daysAgoIso(4),
    },
  ]

  return { users, listings, auctions, meta: { version: 2, createdAt: nowIso(), updatedAt: nowIso() } }
}

function normalizeAuction(rawAuction) {
  const auction = rawAuction || {}
  const legacyCurrentPrice = auction.currentPrice ?? null
  const legacyWinnerUserId = auction.winnerUserId ?? null
  const legacyStartsAt = auction.startsAt ?? null
  const legacyEndsAt = auction.endsAt ?? null

  const normalized = {
    ...auction,
    version: auction.version ?? 0,
    extendedCount: auction.extendedCount ?? 0,
    startTime: auction.startTime || legacyStartsAt,
    endTime: auction.endTime || legacyEndsAt,
    startingPrice: auction.startingPrice ?? auction.startPrice ?? null,
    reservePrice: auction.reservePrice ?? null,
    bidIncrement: auction.bidIncrement ?? null,
    currentHighestBid: auction.currentHighestBid ?? legacyCurrentPrice,
    currentHighestBidderId: auction.currentHighestBidderId ?? null,
    closeReason: auction.closeReason ?? null,
    softCloseEnabled: auction.softCloseEnabled ?? true,
    softCloseTriggerSeconds: auction.softCloseTriggerSeconds ?? 120,
    softCloseExtendSeconds: auction.softCloseExtendSeconds ?? 120,
  }

  if (!normalized.auctionResult && legacyWinnerUserId) {
    normalized.auctionResult = {
      auctionId: normalized.auctionId,
      winnerUserId: legacyWinnerUserId,
      winnerBidAmount: normalized.currentHighestBid,
      closedAt: normalized.endTime || normalized.updatedAt,
    }
  }

  if (normalized.auctionResult) {
    normalized.auctionResult = {
      auctionId: normalized.auctionId,
      winnerUserId: normalized.auctionResult.winnerUserId ?? null,
      winnerBidAmount: normalized.auctionResult.winnerBidAmount ?? normalized.currentHighestBid ?? null,
      closedAt: normalized.auctionResult.closedAt || normalized.endTime || normalized.updatedAt,
    }
  }

  return normalized
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

export function saveDb(db) {
  const next = {
    ...db,
    meta: {
      ...(db.meta || {}),
      updatedAt: new Date().toISOString(),
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function ensureSeeded() {
  const existing = loadDb()
  if (existing && Array.isArray(existing.users) && Array.isArray(existing.listings)) {
    const seeded = seedDb()
    const sourceAuctions = Array.isArray(existing.auctions) ? existing.auctions : seeded.auctions
    const normalizedAuctions = sourceAuctions.map(normalizeAuction)
    const migrated = {
      ...existing,
      auctions: normalizedAuctions,
      meta: {
        ...(existing.meta || {}),
        version: 2,
        updatedAt: nowIso(),
      },
    }
    saveDb(migrated)
    return migrated
  }
  const seeded = seedDb()
  saveDb(seeded)
  return seeded
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

export function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY)
  ensureSeeded()
}
