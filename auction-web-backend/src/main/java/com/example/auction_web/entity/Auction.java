package com.example.auction_web.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;


@Entity
@Table(name = "auctions")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auction_id")
    private Long auctionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    @JsonBackReference
    private Listing listing;

    @Version
    @Column(name = "version")
    private Integer version;  // Optimistic Locking

    @Column(name = "extended_count")
    private Integer extendedCount;  // Số lần gia hạn

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(
        name = "starting_price",
        precision = 19,
        scale = 2
    )
    private BigDecimal startingPrice;

    @Column(
        name = "reserve_price",
        precision = 19,
        scale = 2
    )
    private BigDecimal reservePrice;

    @Column(name = "bid_increment", precision = 19, scale = 2)
    private BigDecimal bidIncrement;

    @Column(
        name = "current_highest_bid",
        precision = 19,
        scale = 2
    )
    private BigDecimal currentHighestBid;

    @ManyToOne
    @JoinColumn(name = "current_highest_bidder_id")
    private User currentHighestBidder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AuctionStatus status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name="soft_close_enabled")
    private boolean softCloseEnabled = true;

    @Column(name="soft_close_trigger_seconds")
    private Integer softCloseTriggerSeconds;

    @Column(name="soft_close_extend_seconds")
    private Integer softCloseExtendSeconds;

    @OneToMany(mappedBy="auction", cascade = CascadeType.ALL,orphanRemoval=true)
    @JsonIgnore
    private List<Bid> bids;

    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AuctionRoomMessage> roomMessages;

    @OneToOne(mappedBy = "auction", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private AuctionResult result;


    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
