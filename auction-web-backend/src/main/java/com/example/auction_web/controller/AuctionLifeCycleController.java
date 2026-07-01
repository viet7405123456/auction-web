package com.example.auction_web.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.entity.User;
import com.example.auction_web.exception.BadRequestException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.service.AuctionLifecycleService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class AuctionLifeCycleController {
    private final AuctionLifecycleService auctionLifecycleService;
    

    @PostMapping("/{auctionId}/cancel")
    public ResponseEntity<?> cancelAuction(@PathVariable Long auctionId,@AuthenticationPrincipal User user) {
        try {
            auctionLifecycleService.cancelAuction(auctionId, user.getUserId());
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred");
        }
    }
}
