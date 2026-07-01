package com.example.auction_web.service;

import com.example.auction_web.dto.request.ContactMessageRequest;
import com.example.auction_web.dto.response.ContactMessageResponse;
import com.example.auction_web.entity.User;

public interface ContactMessageService {
    ContactMessageResponse createContactMessage(ContactMessageRequest request, User user);
}
