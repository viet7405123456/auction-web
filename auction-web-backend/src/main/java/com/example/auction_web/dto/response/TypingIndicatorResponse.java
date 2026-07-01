package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response sent to WebSocket subscribers when user changes typing status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorResponse {

    private String type; // "USER_TYPING" or "USER_STOPPED_TYPING"
    private Long conversationId;
    private Long userId;
    private String username;
    private boolean isTyping;
    private LocalDateTime timestamp;
}
