package com.example.auction_web.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProxyBidResponse {

    private Long proxyBidId;
    private Long auctionId;
    private Long userId;

    private BigDecimal maxBidAmount;
    private boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private BigDecimal currentHighestBid;
    private Long currentHighestBidderId;

    private BigDecimal minimumNextBid;

    private LocalDateTime auctionEndTime;
    private Integer extendedCount;
}
