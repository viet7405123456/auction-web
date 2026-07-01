package com.example.auction_web.event;

public record AuctionPresencePayload(
    Long auctionId,
    int viewCount
) {
    
}
