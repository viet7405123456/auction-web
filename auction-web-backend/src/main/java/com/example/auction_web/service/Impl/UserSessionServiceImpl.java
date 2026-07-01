package com.example.auction_web.service.Impl;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.UserSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Manages user WebSocket sessions using Redis
 * Purpose: Track online/offline status by counting active sessions
 * 
 * Redis Key Structure:
 * - ws:sessions:{userId} -> Set<String> of session IDs
 * - Each session ID in the set has TTL (auto-expires if no heartbeat)
 * 
 * User is ONLINE if ws:sessions:{userId} has at least one session ID
 * User is OFFLINE if ws:sessions:{userId} is empty or doesn't exist
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSessionServiceImpl implements UserSessionService {
    
    private static final String SESSION_KEY_PREFIX = "ws:sessions:";
    private static final String SESSION_VALUE_KEY_PREFIX = "ws:session:";
    private static final Duration SESSION_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;

    @Override
    public void registerUserSession(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            log.warn("Cannot register session: userId={}, sessionId={}", userId, sessionId);
            return;
        }

        try {
            String key = SESSION_KEY_PREFIX + userId;
            redisTemplate.opsForSet().add(key, sessionId);
            redisTemplate.opsForValue().set(SESSION_VALUE_KEY_PREFIX + sessionId, userId, SESSION_TTL);
            redisTemplate.expire(key, SESSION_TTL);
            
            
        } catch (Exception e) {
            log.error("Error registering user session to Redis: userId={}, sessionId={}", userId, sessionId, e);
            // Continue even if Redis fails - session tracking won't work but app shouldn't crash
        }
    }

    @Override
    public void removeUserSession(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            log.warn("Cannot remove session: userId={}, sessionId={}", userId, sessionId);
            return;
        }

        try {
            String key = SESSION_KEY_PREFIX + userId;
            redisTemplate.opsForSet().remove(key, sessionId);
            redisTemplate.delete(SESSION_VALUE_KEY_PREFIX + sessionId);

            Long activeSessions = countActiveSessions(userId);
            if (activeSessions == null || activeSessions <= 0) {
                redisTemplate.delete(key);
                updateLastOnlineAt(userId);

                // Optionally broadcast user offline status here if needed
                // broadcastUserOffline(userId);
            } else {
                log.debug("User still has active sessions: userId={}, activeSessions={}", userId, activeSessions);
            }
            
        } catch (Exception e) {
            log.error("Error removing user session from Redis: userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    @Override
    public boolean isUserOnline(Long userId) {
        if (userId == null) {
            return false;
        }

        try {
            Long activeSessions = countActiveSessions(userId);
            boolean isOnline = activeSessions != null && activeSessions > 0;
            
            if (!isOnline) {
                log.debug("User is offline (no active sessions in Redis): userId={}, key={}", userId, SESSION_KEY_PREFIX + userId);
            }
            
            return isOnline;
        } catch (Exception e) {
            log.error("Error checking user online status in Redis (returning false): userId={}", userId, e);
            return false; // Assume offline on Redis error
        }
    }

    @Override
    public Set<String> getUserSessionIds(Long userId) {
        if (userId == null) {
            return new HashSet<>();
        }

        try {
            return getActiveSessionIds(userId);
        } catch (Exception e) {
            log.error("Error getting user session IDs: userId={}", userId, e);
            return new HashSet<>();
        }
    }

    @Override
    public void clearUserSessions(Long userId) {
        if (userId == null) {
            log.warn("Cannot clear sessions: userId is null");
            return;
        }

        try {
            String key = SESSION_KEY_PREFIX + userId;
            Set<String> sessions = getActiveSessionIds(userId);
            for (String sessionId : sessions) {
                redisTemplate.delete(SESSION_VALUE_KEY_PREFIX + sessionId);
            }
            redisTemplate.delete(key);
            updateLastOnlineAt(userId);

        } catch (Exception e) {
            log.error("Error clearing user sessions: userId={}", userId, e);
        }
    }

    @Override
    public void updateLastOnlineAt(Long userId) {
        if (userId == null) {
            log.warn("Cannot update lastOnlineAt: userId is null");
            return;
        }

        try {
            userRepository.findById(userId).ifPresent(user -> {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                user.setLastOnlineAt(now);
                userRepository.save(user);
                log.info("Updated lastOnlineAt for user: userId={}, timestamp={}", userId, now);
            });
            
            if (!userRepository.existsById(userId)) {
                log.warn("User not found when updating lastOnlineAt: userId={}", userId);
            }
        } catch (Exception e) {
            log.error("Error updating last online at for user: userId={}", userId, e);
        }
    }

    @Override
    public void refreshUserSessionTTL(Long userId, String sessionId) {
        if (userId == null || sessionId == null || sessionId.isBlank()) {
            return;
        }

        try {
            redisTemplate.expire(SESSION_KEY_PREFIX + userId, SESSION_TTL);
            redisTemplate.expire(SESSION_VALUE_KEY_PREFIX + sessionId, SESSION_TTL);
            
        } catch (Exception e) {
            log.debug("Failed to refresh websocket session ttl: userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    @Override
    public Long findUserIdBySessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }

        try {
            Object value = redisTemplate.opsForValue().get(SESSION_VALUE_KEY_PREFIX + sessionId);
            if (value == null) {
                return null;
            }
            if (value instanceof Number number) {
                return number.longValue();
            }
            return Long.valueOf(String.valueOf(value));
        } catch (Exception e) {
            log.debug("Failed to resolve userId from sessionId={}", sessionId, e);
            return null;
        }
    }

    @Override
    public Set<Long> getAllOnlineUserIds() {
        try {
            Set<Long> onlineUserIds = new HashSet<>();
            Set<String> keys = redisTemplate.keys(SESSION_KEY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                for (String key : keys) {
                    String userIdStr = key.substring(SESSION_KEY_PREFIX.length());
                    try {
                        Long userId = Long.valueOf(userIdStr);
                        if (isUserOnline(userId)) {
                            onlineUserIds.add(userId);
                        }
                    } catch (NumberFormatException e) {
                        log.debug("Invalid userId in session key: {}", key);
                    }
                }
            }
            return onlineUserIds;
        } catch (Exception e) {
            log.error("Error getting all online user IDs", e);
            return new HashSet<>();
        }
    }

    private Set<String> getActiveSessionIds(Long userId) {
        if (userId == null) {
            return new HashSet<>();
        }

        String key = SESSION_KEY_PREFIX + userId;
        Set<Object> sessions = redisTemplate.opsForSet().members(key);
        if (sessions == null || sessions.isEmpty()) {
            return new HashSet<>();
        }

        Set<String> activeSessions = sessions.stream()
                .map(Object::toString)
                .filter(sessionId -> Boolean.TRUE.equals(redisTemplate.hasKey(SESSION_VALUE_KEY_PREFIX + sessionId)))
                .collect(Collectors.toSet());

        for (Object sessionObj : sessions) {
            String sessionId = sessionObj.toString();
            if (!activeSessions.contains(sessionId)) {
                redisTemplate.opsForSet().remove(key, sessionId);
            }
        }

        if (activeSessions.isEmpty()) {
            redisTemplate.delete(key);
        }

        return activeSessions;
    }

    private Long countActiveSessions(Long userId) {
        return (long) getActiveSessionIds(userId).size();
    }
}
