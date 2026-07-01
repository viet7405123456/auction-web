package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionActionResponse {
    private Long auctionId;
    private AuctionStatus auctionStatus;
    private AuctionResultStatus resultStatus;
    private ListingStatus listingStatus;
    private LocalDateTime endTime;
    private String message;
}
