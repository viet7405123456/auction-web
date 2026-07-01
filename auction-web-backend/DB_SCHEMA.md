# Database schema (tổng hợp)

Tài liệu này tổng hợp **các bảng trong database** dựa trên mapping JPA (`src/main/java/com/example/auction_web/entity`).

- DB mục tiêu theo cấu hình: PostgreSQL (`application.yaml`).
- Lưu ý: đây là schema **suy ra từ source code**. Nếu DB đã được chỉnh tay/migrate khác, có thể có chênh lệch.
- Ngày tạo: 2026-05-05.

## Quy ước kiểu dữ liệu (tham khảo)

- `Long` → `BIGINT`
- `Integer` → `INTEGER`
- `boolean` → `BOOLEAN`
- `String` → `VARCHAR` (mặc định) hoặc `TEXT` (nếu `columnDefinition = TEXT/text`)
- `BigDecimal(precision=19, scale=2)` → `NUMERIC(19,2)`
- `LocalDateTime` → `TIMESTAMP`
- `LocalDate` → `DATE`
- `@Enumerated(EnumType.STRING)` → `VARCHAR` (lưu giá trị enum dạng chuỗi)

---

## 1) users
Nguồn: `User`

**PK**: `user_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| user_id | BIGINT | PK, identity | |
| username | VARCHAR | NOT NULL | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| password | VARCHAR | NOT NULL | |
| enabled | BOOLEAN | NOT NULL | default Java: `true` |
| account_locked | BOOLEAN | NOT NULL | default Java: `false` |
| is_verified | BOOLEAN | NOT NULL | default Java: `false` |
| role | VARCHAR | NOT NULL | enum `UserRoleType` |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |
| last_online_at | TIMESTAMP |  | |

**Quan hệ**
- 1-1: `user_profiles.user_id` (unique) → `users.user_id`

---

## 2) user_profiles
Nguồn: `UserProfile`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| fullname | VARCHAR |  | |
| phone_number | VARCHAR(20) |  | |
| avatar_url | VARCHAR |  | |
| CCCD_truoc | VARCHAR |  | tên cột có chữ hoa theo annotation |
| CCCD_sau | VARCHAR |  | tên cột có chữ hoa theo annotation |
| gender | VARCHAR |  | |
| date_of_birth | DATE |  | |
| address | TEXT |  | |
| total_auctions_joined | INTEGER |  | default Java: `0` (tên cột suy ra) |
| total_wins | INTEGER |  | default Java: `0` (tên cột suy ra) |
| rating | DOUBLE |  | |
| user_id | BIGINT | NOT NULL, UNIQUE, FK | → `users.user_id` |
| created_at | TIMESTAMP |  | set ở `@PrePersist` (tên cột suy ra) |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` (tên cột suy ra) |

---

## 3) tokens
Nguồn: `Token`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| email | VARCHAR | UNIQUE | |
| access_token | VARCHAR |  | |
| refresh_token | VARCHAR |  | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 4) notifications
Nguồn: `Notification`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| recipient_user_id | BIGINT | NOT NULL | không mapping FK (chỉ lưu id) |
| type | VARCHAR(50) | NOT NULL | enum `NotificationType` |
| title | VARCHAR(255) | NOT NULL | |
| message | TEXT | NOT NULL | |
| reference_id | BIGINT |  | ví dụ auctionId |
| is_read | BOOLEAN | NOT NULL | set `false` lúc tạo |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| read_at | TIMESTAMP |  | |

---

## 5) payments
Nguồn: `Payment`

