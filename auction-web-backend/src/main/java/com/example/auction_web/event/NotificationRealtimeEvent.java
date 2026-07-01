package com.example.auction_web.event;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.NotificationType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationRealtimeEvent {
    private Long notificationId;
    private NotificationType type;
    private String title;
    private String message;
    private Long referenceId;
    private boolean read;
    private LocalDateTime createdAt;
}
