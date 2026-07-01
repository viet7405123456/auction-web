package com.example.auction_web.service.Impl;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.request.PlaceBidRequest;
import com.example.auction_web.dto.response.BidResponse;
import com.example.auction_web.dto.response.ProxyBidResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Bid;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.ProxyBid;
import com.example.auction_web.entity.User;
import com.example.auction_web.event.BidPlacedEvent;
import com.example.auction_web.exception.BadRequestPlaceBidException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.BidRepository;
import com.example.auction_web.repository.ProxyBidRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.BidService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidServiceImpl implements BidService {

    

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final ProxyBidRepository proxyBidRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public BidResponse placeBid(Long auctionId,Long userId, PlaceBidRequest request) {
        validatePlaceBidRequest(request);
        
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        User bidder = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id = " + userId));

        LocalDateTime now = LocalDateTime.now();

        validateAuctionStateForBidding(auction, now);
        validateBidder(auction, bidder);
        validateBidAmount(auction, request.getBidAmount());

        User previousHighestBidder = auction.getCurrentHighestBidder() != null ? auction.getCurrentHighestBidder() : null;

        Bid bid = Bid.builder()
                .auction(auction)
                .user(bidder)
                .bidAmount(request.getBidAmount())
                .build();

        Bid savedBid = bidRepository.save(bid);

        

        auction.setCurrentHighestBid(request.getBidAmount());
        auction.setCurrentHighestBidder(bidder);

        applySoftCloseIfNeeded(auction, now);

        BigDecimal minimumNextBid = auction.getCurrentHighestBid().add(auction.getBidIncrement());

        

        applicationEventPublisher.publishEvent(
                BidPlacedEvent.builder()
                        .auctionId(auction.getAuctionId())
                        .bidId(savedBid.getBidId())
                        .newHighestBid(auction.getCurrentHighestBid())
                        .minimumNextBid(minimumNextBid)
                        .highestBidderId(bidder.getUserId())
                        .highestBidderEmail(bidder.getEmail())
                        .highestBidderDisplayName(bidder.getDisplayUsername())
                        .bidTime(savedBid.getBidTime())
                        .endTime(auction.getEndTime())
                        .extendedCount(auction.getExtendedCount())
                        .previousHighestBidderId(previousHighestBidder != null ? previousHighestBidder.getUserId() : null)
                        .previousHighestBidderEmail(previousHighestBidder != null ? previousHighestBidder.getEmail() : null)
                        .build()
        );

        // Auto-bid (proxy) processing: may create an additional bid and change currentHighestBid/currentHighestBidder.
        processProxyBidding(auction, now);

        return BidResponse.builder()
                .bidId(savedBid.getBidId())
                .auctionId(auction.getAuctionId())
                .userId(bidder.getUserId())
                .bidAmount(savedBid.getBidAmount())
                .bidTime(savedBid.getBidTime())
                .currentHighestBid(auction.getCurrentHighestBid())
                .currentHighestBidderId(auction.getCurrentHighestBidder() != null ? auction.getCurrentHighestBidder().getUserId() : null)
                .auctionEndTime(auction.getEndTime())
                .extendedCount(auction.getExtendedCount())
                .build();
    }


    @Override
    @Transactional
    public ProxyBidResponse setProxyBid(Long auctionId, Long userId, BigDecimal maxBidAmount) {
        validateMaxBidAmount(maxBidAmount);

        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        User bidder = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id = " + userId));

        LocalDateTime now = LocalDateTime.now();

        validateAuctionStateForBidding(auction, now);
        validateBidder(auction, bidder);

        BigDecimal minimumRequired = resolveMinimumRequiredProxyBid(auction, bidder.getUserId());
        if (maxBidAmount.compareTo(minimumRequired) < 0) {
            throw new BadRequestPlaceBidException("Số tiền auto-bid tối thiểu " + minimumRequired);
        }

        Optional<ProxyBid> existing = proxyBidRepository.findByAuction_AuctionIdAndUser_UserId(auctionId, bidder.getUserId());

        ProxyBid proxyBid = existing.orElseGet(() -> ProxyBid.builder()
                .auction(auction)
                .user(bidder)
                .build());

        proxyBid.setMaxBidAmount(maxBidAmount);
        proxyBid.setActive(true);

        ProxyBid savedProxyBid = proxyBidRepository.save(proxyBid);

        // May place/adjust the current highest bid based on proxy settings.
        processProxyBidding(auction, now);

        return toProxyBidResponse(savedProxyBid, auction);
    }


    @Override
    @Transactional
    public ProxyBidResponse disableProxyBid(Long auctionId, Long userId) {
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        ProxyBid proxyBid = proxyBidRepository.findByAuction_AuctionIdAndUser_UserId(auctionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ProxyBid not found for auctionId=" + auctionId + ", userId=" + userId));

        proxyBid.setActive(false);
        ProxyBid savedProxyBid = proxyBidRepository.save(proxyBid);

        // Disabling proxy-bid does NOT retract existing placed bids.
        return toProxyBidResponse(savedProxyBid, auction);
    }

    @Override
    @Transactional(readOnly = true)
    public ProxyBidResponse getProxyBid(Long auctionId, Long userId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        ProxyBid proxyBid = proxyBidRepository.findByAuction_AuctionIdAndUser_UserId(auctionId, userId)
                .orElseThrow(() -> {
                    log.debug("ProxyBid not found for auctionId={}, userId={}", auctionId, userId);
                    return new ResourceNotFoundException("ProxyBid not found for auctionId=" + auctionId + ", userId=" + userId);
                });

        return toProxyBidResponse(proxyBid, auction);
    }


    private void validateMaxBidAmount(BigDecimal maxBidAmount) {
        if (maxBidAmount == null || maxBidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestPlaceBidException("maxBidAmount must be greater than 0");
        }
    }

    private BigDecimal resolveMinimumRequiredProxyBid(Auction auction, Long userId) {
        if (auction.getStartingPrice() == null) {
            throw new BadRequestPlaceBidException("Auction startingPrice is missing");
        }

        if (auction.getBidIncrement() == null || auction.getBidIncrement().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestPlaceBidException("Auction bidIncrement is invalid");
        }

        if (auction.getCurrentHighestBid() == null) {
            return auction.getStartingPrice();
        }

        if (auction.getCurrentHighestBidder() != null && auction.getCurrentHighestBidder().getUserId().equals(userId)) {
            return auction.getCurrentHighestBid();
        }

        return auction.getCurrentHighestBid().add(auction.getBidIncrement());
    }


    private record ProxyCandidate(
            Long userId,
            BigDecimal maxBidAmount,
            LocalDateTime createdAt,
            boolean isCurrentHighest
    ) {
    }

    private void processProxyBidding(Auction auction, LocalDateTime now) {
        List<ProxyBid> proxyBids = proxyBidRepository.findByAuction_AuctionIdAndActiveTrue(auction.getAuctionId());
        if (proxyBids.isEmpty()) {
            return;
        }

        if (auction.getStartingPrice() == null) {
            return;
        }

        if (auction.getBidIncrement() == null || auction.getBidIncrement().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal increment = auction.getBidIncrement();

        Long currentHighestBidderId = auction.getCurrentHighestBidder() != null
                ? auction.getCurrentHighestBidder().getUserId()
                : null;
        BigDecimal currentHighestBid = auction.getCurrentHighestBid();

        Map<Long, ProxyBid> proxyByUserId = new HashMap<>();
        List<ProxyCandidate> candidates = new ArrayList<>();

        for (ProxyBid pb : proxyBids) {
            Long pbUserId = pb.getUser() != null ? pb.getUser().getUserId() : null;
            if (pbUserId == null || pb.getMaxBidAmount() == null) {
                continue;
            }
            proxyByUserId.put(pbUserId, pb);
            candidates.add(new ProxyCandidate(
                    pbUserId,
                    pb.getMaxBidAmount(),
                    pb.getCreatedAt(),
                    currentHighestBidderId != null && currentHighestBidderId.equals(pbUserId)
            ));
        }

        if (candidates.isEmpty()) {
            return;
        }

        // Include current highest bidder as a candidate (with max = current price) if they are NOT a proxy bidder.
        if (currentHighestBid != null && currentHighestBidderId != null && !proxyByUserId.containsKey(currentHighestBidderId)) {
            candidates.add(new ProxyCandidate(
                    currentHighestBidderId,
                    currentHighestBid,
                    LocalDateTime.MIN,
                    true
            ));
        }

        Comparator<ProxyCandidate> winnerComparator = (a, b) -> {
            int cmp = a.maxBidAmount().compareTo(b.maxBidAmount());
            if (cmp != 0) {
                return cmp;
            }

            // If max is the same, current highest keeps the lead (challenger would need +increment).
            cmp = Boolean.compare(a.isCurrentHighest(), b.isCurrentHighest());
            if (cmp != 0) {
                return cmp;
            }

            // If still tie (two proxy bidders), earlier (older) proxy bid wins.
            LocalDateTime aCreatedAt = a.createdAt();
            LocalDateTime bCreatedAt = b.createdAt();
            if (aCreatedAt != null && bCreatedAt != null) {
                // earlier createdAt should win
                cmp = bCreatedAt.compareTo(aCreatedAt);
            } else if (aCreatedAt != null) {
                cmp = 1;
            } else if (bCreatedAt != null) {
                cmp = -1;
            } else {
                cmp = 0;
            }
            if (cmp != 0) {
                return cmp;
            }

            return Long.compare(b.userId(), a.userId());
        };

        ProxyCandidate winner = candidates.stream().max(winnerComparator).orElse(null);
        if (winner == null) {
            return;
        }

        BigDecimal secondMax = candidates.stream()
                .filter(c -> !c.userId().equals(winner.userId()))
                .map(ProxyCandidate::maxBidAmount)
                .max(BigDecimal::compareTo)
                .orElse(null);

        BigDecimal targetBidAmount;

        if (currentHighestBid == null) {
            // First bid: place at starting price if there is no competition yet.
            if (secondMax == null) {
                targetBidAmount = auction.getStartingPrice();
            } else {
                targetBidAmount = min(winner.maxBidAmount(), secondMax.add(increment));
                if (targetBidAmount.compareTo(auction.getStartingPrice()) < 0) {
                    targetBidAmount = auction.getStartingPrice();
                }
            }
        } else {
            if (secondMax == null) {
                return;
            }
            targetBidAmount = min(winner.maxBidAmount(), secondMax.add(increment));
            if (targetBidAmount.compareTo(currentHighestBid) <= 0) {
                return;
            }
        }

        ProxyBid winnerProxyBid = proxyByUserId.get(winner.userId());
        if (winnerProxyBid == null || winnerProxyBid.getUser() == null) {
            return;
        }

        User winnerUser = winnerProxyBid.getUser();
        User previousHighestBidder = auction.getCurrentHighestBidder();

        Bid autoBid = Bid.builder()
                .auction(auction)
                .user(winnerUser)
                .bidAmount(targetBidAmount)
                .build();

        Bid savedAutoBid = bidRepository.save(autoBid);

        auction.setCurrentHighestBid(targetBidAmount);
        auction.setCurrentHighestBidder(winnerUser);

        applySoftCloseIfNeeded(auction, now);

        BigDecimal minimumNextBid = targetBidAmount.add(increment);

        applicationEventPublisher.publishEvent(
                BidPlacedEvent.builder()
                        .auctionId(auction.getAuctionId())
                        .bidId(savedAutoBid.getBidId())
                        .newHighestBid(auction.getCurrentHighestBid())
                        .minimumNextBid(minimumNextBid)
                        .highestBidderId(winnerUser.getUserId())
                        .highestBidderEmail(winnerUser.getEmail())
                        .highestBidderDisplayName(winnerUser.getDisplayUsername())
                        .bidTime(savedAutoBid.getBidTime())
                        .endTime(auction.getEndTime())
                        .extendedCount(auction.getExtendedCount())
                        .previousHighestBidderId(previousHighestBidder != null ? previousHighestBidder.getUserId() : null)
                        .previousHighestBidderEmail(previousHighestBidder != null ? previousHighestBidder.getEmail() : null)
                        .build()
        );
    }

    private BigDecimal min(BigDecimal a, BigDecimal b) {
        return a.compareTo(b) <= 0 ? a : b;
    }

    private ProxyBidResponse toProxyBidResponse(ProxyBid proxyBid, Auction auction) {
        BigDecimal minimumNextBid = null;
        if (auction.getCurrentHighestBid() != null && auction.getBidIncrement() != null) {
            minimumNextBid = auction.getCurrentHighestBid().add(auction.getBidIncrement());
        }

        return ProxyBidResponse.builder()
                .proxyBidId(proxyBid.getProxyBidId())
                .auctionId(auction.getAuctionId())
                .userId(proxyBid.getUser() != null ? proxyBid.getUser().getUserId() : null)
                .maxBidAmount(proxyBid.getMaxBidAmount())
                .active(proxyBid.isActive())
                .createdAt(proxyBid.getCreatedAt())
                .updatedAt(proxyBid.getUpdatedAt())
                .currentHighestBid(auction.getCurrentHighestBid())
                .currentHighestBidderId(auction.getCurrentHighestBidder() != null ? auction.getCurrentHighestBidder().getUserId() : null)
                .minimumNextBid(minimumNextBid)
                .auctionEndTime(auction.getEndTime())
                .extendedCount(auction.getExtendedCount())
                .build();
    }


    private void validatePlaceBidRequest(PlaceBidRequest request) {
        if (request.getBidAmount() == null || request.getBidAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestPlaceBidException("bidAmount must be greater than 0");
        }
    }

    private void validateAuctionStateForBidding(Auction auction, LocalDateTime now) {
        if (auction.getStatus() == AuctionStatus.CANCELLED) {
            throw new BadRequestPlaceBidException("Phiên đấu giá đã bị hủy");
        }

        if (auction.getStatus() == AuctionStatus.ENDED) {
            throw new BadRequestPlaceBidException("Phiên đấu giá đã kết thúc");
        }

        if (now.isBefore(auction.getStartTime())) {
            throw new BadRequestPlaceBidException("Phiên đấu giá chưa bắt đầu");
        }

        if (!now.isBefore(auction.getEndTime())) {
            throw new BadRequestPlaceBidException("Phiên đấu giá đã kết thúc");
        }

        if (auction.getStatus() == AuctionStatus.SCHEDULED) {
            auction.setStatus(AuctionStatus.LIVE);
        }

        if (auction.getStatus() != AuctionStatus.LIVE) {
            throw new BadRequestPlaceBidException("Auction is not available for bidding");
        }
    }

    private void validateBidder(Auction auction, User bidder) {
        Long sellerId = auction.getListing().getSeller().getUserId();

        if (sellerId.equals(bidder.getUserId())) {
            throw new BadRequestPlaceBidException("Bạn không thể đắt giá phiên của bạn");
        }

    }

    private void validateBidAmount(Auction auction, BigDecimal bidAmount) {
        BigDecimal minimumAllowedBid;

        if (auction.getCurrentHighestBid() == null) {
            minimumAllowedBid = auction.getStartingPrice();
        } else {
            minimumAllowedBid = auction.getCurrentHighestBid().add(auction.getBidIncrement());
        }

        if (bidAmount.compareTo(minimumAllowedBid) < 0) {
            throw new BadRequestPlaceBidException("Số tiền cần đặt ít nhất " + minimumAllowedBid);
        }
    }

    private void applySoftCloseIfNeeded(Auction auction, LocalDateTime now) {
        if (!auction.isSoftCloseEnabled()) {
            return;
        }

        if (auction.getSoftCloseTriggerSeconds() == null || auction.getSoftCloseExtendSeconds() == null) {
            return;
        }

        long remainingSeconds = Duration.between(now, auction.getEndTime()).getSeconds();

        if (remainingSeconds <= auction.getSoftCloseTriggerSeconds()) {
            auction.setEndTime(auction.getEndTime().plusSeconds(auction.getSoftCloseExtendSeconds()));

            Integer currentExtendedCount = auction.getExtendedCount() == null ? 0 : auction.getExtendedCount();
            auction.setExtendedCount(currentExtendedCount + 1);
        }
    }


    @Override
    public List<BidResponse> getBidsForAuction(Long auctionId) {
        List<Bid> bids = bidRepository.findByAuction_AuctionIdOrderByBidTimeDesc(auctionId);


        return bids.stream()
                .map(bid -> BidResponse.builder()
                        .bidId(bid.getBidId())
                        .auctionId(bid.getAuction().getAuctionId())
                        .userId(bid.getUser().getUserId())
                        .bidAmount(bid.getBidAmount())
                        .bidTime(bid.getBidTime())
                        .build())
                .toList();
    }
    
}
