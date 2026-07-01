package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateListingCommentRequest {
    @NotBlank(message = "Comment content is required")
    @Size(max = 1000, message = "Comment content must be at most 1000 characters")
    private String content;
}
