package com.example.auction_web.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.ListingComment;

@Repository
public interface ListingCommentRepository extends JpaRepository<ListingComment, Long> {
    List<ListingComment> findByListing_IdOrderByCreatedAtDesc(Long listingId);

    Page<ListingComment> findByListing_IdOrderByCreatedAtDescIdDesc(Long listingId, Pageable pageable);

    long countByListing_Id(Long listingId);
}
