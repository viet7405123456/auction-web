package com.example.auction_web.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CarImageResponse {
    private Long imageId;
    private Integer sortOrder;
    private String imageUrl;
}
