package com.example.auction_web.dto.response;

import java.io.Serial;
import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse implements Serializable{
    private String accessToken;
    private String refreshToken;
    private Long userId;
    String tokenType = "Bearer";
}
