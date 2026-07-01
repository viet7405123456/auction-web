package com.example.auction_web.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.example.auction_web.entity.Auction;
import com.example.auction_web.entity.Car;
import com.example.auction_web.entity.Enumtype.AuctionStatus;
import com.example.auction_web.entity.Enumtype.ListingStatus;
import com.example.auction_web.entity.Listing;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

public class ListingSpecification {

    private ListingSpecification() {
    }

    public static Specification<Listing> filterListings(
            String brand,
            String addressSell,
            String title,
            AuctionStatus auctionStatus,
            ListingStatus listingStatus
    ) {
        return (root, query, cb) -> {
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            Join<Listing, Car> carJoin = root.join("car", JoinType.INNER);
            Join<Listing, Auction> auctionJoin = root.join("auctions", JoinType.LEFT);

            if (StringUtils.hasText(brand)) {
                predicates.add(
                        cb.like(cb.lower(carJoin.get("brand")), "%" + brand.toLowerCase() + "%")
                );
            }

            if (StringUtils.hasText(addressSell)) {
                predicates.add(
                        cb.like(cb.lower(root.get("addressSell")), "%" + addressSell.toLowerCase() + "%")
                );
            }

            if (StringUtils.hasText(title)) {
                predicates.add(
                        cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%")
                );
            }

            if (listingStatus != null)  {
                predicates.add(cb.equal(root.get("status"), listingStatus));
            }


            if (auctionStatus != null) {
                predicates.add(cb.equal(auctionJoin.get("status"), auctionStatus));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Listing> filterPublicListings(
            String brand,
            String addressSell,
            String title,
            AuctionStatus auctionStatus
    ) {
        return (root, query, cb) -> {
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            Join<Listing, Car> carJoin = root.join("car", JoinType.INNER);
            Join<Listing, Auction> auctionJoin = root.join("auctions", JoinType.LEFT);

            if (StringUtils.hasText(brand)) {
                predicates.add(
                        cb.like(cb.lower(carJoin.get("brand")), "%" + brand.toLowerCase() + "%")
                );
            }

            if (StringUtils.hasText(addressSell)) {
                predicates.add(
                        cb.like(cb.lower(root.get("addressSell")), "%" + addressSell.toLowerCase() + "%")
                );
            }

            if (StringUtils.hasText(title)) {
                predicates.add(
                        cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%")
                );
            }

            predicates.add(root.get("status").in(ListingStatus.APPROVED, ListingStatus.SOLD));

            if (auctionStatus != null) {
                predicates.add(cb.equal(auctionJoin.get("status"), auctionStatus));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}