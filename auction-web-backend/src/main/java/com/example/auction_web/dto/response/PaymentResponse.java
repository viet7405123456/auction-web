package com.example.auction_web.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.auction_web.entity.Payment;
import com.example.auction_web.entity.AuctionResult;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.entity.Enumtype.OrderStatus;
import com.example.auction_web.entity.Enumtype.PaymentStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {

    private Long paymentId;
    private Long auctionResultId;
    private Long auctionId;
    private Long listingId;
    private String listingTitle;
    private String listingThumbnailUrl;
    private BigDecimal amount;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private String paymentReference;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;

    public static PaymentResponse fromEntity(Payment payment) {
        AuctionResult auctionResult = payment.getAuctionResult();
        Auction auction = auctionResult != null ? auctionResult.getAuction() : null;
        Listing listing = auction != null ? auction.getListing() : null;

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .auctionResultId(auctionResult != null ? auctionResult.getResultId() : null)
                .auctionId(auction != null ? auction.getAuctionId() : null)
                .listingId(listing != null ? listing.getId() : null)
                .listingTitle(listing != null ? listing.getTitle() : null)
                .listingThumbnailUrl(listing != null ? listing.getThumbnailUrl() : null)
                .amount(payment.getAmount())
                .orderStatus(payment.getOrderStatus())
                .paymentStatus(payment.getPaymentStatus())
                .paymentReference(payment.getPaymentReference())
                .createdAt(payment.getCreatedAt())
                .expiresAt(payment.getExpiresAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
