package com.example.auction_web.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.AuctionResultStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuctionFinishedEvent {
    private final Long auctionId;
    private final Long listingId;
    
    private final AuctionResultStatus resultStatus;
    
    // Winner info (null if no winner)
    private final Long winnerId;
    private final String winnerEmail;
    private final String winnerDisplayName;
    private final BigDecimal winnerBidAmount;
    
    // Seller info
    private final Long sellerId;
    private final String sellerEmail;
    private final String sellerDisplayName;
    
    // Auction details
    private final LocalDateTime finishedAt;
    private final LocalDateTime auctionEndTime;
}
