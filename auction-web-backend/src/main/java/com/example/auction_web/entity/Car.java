package com.example.auction_web.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.example.auction_web.entity.Enumtype.BodyType;
import com.example.auction_web.entity.Enumtype.FuelType;
import com.example.auction_web.entity.Enumtype.Transmission;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_id")
    private Long carId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "brand",nullable = false)
    private String brand;

    @Column(name = "model",nullable = false)
    private String model; 

    @Column(name = "year_of_manufacture", nullable = false)
    private Integer year;

    @Column(name = "origin", nullable = false)
    private String origin;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false)
    private FuelType fuelType;

    @Column(name = "horsepower", nullable = false)
    private String horsepower;

    @Column(name = "mileage", nullable = false)
    private String mileage;
    
    @Column(name = "color", nullable = false)
    private String color;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission", nullable = false)
    private Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "body_type")
    private BodyType bodyType;

    @Column(name = "engine", nullable = false)
    private String engine;


    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CarImage> carImages;

    @Column(name = "seats", nullable = false)
    private int seats;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
