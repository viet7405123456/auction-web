package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuctionLifecycleSignalResponse {
    private final String eventType;
    private final Long auctionId;
    private final Long listingId;
    private final String lifecycle;
    private final String resultStatus;
    private final LocalDateTime occurredAt;
}
