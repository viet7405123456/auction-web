package com.example.auction_web.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Enumtype.AuctionStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    boolean existsByListing_IdAndStatusIn(Long listingId, List<AuctionStatus> statuses);

    @Query("""
        select case when count(r) > 0 then true else false end
        from AuctionResult r
        join r.auction a
        where a.listing.id = :listingId
        and r.resultStatus = com.example.auction_web.entity.Enumtype.AuctionResultStatus.SOLD
    """)
    boolean existsSoldAuctionResultByListingId(@Param("listingId") Long listingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select a
        from Auction a
        where a.auctionId = :auctionId
    """)
    Optional<Auction> findByIdForUpdate(@Param("auctionId") Long auctionId);

    @Query("""
        select a.auctionId
        from Auction a
        where a.status = :status
          and a.startTime <= :now
    """)
    List<Long> findIdsByStatusAndStartTimeBeforeOrEqual(
            @Param("status") AuctionStatus status,
            @Param("now") LocalDateTime now
    );

    @Query("""
        select a.auctionId
        from Auction a
        where a.status in :statuses
          and a.endTime <= :now
    """)
    List<Long> findIdsByStatusesAndEndTimeBeforeOrEqual(
            @Param("statuses") List<AuctionStatus> statuses,
            @Param("now") LocalDateTime now
    );


    Optional<List<Auction>> findByListing_Id(Long listingId);

    Page<Auction> findByStatus(AuctionStatus status, Pageable pageable);

    Page<Auction> findByListing_Seller_UserIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    long countByListing_Seller_UserId(Long sellerId);

    @Query("""
        select a.currentHighestBidder.userId
        from Auction a
        where a.auctionId = :auctionId
    """)
    Long findCurrentHighestBidderId(@Param("auctionId") Long auctionId);
}
