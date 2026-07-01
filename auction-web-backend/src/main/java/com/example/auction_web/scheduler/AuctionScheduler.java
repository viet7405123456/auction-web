package com.example.auction_web.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.auction_web.service.AuctionLifecycleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionScheduler {

    private final AuctionLifecycleService auctionLifecycleService;

    @Scheduled(fixedDelay = 5000)
    public void activateDueAuctions() {
        LocalDateTime now = LocalDateTime.now();
        List<Long> auctionIds = auctionLifecycleService.findAuctionIdsToActivate(now);

        for (Long auctionId : auctionIds) {
            try {
                auctionLifecycleService.activateAuction(auctionId);
            } catch (Exception e) {
                log.error("Failed to activate auction {}", auctionId, e);
            }
        }
    }

    @Scheduled(fixedDelay = 5000)
    public void finishDueAuctions() {
        LocalDateTime now = LocalDateTime.now();
        List<Long> auctionIds = auctionLifecycleService.findAuctionIdsToFinish(now);

        for (Long auctionId : auctionIds) {
            try {
                auctionLifecycleService.finishAuction(auctionId);
            } catch (Exception e) {
                log.error("Failed to finish auction {}", auctionId, e);
            }
        }
    }
}