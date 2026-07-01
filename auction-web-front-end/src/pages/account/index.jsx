import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FaBell,
  FaCreditCard,
  FaInfoCircle,
  FaListAlt,
  FaComments,
  FaUserCircle,
} from 'react-icons/fa'
import {
  bootstrapAccount,
  changeMyPassword,
  createListingAuction,
  createMyListing,
  fetchAuctionBids,
  fetchConversationMessages,
  fetchConversations,
  fetchLikedListingsPage,
  fetchWonAuctionsPage,
  fetchMyListings,
  fetchListingDetail,
  markConversationRead,
  fetchNotificationsPage,
  fetchPaymentsPage,
  readAllNotifications,
  readNotifications,
  sendMessage,
  setSelectedConversation,
  setSelectedListing,
  startDirectConversation,
  submitBid,
  completePayment,
  updateProfileAvatar,
  receiveRealtimeMessage,
  receiveRealtimeConversationUpdate,
  receiveRealtimePresenceUpdate,
  receiveRealtimeReadReceipt,
  receiveRealtimeUnreadCount,
} from '../../features/account/accountSlice'
import { api as uploadApi } from '../../api/uploadApi'
import { connectWs, publishWs, subscribeWs, unregisterWsConnectedCallback } from '../../realtime/wsClient'
import { ChatRealtimeEventType } from '../../realtime/chatEventTypes.js'
import { getAuctionDetail } from '../../api/auctionsApi.js'
import { buildNotificationNavigationTarget } from '../../utils/notificationNavigation.js'
import { TabButton } from './components'
import ProfileTab from './ProfileTab'
import OverviewTab from './OverviewTab'
import ListingsTab from './ListingsTab'
import ChatTab from './ChatTab'
import NotificationsTab from './NotificationsTab'
import PaymentTab from './PaymentTab'

const tabs = [
  { key: 'profile', label: 'Tài khoản', icon: FaUserCircle },
  { key: 'overview', label: 'Tổng quan', icon: FaInfoCircle },
  { key: 'listings', label: 'Quản lý bài đăng', icon: FaListAlt },
  { key: 'chat', label: 'Chat', icon: FaComments },
  { key: 'payments', label: 'Thanh toán', icon: FaCreditCard },
  { key: 'notifications', label: 'Thông báo', icon: FaBell },
]

