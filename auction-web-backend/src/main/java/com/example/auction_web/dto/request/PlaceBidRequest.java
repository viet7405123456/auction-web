package com.example.auction_web.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PlaceBidRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "Bid amount must be greater than zero")
    private BigDecimal bidAmount;
}
