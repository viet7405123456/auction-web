package com.example.auction_web.service;

import com.example.auction_web.dto.response.AuctionRoomMessageResponse;
import com.example.auction_web.event.AuctionBeginEvent;
import com.example.auction_web.event.AuctionBidRealtimeEvent;



public interface AuctionRealtimeService {
    void publishBidUpdate(AuctionBidRealtimeEvent event);  
    void publishAuctionRoomMessage(AuctionRoomMessageResponse message);
    
    void sendPrivateNotification(String userEmail, Object payload);

    void publishAuctionLifecycleSignal(Long auctionId, Object payload);

    void publishAuctionStartNotification(AuctionBeginEvent event);
}
