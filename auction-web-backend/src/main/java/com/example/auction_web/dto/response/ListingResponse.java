package com.example.auction_web.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Listing;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private ListingStatus status;
    private String thumbnailUrl;
    private String addressSell;
    private UserProfileResponse seller;
    private UserProfileResponse reviewedBy;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private CarResponse car;
    private AuctionResponse auction;
    private List<ListingDocumentResponse> documents;
    private long likeCount;
    private long commentCount;
    private long viewCount;
    private boolean likedByCurrentUser;

    /**
     * Payment summary for the listing (only populated for the seller).
     */
    private ListingPaymentSummaryResponse payment;

    public static ListingResponse fromEntity(Listing listing) {
        return fromEntity(listing, 0, 0, 0, false, null, null);
    }

    public static ListingResponse fromEntity(
            Listing listing,
            long likeCount,
            long commentCount,
            long viewCount,
            boolean likedByCurrentUser,
            AuctionResponse auction
    ) {
        return fromEntity(listing, likeCount, commentCount, viewCount, likedByCurrentUser, auction, null);
    }

    public static ListingResponse fromEntity(
            Listing listing,
            long likeCount,
            long commentCount,
            long viewCount,
            boolean likedByCurrentUser,
            AuctionResponse auction,
            ListingPaymentSummaryResponse payment
    ) {
        return ListingResponse.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .status(listing.getStatus())
                .addressSell(listing.getAddressSell())
                .seller(listing.getSeller() == null ? null : UserProfileResponse.fromEntity(listing.getSeller()))
                .reviewedBy(listing.getReviewedBy() == null ? null : UserProfileResponse.fromEntity(listing.getReviewedBy()))
                .thumbnailUrl(listing.getThumbnailUrl())
                .rejectedReason(listing.getRejectedReason())
                .createdAt(listing.getCreatedAt())
                .submittedAt(listing.getSubmittedAt())
                .approvedAt(listing.getApprovedAt())
                .car(CarResponse.fromEntity(listing.getCar()))
                .auction(auction)
                .documents(
                        listing.getDocuments() == null ? List.of() :
                                listing.getDocuments().stream()
                                        .map(ListingDocumentResponse::fromEntity)
                                        .toList()
                )
                .likeCount(likeCount)
                .commentCount(commentCount)
                .viewCount(viewCount)
                .likedByCurrentUser(likedByCurrentUser)
                .payment(payment)
                .build();
    }
}