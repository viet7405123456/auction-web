package com.example.auction_web.utils;

import org.springframework.security.core.Authentication;

import com.example.auction_web.entity.User;

public class SecurityUtil {
    public static User getCurrentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }
}
