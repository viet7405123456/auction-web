package com.example.auction_web.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatMessageSocketRequest {
    @NotNull
    private Long conversationId;

    private String content;

    private String imageUrl;

    private String clientMessageId;

    @AssertTrue(message = "Message content or imageUrl is required")
    public boolean isValidPayload() {
        boolean hasContent = content != null && !content.trim().isBlank();
        boolean hasImage = imageUrl != null && !imageUrl.trim().isBlank();
        return hasContent || hasImage;
    }
}
