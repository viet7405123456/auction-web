package com.example.auction_web.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Listing;


@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>,JpaSpecificationExecutor<Listing> {
	Page<Listing> findBySeller_UserIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

	long countBySeller_UserId(Long sellerId);
    

	Optional<Listing> findByAuctions_AuctionId(Long auctionId);
}
