package com.example.auction_web.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.AuctionStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionResponse {
    private Long auctionId;
    private Long listingId;
    private ListingResponse listing;
    private AuctionStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal startingPrice;
    private BigDecimal currentHighestBid;
    private Long currentHighestBidderId;
    private BigDecimal minimumNextBid;
    private AuctionResultStatus auctionResultStatus;
    private BigDecimal reservePrice;
    private BigDecimal bidIncrement;
    private Boolean softCloseEnabled;
    private Integer softCloseTriggerSeconds;
    private Integer softCloseExtendSeconds;


    public static AuctionResponse fromEntity(Auction auction) {
        return fromEntity(auction, null);
    }

    public static AuctionResponse fromEntity(Auction auction, AuctionResultStatus auctionResultStatus) {
        return AuctionResponse.builder()
                .auctionId(auction.getAuctionId())
                .listingId(auction.getListing() != null ? auction.getListing().getId() : null)
                .listing(auction.getListing() == null ? null : ListingResponse.fromEntity(auction.getListing()))
                .status(auction.getStatus())
                .startTime(auction.getStartTime())
                .endTime(auction.getEndTime())
                .startingPrice(auction.getStartingPrice())
                .currentHighestBid(auction.getCurrentHighestBid())
                .currentHighestBidderId(
                        auction.getCurrentHighestBidder() != null
                                ? auction.getCurrentHighestBidder().getUserId()
                                : null
                )
                .minimumNextBid(resolveMinimumNextBid(auction))
                .auctionResultStatus(auctionResultStatus)
                .reservePrice(auction.getReservePrice())
                .bidIncrement(auction.getBidIncrement())
                .softCloseEnabled(auction.isSoftCloseEnabled())
                .softCloseTriggerSeconds(auction.getSoftCloseTriggerSeconds())
                .softCloseExtendSeconds(auction.getSoftCloseExtendSeconds())
                .build();
    }

    private static BigDecimal resolveMinimumNextBid(Auction auction) {
        if (auction.getCurrentHighestBid() != null && auction.getBidIncrement() != null) {
            return auction.getCurrentHighestBid().add(auction.getBidIncrement());
        }

        return auction.getStartingPrice();
    }
}
