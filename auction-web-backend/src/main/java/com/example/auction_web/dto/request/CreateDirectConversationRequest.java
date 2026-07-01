package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDirectConversationRequest {
    @NotNull(message = "targetUserId is required")
    private Long targetUserId;

}
