package com.example.auction_web.service;

import java.util.List;

import com.example.auction_web.dto.response.AuctionRoomMessageResponse;

public interface AuctionRoomService {
    List<AuctionRoomMessageResponse> getMessages(Long auctionId);

    AuctionRoomMessageResponse sendMessage(Long auctionId, Long senderUserId, String content);
}
