package com.example.auction_web.service;

import java.time.LocalDateTime;
import java.util.List;

import com.example.auction_web.dto.response.AuctionActionResponse;

public interface AuctionLifecycleService {
    public void activateAuction(Long auctionId);

    public AuctionActionResponse finishAuction(Long auctionId);

    public AuctionActionResponse cancelAuction(Long auctionId,Long userId);

    List<Long> findAuctionIdsToFinish(LocalDateTime now);

    List<Long> findAuctionIdsToActivate(LocalDateTime now);
}
