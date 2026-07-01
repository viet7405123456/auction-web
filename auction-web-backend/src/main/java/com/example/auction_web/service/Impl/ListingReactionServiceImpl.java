package com.example.auction_web.service.Impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.auction_web.entity.User;
import com.example.auction_web.repository.ListingReactionRepository;
import com.example.auction_web.service.ListingReactionService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ListingReactionServiceImpl implements ListingReactionService {

    private final ListingReactionRepository listingReactionRepository;

    @Override
    public List<User> getUsersWhoReactedToListing(Long listingId) {
        

        return listingReactionRepository.findUsersByListingId(listingId);
    }
    
}
