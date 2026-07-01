package com.example.auction_web.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import com.example.auction_web.dto.request.ChatMessageSocketRequest;
import com.example.auction_web.dto.request.ReadConversationSocketRequest;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.ChatRealtimeService;
import com.example.auction_web.service.ChatService;
import com.example.auction_web.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatSocketController {

    private static final String WS_AUTH_SESSION_KEY = "WS_AUTH";

    private final ChatService chatService;
    private final ChatRealtimeService chatRealtimeService;
    private final UserService userService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload @Valid ChatMessageSocketRequest request,
                            Principal principal,
                            SimpMessageHeaderAccessor headerAccessor) {
        try {
            User currentUser = resolveCurrentUser(principal, headerAccessor);
            if (currentUser != null) {
                chatService.sendMessage(
                        currentUser.getUserId(),
                        request.getConversationId(),
                        request.getContent(),
                        request.getImageUrl(),
                        request.getClientMessageId()
                );
            } else {
                log.warn("Failed to resolve user for chat message");
            }
        } catch (Exception e) {
            log.error("Error sending chat message: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.read")
    public void markAsRead(@Payload @Valid ReadConversationSocketRequest request,
                           Principal principal,
                           SimpMessageHeaderAccessor headerAccessor) {
        try {
            User currentUser = resolveCurrentUser(principal, headerAccessor);
            if (currentUser != null) {
                chatRealtimeService.handleReadConversation(currentUser.getUserId(), request.getConversationId());
            } else {
                log.warn("Failed to resolve user for read receipt");
            }
        } catch (Exception e) {
            log.error("Error marking conversation as read: {}", e.getMessage(), e);
        }
    }

    private User resolveCurrentUser(Principal principal, SimpMessageHeaderAccessor accessor) {
        Principal effectivePrincipal = extractPrincipal(principal, accessor);
        if (effectivePrincipal == null) {
            log.warn("WebSocket authentication required - principal is null");
            return null;
        }

        User user = toUser(effectivePrincipal);
        if (user == null) {
            log.warn("Unsupported WebSocket principal type: {}", effectivePrincipal.getClass().getName());
        }
        return user;
    }

    private Principal extractPrincipal(Principal principal, SimpMessageHeaderAccessor accessor) {
        if (principal != null) {
            return principal;
        }

        Principal accessorUser = accessor.getUser();
        if (accessorUser != null) {
            return accessorUser;
        }

        if (accessor.getSessionAttributes() == null) {
            return null;
        }

        Object authObj = accessor.getSessionAttributes().get(WS_AUTH_SESSION_KEY);
        if (authObj instanceof Authentication authentication && authentication.isAuthenticated()) {
            return authentication;
        }

        return null;
    }

    private User toUser(Principal principal) {
        if (principal instanceof Authentication authentication) {
            return toUser(authentication.getPrincipal());
        }

        if (principal instanceof UserDetails userDetails) {
            return findUserByEmail(userDetails.getUsername());
        }

        return null;
    }

    private User toUser(Object principalObj) {
        if (principalObj instanceof User user) {
            return user;
        }

        if (principalObj instanceof UserDetails userDetails) {
            return findUserByEmail(userDetails.getUsername());
        }

        return null;
    }

    private User findUserByEmail(String email) {
        try {
            return userService.getByEmail(email);
        } catch (Exception e) {
            log.error("Failed to get user by email: {}", email, e);
            return null;
        }
    }
}