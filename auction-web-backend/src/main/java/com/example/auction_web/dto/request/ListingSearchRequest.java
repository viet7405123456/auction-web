package com.example.auction_web.dto.request;

import java.math.BigDecimal;

import com.example.auction_web.entity.Enumtype.ListingStatus;

import lombok.Data;

@Data
public class ListingSearchRequest {
    private String keyword;
    private String addressSell;

    private String brand;
    private Integer yearFrom;
    private Integer yearTo;
    private BigDecimal startPriceFrom;
    private BigDecimal startPriceTo;
    private Integer mileageFrom;
    private Integer mileageTo;
    
    private ListingStatus status;

    private Integer page = 0;
    private String sortBy = "createdAt";
    private String sortDir = "desc";
}
