package com.example.auction_web.service;

import java.util.List;

import com.example.auction_web.entity.User;

public interface ListingReactionService {
    List<User> getUsersWhoReactedToListing(Long listingId);
}
