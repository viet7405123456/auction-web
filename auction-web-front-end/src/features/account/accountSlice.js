import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  changeMyPassword as changeMyPasswordApi,
  completeMyPayment,
  getAccountOverview,
  getMyLikedListings,
  getMyPayments,
  getMyProfile,
  getMyWonAuctions,
  updateMyAvatar,
} from '../../api/accountApi.js'
import {
  createListing,
  getListingAuctions,
  getListingById,
  getMyListings,
} from '../../api/listingsApi.js'
import { createAuction, getAuctionBids, placeBid } from '../../api/auctionsApi.js'
import {
  createOrGetDirectConversation,
  getConversationMessages,
  getConversations,
  markConversationAsRead,
  getUnreadMessageCount,
  sendConversationMessage,
} from '../../api/chatApi.js'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../../api/notificationsApi.js'

function toTime(value) {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : 0
}

function sortConversationsByLatest(conversations = []) {
  return [...conversations].sort((a, b) => {
    const bTime = Math.max(toTime(b?.lastMessageAt), toTime(b?.updatedAt), toTime(b?.createdAt))
    const aTime = Math.max(toTime(a?.lastMessageAt), toTime(a?.updatedAt), toTime(a?.createdAt))
    if (bTime !== aTime) return bTime - aTime
    return Number(b?.conversationId || 0) - Number(a?.conversationId || 0)
  })
}

function normalizeProfile(profile) {
  if (!profile) return null

  const profileSnapshot = profile.profile && typeof profile.profile === 'object' ? profile.profile : null
  const verifiedValue =
    profile.isVerified ??
    profile.verified ??
    profileSnapshot?.isVerified ??
    profileSnapshot?.verified ??
    false

  return {
    ...profile,
    isVerified: Boolean(verifiedValue),
    verified: Boolean(verifiedValue),
  }
}

function isVerifiedAccount(state) {
  return Boolean(state?.account?.profile?.isVerified)
}

const initialState = {
  status: 'idle',
  error: null,
  profile: null,
  overview: {
    listingsCreated: 0,
    auctionsCreated: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  },
  listings: {
    items: [],
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    selectedId: null,
    selectedDetail: null,
    auctionsByListingId: {},
    bidsByAuctionId: {},
  },
  chats: {
    conversations: [],
    selectedConversationId: null,
    messagesByConversationId: {},
    messagePagingByConversationId: {},
    unreadCount: 0,
  },
  notifications: {
    items: [],
    page: 0,
    size: 10,
    totalPages: 1,
    unreadCount: 0,
    isLoading: false,
  },
  likedListings: {
    items: [],
    page: 0,
    size: 6,
    totalPages: 1,
    isLoading: false,
    hasFetched: false,
  },
  wonAuctions: {
    items: [],
    page: 0,
    size: 6,
    totalPages: 1,
    isLoading: false,
    hasFetched: false,
  },
  payments: {
    items: [],
    page: 0,
    size: 10,
    totalPages: 1,
    isLoading: false,
    hasFetched: false,
  },
}

export const bootstrapAccount = createAsyncThunk('account/bootstrap', async () => {
  const [profile, overview, chatUnread, notificationUnread, conversations, notifications] =
    await Promise.all([
      getMyProfile(),
      getAccountOverview(),
      getUnreadMessageCount(),
      getUnreadNotificationCount(),
      getConversations(),
      getNotifications({ page: 0, size: 5 }),
    ])

  return {
    profile,
    overview,
    chatUnread: Number(chatUnread?.unreadCount || 0),
    notificationUnread: Number(notificationUnread?.unreadCount || 0),
    conversations: Array.isArray(conversations) ? conversations : [],
    notifications,
  }
})

export const fetchMyListings = createAsyncThunk(
  'account/fetchMyListings',
  async ({ page = 0, size = 10 } = {}) => {
    const res = await getMyListings({ page, size })
    return {
      items: res?.content || [],
      page: res?.number ?? page,
      size: res?.size ?? size,
      totalPages: res?.totalPages ?? 1,
      totalElements: res?.totalElements ?? 0,
    }
  },
)

