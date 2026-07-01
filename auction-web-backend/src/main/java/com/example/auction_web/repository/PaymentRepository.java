package com.example.auction_web.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Payment;
import com.example.auction_web.entity.Enumtype.OrderStatus;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Override
    @EntityGraph(attributePaths = {"auctionResult", "auctionResult.auction", "auctionResult.auction.listing"})
    Page<Payment> findAll(Pageable pageable);

    Page<Payment> findByBuyer_UserIdOrderByCreatedAtDesc(Long buyerUserId, Pageable pageable);

    Optional<Payment> findByPaymentIdAndBuyer_UserId(Long paymentId, Long buyerUserId);

    boolean existsByAuctionResult_ResultId(Long auctionResultId);

    boolean existsByAuctionResult_Auction_Listing_IdAndOrderStatus(Long listingId, OrderStatus orderStatus);

    Optional<Payment> findTopByAuctionResult_Auction_Listing_IdOrderByCreatedAtDesc(Long listingId);

    @Query("""
        select p
        from Payment p
        join fetch p.auctionResult ar
        join fetch ar.auction a
        join fetch a.listing l
        where p.orderStatus = :orderStatus
          and p.expiresAt is not null
          and p.expiresAt <= :now
    """)
    List<Payment> findExpiredPaymentsWithListing(
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("now") LocalDateTime now
    );
}
