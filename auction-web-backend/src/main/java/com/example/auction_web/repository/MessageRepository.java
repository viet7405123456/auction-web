package com.example.auction_web.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Message;




@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversation_ConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    @Query("""
        select count(m) from Message m
        where m.conversation.conversationId = :conversationId
          and m.sender.userId <> :userId
          and m.isRead = false
    """)
    long countUnreadMessages(@Param("conversationId") Long conversationId,
                             @Param("userId") Long userId);

    @Modifying
    @Query("""
        update Message m
        set m.isRead = true,
            m.readAt = CURRENT_TIMESTAMP
        where m.conversation.conversationId = :conversationId
          and m.sender.userId <> :userId
          and m.isRead = false
    """)
    int markAsRead(@Param("conversationId") Long conversationId,
                   @Param("userId") Long userId);

    @Query("""
        select count(m) from Message m
        where (m.conversation.userOne.userId = :userId or m.conversation.userTwo.userId = :userId)
          and m.sender.userId <> :userId
          and m.isRead = false
    """)
    long countAllUnreadMessages(@Param("userId") Long userId);
}
