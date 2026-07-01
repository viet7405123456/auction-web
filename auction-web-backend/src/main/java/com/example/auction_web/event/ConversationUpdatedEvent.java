package com.example.auction_web.event;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.MessageType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversationUpdatedEvent {
    private ChatRealtimeEventType type;
    private Long conversationId;
    private String lastMessage;
    private String lastMessageImageUrl;
    private MessageType lastMessageType;
    private LocalDateTime lastMessageAt;
    private LocalDateTime updatedAt;
    private Long unreadCount;
    private Long participantId;
    private String participantUsername;
    private String participantAvatarUrl;
    private boolean participantOnline;
    private LocalDateTime participantLastOnlineAt;
}
