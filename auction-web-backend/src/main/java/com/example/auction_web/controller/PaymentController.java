package com.example.auction_web.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.response.PaymentResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/me")
    public ResponseEntity<Page<PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(paymentService.getMyPayments(user.getUserId(), pageable));
    }

    @PostMapping("/{paymentId}/complete")
    public ResponseEntity<PaymentResponse> completePayment(
            @AuthenticationPrincipal User user,
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.completePayment(user.getUserId(), paymentId));
    }
}
