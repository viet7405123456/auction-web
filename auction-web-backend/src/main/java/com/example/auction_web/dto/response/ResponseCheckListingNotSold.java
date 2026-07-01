package com.example.auction_web.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResponseCheckListingNotSold {
    boolean notSold;
    Long listingId;
}
