package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatUserResponse {
    private Long userId;
    private String username;
    private String avatarUrl;
    private boolean online;
    private LocalDateTime lastOnlineAt;
}
