package com.example.auction_web.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.ChangePasswordRequest;
import com.example.auction_web.dto.request.UpdateAvatarRequest;
import com.example.auction_web.dto.response.AccountOverviewResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.dto.response.UserProfileResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.service.AuctionService;
import com.example.auction_web.service.ChatService;
import com.example.auction_web.service.ListingService;
import com.example.auction_web.service.NotificationService;
import com.example.auction_web.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ListingService listingService;
    private final AuctionService auctionService;
    private final ChatService chatService;
    private final NotificationService notificationService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal User user) {
        return new ResponseEntity<>(
            userService.getCurrentUserProfile(user), 
            HttpStatus.OK
        );
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<UserProfileResponse> updateCurrentUserAvatar(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(userService.updateAvatar(user.getUserId(), request.getAvatarUrl().trim()));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<String> updateCurrentUserPassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        userService.changePassword(user.getUserId(), request);
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    @GetMapping("/overview")
    public ResponseEntity<AccountOverviewResponse> getAccountOverview(@AuthenticationPrincipal User user) {
        long userId = user.getUserId();

        AccountOverviewResponse response = AccountOverviewResponse.builder()
                .listingsCreated(listingService.countBySeller(userId))
                .auctionsCreated(auctionService.countBySeller(userId))
                .unreadMessages(chatService.getTotalUnreadCount(userId))
                .unreadNotifications(notificationService.getUnreadCount(userId))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/liked-listings")
    public ResponseEntity<Page<ListingResponse>> getLikedListings(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(listingService.getLikedListings(user.getUserId(), pageable));
    }

    @GetMapping("/won-auctions")
    public ResponseEntity<Page<ListingResponse>> getWonAuctions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(listingService.getWonListings(user.getUserId(), pageable));
    }


}
