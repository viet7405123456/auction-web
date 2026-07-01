package com.example.auction_web.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.dto.request.CreateListingRequest;
import com.example.auction_web.dto.request.ListingPatchRequest;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.ListingCommentResponse;
import com.example.auction_web.dto.response.ListingEngagementSummaryResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.entity.User;

public interface ListingService {
    ListingResponse createListing(CreateListingRequest request,User currentUser);
    List<ListingResponse> getAllListings();
    Page<ListingResponse> getAllListings(Pageable pageable,ListingStatus status);
    Page<ListingResponse> getMyListings(Long sellerId, Pageable pageable);
    Page<ListingResponse> getLikedListings(Long userId, Pageable pageable);
    Page<ListingResponse> getWonListings(Long userId, Pageable pageable);
    ListingResponse getListingById(Long listingId);
    ListingResponse getListingById(Long listingId, Long currentUserId, String viewerKey);
    long countBySeller(Long sellerId);
    ListingResponse updateListingStatus(Long listingId, ListingPatchRequest request);
    List<AuctionResponse> getAuctionsForListing(Long listingId);
    Page<ListingResponse> getFilteredListings(String brand, String addressSell, String title, AuctionStatus auctionStatus, Pageable pageable);
    Page<ListingResponse> getFilteredListings(String brand, String addressSell, String title, AuctionStatus auctionStatus, Pageable pageable, Long currentUserId);

    boolean checkIfListingNotSold(Long listingId);
    ListingEngagementSummaryResponse getEngagementSummary(Long listingId, Long currentUserId);
    List<ListingCommentResponse> getListingComments(Long listingId);
    Page<ListingCommentResponse> getListingComments(Long listingId, Pageable pageable);
    ListingCommentResponse addListingComment(Long listingId, User user, String content);
    ListingEngagementSummaryResponse toggleListingReaction(Long listingId, User user);

    Listing getListingByAuctionId(Long auctionId);

}
