package com.example.auction_web.dto.request;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileCreateRequest {
    String lastName;
    String firstName;
    String middleName;
    String phoneNumber;
    String avatarUrl;
    String CCCDtruocUrl;
    String CCCDsauUrl;
    String gender;
    LocalDate dateOfBirth;
    String city;
    String commune;
    String address;
}
