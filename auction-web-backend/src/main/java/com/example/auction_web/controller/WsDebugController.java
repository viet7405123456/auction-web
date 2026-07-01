package com.example.auction_web.controller;

import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/debug/ws")
public class WsDebugController {

    private final SimpUserRegistry simpUserRegistry;

    @GetMapping("/users")
    public Object users() {
    List<Map<String, Object>> users = simpUserRegistry.getUsers().stream()
        .map(this::toUserDebug)
        .toList();

    return Map.of(
        "userCount", simpUserRegistry.getUserCount(),
        "users", users
    );
    }

    @GetMapping("/lookup")
    public Object lookup(@RequestParam("key") String key) {
    SimpUser user = simpUserRegistry.getUser(key);
    return Map.of(
        "lookupKey", key,
        "found", user != null,
        "user", user == null ? null : toUserDebug(user),
        "userCount", simpUserRegistry.getUserCount(),
        "userNames", simpUserRegistry.getUsers().stream().map(SimpUser::getName).toList()
    );
    }

    private Map<String, Object> toUserDebug(SimpUser user) {
    List<Map<String, Object>> sessions = user.getSessions().stream()
        .map(this::toSessionDebug)
        .toList();

    return Map.of(
        "name", user.getName(),
        "sessionCount", user.getSessions().size(),
        "sessions", sessions
    );
    }

    private Map<String, Object> toSessionDebug(SimpSession session) {
    List<Map<String, Object>> subscriptions = session.getSubscriptions().stream()
        .map(this::toSubscriptionDebug)
        .toList();

    return Map.of(
        "id", session.getId(),
        "subscriptionCount", session.getSubscriptions().size(),
        "subscriptions", subscriptions
    );
    }

    private Map<String, Object> toSubscriptionDebug(SimpSubscription subscription) {
    return Map.of(
        "id", subscription.getId(),
        "destination", subscription.getDestination()
    );
    }
}
