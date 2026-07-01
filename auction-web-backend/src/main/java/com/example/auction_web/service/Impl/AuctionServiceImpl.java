package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.request.CreateAuctionRequest;
import com.example.auction_web.dto.response.AuctionDetailResponse;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.AuctionResultResponse;
import com.example.auction_web.dto.response.BidResponse;
import com.example.auction_web.dto.response.CarResponse;
import com.example.auction_web.dto.response.SellerResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.AuctionResult;
import com.example.auction_web.entity.Bid;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Enumtype.OrderStatus;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.entity.User;
import com.example.auction_web.exception.BadRequestCreateAuctionException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.AuctionResultRepository;
import com.example.auction_web.repository.BidRepository;
import com.example.auction_web.repository.ListingRepository;
import com.example.auction_web.repository.PaymentRepository;
import com.example.auction_web.service.AuctionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "Auction-Service")
public class AuctionServiceImpl implements AuctionService {

    private final AuctionRepository auctionRepository;
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final AuctionResultRepository auctionResultRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public AuctionDetailResponse getAuctionDetailById(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        Listing listing = auction.getListing();
        if (listing == null) {
            throw new ResourceNotFoundException("Listing not found for auction id = " + auctionId);
        }

        return AuctionDetailResponse.builder()
                .auctionId(auction.getAuctionId())
                .status(auction.getStatus())
                .startingPrice(auction.getStartingPrice())
                .reservePrice(auction.getReservePrice())
                .bidIncrement(auction.getBidIncrement())
                .currentHighestBid(auction.getCurrentHighestBid() != null ? auction.getCurrentHighestBid() : auction.getStartingPrice())
                .startTime(auction.getStartTime())
                .endTime(auction.getEndTime())
                .car(listing.getCar() == null ? null : CarResponse.fromEntity(listing.getCar()))
                .seller(listing.getSeller() == null ? null : SellerResponse.builder()
                        .userId(listing.getSeller().getUserId())
                        .email(listing.getSeller().getEmail())
                        .fullName(listing.getSeller().getDisplayUsername())
                        .phoneNumber(listing.getSeller().getUserProfile() != null ? listing.getSeller().getUserProfile().getPhoneNumber() : null)
                        .avatarUrl(listing.getSeller().getUserProfile() != null ? listing.getSeller().getUserProfile().getAvatarUrl() : null)
                        .rating(listing.getSeller().getUserProfile() != null ? listing.getSeller().getUserProfile().getRating() : null)
                        .totalWins(listing.getSeller().getUserProfile() != null ? listing.getSeller().getUserProfile().getTotalWins() : null)
                        .build())
                .build();
    }

    @Override
    public AuctionResultResponse getAuctionResultById(Long auctionId) {
        AuctionResult acr = auctionResultRepository.findByAuction_AuctionId(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction result not found for auction id = " + auctionId));
        return AuctionResultResponse.fromEntity(
            acr.getWinner() != null ? acr.getWinner().getUserId() : null,
            acr.getResultStatus(),
            acr.getWinner() != null ? acr.getWinner().getDisplayUsername() : null,
            acr.getWinner() != null ? acr.getWinner().getDisplayUsername() : null,
            acr.getWinner() != null ? acr.getWinner().getEmail() : null,
            acr.getWinnerBidAmount());
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionResponse getAuctionById(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));
        return AuctionResponse.fromEntity(auction);
    }


    @Transactional
    @Override
    public AuctionResponse createAuction(CreateAuctionRequest request, User currentUser) {
        try {
            validateCreateAuctionRequest(request);
        } catch (Exception e) {
            log.error("Validation failed: {}", e.getMessage(), e);
            throw e;
        }
        
        // Khóa listing để chống race condition
        log.debug("Step 3: Finding listing with id = {}", request.getListingId());
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id = " + request.getListingId()));

        if(listing.getSeller() == null || !listing.getSeller().getUserId().equals(currentUser.getUserId())) {
            log.warn("User {} is not the seller of listing {}", currentUser.getUserId(), listing.getId());
            throw new BadRequestCreateAuctionException("You can only create auction for your own listing");
        }

        try {
            validateListingForAuction(listing, request.getListingId());
        } catch (Exception e) {
            log.error("Listing validation failed: {}", e.getMessage(), e);
            throw e;
        }

        Auction auction = Auction.builder()
                .listing(listing)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .startingPrice(request.getStartingPrice())
                .reservePrice(request.getReservePrice())
                .bidIncrement(request.getBidIncrement())
                .currentHighestBid(null)
                .currentHighestBidder(null)
                .status(AuctionStatus.SCHEDULED) // Mặc định là SCHEDULED, sẽ có job chuyển sang LIVE khi đến thời gian
                .extendedCount(0)
                .softCloseEnabled(Boolean.TRUE.equals(request.getSoftCloseEnabled()))
                .softCloseTriggerSeconds(request.getSoftCloseTriggerSeconds())
                .softCloseExtendSeconds(request.getSoftCloseExtendSeconds())
                .build();
        
        Auction savedAuction = auctionRepository.save(auction);
        log.info("Successfully saved auction with ID = {} for listing = {}", savedAuction.getAuctionId(), savedAuction.getListing().getId());

        AuctionResponse response = AuctionResponse.builder()
                .auctionId(savedAuction.getAuctionId())
                .listingId(savedAuction.getListing().getId())
                .status(savedAuction.getStatus())
                .startTime(savedAuction.getStartTime())
                .endTime(savedAuction.getEndTime())
                .startingPrice(savedAuction.getStartingPrice())
                .currentHighestBid(savedAuction.getCurrentHighestBid())
                .currentHighestBidderId(null)
                .minimumNextBid(savedAuction.getStartingPrice())
                .reservePrice(savedAuction.getReservePrice())
                .bidIncrement(savedAuction.getBidIncrement())
                .softCloseEnabled(savedAuction.isSoftCloseEnabled())
                .softCloseTriggerSeconds(savedAuction.getSoftCloseTriggerSeconds())
                .softCloseExtendSeconds(savedAuction.getSoftCloseExtendSeconds())
                .build();
        
        return response;
    }


