package com.example.auction_web.event;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReadReceiptEvent {
    private ChatRealtimeEventType type;
    private Long conversationId;
    private Long readerId;
    private Long targetUserId;
    private LocalDateTime readAt;
}
