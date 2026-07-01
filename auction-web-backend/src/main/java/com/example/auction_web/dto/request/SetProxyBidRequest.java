package com.example.auction_web.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetProxyBidRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "maxBidAmount must be greater than zero")
    private BigDecimal maxBidAmount;
}
