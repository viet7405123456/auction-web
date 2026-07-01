package com.example.auction_web.dto.response;

import com.example.auction_web.entity.Enumtype.DocumentType;
import com.example.auction_web.entity.ListingDocument;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingDocumentResponse {
    private Long documentId;
    private DocumentType type;
    private String fileUrl;

    static ListingDocumentResponse fromEntity(ListingDocument document) {
        return ListingDocumentResponse.builder()
                .documentId(document.getDocumentId())
                .type(document.getType())
                .fileUrl(document.getFileUrl())
                .build();
    }
}
