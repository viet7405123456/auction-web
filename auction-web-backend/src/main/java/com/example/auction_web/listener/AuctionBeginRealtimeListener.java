package com.example.auction_web.listener;

import java.util.List;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.auction_web.dto.response.AuctionLifecycleSignalResponse;
import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.entity.Notification;
import com.example.auction_web.entity.User;
import com.example.auction_web.event.AuctionBeginEvent;
import com.example.auction_web.service.AuctionRealtimeService;
import com.example.auction_web.service.ListingReactionService;
import com.example.auction_web.service.ListingService;
import com.example.auction_web.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionBeginRealtimeListener {

    private static final DateTimeFormatter NOTIFICATION_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    private final NotificationService notificationService;
    private final ListingReactionService listingReactionService;
    private final ListingService listingService;
    private final AuctionRealtimeService auctionRealtimeService;
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuctionBegin(AuctionBeginEvent event) {
        try {
            notifyToAllUsers(event);
            
        } catch (Exception e) {
            log.error("Error handling auction begin event for auction {}", event.getAuctionId(), e);
        }
    }

    private void notifyToAllUsers(AuctionBeginEvent event) {
        String title = "🚀 Phiên đấu giá đã bắt đầu!";
        String message = "Phiên đấu giá #" + event.getAuctionId() + " đã bắt đầu vào lúc "
            + (event.getStartTime() != null ? event.getStartTime().format(NOTIFICATION_TIME_FORMATTER) : "—");
        
        Listing listing = listingService.getListingByAuctionId(event.getAuctionId());

        List<User> usersToNotify = listingReactionService.getUsersWhoReactedToListing(listing.getId());

        auctionRealtimeService.publishAuctionLifecycleSignal(
            event.getAuctionId(),
            AuctionLifecycleSignalResponse.builder()
                .eventType("AUCTION_LIFECYCLE_SIGNAL")
                .auctionId(event.getAuctionId())
                .listingId(listing.getId())
                .lifecycle("STARTED")
                .occurredAt(event.getStartTime())
                .build()
        );

        for (User user : usersToNotify) {
            Notification notification = notificationService.createNotification(
                    user.getUserId(),
                    NotificationType.AUCTION_STARTED,
                    title,
                    message,
                    event.getAuctionId()
            );
            notificationService.pushRealTimeNotification(
                    user.getEmail(),
                    notification
            );
        }
        log.info("Auction begin notification sent for auction {}", event.getAuctionId());
    }
}
