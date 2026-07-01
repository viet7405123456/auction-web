package com.example.auction_web.event;

import java.time.LocalDateTime;

import com.example.auction_web.dto.response.MessageResponse;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatMessageEvent {
    private ChatRealtimeEventType type;
    private Long conversationId;
    private MessageResponse message;
    private LocalDateTime eventAt;
}
