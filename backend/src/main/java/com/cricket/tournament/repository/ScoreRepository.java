package com.cricket.tournament.repository;

import com.cricket.tournament.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByMatchId(Long matchId);
    void deleteByMatchId(Long matchId);
}
