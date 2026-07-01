package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.MessageType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {
    private Long messageId;
    private Long conversationId;
    private Long senderId;
    private String senderUsername;
    private String content;
    private String imageUrl;
    private String clientMessageId;
    private MessageType messageType;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}