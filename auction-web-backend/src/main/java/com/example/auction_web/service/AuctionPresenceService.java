package com.example.auction_web.service;

public interface AuctionPresenceService {
    
    public void handleSubscribe(String sessionId, String subscriptionId,Long auctionId);

    public void handleUnsubscribe(String sessionId, String subscriptionId);

    public void handleDisconnect(String sessionId);

    public int getViewerCount(Long auctionId);
}
