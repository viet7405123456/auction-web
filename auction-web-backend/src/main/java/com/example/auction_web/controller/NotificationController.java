package com.example.auction_web.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.MarkNotificationsReadRequest;
import com.example.auction_web.dto.response.NotificationResponse;
import com.example.auction_web.dto.response.UnreadCountResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.NotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<NotificationResponse> response = notificationService
                .getUserNotifications(user.getUserId(), pageable)
                .map(NotificationResponse::fromEntity);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal User user) {
        long unreadCount = notificationService.getUnreadCount(user.getUserId());
        return ResponseEntity.ok(new UnreadCountResponse(unreadCount));
    }

    @PatchMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody MarkNotificationsReadRequest request
    ) {
        notificationService.markAsRead(user.getUserId(), request.getNotificationIds());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getUserId());
        return ResponseEntity.ok().build();
    }
}
