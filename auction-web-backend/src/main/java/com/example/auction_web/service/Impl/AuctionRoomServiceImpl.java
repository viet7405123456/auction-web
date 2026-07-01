package com.example.auction_web.service.Impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.response.AuctionRoomMessageResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.AuctionRoomMessage;
import com.example.auction_web.entity.User;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.AuctionRoomMessageRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.AuctionRealtimeService;
import com.example.auction_web.service.AuctionRoomService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuctionRoomServiceImpl implements AuctionRoomService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final AuctionRoomMessageRepository auctionRoomMessageRepository;
    private final AuctionRealtimeService auctionRealtimeService;

    @Override
    @Transactional(readOnly = true)
    public List<AuctionRoomMessageResponse> getMessages(Long auctionId) {
        return auctionRoomMessageRepository
                .findByAuction_AuctionIdOrderByCreatedAtAsc(auctionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AuctionRoomMessageResponse sendMessage(Long auctionId, Long senderUserId, String content) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found with id = " + auctionId));

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id = " + senderUserId));

        AuctionRoomMessage saved = auctionRoomMessageRepository.save(
                AuctionRoomMessage.builder()
                        .auction(auction)
                        .sender(sender)
                        .content(content.trim())
                        .build()
        );

        AuctionRoomMessageResponse response = toResponse(saved);
        auctionRealtimeService.publishAuctionRoomMessage(response);
        return response;
    }

    private AuctionRoomMessageResponse toResponse(AuctionRoomMessage message) {
        return AuctionRoomMessageResponse.builder()
                .messageId(message.getMessageId())
                .auctionId(message.getAuction().getAuctionId())
                .senderId(message.getSender().getUserId())
                .senderDisplayName(message.getSender().getDisplayUsername())
                .senderEmail(message.getSender().getEmail())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
