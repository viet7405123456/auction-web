package com.example.auction_web.event;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionBeginEvent {
    private Long auctionId;

    private LocalDateTime startTime;
    
}
