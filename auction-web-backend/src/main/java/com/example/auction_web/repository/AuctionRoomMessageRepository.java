package com.example.auction_web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.auction_web.entity.AuctionRoomMessage;

public interface AuctionRoomMessageRepository extends JpaRepository<AuctionRoomMessage, Long> {
    List<AuctionRoomMessage> findByAuction_AuctionIdOrderByCreatedAtAsc(Long auctionId);
}
