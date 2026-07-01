package com.example.auction_web.dto.request;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class SendMessageRequest {
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
