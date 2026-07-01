package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.ListingComment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingCommentResponse {
    private Long id;
    private Long listingId;
    private Long userId;
    private String username;
    private String avatarUrl;
    private String content;
    private LocalDateTime createdAt;

    public static ListingCommentResponse fromEntity(ListingComment comment) {
        return ListingCommentResponse.builder()
                .id(comment.getId())
                .listingId(comment.getListing() == null ? null : comment.getListing().getId())
                .userId(comment.getUser() == null ? null : comment.getUser().getUserId())
                .username(comment.getUser() == null ? null : comment.getUser().getDisplayUsername())
                .avatarUrl(comment.getUser() == null || comment.getUser().getUserProfile() == null
                        ? null
                        : comment.getUser().getUserProfile().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
