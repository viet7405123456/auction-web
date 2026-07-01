package com.example.auction_web.dto.request;

import java.io.Serializable;

import lombok.Data;
@Data
public class ResetPassword implements Serializable {
    private String secretKey;

    private String password;

    private String confirmPassword;
}
