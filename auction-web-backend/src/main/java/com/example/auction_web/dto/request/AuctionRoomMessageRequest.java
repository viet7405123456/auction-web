package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuctionRoomMessageRequest {
    @NotBlank
    private String content;
}
