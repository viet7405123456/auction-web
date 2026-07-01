package com.example.auction_web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Bid;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    
    List<Bid> findByAuction_AuctionIdOrderByBidAmountDescBidTimeAsc(Long auctionId);

    boolean existsByAuction_AuctionId(Long auctionId);

    List<Bid> findByAuction_AuctionIdOrderByBidTimeDesc(Long auctionId);

}
