package com.example.auction_web.service.Impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.example.auction_web.dto.request.CreateCarImageRequest;
import com.example.auction_web.dto.request.CreateCarRequest;
import com.example.auction_web.dto.request.CreateListingDocumentRequest;
import com.example.auction_web.dto.request.CreateListingRequest;
import com.example.auction_web.dto.request.ListingPatchRequest;
import com.example.auction_web.dto.response.AuctionResponse;
import com.example.auction_web.dto.response.ListingCommentResponse;
import com.example.auction_web.dto.response.ListingEngagementSummaryResponse;
import com.example.auction_web.dto.response.ListingPaymentSummaryResponse;
import com.example.auction_web.dto.response.ListingResponse;
import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Car;
import com.example.auction_web.entity.CarImage;
import com.example.auction_web.entity.Enumtype.AuctionResultStatus;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Enumtype.OrderStatus;
import com.example.auction_web.entity.Listing;
import com.example.auction_web.entity.ListingComment;
import com.example.auction_web.entity.ListingDocument;
import com.example.auction_web.entity.ListingReaction;
import com.example.auction_web.entity.User;
import com.example.auction_web.repository.AuctionRepository;
import com.example.auction_web.repository.AuctionResultRepository;
import com.example.auction_web.repository.CarRepository;
import com.example.auction_web.repository.ListingCommentRepository;
import com.example.auction_web.repository.ListingViewRepository;
import com.example.auction_web.repository.ListingReactionRepository;
import com.example.auction_web.repository.ListingRepository;
import com.example.auction_web.repository.PaymentRepository;
import com.example.auction_web.repository.UserRepository;
import com.example.auction_web.service.ListingService;
import com.example.auction_web.specification.ListingSpecification;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ListingServiceImpl implements ListingService {



    


    private final ListingRepository listingRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionResultRepository auctionResultRepository;
    private final PaymentRepository paymentRepository;
    private final ListingCommentRepository listingCommentRepository;
    private final ListingReactionRepository listingReactionRepository;
    private final ListingViewRepository listingViewRepository;

    @Override
    public List<AuctionResponse> getAuctionsForListing(Long listingId) {
        Optional<List<Auction>> response = auctionRepository.findByListing_Id(listingId);
        if(response.isEmpty()){
            return new ArrayList<>();
        }
        return response.get().stream()
                .map(auction -> AuctionResponse.fromEntity(auction, resolveAuctionResultStatus(auction.getAuctionId())))
                .toList();
    }

    private AuctionResultStatus resolveAuctionResultStatus(Long auctionId) {
        if (auctionId == null) {
            return null;
        }
        return auctionResultRepository.findByAuction_AuctionId(auctionId)
                .map(result -> result.getResultStatus())
                .orElse(null);
    }

    private AuctionResponse selectRelevantAuction(Listing listing, AuctionStatus filterStatus) {
        if (listing == null) return null;

        Optional<List<Auction>> auctionsOpt = auctionRepository.findByListing_Id(listing.getId());
        if (auctionsOpt.isEmpty() || auctionsOpt.get().isEmpty()) {
            return null;
        }

        List<Auction> auctions = auctionsOpt.get();

        AuctionStatus effectiveFilter = filterStatus;
        if (effectiveFilter == null && (listing.getStatus() == ListingStatus.SOLD
            || listing.getStatus() == ListingStatus.WAIT_FOR_PAYMENT)) {
            effectiveFilter = AuctionStatus.ENDED;
        }

        final AuctionStatus finalFilterStatus = effectiveFilter;

        List<Auction> matched = finalFilterStatus == null
                ? auctions
                : auctions.stream()
                        .filter(auction -> auction.getStatus() == finalFilterStatus)
                        .toList();

        List<Auction> source = matched.isEmpty() ? auctions : matched;
        return source.stream()
                .sorted((left, right) -> {
                    LocalDateTime rightTime = right.getCreatedAt() != null ? right.getCreatedAt() : right.getStartTime();
                    LocalDateTime leftTime = left.getCreatedAt() != null ? left.getCreatedAt() : left.getStartTime();
                    if (rightTime == null && leftTime == null) return 0;
                    if (rightTime == null) return -1;
                    if (leftTime == null) return 1;
                    return rightTime.compareTo(leftTime);
                })
                .findFirst()
                .map(auction -> AuctionResponse.fromEntity(auction, resolveAuctionResultStatus(auction.getAuctionId())))
                .orElse(null);
    }

    private String resolveViewerKey(Long currentUserId, String viewerKey) {
        if (currentUserId != null) {
            return "user:" + currentUserId;
        }

        String normalizedViewerKey = viewerKey == null ? "" : viewerKey.trim();
        if (normalizedViewerKey.isEmpty()) {
            return null;
        }

        return "visitor:" + normalizedViewerKey;
    }

    private long recordAndCountListingViews(Long listingId, Long currentUserId, String viewerKey) {
        String resolvedKey = resolveViewerKey(currentUserId, viewerKey);
        if (resolvedKey == null) {
            return listingViewRepository.countByListing_Id(listingId);
        }

        if (!listingViewRepository.existsByListing_IdAndViewerKey(listingId, resolvedKey)) {
            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

            try {
                listingViewRepository.save(
                        com.example.auction_web.entity.ListingView.builder()
                                .listing(listing)
                                .viewerKey(resolvedKey)
                                .build()
                );
            } catch (DataIntegrityViolationException ignored) {
                // Another request recorded the same viewer first.
            }
        }

        return listingViewRepository.countByListing_Id(listingId);
    }

    private long countListingViews(Long listingId) {
        return listingViewRepository.countByListing_Id(listingId);
    }

    @Override
    @Transactional
    public ListingResponse createListing(CreateListingRequest request,User currentUser) {
        

        Car car = CreateCarRequest.toEntity(request.getCar());
        carRepository.save(car);

        if(car.getCarImages()==null){
            car.setCarImages(new ArrayList<>());
        }

        if (request.getCar().getImages() != null && !request.getCar().getImages().isEmpty()) {
            List<CarImage> images = new ArrayList<>();
            for (CreateCarImageRequest imgReq : request.getCar().getImages()) {
                Integer sortOrder = imgReq.getSortOrder();
                CarImage image = CarImage.builder()
                    .sortOrder(sortOrder == null ? 0 : sortOrder)
                        .imageUrl(imgReq.getImageUrl())
                        .car(car)
                        .build();
                images.add(image);
            }
            car.setCarImages(images);
        }

        Car savedCar = carRepository.save(car);

        ListingStatus status = ListingStatus.SUBMITTED;

        Listing listing = Listing.builder()
                .car(savedCar)
                .seller(currentUser)
                .status(status)
                .title(request.getTitle())
                .description(request.getDescription())
                .addressSell(request.getAddressSell())
                .thumbnailUrl(request.getThumbnailUrl())
                .submittedAt(LocalDateTime.now())
                .approvedAt(null)
                .rejectedReason(null)
                .reviewedBy(null)
                .documents(new ArrayList<>())
                .build();

        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            List<ListingDocument> documents = new ArrayList<>();
            for (CreateListingDocumentRequest docReq : request.getDocuments()) {
                ListingDocument document = ListingDocument.builder()
                        .listing(listing)
                        .type(docReq.getType())
                        .fileUrl(docReq.getFileUrl())
                        .build();
                documents.add(document);
            }
            listing.setDocuments(documents);
        }

        Listing savedListing = listingRepository.save(listing);

        return mapToResponse(savedListing);
    }


    private ListingResponse mapToResponse(Listing listing) {
        return mapToResponse(listing, null, null, false, null);
    }

    private ListingResponse mapToResponse(Listing listing, Long currentUserId, AuctionStatus filterStatus) {
        return mapToResponse(listing, currentUserId, filterStatus, false, null);
    }

    private ListingResponse mapToResponse(
            Listing listing,
            Long currentUserId,
            AuctionStatus filterStatus,
            boolean recordView,
            String viewerKey
    ) {
        long likeCount = listingReactionRepository.countByListing_Id(listing.getId());
        long commentCount = listingCommentRepository.countByListing_Id(listing.getId());
        boolean likedByCurrentUser = currentUserId != null
                && listingReactionRepository.existsByListing_IdAndUser_UserId(listing.getId(), currentUserId);

        AuctionResponse auction = selectRelevantAuction(listing, filterStatus);
        long viewCount = recordView
                ? recordAndCountListingViews(listing.getId(), currentUserId, viewerKey)
                : countListingViews(listing.getId());

        ListingPaymentSummaryResponse paymentSummary = null;
        if (currentUserId != null
            && listing.getSeller() != null
            && currentUserId.equals(listing.getSeller().getUserId())
            && (listing.getStatus() == ListingStatus.WAIT_FOR_PAYMENT || listing.getStatus() == ListingStatus.SOLD)) {
            paymentSummary = paymentRepository.findTopByAuctionResult_Auction_Listing_IdOrderByCreatedAtDesc(listing.getId())
                .map(ListingPaymentSummaryResponse::fromEntity)
                .orElse(null);
        }

        return ListingResponse.fromEntity(listing, likeCount, commentCount, viewCount, likedByCurrentUser, auction, paymentSummary);
    }

    @Override
    public List<ListingResponse> getAllListings() {
        List<Listing> listings = listingRepository.findAll();
        return listings.stream().map(this::mapToResponse)
                .toList();
    }


    @Override
    public Page<ListingResponse> getFilteredListings(String brand, String addressSell, String title,
            AuctionStatus auctionStatus, Pageable pageable) {
        return getFilteredListings(brand, addressSell, title, auctionStatus, pageable, null);
    }

    @Override
    public Page<ListingResponse> getFilteredListings(String brand, String addressSell, String title,
            AuctionStatus auctionStatus, Pageable pageable, Long currentUserId) {
        Page<Listing> listingsPage = listingRepository.findAll(
            ListingSpecification.filterPublicListings(brand, addressSell, title, auctionStatus),
                pageable
        );

        Page<ListingResponse> responsePage = listingsPage.map((listing) -> mapToResponse(listing, currentUserId, auctionStatus));

        return responsePage;
    }


    @Override
    public ListingResponse updateListingStatus(Long listingId, ListingPatchRequest request) {
            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));
            listing.setStatus(request.getStatus());
            if (request.getStatus() == ListingStatus.REJECTED) {
                listing.setRejectedReason(request.getRejectedReason());
            } else {
                listing.setRejectedReason(null);
            }
            listing.setApprovedAt(request.getApprovedAt());
            User reviewer = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));
            listing.setReviewedBy(reviewer);
            Listing updated = listingRepository.save(listing);
            return mapToResponse(updated);
    }


    @Override
    public Page<ListingResponse> getAllListings(Pageable pageable,ListingStatus status) {
            Page<Listing> listingsPage = listingRepository.findAll(
                ListingSpecification.filterListings(null, null, null, null,status),
                pageable
            );

            Page<ListingResponse> responsePage = listingsPage.map(this::mapToResponse);

        return responsePage;
    }

    @Override
    public Page<ListingResponse> getMyListings(Long sellerId, Pageable pageable) {
        return listingRepository.findBySeller_UserIdOrderByCreatedAtDesc(sellerId, pageable)
                .map((listing) -> mapToResponse(listing, sellerId, null));
    }

    @Override
    public Page<ListingResponse> getLikedListings(Long userId, Pageable pageable) {
        return listingReactionRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, pageable)
                .map(ListingReaction::getListing)
            .map((listing) -> mapToResponse(listing, userId, null));
    }

    @Override
    public Page<ListingResponse> getWonListings(Long userId, Pageable pageable) {
        return auctionResultRepository.findWonListingsByWinnerId(userId, pageable)
                .map((listing) -> mapToResponse(listing, userId, null));
    }

    @Override
    public ListingResponse getListingById(Long listingId) {
        return getListingById(listingId, null, null);
    }

    @Override
    public ListingResponse getListingById(Long listingId, Long currentUserId, String viewerKey) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));
        return mapToResponse(listing, currentUserId, null, true, viewerKey);
    }

    @Override
    public long countBySeller(Long sellerId) {
        return listingRepository.countBySeller_UserId(sellerId);
    }

    @Override
    public boolean checkIfListingNotSold(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        if (listing.getStatus() == ListingStatus.SOLD) {
            return false;
        }

        boolean hasPaidOrder = paymentRepository.existsByAuctionResult_Auction_Listing_IdAndOrderStatus(
                listingId,
                OrderStatus.PAID
        );

        return !hasPaidOrder;
    }

        @Override
        public ListingEngagementSummaryResponse getEngagementSummary(Long listingId, Long currentUserId) {
        listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        long likeCount = listingReactionRepository.countByListing_Id(listingId);
        long commentCount = listingCommentRepository.countByListing_Id(listingId);
        boolean likedByCurrentUser = currentUserId != null
            && listingReactionRepository.existsByListing_IdAndUser_UserId(listingId, currentUserId);

        return ListingEngagementSummaryResponse.builder()
            .listingId(listingId)
            .likeCount(likeCount)
            .commentCount(commentCount)
            .likedByCurrentUser(likedByCurrentUser)
            .build();
        }

        @Override
        public List<ListingCommentResponse> getListingComments(Long listingId) {
        listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        return listingCommentRepository.findByListing_IdOrderByCreatedAtDesc(listingId)
            .stream()
            .map(ListingCommentResponse::fromEntity)
            .toList();
        }

        @Override
        public Page<ListingCommentResponse> getListingComments(Long listingId, Pageable pageable) {
            listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

            return listingCommentRepository.findByListing_IdOrderByCreatedAtDescIdDesc(listingId, pageable)
                .map(ListingCommentResponse::fromEntity);
        }

        @Override
        public ListingCommentResponse addListingComment(Long listingId, User user, String content) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        ListingComment saved = listingCommentRepository.save(
            ListingComment.builder()
                .listing(listing)
                .user(user)
                .content(content.trim())
                .build());

        return ListingCommentResponse.fromEntity(saved);
        }

        @Override
        public ListingEngagementSummaryResponse toggleListingReaction(Long listingId, User user) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        listingReactionRepository.findByListing_IdAndUser_UserId(listingId, user.getUserId())
            .ifPresentOrElse(
                listingReactionRepository::delete,
                () -> listingReactionRepository.save(
                    ListingReaction.builder()
                        .listing(listing)
                        .user(user)
                        .build()));

        return getEngagementSummary(listingId, user.getUserId());
        }

        @Override
        public Listing getListingByAuctionId(Long auctionId) {
            Optional<Listing> listing = listingRepository.findByAuctions_AuctionId(auctionId);
            if(listing.isEmpty()){
                throw new RuntimeException("Listing not found for auction id: " + auctionId);
            }
            return listing.get();
        }
        

}
