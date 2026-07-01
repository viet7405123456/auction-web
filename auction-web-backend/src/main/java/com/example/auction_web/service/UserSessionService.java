package com.example.auction_web.service;

import java.util.Set;

/**
 * Manages user WebSocket sessions and online/offline status
 * Redis stores sessions with TTL to track active connections
 * User is ONLINE if they have at least one active session
 * User is OFFLINE if they have no sessions
 */
public interface UserSessionService {

    /**
     * Register a user session when they connect via WebSocket
     * Sets session TTL so session auto-expires if connection drops
     */
    void registerUserSession(Long userId, String sessionId);

    /**
     * Remove a specific user session when they disconnect
     */
    void removeUserSession(Long userId, String sessionId);

    /**
     * Check if user is currently online (has at least one active session)
     */
    boolean isUserOnline(Long userId);

    /**
     * Get all session IDs for a user
     */
    Set<String> getUserSessionIds(Long userId);

    /**
     * Clear all sessions for a user (called on logout/disconnect)
     */
    void clearUserSessions(Long userId);

    /**
     * Persist last online timestamp when user becomes fully offline.
     */
    void updateLastOnlineAt(Long userId);

    /**
     * Refresh TTL for a websocket session and the user's session set.
     */
    void refreshUserSessionTTL(Long userId, String sessionId);

    /**
     * Resolve userId from sessionId key stored in Redis.
     */
    Long findUserIdBySessionId(String sessionId);

    /**
     * Get all user IDs that are currently online.
     */
    Set<Long> getAllOnlineUserIds();
}
