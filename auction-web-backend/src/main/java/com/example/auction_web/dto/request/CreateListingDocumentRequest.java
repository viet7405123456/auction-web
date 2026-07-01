package com.example.auction_web.dto.request;

import com.example.auction_web.entity.Enumtype.DocumentType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateListingDocumentRequest {

    @NotNull
    private DocumentType type;

    @NotBlank
    private String fileUrl;
}