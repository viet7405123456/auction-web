package com.example.auction_web.service.Impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.response.PaymentResponse;
import com.example.auction_web.entity.AuctionResult;
import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Enumtype.OrderStatus;
import com.example.auction_web.entity.Enumtype.PaymentStatus;
import com.example.auction_web.entity.Payment;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.exception.BadRequestException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.AuctionResultRepository;
import com.example.auction_web.repository.PaymentRepository;
import com.example.auction_web.service.PaymentService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final long PAYMENT_EXPIRY_HOURS = 24;

    private final PaymentRepository paymentRepository;
    private final AuctionResultRepository auctionResultRepository;

    @Override
    @Transactional
    public Page<PaymentResponse> getMyPayments(Long userId, Pageable pageable) {
        syncMissingWinnerPayments(userId);
        return paymentRepository.findByBuyer_UserIdOrderByCreatedAtDesc(userId, pageable)
                .map(PaymentResponse::fromEntity);
    }

    @Override
    @Transactional
    public void expireOverduePayments() {
        LocalDateTime now = LocalDateTime.now();
        List<Payment> overduePayments = paymentRepository.findExpiredPaymentsWithListing(OrderStatus.PENDING_PAYMENT, now);

        if (overduePayments.isEmpty()) {
            return;
        }

        for (Payment payment : overduePayments) {
            // Defensive checks in case the row changed state since the query
            if (payment.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
                continue;
            }
            if (payment.getPaymentStatus() == PaymentStatus.SUCCESS || payment.getOrderStatus() == OrderStatus.PAID) {
                continue;
            }

            payment.setOrderStatus(OrderStatus.EXPIRED);

            if (payment.getAuctionResult() != null
                    && payment.getAuctionResult().getAuction() != null
                    && payment.getAuctionResult().getAuction().getListing() != null) {
                Listing listing = payment.getAuctionResult().getAuction().getListing();
                if (listing.getStatus() == ListingStatus.WAIT_FOR_PAYMENT) {
                    listing.setStatus(ListingStatus.APPROVED);
                }
            }
        }

        paymentRepository.saveAll(overduePayments);
    }

    @Override
    @Transactional
    public PaymentResponse completePayment(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findByPaymentIdAndBuyer_UserId(paymentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id = " + paymentId));

        if (payment.getOrderStatus() == OrderStatus.EXPIRED) {
            throw new BadRequestException("Payment has expired");
        }

        if (payment.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Payment has been cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (payment.getExpiresAt() != null && !now.isBefore(payment.getExpiresAt())) {
            // If client tries to pay after deadline, treat as expired.
            if (payment.getOrderStatus() == OrderStatus.PENDING_PAYMENT) {
                payment.setOrderStatus(OrderStatus.EXPIRED);
                if (payment.getAuctionResult() != null
                        && payment.getAuctionResult().getAuction() != null
                        && payment.getAuctionResult().getAuction().getListing() != null
                        && payment.getAuctionResult().getAuction().getListing().getStatus() == ListingStatus.WAIT_FOR_PAYMENT) {
                    payment.getAuctionResult().getAuction().getListing().setStatus(ListingStatus.APPROVED);
                }
                paymentRepository.save(payment);
            }
            throw new BadRequestException("Payment has expired");
        }

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS && payment.getOrderStatus() == OrderStatus.PAID) {
            return PaymentResponse.fromEntity(payment);
        }

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setOrderStatus(OrderStatus.PAID);
        payment.setPaidAt(now);

        // Mark listing as SOLD only after payment success.
        if (payment.getAuctionResult() != null
                && payment.getAuctionResult().getAuction() != null
                && payment.getAuctionResult().getAuction().getListing() != null) {
            payment.getAuctionResult().getAuction().getListing().setStatus(ListingStatus.SOLD);
        }

        return PaymentResponse.fromEntity(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public void createPaymentForAuctionResult(AuctionResult auctionResult) {
        if (auctionResult == null || auctionResult.getResultId() == null) {
            return;
        }

        if (auctionResult.getResultStatus() != AuctionResultStatus.SOLD || auctionResult.getWinner() == null) {
            return;
        }

        if (paymentRepository.existsByAuctionResult_ResultId(auctionResult.getResultId())) {
            return;
        }

        BigDecimal amount = auctionResult.getWinnerBidAmount();
        if (amount == null && auctionResult.getAuction() != null) {
            amount = auctionResult.getAuction().getCurrentHighestBid();
        }

        if (amount == null) {
            amount = BigDecimal.ZERO;
        }

        LocalDateTime now = LocalDateTime.now();

        Payment payment = Payment.builder()
                .auctionResult(auctionResult)
                .buyer(auctionResult.getWinner())
                .amount(amount)
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentReference(buildPaymentReference(auctionResult.getResultId()))
            .expiresAt(now.plusHours(PAYMENT_EXPIRY_HOURS))
                .build();

        paymentRepository.save(payment);
    }

    private String buildPaymentReference(Long resultId) {
        return "PAY-" + resultId + "-" + System.currentTimeMillis();
    }

    private void syncMissingWinnerPayments(Long userId) {
        List<AuctionResult> soldResultsWithoutPayment =
                auctionResultRepository.findSoldResultsWithoutPaymentByWinnerId(userId);

        for (AuctionResult result : soldResultsWithoutPayment) {
            createPaymentForAuctionResult(result);
        }
    }
}