export const fetchListingDetail = createAsyncThunk('account/fetchListingDetail', async (listingId) => {
  const [detail, auctions] = await Promise.all([
    getListingById(listingId, { trackView: true }),
    getListingAuctions(listingId),
  ])
  return { listingId, detail, auctions: Array.isArray(auctions) ? auctions : [] }
})

export const fetchAuctionBids = createAsyncThunk('account/fetchAuctionBids', async (auctionId) => {
  const bids = await getAuctionBids(auctionId)
  return { auctionId, bids: Array.isArray(bids) ? bids : [] }
})

export const createMyListing = createAsyncThunk(
  'account/createMyListing',
  async (payload, { rejectWithValue, getState }) => {
    try {
      if (!isVerifiedAccount(getState())) {
        return rejectWithValue('Chỉ tài khoản đã xác thực mới được tạo bài đăng.')
      }
      console.log('Redux thunk: Creating listing with payload:', payload)
      const result = await createListing(payload)
      console.log('Redux thunk: Successfully created listing:', result)
      return result
    } catch (error) {
      console.error('Redux thunk: Error creating listing:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      })
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Tạo bài đăng thất bại'
      return rejectWithValue(errorMsg)
    }
  },
)

export const createListingAuction = createAsyncThunk(
  'account/createListingAuction',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('Redux thunk: Creating auction with payload:', payload)
      const result = await createAuction(payload)
      console.log('Redux thunk: Successfully created auction:', result)
      return result
    } catch (error) {
      console.error('Redux thunk: Error creating auction:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      })
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Tạo phiên đấu giá thất bại'
      return rejectWithValue(errorMsg)
    }
  },
)

export const submitBid = createAsyncThunk(
  'account/submitBid',
  async ({ auctionId, bidAmount }, { rejectWithValue, getState }) => {
    try {
      if (!isVerifiedAccount(getState())) {
        return rejectWithValue('Chỉ tài khoản đã xác thực mới được tham gia đặt bid.')
      }
      return await placeBid(auctionId, bidAmount)
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Đặt giá thất bại'
      return rejectWithValue(errorMsg)
    }
  },
)

export const fetchConversations = createAsyncThunk('account/fetchConversations', async () => {
  const data = await getConversations()
  return Array.isArray(data) ? data : []
})

export const fetchConversationMessages = createAsyncThunk(
  'account/fetchConversationMessages',
  async ({ conversationId, page = 0, size = 10, append = false } = {}) => {
    const res = await getConversationMessages(conversationId, { page, size })
    const content = Array.isArray(res?.content) ? [...res.content].reverse() : []
    const totalPages = Number(res?.totalPages ?? 1)
    const currentPage = Number(res?.number ?? page)
    return {
      conversationId,
      content,
      page: currentPage,
      size,
      append,
      hasMore: currentPage + 1 < totalPages,
    }
  },
)

export const sendMessage = createAsyncThunk(
  'account/sendMessage',
  async ({ conversationId, content, imageUrl = null, clientMessageId = null }) => {
    const msg = await sendConversationMessage(conversationId, { content, imageUrl, clientMessageId })
    return { conversationId, msg }
  },
)

export const startDirectConversation = createAsyncThunk(
  'account/startDirectConversation',
  async ({ targetUserId }) => {
    const conversation = await createOrGetDirectConversation(targetUserId)
    return conversation
  },
)

export const markConversationRead = createAsyncThunk(
  'account/markConversationRead',
  async ({ conversationId, readerId }) => {
    await markConversationAsRead(conversationId)
    return { conversationId, readerId }
  },
)

