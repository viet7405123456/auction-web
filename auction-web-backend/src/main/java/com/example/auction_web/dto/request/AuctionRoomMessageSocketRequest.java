package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuctionRoomMessageSocketRequest {
    @NotNull
    private Long auctionId;

    @NotBlank
    private String content;
}
