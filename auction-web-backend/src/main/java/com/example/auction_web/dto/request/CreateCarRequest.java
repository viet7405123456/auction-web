package com.example.auction_web.dto.request;

import java.util.List;

import com.example.auction_web.entity.Car;
import com.example.auction_web.entity.Enumtype.BodyType;
import com.example.auction_web.entity.Enumtype.FuelType;
import com.example.auction_web.entity.Enumtype.Transmission;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCarRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String brand;

    @NotBlank
    private String model;

    @NotNull
    private Integer year;

    @NotBlank
    private String origin;

    @NotNull
    private FuelType fuelType;

    @NotBlank
    private String horsepower;

    @NotNull
    private String mileage;

    @NotBlank
    private String color;


    @NotNull
    private Transmission transmission;

    private BodyType bodyType;

    @NotBlank
    private String engine;

    private String description;

    @NotNull
    private Integer seats;

    @Valid
    private List<CreateCarImageRequest> images;

    static public Car toEntity(CreateCarRequest request) {
        return Car.builder()
                .name(request.getName())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .origin(request.getOrigin())
                .fuelType(request.getFuelType())
                .horsepower(request.getHorsepower())
                .mileage(request.getMileage())
                .color(request.getColor())
                .transmission(request.getTransmission())
                .bodyType(request.getBodyType())
                .engine(request.getEngine())
                .seats(request.getSeats())
                .build();
    }

}