export const fetchNotificationsPage = createAsyncThunk(
  'account/fetchNotificationsPage',
  async ({ page = 0, size = 10, append = false } = {}) => {
    const res = await getNotifications({ page, size })
    return {
      items: Array.isArray(res?.content) ? res.content : [],
      page: res?.number ?? page,
      size: res?.size ?? size,
      totalPages: res?.totalPages ?? 1,
      append,
    }
  },
)

export const readNotifications = createAsyncThunk('account/readNotifications', async (notificationIds) => {
  await markNotificationsRead(notificationIds)
  return notificationIds
})

export const readAllNotifications = createAsyncThunk('account/readAllNotifications', async () => {
  await markAllNotificationsRead()
  return true
})

export const fetchLikedListingsPage = createAsyncThunk(
  'account/fetchLikedListingsPage',
  async ({ page = 0, size = 6, append = false } = {}) => {
    const res = await getMyLikedListings({ page, size })
    return {
      items: Array.isArray(res?.content) ? res.content : [],
      page: res?.number ?? page,
      size: res?.size ?? size,
      totalPages: res?.totalPages ?? 1,
      append,
    }
  },
)

export const fetchWonAuctionsPage = createAsyncThunk(
  'account/fetchWonAuctionsPage',
  async ({ page = 0, size = 6, append = false } = {}) => {
    const res = await getMyWonAuctions({ page, size })
    return {
      items: Array.isArray(res?.content) ? res.content : [],
      page: res?.number ?? page,
      size: res?.size ?? size,
      totalPages: res?.totalPages ?? 1,
      append,
    }
  },
)

export const fetchPaymentsPage = createAsyncThunk(
  'account/fetchPaymentsPage',
  async ({ page = 0, size = 10, append = false } = {}) => {
    const res = await getMyPayments({ page, size })
    return {
      items: Array.isArray(res?.content) ? res.content : [],
      page: res?.number ?? page,
      size: res?.size ?? size,
      totalPages: res?.totalPages ?? 1,
      append,
    }
  },
)

export const completePayment = createAsyncThunk(
  'account/completePayment',
  async (paymentId) => {
    const payment = await completeMyPayment(paymentId)
    return payment
  },
)

export const updateProfileAvatar = createAsyncThunk(
  'account/updateProfileAvatar',
  async (avatarUrl, { rejectWithValue }) => {
    try {
      return await updateMyAvatar(avatarUrl)
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Cập nhật ảnh đại diện thất bại'
      return rejectWithValue(errorMsg)
    }
  },
)

