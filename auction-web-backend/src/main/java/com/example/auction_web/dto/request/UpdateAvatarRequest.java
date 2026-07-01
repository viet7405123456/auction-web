package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAvatarRequest {
    @NotBlank(message = "avatarUrl must not be blank")
    private String avatarUrl;
}
