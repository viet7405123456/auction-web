package com.example.auction_web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactMessageRequest {
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255, message = "Email tối đa 255 ký tự")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 50, message = "Số điện thoại tối đa 50 ký tự")
    private String phone;

    @NotBlank(message = "Tin nhắn không được để trống")
    @Size(max = 4000, message = "Tin nhắn tối đa 4000 ký tự")
    private String message;
}
