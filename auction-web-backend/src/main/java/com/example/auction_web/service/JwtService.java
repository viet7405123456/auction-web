package com.example.auction_web.service;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.auction_web.common.TokenType;

public interface JwtService {
    String generateAccessToken(long userId,String email,Collection<? extends GrantedAuthority> authorities);

    String generateRefreshToken(long userId, String email,Collection<? extends GrantedAuthority> authorities);
    String extractEmail(String token, TokenType type);

    String generateResetToken(long userId, String email,Collection<? extends GrantedAuthority> authorities);

    boolean isTokenValid(String token,TokenType type, UserDetails user);
    
    /**
     * Safely extract email from token without throwing exceptions.
     * Returns null if token is invalid or expired.
     */
    String extractEmailSafe(String token, TokenType type);
    
    /**
     * Safely check if token is expired without throwing exceptions.
     * Returns true if token is expired or invalid.
     */
    boolean isTokenExpiredSafe(String token, TokenType type);
}
