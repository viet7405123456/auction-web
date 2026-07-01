package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "currentPassword must not be blank")
    private String currentPassword;

    @NotBlank(message = "newPassword must not be blank")
    @Size(min = 6, message = "newPassword must be at least 6 characters")
    private String newPassword;

    @NotBlank(message = "confirmPassword must not be blank")
    private String confirmPassword;
}
