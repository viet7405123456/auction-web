package com.example.auction_web.dto.response;


public class ResponseError extends ResponseData {
    public ResponseError(int status, String message) {
        super(status, message, null);
    }
}
