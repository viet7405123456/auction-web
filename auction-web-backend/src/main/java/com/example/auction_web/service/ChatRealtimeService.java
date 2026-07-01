package com.example.auction_web.service;

public interface ChatRealtimeService {
    void handleReadConversation(Long currentUserId, Long conversationId);
}
