package com.example.auction_web.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.CreateListingCommentRequest;
import com.example.auction_web.dto.request.CreateListingRequest;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.ListingCommentResponse;
import com.example.auction_web.dto.response.ListingEngagementSummaryResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.ListingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    
    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> createListing(
        @Valid @RequestBody CreateListingRequest request,
        @AuthenticationPrincipal User currentUser
    ) {

        ListingResponse response = listingService.createListing(request,currentUser);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<Page<ListingResponse>> searchListings(
            @RequestParam(defaultValue = "") String brand,
            @RequestParam(defaultValue = "") String addressSell,
            @RequestParam(defaultValue = "") String title,
            @RequestParam(required = false) AuctionStatus auctionStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<ListingResponse> responsePage = listingService.getFilteredListings(
                brand,
                addressSell,
                title,
                auctionStatus,
            pageable,
            currentUser == null ? null : currentUser.getUserId()
        );

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/live")
    public ResponseEntity<Page<ListingResponse>> getListings(
            @RequestParam(defaultValue = "") String brand,
            @RequestParam(defaultValue = "") String addressSell,
            @RequestParam(defaultValue = "") String title,
            @RequestParam(defaultValue = "LIVE") AuctionStatus auctionStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<ListingResponse> responsePage = listingService.getFilteredListings(
                brand,
                addressSell,
                title,
                auctionStatus,
                pageable,
                currentUser == null ? null : currentUser.getUserId()
        );

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<Page<ListingResponse>> getUpComingListings(
            @RequestParam(defaultValue = "") String brand,
            @RequestParam(defaultValue = "") String addressSell,
            @RequestParam(defaultValue = "") String title,
            @RequestParam(defaultValue = "SCHEDULED") AuctionStatus auctionStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<ListingResponse> responsePage = listingService.getFilteredListings(
                brand,
                addressSell,
                title,
                auctionStatus,
                pageable,
                currentUser == null ? null : currentUser.getUserId()
        );

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/ended")
    public ResponseEntity<Page<ListingResponse>> getEndedListings(
            @RequestParam(defaultValue = "") String brand,
            @RequestParam(defaultValue = "") String addressSell,
            @RequestParam(defaultValue = "") String title,
            @RequestParam(defaultValue = "ENDED") AuctionStatus auctionStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<ListingResponse> responsePage = listingService.getFilteredListings(
                brand,
                addressSell,
                title,
                auctionStatus,
                pageable,
                currentUser == null ? null : currentUser.getUserId()
        );

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/{listingId}/auctions")
    public ResponseEntity<List<AuctionResponse>> getAllAuctionsForListing(@PathVariable Long listingId) {
        List<AuctionResponse> response = listingService.getAuctionsForListing(listingId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{listingId:\\d+}")
        public ResponseEntity<ListingResponse> getListingDetail(
            @PathVariable Long listingId,
            @AuthenticationPrincipal User currentUser,
            @RequestHeader(value = "X-Viewer-Key", required = false) String viewerKey
        ) {
        return ResponseEntity.ok(
            listingService.getListingById(
                listingId,
                currentUser == null ? null : currentUser.getUserId(),
                viewerKey
            )
        );
    }

    @GetMapping("{listingId}/notSold")
    public ResponseEntity<Boolean> checkIfListingNotSold(@PathVariable Long listingId) {
        boolean notSold = listingService.checkIfListingNotSold(listingId);
        return ResponseEntity.ok(notSold);
    }

    @GetMapping("/{listingId}/engagement")
    public ResponseEntity<ListingEngagementSummaryResponse> getListingEngagement(
            @PathVariable Long listingId,
            @AuthenticationPrincipal User currentUser
    ) {
        Long currentUserId = currentUser == null ? null : currentUser.getUserId();
        return ResponseEntity.ok(listingService.getEngagementSummary(listingId, currentUserId));
    }

    @GetMapping("/{listingId}/comments")
    public ResponseEntity<List<ListingCommentResponse>> getListingComments(@PathVariable Long listingId) {
        return ResponseEntity.ok(listingService.getListingComments(listingId));
    }

    @GetMapping("/{listingId}/comments/page")
    public ResponseEntity<Page<ListingCommentResponse>> getListingCommentsPage(
            @PathVariable Long listingId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        return ResponseEntity.ok(listingService.getListingComments(listingId, pageable));
    }

    @PostMapping("/{listingId}/comments")
    public ResponseEntity<?> createListingComment(
            @PathVariable Long listingId,
            @Valid @RequestBody CreateListingCommentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Bạn cần đăng nhập để bình luận");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listingService.addListingComment(listingId, currentUser, request.getContent()));
    }

    @PostMapping("/{listingId}/reactions/toggle")
    public ResponseEntity<?> toggleListingReaction(
            @PathVariable Long listingId,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Bạn cần đăng nhập để thả tim");
        }

        return ResponseEntity.ok(listingService.toggleListingReaction(listingId, currentUser));
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<ListingResponse>> getMyListings(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(listingService.getMyListings(currentUser.getUserId(), pageable));
    }

}
