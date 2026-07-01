package com.example.auction_web.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class MarkNotificationsReadRequest {
    @NotEmpty
    private List<Long> notificationIds;
}
