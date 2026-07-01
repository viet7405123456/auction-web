package com.example.auction_web.service.Impl;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.auction_web.dto.response.AuctionRoomMessageResponse;
import com.example.auction_web.event.AuctionBeginEvent;
import com.example.auction_web.event.AuctionBidRealtimeEvent;
import com.example.auction_web.service.AuctionRealtimeService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuctionRealtimeServiceImpl implements AuctionRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publishBidUpdate(AuctionBidRealtimeEvent event) {
        String destination = "/topic/auctions/" + event.getAuctionId();
        messagingTemplate.convertAndSend(destination, event);
    }

    @Override
    public void publishAuctionRoomMessage(AuctionRoomMessageResponse message) {
        String destination = "/topic/auctions/" + message.getAuctionId() + "/room/messages";
        messagingTemplate.convertAndSend(destination, message);
    }

    @Override
    public void sendPrivateNotification(String userEmail, Object payload) {
        messagingTemplate.convertAndSendToUser(
                userEmail,
                "/queue/notifications",
                payload
        );
        
    }

    @Override
    public void publishAuctionLifecycleSignal(Long auctionId, Object payload) {
        String destination = "/topic/auctions/" + auctionId + "/lifecycle";
        messagingTemplate.convertAndSend(destination, payload);
    }

    @Override
    public void publishAuctionStartNotification(AuctionBeginEvent event) {
        String destination = "/topic/auctions/" + event.getAuctionId()+"/start";
        messagingTemplate.convertAndSend(destination, event);   
    }
    
}
