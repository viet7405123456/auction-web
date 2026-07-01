package com.example.auction_web.dto.response;

import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.OrderStatus;
import com.example.auction_web.entity.Enumtype.PaymentStatus;
import com.example.auction_web.entity.Payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingPaymentSummaryResponse {

    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;

    public static ListingPaymentSummaryResponse fromEntity(Payment payment) {
        if (payment == null) {
            return null;
        }

        return ListingPaymentSummaryResponse.builder()
                .orderStatus(payment.getOrderStatus())
                .paymentStatus(payment.getPaymentStatus())
                .expiresAt(payment.getExpiresAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
