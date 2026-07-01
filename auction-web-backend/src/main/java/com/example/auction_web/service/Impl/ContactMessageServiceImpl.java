package com.example.auction_web.service.Impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.request.ContactMessageRequest;
import com.example.auction_web.dto.response.ContactMessageResponse;
import com.example.auction_web.entity.ContactMessage;
import com.example.auction_web.entity.User;
import com.example.auction_web.repository.ContactMessageRepository;
import com.example.auction_web.service.ContactMessageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactMessageServiceImpl implements ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;

    @Override
    public ContactMessageResponse createContactMessage(ContactMessageRequest request, User user) {
        ContactMessage contactMessage = ContactMessage.builder()
                .userId(user != null ? user.getUserId() : null)
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone().trim())
                .message(request.getMessage().trim())
                .build();

        return ContactMessageResponse.fromEntity(contactMessageRepository.save(contactMessage));
    }
}
