package com.example.auction_web.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingEngagementSummaryResponse {
    private Long listingId;
    private long likeCount;
    private long commentCount;
    private boolean likedByCurrentUser;
}
