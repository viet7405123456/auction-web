package com.example.auction_web.dto.response;

import java.math.BigDecimal;

import com.example.auction_web.entity.Enumtype.AuctionResultStatus;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class AuctionResultResponse {
    Long winnerUserId;
    AuctionResultStatus auctionResultStatus;
    String winnerDisplayName;
    String winnerUsername;
    String winnerEmail;
    BigDecimal winningBidAmount;
    
    static public AuctionResultResponse fromEntity(
            Long winnerUserId,
            AuctionResultStatus auctionStatus,
            String winnerDisplayName,
            String winnerUsername,
            String winnerEmail,
            BigDecimal winningBidAmount) {
        return AuctionResultResponse.builder()
                .winnerUserId(winnerUserId)
                .auctionResultStatus(auctionStatus)
                .winnerDisplayName(winnerDisplayName)
                .winnerUsername(winnerUsername)
                .winnerEmail(winnerEmail)
                .winningBidAmount(winningBidAmount)
                .build();
    }

}