**PK**: `payment_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| payment_id | BIGINT | PK, identity | |
| auction_result_id | BIGINT | NOT NULL, UNIQUE, FK | → `auction_results.result_id` |
| buyer_user_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| amount | NUMERIC(19,2) | NOT NULL | |
| order_status | VARCHAR | NOT NULL | enum `OrderStatus` |
| payment_status | VARCHAR | NOT NULL | enum `PaymentStatus` |
| payment_reference | VARCHAR(128) |  | |
| paid_at | TIMESTAMP |  | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 6) cars
Nguồn: `Car`

**PK**: `car_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| car_id | BIGINT | PK, identity | |
| name | VARCHAR | NOT NULL | |
| brand | VARCHAR | NOT NULL | |
| model | VARCHAR | NOT NULL | |
| year_of_manufacture | INTEGER | NOT NULL | |
| origin | VARCHAR | NOT NULL | |
| fuel_type | VARCHAR | NOT NULL | enum `FuelType` |
| horsepower | VARCHAR | NOT NULL | đang lưu dạng chuỗi |
| mileage | VARCHAR | NOT NULL | đang lưu dạng chuỗi |
| color | VARCHAR | NOT NULL | |
| license_plate | VARCHAR(20) |  | |
| transmission | VARCHAR | NOT NULL | enum `Transmission` |
| body_type | VARCHAR |  | enum `BodyType` |
| engine | VARCHAR | NOT NULL | |
| seats | INTEGER | NOT NULL | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 7) car_images
Nguồn: `CarImage`

**PK**: `image_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| image_id | BIGINT | PK, identity | |
| sort_order | INTEGER | NOT NULL | default Java: `0` |
| image_url | TEXT | NOT NULL | annotation: `columnDefinition = text` |
| car_id | BIGINT | NOT NULL, FK | → `cars.car_id` |

---

## 8) listings
Nguồn: `Listing`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| car_id | BIGINT | NOT NULL, FK | → `cars.car_id` |
| seller_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| status | VARCHAR | NOT NULL | enum `ListingStatus` |
| title | VARCHAR | NOT NULL | |
| address_to_sell | VARCHAR |  | |
| description | TEXT |  | |
| thumbnail_url | VARCHAR |  | |
| approved_at | TIMESTAMP |  | |
| submitted_at | TIMESTAMP |  | |
| rejected_reason | TEXT |  | |
| reviewed_by_user_id | BIGINT | FK | → `users.user_id` |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 9) listing_documents
Nguồn: `ListingDocument`

**PK**: `document_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| document_id | BIGINT | PK, identity | |
| listing_id | BIGINT | NOT NULL, FK | → `listings.id` |
| type | VARCHAR(30) | NOT NULL | enum `DocumentType` |
| file_url | TEXT | NOT NULL | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 10) listing_views
Nguồn: `ListingView`

**PK**: `id`

**Unique**: (`listing_id`, `viewer_key`)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| listing_id | BIGINT | NOT NULL, FK | → `listings.id` |
| viewer_key | VARCHAR(128) | NOT NULL | |
| viewed_at | TIMESTAMP | NOT NULL | set ở `@PrePersist` |

---

## 11) listing_comments
Nguồn: `ListingComment`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| listing_id | BIGINT | NOT NULL, FK | → `listings.id` |
| user_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| content | TEXT | NOT NULL | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 12) listing_reactions
Nguồn: `ListingReaction`

**PK**: `id`

**Unique**: (`listing_id`, `user_id`) (constraint name: `uk_listing_reaction_listing_user`)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| listing_id | BIGINT | NOT NULL, FK | → `listings.id` |
| user_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |

---

## 13) auctions
Nguồn: `Auction`

