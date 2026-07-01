package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.ContactMessage;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactMessageResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String message;
    private LocalDateTime createdAt;

    public static ContactMessageResponse fromEntity(ContactMessage contactMessage) {
        return ContactMessageResponse.builder()
                .id(contactMessage.getId())
                .userId(contactMessage.getUserId())
                .fullName(contactMessage.getFullName())
                .email(contactMessage.getEmail())
                .phone(contactMessage.getPhone())
                .message(contactMessage.getMessage())
                .createdAt(contactMessage.getCreatedAt())
                .build();
    }
}
