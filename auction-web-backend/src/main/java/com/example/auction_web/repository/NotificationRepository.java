package com.example.auction_web.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.auction_web.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
	Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId, Pageable pageable);

	long countByRecipientUserIdAndReadFalse(Long recipientUserId);

	List<Notification> findByIdInAndRecipientUserId(List<Long> ids, Long recipientUserId);

	@Modifying
	@Query("""
		update Notification n
		set n.read = true,
			n.readAt = CURRENT_TIMESTAMP
		where n.recipientUserId = :recipientUserId
		  and n.read = false
	""")
	int markAllAsRead(@Param("recipientUserId") Long recipientUserId);
}
