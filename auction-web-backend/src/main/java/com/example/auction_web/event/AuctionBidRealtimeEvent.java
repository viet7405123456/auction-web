package com.example.auction_web.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionBidRealtimeEvent {
    private Long auctionId;
    private Long bidId;

    private BigDecimal newHighestBid;
    private BigDecimal minimumNextBid;
    
    private Long highestBidderId;
    private String highestBidderDisplayName;



    private LocalDateTime bidTime;
    private LocalDateTime endTime;
    private Integer extendedCount;

    private String message;
}
