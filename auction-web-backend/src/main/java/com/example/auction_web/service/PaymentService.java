package com.example.auction_web.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.dto.response.PaymentResponse;
import com.example.auction_web.entity.AuctionResult;

public interface PaymentService {

    Page<PaymentResponse> getMyPayments(Long userId, Pageable pageable);

    PaymentResponse completePayment(Long userId, Long paymentId);

    void createPaymentForAuctionResult(AuctionResult auctionResult);

    /**
     * Expire overdue pending payments (e.g. after 24h) and revert listing back to APPROVED
     * so seller can create a new auction.
     */
    void expireOverduePayments();
}
