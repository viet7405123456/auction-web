package com.example.auction_web.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.AuctionStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionDetailResponse {
    private Long auctionId;
    private AuctionStatus status;

    private BigDecimal startingPrice;
    private BigDecimal reservePrice;
    private BigDecimal bidIncrement;
    private BigDecimal currentHighestBid;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private CarResponse car;
    private SellerResponse seller;
}

