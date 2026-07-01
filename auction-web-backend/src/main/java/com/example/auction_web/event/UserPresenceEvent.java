package com.example.auction_web.event;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserPresenceEvent {
    private ChatRealtimeEventType type;
    private Long userId;
    private String username;
    private String avatarUrl;
    private boolean online;
    private LocalDateTime lastOnlineAt;
    private LocalDateTime eventAt;
}
