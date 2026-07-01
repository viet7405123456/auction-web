package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReadConversationSocketRequest {
    @NotNull
    private Long conversationId;
}
