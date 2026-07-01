package com.example.auction_web.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.auction_web.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduler {

    private final PaymentService paymentService;

    @Scheduled(fixedDelay = 60000)
    public void expireOverduePayments() {
        try {
            paymentService.expireOverduePayments();
        } catch (Exception e) {
            log.error("Failed to expire overdue payments", e);
        }
    }
}
