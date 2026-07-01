package com.example.auction_web.event;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UnreadCountEvent {
    private ChatRealtimeEventType type;
    private Long unreadCount;
}
