package com.example.auction_web.exception;

public class InvalidDataException  extends RuntimeException {
    public InvalidDataException(String message) {
        super(message);
    }
}