**PK**: `auction_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| auction_id | BIGINT | PK, identity | |
| listing_id | BIGINT | FK | → `listings.id` |
| version | INTEGER |  | dùng optimistic locking |
| extended_count | INTEGER |  | số lần gia hạn |
| start_time | TIMESTAMP |  | |
| end_time | TIMESTAMP |  | |
| starting_price | NUMERIC(19,2) |  | |
| reserve_price | NUMERIC(19,2) |  | |
| bid_increment | NUMERIC(19,2) |  | |
| current_highest_bid | NUMERIC(19,2) |  | |
| current_highest_bidder_id | BIGINT | FK | → `users.user_id` |
| status | VARCHAR(20) | NOT NULL | enum `AuctionStatus` |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |
| soft_close_enabled | BOOLEAN |  | default Java: `true` |
| soft_close_trigger_seconds | INTEGER |  | |
| soft_close_extend_seconds | INTEGER |  | |

---

## 14) bids
Nguồn: `Bid`

**PK**: `bid_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| bid_id | BIGINT | PK, identity | |
| auction_id | BIGINT | NOT NULL, FK | → `auctions.auction_id` |
| user_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| bid_amount | NUMERIC(19,2) | NOT NULL | |
| bid_time | TIMESTAMP | NOT NULL | set ở `@PrePersist` |

---

## 15) proxy_bids
Nguồn: `ProxyBid`

**PK**: `proxy_bid_id`

**Unique**: (`auction_id`, `user_id`) (constraint name: `uk_proxy_bids_auction_user`)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| proxy_bid_id | BIGINT | PK, identity | |
| auction_id | BIGINT | NOT NULL, FK | → `auctions.auction_id` |
| user_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| max_bid_amount | NUMERIC(19,2) | NOT NULL | |
| is_active | BOOLEAN | NOT NULL | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 16) auction_room_messages
Nguồn: `AuctionRoomMessage`

**PK**: `message_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| message_id | BIGINT | PK, identity | |
| auction_id | BIGINT | NOT NULL, FK | → `auctions.auction_id` |
| sender_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| content | VARCHAR(2000) | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | set ở `@PrePersist` |

---

## 17) auction_results
Nguồn: `AuctionResult`

**PK**: `result_id` (SEQUENCE: `auction_results_result_id_seq`)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| result_id | BIGINT | PK | generate từ sequence |
| auction_id | BIGINT | NOT NULL, UNIQUE, FK | → `auctions.auction_id` |
| result_status | VARCHAR | NOT NULL | enum `AuctionResultStatus` |
| winner_user_id | BIGINT | FK | → `users.user_id` |
| winner_bid_amount | NUMERIC(19,2) |  | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 18) contact_messages
Nguồn: `ContactMessage`

**PK**: `id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| id | BIGINT | PK, identity | |
| user_id | BIGINT |  | không mapping FK (chỉ lưu id) |
| full_name | VARCHAR(150) | NOT NULL | |
| email | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(50) | NOT NULL | |
| message | TEXT | NOT NULL | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |

---

## 19) conversations
Nguồn: `Conversation`

**PK**: `conversation_id`

**Unique**: (`user_one_id`, `user_two_id`)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| conversation_id | BIGINT | PK, identity | |
| user_one_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| user_two_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| last_message | TEXT |  | |
| last_message_at | TIMESTAMP |  | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |
| updated_at | TIMESTAMP |  | set ở `@PrePersist/@PreUpdate` |

---

## 20) messages
Nguồn: `Message`

**PK**: `message_id`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| message_id | BIGINT | PK, identity | |
| conversation_id | BIGINT | NOT NULL, FK | → `conversations.conversation_id` |
| sender_id | BIGINT | NOT NULL, FK | → `users.user_id` |
| content | TEXT | NOT NULL | |
| image_url | VARCHAR |  | |
| message_type | VARCHAR | NOT NULL | enum `MessageType` |
| is_read | BOOLEAN | NOT NULL | default Java: `false` |
| read_at | TIMESTAMP |  | |
| created_at | TIMESTAMP |  | set ở `@PrePersist` |

---

## Ghi chú thêm

- `UserSession` **không phải** bảng DB (không có `@Entity`).
- Một số cột không khai báo `@Column(name=...)` nên **tên cột thực tế** phụ thuộc Hibernate naming strategy; tài liệu này ghi theo quy ước snake_case thường gặp trong Spring/Hibernate.
