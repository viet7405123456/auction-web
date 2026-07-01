package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.response.AuctionActionResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.AuctionResult;
import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Enumtype.UserRoleType;
import com.example.auction_web.entity.User;
import com.example.auction_web.event.AuctionBeginEvent;
import com.example.auction_web.event.AuctionFinishedEvent;
import com.example.auction_web.exception.BadRequestException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.AuctionResultRepository;
import com.example.auction_web.repository.BidRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.AuctionLifecycleService;
import com.example.auction_web.service.NotificationService;
import com.example.auction_web.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionLifecycleServiceImpl implements AuctionLifecycleService {

    private final AuctionRepository auctionRepository;
    private final AuctionResultRepository auctionResultRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final NotificationService notificationService;
    private final PaymentService paymentService;

    @Override
    public List<Long> findAuctionIdsToActivate(LocalDateTime now) {
        return auctionRepository.findIdsByStatusAndStartTimeBeforeOrEqual(AuctionStatus.SCHEDULED, now);
    }


    @Override
    public List<Long> findAuctionIdsToFinish(LocalDateTime now) {
        return auctionRepository.findIdsByStatusesAndEndTimeBeforeOrEqual(
                List.of(AuctionStatus.SCHEDULED, AuctionStatus.LIVE),
                now
        );
    }


    @Transactional
    @Override
    public void activateAuction(Long auctionId) {
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        LocalDateTime now = LocalDateTime.now();

        if (auction.getStatus() != AuctionStatus.SCHEDULED) {
            return;
        }

        if (now.isBefore(auction.getStartTime())) {
            return;
        }

        // Trường hợp app down lâu, đến lúc job chạy thì auction đã quá endTime
        if (!now.isBefore(auction.getEndTime())) {
            finalizeAuction(auction);
            return;
        }

        publishAuctionBeginEvent(auction);

        auction.setStatus(AuctionStatus.LIVE);
    }

    @Transactional
    @Override
    public AuctionActionResponse cancelAuction(Long auctionId,Long userId) {
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        if (auction.getStatus() == AuctionStatus.ENDED) {
            throw new BadRequestException("Cannot cancel an ended auction");
        }

        if (auction.getStatus() == AuctionStatus.CANCELLED) {
            throw new BadRequestException("Auction is already cancelled");
        }

        User actor = null;
        if (userId != null) {
            actor = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id = " + userId));
        }

        boolean isAdminAction = actor.getRole() == UserRoleType.ADMIN;
        boolean isSeller = auction.getListing().getSeller().getUserId().equals(actor.getUserId());

        if (!isAdminAction && !isSeller) {
            throw new BadRequestException("You do not have permission to cancel this auction");
        }

        boolean hasAnyBid = auction.getCurrentHighestBid() != null || bidRepository.existsByAuction_AuctionId(auctionId);

        // Rule đề xuất:
        // - Seller chỉ được cancel khi auction còn SCHEDULED và chưa có bid
        // - Admin có thể cancel SCHEDULED/LIVE
        if (!isAdminAction) {
            if (auction.getStatus() != AuctionStatus.SCHEDULED) {
                throw new BadRequestException("Seller can only cancel a scheduled auction");
            }
            if (hasAnyBid) {
                throw new BadRequestException("Cannot cancel auction because it already has bids");
            }
        }

        auction.setStatus(AuctionStatus.CANCELLED);

        AuctionResult existingResult = auctionResultRepository.findByAuction_AuctionId(auctionId).orElse(null);

        if (existingResult == null) {
            AuctionResult result = AuctionResult.builder()
                    .auction(auction)
                    .resultStatus(AuctionResultStatus.CANCELLED)
                    .winner(null)
                    .winnerBidAmount(null)
                    .build();

            auction.setResult(result);
        } else {
            existingResult.setResultStatus(AuctionResultStatus.CANCELLED);
            existingResult.setWinner(null);
            existingResult.setWinnerBidAmount(null);
        }

        AuctionResultStatus currentResultStatus = existingResult != null
                ? existingResult.getResultStatus()
                : AuctionResultStatus.CANCELLED;

        return AuctionActionResponse.builder()
                .auctionId(auction.getAuctionId())
                .auctionStatus(auction.getStatus())
                .resultStatus(currentResultStatus)
                .listingStatus(auction.getListing().getStatus())
                .endTime(auction.getEndTime())
                .message("Auction cancelled successfully")
                .build();
    }

    @Transactional
    @Override
    public AuctionActionResponse finishAuction(Long auctionId) {
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        LocalDateTime now = LocalDateTime.now();

        if (auction.getStatus() == AuctionStatus.CANCELLED) {
            return AuctionActionResponse.builder()
                    .auctionId(auction.getAuctionId())
                    .auctionStatus(auction.getStatus())
                    .resultStatus(getAuctionResultStatus(auction.getAuctionId()))
                    .listingStatus(auction.getListing().getStatus())
                    .endTime(auction.getEndTime())
                    .message("Auction already cancelled")
                    .build();
        }

        if (auction.getStatus() == AuctionStatus.ENDED) {
            return AuctionActionResponse.builder()
                    .auctionId(auction.getAuctionId())
                    .auctionStatus(auction.getStatus())
                    .resultStatus(getAuctionResultStatus(auction.getAuctionId()))
                    .listingStatus(auction.getListing().getStatus())
                    .endTime(auction.getEndTime())
                    .message("Auction already ended")
                    .build();
        }

        if (now.isBefore(auction.getEndTime())) {
            return AuctionActionResponse.builder()
                    .auctionId(auction.getAuctionId())
                    .auctionStatus(auction.getStatus())
                    .resultStatus(getAuctionResultStatus(auction.getAuctionId()))
                    .listingStatus(auction.getListing().getStatus())
                    .endTime(auction.getEndTime())
                    .message("Auction has not reached end time yet")
                    .build();
        }

        finalizeAuction(auction);

        return AuctionActionResponse.builder()
                .auctionId(auction.getAuctionId())
                .auctionStatus(auction.getStatus())
                .resultStatus(getAuctionResultStatus(auction.getAuctionId()))
                .listingStatus(auction.getListing().getStatus())
                .endTime(auction.getEndTime())
                .message("Auction finished successfully")
                .build();
    }
    
    private void finalizeAuction(Auction auction) {
        if (auction.getStatus() == AuctionStatus.CANCELLED) {
            return;
        }

        auction.setStatus(AuctionStatus.ENDED);

        if (auctionResultRepository.existsByAuction_AuctionId(auction.getAuctionId())) {
            // tránh tạo trùng result
            return;
        }

        AuctionResultStatus resultStatus = resolveAuctionResultStatus(auction);

        AuctionResult result = AuctionResult.builder()
                .auction(auction)
                .resultStatus(resultStatus)
                .winner(resultStatus == AuctionResultStatus.SOLD ? auction.getCurrentHighestBidder() : null)
                .winnerBidAmount(resultStatus == AuctionResultStatus.SOLD ? auction.getCurrentHighestBid() : null)
                .build();

        auction.setResult(result);

        if (resultStatus == AuctionResultStatus.SOLD) {
            // SOLD in AuctionResultStatus means the auction has a winner.
            // Listing should wait for winner payment before being marked SOLD.
            auction.getListing().setStatus(ListingStatus.WAIT_FOR_PAYMENT);
            paymentService.createPaymentForAuctionResult(result);
        }
        
        // Publish auction finished event for notifications
        publishAuctionFinishedEvent(auction, resultStatus);
    }
    
    private void publishAuctionBeginEvent(Auction auction) {
        try {
            AuctionBeginEvent event = AuctionBeginEvent.builder()
                    .auctionId(auction.getAuctionId())
                    .startTime(auction.getStartTime())
                    .build();
            
            applicationEventPublisher.publishEvent(event);
        } catch (Exception e) {
            // Log but don't throw - we don't want to fail the auction activation if event publishing fails
            log.error("Error publishing auction begin event for auction {}", auction.getAuctionId(), e);
        }
    }

    private void publishAuctionFinishedEvent(Auction auction, AuctionResultStatus resultStatus) {
        try {
            User seller = auction.getListing().getSeller();
            
            AuctionFinishedEvent event = AuctionFinishedEvent.builder()
                    .auctionId(auction.getAuctionId())
                    .listingId(auction.getListing().getId())
                    .resultStatus(resultStatus)
                    .winnerId(resultStatus == AuctionResultStatus.SOLD && auction.getCurrentHighestBidder() != null 
                            ? auction.getCurrentHighestBidder().getUserId() : null)
                    .winnerEmail(resultStatus == AuctionResultStatus.SOLD && auction.getCurrentHighestBidder() != null 
                            ? auction.getCurrentHighestBidder().getEmail() : null)
                    .winnerDisplayName(resultStatus == AuctionResultStatus.SOLD && auction.getCurrentHighestBidder() != null 
                            ? auction.getCurrentHighestBidder().getDisplayUsername() : null)
                    .winnerBidAmount(resultStatus == AuctionResultStatus.SOLD 
                            ? auction.getCurrentHighestBid() : null)
                    .sellerId(seller.getUserId())
                    .sellerEmail(seller.getEmail())
                    .sellerDisplayName(seller.getDisplayUsername())
                    .finishedAt(LocalDateTime.now())
                    .auctionEndTime(auction.getEndTime())
                    .build();
            
            applicationEventPublisher.publishEvent(event);
        } catch (Exception e) {
            // Log but don't throw - we don't want to fail the auction finalization if event publishing fails
            log.error("Error publishing auction finished event for auction {}", auction.getAuctionId(), e);
        }
    }

    private AuctionResultStatus getAuctionResultStatus(Long auctionId) {
        return auctionResultRepository.findByAuction_AuctionId(auctionId)
                .map(AuctionResult::getResultStatus)
                .orElse(null);
    }

    private AuctionResultStatus resolveAuctionResultStatus(Auction auction) {
        if (auction.getCurrentHighestBid() == null) {
            return AuctionResultStatus.NO_BIDS;
        }

        if (auction.getReservePrice() == null) {
            return AuctionResultStatus.SOLD;
        }

        if (auction.getCurrentHighestBid().compareTo(auction.getReservePrice()) >= 0) {
            return AuctionResultStatus.SOLD;
        }

        return AuctionResultStatus.RESERVE_NOT_MET;
    }
    
}
