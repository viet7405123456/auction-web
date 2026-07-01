package com.example.auction_web.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.auction_web.entity.ListingView;

public interface ListingViewRepository extends JpaRepository<ListingView, Long> {
    long countByListing_Id(Long listingId);

    boolean existsByListing_IdAndViewerKey(Long listingId, String viewerKey);
}