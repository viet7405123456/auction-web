package com.example.auction_web.controller;

import java.time.LocalDateTime;

import org.apache.catalina.connector.Response;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.ListingPatchRequest;
import com.example.auction_web.dto.request.RegisterRequest;
import com.example.auction_web.dto.request.SignInRequest;
import com.example.auction_web.dto.request.UserPatchRequest;
import com.example.auction_web.dto.response.AuctionActionResponse;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.ContactMessageResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.dto.response.PaymentResponse;
import com.example.auction_web.dto.response.PageResponse;
import com.example.auction_web.dto.response.UserProfileResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.User;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.ContactMessageRepository;
import com.example.auction_web.repository.PaymentRepository;
import com.example.auction_web.service.AuctionLifecycleService;
import com.example.auction_web.service.AuthService;
import com.example.auction_web.service.ListingService;
import com.example.auction_web.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/api/admin")
@Slf4j
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final ListingService    listingService;
    private final UserService userService;
    private final AuctionRepository auctionRepository;
    private final AuctionLifecycleService auctionLifecycleService;
    private final ContactMessageRepository contactMessageRepository;
    private final PaymentRepository paymentRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        authService.adminRegister(registerRequest);
        return ResponseEntity.status(Response.SC_CREATED).body("User registered successfully");
    }

    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        authService.logout(request);
        return "Logout successful";
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignInRequest signInRequest) {
        try {
            return new ResponseEntity<>(
            authService.getAccessToken(signInRequest),
            HttpStatus.OK
        );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
        @PageableDefault(page = 0,size=10,sort="userId") Pageable pageable
    ) {
        Page<UserProfileResponse> page = userService.getAllUsers(pageable);

        PageResponse<UserProfileResponse> response = PageResponse.<UserProfileResponse>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserProfileResponse> patchUser(
            @PathVariable Long userId,
            @RequestBody UserPatchRequest request
    ) {
        UserProfileResponse updated = userService.patchUser(userId, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/listings")
    public ResponseEntity<?> getAllListings(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) ListingStatus status,
        @RequestParam(defaultValue ="DESC") String sortDirection
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), "createdAt"));
        return ResponseEntity.ok(listingService.getAllListings(pageable, status));
    }

    @PatchMapping("/listings/{listingId}")
    public ResponseEntity<?> updateListingStatus(
        @PathVariable Long listingId,
        @RequestBody ListingPatchRequest request
    ) {
        try {
            ListingResponse updated = listingService.updateListingStatus(listingId,request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/auctions")
    public ResponseEntity<PageResponse<AuctionResponse>> getAllAuctions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), "createdAt"));
        Page<Auction> auctionPage = status == null
                ? auctionRepository.findAll(pageable)
                : auctionRepository.findByStatus(status, pageable);

        PageResponse<AuctionResponse> response = PageResponse.<AuctionResponse>builder()
                .content(auctionPage.getContent().stream().map(AuctionResponse::fromEntity).toList())
                .page(auctionPage.getNumber())
                .size(auctionPage.getSize())
                .totalElements(auctionPage.getTotalElements())
                .totalPages(auctionPage.getTotalPages())
                .last(auctionPage.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/auctions/{auctionId}/cancel")
    public ResponseEntity<?> cancelAuctionByAdmin(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Auction auction = auctionRepository.findById(auctionId)
                .orElse(null);

        if (auction == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phiên đấu giá");
        }

        if (auction.getStatus() != AuctionStatus.SCHEDULED) {
            return ResponseEntity.badRequest().body("Chỉ có thể hủy phiên ở trạng thái SCHEDULED");
        }

        if (auction.getStartTime() != null && !auction.getStartTime().isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Phiên đã bắt đầu hoặc sắp bắt đầu, không thể hủy");
        }

        AuctionActionResponse response = auctionLifecycleService.cancelAuction(auctionId, currentUser.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/contacts")
    public ResponseEntity<PageResponse<ContactMessageResponse>> getContactMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), "createdAt"));

        Page<ContactMessageResponse> contactPage = contactMessageRepository.findAll(pageable)
                .map(ContactMessageResponse::fromEntity);

        PageResponse<ContactMessageResponse> response = PageResponse.<ContactMessageResponse>builder()
                .content(contactPage.getContent())
                .page(contactPage.getNumber())
                .size(contactPage.getSize())
                .totalElements(contactPage.getTotalElements())
                .totalPages(contactPage.getTotalPages())
                .last(contactPage.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments")
    public ResponseEntity<PageResponse<PaymentResponse>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), "createdAt"));

        Page<PaymentResponse> paymentPage = paymentRepository.findAll(pageable)
                .map(PaymentResponse::fromEntity);

        PageResponse<PaymentResponse> response = PageResponse.<PaymentResponse>builder()
                .content(paymentPage.getContent())
                .page(paymentPage.getNumber())
                .size(paymentPage.getSize())
                .totalElements(paymentPage.getTotalElements())
                .totalPages(paymentPage.getTotalPages())
                .last(paymentPage.isLast())
                .build();

        return ResponseEntity.ok(response);
    }
}