export const changeMyPassword = createAsyncThunk(
  'account/changeMyPassword',
  async ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      return await changeMyPasswordApi({ currentPassword, newPassword, confirmPassword })
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Đổi mật khẩu thất bại'
      return rejectWithValue(errorMsg)
    }
  },
)

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setSelectedListing(state, action) {
      const nextId = action.payload == null ? null : Number(action.payload)
      state.listings.selectedId = nextId

      if (nextId == null) {
        state.listings.selectedDetail = null
        return
      }

      const currentDetailId = Number(
        state.listings.selectedDetail?.id ?? state.listings.selectedDetail?.listingId,
      )
      if (!Number.isFinite(currentDetailId) || currentDetailId !== nextId) {
        state.listings.selectedDetail = null
      }
    },
    setSelectedConversation(state, action) {
      state.chats.selectedConversationId = action.payload
    },
    clearAccountError(state) {
      state.error = null
    },
    receiveRealtimeMessage(state, action) {
      const { conversationId, message } = action.payload || {}
      if (!conversationId || !message) return
      const key = String(conversationId)
      const current = state.chats.messagesByConversationId[key] || []
      const exists = current.some((m) => m.messageId === message.messageId)
      if (!exists) {
        state.chats.messagesByConversationId[key] = [...current, message]
      }

      const idx = state.chats.conversations.findIndex(
        (c) => Number(c.conversationId) === Number(conversationId),
      )
      if (idx >= 0) {
        const mine = Number(message.senderId) === Number(state.profile?.userId)
        const isCurrentConversation = Number(state.chats.selectedConversationId) === Number(conversationId)
        const shouldIncreaseUnread = !mine && !isCurrentConversation

        const updated = {
          ...state.chats.conversations[idx],
          lastMessage: message?.content || state.chats.conversations[idx].lastMessage,
          lastMessageAt: message?.createdAt || state.chats.conversations[idx].lastMessageAt,
          unreadCount: shouldIncreaseUnread
            ? Number(state.chats.conversations[idx].unreadCount || 0) + 1
            : state.chats.conversations[idx].unreadCount,
        }

        state.chats.conversations.splice(idx, 1)
        state.chats.conversations.unshift(updated)

        if (shouldIncreaseUnread) {
          state.chats.unreadCount = Number(state.chats.unreadCount || 0) + 1
          state.overview.unreadMessages = Number(state.overview.unreadMessages || 0) + 1
        }
      }
    },
    receiveRealtimeConversationUpdate(state, action) {
      const incoming = action.payload
      if (!incoming?.conversationId) return
      const idx = state.chats.conversations.findIndex(
        (c) => Number(c.conversationId) === Number(incoming.conversationId),
      )

      const hasParticipantOnline = typeof incoming?.participantOnline === 'boolean'
      const hasParticipantLastOnlineAt = incoming?.participantLastOnlineAt !== undefined

      const mappedParticipant = incoming?.participant
        ? incoming.participant
        : incoming?.participantId
          ? {
              userId: incoming.participantId,
              username: incoming.participantUsername,
              avatarUrl: incoming.participantAvatarUrl || null,
              ...(hasParticipantOnline ? { online: incoming.participantOnline } : {}),
              ...(hasParticipantLastOnlineAt ? { lastOnlineAt: incoming.participantLastOnlineAt } : {}),
            }
          : null

      const normalizedIncoming = {
        ...incoming,
        ...(mappedParticipant ? { participant: mappedParticipant } : {}),
      }

      const merged =
        idx >= 0
          ? {
              ...state.chats.conversations[idx],
              ...normalizedIncoming,
              ...(mappedParticipant
                ? {
                    participant: {
                      ...state.chats.conversations[idx]?.participant,
                      ...mappedParticipant,
                    },
                  }
                : {}),
            }
          : normalizedIncoming

      if (idx >= 0) {
        state.chats.conversations.splice(idx, 1)
        state.chats.conversations.unshift(merged)
      } else {
        state.chats.conversations.unshift(merged)
      }
    },
    receiveRealtimeReadReceipt(state, action) {
      const { conversationId, targetUserId, readAt } = action.payload || {}
      if (!conversationId || !targetUserId) return

      const list = state.chats.messagesByConversationId[conversationId] || []
      state.chats.messagesByConversationId[conversationId] = list.map((m) => {
        if (Number(m.senderId) !== Number(targetUserId)) return m
        if (m.isRead) return m
        return { ...m, isRead: true, readAt: readAt || m.readAt || new Date().toISOString() }
      })
    },
    receiveRealtimePresenceUpdate(state, action) {
      const { userId, online, lastOnlineAt, eventAt } = action.payload || {}
      if (!userId) return

      state.chats.conversations = state.chats.conversations.map((conversation) => {
        const participant = conversation?.participant
        if (!participant || Number(participant.userId) !== Number(userId)) {
          return conversation
        }
        return {
          ...conversation,
          participant: {
            ...participant,
            online: Boolean(online),
            lastOnlineAt: online ? null : lastOnlineAt || eventAt || participant.lastOnlineAt,
          },
        }
      })
    },
    receiveRealtimeUnreadCount(state, action) {
      const unread = Number(action.payload?.unreadCount || 0)
      state.chats.unreadCount = unread
      state.overview.unreadMessages = unread
    },
    receiveRealtimeNotification(state, action) {
      const incoming = action.payload || {}
      const normalized = {
        id: incoming.id ?? incoming.notificationId,
        type: incoming.type ?? null,
        title: incoming.title ?? 'Thông báo mới',
        message: incoming.message ?? '',
        referenceId: incoming.referenceId ?? null,
        read: Boolean(incoming.read),
        createdAt: incoming.createdAt ?? new Date().toISOString(),
      }

      if (!normalized.id) return
      const exists = state.notifications.items.some((item) => Number(item.id) === Number(normalized.id))
      if (exists) return

      state.notifications.items = [normalized, ...state.notifications.items]
      if (!normalized.read) {
        state.notifications.unreadCount += 1
        state.overview.unreadNotifications += 1
      }
    },
    receiveRealtimeBidUpdate(state, action) {
      const update = action.payload
      const auctionId = update?.auctionId
      if (!auctionId) return
      const current = state.listings.bidsByAuctionId[auctionId] || []
      const nextMinimum = update.minimumNextBid || update.nextMinimumBid || null
      const virtualBid = {
        bidId: update.bidId,
        auctionId,
        userId: update.highestBidderId,
        username: update.highestBidderDisplayName,
        bidAmount: update.newHighestBid,
        bidTime: update.bidTime,
      }
      const exists = current.some((b) => b.bidId === virtualBid.bidId)
      if (!exists) {
        state.listings.bidsByAuctionId[auctionId] = [virtualBid, ...current]
      }

      Object.keys(state.listings.auctionsByListingId).forEach((listingId) => {
        const auctions = state.listings.auctionsByListingId[listingId]
        state.listings.auctionsByListingId[listingId] = auctions.map((auction) => {
          if (Number(auction.auctionId) !== Number(auctionId)) return auction
          return {
            ...auction,
            currentHighestBid: update.newHighestBid ?? auction.currentHighestBid ?? null,
            minimumNextBid: nextMinimum ?? auction.minimumNextBid ?? null,
            currentHighestBidderId:
              update.highestBidderId ?? update.currentHighestBidderId ?? auction.currentHighestBidderId ?? null,
            highestBidderId: update.highestBidderId ?? auction.highestBidderId ?? null,
            highestBidderDisplayName:
              update.highestBidderDisplayName ?? auction.highestBidderDisplayName ?? null,
            lastBidTime: update.bidTime ?? auction.lastBidTime ?? null,
            endTime: update.endTime ?? auction.endTime,
            extendedCount: update.extendedCount ?? auction.extendedCount ?? 0,
          }
        })
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAccount.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(bootstrapAccount.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.profile = normalizeProfile(action.payload.profile)
        state.overview = {
          ...state.overview,
          ...action.payload.overview,
          unreadMessages: action.payload.chatUnread,
          unreadNotifications: action.payload.notificationUnread,
        }
        state.chats.conversations = sortConversationsByLatest(action.payload.conversations)
        state.chats.unreadCount = action.payload.chatUnread
        state.notifications.items = action.payload.notifications?.content || []
        state.notifications.page = action.payload.notifications?.number || 0
        state.notifications.size = action.payload.notifications?.size || 5
        state.notifications.totalPages = action.payload.notifications?.totalPages || 1
        state.notifications.unreadCount = action.payload.notificationUnread
        state.notifications.isLoading = false
      })
      .addCase(bootstrapAccount.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Không tải được dữ liệu tài khoản'
        state.notifications.isLoading = false
      })

      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.listings.items = action.payload.items
        state.listings.page = action.payload.page
        state.listings.size = action.payload.size
        state.listings.totalPages = action.payload.totalPages
        state.listings.totalElements = action.payload.totalElements
      })
      .addCase(fetchListingDetail.fulfilled, (state, action) => {
        state.listings.selectedDetail = action.payload.detail
        state.listings.auctionsByListingId[action.payload.listingId] = action.payload.auctions
      })
      .addCase(fetchAuctionBids.fulfilled, (state, action) => {
        state.listings.bidsByAuctionId[action.payload.auctionId] = action.payload.bids
      })
      .addCase(createMyListing.fulfilled, (state, action) => {
        state.listings.items = [action.payload, ...state.listings.items]
        state.overview.listingsCreated += 1
        state.error = null
      })
      .addCase(createMyListing.rejected, (state, action) => {
        state.error = action.payload || action.error.message || 'Tạo bài đăng thất bại'
      })
      .addCase(createListingAuction.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(createListingAuction.fulfilled, (state, action) => {
        state.status = 'idle'
        state.error = null
        state.overview.auctionsCreated += 1
        const listingId = action.payload?.listingId
        if (listingId && state.listings.auctionsByListingId[listingId]) {
          state.listings.auctionsByListingId[listingId] = [
            action.payload,
            ...state.listings.auctionsByListingId[listingId],
          ]
        }
      })
      .addCase(createListingAuction.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.payload || action.error.message || 'Tạo phiên đấu giá thất bại'
      })
      .addCase(submitBid.fulfilled, (state, action) => {
        const bid = action.payload
        const auctionId = bid?.auctionId
        if (!auctionId) return

        const existing = state.listings.bidsByAuctionId[auctionId] || []
        const normalized = {
          bidId: bid.bidId,
          auctionId,
          userId: bid.userId,
          username: bid.username || null,
          bidAmount: bid.bidAmount,
          bidTime: bid.bidTime,
        }
        const exists = existing.some((b) => b.bidId === normalized.bidId)
        if (!exists) {
          state.listings.bidsByAuctionId[auctionId] = [normalized, ...existing]
        }

        Object.keys(state.listings.auctionsByListingId).forEach((listingId) => {
          const auctions = state.listings.auctionsByListingId[listingId]
          state.listings.auctionsByListingId[listingId] = auctions.map((auction) => {
            if (Number(auction.auctionId) !== Number(auctionId)) return auction

            const currentHighestBid = bid.currentHighestBid ?? bid.bidAmount ?? auction.currentHighestBid ?? null
            const nextMinimum =
              currentHighestBid != null && auction.bidIncrement != null
                ? Number(currentHighestBid) + Number(auction.bidIncrement)
                : auction.minimumNextBid ?? null

            return {
              ...auction,
              currentHighestBid,
              minimumNextBid: nextMinimum,
              currentHighestBidderId:
                bid.currentHighestBidderId ?? bid.userId ?? auction.currentHighestBidderId ?? null,
              highestBidderId: bid.currentHighestBidderId ?? bid.userId ?? auction.highestBidderId ?? null,
              lastBidTime: bid.bidTime ?? auction.lastBidTime ?? null,
              endTime: bid.auctionEndTime ?? auction.endTime,
              extendedCount: bid.extendedCount ?? auction.extendedCount ?? 0,
            }
          })
        })
      })
      .addCase(submitBid.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Đặt giá thất bại'
      })

      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.chats.conversations = sortConversationsByLatest(action.payload)
      })
      .addCase(fetchConversationMessages.pending, (state, action) => {
        const { conversationId, size = 10 } = action.meta.arg || {}
        if (!conversationId) return

        const current = state.chats.messagePagingByConversationId[conversationId] || {}
        state.chats.messagePagingByConversationId[conversationId] = {
          ...current,
          size,
          loading: true,
        }
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        const { conversationId, content, append, page, size, hasMore } = action.payload
        const current = state.chats.messagesByConversationId[conversationId] || []

        if (append) {
          const merged = [...content, ...current]
          const seen = new Set()
          state.chats.messagesByConversationId[conversationId] = merged.filter((m) => {
            const id = Number(m?.messageId)
            if (!Number.isFinite(id) || seen.has(id)) return false
            seen.add(id)
            return true
          })
        } else {
          state.chats.messagesByConversationId[conversationId] = content
        }

        state.chats.messagePagingByConversationId[conversationId] = {
          page,
          size,
          hasMore,
          loading: false,
        }
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        const { conversationId } = action.meta.arg || {}
        if (!conversationId) return

        const current = state.chats.messagePagingByConversationId[conversationId] || {}
        state.chats.messagePagingByConversationId[conversationId] = {
          ...current,
          loading: false,
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, msg } = action.payload
        const key = String(conversationId)
        const list = state.chats.messagesByConversationId[key] || []
        const exists = list.some((m) => Number(m.messageId) === Number(msg?.messageId))
        state.chats.messagesByConversationId[key] = exists ? list : [...list, msg]

        const idx = state.chats.conversations.findIndex(
          (c) => Number(c.conversationId) === Number(conversationId),
        )
        if (idx >= 0) {
          const updated = {
            ...state.chats.conversations[idx],
            lastMessage: msg?.content ?? state.chats.conversations[idx].lastMessage,
            lastMessageAt: msg?.createdAt ?? state.chats.conversations[idx].lastMessageAt,
            unreadCount: 0,
          }
          state.chats.conversations.splice(idx, 1)
          state.chats.conversations.unshift(updated)
        }
      })
      .addCase(startDirectConversation.fulfilled, (state, action) => {
        const existing = state.chats.conversations.find(
          (c) => Number(c.conversationId) === Number(action.payload.conversationId),
        )
        if (!existing) {
          state.chats.conversations = [action.payload, ...state.chats.conversations]
        }
        state.chats.selectedConversationId = action.payload.conversationId
      })
      .addCase(markConversationRead.fulfilled, (state, action) => {
        const { conversationId, readerId } = action.payload || {}
        if (!conversationId || !readerId) return
        const idx = state.chats.conversations.findIndex(
          (c) => Number(c.conversationId) === Number(conversationId),
        )
        if (idx >= 0) {
          state.chats.conversations[idx] = {
            ...state.chats.conversations[idx],
            unreadCount: 0,
          }
        }

        const now = new Date().toISOString()
        const list = state.chats.messagesByConversationId[conversationId] || []
        state.chats.messagesByConversationId[conversationId] = list.map((m) =>
          Number(m.senderId) === Number(readerId) || m.isRead
            ? m
            : { ...m, isRead: true, readAt: m.readAt || now },
        )
      })

      .addCase(fetchNotificationsPage.pending, (state) => {
        state.notifications.isLoading = true
      })
      .addCase(fetchNotificationsPage.fulfilled, (state, action) => {
        if (action.payload.append) {
          const currentIds = new Set(state.notifications.items.map((n) => Number(n.id)))
          const nextItems = action.payload.items.filter((n) => !currentIds.has(Number(n.id)))
          state.notifications.items = [...state.notifications.items, ...nextItems]
        } else {
          state.notifications.items = action.payload.items
        }
        state.notifications.page = action.payload.page
        state.notifications.size = action.payload.size
        state.notifications.totalPages = action.payload.totalPages
        state.notifications.isLoading = false
      })
      .addCase(fetchNotificationsPage.rejected, (state) => {
        state.notifications.isLoading = false
      })
      .addCase(readNotifications.fulfilled, (state, action) => {
        const ids = new Set(action.payload)
        let markedUnreadCount = 0
        state.notifications.items = state.notifications.items.map((n) =>
          ids.has(n.id)
            ? (() => {
                if (!n.read) markedUnreadCount += 1
                return { ...n, read: true }
              })()
            : n,
        )
        state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - markedUnreadCount)
        state.overview.unreadNotifications = state.notifications.unreadCount
      })
      .addCase(readAllNotifications.fulfilled, (state) => {
        state.notifications.items = state.notifications.items.map((n) => ({ ...n, read: true }))
        state.notifications.unreadCount = 0
        state.overview.unreadNotifications = 0
      })
      .addCase(fetchLikedListingsPage.pending, (state) => {
        state.likedListings.isLoading = true
      })
      .addCase(fetchLikedListingsPage.fulfilled, (state, action) => {
        if (action.payload.append) {
          const currentIds = new Set(state.likedListings.items.map((n) => Number(n.id)))
          const nextItems = action.payload.items.filter((n) => !currentIds.has(Number(n.id)))
          state.likedListings.items = [...state.likedListings.items, ...nextItems]
        } else {
          state.likedListings.items = action.payload.items
        }
        state.likedListings.page = action.payload.page
        state.likedListings.size = action.payload.size
        state.likedListings.totalPages = action.payload.totalPages
        state.likedListings.isLoading = false
        state.likedListings.hasFetched = true
      })
      .addCase(fetchLikedListingsPage.rejected, (state) => {
        state.likedListings.isLoading = false
        state.likedListings.hasFetched = true
      })
      .addCase(fetchWonAuctionsPage.pending, (state) => {
        state.wonAuctions.isLoading = true
      })
      .addCase(fetchWonAuctionsPage.fulfilled, (state, action) => {
        if (action.payload.append) {
          const currentIds = new Set(state.wonAuctions.items.map((n) => Number(n.id)))
          const nextItems = action.payload.items.filter((n) => !currentIds.has(Number(n.id)))
          state.wonAuctions.items = [...state.wonAuctions.items, ...nextItems]
        } else {
          state.wonAuctions.items = action.payload.items
        }
        state.wonAuctions.page = action.payload.page
        state.wonAuctions.size = action.payload.size
        state.wonAuctions.totalPages = action.payload.totalPages
        state.wonAuctions.isLoading = false
        state.wonAuctions.hasFetched = true
      })
      .addCase(fetchWonAuctionsPage.rejected, (state) => {
        state.wonAuctions.isLoading = false
        state.wonAuctions.hasFetched = true
      })
      .addCase(fetchPaymentsPage.pending, (state) => {
        state.payments.isLoading = true
      })
      .addCase(fetchPaymentsPage.fulfilled, (state, action) => {
        if (action.payload.append) {
          const currentIds = new Set(state.payments.items.map((n) => Number(n.paymentId)))
          const nextItems = action.payload.items.filter((n) => !currentIds.has(Number(n.paymentId)))
          state.payments.items = [...state.payments.items, ...nextItems]
        } else {
          state.payments.items = action.payload.items
        }
        state.payments.page = action.payload.page
        state.payments.size = action.payload.size
        state.payments.totalPages = action.payload.totalPages
        state.payments.isLoading = false
        state.payments.hasFetched = true
      })
      .addCase(fetchPaymentsPage.rejected, (state, action) => {
        state.payments.isLoading = false
        state.payments.hasFetched = true
        state.error = action.error?.message || 'Không tải được danh sách thanh toán'
      })
      .addCase(completePayment.fulfilled, (state, action) => {
        const updated = action.payload
        state.payments.items = state.payments.items.map((item) =>
          Number(item.paymentId) === Number(updated.paymentId) ? updated : item,
        )
      })
      .addCase(completePayment.rejected, (state, action) => {
        state.error = action.error?.message || 'Thanh toán thất bại'
      })
      .addCase(updateProfileAvatar.fulfilled, (state, action) => {
        state.profile = normalizeProfile(action.payload)
      })
      .addCase(updateProfileAvatar.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Không thể cập nhật ảnh đại diện'
      })
      .addCase(changeMyPassword.fulfilled, (state) => {
        state.error = null
      })
      .addCase(changeMyPassword.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Đổi mật khẩu thất bại'
      })
  },
})

export const {
  setSelectedListing,
  setSelectedConversation,
  clearAccountError,
  receiveRealtimeMessage,
  receiveRealtimeConversationUpdate,
  receiveRealtimeReadReceipt,
  receiveRealtimePresenceUpdate,
  receiveRealtimeUnreadCount,
  receiveRealtimeNotification,
  receiveRealtimeBidUpdate,
} = accountSlice.actions

export default accountSlice.reducer
