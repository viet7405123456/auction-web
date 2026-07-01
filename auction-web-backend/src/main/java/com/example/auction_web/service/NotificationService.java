package com.example.auction_web.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Notification;

public interface NotificationService {
    Notification createNotification(Long recipientUserId,
            NotificationType type,
            String title,
            String message,
            Long referenceId);

    void pushRealTimeNotification(String recipientEmail, Notification payload);

    Page<Notification> getUserNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long userId, List<Long> notificationIds);

    void markAllAsRead(Long userId);

    void savedNotification(Notification notification);

    
}
