package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.response.ChatUserResponse;
import com.example.auction_web.dto.response.ConversationResponse;
import com.example.auction_web.dto.response.MessageResponse;
import com.example.auction_web.entity.Conversation;
import com.example.auction_web.entity.Enumtype.MessageType;
import com.example.auction_web.entity.Message;
import com.example.auction_web.entity.User;
import com.example.auction_web.event.ChatMessageEvent;
import com.example.auction_web.event.ChatRealtimeEventType;
import com.example.auction_web.event.ConversationUpdatedEvent;
import com.example.auction_web.event.UnreadCountEvent;
import com.example.auction_web.repository.ConversationRepository;
import com.example.auction_web.repository.MessageRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.ChatService;
import com.example.auction_web.service.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatServiceImpl implements ChatService {

        private final UserRepository userRepository;
        private final ConversationRepository conversationRepository;
        private final MessageRepository messageRepository;
        private final SimpMessagingTemplate messagingTemplate;
        private final UserSessionService userSessionService;

    @Override
    public ConversationResponse createOrGetDirectConversation(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot create conversation with yourself");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Long userOneId = Math.min(currentUserId, targetUserId);
        Long userTwoId = Math.max(currentUserId, targetUserId);

        Conversation conversation = conversationRepository
                .findByUserOne_UserIdAndUserTwo_UserId(userOneId, userTwoId)
                .orElseGet(() -> {
                    User userOne = userOneId.equals(currentUserId) ? currentUser : targetUser;
                    User userTwo = userTwoId.equals(currentUserId) ? currentUser : targetUser;

                    Conversation newConversation = Conversation.builder()
                            .userOne(userOne)
                            .userTwo(userTwo)
                            .build();

                    return conversationRepository.save(newConversation);
                });

        User participant = conversation.getUserOne().getUserId().equals(currentUserId)
                ? conversation.getUserTwo()
                : conversation.getUserOne();

        long unreadCount = messageRepository.countUnreadMessages(conversation.getConversationId(), currentUserId);

        return ConversationResponse.builder()
                .conversationId(conversation.getConversationId())
                .participant(ChatUserResponse.builder()
                        .userId(participant.getUserId())
                        .username(participant.getDisplayUsername())
                        .avatarUrl(resolveAvatarUrl(participant))
                        .online(userSessionService.isUserOnline(participant.getUserId()))
                        .lastOnlineAt(participant.getLastOnlineAt())
                        .build())
                .lastMessage(conversation.getLastMessage())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(Long currentUserId) {
        List<Conversation> conversations = conversationRepository.findAllByUserId(currentUserId);

        return conversations.stream().map(conversation -> {
            User participant = conversation.getUserOne().getUserId().equals(currentUserId)
                    ? conversation.getUserTwo()
                    : conversation.getUserOne();

            long unreadCount = messageRepository.countUnreadMessages(conversation.getConversationId(), currentUserId);

            return ConversationResponse.builder()
                    .conversationId(conversation.getConversationId())
                    .participant(ChatUserResponse.builder()
                            .userId(participant.getUserId())
                            .username(participant.getDisplayUsername())
                            .avatarUrl(resolveAvatarUrl(participant))
                            .online(userSessionService.isUserOnline(participant.getUserId()))
                            .lastOnlineAt(participant.getLastOnlineAt())
                            .build())
                    .lastMessage(conversation.getLastMessage())
                    .lastMessageAt(conversation.getLastMessageAt())
                    .createdAt(conversation.getCreatedAt())
                    .updatedAt(conversation.getUpdatedAt())
                    .unreadCount(unreadCount)
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long currentUserId, Long conversationId, Pageable pageable) {
        conversationRepository.findByIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));

        return messageRepository
                .findByConversation_ConversationIdOrderByCreatedAtDesc(conversationId, pageable)
                .map(this::toMessageResponse);
    }


    @Override
    public MessageResponse sendMessage(Long currentUserId, Long conversationId, String content, String imageUrl, String clientMessageId) {
        Conversation conversation = conversationRepository.findByIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        String normalizedContent = content == null ? "" : content.trim();
        String normalizedImageUrl = imageUrl == null ? null : imageUrl.trim();

        if (normalizedContent.isBlank() && (normalizedImageUrl == null || normalizedImageUrl.isBlank())) {
            throw new IllegalArgumentException("Message content or image is required");
        }

        MessageType messageType = (normalizedImageUrl != null && !normalizedImageUrl.isBlank())
                ? MessageType.IMAGE
                : MessageType.TEXT;

        String persistedContent = normalizedContent.isBlank() ? "[image]" : normalizedContent;

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(persistedContent)
                .imageUrl(normalizedImageUrl)
                .messageType(messageType)
                .isRead(false)
                .build();

        message = messageRepository.save(message);

        conversation.setLastMessage(persistedContent);
        conversation.setLastMessageAt(message.getCreatedAt());
        conversationRepository.save(conversation);

        MessageResponse response = toMessageResponse(message, clientMessageId);

        publishRealtimeEvents(conversation, sender, response);
        return response;
    }

    @Override
    public void markConversationAsRead(Long currentUserId, Long conversationId) {
        conversationRepository.findByIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));

        messageRepository.markAsRead(conversationId, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalUnreadCount(Long currentUserId) {
        return messageRepository.countAllUnreadMessages(currentUserId);
    }

    private void publishRealtimeEvents(Conversation conversation, User sender, MessageResponse messageResponse) {
        User receiver = conversation.getUserOne().getUserId().equals(sender.getUserId())
                ? conversation.getUserTwo() : conversation.getUserOne();
        String receiverEmail = receiver.getEmail();
        if (receiverEmail == null || receiverEmail.isBlank()) return;

        // Check if receiver is online
        boolean receiverOnline = userSessionService.isUserOnline(receiver.getUserId());
        if (!receiverOnline) {
            log.info("Receiver is offline, message saved but not broadcast: receiver={}, msg={}", 
                    receiverEmail, messageResponse.getMessageId());
            return;
        }

        log.info("Publishing chat realtime events: conv={}, sender={}, receiver={}, msg={}",
                conversation.getConversationId(), sender.getEmail(), receiverEmail, messageResponse.getMessageId());

        messagingTemplate.convertAndSendToUser(receiverEmail, "/queue/chat/messages",
                ChatMessageEvent.builder()
                        .type(ChatRealtimeEventType.NEW_MESSAGE)
                        .conversationId(conversation.getConversationId())
                        .message(messageResponse)
                        .eventAt(LocalDateTime.now())
                        .build());

        long receiverUnreadCount = messageRepository.countUnreadMessages(conversation.getConversationId(), receiver.getUserId());
        messagingTemplate.convertAndSendToUser(receiverEmail, "/queue/chat/conversations",
                ConversationUpdatedEvent.builder()
                        .type(ChatRealtimeEventType.CONVERSATION_UPDATED)
                        .conversationId(conversation.getConversationId())
                        .lastMessage(messageResponse.getContent())
                        .lastMessageImageUrl(messageResponse.getImageUrl())
                        .lastMessageType(messageResponse.getMessageType())
                        .lastMessageAt(messageResponse.getCreatedAt())
                        .updatedAt(conversation.getUpdatedAt())
                        .unreadCount(receiverUnreadCount)
                        .participantId(sender.getUserId())
                        .participantUsername(sender.getDisplayUsername())
                        .participantAvatarUrl(resolveAvatarUrl(sender))
                        .participantOnline(userSessionService.isUserOnline(sender.getUserId()))
                        .participantLastOnlineAt(sender.getLastOnlineAt())
                        .build());

        messagingTemplate.convertAndSendToUser(receiverEmail, "/queue/chat/unread",
                UnreadCountEvent.builder()
                        .type(ChatRealtimeEventType.UNREAD_UPDATED)
                        .unreadCount(messageRepository.countAllUnreadMessages(receiver.getUserId()))
                        .build());

        log.info("Chat realtime: conv={}, sender={}, receiver={}, msg={}",
                conversation.getConversationId(), sender.getEmail(), receiverEmail, messageResponse.getMessageId());
    }

    private MessageResponse toMessageResponse(Message message) {
        return toMessageResponse(message, null);
    }

    private MessageResponse toMessageResponse(Message message, String clientMessageId) {
        return MessageResponse.builder()
                .messageId(message.getMessageId())
                .conversationId(message.getConversation().getConversationId())
                .senderId(message.getSender().getUserId())
                .senderUsername(message.getSender().getDisplayUsername())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .clientMessageId(clientMessageId)
                .messageType(message.getMessageType())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String resolveAvatarUrl(User user) {
        return user != null && user.getUserProfile() != null ? user.getUserProfile().getAvatarUrl() : null;
    }
}
