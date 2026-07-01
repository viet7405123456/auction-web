package com.example.auction_web.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import com.example.auction_web.common.TokenType;
import com.example.auction_web.dto.request.AuctionRoomMessageSocketRequest;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.AuctionRoomService;
import com.example.auction_web.service.JwtService;
import com.example.auction_web.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AuctionRoomSocketController {

    private final AuctionRoomService auctionRoomService;
    private final JwtService jwtService;
    private final UserService userService;

    @MessageMapping("/auction.room.send")
    public void sendAuctionRoomMessage(
            @Payload @Valid AuctionRoomMessageSocketRequest request,
            Authentication authentication,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        try {
            User currentUser = resolveCurrentUser(authentication, headerAccessor);
            if (currentUser != null) {
                auctionRoomService.sendMessage(request.getAuctionId(), currentUser.getUserId(), request.getContent());
            } else {
                log.warn("Failed to resolve user for auction room message");
            }
        } catch (Exception e) {
            log.error("Error sending auction room message: {}", e.getMessage(), e);
        }
    }

    private User resolveCurrentUser(Authentication authentication, SimpMessageHeaderAccessor accessor) {
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User user) {
                return user;
            }
            if (principal instanceof UserDetails userDetails) {
                return userService.getByEmail(userDetails.getUsername());
            }
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket principal is null and Authorization header is missing");
            return null;
        }

        String token = authHeader.substring(7);
        
        // Check if token is expired first
        if (jwtService.isTokenExpiredSafe(token, TokenType.ACCESSTOKEN)) {
            log.warn("WebSocket token is expired");
            return null;
        }
        
        // Safely extract email without throwing exceptions
        String email = jwtService.extractEmailSafe(token, TokenType.ACCESSTOKEN);
        if (email == null || email.isBlank()) {
            log.warn("Invalid WebSocket token - could not extract email");
            return null;
        }
        
        try {
            return userService.getByEmail(email);
        } catch (Exception e) {
            log.error("Failed to get user by email: {}", email, e);
            return null;
        }
    }
}
