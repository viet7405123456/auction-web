package com.example.auction_web.service.Impl;

import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.common.TokenType;
import com.example.auction_web.dto.request.RegisterRequest;
import com.example.auction_web.dto.request.ResetPassword;
import com.example.auction_web.dto.request.SignInRequest;
import com.example.auction_web.dto.response.TokenResponse;
import com.example.auction_web.entity.Enumtype.UserRoleType;
import com.example.auction_web.entity.Token;
import com.example.auction_web.entity.User;
import com.example.auction_web.entity.UserProfile;
import com.example.auction_web.exception.EmailAlreadyExistsException;
import com.example.auction_web.exception.InvalidDataException;
import com.example.auction_web.repository.UserProfileRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.AuthService;
import com.example.auction_web.service.JwtService;
import com.example.auction_web.service.TokenService;
import com.example.auction_web.service.UserService;
import com.example.auction_web.service.UserSessionService;

import io.micrometer.common.util.StringUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTH_SERVICE")
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserProfileRepository userProfileRepository;
    private final TokenService tokenService;
    private final UserService userService;
    private final UserSessionService userSessionService;

    @Transactional
    @Override
    public void register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        if(userRepository.existsByUsername(registerRequest.getUsername())){
            throw new EmailAlreadyExistsException("Username already exists");
        }

        if(userProfileRepository.existsByPhoneNumber(registerRequest.getUserProfle().getPhoneNumber())){
            throw new EmailAlreadyExistsException("Phone number already exists");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .enabled(true)
                .role(UserRoleType.USER)
                .accountLocked(false)
                .build();
        userRepository.save(user);
        String fullNameToSave = String.format("%s %s %s", registerRequest.getUserProfle().getLastName(), registerRequest.getUserProfle().getMiddleName(), registerRequest.getUserProfle().getFirstName());
        String addressToSave = String.format("%s, %s, %s",registerRequest.getUserProfle().getCity(),registerRequest.getUserProfle().getCommune(),registerRequest.getUserProfle().getAddress());
        UserProfile profile = UserProfile.builder()
            .user(user)
            .address(addressToSave)
            .avatarUrl(registerRequest.getUserProfle().getAvatarUrl())
            .CCCDsauUrl(registerRequest.getUserProfle().getCCCDsauUrl())
            .CCCDtruocUrl(registerRequest.getUserProfle().getCCCDtruocUrl())
            .dateOfBirth(registerRequest.getUserProfle().getDateOfBirth())
            .fullname(fullNameToSave)
            .phoneNumber(registerRequest.getUserProfle().getPhoneNumber())
            .gender(registerRequest.getUserProfle().getGender())
            .totalAuctionsJoined(0)
            .totalWins(0)
            .rating(0.0)
            .build();
        userProfileRepository.save(profile);
    }

    @Override
    public TokenResponse getAccessToken(SignInRequest signInRequest) {
        log.info("Get Access Token)");
        try{
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        signInRequest.getEmail(),
                        signInRequest.getPassword()
                )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (AuthenticationException e) {
            throw e; 
        }
        var user = userRepository.findByEmail(signInRequest.getEmail())
                .orElseThrow(() -> new AccessDeniedException("User not found"));
        
        String accessToken = jwtService.generateAccessToken(user.getUserId(), signInRequest.getEmail(), user.getAuthorities());
        String refreshToken = jwtService.generateRefreshToken(user.getUserId(), signInRequest.getEmail(), user.getAuthorities());

        Token token = Token.builder()
                .email(user.getEmail())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
        
        tokenService.save(token);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .build();
    }

    @Override
    public TokenResponse refreshToken(HttpServletRequest request) {
        String token = request.getHeader("x-token");
        if(StringUtils.isBlank(token)){
            throw new InvalidDataException("Refresh token is missing");
        }

        final String email = jwtService.extractEmail(token,TokenType.REFRESHTOKEN);

        Optional<User> user = userRepository.findByEmail(email);
        if(user.isEmpty()){
            throw new AccessDeniedException("User not found");
        }

        if(jwtService.isTokenValid(token,TokenType.REFRESHTOKEN, user.get())){
            String accessToken = jwtService.generateAccessToken(user.get().getUserId(), email, user.get().getAuthorities());
            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(token)
                    .userId(user.get().getUserId())  
                    .build();
        } else {
            throw new InvalidDataException("Invalid refresh token");
        }

    }

    @Override
    public TokenResponse authenticate(SignInRequest signInRequest) {
        
        return null;
    }

    @Override
    public String logout(HttpServletRequest request) {
        String accessToken = request.getHeader("x-token");
        if(StringUtils.isBlank(accessToken)){
            String authHeader = request.getHeader("Authorization");
            if (StringUtils.isNotBlank(authHeader) && authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7).trim();
            }
        }

        if(StringUtils.isBlank(accessToken)){
            throw new InvalidDataException("Token must be not blank");
        }
        final String email = jwtService.extractEmail(accessToken, TokenType.ACCESSTOKEN);

        Optional<User> user = userRepository.findByEmail(email);
        Token currentToken = tokenService.getByEmail(email);
        if (currentToken != null) {
            tokenService.delete(currentToken);
        }

        user.ifPresent(u -> userSessionService.clearUserSessions(u.getUserId()));

        return "Logout Successfully";
    }

    @Override
    public String forgotPassword(String email) {
        User user = userService.getByEmail(email);

        if(!user.isEnabled()){
            throw new InvalidDataException("User not active");
        }

        String resetToken = jwtService.generateResetToken(user.getUserId(), email, user.getAuthorities());

        
        String confirmlink = String.format("curl --location 'http://localhost:8080/auth/reset-password' \\\n" +
            "--header 'accept: */*' \\\n" + 
            "--header 'Content-Type: application/json' \\\n" + 
            "--data '%s'",resetToken
        );
        
        return "Sent";
    }

    @Override
    public String resetPassword(String secretKey) {
        log.info("----------- RESET PASSWORD ------------");

        final String email = jwtService.extractEmail(secretKey, TokenType.RESET_TOKEN);
        var user = userService.getByEmail(email);

        if(!jwtService.isTokenValid(secretKey, TokenType.RESET_TOKEN, user)){
            throw new InvalidDataException("Not allow access with this token");
        }

        return "Reset";
    }

    @Override
    public String changePassword(ResetPassword requestPassword) {
        final String email = jwtService.extractEmail(requestPassword.getSecretKey(), TokenType.RESET_TOKEN);
        var user = userService.getByEmail(email);

        if(!jwtService.isTokenValid(requestPassword.getSecretKey(), TokenType.RESET_TOKEN, user)){
            throw new InvalidDataException("Not allow access with this token");
        }

        if(requestPassword.getPassword() != requestPassword.getConfirmPassword()){
            throw new InvalidDataException("Password not match");
        }

        user.setPassword(passwordEncoder.encode(requestPassword.getPassword()));

        Long userId = userService.saveUser(user);

        return "Changed";
    }

    @Override
    public void adminRegister(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .enabled(true)
                .role(UserRoleType.ADMIN)
                .accountLocked(false)
                .build();
        userRepository.save(user);
        UserProfile profile = UserProfile.builder()
            .user(user)
            .totalAuctionsJoined(0)
            .totalWins(0)
            .rating(0.0)
            .build();
        userProfileRepository.save(profile);
        
    }


    
}
