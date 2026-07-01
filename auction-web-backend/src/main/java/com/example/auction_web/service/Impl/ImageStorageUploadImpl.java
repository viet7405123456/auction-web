package com.example.auction_web.service.Impl;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.example.auction_web.service.ImageStorageService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ImageStorageUploadImpl implements ImageStorageService {
    private final Cloudinary cloudinary;

    @Override
    public String upload(MultipartFile file) {
        validate(file);

        try {
            Map<String, Object> options = Map.of(
                    "folder", "auction_cars",
                    "resource_type", "image"
            );

            Map result = cloudinary.uploader()
                    .upload(file.getBytes(), options);

            return result.get("secure_url").toString();

        } catch (Exception e) {
            throw new RuntimeException("Upload image failed", e);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        if (!file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only image files allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image must be < 5MB");
        }
    }
}
