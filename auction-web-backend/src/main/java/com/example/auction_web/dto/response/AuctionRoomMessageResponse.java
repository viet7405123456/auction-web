package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuctionRoomMessageResponse {
    private Long messageId;
    private Long auctionId;
    private Long senderId;
    private String senderDisplayName;
    private String senderEmail;
    private String content;
    private LocalDateTime createdAt;
}
