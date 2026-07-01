package com.example.auction_web.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {
    String upload(MultipartFile file);
}
