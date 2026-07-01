package com.example.auction_web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auction_web.entity.Conversation;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUserOne_UserIdAndUserTwo_UserId(Long userOneId, Long userTwoId);

    @Query("""
        select c from Conversation c
        where c.userOne.userId = :userId or c.userTwo.userId = :userId
        order by c.lastMessageAt desc nulls last, c.createdAt desc
    """)
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    @Query("""
        select c from Conversation c
        where c.conversationId = :conversationId
          and (c.userOne.userId = :userId or c.userTwo.userId = :userId)
    """)
    Optional<Conversation> findByIdAndParticipant(@Param("conversationId") Long conversationId,
                                                  @Param("userId") Long userId);
}
