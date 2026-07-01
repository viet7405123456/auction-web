package com.example.auction_web.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.dto.response.ConversationResponse;
import com.example.auction_web.dto.response.MessageResponse;

public interface ChatService {
    ConversationResponse createOrGetDirectConversation(Long currentUserId, Long targetUserId);
    List<ConversationResponse> getMyConversations(Long currentUserId);
    Page<MessageResponse> getMessages(Long currentUserId, Long conversationId, Pageable pageable);
    MessageResponse sendMessage(Long currentUserId, Long conversationId, String content, String imageUrl, String clientMessageId);
    void markConversationAsRead(Long currentUserId, Long conversationId);
    long getTotalUnreadCount(Long currentUserId);
}
