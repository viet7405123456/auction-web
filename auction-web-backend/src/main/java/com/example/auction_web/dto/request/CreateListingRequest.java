package com.example.auction_web.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateListingRequest {
    @NotBlank
    private String title;

    private String description;

    private String thumbnailUrl;

    private String addressSell;

    @Valid
    @NotNull
    private CreateCarRequest car;
    
    @Valid
    private List<CreateListingDocumentRequest> documents;
}
