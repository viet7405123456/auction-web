package com.example.auction_web.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.CreateAuctionRequest;
import com.example.auction_web.dto.request.PlaceBidRequest;
import com.example.auction_web.dto.request.SetProxyBidRequest;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.AuctionResultResponse;
import com.example.auction_web.dto.response.BidResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.dto.response.ProxyBidResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.service.AuctionService;
import com.example.auction_web.service.BidService;
import com.example.auction_web.service.ListingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auctions")
@Slf4j
@RequiredArgsConstructor
public class AuctionController {
    
    private final AuctionService auctionService;
    private final BidService bidService;
    private final ListingService listingService;

    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponse> getAuctionDetail(@PathVariable Long id){
        return ResponseEntity.ok(auctionService.getAuctionById(id));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<AuctionResultResponse> getAuctionResult(@PathVariable Long id){
        return ResponseEntity.ok(auctionService.getAuctionResultById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ListingResponse>> getAuctionsByStatus(
            @PathVariable AuctionStatus status,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false, name = "addressSell") String addressSell,
            @RequestParam(required = false, name = "title") String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(listingService.getFilteredListings(brand, addressSell, title, status, pageable));
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<AuctionResponse>> getMyAuctions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(auctionService.getMyAuctions(user.getUserId(), pageable));
    }

    @GetMapping("/{auctionId}/bids")
    public ResponseEntity<List<BidResponse>> getBidsForAuction(@PathVariable Long auctionId){
        List<BidResponse> response = auctionService.getBidsForAuction(auctionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/")
    public ResponseEntity<AuctionResponse> createAuction(
            @Valid @RequestBody CreateAuctionRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("Creating auction for listing {} by user {}", request.getListingId(), currentUser.getUserId());
        AuctionResponse response = auctionService.createAuction(request, currentUser);
        log.info("Successfully created auction {} for listing {}", response.getAuctionId(), response.getListingId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @PostMapping("/{auctionId}/bids")
    public ResponseEntity<BidResponse> placeBid(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User userDetails,
            @Valid @RequestBody PlaceBidRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        BidResponse response = bidService.placeBid(auctionId,userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{auctionId}/proxy-bids")
    public ResponseEntity<ProxyBidResponse> setProxyBid(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User userDetails,
            @Valid @RequestBody SetProxyBidRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProxyBidResponse response = bidService.setProxyBid(auctionId, userDetails.getUserId(), request.getMaxBidAmount());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{auctionId}/proxy-bids/me")
    public ResponseEntity<ProxyBidResponse> getMyProxyBid(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProxyBidResponse response = bidService.getProxyBid(auctionId, userDetails.getUserId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{auctionId}/proxy-bids")
    public ResponseEntity<ProxyBidResponse> disableProxyBid(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProxyBidResponse response = bidService.disableProxyBid(auctionId, userDetails.getUserId());
        return ResponseEntity.ok(response);
    }

}