export default function AccountPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const authUser = useSelector((s) => s.auth.user)
  const account = useSelector((s) => s.account)
  const [sp, setSp] = useSearchParams()

  const currentTab = sp.get('tab') || 'overview'
  const setTab = (tab) => setSp({ tab })

  const profile = account.profile
  const overview = account.overview
  const listings = account.listings.items
  const rawSelectedListingId = account.listings.selectedId
  const selectedDetail = account.listings.selectedDetail
  const validListingIds = useMemo(
    () => new Set(listings.map((l) => Number(l.id ?? l.listingId)).filter((id) => Number.isFinite(id))),
    [listings],
  )
  const selectedListingId =
    rawSelectedListingId != null && validListingIds.has(Number(rawSelectedListingId))
      ? Number(rawSelectedListingId)
      : null
  const selectedListing = useMemo(() => {
    if (selectedListingId == null || !selectedDetail) return null

    const detailId = Number(selectedDetail.id ?? selectedDetail.listingId)
    if (!Number.isFinite(detailId) || detailId !== Number(selectedListingId)) {
      return null
    }

    const detailOwnerId = Number(selectedDetail?.seller?.userId || selectedDetail?.seller?.id)
    if (Number.isFinite(detailOwnerId) && Number(authUser?.userId) !== detailOwnerId) {
      return null
    }

    return selectedDetail
  }, [selectedListingId, selectedDetail, authUser?.userId])
  const listingAuctions = account.listings.auctionsByListingId[selectedListingId] || []
  const conversations = account.chats.conversations
  const selectedConversationId = account.chats.selectedConversationId
  const selectedConversation = conversations.find((c) => Number(c.conversationId) === Number(selectedConversationId)) || null
  const currentMessages = account.chats.messagesByConversationId[selectedConversationId] || []
  const selectedConversationPaging =
    account.chats.messagePagingByConversationId[selectedConversationId] || {
      page: 0,
      size: 10,
      hasMore: false,
      loading: false,
    }
  const notifications = account.notifications.items
  const likedListings = account.likedListings.items
  const likedListingsPaging = account.likedListings
  const wonAuctions = account.wonAuctions.items
  const wonAuctionsPaging = account.wonAuctions
  const payments = account.payments.items
  const paymentsPaging = account.payments
  const [selectedBidAuctionId, setSelectedBidAuctionId] = useState(null)
  const [sendingChatMessage, setSendingChatMessage] = useState(false)
  const [uploadingChatImage, setUploadingChatImage] = useState(false)
  const [messageSendTick, setMessageSendTick] = useState(0)
  const selectedConversationRef = useRef(null)
  const currentTabRef = useRef(currentTab)
  const realtimeSyncTimeoutRef = useRef(null)

  const selectedAuctionBids = account.listings.bidsByAuctionId[selectedBidAuctionId] || []
  const isVerified = Boolean(profile?.isVerified)

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    currentTabRef.current = currentTab
  }, [currentTab])

  useEffect(() => {
    dispatch(bootstrapAccount())
    dispatch(fetchMyListings({ page: 0, size: 10 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedConversationId) {
      dispatch(fetchConversationMessages({ conversationId: selectedConversationId, page: 0, size: 10, append: false }))
      publishWs('/app/chat.read', { conversationId: selectedConversationId })
      if (authUser?.userId) {
        dispatch(markConversationRead({ conversationId: selectedConversationId, readerId: authUser.userId }))
      }
    }
  }, [dispatch, selectedConversationId, authUser?.userId])

  const onLoadOlderMessages = async () => {
    if (!selectedConversationId) return
    if (selectedConversationPaging.loading || !selectedConversationPaging.hasMore) return

    const nextPage = Number(selectedConversationPaging.page || 0) + 1
    const size = Number(selectedConversationPaging.size || 10)

    await dispatch(
      fetchConversationMessages({
        conversationId: selectedConversationId,
        page: nextPage,
        size,
        append: true,
      }),
    )
  }

  useEffect(() => {
    let cancelled = false
    let messageSub
    let conversationSub
    let unreadSub
    let readReceiptSub
    let presenceSub

    const onWsConnected = () => {
      if (cancelled) return
      messageSub = subscribeWs('/user/queue/chat/messages', (event) => {
        console.info('[CHAT EVENT]', {
          channel: '/user/queue/chat/messages',
          type: event?.type || null,
          conversationId: event?.conversationId || null,
          messageId: event?.message?.messageId || null,
          senderId: event?.message?.senderId || null,
        })

        if (event?.type === ChatRealtimeEventType.NEW_MESSAGE && event?.conversationId && event?.message) {
          console.info('[CHAT NEW_MESSAGE RECEIVED]', {
            conversationId: event.conversationId,
            messageId: event.message.messageId,
            senderId: event.message.senderId,
          })
          dispatch(receiveRealtimeMessage({ conversationId: event.conversationId, message: event.message }))

          const isCurrentConversation =
            Number(selectedConversationRef.current) === Number(event.conversationId) &&
            currentTabRef.current === 'chat'

          // Fallback sync to avoid stale UI when websocket events arrive out of order.
          if (isCurrentConversation) {
            if (realtimeSyncTimeoutRef.current) {
              clearTimeout(realtimeSyncTimeoutRef.current)
            }
            realtimeSyncTimeoutRef.current = setTimeout(() => {
              dispatch(
                fetchConversationMessages({
                  conversationId: event.conversationId,
                  page: 0,
                  size: 10,
                  append: false,
                }),
              )
            }, 120)
          }

          if (isCurrentConversation) {
            publishWs('/app/chat.read', { conversationId: event.conversationId })
            if (authUser?.userId) {
              dispatch(markConversationRead({ conversationId: event.conversationId, readerId: authUser.userId }))
            }
          }

          // Fallback sync for sidebar preview/unread in case conversation event arrives late or is dropped.
          dispatch(fetchConversations())
        } else {
          console.info('[CHAT EVENT IGNORED]', {
            reason: 'Not NEW_MESSAGE or missing payload fields',
            event,
          })
        }
      })

      conversationSub = subscribeWs('/user/queue/chat/conversations', (event) => {
        if (event?.type === ChatRealtimeEventType.CONVERSATION_UPDATED) {
          dispatch(receiveRealtimeConversationUpdate(event))
        }
      })

      unreadSub = subscribeWs('/user/queue/chat/unread', (event) => {
        dispatch(receiveRealtimeUnreadCount(event))
      })

      readReceiptSub = subscribeWs('/user/queue/chat/read-receipts', (event) => {
        if (event?.type === ChatRealtimeEventType.MESSAGES_READ) {
          dispatch(receiveRealtimeReadReceipt(event))
        }
      })

      presenceSub = subscribeWs('/user/queue/chat/presence', (event) => {
        if (event?.type === ChatRealtimeEventType.USER_PRESENCE_UPDATED) {
          console.info('[USER PRESENCE]', {
            userId: event?.userId,
            username: event?.username,
            online: event?.online,
          })
          dispatch(receiveRealtimePresenceUpdate(event))
        }
      })
    }

    connectWs(onWsConnected)

    return () => {
      cancelled = true
      unregisterWsConnectedCallback(onWsConnected)
      if (realtimeSyncTimeoutRef.current) {
        clearTimeout(realtimeSyncTimeoutRef.current)
      }
      messageSub?.unsubscribe?.()
      conversationSub?.unsubscribe?.()
      unreadSub?.unsubscribe?.()
      readReceiptSub?.unsubscribe?.()
      presenceSub?.unsubscribe?.()
    }
  }, [dispatch, authUser?.userId])

  useEffect(() => {
    if (currentTab !== 'notifications') return
    dispatch(fetchNotificationsPage({ page: 0, size: 10 }))
  }, [currentTab, dispatch])

  useEffect(() => {
    if (currentTab !== 'overview') return
    if (likedListings.length > 0 || likedListingsPaging.isLoading || likedListingsPaging.hasFetched) return
    dispatch(fetchLikedListingsPage({ page: 0, size: likedListingsPaging.size || 6, append: false }))
  }, [
    currentTab,
    dispatch,
    likedListings.length,
    likedListingsPaging.hasFetched,
    likedListingsPaging.isLoading,
    likedListingsPaging.size,
  ])

  useEffect(() => {
    if (currentTab !== 'overview') return
    if (wonAuctions.length > 0 || wonAuctionsPaging.isLoading || wonAuctionsPaging.hasFetched) return
    dispatch(fetchWonAuctionsPage({ page: 0, size: wonAuctionsPaging.size || 6, append: false }))
  }, [
    currentTab,
    dispatch,
    wonAuctions.length,
    wonAuctionsPaging.hasFetched,
    wonAuctionsPaging.isLoading,
    wonAuctionsPaging.size,
  ])

  useEffect(() => {
    if (currentTab !== 'payments') return
    if (payments.length > 0 || paymentsPaging.isLoading || paymentsPaging.hasFetched) return
    dispatch(fetchPaymentsPage({ page: 0, size: paymentsPaging.size || 10, append: false }))
  }, [
    currentTab,
    dispatch,
    payments.length,
    paymentsPaging.hasFetched,
    paymentsPaging.isLoading,
    paymentsPaging.size,
  ])

  useEffect(() => {
    if (currentTab !== 'listings') return

    if (!listings.length) {
      if (rawSelectedListingId != null || selectedDetail) {
        dispatch(setSelectedListing(null))
      }
      setSelectedBidAuctionId(null)
      return
    }

    const hasValidSelection =
      rawSelectedListingId != null && validListingIds.has(Number(rawSelectedListingId))

    if (!hasValidSelection) {
      const firstListingId = Number(listings[0]?.id ?? listings[0]?.listingId)
      if (Number.isFinite(firstListingId)) {
        setSelectedBidAuctionId(null)
        dispatch(setSelectedListing(firstListingId))
        dispatch(fetchListingDetail(firstListingId))
      }
      return
    }

    if (!selectedListing) {
      dispatch(fetchListingDetail(Number(rawSelectedListingId)))
    }
  }, [
    currentTab,
    dispatch,
    listings,
    rawSelectedListingId,
    selectedDetail,
    selectedListing,
    validListingIds,
  ])

  const onSelectListing = (listingId) => {
    setSelectedBidAuctionId(null)
    dispatch(setSelectedListing(listingId))
    dispatch(fetchListingDetail(listingId))
  }

  const onCreateListing = async (payload) => {
    if (!isVerified) {
      throw new Error('Chỉ tài khoản đã xác thực mới được tạo bài đăng.')
    }
    await dispatch(createMyListing(payload)).unwrap()
    dispatch(fetchMyListings({ page: 0, size: 10 }))
  }

  const onCreateAuction = async (payload) => {
    try {
      await dispatch(createListingAuction(payload)).unwrap()
      dispatch(fetchListingDetail(selectedListingId))
    } catch (error) {
      console.error('Create auction error:', error)
      alert(`Lỗi tạo phiên đấu giá: ${error}`)
    }
  }

  const onPlaceBid = async (payload) => {
    if (!isVerified) {
      throw new Error('Chỉ tài khoản đã xác thực mới được tham gia đặt bid.')
    }
    await dispatch(submitBid(payload)).unwrap()
  }

  const onFetchBids = (auctionId) => {
    dispatch(fetchAuctionBids(auctionId))
  }

  const onSelectBidAuction = (auctionId) => {
    setSelectedBidAuctionId(auctionId)
  }

  const onFetchAuctionBids = (auctionId) => {
    dispatch(fetchAuctionBids(auctionId))
  }

  const onContactSeller = async () => {
    const targetUserId = selectedListing?.seller?.userId || selectedListing?.seller?.id
    if (!targetUserId) return
    await dispatch(startDirectConversation({ targetUserId }))
    setTab('chat')
  }

  const onSelectConversation = (conversationId) => {
    dispatch(setSelectedConversation(conversationId))
  }

  const onSendMessage = async (content, imageUrl = null) => {
    if (!selectedConversationId) return
    if (!content.trim() && !imageUrl) return

    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    setSendingChatMessage(true)
    try {
      await dispatch(
        sendMessage({
          conversationId: selectedConversationId,
          content: content.trim(),
          imageUrl,
          clientMessageId,
        }),
      ).unwrap()
      setMessageSendTick((n) => n + 1)
    } finally {
      setSendingChatMessage(false)
    }
  }

  const onUploadAndSendImage = async (file) => {
    if (!file || !selectedConversationId) return
    setUploadingChatImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadApi.post('/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const imageUrl = typeof res.data === 'string' ? res.data : res?.data?.url
      if (imageUrl) {
        await onSendMessage('', imageUrl)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingChatImage(false)
    }
  }

  const onMarkRead = (notificationIds) => {
    dispatch(readNotifications(notificationIds))
  }

  const onNotificationClick = async (notification) => {
    if (!notification) return

    if (!notification.read) {
      dispatch(readNotifications([notification.id]))
    }

    const target = await buildNotificationNavigationTarget(notification, {
      auctionsByListingId: account?.listings?.auctionsByListingId,
      getAuctionById: getAuctionDetail,
    })

    if (target?.to) {
      navigate(target.to)
    }
  }

  const onMarkAllRead = () => {
    dispatch(readAllNotifications())
  }

  const onLoadMoreNotifications = () => {
    const currentPage = Number(account.notifications.page || 0)
    const totalPages = Number(account.notifications.totalPages || 1)
    if (currentPage + 1 >= totalPages) return
    dispatch(fetchNotificationsPage({ page: currentPage + 1, size: account.notifications.size || 10, append: true }))
  }

  const onLoadMoreLikedListings = async () => {
    const currentPage = Number(likedListingsPaging.page || 0)
    const totalPages = Number(likedListingsPaging.totalPages || 1)
    if (likedListingsPaging.isLoading || currentPage + 1 >= totalPages) return false

    const result = await dispatch(
      fetchLikedListingsPage({
        page: currentPage + 1,
        size: likedListingsPaging.size || 6,
        append: true,
      }),
    )
    return fetchLikedListingsPage.fulfilled.match(result)
  }

  const onLoadMoreWonAuctions = async () => {
    const currentPage = Number(wonAuctionsPaging.page || 0)
    const totalPages = Number(wonAuctionsPaging.totalPages || 1)
    if (wonAuctionsPaging.isLoading || currentPage + 1 >= totalPages) return false

    const result = await dispatch(
      fetchWonAuctionsPage({
        page: currentPage + 1,
        size: wonAuctionsPaging.size || 6,
        append: true,
      }),
    )
    return fetchWonAuctionsPage.fulfilled.match(result)
  }

  const onLoadMorePayments = async () => {
    const currentPage = Number(paymentsPaging.page || 0)
    const totalPages = Number(paymentsPaging.totalPages || 1)
    if (paymentsPaging.isLoading || currentPage + 1 >= totalPages) return false

    const result = await dispatch(
      fetchPaymentsPage({
        page: currentPage + 1,
        size: paymentsPaging.size || 10,
        append: true,
      }),
    )
    return fetchPaymentsPage.fulfilled.match(result)
  }

  const onCompletePayment = async (paymentId) => {
    await dispatch(completePayment(paymentId)).unwrap()
  }

  const onUpdateAvatar = async (avatarUrl) => {
    await dispatch(updateProfileAvatar(avatarUrl)).unwrap()
  }

  const onChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    await dispatch(changeMyPassword({ currentPassword, newPassword, confirmPassword })).unwrap()
  }

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-orange-500 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">Trung tâm tài khoản</h1>
        <p className="mt-1 text-sm text-red-100">
          Quản lý thông tin cá nhân, bài đăng, phiên đấu giá, chat và thông báo.
        </p>
      </section>

      <section className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <TabButton
            key={t.key}
            icon={t.icon}
            label={t.label}
            active={currentTab === t.key}
            onClick={() => setTab(t.key)}
          />
        ))}
      </section>

      {currentTab === 'profile' && (
        <ProfileTab
          profile={profile}
          authUser={authUser}
          onUpdateAvatar={onUpdateAvatar}
          onChangePassword={onChangePassword}
        />
      )}

      {currentTab === 'overview' && (
        <OverviewTab
          overview={overview}
          onSelectTab={setTab}
          likedListings={likedListings}
          likedListingsPaging={likedListingsPaging}
          onLoadMoreLikedListings={onLoadMoreLikedListings}
          wonAuctions={wonAuctions}
          wonAuctionsPaging={wonAuctionsPaging}
          onLoadMoreWonAuctions={onLoadMoreWonAuctions}
        />
      )}

      {currentTab === 'listings' && (
        <ListingsTab
          listings={listings}
          selectedListingId={selectedListingId}
          selectedListing={selectedListing}
          listingAuctions={listingAuctions}
          authUser={authUser}
          status={account.status}
          error={account.error}
          onSelectListing={onSelectListing}
          onCreateListing={onCreateListing}
          onCreateAuction={onCreateAuction}
          onPlaceBid={onPlaceBid}
          isVerified={isVerified}
          onContactSeller={onContactSeller}
          onFetchBids={onFetchBids}
          onFetchAuctionBids={onFetchAuctionBids}
          selectedBidAuctionId={selectedBidAuctionId}
          onSelectBidAuction={onSelectBidAuction}
          selectedAuctionBids={selectedAuctionBids}
        />
      )}

      {currentTab === 'chat' && (
        <ChatTab
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          selectedConversation={selectedConversation}
          currentMessages={currentMessages}
          authUser={authUser}
          onSelectConversation={onSelectConversation}
          onSendMessage={onSendMessage}
          onUploadAndSendImage={onUploadAndSendImage}
          onLoadOlderMessages={onLoadOlderMessages}
          loadingOlderMessages={selectedConversationPaging.loading}
          hasMoreMessages={selectedConversationPaging.hasMore}
          uploadingChatImage={uploadingChatImage || sendingChatMessage}
          messageSendTick={messageSendTick}
        />
      )}

      {currentTab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          loadedCount={notifications.length}
          hasMore={Number(account.notifications.page || 0) + 1 < Number(account.notifications.totalPages || 1)}
          onMarkRead={onMarkRead}
          onNotificationClick={onNotificationClick}
          onMarkAllRead={onMarkAllRead}
          onLoadMore={onLoadMoreNotifications}
        />
      )}

      {currentTab === 'payments' && (
        <PaymentTab
          payments={payments}
          paymentsPaging={paymentsPaging}
          onLoadMorePayments={onLoadMorePayments}
          onCompletePayment={onCompletePayment}
        />
      )}

      {account.error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {account.error}
        </div>
      )}
    </div>
  )
}
