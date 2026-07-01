package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.entity.Conversation;
import com.example.auction_web.entity.User;
import com.example.auction_web.event.ChatRealtimeEventType;
import com.example.auction_web.event.ConversationUpdatedEvent;
import com.example.auction_web.event.ReadReceiptEvent;
import com.example.auction_web.event.UnreadCountEvent;
import com.example.auction_web.repository.ConversationRepository;
import com.example.auction_web.repository.MessageRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.ChatRealtimeService;
import com.example.auction_web.service.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatRealtimeServiceImpl implements ChatRealtimeService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
        private final UserSessionService userSessionService;

    @Override
    public void handleReadConversation(Long currentUserId, Long conversationId) {
        Conversation conversation = conversationRepository
                .findByIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));

        User reader = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Reader not found"));

        User other = conversation.getUserOne().getUserId().equals(currentUserId)
                ? conversation.getUserTwo() : conversation.getUserOne();
        if (other == null || other.getUserId() == null || reader.getUserId() == null) return;

        if (messageRepository.markAsRead(conversationId, currentUserId) <= 0) return;

        ReadReceiptEvent readEvent = ReadReceiptEvent.builder()
                .type(ChatRealtimeEventType.MESSAGES_READ)
                .conversationId(conversationId)
                .readerId(reader.getUserId())
                .targetUserId(other.getUserId())
                .readAt(LocalDateTime.now())
                .build();
        sendToUserTargets(other.getUserId(), other.getEmail(), "/queue/chat/read-receipts", readEvent);

        UnreadCountEvent unreadEvent = UnreadCountEvent.builder()
                .type(ChatRealtimeEventType.UNREAD_UPDATED)
                .unreadCount(messageRepository.countAllUnreadMessages(reader.getUserId()))
                .build();
        sendToUserTargets(reader.getUserId(), reader.getEmail(), "/queue/chat/unread", unreadEvent);

        ConversationUpdatedEvent conversationEvent = ConversationUpdatedEvent.builder()
                .type(ChatRealtimeEventType.CONVERSATION_UPDATED)
                .conversationId(conversation.getConversationId())
                .lastMessage(conversation.getLastMessage())
                .lastMessageImageUrl(null)
                .lastMessageType(null)
                .lastMessageAt(conversation.getLastMessageAt())
                .updatedAt(conversation.getUpdatedAt())
                .unreadCount(0L)
                .participantId(other.getUserId())
                .participantUsername(other.getDisplayUsername())
                .participantAvatarUrl(other.getUserProfile() != null ? other.getUserProfile().getAvatarUrl() : null)
                .participantOnline(userSessionService.isUserOnline(other.getUserId()))
                .participantLastOnlineAt(other.getLastOnlineAt())
                .build();
        sendToUserTargets(reader.getUserId(), reader.getEmail(), "/queue/chat/conversations", conversationEvent);
    }

    private void sendToUserTargets(Long userId, String email, String destination, Object payload) {
        Set<String> targets = new LinkedHashSet<>();
        if (email != null && !email.isBlank()) {
            targets.add(email);
        }
        if (userId != null) {
            targets.add(String.valueOf(userId));
        }

        for (String target : targets) {
            messagingTemplate.convertAndSendToUser(target, destination, payload);
        }
    }
}
