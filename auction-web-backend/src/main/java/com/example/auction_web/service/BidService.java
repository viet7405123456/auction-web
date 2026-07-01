package com.example.auction_web.service;

import java.math.BigDecimal;
import java.util.List;

import com.example.auction_web.dto.request.PlaceBidRequest;
import com.example.auction_web.dto.response.BidResponse;
import com.example.auction_web.dto.response.ProxyBidResponse;

public interface BidService {
    BidResponse placeBid(Long auctionId,Long userId,PlaceBidRequest request);

    ProxyBidResponse setProxyBid(Long auctionId, Long userId, BigDecimal maxBidAmount);

    ProxyBidResponse getProxyBid(Long auctionId, Long userId);

    ProxyBidResponse disableProxyBid(Long auctionId, Long userId);
    
    List<BidResponse> getBidsForAuction(Long auctionId);
}
