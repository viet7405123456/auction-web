package com.example.auction_web.listener;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Notification;
import com.example.auction_web.event.AuctionBidRealtimeEvent;
import com.example.auction_web.event.BidPlacedEvent;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.service.AuctionRealtimeService;
import com.example.auction_web.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidPlacedRealtimeListener {
    private static final Locale VIETNAMESE_LOCALE = Locale.forLanguageTag("vi-VN");

    private final AuctionRealtimeService auctionRealtimeService;
    private final NotificationService notificationService;
    private final SimpUserRegistry simpUserRegistry;
    private final AuctionRepository auctionRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBidPlaced(BidPlacedEvent event) {
        try {
            // Broadcast bid update to all users watching this auction
            AuctionBidRealtimeEvent realtimeEvent = AuctionBidRealtimeEvent.builder()
                    .auctionId(event.getAuctionId())
                    .bidId(event.getBidId())
                    .newHighestBid(event.getNewHighestBid())
                    .minimumNextBid(event.getMinimumNextBid())
                    .highestBidderId(event.getHighestBidderId())
                    .highestBidderDisplayName(event.getHighestBidderDisplayName())
                    .bidTime(event.getBidTime())
                    .endTime(event.getEndTime())
                    .extendedCount(event.getExtendedCount())
                    .message(event.getHighestBidderDisplayName() + " vừa đặt giá " + formatCurrency(event.getNewHighestBid()))
                    .build();
            
            auctionRealtimeService.publishBidUpdate(realtimeEvent);
            
            // Notify previous highest bidder that they were outbid
            notifyOutbidUser(event);
            
        } catch (Exception e) {
            log.error("Error handling bid placed event for auction {}", event.getAuctionId(), e);
        }
    }
    
    private void notifyOutbidUser(BidPlacedEvent event) {
        // Only notify if there was a previous highest bidder and it's a different person
        if (event.getPreviousHighestBidderId() == null || event.getPreviousHighestBidderEmail() == null) {
            log.debug("No previous bidder to notify for auction {}", event.getAuctionId());
            return;
        }
        
        if (event.getHighestBidderEmail().equals(event.getPreviousHighestBidderEmail())) {
            log.debug("Previous bidder is the same as current bidder for auction {}", event.getAuctionId());
            return;
        }

        // Proxy bidding can generate multiple BidPlacedEvent events in the same transaction.
        // This guard prevents sending an OUTBID notification when the previous bidder is
        // still the highest bidder after the transaction is committed.
        Long currentHighestBidderId = auctionRepository.findCurrentHighestBidderId(event.getAuctionId());
        if (currentHighestBidderId != null && currentHighestBidderId.equals(event.getPreviousHighestBidderId())) {
            // "Skip OUTBID notification because previous bidder {} is still highest in auction {}"
            return; 
        }

        log.info("Notifying previous highest bidder {} that they were outbid in auction {}", 
                event.getPreviousHighestBidderId(), event.getAuctionId());

        String title = "Bạn vừa bị vượt giá";
        String message = "Người dùng " + event.getHighestBidderDisplayName()
                + " vừa vượt giá của bạn ở phiên đấu giá #" + event.getAuctionId() 
            + " với giá " + formatCurrency(event.getNewHighestBid());

        try {
            // Create and save notification to database
            Notification notification = notificationService.createNotification(
                    event.getPreviousHighestBidderId(),
                    NotificationType.OUTBID,
                    title,
                    message,
                    event.getAuctionId()
            );

            log.info(simpUserRegistry.getUser(event.getPreviousHighestBidderEmail()) != null ? "Previous bidder is online, real-time notification sent." : "Previous bidder is offline, notification saved to database.");
            // Push real-time notification via WebSocket if user is online
            notificationService.pushRealTimeNotification(
                    event.getPreviousHighestBidderEmail(),
                    notification
            );
            
            
        } catch (Exception e) {
            log.error("Failed to notify outbid user {} for auction {}", 
                    event.getPreviousHighestBidderId(), event.getAuctionId(), e);
        }
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) {
            return "—";
        }

        NumberFormat formatter = NumberFormat.getNumberInstance(VIETNAMESE_LOCALE);
        formatter.setMaximumFractionDigits(0);
        return formatter.format(value);
    }
}
