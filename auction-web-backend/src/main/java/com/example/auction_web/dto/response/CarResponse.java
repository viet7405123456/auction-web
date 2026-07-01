package com.example.auction_web.dto.response;

import java.util.List;

import com.example.auction_web.entity.Enumtype.BodyType;
import com.example.auction_web.entity.Enumtype.FuelType;
import com.example.auction_web.entity.Enumtype.Transmission;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CarResponse {
    private Long carId;
    private String name;
    private String brand;
    private String model;
    private Integer year;
    private String origin;
    private FuelType fuelType;
    private String horsepower;
    private String mileage;
    private String color;
    private BodyType bodyType;
    private Transmission transmission;
    private String engine;
    private List<CarImageResponse> images;
    private int seats;

    static public CarResponse fromEntity(com.example.auction_web.entity.Car car) {
        return CarResponse.builder()
                .carId(car.getCarId())
                .name(car.getName())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .origin(car.getOrigin())
                .fuelType(car.getFuelType())
                .horsepower(car.getHorsepower())
                .mileage(car.getMileage())
                .color(car.getColor())
                .bodyType(car.getBodyType())
                .transmission(car.getTransmission())
                .engine(car.getEngine())
                .seats(car.getSeats())
                .images(
                        car.getCarImages() == null ? List.of() :
                                car.getCarImages().stream()
                                        .map(image -> CarImageResponse.builder()
                                                .imageId(image.getImageId())
                                                .sortOrder(image.getSortOrder())
                                                .imageUrl(image.getImageUrl())
                                                .build()
                                        )
                                        .toList()
                )
                .build();
    }
}

