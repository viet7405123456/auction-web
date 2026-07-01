package com.example.auction_web.service.Impl;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.auction_web.event.AuctionPresencePayload;
import com.example.auction_web.service.AuctionPresenceService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AuctionPresenceServiceImpl implements AuctionPresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    // auctionId -> các session đang xem auction đó
    private final Map<Long, Set<String>> auctionSessions = new HashMap<>();

    // sessionId:subscriptionId -> auctionId
    private final Map<String, Long> subscriptionToAuction = new HashMap<>();

    // sessionId -> các subscriptionKey
    private final Map<String, Set<String>> sessionToSubscriptionKeys = new HashMap<>();

    // sessionId -> (auctionId -> refCount)
    private final Map<String, Map<Long, Integer>> sessionAuctionRefCounts = new HashMap<>();


    @Override
    public synchronized void handleSubscribe(String sessionId, String subscriptionId, Long auctionId) {
        if (sessionId == null || subscriptionId == null || auctionId == null) {
            return;
        }

        String subKey = buildSubKey(sessionId, subscriptionId);

        if (subscriptionToAuction.containsKey(subKey)) {
            return;
        }

        subscriptionToAuction.put(subKey, auctionId);
        sessionToSubscriptionKeys
            .computeIfAbsent(sessionId, k -> new HashSet<>())
            .add(subKey);

        boolean changed = incrementViewerRef(sessionId, auctionId);
        if (changed) {
            broadcastViewerCount(auctionId);
        }
    }


    @Override
    public synchronized void handleUnsubscribe(String sessionId, String subscriptionId) {
        if (sessionId == null || subscriptionId == null) {
            return;
        }

        String subKey = buildSubKey(sessionId, subscriptionId);
        Long auctionId = subscriptionToAuction.remove(subKey);
        if (auctionId == null) {
            return;
        }

        Set<String> subKeys = sessionToSubscriptionKeys.get(sessionId);
        if (subKeys != null) {
            subKeys.remove(subKey);
            if (subKeys.isEmpty()) {
                sessionToSubscriptionKeys.remove(sessionId);
            }
        }

        boolean changed = decrementViewerRef(sessionId, auctionId);
        if (changed) {
            broadcastViewerCount(auctionId);
        }
    }

    @Override
    public synchronized void handleDisconnect(String sessionId) {
        if (sessionId == null) {
            return;
        }

        Set<String> subKeys = sessionToSubscriptionKeys.remove(sessionId);
        if (subKeys == null || subKeys.isEmpty()) {
            return;
        }

        Set<Long> affectedAuctionIds = new HashSet<>();

        for (String subKey : new HashSet<>(subKeys)) {
            Long auctionId = subscriptionToAuction.remove(subKey);
            if (auctionId == null) {
                continue;
            }

            boolean changed = decrementViewerRef(sessionId, auctionId);
            if (changed) {
                affectedAuctionIds.add(auctionId);
            }
        }

        for (Long auctionId : affectedAuctionIds) {
            broadcastViewerCount(auctionId);
        }
    }

    @Override
    public synchronized int getViewerCount(Long auctionId) {
        return auctionSessions.getOrDefault(auctionId, Set.of()).size();
    }

    private boolean incrementViewerRef(String sessionId, Long auctionId) {
        Map<Long, Integer> refMap =
            sessionAuctionRefCounts.computeIfAbsent(sessionId, k -> new HashMap<>());

        int next = refMap.getOrDefault(auctionId, 0) + 1;
        refMap.put(auctionId, next);

        if (next == 1) {
            auctionSessions.computeIfAbsent(auctionId, k -> new HashSet<>()).add(sessionId);
            return true;
        }

        return false;
    }

    private boolean decrementViewerRef(String sessionId, Long auctionId) {
        Map<Long, Integer> refMap = sessionAuctionRefCounts.get(sessionId);
        if (refMap == null) {
            return false;
        }

        Integer current = refMap.get(auctionId);
        if (current == null) {
            return false;
        }

        if (current <= 1) {
            refMap.remove(auctionId);
            if (refMap.isEmpty()) {
                sessionAuctionRefCounts.remove(sessionId);
            }

            Set<String> sessions = auctionSessions.get(auctionId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    auctionSessions.remove(auctionId);
                }
            }

            return true;
        }

        refMap.put(auctionId, current - 1);
        return false;
    }

    private void broadcastViewerCount(Long auctionId) {
        int viewerCount = getViewerCount(auctionId);
        messagingTemplate.convertAndSend(
            "/topic/auctions/" + auctionId + "/presence",
            new AuctionPresencePayload(auctionId, viewerCount)
        );
    }

    private String buildSubKey(String sessionId, String subscriptionId) {
        return sessionId + ":" + subscriptionId;
    }
    
}
