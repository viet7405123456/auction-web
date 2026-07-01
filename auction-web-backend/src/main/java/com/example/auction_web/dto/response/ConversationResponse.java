package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversationResponse {
    private Long conversationId;
    private ChatUserResponse participant;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long unreadCount;
}
