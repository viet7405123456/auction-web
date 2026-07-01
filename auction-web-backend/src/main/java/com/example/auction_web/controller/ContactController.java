package com.example.auction_web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.ContactMessageRequest;
import com.example.auction_web.dto.response.ContactMessageResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.ContactMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageService contactMessageService;

    @PostMapping
    public ResponseEntity<ContactMessageResponse> submitContactMessage(
            @Valid @RequestBody ContactMessageRequest request,
            Authentication authentication
    ) {
        User user = null;
        if (authentication != null && authentication.getPrincipal() instanceof User currentUser) {
            user = currentUser;
        }

        ContactMessageResponse response = contactMessageService.createContactMessage(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
