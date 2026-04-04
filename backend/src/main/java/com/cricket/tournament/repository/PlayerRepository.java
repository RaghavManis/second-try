package com.cricket.tournament.repository;

import com.cricket.tournament.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    @Query("SELECT p FROM Team t JOIN t.players p WHERE t.id = :teamId")
    List<Player> findByTeamId(@Param("teamId") Long teamId);
}
