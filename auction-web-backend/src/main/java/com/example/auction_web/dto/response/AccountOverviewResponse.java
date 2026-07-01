package com.example.auction_web.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountOverviewResponse {
    private long listingsCreated;
    private long auctionsCreated;
    private long unreadMessages;
    private long unreadNotifications;
}
