package com.example.auction_web.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BidPlacedEvent {
    private final Long auctionId;
    private final Long bidId;

    private final BigDecimal newHighestBid;
    private final BigDecimal minimumNextBid;

    private final Long highestBidderId;
    private final String highestBidderEmail;
    private final String highestBidderDisplayName;

    private final LocalDateTime bidTime;
    private final LocalDateTime endTime;
    private final Integer extendedCount;

    private final Long previousHighestBidderId;
    private final String previousHighestBidderEmail;
}