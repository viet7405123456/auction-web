package com.example.auction_web.listener;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import com.example.auction_web.service.AuctionPresenceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionPresenceEventListener {

    private static final Pattern PRESENCE_PATTERN =
        Pattern.compile("^/topic/auctions/(\\d+)/presence$");

    private final AuctionPresenceService auctionPresenceService;

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();
        String subscriptionId = accessor.getSubscriptionId();

        Long auctionId = extractAuctionId(destination);
        if (auctionId == null) {
            return;
        }

        auctionPresenceService.handleSubscribe(sessionId, subscriptionId, auctionId);
        log.info("SUBSCRIBE presence: sessionId={}, auctionId={}", sessionId, auctionId);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String sessionId = accessor.getSessionId();
        String subscriptionId = accessor.getSubscriptionId();

        auctionPresenceService.handleUnsubscribe(sessionId, subscriptionId);
        log.info("UNSUBSCRIBE presence: sessionId={}, subscriptionId={}", sessionId, subscriptionId);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        auctionPresenceService.handleDisconnect(sessionId);
        log.info("DISCONNECT websocket: sessionId={}", sessionId);
    }

    private Long extractAuctionId(String destination) {
        if (destination == null) {
            return null;
        }

        Matcher matcher = PRESENCE_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return null;
        }

        return Long.valueOf(matcher.group(1));
    }
}