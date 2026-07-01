package com.example.auction_web.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.dto.request.CreateAuctionRequest;
import com.example.auction_web.dto.response.AuctionDetailResponse;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.AuctionResultResponse;
import com.example.auction_web.dto.response.BidResponse;
import com.example.auction_web.entity.User;

public interface AuctionService {

    public AuctionDetailResponse getAuctionDetailById(Long auctionId);

    public AuctionResponse getAuctionById(Long auctionId);

    public AuctionResponse createAuction(CreateAuctionRequest request,User currentUser);

    public Page<AuctionResponse> getMyAuctions(Long sellerId, Pageable pageable);

    public long countBySeller(Long sellerId);
    
    public List<BidResponse> getBidsForAuction(Long auctionId);

    public AuctionResultResponse getAuctionResultById(Long auctionId);
}
