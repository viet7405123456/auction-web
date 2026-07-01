// package com.example.auction_web.service.Impl;

// import org.springframework.stereotype.Service;

// import com.example.auction_web.dto.request.CarRequest;
// import com.example.auction_web.entity.Car;
// import com.example.auction_web.repository.CarRepository;
// import com.example.auction_web.service.CarService;

// import lombok.RequiredArgsConstructor;


// @Service
// @RequiredArgsConstructor
// public class CarServiceImpl implements CarService {
    
//     private final CarRepository carRepository;

//     @Override
//     public void saveCar(CarRequest request,String imageUrl) {
//         Car car = Car.builder()
//             .name(request.getName())
//             .brand(request.getBrand())
//             .model(request.getModel())
//             .year(request.getYear())
//             .origin(request.getOrigin())
//             .fuelType(request.getFuelType())
//             .horsepower(request.getHorsepower())
//             .mileage(request.getMileage())
//             .color(request.getColor())
//             .transmission(request.getTransmission())
//             .engine(request.getEngine())
//             .seats(request.getSeats())
//             .description(request.getDescription())

//             .build();
//         carRepository.save(car);
//     }
// }
