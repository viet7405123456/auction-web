package com.example.auction_web.listener;

import java.time.LocalDateTime;
import java.util.Set;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import com.example.auction_web.event.ChatRealtimeEventType;
import com.example.auction_web.event.UserPresenceEvent;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Track websocket session lifecycle for chat realtime and online status.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketEventListener {

    private static final String WS_USER_ID_SESSION_KEY = "userId";

    private final UserSessionService userSessionService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void onSessionConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        registerSessionFromAccessor(accessor, "CONNECT");
        broadcastUserPresenceToOnlineUsers(accessor);
    }

    @EventListener
    public void onSessionSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        registerSessionFromAccessor(StompHeaderAccessor.wrap(event.getMessage()), "SUBSCRIBE");
        broadcastUserPresenceToOnlineUsers(accessor);
    }

    @EventListener
    public void onSessionDisconnect(SessionDisconnectEvent event) {
        try {
            String sessionId = event.getSessionId();
            if (sessionId == null || sessionId.isBlank()) {
                return;
            }

            Long userId = extractUserIdFromAccessor(StompHeaderAccessor.wrap(event.getMessage()));
            if (userId == null) {
                userId = userSessionService.findUserIdBySessionId(sessionId);
            }

            if (userId == null) {
                log.debug("Chat websocket DISCONNECT unresolved userId: sessionId={}", sessionId);
                return;
            }

            userSessionService.removeUserSession(userId, sessionId);
    
        } catch (Exception e) {
            log.error("Error handling chat websocket DISCONNECT", e);
        }
    }

    private void registerSessionFromAccessor(StompHeaderAccessor accessor, String source) {
        try {
            String sessionId = accessor.getSessionId();
            if (sessionId == null || sessionId.isBlank()) {
                return;
            }

            Long userId = extractUserIdFromAccessor(accessor);
            if (userId == null) {
                return;
            }
            
            userSessionService.registerUserSession(userId, sessionId);
            userSessionService.refreshUserSessionTTL(userId, sessionId);
        } catch (Exception e) {
            log.error("Error handling chat websocket {} event", source, e);
        }
    }

    private Long extractUserIdFromAccessor(StompHeaderAccessor accessor) {
        if (accessor == null || accessor.getSessionAttributes() == null) {
            return null;
        }

        Object userIdObj = accessor.getSessionAttributes().get(WS_USER_ID_SESSION_KEY);
        if (userIdObj instanceof Number number) {
            return number.longValue();
        }

        if (userIdObj != null) {
            try {
                return Long.valueOf(String.valueOf(userIdObj));
            } catch (NumberFormatException e) {
                log.debug("Invalid userId in websocket session attributes: {}", userIdObj);
            }
        }

        return null;
    }

    private void broadcastUserOfflineToOnlineUsers(Long userId) {
        try {
            var user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }

            // Get all online users
            Set<Long> onlineUserIds = userSessionService.getAllOnlineUserIds();
            
            // Create presence event
            UserPresenceEvent presenceEvent = UserPresenceEvent.builder()
                    .type(ChatRealtimeEventType.USER_PRESENCE_UPDATED)
                    .userId(userId)
                    .username(user.getDisplayUsername())
                    .avatarUrl(user.getUserProfile() != null ? user.getUserProfile().getAvatarUrl() : null)
                    .online(false)
                    .lastOnlineAt(LocalDateTime.now())
                    .eventAt(LocalDateTime.now())
                    .build();

            // Broadcast to all online users (including the disconnected user if they are still considered online)
            for (Long onlineUserId : onlineUserIds) {
                var onlineUser = userRepository.findById(onlineUserId).orElse(null);
                if (onlineUser != null) {
                    messagingTemplate.convertAndSendToUser(
                            onlineUser.getEmail(),
                            "/queue/chat/presence",
                            presenceEvent
                    );
                }
            }

        } catch (Exception e) {
            log.error("Error broadcasting user offline presence", e);
        }
    }

    private void broadcastUserPresenceToOnlineUsers(StompHeaderAccessor accessor) {
        try {
            Long userId = extractUserIdFromAccessor(accessor);
            if (userId == null) {
                return;
            }

            var user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }

            // Get all online users
            Set<Long> onlineUserIds = userSessionService.getAllOnlineUserIds();
            
            // Create presence event
            UserPresenceEvent presenceEvent = UserPresenceEvent.builder()
                    .type(ChatRealtimeEventType.USER_PRESENCE_UPDATED)
                    .userId(userId)
                    .username(user.getDisplayUsername())
                    .avatarUrl(user.getUserProfile() != null ? user.getUserProfile().getAvatarUrl() : null)
                    .online(true)
                    .lastOnlineAt(user.getLastOnlineAt())
                    .eventAt(LocalDateTime.now())
                    .build();

            // Broadcast to all online users (including the connected user)
            for (Long onlineUserId : onlineUserIds) {
                var onlineUser = userRepository.findById(onlineUserId).orElse(null);
                if (onlineUser != null) {
                    messagingTemplate.convertAndSendToUser(
                            onlineUser.getEmail(),
                            "/queue/chat/presence",
                            presenceEvent
                    );
                }
            }

        } catch (Exception e) {
            log.error("Error broadcasting user presence", e);
        }
    }

}
