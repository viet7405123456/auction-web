import { useEffect, useRef, useState } from 'react'
import { FaImage } from 'react-icons/fa'
import { fmtDate } from './formatters'

function formatOfflineDuration(lastOnlineAt) {
  if (!lastOnlineAt) return 'Offline'
  const diffMs = Date.now() - new Date(lastOnlineAt).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'Offline'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) {
    return 'Vừa hoạt động'
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `Hoạt động ${minutes} phút trước`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `Hoạt động ${hours} giờ trước`
  }

  const days = Math.floor(hours / 24)
  return `Hoạt động ${days} ngày trước`
}

export default function ChatTab({
  conversations,
  selectedConversationId,
  selectedConversation,
  currentMessages,
  authUser,
  onSelectConversation,
  onSendMessage,
  onUploadAndSendImage,
  onLoadOlderMessages,
  loadingOlderMessages,
  hasMoreMessages,
  uploadingChatImage,
  messageSendTick,
}) {
  const [chatText, setChatText] = useState('')
  const messagesRef = useRef(null)
  const shouldRestoreScrollRef = useRef(false)
  const prevScrollHeightRef = useRef(0)
  const forceScrollToBottomRef = useRef(false)
  const seenInitialLoadingRef = useRef(false)

  useEffect(() => {
    forceScrollToBottomRef.current = true
    shouldRestoreScrollRef.current = false
    seenInitialLoadingRef.current = false
  }, [selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId || !messageSendTick) return
    forceScrollToBottomRef.current = true
    requestAnimationFrame(() => {
      const node = messagesRef.current
      if (!node) return
      node.scrollTop = node.scrollHeight
    })
  }, [selectedConversationId, messageSendTick])

  useEffect(() => {
    if (!messagesRef.current) return

    const viewport = messagesRef.current

    if (loadingOlderMessages) {
      seenInitialLoadingRef.current = true
    }

    if (forceScrollToBottomRef.current) {
      const hasMessages = currentMessages.length > 0
      const hasStartedLoading = seenInitialLoadingRef.current

      // Do not clear force-scroll too early. Wait for either:
      // 1) cached messages already present, or
      // 2) first loading cycle starts and then finishes.
      if (!hasMessages && !hasStartedLoading) {
        return
      }

      if (loadingOlderMessages) {
        return
      }

      requestAnimationFrame(() => {
        const node = messagesRef.current
        if (!node) return
        node.scrollTop = node.scrollHeight
      })

      forceScrollToBottomRef.current = false
      return
    }

    if (shouldRestoreScrollRef.current) {
      const nextHeight = viewport.scrollHeight
      const delta = nextHeight - prevScrollHeightRef.current
      viewport.scrollTop = Math.max(0, delta)
      shouldRestoreScrollRef.current = false
      return
    }

    const distanceToBottom = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight)
    if (distanceToBottom < 120) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [selectedConversationId, currentMessages, loadingOlderMessages])

  const handleSend = async () => {
    const nextText = chatText.trim()
    if (!nextText || uploadingChatImage) return

    await onSendMessage(nextText)
    setChatText('')
  }

  const handleMessagesScroll = () => {
    const el = messagesRef.current
    if (!el) return
    if (!hasMoreMessages || loadingOlderMessages) return
    if (el.scrollTop > 48) return

    shouldRestoreScrollRef.current = true
    prevScrollHeightRef.current = el.scrollHeight
    onLoadOlderMessages?.()
  }

  const handleTextChange = (e) => {
    setChatText(e.target.value)
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <h3 className="mb-3 text-base font-extrabold text-slate-900">Phòng chat trực tiếp</h3>
        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.conversationId}
              onClick={() => onSelectConversation(c.conversationId)}
              className={`w-full rounded-xl p-3 text-left ring-1 hover:cursor-pointer ${
                Number(selectedConversationId) === Number(c.conversationId)
                  ? 'bg-red-50 ring-red-300'
                  : 'bg-white ring-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {c.participant?.avatarUrl ? (
                  <img
                    src={c.participant.avatarUrl}
                    alt={c.participant?.username || 'avatar'}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                    {(c.participant?.username || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900">{c.participant?.username || `User #${c.participant?.userId}`}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${c.participant?.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>{c.participant?.online ? 'Online' : formatOfflineDuration(c.participant?.lastOnlineAt)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">{c.lastMessage || 'Chưa có tin nhắn'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        {!selectedConversationId ? (
          <div className="grid min-h-[420px] place-items-center text-sm text-slate-500">Chọn một cuộc trò chuyện để bắt đầu.</div>
        ) : (
          <div className="flex h-[520px] flex-col">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              {selectedConversation?.participant?.avatarUrl ? (
                <img
                  src={selectedConversation.participant.avatarUrl}
                  alt={selectedConversation?.participant?.username || 'avatar'}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                  {(selectedConversation?.participant?.username || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedConversation?.participant?.username || `User #${selectedConversation?.participant?.userId}`}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${selectedConversation?.participant?.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  />
                  <span>
                    {selectedConversation?.participant?.online
                      ? 'Đang hoạt động'
                      : formatOfflineDuration(selectedConversation?.participant?.lastOnlineAt)}
                  </span>
                </div>
              </div>
            </div>
            <div
              ref={messagesRef}
              onScroll={handleMessagesScroll}
              className="flex-1 space-y-2 overflow-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
              {loadingOlderMessages && (
                <div className="mb-2 text-center text-xs text-slate-400">Đang tải tin nhắn cũ...</div>
              )}
              {!hasMoreMessages && currentMessages.length > 0 && (
                <div className="mb-2 text-center text-[11px] text-slate-400">Đã hiển thị hết lịch sử cuộc trò chuyện</div>
              )}
              {currentMessages.map((m) => {
                const mine = Number(m.senderId) === Number(authUser?.userId)
                return (
                  <div key={m.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        mine ? 'bg-red-600 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
                      }`}
                    >
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="chat-upload" className="mb-2 max-h-52 w-full rounded-lg object-cover" />
                      )}
                      {m.content && !m.imageUrl && <div>{m.content}</div>}
                      <div className={`mt-1 text-[10px] ${mine ? 'text-red-100' : 'text-slate-400'}`}>{fmtDate(m.createdAt)}</div>
                      {mine && m.isRead && m.readAt && (
                        <div className="mt-1 text-[10px] text-red-100/90">Đã xem lúc {fmtDate(m.readAt)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={chatText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && chatText.trim()) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200">
                <FaImage />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    onUploadAndSendImage(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                onClick={handleSend}
                disabled={uploadingChatImage || (!chatText.trim())}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
