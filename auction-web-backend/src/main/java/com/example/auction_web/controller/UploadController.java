package com.example.auction_web.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private Cloudinary cloudinary;

    @PostMapping("/image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        validate(file);

        try {
            Map<String, Object> options = Map.of(
                    "folder", "auction_cars",
                    "resource_type", "image"
            );

            Map result = cloudinary.uploader()
                    .upload(file.getBytes(), options);

            return ResponseEntity.ok(result.get("secure_url").toString());

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload image failed: " + e.getMessage());
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }


        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Image must be < 5MB");
        }
    }
}
