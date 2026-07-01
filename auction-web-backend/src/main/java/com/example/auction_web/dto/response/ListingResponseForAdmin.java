package com.example.auction_web.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Listing;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class ListingResponseForAdmin {
    private Long id;
    private String title;
    private String description;
    private ListingStatus status;
    private Long sellerId;
    private long reviewedByAdminId;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
    private CarResponse car;
    private List<ListingDocumentResponse> documents;

    public static ListingResponseForAdmin fromEntity(Listing listing) {
        return ListingResponseForAdmin.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .status(listing.getStatus())
                .sellerId(listing.getSeller().getUserId())
                .reviewedByAdminId(listing.getReviewedBy() == null ? null : listing.getReviewedBy().getUserId())
                .thumbnailUrl(listing.getThumbnailUrl())
                .createdAt(listing.getCreatedAt())
                .submittedAt(listing.getSubmittedAt())
                .car(CarResponse.fromEntity(listing.getCar()))
                .documents(
                        listing.getDocuments() == null ? List.of() :
                                listing.getDocuments().stream()
                                        .map(ListingDocumentResponse::fromEntity)
                                        .toList()
                )
                .build();
    }

}
