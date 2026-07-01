package com.example.auction_web.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.CreateDirectConversationRequest;
import com.example.auction_web.dto.request.SendMessageRequest;
import com.example.auction_web.dto.response.ConversationResponse;
import com.example.auction_web.dto.response.MessageResponse;
import com.example.auction_web.dto.response.UnreadCountResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.ChatService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getMyConversations(user.getUserId()));
    }

    @PostMapping("/conversations/direct")
    public ResponseEntity<ConversationResponse> createOrGetDirectConversation(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateDirectConversationRequest request
    ) {
        ConversationResponse response = chatService.createOrGetDirectConversation(
                user.getUserId(),
                request.getTargetUserId()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getConversationMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MessageResponse> response = chatService.getMessages(user.getUserId(), conversationId, pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse response = chatService.sendMessage(
                user.getUserId(),
                conversationId,
                request.getContent(),
                request.getImageUrl(),
                request.getClientMessageId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId
    ) {
        chatService.markConversationAsRead(user.getUserId(), conversationId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal User user) {
        long unreadCount = chatService.getTotalUnreadCount(user.getUserId());
        return ResponseEntity.ok(new UnreadCountResponse(unreadCount));
    }
}