package com.example.auction_web.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.AuctionResult;
import com.example.auction_web.entity.Listing;


@Repository
public interface AuctionResultRepository extends JpaRepository<AuctionResult, Long> {
    boolean existsByAuction_AuctionId(Long auctionId);
    Optional<AuctionResult> findByAuction_AuctionId(Long auctionId);

    @Query("""
        SELECT a.listing
        FROM AuctionResult ar
        JOIN ar.auction a
        WHERE ar.winner.userId = :userId
        AND ar.resultStatus = 'SOLD'
        ORDER BY ar.createdAt DESC
    """)
    Page<Listing> findWonListingsByWinnerId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        SELECT ar
        FROM AuctionResult ar
        LEFT JOIN Payment p ON p.auctionResult = ar
        WHERE ar.winner.userId = :userId
        AND ar.resultStatus = com.example.auction_web.entity.Enumtype.AuctionResultStatus.SOLD
        AND p.paymentId IS NULL
        ORDER BY ar.createdAt DESC
    """)
    List<AuctionResult> findSoldResultsWithoutPaymentByWinnerId(@Param("userId") Long userId);
}
