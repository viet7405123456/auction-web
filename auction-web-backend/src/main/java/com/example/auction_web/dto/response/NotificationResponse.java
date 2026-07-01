package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Notification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Long referenceId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
