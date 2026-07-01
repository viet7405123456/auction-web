package com.example.auction_web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AuctionWebApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuctionWebApplication.class, args);
	}

}
