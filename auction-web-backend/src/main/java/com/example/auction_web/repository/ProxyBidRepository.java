package com.example.auction_web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.ProxyBid;

@Repository
public interface ProxyBidRepository extends JpaRepository<ProxyBid, Long> {

    Optional<ProxyBid> findByAuction_AuctionIdAndUser_UserId(Long auctionId, Long userId);

    List<ProxyBid> findByAuction_AuctionIdAndActiveTrue(Long auctionId);
}
