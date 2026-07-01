package com.example.auction_web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCarImageRequest {
    private Integer sortOrder = 0;

    @NotBlank
    private String imageUrl;
}