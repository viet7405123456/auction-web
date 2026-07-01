package com.example.auction_web.controller;

import org.apache.catalina.connector.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auction_web.dto.request.RegisterRequest;
import com.example.auction_web.dto.request.ResetPassword;
import com.example.auction_web.dto.request.SignInRequest;
import com.example.auction_web.dto.response.TokenResponse;
import com.example.auction_web.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignInRequest signInRequest) {
        try {
            return new ResponseEntity<>(
            authService.getAccessToken(signInRequest),
            HttpStatus.OK
        );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        authService.logout(request);
        return "Logout successful";
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.status(Response.SC_CREATED).body("User registered successfully");
    }

    @PostMapping("/access-token")
    public ResponseEntity<?> getAccessToken(@RequestBody SignInRequest signInRequest){

        try {
            return new ResponseEntity<>(
            authService.getAccessToken(signInRequest),
            HttpStatus.OK
        );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<TokenResponse> refreshToken(HttpServletRequest request){
        return new ResponseEntity<>(
            authService.refreshToken(request),
            HttpStatus.OK
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody String email){
        return new ResponseEntity<>(authService.forgotPassword(email),HttpStatus.OK);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody String secretKey){
        return new ResponseEntity<>(authService.resetPassword(secretKey),HttpStatus.OK);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ResetPassword resetPassword){
        return new ResponseEntity<>(authService.changePassword(resetPassword),HttpStatus.OK);
    }
}
