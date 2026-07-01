package com.example.auction_web.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.AuctionRoomMessageRequest;
import com.example.auction_web.dto.response.AuctionRoomMessageResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.AuctionRoomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auctions/{auctionId}/room/messages")
@RequiredArgsConstructor
public class AuctionRoomController {

    private final AuctionRoomService auctionRoomService;

    @GetMapping
    public ResponseEntity<List<AuctionRoomMessageResponse>> getMessages(@PathVariable Long auctionId) {
        return ResponseEntity.ok(auctionRoomService.getMessages(auctionId));
    }

    @PostMapping
    public ResponseEntity<AuctionRoomMessageResponse> sendMessage(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody AuctionRoomMessageRequest request
    ) {
        AuctionRoomMessageResponse response = auctionRoomService.sendMessage(
                auctionId,
                currentUser.getUserId(),
                request.getContent()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
