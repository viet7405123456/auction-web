package com.example.auction_web.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.auction_web.dto.request.ChangePasswordRequest;
import com.example.auction_web.dto.request.UserPatchRequest;
import com.example.auction_web.dto.response.UserProfileResponse;
import com.example.auction_web.entity.User;

public interface UserService {
    
    UserProfileResponse getCurrentUserProfile(User user);
    
    User getByEmail(String email);

    Long saveUser(User user);

    
    Page<UserProfileResponse> getAllUsers(Pageable pageable);

    UserProfileResponse patchUser(Long userId, UserPatchRequest request);

    UserProfileResponse updateAvatar(Long userId, String avatarUrl);

    void changePassword(Long userId, ChangePasswordRequest request);
}
