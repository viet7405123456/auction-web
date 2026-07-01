package com.example.auction_web.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SellerResponse {
    private Long userId;
    private String email;

    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private Double rating;
    private Integer totalWins;
}

