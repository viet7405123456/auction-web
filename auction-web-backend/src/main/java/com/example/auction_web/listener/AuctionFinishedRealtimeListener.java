package com.example.auction_web.listener;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.auction_web.dto.response.AuctionLifecycleSignalResponse;
import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.NotificationType;
import com.example.auction_web.entity.Notification;
import com.example.auction_web.event.AuctionFinishedEvent;
import com.example.auction_web.service.AuctionRealtimeService;
import com.example.auction_web.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionFinishedRealtimeListener {

    private static final Locale VIETNAMESE_LOCALE = Locale.forLanguageTag("vi-VN");
    
    private final NotificationService notificationService;
    private final AuctionRealtimeService auctionRealtimeService;
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuctionFinished(AuctionFinishedEvent event) {
        try {
            // Notify winner if auction was sold
            if (event.getResultStatus() == AuctionResultStatus.SOLD && event.getWinnerId() != null) {
                notifyWinner(event);
            }
            
            // Notify seller about auction result
            notifySeller(event);

            publishLifecycleSignal(event);
            
        } catch (Exception e) {
            log.error("Error handling auction finished event for auction {}", event.getAuctionId(), e);
        }
    }
    
    private void notifyWinner(AuctionFinishedEvent event) {
        String title = "Bạn đã thắng phiên đấu giá!";
        String message = "Chúc mừng! Bạn đã thắng phiên đấu giá với giá: " + formatCurrency(event.getWinnerBidAmount()) 
                + " cho sản phẩm #" + event.getListingId();
        
        Notification notification = notificationService.createNotification(
                event.getWinnerId(),
                NotificationType.AUCTION_WON,
                title,
                message,
                event.getAuctionId()
        );
        
        // Push real-time notification to winner
        notificationService.pushRealTimeNotification(
                event.getWinnerEmail(),
                notification
        );
        
        log.info("Winner notification sent to user {} for auction {}", event.getWinnerId(), event.getAuctionId());
    }
    
    private void notifySeller(AuctionFinishedEvent event) {
        String title;
        String message;
        NotificationType notificationType;
        
        if (event.getResultStatus() == AuctionResultStatus.SOLD) {
            title = "Phiên đấu giá kết thúc - Có người thắng";
            message = "Phiên đấu giá bài đăng #" + event.getListingId() + " đã kết thúc. " +
                "Người thắng: " + event.getWinnerDisplayName() + " với giá cao nhất: " + formatCurrency(event.getWinnerBidAmount());
            notificationType = NotificationType.NEW_BID_ON_YOUR_AUCTION;
        } else if (event.getResultStatus() == AuctionResultStatus.NO_BIDS) {
            title = "Phiên đấu giá kết thúc - Không có người thắng";
            message = "Phiên đấu giá bài đăng #" + event.getListingId() + " kết thúc nhưng không có ai đặt giá.";
            notificationType = NotificationType.AUCTION_LOST;
        } else if (event.getResultStatus() == AuctionResultStatus.RESERVE_NOT_MET) {
            title = "Phiên đấu giá kết thúc - Giá không đạt mức tối thiểu";
            message = "Phiên đấu giá bài đăng #" + event.getListingId() + " kết thúc nhưng giá cao nhất không đạt mức tối thiểu.";
            notificationType = NotificationType.AUCTION_LOST;
        } else {
            title = "Phiên đấu giá đã bị hủy";
            message = "Phiên đấu giá bài đăng #" + event.getListingId() + " đã bị hủy.";
            notificationType = NotificationType.AUCTION_CANCELLED_BY_ADMIN;
        }
        
        Notification notification = notificationService.createNotification(
                event.getSellerId(),
                notificationType,
                title,
                message,
                event.getAuctionId()
        );
        
        // Push real-time notification to seller
        notificationService.pushRealTimeNotification(
                event.getSellerEmail(),
                notification
        );
        
        log.info("Seller notification sent to user {} for auction {}", event.getSellerId(), event.getAuctionId());
    }

    private void publishLifecycleSignal(AuctionFinishedEvent event) {
        auctionRealtimeService.publishAuctionLifecycleSignal(
                event.getAuctionId(),
                AuctionLifecycleSignalResponse.builder()
                        .eventType("AUCTION_LIFECYCLE_SIGNAL")
                        .auctionId(event.getAuctionId())
                        .listingId(event.getListingId())
                        .lifecycle("ENDED")
                        .resultStatus(event.getResultStatus() != null ? event.getResultStatus().name() : null)
                        .occurredAt(event.getFinishedAt())
                        .build()
        );
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
