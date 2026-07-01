package com.example.auction_web.dto.request;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.ListingStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListingPatchRequest {
    private ListingStatus status;
    private String rejectedReason;
    private Long userId;
    private LocalDateTime approvedAt;
}