    private void validateCreateAuctionRequest(CreateAuctionRequest request) {
        log.debug("Validating request times: startTime={}, endTime={}, now={}", 
                  request.getStartTime(), request.getEndTime(), LocalDateTime.now());
        
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestCreateAuctionException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestCreateAuctionException("Thời gian bắt đầu phải là trong tương lai");
        }

        log.debug("Validating prices: startingPrice={}, reservePrice={}", 
                  request.getStartingPrice(), request.getReservePrice());
        
        if (request.getReservePrice() != null &&
            request.getReservePrice().compareTo(request.getStartingPrice()) < 0) {
            throw new BadRequestCreateAuctionException("Giá dự kiến (reserve price) phải lớn hơn hoặc bằng giá khởi điểm (starting price)");
        }

        boolean softCloseEnabled = Boolean.TRUE.equals(request.getSoftCloseEnabled());
        log.debug("Soft close enabled: {}, trigger: {}, extend: {}", 
                  softCloseEnabled, request.getSoftCloseTriggerSeconds(), request.getSoftCloseExtendSeconds());
        
        if (softCloseEnabled) {
            if (request.getSoftCloseTriggerSeconds() == null || request.getSoftCloseTriggerSeconds() <= 0) {
                throw new BadRequestCreateAuctionException("Thời gian kích hoạt soft close phải lớn hơn 0");
            }
            if (request.getSoftCloseExtendSeconds() == null || request.getSoftCloseExtendSeconds() <= 0) {
                throw new BadRequestCreateAuctionException("Thời gian gia hạn soft close phải lớn hơn 0");
            }
        }
        
        log.debug("Request validation completed successfully");
    }


    private void validateListingForAuction(Listing listing, Long listingId) {
        log.debug("Validating listing: listingId={}, status={}", listingId, listing.getStatus());
        
        if (listing.getStatus() != ListingStatus.APPROVED) {
            log.warn("Listing not approved. Current status: {}", listing.getStatus());
            throw new BadRequestCreateAuctionException("Listing must be APPROVED before creating auction");
        }

        if (listing.getStatus() == ListingStatus.SOLD) {
            log.warn("Listing already sold");
            throw new BadRequestCreateAuctionException("Listing is already SOLD and cannot create auction");
        }

        boolean hasActiveAuction = auctionRepository.existsByListing_IdAndStatusIn(
            listingId,
            List.of(AuctionStatus.SCHEDULED, AuctionStatus.LIVE)
        );
        
        log.debug("Has active auction (SCHEDULED/LIVE): {}", hasActiveAuction);
        if (hasActiveAuction) {
            log.warn("Listing has active auction");
            throw new BadRequestCreateAuctionException("Listing already has an active auction");
        }

        boolean hasPaidOrder = paymentRepository.existsByAuctionResult_Auction_Listing_IdAndOrderStatus(
                listingId,
                OrderStatus.PAID
        );
        log.debug("Has paid order: {}", hasPaidOrder);
        
        if (hasPaidOrder) {
            log.warn("Listing already has a PAID order");
            throw new BadRequestCreateAuctionException("Listing is already PAID and cannot be auctioned again");
        }
        
        log.debug("Listing validation completed successfully");
    }


    @Override
    public List<BidResponse> getBidsForAuction(Long auctionId) {
        List<Bid> bids = bidRepository.findByAuction_AuctionIdOrderByBidAmountDescBidTimeAsc(auctionId);
        return bids.stream().map(bid -> BidResponse.builder()
                        .bidId(bid.getBidId())
                        .userId(bid.getUser().getUserId())
                        .username(bid.getUser().getDisplayUsername())
                        .bidAmount(bid.getBidAmount())
                        .bidTime(bid.getBidTime())
                        .build())
                        .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuctionResponse> getMyAuctions(Long sellerId, Pageable pageable) {
        return auctionRepository.findByListing_Seller_UserIdOrderByCreatedAtDesc(sellerId, pageable)
                .map(AuctionResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long countBySeller(Long sellerId) {
        return auctionRepository.countByListing_Seller_UserId(sellerId);
    }
}
