package com.example.auction_web.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.auction_web.entity.Enumtype.AuctionResultStatus;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "auction_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "auction_result_seq")
    @SequenceGenerator(name = "auction_result_seq", sequenceName = "auction_results_result_id_seq", allocationSize = 1)
    @Column(name = "result_id")
    private Long resultId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id",unique = true,nullable= false)
    private Auction auction;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false)
    private AuctionResultStatus resultStatus;

    @ManyToOne
    @JoinColumn(name = "winner_user_id")
    private User winner;

    @Column(
        name = "winner_bid_amount",
        precision = 19,
        scale = 2
    )
    private BigDecimal winnerBidAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
