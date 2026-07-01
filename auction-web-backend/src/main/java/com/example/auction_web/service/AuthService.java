package com.example.auction_web.service;

import com.example.auction_web.dto.request.RegisterRequest;
import com.example.auction_web.dto.request.ResetPassword;
import com.example.auction_web.dto.request.SignInRequest;
import com.example.auction_web.dto.response.TokenResponse;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    public void register(RegisterRequest registerRequest);

    public void adminRegister(RegisterRequest registerRequest);

    TokenResponse getAccessToken(SignInRequest signInRequest);

    TokenResponse refreshToken(HttpServletRequest request);

    TokenResponse authenticate(SignInRequest signInRequest);

    String logout(HttpServletRequest request);

    String forgotPassword(String email);

    String resetPassword(String secretKey);

    String changePassword(ResetPassword requestPassword);
}
