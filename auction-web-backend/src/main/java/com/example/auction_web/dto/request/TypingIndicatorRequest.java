package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for typing indicator WebSocket message
 * Sent when user starts/stops typing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorRequest {

    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    @NotNull(message = "Typing status is required")
    private boolean typing;
}
