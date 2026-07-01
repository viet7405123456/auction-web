package com.example.auction_web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.ListingReaction;
import com.example.auction_web.entity.User;

@Repository
public interface ListingReactionRepository extends JpaRepository<ListingReaction, Long> {
    long countByListing_Id(Long listingId);

    boolean existsByListing_IdAndUser_UserId(Long listingId, Long userId);

    Optional<ListingReaction> findByListing_IdAndUser_UserId(Long listingId, Long userId);

    Page<ListingReaction> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    
    @Query("""
        select distinct lr.user
        from ListingReaction lr
        where lr.listing.id = :listingId
    """)
    List<User> findUsersByListingId(@Param("listingId") Long listingId);
}
