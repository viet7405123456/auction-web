package com.example.auction_web.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Car;
@Repository
public interface CarRepository extends JpaRepository<Car, Long> {
    
}
