package com.example.auction_web.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BidResponse {
    private Long bidId;
    private Long auctionId;
    private Long userId;
    private BigDecimal bidAmount;
    private LocalDateTime bidTime;
    private String username;
    private BigDecimal currentHighestBid;
    private Long currentHighestBidderId;
    private LocalDateTime auctionEndTime;
    private Integer extendedCount;

}
