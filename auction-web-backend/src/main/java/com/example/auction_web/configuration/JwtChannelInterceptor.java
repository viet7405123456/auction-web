package com.example.auction_web.configuration;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import com.example.auction_web.common.TokenType;
import com.example.auction_web.service.JwtService;
import com.example.auction_web.service.UserService;
import com.example.auction_web.service.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private static final String WS_AUTH_SESSION_KEY = "WS_AUTH";
    private static final String WS_USER_ID_SESSION_KEY = "userId";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final UserSessionService userSessionService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (command == null) {
            // Heartbeat frames often come without STOMP command; use them to keep session alive.
            refreshSessionTTL(accessor);
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            tryAttachAuthentication(accessor);
            accessor.setLeaveMutable(true);
            return rebuildMessage(message, accessor);
        }

        if (StompCommand.DISCONNECT.equals(command)) {
            return message;
        }

        refreshSessionTTL(accessor);

        return message;
    }

    private void tryAttachAuthentication(StompHeaderAccessor accessor) {
        String token = resolveToken(accessor);
        if (token == null || token.isBlank()) {
            // Allow anonymous websocket sessions so guests can subscribe to public topics.
            accessor.setLeaveMutable(true);
            return;
        }

        String email = jwtService.extractEmail(token, TokenType.ACCESSTOKEN);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Invalid token: email not found");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (!jwtService.isTokenValid(token, TokenType.ACCESSTOKEN, userDetails)) {
            throw new IllegalArgumentException("Invalid token");
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, null, userDetails.getAuthorities());
        authentication.setDetails(userDetails);

        accessor.setUser(authentication);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        
        if (accessor.getSessionAttributes() != null) {
            accessor.getSessionAttributes().put(WS_AUTH_SESSION_KEY, authentication);

            Long userId = userService.getByEmail(email).getUserId();
            if (userId != null) {
                accessor.getSessionAttributes().put(WS_USER_ID_SESSION_KEY, userId);
                String sessionId = accessor.getSessionId();
                if (sessionId != null && !sessionId.isBlank()) {
                    userSessionService.registerUserSession(userId, sessionId);
                }
            }
        }

    }

    private void refreshSessionTTL(StompHeaderAccessor accessor) {
        try {
            if (accessor == null || accessor.getSessionAttributes() == null) {
                return;
            }

            Object userIdObj = accessor.getSessionAttributes().get(WS_USER_ID_SESSION_KEY);
            String sessionId = accessor.getSessionId();
            if (!(userIdObj instanceof Number number) || sessionId == null || sessionId.isBlank()) {
                return;
            }

            userSessionService.refreshUserSessionTTL(number.longValue(), sessionId);
        } catch (Exception e) {
            log.debug("Could not refresh websocket ttl", e);
        }
    }

    private Message<?> rebuildMessage(Message<?> message, StompHeaderAccessor accessor) {
        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }

    private String getAuthorizationHeader(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        return authHeader;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        String authHeader = getAuthorizationHeader(accessor);
        if (authHeader != null && !authHeader.isBlank()) {
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7).trim();
            }
            return authHeader.trim();
        }

        String xToken = accessor.getFirstNativeHeader("x-token");
        if (xToken != null && !xToken.isBlank()) {
            return xToken.trim();
        }

        return null;
    }
}
