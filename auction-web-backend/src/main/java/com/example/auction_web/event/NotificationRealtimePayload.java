package com.example.auction_web.event;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationRealtimePayload {
    private Long notificationId;
    private String type;
    private String title;
    private String message;
    private Long referenceId;
    private LocalDateTime createdAt;
    private boolean read;
}
