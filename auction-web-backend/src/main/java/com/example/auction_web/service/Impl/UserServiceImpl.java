package com.example.auction_web.service.Impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auction_web.dto.request.ChangePasswordRequest;
import com.example.auction_web.dto.request.UserPatchRequest;
import com.example.auction_web.dto.response.UserProfileResponse;
import com.example.auction_web.entity.User;
import com.example.auction_web.entity.UserProfile;
import com.example.auction_web.exception.InvalidDataException;
import com.example.auction_web.exception.ResourceNotFoundException;
import com.example.auction_web.repository.UserProfileRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.UserService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserProfileResponse getCurrentUserProfile(User user) {
        UserProfile profile = userProfileRepository
                .findByUser_Email(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getDisplayUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .accountLocked(user.isAccountLocked())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .profile(profile)
                .build();
    }


    @Override
    public User getByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(()-> new ResourceNotFoundException("Not found user have email"));
    }

    @Override
    public Long saveUser(User user) {
        userRepository.save(user);
        return user.getUserId();
    }

    @Override
    public Page<UserProfileResponse> getAllUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);

        return users.map(user -> {
        return UserProfileResponse.fromEntity(user);
        });
    }


    @Override
    public UserProfileResponse patchUser(Long userId, UserPatchRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (request.getVerified() != null) {
            user.setVerified(request.getVerified());
        }

        if (request.getAccountLocked() != null) {
            user.setAccountLocked(request.getAccountLocked());
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        userRepository.save(user);

        UserProfile profile = user.getUserProfile();
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .accountLocked(user.isAccountLocked())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .profile(profile)
                .build();
    }

    @Override
    public UserProfileResponse updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserProfile profile = user.getUserProfile();
        if (profile == null) {
            profile = UserProfile.builder()
                    .user(user)
                    .totalAuctionsJoined(0)
                    .totalWins(0)
                    .rating(0.0)
                    .build();
        }

        profile.setAvatarUrl(avatarUrl);
        userProfileRepository.save(profile);
        user.setUserProfile(profile);

        return UserProfileResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new InvalidDataException("Current password must not be blank");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidDataException("Current password is incorrect");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new InvalidDataException("New password must not be blank");
        }

        if (confirmPassword == null || confirmPassword.isBlank()) {
            throw new InvalidDataException("Confirm password must not be blank");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new InvalidDataException("Confirm password does not match");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new InvalidDataException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
