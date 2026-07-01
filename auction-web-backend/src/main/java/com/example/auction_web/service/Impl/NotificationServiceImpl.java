package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Notification;
import com.example.auction_web.event.NotificationRealtimeEvent;
import com.example.auction_web.repository.NotificationRepository;
import com.example.auction_web.service.AuctionRealtimeService;
import com.example.auction_web.service.NotificationService;

import lombok.RequiredArgsConstructor;



@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionRealtimeService auctionRealtimeService;


    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification createNotification(Long recipientUserId, NotificationType type, String title, String message,
            Long referenceId) {
        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .build();

        return notificationRepository.save(notification);
    }
    @Override
    public void pushRealTimeNotification(String recipientEmail, Notification notification) {
        NotificationRealtimeEvent payload = NotificationRealtimeEvent.builder()
                .notificationId(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();

        auctionRealtimeService.sendPrivateNotification(recipientEmail, payload);
        
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
    }

    @Override
    public void markAsRead(Long userId, List<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) {
            return;
        }

        List<Notification> notifications = notificationRepository.findByIdInAndRecipientUserId(notificationIds, userId);
        LocalDateTime now = LocalDateTime.now();

        notifications.forEach(n -> {
            if (!n.isRead()) {
                n.setRead(true);
                n.setReadAt(now);
            }
        });

        notificationRepository.saveAll(notifications);
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    public void savedNotification(Notification notification) {
        notificationRepository.save(notification);
    }

}
