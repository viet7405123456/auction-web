package com.example.auction_web.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAuctionRequest {
    @NotNull
    private Long listingId;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    private BigDecimal startingPrice;

    private BigDecimal reservePrice;

    @NotNull
    private BigDecimal bidIncrement;

    private Boolean softCloseEnabled = true;

    private Integer softCloseTriggerSeconds;

    private Integer softCloseExtendSeconds;
}
