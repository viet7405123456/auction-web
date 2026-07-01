package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.User;
import com.example.auction_web.entity.UserProfile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    Long userId;
    String username;
    String email;
    String role;
    
    boolean enabled;
    boolean accountLocked;
    boolean isVerified;

    LocalDateTime  createdAt;
    LocalDateTime  updatedAt;

    UserProfile profile;

    static public UserProfileResponse fromEntity(User user) {
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getDisplayUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .accountLocked(user.isAccountLocked())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .profile(user.getUserProfile())
                .build();
    }
}
